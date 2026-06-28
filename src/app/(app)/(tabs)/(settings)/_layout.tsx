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
			<Stack.Screen
				name="privacy-policy"
				options={{
					presentation: "formSheet",
					sheetAllowedDetents: [1],
					sheetGrabberVisible: true,
					title: "Privacy Policy",
				}}
			/>
			<Stack.Screen
				name="terms"
				options={{
					presentation: "formSheet",
					sheetAllowedDetents: [1],
					sheetGrabberVisible: true,
					title: "Terms of Service",
				}}
			/>
		</Stack>
	);
}
