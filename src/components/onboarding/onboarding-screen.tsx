import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";
import Animated, {
	Extrapolation,
	interpolate,
	useAnimatedRef,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../ui/button";
import { SH, SLIDES, SW } from "./constants";
import { OnboardingDots } from "./dots";
import { OnboardingButtons } from "./onboarding-buttons";
import { OnboardingPhone } from "./onboarding-phone";
import { SlideTextItem } from "./slide-text";

export function OnboardingScreen() {
	const [screenH, setScreenH] = useState(SH);
	const scrollX = useSharedValue(0);
	const flatListRef =
		useAnimatedRef<Animated.FlatList<(typeof SLIDES)[number]>>();

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (e) => {
			scrollX.value = e.contentOffset.x;
		},
	});

	const handleContinue = () => {
		const currentIndex = Math.round(scrollX.value / SW);
		const nextIndex = Math.min(currentIndex + 1, SLIDES.length - 1);
		flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
	};

	const handleSkip = () => {
		flatListRef.current?.scrollToIndex({
			index: SLIDES.length - 1,
			animated: true,
		});
	};

	const handleBack = () => {
		const currentIndex = Math.round(scrollX.value / SW);
		const prevIndex = Math.max(currentIndex - 1, 0);
		flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
	};

	const backStyle = useAnimatedStyle(() => ({
		opacity: interpolate(
			scrollX.value / SW,
			[0, 1],
			[0, 1],
			Extrapolation.CLAMP,
		),
	}));

	const skipStyle = useAnimatedStyle(() => ({
		opacity: interpolate(
			scrollX.value / SW,
			[SLIDES.length - 2, SLIDES.length - 1],
			[1, 0],
			Extrapolation.CLAMP,
		),
	}));

	const { top } = useSafeAreaInsets();

	const foreground = useThemeColor("foreground");

	return (
		<View
			className="flex-1 overflow-hidden bg-background"
			onLayout={(e) => setScreenH(e.nativeEvent.layout.height)}
		>
			<MaskedView
				style={{ width: "100%", height: "100%" }}
				maskElement={
					<LinearGradient
						style={{ flex: 1 }}
						colors={["transparent", "black", "black", "transparent"]}
						locations={[0, 0.2, 0.6, 0.9]}
					/>
				}
			>
				<OnboardingPhone scrollX={scrollX} />
			</MaskedView>

			<View
				style={{ position: "absolute", bottom: 100, left: 32, right: 32 }}
				pointerEvents="none"
			>
				{SLIDES.map((s) => (
					<SlideTextItem key={s.id} index={s.id} scrollX={scrollX} />
				))}
			</View>

			<Animated.FlatList
				ref={flatListRef}
				style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
				data={SLIDES}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				renderItem={() => <View style={{ width: SW, height: screenH }} />}
				keyExtractor={(item) => String(item.id)}
				getItemLayout={(_, index) => ({
					length: SW,
					offset: SW * index,
					index,
				})}
			/>

			<View
				style={{
					top: top,
				}}
				className="absolute right-0 left-0 flex-row items-center justify-between px-4"
				pointerEvents="box-none"
			>
				<Animated.View
					style={backStyle}
					className="w-20 items-start justify-center"
					pointerEvents="box-none"
				>
					<Button size="sm" variant="ghost" onPress={handleBack}>
						<SymbolView
							name={"chevron.left"}
							size={16}
							tintColor={foreground}
							weight="semibold"
						/>
					</Button>
				</Animated.View>
				<OnboardingDots scrollX={scrollX} />
				<Animated.View
					style={skipStyle}
					className="w-16 items-center justify-center"
					pointerEvents="box-none"
				>
					<Button size="sm" variant="ghost" onPress={handleSkip}>
						Skip
					</Button>
				</Animated.View>
			</View>

			<OnboardingButtons scrollX={scrollX} onContinue={handleContinue} />
		</View>
	);
}
