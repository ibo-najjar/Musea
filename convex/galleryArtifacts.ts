import { v } from "convex/values";
import { api } from "./_generated/api";
import { mutation, query } from "./_generated/server";

// Add an artifact to a gallery
export const addArtifactToGallery = mutation({
	args: {
		galleryId: v.id("gallery"),
		artificatId: v.id("artificats"),
	},
	handler: async (ctx, args) => {
		// Avoid duplicate links
		const existing = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_gallery", (q) => q.eq("galleryId", args.galleryId))
			.filter((q) => q.eq(q.field("artificatId"), args.artificatId))
			.first();
		if (existing) return existing._id;

		return await ctx.db.insert("galleryArtifacts", {
			galleryId: args.galleryId,
			artificatId: args.artificatId,
			userId: "anonymous",
		});
	},
});

// Get the first 3 saved artifacts for a gallery preview (oldest first)
export const getGalleryPreview = query({
	args: { galleryId: v.id("gallery") },
	handler: async (ctx, args) => {
		const links = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_gallery", (q) => q.eq("galleryId", args.galleryId))
			.order("asc") // oldest saved first
			.take(3);

		const artifacts = await Promise.all(
			links.map((link) => ctx.db.get(link.artificatId)),
		);

		return artifacts.filter((a) => a !== null);
	},
});

// Add multiple artifacts to a gallery in one call
export const addArtifactsToGallery = mutation({
	args: {
		galleryId: v.id("gallery"),
		artificatIds: v.array(v.id("artificats")),
	},
	handler: async (ctx, args) => {
		// Get all existing links for this gallery once, instead of querying per artifact
		const existingLinks = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_gallery", (q) => q.eq("galleryId", args.galleryId))
			.collect();

		const existingArtifactIds = new Set(
			existingLinks.map((link) => link.artificatId),
		);

		const insertedIds = [];

		for (const artificatId of args.artificatIds) {
			if (existingArtifactIds.has(artificatId)) continue;

			const id = await ctx.db.insert("galleryArtifacts", {
				galleryId: args.galleryId,
				artificatId,
				userId: "anonymous",
			});
			insertedIds.push(id);
		}

		return insertedIds;
	},
});

// Remove an artifact from a gallery
export const removeArtifactFromGallery = mutation({
	args: {
		galleryId: v.id("gallery"),
		artificatId: v.id("artificats"),
	},
	handler: async (ctx, args) => {
		const link = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_gallery", (q) => q.eq("galleryId", args.galleryId))
			.filter((q) => q.eq(q.field("artificatId"), args.artificatId))
			.first();

		if (!link) return;
		await ctx.db.delete(link._id);
	},
});

// Move an artifact from one gallery to another
export const moveArtifactToGallery = mutation({
	args: {
		fromGalleryId: v.id("gallery"),
		toGalleryId: v.id("gallery"),
		artificatId: v.id("artificats"),
	},
	handler: async (ctx, args) => {
		const link = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_gallery", (q) => q.eq("galleryId", args.fromGalleryId))
			.filter((q) => q.eq(q.field("artificatId"), args.artificatId))
			.first();

		if (link) {
			await ctx.db.delete(link._id);
		}

		return await ctx.db.insert("galleryArtifacts", {
			galleryId: args.toGalleryId,
			artificatId: args.artificatId,
			userId: "anonymous",
		});
	},
});

// List all artifacts inside a gallery (with full artifact data)
export const listArtifactsInGallery = query({
	args: { galleryId: v.id("gallery") },
	handler: async (ctx, args) => {
		const links = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_gallery", (q) => q.eq("galleryId", args.galleryId))
			.order("desc")
			.collect();

		const artifacts = await Promise.all(
			links.map((link) => ctx.db.get(link.artificatId)),
		);

		return artifacts.filter((a) => a !== null);
	},
});

// List all galleries an artifact belongs to
export const listGalleriesForArtifact = query({
	args: { artificatId: v.id("artificats") },
	handler: async (ctx, args) => {
		const links = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_artifact", (q) => q.eq("artificatId", args.artificatId))
			.collect();

		const galleries = await Promise.all(
			links.map((link) => ctx.db.get(link.galleryId)),
		);

		return galleries.filter((g) => g !== null);
	},
});

// Count how many artifacts are in a gallery
export const countArtifactsInGallery = query({
	args: { galleryId: v.id("gallery") },
	handler: async (ctx, args) => {
		const links = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_gallery", (q) => q.eq("galleryId", args.galleryId))
			.collect();
		return links.length;
	},
});

// Get cover images for a gallery (latest N artifacts, for collage cover)
export const getGalleryCover = query({
	args: { galleryId: v.id("gallery"), limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const links = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_gallery", (q) => q.eq("galleryId", args.galleryId))
			.order("desc")
			.take(args.limit ?? 4);

		const artifacts = await Promise.all(
			links.map((link) => ctx.db.get(link.artificatId)),
		);

		return artifacts.filter((a) => a !== null);
	},
});

export const setGalleriesForArtifact = mutation({
	args: {
		artificatId: v.id("artificats"),
		galleryIds: v.array(v.id("gallery")),
	},
	handler: async (ctx, args) => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);

		if (!user) {
			throw new Error("Must be logged in to edit artifact galleries");
		}

		const existingLinks = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_artifact", (q) => q.eq("artificatId", args.artificatId))
			.collect();

		const existingGalleryIds = new Set(
			existingLinks.map((link) => link.galleryId),
		);
		const desiredGalleryIds = new Set(args.galleryIds);

		const toRemove = existingLinks.filter(
			(link) => !desiredGalleryIds.has(link.galleryId),
		);
		await Promise.all(toRemove.map((link) => ctx.db.delete(link._id)));

		const toAdd = args.galleryIds.filter(
			(galleryId) => !existingGalleryIds.has(galleryId),
		);
		await Promise.all(
			toAdd.map((galleryId) =>
				ctx.db.insert("galleryArtifacts", {
					galleryId,
					artificatId: args.artificatId,
					userId: user._id, // swap for real authenticated user
				}),
			),
		);

		return { added: toAdd.length, removed: toRemove.length };
	},
});
