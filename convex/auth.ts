import { expo } from "@better-auth/expo";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import { emailOTP, username } from "better-auth/plugins";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import { sendEmail } from "./email";

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth({
		baseURL: process.env.CONVEX_SITE_URL as string,
		trustedOrigins: ["starterai://", "musea://"],
		database: authComponent.adapter(ctx),
		user: {
			deleteUser: { enabled: true },
		},
		// Configure simple, non-verified email/password to get started
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
		},
		databaseHooks: {
			user: {
				create: {
					// Auto-generate a username for users who don't supply one (e.g. OAuth).
					before: async (user) => {
						if ((user as { username?: string }).username) return;
						const base =
							(user.name || user.email?.split("@")[0] || "user")
								.toLowerCase()
								.replace(/[^a-z0-9]/g, "")
								.slice(0, 20) || "user";
						const suffix = Math.random().toString(36).slice(2, 7);
						const displayUsername = `${base}${suffix}`;
						return {
							data: {
								...user,
								username: displayUsername,
								displayUsername,
							},
						};
					},
				},
			},
		},
		socialProviders: {
			google: {
				prompt: "select_account",
				clientId: process.env.GOOGLE_CLIENT_ID as string,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
			},
			apple: {
				clientId: process.env.APPLE_CLIENT_ID as string,
				clientSecret: process.env.APPLE_CLIENT_SECRET as string,
				appBundleIdentifier: process.env.APPLE_BUNDLE_ID as string,
			},
		},
		plugins: [
			// The Expo and Convex plugins are required
			expo(),
			convex({ authConfig }),
			username(),
			emailOTP({
				otpLength: 6,
				expiresIn: 600,
				sendVerificationOTP: async ({ email, otp, type }) => {
					const subject =
						type === "forget-password"
							? "Reset your Musea password"
							: "Verify your Musea email";
					await sendEmail({ to: email, subject, text: `Your code is ${otp}` });
				},
			}),
		],
	});
};
// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		return authComponent.getAuthUser(ctx);
	},
});
