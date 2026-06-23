import { useIncomingShare } from "expo-sharing";
import { Spinner } from "heroui-native";
import { ActivityIndicator, View } from "react-native";
import Image from "@/components/ui/image";
import { Text } from "@/components/ui/text";

export default function HandleShareScreen() {
	const { resolvedSharedPayloads, isResolving } = useIncomingShare();
	if (isResolving) {
		return (
			<View className="flex-1 justify-center items-center">
				<Spinner size="lg" />
			</View>
		);
	}
	return (
		<View className="flex-1 justify-center items-center">
			{resolvedSharedPayloads.map((payload, index) => {
				if (payload.contentType === "image") {
					return (
						<Image
							source={{ uri: payload.contentUri }}
							style={{ width: 200, height: 200 }}
							key={index.toString()}
						/>
					);
				}
				return null;
			})}
		</View>
	);
}
