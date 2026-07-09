import type { Doc } from "../_generated/dataModel";

export type SourceType = Doc<"artificats">["sourceType"];

const SOURCE_TYPE_BY_HOST: Record<string, SourceType> = {
	"pinterest.com": "pinterest",
	"pin.it": "pinterest",

	"x.com": "x",
	"twitter.com": "x",
	"t.co": "x",

	"youtube.com": "youtube",
	"youtu.be": "youtube",

	"reddit.com": "reddit",
	"redd.it": "reddit",

	"tiktok.com": "tiktok",
	"vm.tiktok.com": "tiktok",
	"vt.tiktok.com": "tiktok",

	"instagram.com": "instagram",
	"instagr.am": "instagram",
};

// Resolves the source type to store on an artifact at creation time.
// `hint` covers origins that can't be inferred from a URL (photo library, files).
export function resolveSourceType(
	sourceUrl: string | undefined,
	hint: "gallery" | "files" | "richtext" | undefined,
): SourceType {
	if (hint) return hint;
	if (!sourceUrl) return undefined;

	try {
		const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "");
		if (SOURCE_TYPE_BY_HOST[hostname]) return SOURCE_TYPE_BY_HOST[hostname];
		if (
			hostname.endsWith(".cdninstagram.com") ||
			hostname === "cdninstagram.com"
		) {
			return "instagram";
		}
		return "link";
	} catch {
		return "link";
	}
}
