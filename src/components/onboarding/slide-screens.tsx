import { SymbolView } from "expo-symbols";
import {
	cn,
	Separator,
	Skeleton,
	SkeletonGroup,
	Spinner,
	Typography,
	useThemeColor,
} from "heroui-native";
import { useState } from "react";
import { View } from "react-native";
import Animated, {
	Extrapolation,
	interpolate,
	type SharedValue,
	useAnimatedReaction,
	useAnimatedStyle,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useUniwind } from "uniwind";
import { AnimatedSearchQuery } from "@/components/animated-search-query";
import { BlurGlass } from "@/components/ui/blur-glass";
import Image from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { SW } from "./constants";
import { OnboardingCard } from "./onboarding-card";
import { RippleRing, usePagedLoop } from "./ripple-ring";
import { ShareItemWrapper, ShareScreenItem } from "./share-sheet";

function SlideScreen1(_: { scrollX: SharedValue<number>; index: number }) {
	const { theme } = useUniwind();
	const isDark = theme === "dark";

	return (
		<View className="relative flex-1 flex-row items-center justify-center gap-1.5 px-5 pt-12">
			<View className="h-full w-1/2 gap-1">
				<OnboardingCard source={require("@/assets/onboarding/card2.png")} />
				<OnboardingCard source={require("@/assets/onboarding/card3.png")} />
				<OnboardingCard
					isGlass
					source={
						isDark
							? require("@/assets/onboarding/card1-dark.png")
							: require("@/assets/onboarding/card1.png")
					}
				/>
				<OnboardingCard source={require("@/assets/onboarding/card4.png")} />
				<OnboardingCard source={require("@/assets/onboarding/card5.png")} />
			</View>
			<View className="h-full w-1/2 gap-2">
				<OnboardingCard source={require("@/assets/onboarding/card6.png")} />
				<OnboardingCard source={require("@/assets/onboarding/card7.png")} />
				<OnboardingCard
					isGlass
					source={
						isDark
							? require("@/assets/onboarding/card8-dark.png")
							: require("@/assets/onboarding/card8.png")
					}
				/>
				<OnboardingCard source={require("@/assets/onboarding/card9.png")} />
				<OnboardingCard source={require("@/assets/onboarding/card10.png")} />
			</View>
		</View>
	);
}

function SlideScreen2({
	scrollX,
	index,
}: {
	scrollX: SharedValue<number>;
	index: number;
}) {
	const foreground = useThemeColor("foreground");
	const danger = useThemeColor("danger");
	const ringColor = useThemeColor("background-inverse");

	const progress = usePagedLoop(scrollX, index, 1, 4000);

	const sheetStyle = useAnimatedStyle(() => ({
		transform: [
			{
				translateY: interpolate(
					progress.value,
					[0.18, 0.3, 0.69, 0.78],
					[325, 0, 0, 325],
					Extrapolation.CLAMP,
				),
			},
		],
	}));

	return (
		<View className="relative flex-1 flex-col items-center gap-1.5 bg-surface pt-8">
			<View className="h-[270] w-full bg-surface-tertiary">
				<Image
					source={require("@/assets/onboarding/card9.png")}
					style={{ width: "100%", height: "100%" }}
					contentFit="contain"
				/>
			</View>
			<View className="w-full flex-row items-center justify-between gap-4 px-5">
				<View className="flex-row items-center gap-3">
					<View className="flex-row items-center gap-1">
						<SymbolView
							name="heart.fill"
							size={20}
							tintColor={danger}
							weight="medium"
						/>
						<Text className="font-medium text-xs">45</Text>
					</View>
					<View className="flex-row items-center gap-1">
						<SymbolView
							name="bubble"
							size={20}
							tintColor={foreground}
							weight="medium"
						/>
					</View>
				</View>
				<View style={{ alignItems: "center", justifyContent: "center" }}>
					<RippleRing
						progress={progress}
						startAt={0}
						endAt={0.15}
						size={28}
						radius={14}
						color={ringColor}
					/>
					<RippleRing
						progress={progress}
						startAt={0.04}
						endAt={0.19}
						size={28}
						radius={14}
						color={ringColor}
					/>
					<SymbolView
						name="square.and.arrow.up"
						size={20}
						tintColor={foreground}
						weight="medium"
					/>
				</View>
			</View>
			<View className="flex-1 flex-row items-center justify-center gap-1.5 px-7 pt-2">
				<View className="h-full w-1/2 gap-1">
					<OnboardingCard source={require("@/assets/onboarding/card2.png")} />
					<OnboardingCard source={require("@/assets/onboarding/card3.png")} />
					<OnboardingCard source={require("@/assets/onboarding/card4.png")} />
				</View>
				<View className="h-full w-1/2 gap-2">
					<OnboardingCard source={require("@/assets/onboarding/card6.png")} />
					<OnboardingCard source={require("@/assets/onboarding/card7.png")} />
				</View>
			</View>
			<Animated.View
				style={[
					{ position: "absolute", bottom: 16, left: 16, right: 16 },
					sheetStyle,
				]}
			>
				<BlurGlass style={{ borderRadius: 32, padding: 16 }} intensity={50}>
					<View className="flex-row items-center gap-2">
						<ShareScreenItem
							imageSource={require("@/assets/onboarding/card9.png")}
						/>
						<Typography.Heading className="max-w-32 text-sm">
							Rich Text Design
						</Typography.Heading>
					</View>
					<Separator className="my-4 bg-default-soft" />
					<View className="flex-row items-center gap-5">
						<ShareItemWrapper label="Notes">
							<ShareScreenItem
								imageSource={require("@/assets/onboarding/social/notes.png")}
							/>
						</ShareItemWrapper>
						<ShareItemWrapper label="Musea">
							<View style={{ alignItems: "center", justifyContent: "center" }}>
								<RippleRing
									progress={progress}
									startAt={0.32}
									endAt={0.48}
									size={48}
									radius={16}
									color={ringColor}
								/>
								<RippleRing
									progress={progress}
									startAt={0.36}
									endAt={0.52}
									size={48}
									radius={16}
									color={ringColor}
								/>
								<ShareScreenItem
									imageSource={require("@/assets/images/app-icon.png")}
								/>
							</View>
						</ShareItemWrapper>
						<ShareItemWrapper label="Reminders">
							<ShareScreenItem
								imageSource={require("@/assets/onboarding/social/reminders.png")}
							/>
						</ShareItemWrapper>
						<ShareItemWrapper label="More">
							<ShareScreenItem icon="ellipsis" />
						</ShareItemWrapper>
					</View>
					<Separator className="my-4 bg-default-soft" />
					<View className="flex-row items-center gap-5">
						<ShareItemWrapper label="Copy">
							<ShareScreenItem icon="document.on.document" fullRounded />
						</ShareItemWrapper>
						<ShareItemWrapper label="Save">
							<ShareScreenItem icon="square.and.arrow.down" fullRounded />
						</ShareItemWrapper>
						<ShareItemWrapper label="Assign to Contact">
							<ShareScreenItem icon="person.circle.fill" fullRounded />
						</ShareItemWrapper>
						<ShareItemWrapper label="More">
							<ShareScreenItem icon="ellipsis" fullRounded />
						</ShareItemWrapper>
					</View>
				</BlurGlass>
			</Animated.View>
		</View>
	);
}

function Screen3Skeleton({ className }: { className?: string }) {
	const surface = useThemeColor("surface");

	return (
		<Skeleton
			className={cn("h-32 rounded-2xl bg-surface-secondary", className)}
			variant="shimmer"
			animation={{ shimmer: { highlightColor: surface } }}
		/>
	);
}

function SlideScreen3({
	scrollX,
	index,
}: {
	scrollX: SharedValue<number>;
	index: number;
}) {
	const foreground = useThemeColor("foreground");
	const muted = useThemeColor("muted");

	const [isActive, setIsActive] = useState(false);
	useAnimatedReaction(
		() => Math.round(scrollX.value / SW) === index,
		(active, was) => {
			if (active !== was) scheduleOnRN(setIsActive, active);
		},
	);

	return (
		<View className="flex-1 px-5">
			<View className="flex-row items-center gap-3 pt-16">
				<BlurGlass className="h-9 flex-1 justify-center rounded-2xl bg-surface-secondary px-2">
					<AnimatedSearchQuery active={isActive} color={foreground} />
				</BlurGlass>
				<BlurGlass className="h-9 w-9 items-center justify-center rounded-2xl bg-surface-secondary">
					{isActive && <Spinner size="sm" color={muted} />}
				</BlurGlass>
			</View>
			<SkeletonGroup
				isLoading={isActive}
				isSkeletonOnly
				className="flex-1 flex-row items-center justify-center gap-1.5 pt-3"
			>
				<View className="h-full w-1/2 gap-1">
					<Screen3Skeleton />
					<Screen3Skeleton className="h-16" />
					<Screen3Skeleton className="h-24" />
				</View>
				<View className="h-full w-1/2 gap-2">
					<Screen3Skeleton className="h-16" />
					<Screen3Skeleton className="h-32" />
					<Screen3Skeleton className="h-24" />
				</View>
			</SkeletonGroup>
		</View>
	);
}

export const SLIDE_SCREENS = [SlideScreen1, SlideScreen2, SlideScreen3];
