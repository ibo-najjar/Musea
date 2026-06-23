import { query } from "./_generated/server";

export const healthcheck = query({
	args: {},
	handler: async (ctx) => {
		return "ok";
	},
});
