"use node";

import { openai } from "@ai-sdk/openai";
import { embed, generateObject } from "ai";
import { v } from "convex/values";
import { z } from "zod";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

const enrichSchema = z.object({
	title: z
		.string()
		.describe("A concise, descriptive title for this saved content (max 80 chars)"),
	summary: z
		.string()
		.describe("A 1-2 sentence summary of what this content is about"),
	tags: z
		.array(z.string())
		.min(2)
		.max(5)
		.describe("2-5 relevant topic tags, lowercase, single words or short phrases"),
	galleryTopic: z
		.string()
		.describe(
			"One broad topic category: Design, Travel, Tech, Food, Art, Science, Business, Entertainment, Health, Fashion, Architecture, Photography, Music, Film, Gaming, Nature, or Other",
		),
});

export const enrichArtifact = internalAction({
	args: { artificatId: v.id("artificats") },
	handler: async (ctx, { artificatId }) => {
		const artifact = await ctx.runQuery(
			internal.artifacts.getArtifactByIdInternal,
			{ artificatId },
		);
		if (!artifact) return;

		try {
			const messages: Parameters<typeof generateObject>[0]["messages"] = [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: [
								"Analyze this saved web content and generate metadata.",
								`URL: ${artifact.source ?? "unknown"}`,
								`Current title: ${artifact.title}`,
								`Current description: ${artifact.description ?? "none"}`,
							].join("\n"),
						},
						...(artifact.image
							? [{ type: "image" as const, image: artifact.image }]
							: []),
					],
				},
			];

			const { object } = await generateObject({
				model: openai("gpt-4o-mini"),
				schema: enrichSchema,
				system:
					"You are a content metadata extractor for a visual bookmarking app called Musea. Generate accurate, concise metadata. If the existing title/description are already good, keep them or improve slightly. Infer from URL path and image when metadata is weak.",
				messages,
			});

			const textToEmbed = [object.title, object.summary, ...object.tags].join(
				" ",
			);
			const { embedding } = await embed({
				model: openai.embedding("text-embedding-3-small"),
				value: textToEmbed,
			});

			await ctx.runMutation(internal.artifacts.patchArtifactInternal, {
				artificatId,
				update: {
					title: object.title,
					description: object.summary,
					tags: object.tags,
					embedding,
					status: "ready",
				},
			});

			await ctx.runMutation(internal.galleries.findOrCreateAutoGallery, {
				userId: artifact.userId,
				topic: object.galleryTopic,
				artificatId,
			});
		} catch (err) {
			console.error("AI enrichment failed for", artificatId, err);
			await ctx.runMutation(internal.artifacts.patchArtifactInternal, {
				artificatId,
				update: { status: "failed" },
			});
		}
	},
});
