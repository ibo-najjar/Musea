"use node";

import * as cheerio from "cheerio";
import { v } from "convex/values";
import { action } from "./_generated/server";

const FETCH_TIMEOUT_MS = 6000;
const MAX_BYTES = 500_000; // og:tags live in <head>, never need the whole page

function isYouTubeUrl(url: string) {
	return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url);
}

async function fetchYouTubeMetadata(url: string): Promise<{
	title: string;
	image?: string;
	videoUrl?: string;
} | null> {
	const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
	const res = await fetch(oembedUrl, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(6000),
	});
	if (!res.ok) return null;
	const data = (await res.json()) as { title?: string; thumbnail_url?: string };
	return {
		title: data.title ?? "YouTube Video",
		image: data.thumbnail_url,
		videoUrl: url,
	};
}

function isTikTokUrl(url: string) {
	return /^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\//i.test(url);
}

async function resolveTikTokUrl(url: string): Promise<string> {
	if (/tiktok\.com\/@/i.test(url)) return url;
	const res = await fetch(url, {
		method: "HEAD",
		redirect: "follow",
		signal: AbortSignal.timeout(6000),
	});
	// Strip tracking params — oEmbed rejects URLs with query strings
	return res.url ? res.url.split("?")[0] : url;
}

async function fetchTikTokMetadata(url: string): Promise<{
	title: string;
	image?: string;
}> {
	const resolvedUrl = await resolveTikTokUrl(url).catch(() => url);

	const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(resolvedUrl)}`;
	const res = await fetch(oembedUrl, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(6000),
	});

	if (res.ok) {
		const data = (await res.json()) as {
			title?: string;
			author_name?: string;
			thumbnail_url?: string;
		};
		return {
			title: data.title || data.author_name || "TikTok Video",
			image: data.thumbnail_url,
		};
	}

	// Photo posts (and other non-video content): oEmbed returns 400.
	// Extract author from resolved URL as best-effort title.
	const author = resolvedUrl.match(/tiktok\.com\/@([^/?#]+)/i)?.[1];
	return { title: author ? `@${author} on TikTok` : "TikTok" };
}

function isTwitterUrl(url: string) {
	return /^https?:\/\/(www\.)?(twitter\.com|x\.com)\//i.test(url);
}

function extractTweetIdAndUser(
	url: string,
): { username: string; id: string } | null {
	const m = url.match(/(?:twitter\.com|x\.com)\/([^/?#]+)\/status\/(\d+)/i);
	if (!m) return null;
	return { username: m[1], id: m[2] };
}

type FxTweetMedia = {
	type: string;
	url?: string;
	thumbnail_url?: string;
};

type FxTweetResponse = {
	code?: number;
	tweet?: {
		text?: string;
		author?: { name?: string };
		media?: { videos?: FxTweetMedia[]; photos?: FxTweetMedia[] };
	};
};

async function fetchFxTwitter(url: string): Promise<{
	title: string;
	image?: string;
	videoUrl?: string;
} | null> {
	const parsed = extractTweetIdAndUser(url);
	if (!parsed) return null;

	const apiUrl = `https://api.fxtwitter.com/${parsed.username}/status/${parsed.id}`;
	const res = await fetch(apiUrl, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(6000),
	});
	if (!res.ok) return null;

	const data = (await res.json()) as FxTweetResponse;
	const tweet = data.tweet;
	if (!tweet) return null;

	const authorName = tweet.author?.name ?? "X Post";
	const title = tweet.text
		? `${authorName}: ${tweet.text.slice(0, 80)}`
		: authorName;

	const videos = tweet.media?.videos ?? [];
	const photos = tweet.media?.photos ?? [];

	if (videos.length > 0) {
		const video = videos[0];
		return {
			title,
			image: video.thumbnail_url,
			// store direct video URL so expo-video can play it inline
			videoUrl: video.url,
		};
	}

	return {
		title,
		image: photos[0]?.url,
	};
}

async function scrapeHtml(url: string): Promise<{
	title: string;
	description?: string;
	image?: string;
	videoUrl?: string;
}> {
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

		if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
		if (!response.body) throw new Error("Empty response body");

		// Stream and stop at </head> to avoid downloading the whole page
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
			if (image?.includes("/profile_images/")) image = undefined;
		}

		const videoUrl =
			$('meta[name="twitter:player:stream"]').attr("content") ?? undefined;

		return {
			title: rawTitle?.trim() || "Untitled",
			description: rawDescription?.trim() || undefined,
			image,
			videoUrl,
		};
	} finally {
		clearTimeout(timeout);
	}
}

export async function scrapeMetadata(url: string): Promise<{
	title: string;
	description?: string;
	image?: string;
	videoUrl?: string;
}> {
	if (/\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(url)) {
		return { title: "Image", image: url };
	}

	if (isYouTubeUrl(url)) {
		const result = await fetchYouTubeMetadata(url).catch(() => null);
		if (result) return result;
	}

	if (isTikTokUrl(url)) {
		return fetchTikTokMetadata(url);
	}

	if (isTwitterUrl(url)) {
		const result = await fetchFxTwitter(url).catch(() => null);
		if (result) return result;
	}

	return scrapeHtml(url);
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
