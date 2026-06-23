// app/(tabs)/add.tsx
import { useAction, useMutation } from "convex/react";
import { Input, Skeleton, TextField } from "heroui-native";
import { get } from "lodash";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import Image from "@/components/ui/image";
import ScrollView from "@/components/ui/scrollview";
import { api } from "~/convex/_generated/api";

type PreviewData = {
	title: string;
	description?: string;
	image?: string;
};

// crude check so we don't fire a preview fetch on every keystroke of
// something that isn't even a URL yet
function looksLikeUrl(value: string) {
	return /^https?:\/\/.+\..+/i.test(value.trim());
}

const DEBOUNCE_MS = 500;

export default function Add() {
	const [url, setUrl] = useState("");
	const [previewData, setPreviewData] = useState<PreviewData | null>(null);
	const [loadingPreview, setLoadingPreview] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const getPreview = useAction(api.preview.getPreview);
	const createItem = useMutation(api.artifacts.createArtifact);

	// track the most recent request so a slow earlier fetch can't clobber
	// a newer one's result if the user keeps editing the url
	const requestIdRef = useRef(0);

	useEffect(() => {
		const trimmed = url.trim();

		if (!looksLikeUrl(trimmed)) {
			setPreviewData(null);
			setError(null);
			setLoadingPreview(false);
			return;
		}

		const currentRequestId = ++requestIdRef.current;
		setError(null);
		setLoadingPreview(true);

		const timer = setTimeout(async () => {
			try {
				const data = await getPreview({ url: trimmed });
				if (requestIdRef.current !== currentRequestId) return; // stale
				setPreviewData(data);
			} catch (err) {
				if (requestIdRef.current !== currentRequestId) return; // stale
				console.error("Preview fetch failed", err);
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
	}, [url, getPreview]);

	const handleSave = async () => {
		if (!url.trim()) return;
		setSaving(true);
		setError(null);
		try {
			await createItem({
				sourceUrl: url.trim(),
				title: previewData?.title,
				description: previewData?.description,
				image: previewData?.image,
			});
			setUrl("");
			setPreviewData(null);
		} catch (err) {
			console.error("Save failed", err);
			setError(err instanceof Error ? err.message : "Couldn't save this item");
		} finally {
			setSaving(false);
		}
	};

	return (
		<ScrollView
			contentInsetAdjustmentBehavior="automatic"
			contentContainerClassName="px-4"
		>
			<TextField>
				<Input
					placeholder="Paste URL"
					className="shadow-none"
					value={url}
					onChange={(e) => setUrl(e.nativeEvent.text)}
					autoCapitalize="none"
					autoCorrect={false}
				/>
			</TextField>

			{error && <Text className="mt-4 text-destructive">{error}</Text>}

			{loadingPreview && (
				<View className="mt-4 gap-2">
					<Skeleton className="h-48 w-full rounded-xl" />
					<Skeleton className="h-5 w-3/4 rounded-md" />
					<Skeleton className="h-4 w-full rounded-md" />
					<Skeleton className="h-4 w-2/3 rounded-md" />
				</View>
			)}

			{!loadingPreview && previewData && (
				<View className="mt-4 gap-2">
					{previewData.image ? (
						<Image
							source={{ uri: previewData.image }}
							className="h-48 w-full rounded-xl bg-muted"
							contentFit="cover"
						/>
					) : null}
					<Text className="text-lg font-semibold text-foreground">
						{previewData.title}
					</Text>
					{previewData.description ? (
						<Text className="text-muted-foreground" numberOfLines={3}>
							{previewData.description}
						</Text>
					) : null}
				</View>
			)}

			{url.trim().length > 0 && (
				<Button
					className="mt-4"
					isDisabled={saving || loadingPreview || !url.trim()}
					onPress={handleSave}
				>
					{saving ? "Saving..." : "Save"}
				</Button>
			)}
		</ScrollView>
	);
}
