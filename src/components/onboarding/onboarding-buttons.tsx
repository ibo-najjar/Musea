import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Typography, useThemeColor, useToast } from "heroui-native";
import { useState } from "react";
import { Alert, View } from "react-native";
import Animated, {
	Extrapolation,
	interpolate,
	type SharedValue,
	useAnimatedStyle,
} from "react-native-reanimated";
import * as simpleIcons from "simple-icons";
import { SourceIcon } from "@/components/source-icon";
import { BlurGlass } from "@/components/ui/blur-glass";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { SW } from "./constants";

export function OnboardingButtons({
	scrollX,
	onContinue,
}: {
	scrollX: SharedValue<number>;
	onContinue: () => void;
}) {
	const router = useRouter();
	const foreground = useThemeColor("foreground");
	const danger = useThemeColor("danger");
	const { toast } = useToast();
	const [googleLoading, setGoogleLoading] = useState(false);

	const continueStyle = useAnimatedStyle(() => {
		const p = scrollX.value / SW;
		const ty = interpolate(p, [1.5, 2], [0, 200], Extrapolation.CLAMP);
		const opacity = interpolate(p, [1.5, 2], [1, 0], Extrapolation.CLAMP);
		return { transform: [{ translateY: ty }], opacity };
	});

	const topBlockStyle = useAnimatedStyle(() => {
		const p = scrollX.value / SW;
		const ty = interpolate(p, [1.5, 2], [-300, 0], Extrapolation.CLAMP);
		const opacity = interpolate(p, [1.5, 2], [0, 1], Extrapolation.CLAMP);
		return { transform: [{ translateY: ty }], opacity };
	});

	const signInWithApple = async () => {
		try {
			const credential = await AppleAuthentication.signInAsync({
				requestedScopes: [
					AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
					AppleAuthentication.AppleAuthenticationScope.EMAIL,
				],
			});
			if (!credential.identityToken) throw new Error("No identity token");
			await authClient.signIn.social(
				{ provider: "apple", idToken: { token: credential.identityToken } },
				{
					onError: () => {
						toast.show({
							label: "Sign in failed. Please try again.",
							variant: "danger",
							icon: (
								<SymbolView
									name="exclamationmark"
									size={20}
									tintColor={danger}
									weight="medium"
								/>
							),
						});
					},
					onSuccess: () => router.replace("/(app)/(tabs)"),
				},
			);
		} catch (e: any) {
			if (e.code !== "ERR_REQUEST_CANCELED") Alert.alert("Error", e.message);
		}
	};

	const signInWithGoogle = async () => {
		try {
			setGoogleLoading(true);
			await authClient.signIn.social(
				{ provider: "google", callbackURL: "musea://(app)/(tabs)/(index)" },
				{
					onError: (error) => {
						toast.show({
							label: "An error occurred during sign in. Please try again.",
							variant: "danger",
							icon: (
								<SymbolView
									name="exclamationmark"
									size={20}
									tintColor={danger}
									weight="medium"
								/>
							),
							description: error instanceof Error ? error.message : undefined,
						});
					},
					onSuccess: () => router.replace("/(app)/(tabs)"),
				},
			);
		} catch (e: any) {
			if (e.code !== "ERR_REQUEST_CANCELED") Alert.alert("Error", e.message);
		} finally {
			setGoogleLoading(false);
		}
	};

	return (
		<View
			style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
			pointerEvents="box-none"
		>
			<Animated.View
				style={[
					{ position: "absolute", bottom: 30, left: 32, right: 32 },
					continueStyle,
				]}
			>
				<Button variant="primary" className="w-full" onPress={onContinue}>
					Continue
				</Button>
			</Animated.View>

			<Animated.View
				style={[
					{ position: "absolute", top: 130, left: 32, right: 32, gap: 16 },
					topBlockStyle,
				]}
			>
				<Typography.Heading type="h2" weight="bold" className="text-center">
					Welcome to Musea
				</Typography.Heading>
				<AppleAuthentication.AppleAuthenticationButton
					buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
					buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
					cornerRadius={12}
					style={{ width: "100%", height: 44 }}
					onPress={signInWithApple}
				/>
				<Button onPress={signInWithGoogle} variant="secondary">
					<SourceIcon
						svgPath={simpleIcons.siGoogle.path}
						size={20}
						color={foreground}
					/>
					<Text className="font-medium">
						{googleLoading ? "Signing in…" : "Continue with Google"}
					</Text>
				</Button>
			</Animated.View>
		</View>
	);
}
