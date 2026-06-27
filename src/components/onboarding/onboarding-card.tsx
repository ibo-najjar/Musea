import { useState } from "react";
import { View } from "react-native";
import { GlassView } from "@/components/ui/apple-glass-view";
import Image from "@/components/ui/image";

export function OnboardingCard({
	source,
	isGlass = false,
}: {
	source?: number;
	isGlass?: boolean;
}) {
	const [ratio, setRatio] = useState<number | undefined>();
	const style = ratio ? { aspectRatio: ratio } : { height: 80 };

	if (isGlass) {
		return (
			<GlassView className="w-full overflow-hidden rounded-2xl" style={style}>
				{source ? (
					<Image
						source={source}
						className="h-full w-full"
						contentFit="cover"
						onLoad={(e) => setRatio(e.source.width / e.source.height)}
					/>
				) : null}
			</GlassView>
		);
	}

	return (
		<View className="w-full overflow-hidden rounded-2xl" style={style}>
			{source ? (
				<Image
					source={source}
					className="h-full w-full"
					contentFit="cover"
					onLoad={(e) => setRatio(e.source.width / e.source.height)}
				/>
			) : null}
		</View>
	);
}
