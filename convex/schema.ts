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
		text: v.optional(v.string()),
		source: v.optional(v.string()),
		userId: v.string(),
		// AI enrichment
		tags: v.optional(v.array(v.string())),
		status: v.optional(
			v.union(v.literal("pending"), v.literal("ready"), v.literal("failed")),
		),
		embedding: v.optional(v.array(v.float64())),
	})
		.index("by_user", ["userId"])
		.vectorIndex("by_embedding", {
			vectorField: "embedding",
			dimensions: 1536, // text-embedding-3-small
			filterFields: ["userId"],
		}),

	gallery: defineTable({
		title: v.string(),
		description: v.optional(v.string()),
		isAuto: v.optional(v.boolean()),
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
