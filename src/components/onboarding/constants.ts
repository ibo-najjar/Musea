import { Dimensions } from "react-native";

export const { width: SW, height: SH } = Dimensions.get("window");

export const SLIDES = [{ id: 0 }, { id: 1 }, { id: 2 }] as const;

export const PHONE_H = SH * 0.72;
export const PHONE_W = PHONE_H * (220 / 445);

export const SLIDE_COPY = [
	{
		headline: "ALL YOUR BOOKMARKS IN ONE PLACE.",
		tagline: "If you can share it, you can save it.",
	},
	{
		headline: "ONE TAP. AUTO-ORGANIZED.",
		tagline: "No folders. No tagging. Musea puts it in the right place.",
	},
	{
		headline: "SEARCH LIKE YOU THINK.",
		tagline: "Describe what you remember. We'll find it.",
	},
] as const;
