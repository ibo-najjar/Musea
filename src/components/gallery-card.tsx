import { useQuery } from "convex/react";
import { Link } from "expo-router";
import { cn } from "heroui-native";
import { Pressable, View } from "react-native";
import { api } from "~/convex/_generated/api";
import { Doc } from "~/convex/_generated/dataModel";
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
				"w-full aspect-square rounded-2xl overflow-hidden bg-transparent",
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
					<View className="flex-1 h-full">
						<Image
							source={{ uri: images[0] }}
							contentFit="cover"
							style={{ flex: 1 }}
						/>
					</View>
					<View className={cn("flex-1 h-full", gapClassName)}>
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

	return (
		<Link
			href={{
				pathname: "/(app)/(tabs)/(galleries)/gallery/[galleryId]",
				params: { galleryId: gallery._id, galleryTitle: gallery.title },
			}}
			asChild
		>
			<Pressable className="flex-1 m-2">
				<GalleryPreview count={count} images={images} />

				<Text className="text-foreground font-semibold text-sm mt-2 ml-0.5">
					{gallery.title}
				</Text>
				<Text className="text-muted-foreground text-xs ml-0.5">
					{count} {count === 1 ? "save" : "saves"}
				</Text>
			</Pressable>
		</Link>
	);
}
