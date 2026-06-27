import { Typography } from "heroui-native";
import Animated, {
	Extrapolation,
	interpolate,
	type SharedValue,
	useAnimatedStyle,
} from "react-native-reanimated";
import { SLIDE_COPY, SW } from "./constants";

export function SlideTextItem({
	index,
	scrollX,
}: {
	index: number;
	scrollX: SharedValue<number>;
}) {
	const style = useAnimatedStyle(() => {
		const p = scrollX.value / SW;
		const opacity = interpolate(
			p,
			[index - 0.4, index, index + 0.4],
			[0, 1, 0],
			Extrapolation.CLAMP,
		);
		const tx = interpolate(
			p,
			[index - 1, index, index + 1],
			[40, 0, -40],
			Extrapolation.CLAMP,
		);
		return { opacity, transform: [{ translateX: tx }] };
	});

	return (
		<Animated.View
			style={[
				{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					alignItems: "center",
					gap: 8,
				},
				style,
			]}
			pointerEvents="none"
		>
			<Typography.Heading type="h1" weight="bold" className="text-center">
				{SLIDE_COPY[index].headline}
			</Typography.Heading>
			<Typography.Paragraph color="muted" className="text-center">
				{SLIDE_COPY[index].tagline}
			</Typography.Paragraph>
		</Animated.View>
	);
}
