import Animated, {
	cancelAnimation,
	Easing,
	Extrapolation,
	interpolate,
	type SharedValue,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { SW } from "./constants";

export function RippleRing({
	progress,
	startAt,
	endAt,
	size,
	radius,
	color,
}: {
	progress: SharedValue<number>;
	startAt: number;
	endAt: number;
	size: number;
	radius: number;
	color: string;
}) {
	const style = useAnimatedStyle(() => {
		const p = interpolate(
			progress.value,
			[startAt, endAt],
			[0, 1],
			Extrapolation.CLAMP,
		);
		return {
			opacity: interpolate(p, [0, 0.2, 1], [0, 0.7, 0]),
			transform: [{ scale: interpolate(p, [0, 1], [1, 2.5]) }],
		};
	});

	return (
		<Animated.View
			pointerEvents="none"
			style={[
				{
					position: "absolute",
					width: size,
					height: size,
					borderRadius: radius,
					borderWidth: 2,
					borderColor: color,
				},
				style,
			]}
		/>
	);
}

// Animates 0→`to` on a loop, but only while this slide is the current page.
export function usePagedLoop(
	scrollX: SharedValue<number>,
	index: number,
	to: number,
	duration: number,
) {
	const value = useSharedValue(0);

	useAnimatedReaction(
		() => Math.round(scrollX.value / SW) === index,
		(isActive, was) => {
			if (isActive === was) return;
			if (isActive) {
				value.value = 0;
				value.value = withRepeat(
					withTiming(to, { duration, easing: Easing.linear }),
					-1,
				);
			} else {
				cancelAnimation(value);
				value.value = 0;
			}
		},
	);

	return value;
}
