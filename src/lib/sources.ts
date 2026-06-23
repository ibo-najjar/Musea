// lib/sources.ts
import * as simpleIcons from "simple-icons";

type SourceConfig = {
	key: string;
	label: string;
	svgPath: string; // the icon's SVG path data
	color: string; // brand color, hex
};

const UNKNOWN_SOURCE: SourceConfig = {
	key: "web",
	label: "Web",
	svgPath: simpleIcons.siGooglechrome.path, // or any generic globe-ish fallback
	color: "#6B7280",
};

const SOURCE_BY_HOST: Record<string, SourceConfig> = {
	"pinterest.com": {
		key: "pinterest",
		label: "Pinterest",
		svgPath: simpleIcons.siPinterest.path,
		color: `#${simpleIcons.siPinterest.hex}`,
	},
	"pin.it": {
		key: "pinterest",
		label: "Pinterest",
		svgPath: simpleIcons.siPinterest.path,
		color: `#${simpleIcons.siPinterest.hex}`,
	},

	"x.com": {
		key: "x",
		label: "X",
		svgPath: simpleIcons.siX.path,
		color: `#${simpleIcons.siX.hex}`,
	},
	"twitter.com": {
		key: "x",
		label: "X",
		svgPath: simpleIcons.siX.path,
		color: `#${simpleIcons.siX.hex}`,
	},
	"t.co": {
		key: "x",
		label: "X",
		svgPath: simpleIcons.siX.path,
		color: `#${simpleIcons.siX.hex}`,
	},

	"youtube.com": {
		key: "youtube",
		label: "YouTube",
		svgPath: simpleIcons.siYoutube.path,
		color: `#${simpleIcons.siYoutube.hex}`,
	},
	"youtu.be": {
		key: "youtube",
		label: "YouTube",
		svgPath: simpleIcons.siYoutube.path,
		color: `#${simpleIcons.siYoutube.hex}`,
	},

	"reddit.com": {
		key: "reddit",
		label: "Reddit",
		svgPath: simpleIcons.siReddit.path,
		color: `#${simpleIcons.siReddit.hex}`,
	},
	"redd.it": {
		key: "reddit",
		label: "Reddit",
		svgPath: simpleIcons.siReddit.path,
		color: `#${simpleIcons.siReddit.hex}`,
	},

	"tiktok.com": {
		key: "tiktok",
		label: "TikTok",
		svgPath: simpleIcons.siTiktok.path,
		color: `#${simpleIcons.siTiktok.hex}`,
	},
	"vm.tiktok.com": {
		key: "tiktok",
		label: "TikTok",
		svgPath: simpleIcons.siTiktok.path,
		color: `#${simpleIcons.siTiktok.hex}`,
	},
	"vt.tiktok.com": {
		key: "tiktok",
		label: "TikTok",
		svgPath: simpleIcons.siTiktok.path,
		color: `#${simpleIcons.siTiktok.hex}`,
	},
};

export function getSourceFromUrl(url: string | undefined | null): SourceConfig {
	if (!url) return UNKNOWN_SOURCE;
	try {
		const hostname = new URL(url).hostname.replace(/^www\./, "");
		return SOURCE_BY_HOST[hostname] ?? UNKNOWN_SOURCE;
	} catch {
		return UNKNOWN_SOURCE;
	}
}
