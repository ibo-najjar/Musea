import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
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
	handler: async (ctx, { galleryId }): Promise<Doc<"gallery"> | null> => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) throw new Error("Must be logged in");

		// Reactive subscription: a deleted/unowned gallery resolves to null
		// (handled by the screen) rather than throwing.
		const gallery = await ctx.db.get(galleryId);
		if (!gallery || gallery.userId !== user._id) {
			return null;
		}
		return gallery;
	},
});

export const listUserGalleries = query({
	args: {},
	handler: async (ctx): Promise<Doc<"gallery">[]> => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) throw new Error("Must be logged in");
		const galleries = await ctx.db
			.query("gallery")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.take(100);
		return galleries.filter((g) => !g.dismissed);
	},
});

export const updateGallery = mutation({
	args: {
		galleryId: v.id("gallery"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
	},
	handler: async (ctx, { galleryId, title, description }) => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) throw new Error("Must be logged in");

		const gallery = await ctx.db.get(galleryId);
		if (!gallery || gallery.userId !== user._id) {
			throw new Error("Not found");
		}

		const update: Partial<Doc<"gallery">> = {};
		if (title !== undefined) update.title = title;
		if (description !== undefined) update.description = description;
		await ctx.db.patch(galleryId, update);
	},
});

export const deleteGallery = mutation({
	args: { galleryId: v.id("gallery") },
	handler: async (ctx, { galleryId }) => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) throw new Error("Must be logged in");

		const gallery = await ctx.db.get(galleryId);
		if (!gallery || gallery.userId !== user._id) {
			throw new Error("Not found");
		}

		// Cascade: remove this gallery's artifact link rows (artifacts themselves stay)
		const links = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_gallery", (q) => q.eq("galleryId", galleryId))
			.collect();
		await Promise.all(links.map((link) => ctx.db.delete(link._id)));

		await ctx.db.delete(galleryId);
	},
});

// Convert an auto-generated gallery into a user-owned gallery
export const promoteGallery = mutation({
	args: { galleryId: v.id("gallery") },
	handler: async (ctx, { galleryId }) => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) throw new Error("Must be logged in");

		const gallery = await ctx.db.get(galleryId);
		if (!gallery || gallery.userId !== user._id) {
			throw new Error("Not found");
		}
		await ctx.db.patch(galleryId, { isAuto: false });
	},
});

// Dismiss an auto-generated gallery: hide it and stop future auto-filing of its topic
export const dismissAutoGallery = mutation({
	args: { galleryId: v.id("gallery") },
	handler: async (ctx, { galleryId }) => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) throw new Error("Must be logged in");

		const gallery = await ctx.db.get(galleryId);
		if (!gallery || gallery.userId !== user._id) {
			throw new Error("Not found");
		}
		await ctx.db.patch(galleryId, { dismissed: true });
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

		// User dismissed this topic — don't auto-file or recreate the gallery
		if (gallery?.dismissed) return;

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
