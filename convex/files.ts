import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";

// Generate the URL that you will actually upload the file to
export const generateUploadUrl = mutation(async (ctx) => {
	return await ctx.storage.generateUploadUrl();
});

// Save custom metadata for the file and resolve it to a fetchable URL in one
// round-trip, instead of a separate insert + getUrl call.
export const saveFile = mutation({
	args: {
		storageId: v.id("_storage"),
		userId: v.string(),
		format: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("files", {
			storageId: args.storageId,
			userId: args.userId,
			format: args.format ?? "image",
		});
		return await ctx.storage.getUrl(args.storageId);
	},
});
