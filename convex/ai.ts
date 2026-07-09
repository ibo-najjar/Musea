"use node";

import { openai } from "@ai-sdk/openai";
import { embed, generateObject } from "ai";
import { v } from "convex/values";
import { z } from "zod";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { type ActionCtx, internalAction } from "./_generated/server";
import { scrapeMetadata } from "./preview";

// Ask the LLM to file `artificatId` into one of the user's galleries, or name a
// new one. Every save lands somewhere unless the user opted every eligible
// gallery out of auto-filing. Filing failures never fail enrichment.
async function autoFile(
	ctx: ActionCtx,
	userId: string,
	artificatId: Id<"artificats">,
	itemText: string,
) {
	try {
		const galleries = await ctx.runQuery(
			internal.organize.getGalleriesForFiling,
			{
				userId,
				artificatId,
			},
		);

		let galleryIndex: number | null = null;
		let newGalleryName: string | null = null;

		if (galleries.length > 0) {
			const galleryList = galleries
				.map((g, i) => {
					const desc = g.description ? ` (${g.description})` : "";
					const samples = g.sampleTitles.length
						? ` — e.g. ${g.sampleTitles.map((t) => `"${t}"`).join(", ")}`
						: "";
					return `${i}. "${g.title}"${desc}${samples}`;
				})
				.join("\n");

			const { object } = await generateObject({
				model: openai("gpt-4o-mini"),
				schema: filingSchema,
				system: [
					"You file a saved item into the user's galleries (collections).",
					"Pick the index of an existing gallery ONLY when the item clearly fits its theme.",
					"Otherwise propose a NEW gallery name: 1-3 words, Title Case, max 24 characters,",
					"broad enough to hold future similar saves, and NOT a synonym/variant of an",
					"existing gallery name (if it would be, pick that existing gallery instead).",
				].join(" "),
				messages: [
					{
						role: "user",
						content: [
							`Item: ${itemText}`,
							"",
							"The user's galleries:",
							galleryList,
						].join("\n"),
					},
				],
			});
			galleryIndex = object.galleryIndex;
			newGalleryName = object.newGalleryName;
		} else {
			const { object } = await generateObject({
				model: openai("gpt-4o-mini"),
				schema: filingSchema.pick({ newGalleryName: true }),
				system:
					"Propose a NEW gallery (collection) name for this saved item: 1-3 words, Title Case, max 24 characters.",
				messages: [{ role: "user", content: `Item: ${itemText}` }],
			});
			newGalleryName = object.newGalleryName;
		}

		const resolvedGalleryId =
			galleryIndex !== null && galleries[galleryIndex]
				? galleries[galleryIndex].galleryId
				: undefined;

		await ctx.runMutation(internal.organize.autoFileArtifact, {
			userId,
			artificatId,
			galleryId: resolvedGalleryId,
			newGalleryTitle: resolvedGalleryId
				? undefined
				: (newGalleryName ?? undefined),
		});
	} catch (err) {
		console.error("Auto-filing failed for", artificatId, err);
	}
}

const filingSchema = z.object({
	galleryIndex: z
		.number()
		.int()
		.nullable()
		.describe(
			"Index of the existing gallery this item clearly belongs in, or null.",
		),
	newGalleryName: z
		.string()
		.max(24)
		.nullable()
		.describe(
			"If galleryIndex is null: a 1-3 word Title Case name for a new gallery. Never a near-duplicate of an existing name.",
		),
});

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

const enrichSchema = z.object({
	title: z
		.string()
		.describe(
			"Specific, descriptive title (max 80 chars). Name the actual subject — never generic filler like 'Interesting article' or 'Untitled'.",
		),
	summary: z
		.string()
		.describe(
			"A Markdown-formatted description of what the content actually is/covers. Concrete, not promotional. " +
				"Start with a one-line intro sentence, then 2-4 bullet points using '- ', each led by a relevant emoji. " +
				"No headings, no bold/italics, keep it scannable and no more than ~5 lines total.",
		),
	tags: z
		.array(z.string())
		.min(2)
		.max(5)
		.describe(
			"2-5 lowercase tags, each one or two words (e.g. 'machine learning', 'recipes'). No '#', no sentences, no duplicates.",
		),
});

// Strip Markdown syntax + emoji so the summary embeds cleanly for vector search.
const stripMarkdown = (s: string) =>
	s
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) -> text
		.replace(/[#>*_`~]|(^|\s)-\s/gm, " ") // markdown markers / bullet dashes
		.replace(/\p{Extended_Pictographic}/gu, "") // emoji
		.replace(/\p{Default_Ignorable_Code_Point}/gu, "") // ZWJ / variation selectors
		.replace(/\s+/g, " ")
		.trim();

export const enrichArtifact = internalAction({
	args: { artificatId: v.id("artificats") },
	handler: async (ctx, { artificatId }) => {
		const artifact = await ctx.runQuery(
			internal.artifacts.getArtifactByIdInternal,
			{ artificatId },
		);
		if (!artifact) return;

		try {
			// The server is the source of truth for OG metadata: scrape here
			// rather than trusting whatever (if anything) the client passed in,
			// so an early save or a failed client-side preview can't leave the
			// artifact permanently empty.
			let title = artifact.title;
			let description = artifact.description;
			let image = artifact.image;
			let videoUrl = artifact.videoUrl;
			if (artifact.source) {
				const scraped = await scrapeMetadata(artifact.source).catch(() => null);
				if (scraped) {
					title = scraped.title;
					description = scraped.description ?? description;
					image = scraped.image ?? image;
					videoUrl = scraped.videoUrl ?? videoUrl;
				}
			}

			const titleIsWeak =
				!title ||
				title === artifact.source ||
				title.toLowerCase() === "untitled";
			const fetchableImage =
				image && isPubliclyFetchableImage(image) ? image : undefined;
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
								`Current title: ${title}`,
								`Current description: ${description ?? "none"}`,
								...(artifact.description
									? [`Saved text/quote: ${artifact.description}`]
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
					"(4) When metadata is thin, infer from the URL path segments and the image.",
					"(5) The summary is Markdown with emojis: a one-line intro, then 2-4 '- ' bullets, each starting with a fitting emoji. No headings, no bold/italics; keep it short and specific.",
				].join("\n"),
				messages,
			});

			const textToEmbed = [
				object.title,
				stripMarkdown(object.summary),
				...object.tags,
			].join(" ");
			const { embedding } = await embed({
				model: openai.embedding("text-embedding-3-small"),
				value: textToEmbed,
			});

			await ctx.runMutation(internal.artifacts.patchArtifactInternal, {
				artificatId,
				update: {
					title: object.title,
					description: object.summary,
					image,
					videoUrl,
					tags: object.tags,
					embedding,
					status: "ready",
				},
			});

			await autoFile(ctx, artifact.userId, artificatId, textToEmbed);
		} catch (err) {
			console.error("AI enrichment failed for", artificatId, err);
			await ctx.runMutation(internal.artifacts.patchArtifactInternal, {
				artificatId,
				update: { status: "failed" },
			});
		}
	},
});

// Scrape-only path for URL artifacts that skipped LLM enrichment (over the
// daily quota): fills in title/description/image so the artifact isn't left
// empty, without spending an OpenAI call.
export const scrapeArtifactMetadata = internalAction({
	args: { artificatId: v.id("artificats") },
	handler: async (ctx, { artificatId }) => {
		const artifact = await ctx.runQuery(
			internal.artifacts.getArtifactByIdInternal,
			{ artificatId },
		);
		if (!artifact?.source) return;

		try {
			const scraped = await scrapeMetadata(artifact.source);
			await ctx.runMutation(internal.artifacts.patchArtifactInternal, {
				artificatId,
				update: {
					title: scraped.title,
					description: scraped.description,
					image: scraped.image,
					videoUrl: scraped.videoUrl,
					status: "ready",
				},
			});
		} catch (err) {
			console.error("Metadata scrape failed for", artificatId, err);
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
		if (!artifact?.description) return;

		try {
			const { embedding } = await embed({
				model: openai.embedding("text-embedding-3-small"),
				value: artifact.title + " " + artifact.description,
			});
			await ctx.runMutation(internal.artifacts.patchArtifactInternal, {
				artificatId,
				update: { embedding },
			});

			// Quotes/notes auto-file just like URLs.
			await autoFile(ctx, artifact.userId, artificatId, artifact.description);
		} catch (err) {
			// Leave status "ready" — the quote is fully usable, just not yet searchable.
			console.error("Text embedding failed for", artificatId, err);
		}
	},
});
