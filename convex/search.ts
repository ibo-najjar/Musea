"use node";

import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { action } from "./_generated/server";

export const searchArtifacts = action({
	args: {
		query: v.string(),
		userId: v.string(),
	},
	returns: v.array(v.any()),
	handler: async (ctx, { query, userId }): Promise<Doc<"artificats">[]> => {
		const { embedding } = await embed({
			model: openai.embedding("text-embedding-3-small"),
			value: query,
		});

		const results = await ctx.vectorSearch("artificats", "by_embedding", {
			vector: embedding,
			limit: 30,
			filter: (q) => q.eq("userId", userId),
		});

		const artifacts = await Promise.all(
			results.map(({ _id }) =>
				ctx.runQuery(internal.artifacts.getArtifactByIdInternal, {
					artificatId: _id,
				}),
			),
		);

		return artifacts.filter((a): a is Doc<"artificats"> => a !== null);
	},
});
