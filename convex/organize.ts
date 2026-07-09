import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation } from "./_generated/server";

// How many of a gallery's own items to show the LLM as a hint for what fits.
const SAMPLE_TITLES_PER_GALLERY = 3;
// Keeps this query well under Convex's read limits for users with many galleries.
const GALLERY_SCAN_LIMIT = 100;

// Candidate galleries the LLM may file `artificatId` into: everything the user
// owns except galleries they've opted out of auto-filing, or already un-filed
// this specific artifact from (Undo).
export const getGalleriesForFiling = internalQuery({
	args: { userId: v.string(), artificatId: v.id("artificats") },
	returns: v.array(
		v.object({
			galleryId: v.id("gallery"),
			title: v.string(),
			description: v.optional(v.string()),
			sampleTitles: v.array(v.string()),
		}),
	),
	handler: async (ctx, { userId, artificatId }) => {
		const artifact = await ctx.db.get(artificatId);
		const excluded = new Set(
			(artifact?.excludedGalleryIds ?? []).map((id) => String(id)),
		);

		const galleries = await ctx.db
			.query("gallery")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.take(GALLERY_SCAN_LIMIT);

		const result = [];
		for (const g of galleries) {
			if (g.autoFileDisabled || excluded.has(String(g._id))) continue;
			const links = await ctx.db
				.query("galleryArtifacts")
				.withIndex("by_gallery", (q) => q.eq("galleryId", g._id))
				.order("desc")
				.take(SAMPLE_TITLES_PER_GALLERY);
			const sampleTitles = (
				await Promise.all(links.map((l) => ctx.db.get(l.artificatId)))
			)
				.filter((a): a is NonNullable<typeof a> => a !== null)
				.map((a) => a.title);
			result.push({
				galleryId: g._id,
				title: g.title,
				description: g.description,
				sampleTitles,
			});
		}
		return result;
	},
});

// File an artifact into an existing gallery, or create a new isAuto gallery for
// it when the LLM proposed a new name. Never trusts the LLM's galleryId blindly.
export const autoFileArtifact = internalMutation({
	args: {
		userId: v.string(),
		artificatId: v.id("artificats"),
		galleryId: v.optional(v.id("gallery")),
		newGalleryTitle: v.optional(v.string()),
	},
	returns: v.union(v.id("gallery"), v.null()),
	handler: async (ctx, { userId, artificatId, galleryId, newGalleryTitle }) => {
		const artifact = await ctx.db.get(artificatId);
		if (!artifact || artifact.userId !== userId) return null;
		const excluded = new Set(
			(artifact.excludedGalleryIds ?? []).map((id) => String(id)),
		);

		let targetId: Id<"gallery"> | null = null;

		if (galleryId) {
			const gallery = await ctx.db.get(galleryId);
			if (
				gallery &&
				gallery.userId === userId &&
				!gallery.autoFileDisabled &&
				!excluded.has(String(galleryId))
			) {
				targetId = galleryId;
			}
		} else if (newGalleryTitle) {
			const trimmed = newGalleryTitle.trim();
			if (trimmed) {
				const existingGalleries = await ctx.db
					.query("gallery")
					.withIndex("by_user", (q) => q.eq("userId", userId))
					.take(GALLERY_SCAN_LIMIT);
				const match = existingGalleries.find(
					(g) => g.title.trim().toLowerCase() === trimmed.toLowerCase(),
				);
				if (match) {
					if (!match.autoFileDisabled && !excluded.has(String(match._id))) {
						targetId = match._id;
					}
				} else {
					targetId = await ctx.db.insert("gallery", {
						title: trimmed,
						userId,
						isAuto: true,
					});
				}
			}
		}

		if (!targetId) return null;

		const existingLink = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_artifact", (q) => q.eq("artificatId", artificatId))
			.filter((q) => q.eq(q.field("galleryId"), targetId))
			.first();
		if (!existingLink) {
			await ctx.db.insert("galleryArtifacts", {
				galleryId: targetId,
				artificatId,
				userId,
			});
		}
		return targetId;
	},
});

// Undo an auto-file: remove the link and record the rejection so we never
// refile this item into this gallery again. If the gallery was just created for
// this save and is now empty, delete it so Undo fully reverses the create.
export const undoAutoFile = mutation({
	args: {
		artificatId: v.id("artificats"),
		galleryId: v.id("gallery"),
	},
	handler: async (ctx, { artificatId, galleryId }) => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) throw new Error("Must be logged in");
		const artifact = await ctx.db.get(artificatId);
		if (!artifact || artifact.userId !== user._id) throw new Error("Not found");

		const link = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_artifact", (q) => q.eq("artificatId", artificatId))
			.filter((q) => q.eq(q.field("galleryId"), galleryId))
			.first();
		if (link) await ctx.db.delete(link._id);

		const excluded = artifact.excludedGalleryIds ?? [];
		if (!excluded.some((id) => String(id) === String(galleryId))) {
			await ctx.db.patch(artificatId, {
				excludedGalleryIds: [...excluded, galleryId],
			});
		}

		const gallery = await ctx.db.get(galleryId);
		if (gallery?.isAuto) {
			const remaining = await ctx.db
				.query("galleryArtifacts")
				.withIndex("by_gallery", (q) => q.eq("galleryId", galleryId))
				.first();
			if (!remaining) await ctx.db.delete(galleryId);
		}
	},
});
