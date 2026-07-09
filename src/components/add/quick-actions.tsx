import { type SFSymbol, SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "../ui/text";

export function QuickActions({
	onPickMedia,
	onStartNote,
}: {
	onPickMedia: (source: "library" | "camera") => void;
	onStartNote: () => void;
}) {
	return (
		<View className="mt-3 gap-3">
			<View className="flex-row gap-2">
				<QuickActionButton
					onPress={() => onPickMedia("library")}
					icon="photo"
					label="Media"
				/>
				<QuickActionButton
					onPress={() => onPickMedia("camera")}
					icon="camera.fill"
					label="Camera"
				/>
			</View>
			<View className="flex-row gap-2">
				<QuickActionButton
					onPress={onStartNote}
					icon="long.text.page.and.pencil.fill"
					label="Note"
				/>
			</View>
		</View>
	);
}

function QuickActionButton({
	onPress,
	icon,
	label,
}: {
	onPress: () => void;
	label: string;
	icon: SFSymbol;
}) {
	const foreground = useThemeColor("foreground");

	return (
		<Button
			size="lg"
			isGlass
			variant="tertiary"
			className="h-32 flex-1 flex-col rounded-3xl"
			onPress={onPress}
		>
			<SymbolView name={icon} size={32} tintColor={foreground} />
			<Text className="font-medium text-xl">{label}</Text>
		</Button>
	);
}
