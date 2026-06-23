import { v } from "convex/values";
import { partial } from "convex-helpers/validators";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import schema from "./schema";

export const createArtifact = mutation({
	args: {
		sourceUrl: v.string(),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		image: v.optional(v.string()),
	},
	handler: async (ctx, { sourceUrl, title, description, image }): Promise<Id<"artificats">> => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);

		if (!user) {
			throw new Error("Must be logged in to create an artifact");
		}

		const artificatId = await ctx.db.insert("artificats", {
			source: sourceUrl,
			userId: user._id,
			title: title?.trim() || sourceUrl,
			description,
			image,
			status: "pending",
		});

		// Schedule AI enrichment immediately after save
		await ctx.scheduler.runAfter(0, internal.ai.enrichArtifact, { artificatId });

		return artificatId;
	},
});

export const getArtifactById = query({
	args: { artificatId: v.id("artificats") },
	handler: async (ctx, { artificatId }) => {
		return await ctx.db.get(artificatId);
	},
});

export const getArtifactByIdInternal = internalQuery({
	args: { artificatId: v.id("artificats") },
	handler: async (ctx, { artificatId }) => {
		return await ctx.db.get(artificatId);
	},
});

export const listArtifacts = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("artificats")
			.withIndex("by_creation_time")
			.order("desc")
			.collect();
	},
});

export const patchArtifact = mutation({
	args: {
		artificatsId: v.id("artificats"),
		update: v.object(partial(schema.tables.artificats.validator.fields)),
	},
	handler: async (ctx, { artificatsId, update }) => {
		await ctx.db.patch(artificatsId, update);
	},
});

export const patchArtifactInternal = internalMutation({
	args: {
		artificatId: v.id("artificats"),
		update: v.object(partial(schema.tables.artificats.validator.fields)),
	},
	handler: async (ctx, { artificatId, update }) => {
		await ctx.db.patch(artificatId, update);
	},
});

export const deleteArtifact = mutation({
	args: { artificatId: v.id("artificats") },
	handler: async (ctx, { artificatId }) => {
		await ctx.db.delete(artificatId);
	},
});
