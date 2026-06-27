import { View } from "react-native";
import Animated, {
	Extrapolation,
	interpolate,
	type SharedValue,
	useAnimatedStyle,
} from "react-native-reanimated";
import Image from "@/components/ui/image";
import { PHONE_H, PHONE_W, SW } from "./constants";

const FLOATING_ICONS = [
	// ── left column ──
	{
		size: 120,
		top: 20,
		left: -55,
		rotate: "15deg",
		scatterX: -160,
		scatterY: -100,
		source: require("@/assets/onboarding/social/safari.png"),
	},
	{
		size: 110,
		top: 100,
		left: -44,
		rotate: "-10deg",
		scatterX: -180,
		scatterY: -40,
		source: require("@/assets/onboarding/social/pinterest.png"),
	},
	{
		size: 120,
		top: 190,
		left: -60,
		rotate: "-2deg",
		scatterX: -200,
		scatterY: 0,
		source: require("@/assets/onboarding/social/insta.png"),
	},
	{
		size: 110,
		top: 310,
		left: -50,
		rotate: "12deg",
		scatterX: -180,
		scatterY: 60,
		source: require("@/assets/onboarding/social/tiktok.png"),
	},
	{
		size: 100,
		top: 390,
		left: -48,
		rotate: "1deg",
		scatterX: -160,
		scatterY: 100,
		source: require("@/assets/onboarding/social/facebook.png"),
	},
	{
		size: 110,
		top: 470,
		left: -48,
		rotate: "-30deg",
		scatterX: -130,
		scatterY: 140,
		source: require("@/assets/onboarding/social/goodreads.png"),
	},
	// ── right column ──
	{
		size: 104,
		top: 20,
		left: PHONE_W - 66,
		rotate: "-40deg",
		scatterX: 160,
		scatterY: -100,
		source: require("@/assets/onboarding/social/tumblr.png"),
	},
	{
		size: 90,
		top: 100,
		left: PHONE_W - 60,
		rotate: "-15deg",
		scatterX: 180,
		scatterY: -40,
		source: require("@/assets/onboarding/social/x.png"),
	},
	{
		size: 138,
		top: 170,
		left: PHONE_W - 74,
		rotate: "-4deg",
		scatterX: 200,
		scatterY: 0,
		source: require("@/assets/onboarding/social/yt.png"),
	},
	{
		size: 120,
		top: 280,
		left: PHONE_W - 54,
		rotate: "24deg",
		scatterX: 180,
		scatterY: 60,
		source: require("@/assets/onboarding/social/spotify.png"),
	},
	{
		size: 100,
		top: 370,
		left: PHONE_W - 54,
		rotate: "-24deg",
		scatterX: 160,
		scatterY: 100,
		source: require("@/assets/onboarding/social/reddit.png"),
	},
	{
		size: 120,
		top: 450,
		left: PHONE_W - 74,
		rotate: "44deg",
		scatterX: 130,
		scatterY: 140,
		source: require("@/assets/onboarding/social/threads.png"),
	},
] as const;

function FloatingIcon({
	icon,
	scrollX,
}: {
	icon: (typeof FLOATING_ICONS)[number];
	scrollX: SharedValue<number>;
}) {
	const style = useAnimatedStyle(() => {
		const p = scrollX.value / SW;
		const opacity = interpolate(
			p,
			[-0.5, 0, 0.4],
			[0, 1, 0],
			Extrapolation.CLAMP,
		);
		const tx = interpolate(p, [0, 1], [0, icon.scatterX], Extrapolation.CLAMP);
		const ty = interpolate(p, [0, 1], [0, icon.scatterY], Extrapolation.CLAMP);
		return {
			opacity,
			transform: [
				{ rotate: icon.rotate },
				{ translateX: tx },
				{ translateY: ty },
			],
		};
	});

	return (
		<Animated.View
			style={[
				{
					position: "absolute",
					width: icon.size,
					height: icon.size,
					top: icon.top,
					left: icon.left,
				},
				style,
			]}
			className="overflow-hidden rounded-3xl border-continuous shadow-2xl"
		>
			<Image
				source={icon.source}
				style={{ width: "100%", height: "100%" }}
				contentFit="contain"
			/>
		</Animated.View>
	);
}

export function Slide1FloatingIcons({
	scrollX,
}: {
	scrollX: SharedValue<number>;
}) {
	return (
		<View
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				width: PHONE_W,
				height: PHONE_H,
			}}
			pointerEvents="none"
		>
			{FLOATING_ICONS.map((icon, i) => (
				<FloatingIcon key={i.toString()} icon={icon} scrollX={scrollX} />
			))}
		</View>
	);
}
