export type PreviewData = {
	title: string;
	description?: string;
	image?: string;
	videoUrl?: string;
};

export type PickedMedia = {
	uri: string;
	type: "image" | "video";
	mimeType?: string;
	width?: number;
	height?: number;
};

export type AddMode = "idle" | "url" | "note" | "media";

export function looksLikeUrl(value: string) {
	return /^https?:\/\/.+\..+/i.test(value.trim());
}

// True while the user is partway through hand-typing a URL, so we don't flip
// into note mode on the first keystrokes ("h", "ht", "https://", ...).
export function looksLikeUrlPrefix(value: string) {
	const trimmed = value.trim().toLowerCase();
	if (!trimmed) return false;
	return "https://".startsWith(trimmed) || "http://".startsWith(trimmed);
}
