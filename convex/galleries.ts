import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalQuery, mutation, query } from "./_generated/server";

export const createGallery = mutation({
	args: {
		title: v.string(),
		autoFileDisabled: v.optional(v.boolean()),
	},
	handler: async (ctx, { title, autoFileDisabled }): Promise<Id<"gallery">> => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) throw new Error("Must be logged in to create a gallery");

		return await ctx.db.insert("gallery", {
			title,
			autoFileDisabled,
			userId: user._id,
		});
	},
});

// Internal read for the enrichment/seeding actions (no auth — internal only).
export const getGalleryInternal = internalQuery({
	args: { galleryId: v.id("gallery") },
	handler: async (ctx, { galleryId }): Promise<Doc<"gallery"> | null> => {
		return await ctx.db.get(galleryId);
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
		return galleries;
	},
});

export const updateGallery = mutation({
	args: {
		galleryId: v.id("gallery"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		autoFileDisabled: v.optional(v.boolean()),
	},
	handler: async (ctx, { galleryId, title, description, autoFileDisabled }) => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) throw new Error("Must be logged in");

		const gallery = await ctx.db.get(galleryId);
		if (!gallery || gallery.userId !== user._id) {
			throw new Error("Not found");
		}

		const update: Partial<Doc<"gallery">> = {};
		if (title !== undefined) update.title = title;
		if (description !== undefined) update.description = description;
		if (autoFileDisabled !== undefined)
			update.autoFileDisabled = autoFileDisabled;
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

// Convert an auto-generated gallery into a user-owned gallery (clears the sparkle badge)
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
