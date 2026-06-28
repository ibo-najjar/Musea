import { v } from "convex/values";
import { api } from "./_generated/api";
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

export const updateUsername = mutation({
	args: { username: v.string() },
	handler: async (ctx, args) => {
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

		// The username plugin enforces format + uniqueness and throws on conflict.
		await auth.api.updateUser({
			body: {
				username: args.username,
			},
			headers,
		});

		return { success: true };
	},
});

export const deleteAccount = mutation({
	args: {},
	handler: async (ctx) => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) throw new Error("Must be logged in");
		const userId = user._id;

		// Cascade-delete all of the user's app data
		for (const table of [
			"galleryArtifacts",
			"artificats",
			"gallery",
			"files",
		] as const) {
			const rows = await ctx.db
				.query(table)
				.withIndex("by_user", (q) => q.eq("userId", userId))
				.collect();
			await Promise.all(rows.map((row) => ctx.db.delete(row._id)));
		}

		// Delete the Better Auth user record
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		await auth.api.deleteUser({ body: {}, headers });

		return { success: true };
	},
});
