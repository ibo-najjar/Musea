import { useMutation, useQuery } from "convex/react";
import { Link } from "expo-router";
import { SymbolView } from "expo-symbols";
import { cn, Skeleton, useThemeColor } from "heroui-native";
import { Pressable, View } from "react-native";
import { api } from "~/convex/_generated/api";
import type { Doc } from "~/convex/_generated/dataModel";
import { GlassView } from "./ui/apple-glass-view";
import Image from "./ui/image";
import { Text } from "./ui/text";

export const GalleryPreview = ({
	count,
	images,
	className,
	gapClassName = "gap-1",
}: {
	count: number;
	images: string[];
	gapClassName?: string;
	className?: string;
}) => {
	return (
		<View
			className={cn(
				"aspect-square w-full overflow-hidden rounded-2xl bg-surface-secondary",
				className,
			)}
		>
			{count === 0 && (
				// Empty state placeholder
				<View className="flex-1" />
			)}

			{count === 1 && (
				<Image
					source={{ uri: images[0] }}
					contentFit="cover"
					style={{ flex: 1 }}
				/>
			)}

			{count === 2 && (
				<View className={cn("flex-1 flex-row", gapClassName)}>
					<Image
						source={{ uri: images[0] }}
						contentFit="cover"
						style={{ flex: 1 }}
					/>
					<Image
						source={{ uri: images[1] }}
						contentFit="cover"
						style={{ flex: 1 }}
					/>
				</View>
			)}

			{count >= 3 && (
				<View className={cn("flex-1 flex-row", gapClassName)}>
					<View className="h-full flex-1">
						<Image
							source={{ uri: images[0] }}
							contentFit="cover"
							style={{ flex: 1 }}
						/>
					</View>
					<View className={cn("h-full flex-1", gapClassName)}>
						<View className="flex-1">
							<Image
								source={{ uri: images[1] }}
								contentFit="cover"
								style={{ flex: 1 }}
							/>
						</View>
						<View className="flex-1">
							<Image
								source={{ uri: images[2] }}
								contentFit="cover"
								style={{ flex: 1 }}
							/>
						</View>
					</View>
				</View>
			)}
		</View>
	);
};

export function GalleryCard({ gallery }: { gallery: Doc<"gallery"> }) {
	const preview = useQuery(api.galleryArtifacts.getGalleryPreview, {
		galleryId: gallery._id,
	});

	const images = (preview ?? [])
		.map((artifact) => artifact.image)
		.filter((url): url is string => Boolean(url));
	const count = preview?.length ?? 0;

	const totalCount = useQuery(api.galleryArtifacts.countArtifactsInGallery, {
		galleryId: gallery._id,
	});

	const accent = useThemeColor("accent");
	const promoteGallery = useMutation(api.galleries.promoteGallery);
	const dismissAutoGallery = useMutation(api.galleries.dismissAutoGallery);

	return (
		<Link
			href={{
				pathname: "/(app)/(tabs)/(galleries)/gallery/[galleryId]",
				params: { galleryId: gallery._id, galleryTitle: gallery.title },
			}}
			asChild
		>
			<Link.Trigger>
				<Pressable className="m-2 flex-1">
					<View className="relative">
						<Skeleton
							isLoading={preview === undefined}
							className="aspect-square w-full rounded-2xl"
						>
							<GalleryPreview count={count} images={images} />
						</Skeleton>
						{gallery.isAuto && (
							<GlassView className="absolute top-2 right-2 h-7 w-7 items-center justify-center rounded-full">
								<SymbolView name="sparkles" size={16} tintColor={accent} />
							</GlassView>
						)}
					</View>
					<Text className="mt-2 ml-0.5 font-semibold text-foreground text-sm">
						{gallery.title}
					</Text>
					<Skeleton
						isLoading={totalCount === undefined}
						className="mt-1 h-3 w-12 rounded-lg"
					>
						<Text className="ml-0.5 text-muted text-xs">
							{totalCount} {totalCount === 1 ? "save" : "saves"}
						</Text>
					</Skeleton>
				</Pressable>
			</Link.Trigger>
			<Link.Preview
				style={{
					width: 300,
					height: 300,
				}}
			>
				<Skeleton
					isLoading={preview === undefined}
					className="aspect-square w-full rounded-2xl"
				>
					<GalleryPreview count={count} images={images} />
				</Skeleton>
			</Link.Preview>
			<Link.Menu>
				<Link.MenuAction
					icon="sparkles"
					onPress={() => promoteGallery({ galleryId: gallery._id })}
					hidden={!gallery.isAuto}
				>
					Add to my galleries
				</Link.MenuAction>
				<Link.MenuAction
					icon="xmark"
					destructive
					hidden={!gallery.isAuto}
					onPress={() => dismissAutoGallery({ galleryId: gallery._id })}
				>
					Dismiss
				</Link.MenuAction>

				<Link.MenuAction icon="pencil" hidden={gallery.isAuto === true}>
					Edit Gallery
				</Link.MenuAction>
				<Link.MenuAction
					icon="rectangle.stack.fill.badge.minus"
					destructive
					hidden={gallery.isAuto === true}
				>
					Delete Gallery
				</Link.MenuAction>
			</Link.Menu>
		</Link>
	);
}
