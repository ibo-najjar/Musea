/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

// Synced from heroui-native's variables.css (foreground/background/surface/surface-secondary/muted)
export const Colors = {
	light: {
		text: "#18181b",
		background: "#f5f5f5",
		backgroundElement: "#ffffff",
		backgroundSelected: "#efeff0",
		textSecondary: "#71717a",
	},
	dark: {
		text: "#fcfcfc",
		background: "#060607",
		backgroundElement: "#18181b",
		backgroundSelected: "#232325",
		textSecondary: "#9f9fa9",
	},
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
	ios: {
		/** iOS `UIFontDescriptorSystemDesignDefault` */
		sans: "system-ui",
		/** iOS `UIFontDescriptorSystemDesignSerif` */
		serif: "ui-serif",
		/** iOS `UIFontDescriptorSystemDesignRounded` */
		rounded: "ui-rounded",
		/** iOS `UIFontDescriptorSystemDesignMonospaced` */
		mono: "ui-monospace",
	},
	default: {
		sans: "normal",
		serif: "serif",
		rounded: "normal",
		mono: "monospace",
	},
	web: {
		sans: "var(--font-display)",
		serif: "var(--font-serif)",
		rounded: "var(--font-rounded)",
		mono: "var(--font-mono)",
	},
});

export const Spacing = {
	half: 2,
	one: 4,
	two: 8,
	three: 16,
	four: 24,
	five: 32,
	six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
