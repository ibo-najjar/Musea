// app/(tabs)/add.tsx
import { useAction, useMutation, useQuery } from "convex/react";
import * as Clipboard from "expo-clipboard";
import {
	Stack,
	useFocusEffect,
	useLocalSearchParams,
	useRouter,
} from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { Card, Input, Skeleton, TextField, Typography } from "heroui-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import ModalCloseButton from "@/components/layout/modal-close-button";
import { Button } from "@/components/ui/button";
import Image from "@/components/ui/image";
import ScrollView from "@/components/ui/scrollview";
import { api } from "~/convex/_generated/api";

type PreviewData = {
	title: string;
	description?: string;
	image?: string;
	videoUrl?: string;
};

type TextSize = "sm" | "md" | "lg" | "xl";
type TextWeight = "normal" | "medium" | "semibold" | "bold";

const TEXT_SIZES: TextSize[] = ["sm", "md", "lg", "xl"];
const TEXT_WEIGHTS: TextWeight[] = ["normal", "medium", "semibold", "bold"];

const TEXT_SIZE_TYPE = {
	sm: "body-xs",
	md: "body-sm",
	lg: "body",
	xl: "h4",
} as const;

function looksLikeUrl(value: string) {
	return /^https?:\/\/.+\..+/i.test(value.trim());
}

const DEBOUNCE_MS = 500;

export default function Add() {
	const { sharedUrl } = useLocalSearchParams<{ sharedUrl?: string }>();
	const [input, setInput] = useState(sharedUrl ?? "");
	const [previewData, setPreviewData] = useState<PreviewData | null>(null);
	const [urlToCheck, setUrlToCheck] = useState<string | null>(null);
	const [duplicateDismissed, setDuplicateDismissed] = useState(false);
	const [loadingPreview, setLoadingPreview] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [textSize, setTextSize] = useState<TextSize>("md");
	const [textWeight, setTextWeight] = useState<TextWeight>("normal");

	const router = useRouter();
	const { resetShareIntent } = useShareIntentContext();
	const getPreview = useAction(api.preview.getPreview);
	const createItem = useMutation(api.artifacts.createArtifact);
	const duplicate = useQuery(
		api.artifacts.findArtifactByUrl,
		urlToCheck ? { sourceUrl: urlToCheck } : "skip",
	);

	const requestIdRef = useRef(0);
	const isUrl = looksLikeUrl(input);
	const isText = input.trim().length > 0 && !isUrl;

	// Auto-fill from clipboard when the screen comes into focus (skip if opened from share)
	useFocusEffect(
		useCallback(() => {
			if (sharedUrl) return;

			Clipboard.getStringAsync().then((text) => {
				if (text.trim()) setInput(text.trim());
			});

			const sub = Clipboard.addClipboardListener(async () => {
				const text = await Clipboard.getStringAsync();
				if (text.trim()) setInput(text.trim());
			});

			return () => sub.remove();
		}, [sharedUrl]),
	);

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
		if (!input.trim()) return;
		setSaving(true);
		setError(null);
		try {
			if (isText) {
				await createItem({
					text: input.trim(),
					textSize,
					textWeight,
					title: input.trim().slice(0, 80),
				});
			} else {
				await createItem({
					sourceUrl: input.trim(),
					title: previewData?.title,
					description: previewData?.description,
					image: previewData?.image,
					videoUrl: previewData?.videoUrl,
				});
			}
			setInput("");
			setPreviewData(null);
			setUrlToCheck(null);
			if (sharedUrl) resetShareIntent();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Couldn't save this item");
		} finally {
			setSaving(false);
			if (router.canDismiss()) {
				router.dismiss();
			}
		}
	};

	return (
		<>
			<Stack.Screen
				options={{
					unstable_sheetFooter: () => (
						<View className="absolute bottom-0 w-full p-4">
							<Button
								isDisabled={saving || loadingPreview || !input.trim()}
								onPress={handleSave}
								className={"w-full"}
							>
								{saving ? "Saving..." : isText ? "Save as text" : "Save"}
							</Button>
						</View>
					),
				}}
			/>
			<ModalCloseButton />
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				contentContainerClassName="px-4 pb-20"
				className="flex-1"
				keyboardShouldPersistTaps="handled"
			>
				<TextField>
					<Input
						placeholder="Paste URL or type text"
						className="shadow-none"
						value={input}
						onChange={(e) => setInput(e.nativeEvent.text)}
						autoCapitalize="none"
						autoCorrect={false}
						// multiline
					/>
				</TextField>

				{error && <Text className="mt-4 text-destructive">{error}</Text>}

				{isUrl && duplicate && !duplicateDismissed && (
					<Card className="mt-4">
						<Card.Body className="gap-3">
							<View className="flex-row items-center gap-3">
								{duplicate.image ? (
									<Image
										source={{ uri: duplicate.image }}
										className="size-12 rounded-lg bg-surface-tertiary"
										contentFit="cover"
									/>
								) : null}
								<View className="flex-1">
									<Text className="font-semibold text-foreground">
										Already saved
									</Text>
									<Text className="text-muted-foreground" numberOfLines={1}>
										{duplicate.title}
									</Text>
								</View>
							</View>
							<View className="flex-row gap-2">
								<Button
									size="sm"
									isGlass
									variant="tertiary"
									className="flex-1"
									onPress={() =>
										router.push({
											pathname: "/(app)/(modal)/artifact/[artifactId]",
											params: { artifactId: duplicate._id },
										})
									}
								>
									View
								</Button>
								<Button
									size="sm"
									isGlass
									variant="danger"
									className="flex-1"
									onPress={() => setDuplicateDismissed(true)}
								>
									Save anyway
								</Button>
							</View>
						</Card.Body>
					</Card>
				)}

				{isText && (
					<View className="mt-4 gap-3">
						<View className="flex-row gap-2">
							{TEXT_SIZES.map((size) => (
								<Button
									key={size}
									size="sm"
									isGlass
									variant={textSize === size ? "primary" : "ghost"}
									onPress={() => setTextSize(size)}
								>
									{size.toUpperCase()}
								</Button>
							))}
						</View>
						<View className="flex-row gap-2">
							{TEXT_WEIGHTS.map((weight) => (
								<Button
									key={weight}
									size="sm"
									isGlass
									variant={textWeight === weight ? "primary" : "ghost"}
									onPress={() => setTextWeight(weight)}
								>
									{weight.charAt(0).toUpperCase() + weight.slice(1)}
								</Button>
							))}
						</View>
						<Card className="mx-10">
							<Card.Body>
								<Typography
									type={TEXT_SIZE_TYPE[textSize]}
									weight={textWeight}
									color="muted"
									numberOfLines={3}
								>
									{input}
								</Typography>
							</Card.Body>
						</Card>
					</View>
				)}

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
								className="w-full rounded-xl bg-surface-tertiary"
								contentFit="contain"
								style={{
									height: "100%",
									width: "100%",
								}}
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
			</ScrollView>
		</>
	);
}
