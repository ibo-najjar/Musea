// lib/sources.ts
import type { ImageSourcePropType } from "react-native";

// Mirrors convex/schema.ts `artificats.sourceType`. Decided once at creation
// time (see convex/lib/sourceType.ts) — never re-derived from the artifact's
// `source` URL at render time.
export type SourceType =
	| "pinterest"
	| "x"
	| "youtube"
	| "reddit"
	| "tiktok"
	| "instagram"
	| "gallery"
	| "files"
	| "link"
	| "richtext";

const DIRECTABLE_SOURCES: SourceType[] = [
	"pinterest",
	"x",
	"youtube",
	"reddit",
	"tiktok",
	"instagram",
];

export function isSourceDirectable(
	sourceType: SourceType | undefined,
): boolean {
	return sourceType ? DIRECTABLE_SOURCES.includes(sourceType) : false;
}

export const SOURCE_LABELS: Record<SourceType, string> = {
	pinterest: "Pinterest",
	x: "X",
	youtube: "YouTube",
	reddit: "Reddit",
	tiktok: "TikTok",
	instagram: "Instagram",
	gallery: "Gallery",
	files: "Files",
	link: "Link",
	richtext: "Note",
};

// PNG icons, dropped in per source type. Until filled in, SourceIcon
// renders nothing for that type rather than a broken image.
// e.g. pinterest: require("@/assets/source-icons/pinterest.png"),
export const SOURCE_ICONS: Partial<Record<SourceType, ImageSourcePropType>> = {
	pinterest: require("@/assets/sources/pinterest.png"),
	x: require("@/assets/sources/x.png"),
	youtube: require("@/assets/sources/youtube.png"),
	reddit: require("@/assets/sources/reddit.png"),
	tiktok: require("@/assets/sources/tiktok.png"),
	instagram: require("@/assets/sources/instagram.png"),
	files: require("@/assets/sources/files.png"),
	gallery: require("@/assets/sources/photos.png"),
	link: require("@/assets/sources/safari.png"),
	richtext: require("@/assets/sources/notes.png"),
};
