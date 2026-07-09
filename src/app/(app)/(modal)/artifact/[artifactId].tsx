import { Zoomable } from "@likashefqet/react-native-image-zoom";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { useEvent } from "expo";
import * as Linking from "expo-linking";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { SymbolView } from "expo-symbols";
import { useVideoPlayer, VideoView } from "expo-video";
import * as WebBrowser from "expo-web-browser";
import {
	Card,
	Skeleton,
	SkeletonGroup,
	Spinner,
	Typography,
	useThemeColor,
} from "heroui-native";
import { useState } from "react";
import { Alert, Pressable, useWindowDimensions, View } from "react-native";
import ModalCloseButton from "@/components/layout/modal-close-button";
import { SelectedGalleriesStack } from "@/components/selected-gallery-stack";
import { GlassView } from "@/components/ui/apple-glass-view";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import Image from "@/components/ui/image";
import ScrollView from "@/components/ui/scrollview";
import { Text } from "@/components/ui/text";
import { TouchableGlass } from "@/components/ui/touchable-glass";
import { isSourceDirectable, SOURCE_ICONS, SOURCE_LABELS } from "@/lib/sources";
import { api } from "~/convex/_generated/api";
import type { Id } from "~/convex/_generated/dataModel";
import { SourceType } from "~/convex/lib/sourceType";

const TEXT_SIZE_TYPE = {
	sm: "body-xs",
	md: "body-sm",
	lg: "body",
	xl: "h4",
} as const;

const OVERLAP = 10;
const MAX_VISIBLE = 5;
const SIZE = 36;
const HORIZONTAL_MARGIN = 40; // matches container's mx-10

function containSize(
	natural: { width: number; height: number },
	maxWidth: number,
	maxHeight: number,
) {
	const ratio = Math.min(
		maxWidth / natural.width,
		maxHeight / natural.height,
		1,
	);
	return { width: natural.width * ratio, height: natural.height * ratio };
}

function getGalleryStackWidth(count: number, size: number, overlap: number) {
	const visible = Math.min(count, MAX_VISIBLE);

	if (visible === 0) return 0;

	let width = size + (visible - 1) * (size - overlap);

	if (count > MAX_VISIBLE) {
		width += size - overlap; // +N card
	}

	return width;
}

export default function ItemModal() {
	const {
		artifactId,
		image: localImage,
		title: localTitle,
		sourceType: localSourceType,
	} = useLocalSearchParams<{
		artifactId: string;
		image?: string;
		title?: string;
		sourceType?: SourceType;
	}>();

	const artifact = useQuery(api.artifacts.getArtifactById, {
		artificatId: artifactId as Id<"artificats">,
	});

	const artifactGalleries = useQuery(
		api.galleryArtifacts.listGalleriesForArtifact,

		artifactId ? { artificatId: artifactId as Id<"artificats"> } : "skip",
	);

	const router = useRouter();

	const { width, height } = useWindowDimensions();
	const bannerMaxHeight = height * 0.4;
	const bannerMaxWidth = width - HORIZONTAL_MARGIN * 2;

	const foreground = useThemeColor("foreground");
	const muted = useThemeColor("muted");

	console.log(
		"item",
		artifact ? { ...artifact, embedding: undefined } : artifact,
	);

	const sourceIcon = localSourceType
		? SOURCE_ICONS[localSourceType]
		: undefined;

	const galleryCount = artifactGalleries?.length ?? 0;

	if (artifact === null) {
		return (
			<>
				<ModalCloseButton />
				<View className="flex-1 items-center justify-center bg-background">
					<EmptyState
						title="Artifact not found"
						description="The artificat you're looking for doesn't exist."
						className="px-8"
					/>
				</View>
			</>
		);
	}

	const imageUri = artifact?.image ?? localImage;
	const videoUrl = artifact?.videoUrl;

	return (
		<>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.View>
					<Pressable
						style={{
							width: getGalleryStackWidth(galleryCount, SIZE, OVERLAP) + 16, // padding buffer
							height: 32,
						}}
						className="flex-row items-center justify-center px-2"
						onPress={() => {
							router.push({
								pathname: "/(app)/(modal)/artifact-galleries/[artifactId]",
								params: { artifactId },
							});
						}}
					>
						<View className="flex-row items-center gap-1">
							{galleryCount === 0 ? (
								<SymbolView
									name={"bookmark.fill"}
									size={20}
									tintColor={foreground}
								/>
							) : (
								<SelectedGalleriesStack
									galleries={artifactGalleries}
									SIZE={SIZE}
								/>
							)}
						</View>
					</Pressable>
				</Stack.Toolbar.View>
				<Stack.Toolbar.Spacer />
				<Stack.Toolbar.Button
					icon={"square.and.arrow.up"}
					onPress={async () => {
						if (artifact?.image) {
							try {
								await Sharing.shareAsync(artifact?.image ?? "");
							} catch (error) {
								Alert.alert("Error", "Unable to share the image.");
							}
						}
					}}
				/>
			</Stack.Toolbar>
			<Stack.Toolbar placement="left">
				<Stack.Toolbar.Button icon={"xmark"} onPress={() => router.back()} />
			</Stack.Toolbar>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Menu icon={"ellipsis"}>
					<Stack.Toolbar.MenuAction icon={"arrow.down"}>
						Download
					</Stack.Toolbar.MenuAction>
					<Stack.Toolbar.MenuAction
						icon={"text.below.photo.fill"}
						onPress={() => {
							router.push({
								pathname: "/(app)/(modal)/artifact-details/[artifactId]",
								params: { artifactId },
							});
						}}
					>
						Show Description
					</Stack.Toolbar.MenuAction>
					<Stack.Toolbar.MenuAction icon={"trash"} destructive>
						Remove
					</Stack.Toolbar.MenuAction>
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>

			<ScrollView
				contentContainerClassName="bg-background"
				showsVerticalScrollIndicator={false}
				contentInsetAdjustmentBehavior="automatic"
			>
				<View className="z-50 mx-10 items-center justify-center">
					{localSourceType !== "richtext" && (
						<ArtifactMedia
							imageUri={imageUri}
							videoUrl={videoUrl}
							maxWidth={bannerMaxWidth}
							maxHeight={bannerMaxHeight}
						/>
					)}
				</View>
				<View className="mt-5 px-4">
					<Typography type="h1" weight="bold">
						{localTitle ?? artifact?.title}
					</Typography>
					<Button
						isGlass
						size="sm"
						className="mt-2 w-fit gap-3 self-start"
						variant="secondary"
						onPress={() => {
							if (isSourceDirectable(localSourceType)) {
								Linking.openURL(artifact?.source ?? "");
							}
						}}
					>
						<Image
							source={sourceIcon}
							className="size-7 rounded-lg"
							cachePolicy={"disk"}
						/>

						<Text>
							From {localSourceType ? SOURCE_LABELS[localSourceType] : "Link"}
						</Text>

						{isSourceDirectable(localSourceType) && (
							<SymbolView name="arrow.up.right" size={16} tintColor={muted} />
						)}
					</Button>
					<SkeletonGroup isLoading={artifact === undefined} className="mt-2">
						<SkeletonGroup.Item className="h-4 w-full rounded-lg">
							<Typography.Paragraph type="body-sm">
								{artifact?.description}
							</Typography.Paragraph>
						</SkeletonGroup.Item>
						<SkeletonGroup.Item className="h-4 w-1/2 rounded-lg mt-2" />
						<SkeletonGroup.Item className="mt-2 h-4 w-24 rounded-lg">
							<Typography.Paragraph type="body-xs" className="opacity-60">
								{artifact?._creationTime
									? formatDistanceToNow(artifact._creationTime, {
											addSuffix: true,
										})
									: ""}
							</Typography.Paragraph>
						</SkeletonGroup.Item>
					</SkeletonGroup>
				</View>
			</ScrollView>
		</>
	);
}

function isDirectVideoUrl(url: string) {
	return /\.(mp4|m4v|mov|m3u8|webm)(\?|$)/i.test(url);
}

type ArtifactMediaProps = {
	text?: string;
	textSize?: "sm" | "md" | "lg" | "xl";
	textWeight?: "normal" | "medium" | "semibold" | "bold";
	imageUri?: string;
	videoUrl?: string;
	maxWidth: number;
	maxHeight: number;
};

function ArtifactMedia({
	imageUri,
	videoUrl,
	maxWidth,
	maxHeight,
}: ArtifactMediaProps) {
	if (videoUrl) {
		return (
			<ArtifactVideoPlayer
				videoUrl={videoUrl}
				thumbnailUrl={imageUri}
				maxWidth={maxWidth}
				maxHeight={maxHeight}
			/>
		);
	}
	return (
		<ArtifactImage
			uri={imageUri ?? ""}
			maxWidth={maxWidth}
			maxHeight={maxHeight}
		/>
	);
}

function ArtifactImage({
	uri,
	maxWidth,
	maxHeight,
}: {
	uri: string;
	maxWidth: number;
	maxHeight: number;
}) {
	const [naturalSize, setNaturalSize] = useState<{
		width: number;
		height: number;
	} | null>(null);

	const { width, height } = naturalSize
		? containSize(naturalSize, maxWidth, maxHeight)
		: { width: maxWidth, height: maxHeight };

	return (
		<Zoomable style={{ width, height }} minScale={1} maxScale={3}>
			<Image
				source={{ uri }}
				style={{ width, height, borderRadius: 24 }}
				contentFit="contain"
				cachePolicy="memory-disk"
				onLoad={(event) => {
					const { width: w, height: h } = event.source;
					setNaturalSize({ width: w, height: h });
				}}
			/>
		</Zoomable>
	);
}

function InlineVideoPlayer({
	videoUrl,
	thumbnailUrl,
	maxWidth,
	maxHeight,
}: {
	videoUrl: string;
	thumbnailUrl?: string;
	maxWidth: number;
	maxHeight: number;
}) {
	const player = useVideoPlayer(videoUrl, (p) => {
		p.loop = false;
	});
	const { status } = useEvent(player, "statusChange", {
		status: player.status,
	});
	const ready = status === "readyToPlay";

	const track = player.videoTrack;
	const { width, height } = track
		? containSize(track.size, maxWidth, maxHeight)
		: { width: maxWidth, height: maxHeight };

	return (
		<View style={{ width, height }}>
			<VideoView
				player={player}
				style={{ width, height, borderRadius: 24 }}
				fullscreenOptions={{ enable: true }}
				allowsPictureInPicture
				contentFit="contain"
			/>
			{!ready && thumbnailUrl && (
				<Image
					source={{ uri: thumbnailUrl }}
					style={{ width, height, position: "absolute" }}
					contentFit="contain"
				/>
			)}
		</View>
	);
}

function EmbedVideoPlayer({
	videoUrl,
	thumbnailUrl,
	maxWidth,
	maxHeight,
}: {
	videoUrl: string;
	thumbnailUrl?: string;
	maxWidth: number;
	maxHeight: number;
}) {
	const [naturalSize, setNaturalSize] = useState<{
		width: number;
		height: number;
	} | null>(null);

	const { width, height } = naturalSize
		? containSize(naturalSize, maxWidth, maxHeight)
		: { width: maxWidth, height: maxHeight };

	return (
		<Pressable
			className="items-center justify-center"
			style={{ width, height }}
			onPress={() => WebBrowser.openBrowserAsync(videoUrl)}
		>
			<Image
				source={{ uri: thumbnailUrl }}
				style={{ width, height }}
				contentFit="contain"
				onLoad={(event) => {
					const { width: w, height: h } = event.source;
					setNaturalSize({ width: w, height: h });
				}}
			/>
			<View className="absolute items-center justify-center">
				<View className="rounded-full bg-black/60 p-5">
					<SymbolView name="play.fill" size={40} tintColor="white" />
				</View>
			</View>
		</Pressable>
	);
}

function ArtifactVideoPlayer({
	videoUrl,
	thumbnailUrl,
	maxWidth,
	maxHeight,
}: {
	videoUrl: string;
	thumbnailUrl?: string;
	maxWidth: number;
	maxHeight: number;
}) {
	if (isDirectVideoUrl(videoUrl)) {
		return (
			<InlineVideoPlayer
				videoUrl={videoUrl}
				thumbnailUrl={thumbnailUrl}
				maxWidth={maxWidth}
				maxHeight={maxHeight}
			/>
		);
	}
	return (
		<EmbedVideoPlayer
			videoUrl={videoUrl}
			thumbnailUrl={thumbnailUrl}
			maxWidth={maxWidth}
			maxHeight={maxHeight}
		/>
	);
}

const GridBoard = ({
	itemThumbnail,
}: {
	itemThumbnail: string | undefined;
}) => {
	return (
		<View className="aspect-square size-9 w-full flex-row gap-0.5 overflow-hidden rounded-sm bg-surface">
			{/* Left: first image spans full height */}
			<View className="h-full flex-1">
				<Image
					source={{ uri: itemThumbnail }}
					contentFit="cover"
					style={{ flex: 1 }}
				/>
			</View>

			{/* Right: second and third stacked */}
			<View className="h-full flex-1 gap-0.5">
				<View className="flex-1">
					<Image
						source={{ uri: itemThumbnail }}
						contentFit="cover"
						style={{ flex: 1 }}
					/>
				</View>
				<View className="flex-1">
					<Image
						source={{ uri: itemThumbnail }}
						contentFit="cover"
						style={{ flex: 1 }}
					/>
				</View>
			</View>
		</View>
	);
};
