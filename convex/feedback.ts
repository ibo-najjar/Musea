import { DAY, RateLimiter } from "@convex-dev/rate-limiter";
import { v } from "convex/values";
import { api, components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

const rateLimiter = new RateLimiter(components.rateLimiter, {
	// Per-user daily cap on feedback submissions to prevent spam.
	feedback: { kind: "fixed window", rate: 5, period: DAY },
});

export const submitFeedback = mutation({
	args: {
		message: v.string(),
	},
	handler: async (ctx, { message }): Promise<Id<"userFeedback">> => {
		const user = await ctx.runQuery(api.auth.getCurrentUser);
		if (!user) {
			throw new Error("Must be logged in to submit feedback");
		}

		const trimmed = message.trim();
		if (!trimmed) {
			throw new Error("Feedback message cannot be empty");
		}

		const { ok, retryAfter } = await rateLimiter.limit(ctx, "feedback", {
			key: user._id,
		});
		if (!ok) {
			throw new Error(
				`Too many feedback submissions. Try again in ${Math.ceil(
					retryAfter / (60 * 1000),
				)} minutes.`,
			);
		}

		return await ctx.db.insert("userFeedback", {
			userId: user._id,
			message: trimmed,
		});
	},
});
