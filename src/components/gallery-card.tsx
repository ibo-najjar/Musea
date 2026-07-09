import { useMutation, useQuery } from "convex/react";
import { Link, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { cn, Skeleton, useThemeColor } from "heroui-native";
import { Pressable, View } from "react-native";
import { api } from "~/convex/_generated/api";
import type { Doc } from "~/convex/_generated/dataModel";
import type { PreviewTileItem } from "~/convex/galleryArtifacts";
import { AppIcon } from "./app-icon";
import { PreviewTile } from "./preview-tile";
import { GlassView } from "./ui/apple-glass-view";
import { Text } from "./ui/text";

export const GalleryPreview = ({
	items,
	className,
	gapClassName = "gap-1",
	variant = "full",
}: {
	items: PreviewTileItem[];
	gapClassName?: string;
	className?: string;
	variant?: "full" | "compact";
}) => {
	const count = items.length;

	return (
		<View
			className={cn(
				"aspect-square w-full overflow-hidden rounded-2xl",
				className,
			)}
		>
			{count === 0 && (
				// Empty state placeholder
				<View className="flex-1 bg-surface items-center justify-center">
					<View className="flex-1 justify-center items-center size-1/2 opacity-50" >
						<AppIcon />
					</View>
				</View>
			)}

			{count === 1 && <PreviewTile item={items[0]} variant={variant} />}

			{count === 2 && (
				<View className={cn("flex-1 flex-row", gapClassName)}>
					<PreviewTile item={items[0]} variant={variant} />
					<PreviewTile item={items[1]} variant={variant} />
				</View>
			)}

			{count >= 3 && (
				<View className={cn("flex-1 flex-row", gapClassName)}>
					<View className="h-full flex-1">
						<PreviewTile item={items[0]} variant={variant} />
					</View>
					<View className={cn("h-full flex-1", gapClassName)}>
						<View className="flex-1">
							<PreviewTile item={items[1]} variant={variant} />
						</View>
						<View className="flex-1">
							<PreviewTile item={items[2]} variant={variant} />
						</View>
					</View>
				</View>
			)}
		</View>
	);
};

export function GalleryCard({ gallery }: { gallery: Doc<"gallery"> }) {
	const cardData = useQuery(api.galleryArtifacts.getGalleryCardData, {
		galleryId: gallery._id,
	});
	const items = cardData?.items ?? [];

	const deleteGallery = useMutation(api.galleries.deleteGallery);

	const router = useRouter();
	const accent = useThemeColor("accent");
	const surface = useThemeColor("surface");
	const promoteGallery = useMutation(api.galleries.promoteGallery);

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
							isLoading={cardData === undefined}
							className="aspect-square w-full rounded-3xl"
						>
							<GalleryPreview items={items} className="rounded-3xl" />
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
						isLoading={cardData === undefined}
						className="mt-1 h-3 w-12 rounded-lg"
					>
						<Text className="ml-0.5 text-muted text-xs">
							{cardData?.count} {cardData?.count === 1 ? "save" : "saves"}
						</Text>
					</Skeleton>
				</Pressable>
			</Link.Trigger>
			<Link.Preview
				style={{
					width: 300,
					height: 300,
					backgroundColor: surface,
				}}
			>
				<Skeleton
					isLoading={cardData === undefined}
					className="aspect-square w-full rounded-2xl"
				>
					<GalleryPreview items={items} />
				</Skeleton>
			</Link.Preview>
			<Link.Menu>
				{/* AI-born galleries: claim it as your own. */}
				<Link.MenuAction
					icon="sparkles"
					hidden={!gallery.isAuto}
					onPress={() => promoteGallery({ galleryId: gallery._id })}
				>
					Add to my galleries
				</Link.MenuAction>

				<Link.MenuAction
					icon="pencil"
					onPress={() =>
						router.push({
							pathname: "/(app)/(modal)/edit-gallery/[galleryId]",
							params: { galleryId: gallery._id },
						})
					}
				>
					Edit Gallery
				</Link.MenuAction>
				<Link.MenuAction
					icon="rectangle.stack.fill.badge.minus"
					destructive
					onPress={() => deleteGallery({ galleryId: gallery._id })}
				>
					Delete Gallery
				</Link.MenuAction>
			</Link.Menu>
		</Link>
	);
}
