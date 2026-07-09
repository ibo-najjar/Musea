import { useQuery } from "convex/react";
import { Checkbox, ControlField, cn, Label } from "heroui-native";
import { memo } from "react";
import { Text, View } from "react-native";
import { GalleryPreview } from "@/components/gallery-card";
import { api } from "~/convex/_generated/api";
import type { Doc } from "~/convex/_generated/dataModel";

function GalleryListItemComponent({
	gallery,
	isSelected,
	onSelectedChange,
}: {
	gallery: Doc<"gallery">;
	isSelected: boolean;
	onSelectedChange: (selected: boolean) => void;
}) {
	const cardData = useQuery(api.galleryArtifacts.getGalleryCardData, {
		galleryId: gallery._id,
	});
	const items = cardData?.items ?? [];

	return (
		<ControlField
			isSelected={isSelected}
			onSelectedChange={onSelectedChange}
			className={cn("mb-4", {
				"opacity-50": !isSelected,
			})}
		>
			<View className={cn("flex-1 flex-row items-center gap-2", {
				"opacity-80": !isSelected,
			})}>
				<View className="size-12 ">
					<GalleryPreview items={items} variant="compact" className="rounded-xl" />
				</View>
				<View>
					<Label className="text-lg">{gallery.title}</Label>
					<Text className="text-muted text-sm">
						{cardData?.count ?? "…"} {cardData?.count === 1 ? "item" : "items"}
					</Text>
				</View>
			</View>
			<ControlField.Indicator>
				<Checkbox className="mt-0.5 size-8 border border-border bg-transparent shadow-none border-0" />
			</ControlField.Indicator>
		</ControlField>
	);
}

export const GalleryListItem = memo(GalleryListItemComponent);
