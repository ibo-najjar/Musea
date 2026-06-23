import type { ConfigContext, ExpoConfig } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) return "com.ibonajjar.starterai.dev";
  if (IS_PREVIEW) return "com.ibonajjar.starterai.preview";
  return "com.ibonajjar.starterai";
};

const getAppName = () => {
  if (IS_DEV) return "starterai Dev";
  if (IS_PREVIEW) return "starterai Preview";
  return "starterai";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "starterai",
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
