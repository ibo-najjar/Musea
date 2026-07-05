"use node";

import { openai } from "@ai-sdk/openai";
import { embed, generateObject } from "ai";
import { v } from "convex/values";
import { z } from "zod";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

// CDNs that block third-party image fetches (hotlink protection)
const BLOCKED_IMAGE_HOSTS = [
	"cdninstagram.com",
	"fbcdn.net",
	"pbs.twimg.com",
	"tiktokcdn.com",
	"tiktokcdn-us.com",
];

function isPubliclyFetchableImage(url: string): boolean {
	try {
		const hostname = new URL(url).hostname;
		return !BLOCKED_IMAGE_HOSTS.some((h) => hostname.endsWith(h));
	} catch {
		return false;
	}
}

const GALLERY_TOPICS = [
	"Design",
	"Travel",
	"Tech",
	"Food",
	"Art",
	"Science",
	"Business",
	"Entertainment",
	"Health",
	"Fashion",
	"Architecture",
	"Photography",
	"Music",
	"Film",
	"Gaming",
	"Nature",
	"Tattoos",
	"Other",
] as const;

const enrichSchema = z.object({
	title: z
		.string()
		.describe(
			"Specific, descriptive title (max 80 chars). Name the actual subject — never generic filler like 'Interesting article' or 'Untitled'.",
		),
	summary: z
		.string()
		.describe(
			"1-2 sentences on what the content actually is/covers. Concrete, not promotional.",
		),
	tags: z
		.array(z.string())
		.min(2)
		.max(5)
		.describe(
			"2-5 lowercase tags, each one or two words (e.g. 'machine learning', 'recipes'). No '#', no sentences, no duplicates.",
		),
	galleryTopic: z
		.enum(GALLERY_TOPICS)
		.describe(
			"The single best-fitting topic. Use 'Other' ONLY when none of the named topics fit.",
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
			const titleIsWeak =
				!artifact.title ||
				artifact.title === artifact.source ||
				artifact.title.toLowerCase() === "untitled";
			const fetchableImage =
				artifact.image && isPubliclyFetchableImage(artifact.image)
					? artifact.image
					: undefined;
			const hasImage = !!fetchableImage;
			const strongestSignal = titleIsWeak
				? hasImage
					? "The title is weak — rely on the URL path segments and the attached image."
					: "The title is weak — rely on the URL path segments."
				: "The existing title is a strong signal — keep or lightly refine it.";

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
								...(artifact.text
									? [`Saved text/quote: ${artifact.text}`]
									: []),
								`Hint: ${strongestSignal}`,
							].join("\n"),
						},
						...(fetchableImage
							? [{ type: "image" as const, image: fetchableImage }]
							: []),
					],
				},
			];

			const { object } = await generateObject({
				model: openai("gpt-4o-mini"),
				schema: enrichSchema,
				system: [
					"You extract structured metadata for Musea, a visual bookmarking app.",
					"Produce specific, accurate metadata a user would recognize at a glance.",
					"Rules:",
					"(1) Titles name the real subject — reject generic filler.",
					"(2) If the existing title/description are already specific, keep or lightly refine them; only rewrite when weak or missing.",
					"(3) Tags are lowercase, 1-2 words each, 2-5 total.",
					'(4) Pick the single closest galleryTopic from the allowed list; use "Other" only when nothing fits.',
					"(5) When metadata is thin, infer from the URL path segments and the image.",
				].join("\n"),
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

// Embedding-only path for text-only artifacts (quotes/notes): make them
// searchable without an LLM call that would overwrite the user's own words.
export const embedTextArtifact = internalAction({
	args: { artificatId: v.id("artificats") },
	handler: async (ctx, { artificatId }) => {
		const artifact = await ctx.runQuery(
			internal.artifacts.getArtifactByIdInternal,
			{ artificatId },
		);
		if (!artifact?.text) return;

		try {
			const { embedding } = await embed({
				model: openai.embedding("text-embedding-3-small"),
				value: artifact.text,
			});
			await ctx.runMutation(internal.artifacts.patchArtifactInternal, {
				artificatId,
				update: { embedding },
			});
		} catch (err) {
			// Leave status "ready" — the quote is fully usable, just not yet searchable.
			console.error("Text embedding failed for", artificatId, err);
		}
	},
});
