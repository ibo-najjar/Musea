import { ImageZoom } from "@likashefqet/react-native-image-zoom";
import { useMutation, useQuery } from "convex/react";
import { useEvent } from "expo";
import * as Linking from "expo-linking";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { SymbolView } from "expo-symbols";
import { useVideoPlayer, VideoView } from "expo-video";
import * as WebBrowser from "expo-web-browser";
import { Card, Typography, useThemeColor } from "heroui-native";
import {
	Alert,
	Pressable,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import ModalCloseButton from "@/components/layout/modal-close-button";
import { SelectedGalleriesStack } from "@/components/selected-gallery-stack";
import { SourceIcon } from "@/components/source-icon";
import EmptyState from "@/components/ui/empty-state";
import Image from "@/components/ui/image";
import ScrollView from "@/components/ui/scrollview";
import { getSourceFromUrl } from "@/lib/sources";
import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";

const TEXT_SIZE_TYPE = {
	sm: "body-xs",
	md: "body-sm",
	lg: "body",
	xl: "h4",
} as const;

const OVERLAP = 10;
const MAX_VISIBLE = 5;
const SIZE = 36;

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
	} = useLocalSearchParams<{
		artifactId: string;
		image?: string;
		title?: string;
	}>();

	const artifact = useQuery(api.artifacts.getArtifactById, {
		artificatId: artifactId as Id<"artificats">,
	});

	const artifactGalleries = useQuery(
		api.galleryArtifacts.listGalleriesForArtifact,

		artifactId ? { artificatId: artifactId as Id<"artificats"> } : "skip",
	);

	const router = useRouter();

	const { width } = useWindowDimensions();

	const foreground = useThemeColor("foreground");

	console.log(
		"item",
		artifact ? { ...artifact, embedding: undefined } : artifact,
	);

	const source = getSourceFromUrl(artifact?.source);

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
			<Stack.Screen options={{ title: localTitle }} />
			{artifact && (
				<>
					<Stack.Toolbar placement="bottom">
						<Stack.Toolbar.View>
							<Pressable
								style={{
									width: 32,
									height: 32,
								}}
								className="justify-center px-2 flex-row items-center"
								onPress={() => {
									if (artifact.source) {
										Linking.openURL(artifact.source);
									}
								}}
							>
								<SourceIcon
									svgPath={source.svgPath}
									color={source.color}
									size={24}
								/>
							</Pressable>
						</Stack.Toolbar.View>
						<Stack.Toolbar.Spacer />
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
											name={"photo.stack.fill"}
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
								if (artifact.image) {
									try {
										await Sharing.shareAsync(artifact.image);
									} catch (error) {
										Alert.alert("Error", "Unable to share the image.");
									}
								}
							}}
						/>
					</Stack.Toolbar>
					<Stack.Toolbar placement="left">
						<Stack.Toolbar.Button
							icon={"xmark"}
							onPress={() => router.back()}
						/>
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
				</>
			)}
			<View className="flex-1 justify-center items-center bg-background">
				{artifact?.text && !imageUri && !videoUrl ? (
					<Card className="mx-10">
						<Card.Body>
							<Typography
								type={TEXT_SIZE_TYPE[artifact.textSize ?? "md"]}
								weight={artifact.textWeight ?? "normal"}
							>
								{artifact.text}
							</Typography>
						</Card.Body>
					</Card>
				) : videoUrl ? (
					<ArtifactVideoPlayer videoUrl={videoUrl} thumbnailUrl={imageUri} />
				) : (
					<ImageZoom
						uri={imageUri ?? ""}
						style={{ height: "100%", width: "100%" }}
						imageWidth={400}
						imageHeight={400}
						minScale={1}
						maxScale={3}
					/>
				)}
			</View>
		</>
	);
}

function isDirectVideoUrl(url: string) {
	return /\.(mp4|m4v|mov|m3u8|webm)(\?|$)/i.test(url);
}

function InlineVideoPlayer({
	videoUrl,
	thumbnailUrl,
}: {
	videoUrl: string;
	thumbnailUrl?: string;
}) {
	const { width, height } = useWindowDimensions();
	const player = useVideoPlayer(videoUrl, (p) => {
		p.loop = false;
	});
	const { status } = useEvent(player, "statusChange", {
		status: player.status,
	});
	const ready = status === "readyToPlay";

	return (
		<View style={{ width, height }}>
			<VideoView
				player={player}
				style={{ width, height }}
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
}: {
	videoUrl: string;
	thumbnailUrl?: string;
}) {
	const { width, height } = useWindowDimensions();

	return (
		<Pressable
			className="flex-1 w-full items-center justify-center"
			onPress={() => WebBrowser.openBrowserAsync(videoUrl)}
		>
			<Image
				source={{ uri: thumbnailUrl }}
				style={{ width, height: height * 0.6 }}
				contentFit="contain"
			/>
			<View className="absolute items-center justify-center">
				<View className="bg-black/60 rounded-full p-5">
					<SymbolView name="play.fill" size={40} tintColor="white" />
				</View>
			</View>
		</Pressable>
	);
}

function ArtifactVideoPlayer({
	videoUrl,
	thumbnailUrl,
}: {
	videoUrl: string;
	thumbnailUrl?: string;
}) {
	if (isDirectVideoUrl(videoUrl)) {
		return (
			<InlineVideoPlayer videoUrl={videoUrl} thumbnailUrl={thumbnailUrl} />
		);
	}
	return <EmbedVideoPlayer videoUrl={videoUrl} thumbnailUrl={thumbnailUrl} />;
}

const GridBoard = ({
	itemThumbnail,
}: {
	itemThumbnail: string | undefined;
}) => {
	return (
		<View className="w-full aspect-square rounded-sm overflow-hidden flex-row gap-0.5 bg-surface size-9">
			{/* Left: first image spans full height */}
			<View className="flex-1 h-full">
				<Image
					source={{ uri: itemThumbnail }}
					contentFit="cover"
					style={{ flex: 1 }}
				/>
			</View>

			{/* Right: second and third stacked */}
			<View className="flex-1 h-full gap-0.5">
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
