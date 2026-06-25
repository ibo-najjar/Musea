import type { ConfigContext, ExpoConfig } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
	if (IS_DEV) return "com.ibonajjar.musea.dev";
	if (IS_PREVIEW) return "com.ibonajjar.musea.preview";
	return "com.ibonajjar.musea";
};

const getAppName = () => {
	if (IS_DEV) return "Musea Dev";
	if (IS_PREVIEW) return "Musea Preview";
	return "Musea";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
	...config,
	name: getAppName(),
	slug: "musea",
	version: "0.0.1",
	ios: {
		...config.ios,
		bundleIdentifier: getUniqueIdentifier(),
	},
	android: {
		...config.android,
		package: getUniqueIdentifier(),
	},
});
