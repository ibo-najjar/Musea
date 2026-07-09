import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	files: defineTable({
		storageId: v.id("_storage"),
		userId: v.optional(v.string()),
		format: v.string(),
	}).index("by_user", ["userId"]),

	artificats: defineTable({
		title: v.string(),
		description: v.optional(v.string()),
		image: v.optional(v.string()),
		videoUrl: v.optional(v.string()),
		source: v.optional(v.string()),
		// which platform/origin this artifact came from, decided once at
		// creation time (see convex/lib/sourceType.ts) and used to pick a
		// source icon — never re-derived from `source` at render time.
		sourceType: v.optional(
			v.union(
				v.literal("pinterest"),
				v.literal("x"),
				v.literal("youtube"),
				v.literal("reddit"),
				v.literal("tiktok"),
				v.literal("instagram"),
				v.literal("gallery"),
				v.literal("files"),
				v.literal("link"),
				v.literal("richtext"),
			),
		),
		userId: v.string(),
		// AI enrichment
		tags: v.optional(v.array(v.string())),
		status: v.optional(
			v.union(v.literal("pending"), v.literal("ready"), v.literal("failed")),
		),
		embedding: v.optional(v.array(v.float64())),
		// galleries this artifact was explicitly un-filed from (Undo) — never
		// auto-refile it here again.
		excludedGalleryIds: v.optional(v.array(v.id("gallery"))),
	})
		.index("by_user", ["userId"])
		.vectorIndex("by_embedding", {
			vectorField: "embedding",
			dimensions: 1536, // text-embedding-3-small
			filterFields: ["userId"],
		}),

	userFeedback: defineTable({
		userId: v.string(),
		message: v.string(),
	}).index("by_user", ["userId"]),

	gallery: defineTable({
		title: v.string(),
		description: v.optional(v.string()),
		isAuto: v.optional(v.boolean()),
		// user opted this gallery out of LLM auto-filing (absent = auto-file enabled)
		autoFileDisabled: v.optional(v.boolean()),
		userId: v.string(),
	}).index("by_user", ["userId"]),

	galleryArtifacts: defineTable({
		galleryId: v.id("gallery"),
		artificatId: v.id("artificats"),
		userId: v.string(),
	})
		.index("by_gallery", ["galleryId"])
		.index("by_artifact", ["artificatId"])
		.index("by_user", ["userId"]),
});
