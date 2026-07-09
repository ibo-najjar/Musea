import { authClient } from "@/lib/auth-client";
import "../global.css";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import {
	DarkTheme,
	DefaultTheme,
	type ErrorBoundaryProps,
	Stack,
	ThemeProvider,
	useRouter,
} from "expo-router";
import { ShareIntentProvider } from "expo-share-intent";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
// import * as SystemUI from "expo-system-ui";
import { HeroUINativeProvider, useThemeColor } from "heroui-native";
import { useEffect } from "react";
import { Pressable, Text, useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
	duration: 1000,
	fade: true,
});

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
	const [foreground, background, surface] = useThemeColor([
		"foreground",
		"background",
		"surface",
	]);
	const router = useRouter();
	const colorScheme = useColorScheme();

	const AppDarkTheme = {
		...DarkTheme,
		colors: {
			...DarkTheme.colors,
			background,
			card: surface,
		},
	};
	const AppLightTheme = {
		...DefaultTheme,
		colors: {
			...DefaultTheme.colors,
			background,
			card: surface,
		},
	};

	const { data: session, isPending } = authClient.useSession();

	useEffect(() => {
		if (!isPending) {
			SplashScreen.hideAsync();
		}
	}, [isPending]);

	// useEffect(() => {
	// 	SystemUI.setBackgroundColorAsync(
	// 		colorScheme === "dark" ? Colors.dark.background : Colors.light.background,
	// 	);
	// }, [colorScheme]);

	return (
		// @ts-expect-error - authClient is not typed correctly
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
							<ThemeProvider
								value={colorScheme === "dark" ? AppDarkTheme : AppLightTheme}
							>
								<StatusBar style="auto" />
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
							</ThemeProvider>
						</ShareIntentProvider>
					</HeroUINativeProvider>
				</GestureHandlerRootView>
			</KeyboardProvider>
		</ConvexBetterAuthProvider>
	);
}
