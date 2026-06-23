import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";
import { View } from "react-native";
import { Button } from "@/components/ui/button";

export default function TabLayout() {
	const foreground = useThemeColor("foreground");

	return (
		<Stack
			screenOptions={{
				headerShown: false,
				headerTransparent: true,
				title: "",
				headerBackVisible: false,
				headerTitleStyle: {
					color: foreground,
				},
			}}
		>
			<Stack.Screen name="(tabs)" />
			<Stack.Screen name="(modal)/artifact/[artifactId]" />
			<Stack.Screen name="(modal)/add" />
			<Stack.Screen
				name="(modal)/create-gallery"
				options={{
					presentation: "formSheet",
					sheetAllowedDetents: "fitToContents",
					contentStyle: {
						backgroundColor: "transparent",
					},
					sheetGrabberVisible: true,
				}}
			/>
			<Stack.Screen
				name="(modal)/artifact-galleries/[artifactId]"
				options={{
					headerShown: true,
					title: "Saved Galleries",

					presentation: "formSheet",
					sheetAllowedDetents: "fitToContents",
					contentStyle: {
						backgroundColor: "transparent",
					},
					sheetGrabberVisible: true,
				}}
			/>
			<Stack.Screen
				name="(modal)/edit-gallery/[galleryId]"
				options={{
					headerShown: true,
					title: "Edit Gallery",
					presentation: "formSheet",
					sheetAllowedDetents: [1],
					contentStyle: {
						backgroundColor: "transparent",
					},
					sheetGrabberVisible: true,
				}}
			/>
			<Stack.Screen
				name="(modal)/suggested-gallery-artifacts/[galleryId]"
				options={{
					headerShown: true,
					presentation: "formSheet",
					sheetAllowedDetents: [1],

					sheetGrabberVisible: true,
				}}
			/>
		</Stack>
	);
}
