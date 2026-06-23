import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { authComponent, createAuth } from "./auth";

export const updateProfileImage = mutation({
	args: { storageId: v.id("_storage") },
	handler: async (ctx, args) => {
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

		// Get the storage URL for the uploaded file
		const fileUrl = await ctx.storage.getUrl(args.storageId);

		if (!fileUrl) {
			throw new Error("Failed to get file URL");
		}

		// Update the user's image
		await auth.api.updateUser({
			body: {
				image: fileUrl,
			},
			headers,
		});

		return { success: true, imageUrl: fileUrl };
	},
});

export const updateProfileName = mutation({
	args: { name: v.string() },
	handler: async (ctx, args) => {
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

		// Update the user's name
		await auth.api.updateUser({
			body: {
				name: args.name,
			},
			headers,
		});

		return { success: true };
	},
});
