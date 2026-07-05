import { DAY, RateLimiter } from "@convex-dev/rate-limiter";
import { type PaginationResult, paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { partial } from "convex-helpers/validators";
import { api, components, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";
import schema from "./schema";

const rateLimiter = new RateLimiter(components.rateLimiter, {
	// Per-user daily cap on AI enrichment (gpt-4o-mini + embedding)
	aiEnrichment: { kind: "fixed window", rate: 50, period: DAY },
});

export const createArtifact = mutation({
	args: {
		sourceUrl: v.optional(v.string()),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		image: v.optional(v.string()),
		videoUrl: v.optional(v.string()),
		text: v.optional(v.string()),
		textSize: v.optional(
			v.union(
				v.literal("sm"),
				v.literal("md"),
				v.literal("lg"),
				v.literal("xl"),
			),
		),
		textWeight: v.optional(
			v.union(
				v.literal("normal"),
				v.literal("medium"),
				v.literal("semibold"),
				v.literal("bold"),
			),
		),
	},
	handler: async (
		ctx,
		{
			sourceUrl,
			title,
			description,
			image,
			videoUrl,
			text,
			textSize,
			textWeight,
		},
	): Promise<Id<"artificats">> => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);

		if (!user) {
			throw new Error("Must be logged in to create an artifact");
		}

		const isTextOnly = !!text && !sourceUrl;

		// Only URL artifacts get AI enrichment; enforce a per-user daily quota.
		// Over quota: save as ready with the raw title and skip enrichment silently.
		let willEnrich = !isTextOnly;
		if (willEnrich) {
			const { ok } = await rateLimiter.limit(ctx, "aiEnrichment", {
				key: user._id,
			});
			willEnrich = ok;
		}

		const artificatId = await ctx.db.insert("artificats", {
			source: sourceUrl,
			userId: user._id,
			title: title?.trim() || sourceUrl || text?.slice(0, 80) || "Untitled",
			description,
			image,
			videoUrl,
			text,
			textSize,
			textWeight,
			status: willEnrich ? "pending" : "ready",
		});

		if (willEnrich) {
			await ctx.scheduler.runAfter(0, internal.ai.enrichArtifact, {
				artificatId,
			});
		} else if (isTextOnly) {
			// Quotes/notes: embedding-only so they surface in vector search.
			// Embeddings are negligible cost, so this skips the AI enrichment quota.
			await ctx.scheduler.runAfter(0, internal.ai.embedTextArtifact, {
				artificatId,
			});
		}

		return artificatId;
	},
});

export const getArtifactById = query({
	args: { artificatId: v.id("artificats") },
	handler: async (ctx, { artificatId }): Promise<Doc<"artificats">> => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) throw new Error("Must be logged in");

		const artifact = await ctx.db.get(artificatId);
		if (!artifact || artifact.userId !== user._id) {
			throw new Error("Not found");
		}
		return artifact;
	},
});

export const getArtifactByIdInternal = internalQuery({
	args: { artificatId: v.id("artificats") },
	handler: async (ctx, { artificatId }) => {
		return await ctx.db.get(artificatId);
	},
});

export const listArtifacts = query({
	args: {
		paginationOpts: paginationOptsValidator,
		sortDir: v.optional(v.union(v.literal("desc"), v.literal("asc"))),
		filterTypes: v.optional(
			v.array(
				v.union(
					v.literal("image"),
					v.literal("video"),
					v.literal("quote"),
					v.literal("link"),
				),
			),
		),
	},
	handler: async (ctx, args): Promise<PaginationResult<Doc<"artificats">>> => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) throw new Error("Must be logged in");

		let q = ctx.db
			.query("artificats")
			.withIndex("by_user", (b) => b.eq("userId", user._id))
			.order(args.sortDir ?? "desc");

		const filterTypes = args.filterTypes;
		if (filterTypes && filterTypes.length > 0) {
			q = q.filter((b) => {
				const preds = filterTypes.map((type) => {
					if (type === "image") return b.neq(b.field("image"), undefined);
					if (type === "video") return b.neq(b.field("videoUrl"), undefined);
					if (type === "quote")
						return b.and(
							b.neq(b.field("text"), undefined),
							b.eq(b.field("image"), undefined),
						);
					return b.neq(b.field("source"), undefined); // link
				});
				return preds.length === 1 ? preds[0] : b.or(...preds);
			});
		}

		return await q.paginate(args.paginationOpts);
	},
});

export const findArtifactByUrl = query({
	args: { sourceUrl: v.string() },
	handler: async (
		ctx,
		{ sourceUrl },
	): Promise<Doc<"artificats"> | null> => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) throw new Error("Must be logged in");

		const artifacts = await ctx.db
			.query("artificats")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.collect();

		return artifacts.find((a) => a.source === sourceUrl) ?? null;
	},
});

export const patchArtifact = mutation({
	args: {
		artificatsId: v.id("artificats"),
		update: v.object({
			title: v.optional(v.string()),
			description: v.optional(v.string()),
			image: v.optional(v.string()),
			videoUrl: v.optional(v.string()),
			text: v.optional(v.string()),
			tags: v.optional(v.array(v.string())),
			textSize: v.optional(
				v.union(
					v.literal("sm"),
					v.literal("md"),
					v.literal("lg"),
					v.literal("xl"),
				),
			),
			textWeight: v.optional(
				v.union(
					v.literal("normal"),
					v.literal("medium"),
					v.literal("semibold"),
					v.literal("bold"),
				),
			),
		}),
	},
	handler: async (ctx, { artificatsId, update }) => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) throw new Error("Must be logged in");

		const artifact = await ctx.db.get(artificatsId);
		if (!artifact || artifact.userId !== user._id) {
			throw new Error("Not found");
		}
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
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) throw new Error("Must be logged in");

		const artifact = await ctx.db.get(artificatId);
		if (!artifact || artifact.userId !== user._id) {
			throw new Error("Not found");
		}

		// Cascade: remove this artifact's gallery link rows
		const links = await ctx.db
			.query("galleryArtifacts")
			.withIndex("by_artifact", (q) => q.eq("artificatId", artificatId))
			.collect();
		await Promise.all(links.map((link) => ctx.db.delete(link._id)));

		await ctx.db.delete(artificatId);
	},
});
