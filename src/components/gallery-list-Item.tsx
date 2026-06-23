import { useQuery } from "convex/react";
import { ControlField, Checkbox, Label } from "heroui-native";
import { memo, useMemo } from "react";
import { Text, View } from "react-native";
import { GalleryPreview } from "@/components/gallery-card";
import { api } from "~/convex/_generated/api";
import { Doc } from "~/convex/_generated/dataModel";

function GalleryListItemComponent({
	gallery,
	isSelected,
	onSelectedChange,
}: {
	gallery: Doc<"gallery">;
	isSelected: boolean;
	onSelectedChange: (selected: boolean) => void;
}) {
	const preview = useQuery(api.galleryArtifacts.getGalleryPreview, {
		galleryId: gallery._id,
	});
	const count = useQuery(api.galleryArtifacts.countArtifactsInGallery, {
		galleryId: gallery._id,
	});

	const images = useMemo(
		() =>
			(preview ?? [])
				.map((artifact) => artifact.image)
				.filter((url): url is string => Boolean(url)),
		[preview],
	);

	return (
		<ControlField
			isSelected={isSelected}
			onSelectedChange={onSelectedChange}
			className="mb-4"
		>
			<View className="flex-1 flex-row items-center gap-2">
				<View className="size-12 rounded-xl overflow-hidden">
					<GalleryPreview count={images.length} images={images} />
				</View>
				<View>
					<Label className="text-lg">{gallery.title}</Label>
					<Text className="text-sm text-muted">
						{count ?? "…"} {count === 1 ? "item" : "items"}
					</Text>
				</View>
			</View>
			<ControlField.Indicator>
				<Checkbox className="mt-0.5 bg-transparent size-8 shadow-none border border-border" />
			</ControlField.Indicator>
		</ControlField>
	);
}

export const GalleryListItem = memo(GalleryListItemComponent);
