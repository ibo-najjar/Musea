import { getShareExtensionKey } from "expo-share-intent";

export async function redirectSystemPath({
	path,
	initial,
}: {
	path: string;
	initial: boolean;
}) {
	try {
		console.log("Checking for shared payloads...", path, initial);
		if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
			return "/(app)/(modal)/handle-share";
		}
		return path;
	} catch {
		return "/";
	}
}
