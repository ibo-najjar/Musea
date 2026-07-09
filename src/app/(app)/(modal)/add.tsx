// app/(tabs)/add.tsx
import { useAction, useMutation, useQuery } from "convex/react";
import * as Clipboard from "expo-clipboard";
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import type { VideoPlayer } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { MediaPreview } from "@/components/add/media-preview";
import { NoteEditor } from "@/components/add/note-editor";
import { QuickActions } from "@/components/add/quick-actions";
import { SaveBar } from "@/components/add/save-bar";
import {
	type AddMode,
	looksLikeUrl,
	looksLikeUrlPrefix,
	type PickedMedia,
	type PreviewData,
} from "@/components/add/types";
import { UrlPreview } from "@/components/add/url-preview";
import ModalCloseButton from "@/components/layout/modal-close-button";
import ScrollView from "@/components/ui/scrollview";
import { authClient } from "@/lib/auth-client";
import { setLastSavedArtifact } from "@/lib/last-saved";
import { useAppToast } from "@/lib/toast";
import { api } from "~/convex/_generated/api";

const DEBOUNCE_MS = 500;
const NOTE_DEBOUNCE_MS = 400;

export default function Add() {
	const { sharedUrl } = useLocalSearchParams<{ sharedUrl?: string }>();
	const [input, setInput] = useState(sharedUrl ?? "");
	const [previewData, setPreviewData] = useState<PreviewData | null>(null);
	const [urlToCheck, setUrlToCheck] = useState<string | null>(null);
	const [duplicateDismissed, setDuplicateDismissed] = useState(false);
	const [loadingPreview, setLoadingPreview] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [media, setMedia] = useState<PickedMedia | null>(null);
	const [noteActive, setNoteActive] = useState(false);
	const [noteTitle, setNoteTitle] = useState("");
	const [noteContent, setNoteContent] = useState("");
	const [noteAutoFocus, setNoteAutoFocus] = useState<"title" | "content">(
		"content",
	);

	const router = useRouter();
	const toast = useAppToast();
	const { resetShareIntent } = useShareIntentContext();
	const { data: session } = authClient.useSession();
	const getPreview = useAction(api.preview.getPreview);
	const createItem = useMutation(api.artifacts.createArtifact);
	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const saveFile = useMutation(api.files.saveFile);
	const duplicate = useQuery(
		api.artifacts.findArtifactByUrl,
		urlToCheck ? { sourceUrl: urlToCheck } : "skip",
	);

	const requestIdRef = useRef(0);
	const videoPlayerRef = useRef<VideoPlayer | null>(null);
	const uploadPromiseRef = useRef<Promise<{ url: string }> | null>(null);
	const isUrl = looksLikeUrl(input);

	const mode: AddMode = media
		? "media"
		: noteActive
			? "note"
			: isUrl
				? "url"
				: "idle";

	const startNote = () => {
		setInput("");
		setNoteAutoFocus("title");
		setNoteActive(true);
	};

	const clearAll = () => {
		setMedia(null);
		setNoteActive(false);
		setNoteTitle("");
		setNoteContent("");
		setInput("");
		uploadPromiseRef.current = null;
	};

	// Downscales images (max ~1600px edge) so the upload is smaller/faster;
	// videos are uploaded as-is. Runs immediately on pick so by the time the
	// user taps Save, the upload has usually already finished.
	const uploadMedia = async (asset: PickedMedia): Promise<{ url: string }> => {
		let uri = asset.uri;
		let mimeType = asset.mimeType;

		const maxEdge = 1600;
		if (
			asset.type === "image" &&
			asset.width &&
			asset.height &&
			Math.max(asset.width, asset.height) > maxEdge
		) {
			const resized =
				asset.width >= asset.height ? { width: maxEdge } : { height: maxEdge };
			const rendered = await ImageManipulator.manipulate(asset.uri)
				.resize(resized)
				.renderAsync();
			const result = await rendered.saveAsync({
				compress: 0.7,
				format: SaveFormat.JPEG,
			});
			uri = result.uri;
			mimeType = "image/jpeg";
		}

		const uploadUrl = await generateUploadUrl();
		const file = new File(uri);
		const uploadResult = await file.upload(uploadUrl, {
			httpMethod: "POST",
			uploadType: 0, // UploadType.BINARY_CONTENT
			headers: {
				"Content-Type":
					mimeType ?? (asset.type === "video" ? "video/mp4" : "image/jpeg"),
			},
		});
		const { storageId } = JSON.parse(uploadResult.body);
		if (!session?.user.id) throw new Error("Must be logged in to upload");
		const url = await saveFile({
			storageId,
			userId: session.user.id,
			format: asset.type,
		});
		if (!url) throw new Error("Couldn't upload file");
		return { url };
	};

	const pickMedia = async (source: "library" | "camera") => {
		const { status } =
			source === "library"
				? await ImagePicker.requestMediaLibraryPermissionsAsync()
				: await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			toast.error(
				source === "library"
					? "Photo library access is required"
					: "Camera access is required",
			);
			return;
		}

		const options: ImagePicker.ImagePickerOptions = {
			mediaTypes: ["images", "videos"],
			quality: 0.8,
		};
		const result =
			source === "library"
				? await ImagePicker.launchImageLibraryAsync(options)
				: await ImagePicker.launchCameraAsync(options);
		if (result.canceled) return;
		const asset = result.assets[0];
		const picked: PickedMedia = {
			uri: asset.uri,
			type: asset.type === "video" ? "video" : "image",
			mimeType: asset.mimeType,
			width: asset.width,
			height: asset.height,
		};
		setInput("");
		setMedia(picked);
		const promise = uploadMedia(picked);
		// Swallow here so an upload that's abandoned (removed before Save) doesn't
		// surface as an unhandled rejection; handleSave awaits the same promise
		// via the ref and reports failures there.
		promise.catch(() => {});
		uploadPromiseRef.current = promise;
	};

	// Auto-fill from clipboard when the screen comes into focus (URLs only;
	// skip if opened from share).
	useFocusEffect(
		useCallback(() => {
			if (sharedUrl) return;

			Clipboard.getStringAsync().then((text) => {
				if (looksLikeUrl(text)) setInput(text.trim());
			});

			const sub = Clipboard.addClipboardListener(async () => {
				const text = await Clipboard.getStringAsync();
				if (looksLikeUrl(text)) setInput(text.trim());
			});

			return () => sub.remove();
		}, [sharedUrl]),
	);

	// Non-URL typing flips into note mode: move the typed text into the note
	// content. Debounced + prefix-guarded so a hand-typed URL doesn't trigger it.
	useEffect(() => {
		const trimmed = input.trim();
		if (!trimmed || looksLikeUrl(trimmed) || looksLikeUrlPrefix(trimmed))
			return;

		const timer = setTimeout(() => {
			setNoteContent(trimmed);
			setNoteAutoFocus("content");
			setNoteActive(true);
			setInput("");
		}, NOTE_DEBOUNCE_MS);

		return () => clearTimeout(timer);
	}, [input]);

	useEffect(() => {
		const trimmed = input.trim();

		if (!looksLikeUrl(trimmed)) {
			setPreviewData(null);
			setError(null);
			setLoadingPreview(false);
			setUrlToCheck(null);
			return;
		}

		const currentRequestId = ++requestIdRef.current;
		setError(null);
		setLoadingPreview(true);
		setDuplicateDismissed(false);

		const timer = setTimeout(async () => {
			setUrlToCheck(trimmed);
			try {
				const data = await getPreview({ url: trimmed });
				if (requestIdRef.current !== currentRequestId) return;
				setPreviewData(data);
			} catch (err) {
				if (requestIdRef.current !== currentRequestId) return;
				setError(
					err instanceof Error
						? err.message
						: "Couldn't load a preview for this URL",
				);
				setPreviewData(null);
			} finally {
				if (requestIdRef.current === currentRequestId) {
					setLoadingPreview(false);
				}
			}
		}, DEBOUNCE_MS);

		return () => clearTimeout(timer);
	}, [input, getPreview]);

	const handleSave = async () => {
		// Stop playback up front: once saving starts the sheet is on its way out,
		// and the async work races the modal dismiss, so the blur pause isn't
		// guaranteed to fire while the player is still alive.
		try {
			videoPlayerRef.current?.pause();
		} catch {}
		setSaving(true);
		setError(null);
		try {
			let savedId: Awaited<ReturnType<typeof createItem>>;
			if (media) {
				// Upload was kicked off at pick time (see pickMedia), so this is
				// usually already resolved by the time Save is tapped.
				const { url } = await (uploadPromiseRef.current ?? uploadMedia(media));
				savedId = await createItem(
					media.type === "video"
						? { videoUrl: url, origin: "gallery" }
						: { image: url, origin: "gallery" },
				);
			} else if (noteActive) {
				savedId = await createItem({
					// text: noteContent.trim(),
					title: noteTitle.trim() || undefined,
					description: noteContent.trim(),
					origin: "richtext",
				});
			} else {
				// The server scrapes and stores OG metadata itself during
				// enrichment, so it's the source of truth even if the client's
				// preview hasn't loaded (or failed) yet — see convex/ai.ts.
				savedId = await createItem({ sourceUrl: input.trim() });
			}
			// Hand the new id to the root watcher so it can show "Filed in ___"
			// once auto-organization files it (this sheet is about to dismiss).
			setLastSavedArtifact(savedId);
			clearAll();
			setPreviewData(null);
			setUrlToCheck(null);
			if (sharedUrl) resetShareIntent();
			toast.success("Saved");
			if (router.canDismiss()) {
				router.dismiss();
			}
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Couldn't save this item";
			setError(message);
			toast.error("Couldn't save this item", message);
		} finally {
			setSaving(false);
		}
	};

	const handleRemove = () => {
		if (media) {
			// Pause while the player is still mounted; unmount releases it first.
			try {
				videoPlayerRef.current?.pause();
			} catch {}
			setMedia(null);
			uploadPromiseRef.current = null;
			return;
		}
		clearAll();
	};

	const showInput = mode === "idle" || mode === "url";
	const disabled =
		saving ||
		(mode === "note"
			? !noteContent.trim() && !noteTitle.trim()
			: mode === "media"
				? false
				: !input.trim());

	return (
		<>
			<ModalCloseButton />
			<View className="flex-1">
				<ScrollView
					contentInsetAdjustmentBehavior="automatic"
					contentContainerClassName="px-4 pb-20"
					className="flex-1"
					keyboardShouldPersistTaps="handled"
				>
					{mode === "idle" && (
						<QuickActions onPickMedia={pickMedia} onStartNote={startNote} />
					)}

					{mode === "media" && media && (
						<MediaPreview media={media} playerRef={videoPlayerRef} />
					)}

					{mode === "note" && (
						<NoteEditor
							title={noteTitle}
							content={noteContent}
							onChangeTitle={setNoteTitle}
							onChangeContent={setNoteContent}
							autoFocusField={noteAutoFocus}
						/>
					)}

					{error && <Text className="mt-4 text-destructive">{error}</Text>}

					{mode === "url" && (
						<UrlPreview
							loading={loadingPreview}
							preview={previewData}
							duplicate={duplicate && !duplicateDismissed ? duplicate : null}
							onViewDuplicate={() =>
								duplicate &&
								router.push({
									pathname: "/(app)/(modal)/artifact/[artifactId]",
									params: { artifactId: duplicate._id },
								})
							}
							onSaveAnyway={() => setDuplicateDismissed(true)}
						/>
					)}
				</ScrollView>
				<SaveBar
					showInput={showInput}
					input={input}
					onChangeInput={setInput}
					onClearInput={() => setInput("")}
					onSave={handleSave}
					onRemove={handleRemove}
					saving={saving}
					disabled={disabled}
				/>
			</View>
		</>
	);
}
