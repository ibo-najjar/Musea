import { authClient } from "@/lib/auth-client";
import "../global.css";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { type ErrorBoundaryProps, Stack, useRouter } from "expo-router";
import { ShareIntentProvider } from "expo-share-intent";
import { HeroUINativeProvider, useThemeColor } from "heroui-native";
import { Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

// Renders in place of RootLayout when it throws, so it sits OUTSIDE all the
// providers below — keep it to plain primitives with no theme/provider deps.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
	return (
		<View
			style={{
				flex: 1,
				alignItems: "center",
				justifyContent: "center",
				padding: 24,
				gap: 16,
				backgroundColor: "#000",
			}}
		>
			<Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>
				Something went wrong
			</Text>
			<Text style={{ color: "#999", textAlign: "center" }}>
				{error.message}
			</Text>
			<Pressable
				onPress={retry}
				style={{
					marginTop: 8,
					paddingHorizontal: 20,
					paddingVertical: 10,
					borderRadius: 999,
					backgroundColor: "#fff",
				}}
			>
				<Text style={{ color: "#000", fontWeight: "600" }}>Try again</Text>
			</Pressable>
		</View>
	);
}

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
	const router = useRouter();

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
						<ShareIntentProvider
							options={{
								onResetShareIntent: () => router.replace("/"),
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
						</ShareIntentProvider>
					</HeroUINativeProvider>
				</GestureHandlerRootView>
			</KeyboardProvider>
		</ConvexBetterAuthProvider>
	);
}
