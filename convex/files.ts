import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";

// Generate the URL that you will actually upload the file to
export const generateUploadUrl = mutation(async (ctx) => {
	return await ctx.storage.generateUploadUrl();
});

// Mutation to save custom metadata for the file
export const saveFile = mutation({
	args: { storageId: v.id("_storage"), userId: v.string() },
	handler: async (ctx, args) => {
		const fileId = await ctx.db.insert("files", {
			storageId: args.storageId,
			userId: args.userId,
			format: "image",
		});
		return fileId;
	},
});
