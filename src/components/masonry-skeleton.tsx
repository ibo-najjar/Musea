import { FlashList } from "@shopify/flash-list";
import { cn, Skeleton } from "heroui-native";
import { useWindowDimensions, View } from "react-native";

const NUM_COLUMNS = 2;
const ITEM_MARGIN = 8;

// Varying heights to fake masonry while loading
const SKELETON_HEIGHTS = [180, 240, 200, 280, 160, 220];

const MasonrySkeletonCard = ({ height }: { height: number }) => {
	const { width: screenWidth } = useWindowDimensions();
	const columnWidth = screenWidth / NUM_COLUMNS - ITEM_MARGIN * 2;

	return (
		<View className="m-2 overflow-hidden rounded-xl">
			<Skeleton className="rounded-xl" style={{ width: columnWidth, height }} />
		</View>
	);
};

export const MasonrySkeletonGrid = ({
	count = 8,
	className,
	contentContainerClassName,
}: {
	count?: number;
	className?: string;
	contentContainerClassName?: string;
}) => {
	return (
		<FlashList
			className={cn("", className)}
			contentInsetAdjustmentBehavior="automatic"
			contentContainerClassName={cn("", contentContainerClassName)}
			data={Array.from({ length: count })}
			masonry
			showsVerticalScrollIndicator={false}
			numColumns={2}
			keyExtractor={(item, index) => index.toString()}
			renderItem={() => (
				<MasonrySkeletonCard
					height={
						SKELETON_HEIGHTS[
							Math.floor(Math.random() * SKELETON_HEIGHTS.length)
						]
					}
				/>
			)}
		/>
	);
};

export default MasonrySkeletonGrid;
