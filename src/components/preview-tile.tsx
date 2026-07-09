import { SymbolView } from "expo-symbols";
import { cn, Typography, useThemeColor } from "heroui-native";
import { View } from "react-native";
import type { PreviewTileItem } from "~/convex/galleryArtifacts";
import Image from "./ui/image";

export type { PreviewTileItem };

export const PreviewTile = ({
	item,
	variant,
	className,
}: {
	item: PreviewTileItem;
	variant: "full" | "compact";
	// Extra classes merged onto the tile's root. Defaults to filling the
	// parent via flex, which only works when the parent's height is
	// otherwise guaranteed (e.g. an aspect-ratio box). Pass "absolute
	// inset-0" when the parent is an explicitly bordered/sized box — that
	// fills its padding box exactly (respecting the border), instead of a
	// flex/percentage size that some wrappers (heroui-native's Skeleton,
	// once loaded) fail to establish.
	className?: string;
}) => {
	const muted = useThemeColor("muted");

	if (!item.image) {
		if (variant === "compact") {
			return (
				<View
					className={cn(
						"flex-1 items-center justify-center bg-surface",
						className,
					)}
				>
					<SymbolView name="text.alignleft" size={14} tintColor={muted} />
				</View>
			);
		}

		return (
			<View className={cn("flex-1 overflow-hidden bg-surface p-3", className)}>
				<Typography type="h4" weight="semibold" numberOfLines={2}>
					{item.title}
				</Typography>
				<Typography.Paragraph type="body-xs" color="muted" numberOfLines={4}>
					{item.description}
				</Typography.Paragraph>
			</View>
		);
	}

	return (
		<Image
			source={{ uri: item.image }}
			contentFit="cover"
			className={cn("flex-1", className)}
		/>
	);
};
