import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function BoardsLayout() {
	const foreground = useThemeColor("foreground");

	return (
		<Stack
			screenOptions={{
				headerShown: false,
				headerTransparent: true,
				headerTitleStyle: {
					color: foreground,
				},
			}}
		>
			<Stack.Screen
				name="index"
				options={{
					headerShown: true,
					headerSearchBarOptions: {
						placeholder: "Search galleries",
					},
					title: "Galleries",
				}}
			/>
			<Stack.Screen
				name="gallery/[galleryId]"
				options={{
					headerShown: true,
					title: "",
					headerBackButtonDisplayMode: "minimal",
				}}
			/>
		</Stack>
	);
}
