import { Text } from "@/components/ui/text";

// Non-iOS fallback. The app is iOS-only; this exists so web/Android bundles
// never import `@expo/ui/swift-ui`. Renders the first phrase statically.
export function AnimatedSearchQuery(_: { active: boolean; color: string }) {
	return <Text className="text-sm">a sunset I saved last summer</Text>;
}
