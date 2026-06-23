import { SymbolView } from "expo-symbols";
import { Checkbox, cn, PressableFeedback } from "heroui-native";
import { useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { Doc } from "~/convex/_generated/dataModel";
import Image from "./ui/image";

const NUM_COLUMNS = 2;
const ITEM_MARGIN = 8;

const SelectableMasonryCard = ({
	item,
	isSelected,
	onToggle,
}: {
	item: Doc<"artificats">;
	isSelected: boolean;
	onToggle: (id: string) => void;
}) => {
	const { width: screenWidth } = useWindowDimensions();
	const columnWidth = screenWidth / NUM_COLUMNS - ITEM_MARGIN * 2;
	const [imgHeight, setImgHeight] = useState<number>(200);

	return (
		<PressableFeedback onPress={() => onToggle(item._id)}>
			<PressableFeedback.Scale>
				<View
					className={cn("m-2 overflow-hidden rounded-2xl bg-surface relative")}
				>
					<Image
						className="w-full"
						source={{ uri: item.image }}
						style={{ height: imgHeight, width: columnWidth }}
						contentFit="cover"
						onLoad={(e) => {
							const { width, height } = e.source;
							if (width && height) {
								setImgHeight((height / width) * columnWidth);
							}
						}}
					/>
					<View className="absolute top-2 right-2">
						{/* <View
						className={`w-6 h-6 rounded-full items-center justify-center border-2 ${
							isSelected
								? "bg-accent border-accent"
								: "bg-foreground/30 border-border"
						}`}
					>
						{isSelected && (
							<SymbolView name="checkmark" size={14} tintColor="white" />
						)}
					</View> */}
						<Checkbox
							isSelected={isSelected}
							className="bg-foreground/30"
							onPress={() => onToggle(item._id)}
						/>
					</View>
				</View>
			</PressableFeedback.Scale>
		</PressableFeedback>
	);
};

export default SelectableMasonryCard;
