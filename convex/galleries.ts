import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";

export const createGallery = mutation({
	args: { title: v.string() },
	handler: async (ctx, { title }) => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) throw new Error("Must be logged in to create a gallery");

		await ctx.db.insert("gallery", {
			title,
			userId: user._id,
		});
	},
});

export const getGalleryById = query({
	args: { galleryId: v.id("gallery") },
	handler: async (ctx, { galleryId }) => {
		return await ctx.db.get(galleryId);
	},
});

export const listGalleries = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("gallery").collect();
	},
});

export const listUserGalleries = query({
	args: {},
	handler: async (ctx): Promise<Doc<"gallery">[]> => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) throw new Error("Must be logged in");
		return await ctx.db
			.query("gallery")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.collect();
	},
});

// Called by the AI enrichment action to auto-assign an artifact to a topic gallery
export const findOrCreateAutoGallery = internalMutation({
	args: {
		userId: v.string(),
		topic: v.string(),
		artificatId: v.id("artificats"),
	},
	handler: async (ctx, { userId, topic, artificatId }) => {
		// Find existing auto gallery with this topic for this user
		const galleries = await ctx.db
			.query("gallery")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		let gallery = galleries.find(
			(g) => g.isAuto && g.title.toLowerCase() === topic.toLowerCase(),
		);

		if (!gallery) {
			const galleryId = await ctx.db.insert("gallery", {
				title: topic,
				userId,
				isAuto: true,
			});
			gallery = (await ctx.db.get(galleryId))!;
		}

		// Only add if not already linked
		const existing = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_artifact", (q) => q.eq("artificatId", artificatId))
			.filter((q) => q.eq(q.field("galleryId"), gallery!._id))
			.first();

		if (!existing) {
			await ctx.db.insert("galleryArtifacts", {
				galleryId: gallery._id,
				artificatId,
				userId,
			});
		}
	},
});
