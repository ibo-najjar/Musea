import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

const formSheetOptions = {
	presentation: "formSheet" as const,
	contentStyle: {
		backgroundColor: "transparent",
	},
	title: "",
	sheetAllowedDetents: [0.6] as number[],
};

export default function AuthLayout() {
	const background = useThemeColor("background");
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: {
					backgroundColor: background,
				},
			}}
		>
			<Stack.Screen name="index" />
			<Stack.Screen name="email-and-password" options={formSheetOptions} />
			<Stack.Screen
				name="verify-email"
				options={{ ...formSheetOptions, sheetAllowedDetents: [0.5] }}
			/>
			<Stack.Screen
				name="forgot-password"
				options={{ ...formSheetOptions, sheetAllowedDetents: [0.5] }}
			/>
			<Stack.Screen
				name="reset-password"
				options={{ ...formSheetOptions, sheetAllowedDetents: [0.6] }}
			/>
		</Stack>
	);
}
