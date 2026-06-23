import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function SettingsLayout() {
	const foreground = useThemeColor("foreground");

	return (
		<Stack
			screenOptions={{
				headerShown: true,
				headerTransparent: true,
				headerTitleStyle: {
					color: foreground,
				},
				title: "",
				headerBackButtonDisplayMode: "minimal",
			}}
		>
			<Stack.Screen
				name="index"
				options={{
					title: "Settings",
				}}
			/>
			<Stack.Screen
				name="profile"
				options={{
					title: "Profile",
				}}
			/>
		</Stack>
	);
}
