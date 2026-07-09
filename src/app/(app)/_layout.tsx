import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";
import { AutoFileWatcher } from "@/components/auto-file-watcher";

export const unstable_settings = {
	// Ensure any route can link back to `/`
	initialRouteName: "(tabs)/(discover)",
};

export default function TabLayout() {
	const foreground = useThemeColor("foreground");

	return (
		<>
			<AutoFileWatcher />
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
						// contentStyle: {
						// 	backgroundColor: "transparent",
						// },
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
				<Stack.Screen
					name="(modal)/artifact-details/[artifactId]"
					options={{
						headerShown: true,
						presentation: "formSheet",
						sheetAllowedDetents: "fitToContents",
						title: "",
						sheetGrabberVisible: true,
					}}
				/>
				<Stack.Screen
					name="(modal)/handle-share"
					options={{
						headerShown: false,
						presentation: "formSheet",
						sheetAllowedDetents: [0.8, 1],
						sheetGrabberVisible: true,
					}}
				/>
				<Stack.Screen
					name="(modal)/add"
					options={{
						headerShown: true,
						presentation: "formSheet",
						sheetAllowedDetents: [1],
						title: "",
						sheetGrabberVisible: true,
						// unstable_sheetFooter: () => (
						// 	<View className="absolute bottom-0 w-full p-4">
						// 		<Button
						// 			isGlass
						// 			// isLoading={isSaving}
						// 			className="w-full"
						// 		>
						// 			YOO
						// 		</Button>
						// 	</View>
						// ),
					}}
				/>
				<Stack.Screen
					name="(modal)/feedback"
					options={{
						headerShown: true,
						presentation: "formSheet",
						sheetAllowedDetents: [1],
						title: "",
						sheetGrabberVisible: true,
					}}
				/>
			</Stack>
		</>
	);
}
