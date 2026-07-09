import { SymbolView } from "expo-symbols";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { useWindowDimensions, View } from "react-native";
import { Text } from "./ui/text";

const NUM_COLUMNS = 2;
const ITEM_MARGIN = 8;

function AddArtifactCard({ onPress }: { onPress: () => void }) {
	const { width: screenWidth } = useWindowDimensions();
	const columnWidth = screenWidth / NUM_COLUMNS - ITEM_MARGIN * 2;

	const foreground = useThemeColor("muted");

	return (
		<PressableFeedback onPress={onPress}>
			<PressableFeedback.Scale>
				<View
					className="m-2 flex-1 items-center justify-center rounded-xl bg-surface-tertiary"
					style={{ width: columnWidth, height: columnWidth }}
				>
					<SymbolView name="plus" size={32} tintColor={foreground} />
				</View>
			</PressableFeedback.Scale>
		</PressableFeedback>
	);
}

export default AddArtifactCard;
