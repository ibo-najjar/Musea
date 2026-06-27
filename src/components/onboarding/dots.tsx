import { useThemeColor } from "heroui-native";
import { View } from "react-native";
import Animated, {
	type SharedValue,
	useAnimatedStyle,
	useDerivedValue,
	withTiming,
} from "react-native-reanimated";
import { SLIDES, SW } from "./constants";

function Dot({
	index,
	activeIndex,
}: {
	index: number;
	activeIndex: SharedValue<number>;
}) {
	const primary = useThemeColor("accent");
	const muted = useThemeColor("border");

	const style = useAnimatedStyle(() => ({
		backgroundColor: withTiming(activeIndex.value === index ? primary : muted, {
			duration: 200,
		}),
	}));

	return <Animated.View className="h-2 w-2 rounded-full" style={style} />;
}

export function OnboardingDots({ scrollX }: { scrollX: SharedValue<number> }) {
	const activeIndex = useDerivedValue(() => Math.round(scrollX.value / SW));

	return (
		<View className="flex-row items-center justify-center gap-1.5">
			{SLIDES.map((s) => (
				<Dot key={s.id} index={s.id} activeIndex={activeIndex} />
			))}
		</View>
	);
}
