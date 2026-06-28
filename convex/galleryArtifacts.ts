import { type PaginationResult, paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";

// Require the caller to be logged in and own the given gallery. Returns userId.
async function requireGalleryOwner(
	ctx: QueryCtx,
	galleryId: Id<"gallery">,
): Promise<string> {
	const user = await ctx.runQuery(api.auth.getCurrentUser);
	if (!user) throw new Error("Must be logged in");
	const gallery = await ctx.db.get(galleryId);
	if (!gallery || gallery.userId !== user._id) {
		throw new Error("Not found");
	}
	return user._id;
}

// Returns the owned gallery, or null if missing / not owned / logged out.
// Used by reactive read queries so a deleted gallery resolves cleanly instead
// of throwing (the screen's subscriptions re-run right after deletion).
async function getOwnedGallery(
	ctx: QueryCtx,
	galleryId: Id<"gallery">,
): Promise<Doc<"gallery"> | null> {
	const user = await ctx.runQuery(api.auth.getCurrentUser);
	if (!user) return null;
	const gallery = await ctx.db.get(galleryId);
	if (!gallery || gallery.userId !== user._id) return null;
	return gallery;
}

// Require the caller to be logged in and own the given artifact. Returns userId.
async function requireArtifactOwner(
	ctx: QueryCtx,
	artificatId: Id<"artificats">,
): Promise<string> {
	const user = await ctx.runQuery(api.auth.getCurrentUser);
	if (!user) throw new Error("Must be logged in");
	const artifact = await ctx.db.get(artificatId);
	if (!artifact || artifact.userId !== user._id) {
		throw new Error("Not found");
	}
	return user._id;
}

// Add an artifact to a gallery
export const addArtifactToGallery = mutation({
	args: {
		galleryId: v.id("gallery"),
		artificatId: v.id("artificats"),
	},
	handler: async (ctx, args): Promise<Id<"galleryArtifacts">> => {
		const userId = await requireGalleryOwner(ctx, args.galleryId);

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
			userId,
		});
	},
});

// Get the first 3 saved artifacts for a gallery preview (oldest first)
export const getGalleryPreview = query({
	args: { galleryId: v.id("gallery") },
	handler: async (ctx, args): Promise<Doc<"artificats">[]> => {
		if (!(await getOwnedGallery(ctx, args.galleryId))) return [];

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
	handler: async (ctx, args): Promise<Id<"galleryArtifacts">[]> => {
		const userId = await requireGalleryOwner(ctx, args.galleryId);

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
				userId,
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
		await requireGalleryOwner(ctx, args.galleryId);

		const link = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_gallery", (q) => q.eq("galleryId", args.galleryId))
			.filter((q) => q.eq(q.field("artificatId"), args.artificatId))
			.first();

		if (!link) return;
		await ctx.db.delete(link._id);
	},
});

// Remove multiple artifacts from a gallery in one call
export const removeArtifactsFromGallery = mutation({
	args: {
		galleryId: v.id("gallery"),
		artificatIds: v.array(v.id("artificats")),
	},
	handler: async (ctx, args) => {
		await requireGalleryOwner(ctx, args.galleryId);

		const links = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_gallery", (q) => q.eq("galleryId", args.galleryId))
			.collect();

		const linkByArtifact = new Map(
			links.map((link) => [link.artificatId, link._id]),
		);

		await Promise.all(
			args.artificatIds.map((artificatId) => {
				const linkId = linkByArtifact.get(artificatId);
				return linkId ? ctx.db.delete(linkId) : Promise.resolve();
			}),
		);
	},
});

// Move an artifact from one gallery to another
export const moveArtifactToGallery = mutation({
	args: {
		fromGalleryId: v.id("gallery"),
		toGalleryId: v.id("gallery"),
		artificatId: v.id("artificats"),
	},
	handler: async (ctx, args): Promise<Id<"galleryArtifacts">> => {
		await requireGalleryOwner(ctx, args.fromGalleryId);
		const userId = await requireGalleryOwner(ctx, args.toGalleryId);

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
			userId,
		});
	},
});

// List all artifacts inside a gallery (with full artifact data)
export const listArtifactsInGallery = query({
	args: { galleryId: v.id("gallery"), paginationOpts: paginationOptsValidator },
	handler: async (ctx, args): Promise<PaginationResult<Doc<"artificats">>> => {
		if (!(await getOwnedGallery(ctx, args.galleryId))) {
			return { page: [], isDone: true, continueCursor: "" };
		}

		const result = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_gallery", (q) => q.eq("galleryId", args.galleryId))
			.order("desc")
			.paginate(args.paginationOpts);

		const artifacts = await Promise.all(
			result.page.map((link) => ctx.db.get(link.artificatId)),
		);

		return { ...result, page: artifacts.filter((a) => a !== null) };
	},
});

// List all galleries an artifact belongs to
export const listGalleriesForArtifact = query({
	args: { artificatId: v.id("artificats") },
	handler: async (ctx, args): Promise<Doc<"gallery">[]> => {
		await requireArtifactOwner(ctx, args.artificatId);

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

// Return ids of all artifacts already in a gallery (for exclusion in the suggest flow)
export const getGalleryArtifactIds = query({
	args: { galleryId: v.id("gallery") },
	handler: async (ctx, args): Promise<Id<"artificats">[]> => {
		if (!(await getOwnedGallery(ctx, args.galleryId))) return [];

		const links = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_gallery", (q) => q.eq("galleryId", args.galleryId))
			.take(1000);
		return links.map((link) => link.artificatId);
	},
});

// Count how many artifacts are in a gallery
export const countArtifactsInGallery = query({
	args: { galleryId: v.id("gallery") },
	handler: async (ctx, args): Promise<number> => {
		if (!(await getOwnedGallery(ctx, args.galleryId))) return 0;

		const links = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_gallery", (q) => q.eq("galleryId", args.galleryId))
			.take(1000);
		return links.length;
	},
});

// Get cover images for a gallery (latest N artifacts, for collage cover)
export const getGalleryCover = query({
	args: { galleryId: v.id("gallery"), limit: v.optional(v.number()) },
	handler: async (ctx, args): Promise<Doc<"artificats">[]> => {
		if (!(await getOwnedGallery(ctx, args.galleryId))) return [];

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
	handler: async (ctx, args): Promise<{ added: number; removed: number }> => {
		const userId = await requireArtifactOwner(ctx, args.artificatId);

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
					userId,
				}),
			),
		);

		return { added: toAdd.length, removed: toRemove.length };
	},
});
