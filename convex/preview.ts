"use node";

import * as cheerio from "cheerio";
import { v } from "convex/values";
import { action } from "./_generated/server";

const FETCH_TIMEOUT_MS = 6000;
const MAX_BYTES = 500_000; // og:tags live in <head>, never need the whole page

export async function scrapeMetadata(url: string) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

	try {
		const response = await fetch(url, {
			signal: controller.signal,
			redirect: "follow",
			headers: {
				"User-Agent":
					"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
				Accept:
					"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
			},
		});

		if (!response.ok) {
			throw new Error(`Request failed with status ${response.status}`);
		}
		if (!response.body) {
			throw new Error("Empty response body");
		}

		// Stream the response and stop as soon as we have </head> (or hit a byte
		// cap) instead of waiting for the whole page.
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let html = "";
		let bytesRead = 0;

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			bytesRead += value.length;
			html += decoder.decode(value, { stream: true });

			if (html.includes("</head>") || bytesRead >= MAX_BYTES) {
				await reader.cancel().catch(() => {});
				break;
			}
		}

		const $ = cheerio.load(html);

		const rawTitle =
			$('meta[property="og:title"]').attr("content") ??
			$('meta[name="twitter:title"]').attr("content") ??
			$("title").text();

		const rawDescription =
			$('meta[property="og:description"]').attr("content") ??
			$('meta[name="twitter:description"]').attr("content") ??
			$('meta[name="description"]').attr("content");

		const rawImage =
			$('meta[name="twitter:player:image"]').attr("content") ??
			$('meta[property="og:image"]').attr("content") ??
			$('meta[name="twitter:image"]').attr("content");

		let image: string | undefined;
		if (rawImage) {
			try {
				image = new URL(rawImage, url).toString();
			} catch {
				image = rawImage;
			}
			// X/Twitter profile pictures are not useful thumbnails — discard them
			if (image?.includes("/profile_images/")) {
				image = undefined;
			}
		}

		return {
			title: rawTitle?.trim() || "Untitled",
			description: rawDescription?.trim() || undefined,
			image,
		};
	} finally {
		clearTimeout(timeout);
	}
}

export const getPreview = action({
	args: {
		url: v.string(),
	},
	handler: async (_, { url }) => {
		try {
			console.log("Fetching preview for", url);
			return await scrapeMetadata(url);
		} catch (err) {
			console.error("scrapeMetadata failed for", url, err);
			const isTimeout = err instanceof Error && err.name === "AbortError";
			throw new Error(
				isTimeout
					? "This site took too long to respond"
					: err instanceof Error
						? err.message
						: "Failed to fetch preview",
			);
		}
	},
});
