import { GlassView as EXGlassView } from "expo-glass-effect";
import Animated, {
	Extrapolation,
	interpolate,
	type SharedValue,
	useAnimatedStyle,
} from "react-native-reanimated";
import { useUniwind } from "uniwind";
import { GlassView } from "@/components/ui/apple-glass-view";
import Image from "@/components/ui/image";
import { PHONE_H, PHONE_W, SH, SLIDES, SW } from "./constants";
import { Slide1FloatingIcons } from "./floating-icons";
import { SLIDE_SCREENS } from "./slide-screens";

function PhoneScreen({
	index,
	scrollX,
}: {
	index: number;
	scrollX: SharedValue<number>;
}) {
	const { theme } = useUniwind();

	const style = useAnimatedStyle(() => {
		const p = scrollX.value / SW;
		const opacity = interpolate(
			p,
			[index - 0.5, index, index + 0.5],
			[0, 1, 0],
			Extrapolation.CLAMP,
		);
		return { opacity };
	});

	const ScreenContent = SLIDE_SCREENS[index];

	return (
		<Animated.View
			style={[
				{
					position: "absolute",
					top: 5,
					left: 7,
					right: 7,
					bottom: 7,
					borderRadius: 47,
					overflow: "hidden",
				},
				style,
			]}
		>
			<EXGlassView
				style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
				glassEffectStyle="regular"
			/>
			<ScreenContent scrollX={scrollX} index={index} />
			<Image
				source={
					theme === "dark"
						? require("@/assets/onboarding/statusbar-dark.png")
						: require("@/assets/onboarding/statusbar.png")
				}
				style={{
					position: "absolute",
					top: 2,
					left: 0,
					right: 0,
					width: "100%",
					height: 40,
				}}
			/>
		</Animated.View>
	);
}

export function OnboardingPhone({ scrollX }: { scrollX: SharedValue<number> }) {
	const phoneStyle = useAnimatedStyle(() => {
		const p = scrollX.value / SW;

		const scale = interpolate(
			p,
			[0, 1, 2],
			[0.72, 1.1, 1.1],
			Extrapolation.CLAMP,
		);
		const translateY = interpolate(
			p,
			[0, 1, 2],
			[0, -(SH * 0.18), SH * 0.38],
			Extrapolation.CLAMP,
		);

		return { transform: [{ scale }, { translateY }] };
	});

	return (
		<Animated.View
			style={[
				{
					width: PHONE_W,
					height: PHONE_H,
					position: "absolute",
					alignSelf: "center",
					top: (SH - PHONE_H) / 2 - 100,
				},
				phoneStyle,
			]}
		>
			<GlassView
				style={{
					position: "absolute",
					borderRadius: 54,
					bottom: 7,
					right: 7,
					left: 7,
					top: 5,
				}}
			/>
			<Slide1FloatingIcons scrollX={scrollX} />
			{SLIDES.map((s) => (
				<PhoneScreen key={s.id} index={s.id} scrollX={scrollX} />
			))}
			<Image
				source={require("@/assets/onboarding/iphone16pro.png")}
				style={{ width: "100%", height: "100%", position: "absolute" }}
			/>
		</Animated.View>
	);
}
