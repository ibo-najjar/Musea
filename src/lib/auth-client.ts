import { expoClient } from "@better-auth/expo/client";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { emailOTPClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { isRunningInExpoGo } from "expo";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
	baseURL: process.env.EXPO_PUBLIC_CONVEX_SITE_URL,
	plugins: [
		expoClient({
			scheme: isRunningInExpoGo()
				? "exp"
				: (Constants.expoConfig?.scheme as string),
			storagePrefix: Constants.expoConfig?.scheme as string,
			storage: SecureStore,
		}),
		convexClient(),
		usernameClient(),
		emailOTPClient(),
	],
});
