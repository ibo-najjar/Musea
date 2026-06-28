import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function IndexLayout() {
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
					title: "Discover",
				}}
			/>
		</Stack>
	);
}
