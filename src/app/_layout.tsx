import { authClient } from "@/lib/auth-client";
import "../global.css";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { HeroUINativeProvider, useThemeColor } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

const convex = new ConvexReactClient(
	process.env.EXPO_PUBLIC_CONVEX_URL as string,
	{
		// Optionally pause queries until the user is authenticated
		expectAuth: true,
		unsavedChangesWarning: false,
	},
);
export default function RootLayout() {
	const foreground = useThemeColor("foreground");

	const { data: session } = authClient.useSession();

	return (
		<ConvexBetterAuthProvider client={convex} authClient={authClient}>
			<KeyboardProvider>
				<GestureHandlerRootView style={{ flex: 1 }}>
					<HeroUINativeProvider
						config={{
							devInfo: {
								stylingPrinciples: false,
							},
						}}
					>
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
							<Stack.Protected guard={!!session}>
								<Stack.Screen name="(app)" />
							</Stack.Protected>
							<Stack.Protected guard={!session}>
								<Stack.Screen name="(auth)" />
							</Stack.Protected>
						</Stack>
					</HeroUINativeProvider>
				</GestureHandlerRootView>
			</KeyboardProvider>
		</ConvexBetterAuthProvider>
	);
}
