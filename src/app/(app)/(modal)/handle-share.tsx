import { useShareIntentContext } from "expo-share-intent";
import { useRouter } from "expo-router";
import { Spinner } from "heroui-native";
import { useEffect } from "react";
import { View } from "react-native";

export default function HandleShareScreen() {
	const { hasShareIntent, shareIntent } = useShareIntentContext();
	const router = useRouter();

	useEffect(() => {
		if (!hasShareIntent) return;

		const value = shareIntent.webUrl ?? shareIntent.text ?? "";
		if (value) {
			router.replace({
				pathname: "/(app)/(modal)/add",
				params: { sharedUrl: value },
			});
		}
	}, [hasShareIntent, shareIntent]);

	return (
		<View className="flex-1 items-center justify-center">
			<Spinner size="lg" />
		</View>
	);
}
