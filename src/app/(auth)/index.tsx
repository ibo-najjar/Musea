import MaskedView from "@react-native-masked-view/masked-view";
import { useClock } from "@shopify/react-native-skia";
import * as AppleAuthentication from "expo-apple-authentication";
import { GlassView as EXGlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { router, useRouter } from "expo-router";
import { type SFSymbol, SymbolView } from "expo-symbols";
import {
	cn,
	ScrollShadow,
	Separator,
	Spinner,
	Typography,
	useThemeColor,
	useToast,
} from "heroui-native";
import { useState } from "react";
import { Alert, Dimensions, TextInput, View } from "react-native";
import Animated, {
	Extrapolation,
	interpolate,
	type SharedValue,
	useAnimatedRef,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import * as simpleIcons from "simple-icons";
import { useUniwind } from "uniwind";
import { SourceIcon } from "@/components/source-icon";
import { GlassView } from "@/components/ui/apple-glass-view";
import { BlurGlass } from "@/components/ui/blur-glass";
import { Button } from "@/components/ui/button";
import Image from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";

const { width: SW, height: SH } = Dimensions.get("window");

const SLIDES = [{ id: 0 }, { id: 1 }, { id: 2 }] as const;

// Phone height in "natural" units — determines how much overflows top/bottom
const PHONE_H = SH * 0.72;
const PHONE_W = PHONE_H * (220 / 445);

// ─── Per-slide screen content ─────────────────────────────────────────────────

const Screen1Card = ({
	source,
	isGlass = false,
}: {
	source?: number;
	isGlass?: boolean;
}) => {
	const [ratio, setRatio] = useState<number | undefined>();

	if (isGlass) {
		return (
			<GlassView
				className="w-full overflow-hidden rounded-2xl"
				style={ratio ? { aspectRatio: ratio } : { height: 80 }}
			>
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
		<View
			className="w-full overflow-hidden rounded-2xl"
			style={ratio ? { aspectRatio: ratio } : { height: 80 }}
		>
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
};

// scatterX/scatterY: how far each icon travels when scrolling away from slide 0.
// Left icons scatter left (negative X), right icons scatter right (positive X).
// Top icons scatter up (negative Y), bottom icons scatter down (positive Y).
const FLOATING_ICONS = [
	// ── left column ──
	{
		size: 120,
		bg: "#E1306C",
		top: 20,
		left: -55,
		rotate: "15deg",
		scatterX: -160,
		scatterY: -100,
		source: require("@/assets/onboarding/social/safari.png"),
	},
	{
		size: 110,
		bg: "#1DA1F2",
		top: 100,
		left: -44,
		rotate: "-10deg",
		scatterX: -180,
		scatterY: -40,
		source: require("@/assets/onboarding/social/pinterest.png"),
	},
	{
		size: 120,
		bg: "#FF0000",
		top: 190,
		left: -60,
		rotate: "-2deg",
		scatterX: -200,
		scatterY: 0,
		source: require("@/assets/onboarding/social/insta.png"),
	},
	{
		size: 110,
		bg: "#6441A5",
		top: 310,
		left: -50,
		rotate: "12deg",
		scatterX: -180,
		scatterY: 60,
		source: require("@/assets/onboarding/social/tiktok.png"),
	},
	{
		size: 100,
		bg: "#E60023",
		top: 390,
		left: -48,
		rotate: "1deg",
		scatterX: -160,
		scatterY: 100,
		source: require("@/assets/onboarding/social/facebook.png"),
	},
	{
		size: 110,
		bg: "#E60023",
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
		bg: "#0A66C2",
		top: 20,
		left: PHONE_W - 66,
		rotate: "-40deg",
		scatterX: 160,
		scatterY: -100,
		source: require("@/assets/onboarding/social/tumblr.png"),
	},
	{
		size: 90,
		bg: "#25D366",
		top: 100,
		left: PHONE_W - 60,
		rotate: "-15deg",
		scatterX: 180,
		scatterY: -40,
		source: require("@/assets/onboarding/social/x.png"),
	},
	{
		size: 138,
		bg: "#FF4500",
		top: 170,
		left: PHONE_W - 74,
		rotate: "-4deg",
		scatterX: 200,
		scatterY: 0,
		source: require("@/assets/onboarding/social/yt.png"),
	},
	{
		size: 120,
		bg: "#FF4500",
		top: 280,
		left: PHONE_W - 54,
		rotate: "24deg",
		scatterX: 180,
		scatterY: 60,
		source: require("@/assets/onboarding/social/spotify.png"),
	},
	{
		size: 100,
		bg: "#FF4500",
		top: 370,
		left: PHONE_W - 54,
		rotate: "-24deg",
		scatterX: 160,
		scatterY: 100,
		source: require("@/assets/onboarding/social/reddit.png"),
	},
	{
		size: 120,
		bg: "#FF4500",
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

function Slide1FloatingIcons({ scrollX }: { scrollX: SharedValue<number> }) {
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

function SlideScreen1() {
	const { theme } = useUniwind();
	const isDark = theme === "dark";
	return (
		<View className="relative flex-1 flex-row items-center justify-center gap-1.5 px-5 pt-12">
			<View className="h-full w-1/2 gap-1">
				<Screen1Card source={require("@/assets/onboarding/card2.png")} />
				<Screen1Card source={require("@/assets/onboarding/card3.png")} />
				<Screen1Card
					isGlass
					source={
						isDark
							? require("@/assets/onboarding/card1-dark.png")
							: require("@/assets/onboarding/card1.png")
					}
				/>
				<Screen1Card source={require("@/assets/onboarding/card4.png")} />
				<Screen1Card source={require("@/assets/onboarding/card5.png")} />
			</View>
			<View className="h-full w-1/2 gap-2">
				<Screen1Card source={require("@/assets/onboarding/card6.png")} />
				<Screen1Card source={require("@/assets/onboarding/card7.png")} />
				<Screen1Card
					isGlass
					source={
						isDark
							? require("@/assets/onboarding/card8-dark.png")
							: require("@/assets/onboarding/card8.png")
					}
				/>
				<Screen1Card source={require("@/assets/onboarding/card9.png")} />
				<Screen1Card source={require("@/assets/onboarding/card10.png")} />
			</View>
		</View>
	);
}

function RippleRing({
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

function SlideScreen2() {
	const foreground = useThemeColor("foreground");
	const danger = useThemeColor("danger");
	const ringColor = useThemeColor("background-inverse");

	const clock = useClock();
	const progress = useDerivedValue(() => (clock.value % 4000) / 4000, [clock]);

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

	const { theme } = useUniwind();

	const isDark = theme === "dark";

	return (
		<View className="relative flex-1 flex-col items-center gap-1.5 pt-8 bg-surface">
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
							name={"heart.fill"}
							size={20}
							tintColor={danger}
							weight={"medium"}
						/>
						<Text className="font-medium text-xs">45</Text>
					</View>
					<View className="flex-row items-center gap-1">
						<SymbolView
							name={"bubble"}
							size={20}
							tintColor={foreground}
							weight={"medium"}
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
						name={"square.and.arrow.up"}
						size={20}
						tintColor={foreground}
						weight={"medium"}
					/>
				</View>
			</View>
			<View className="flex-1 flex-row items-center justify-center gap-1.5 px-7 pt-2">
				<View className="h-full w-1/2 gap-1">
					<Screen1Card source={require("@/assets/onboarding/card2.png")} />
					<Screen1Card source={require("@/assets/onboarding/card3.png")} />

					<Screen1Card source={require("@/assets/onboarding/card4.png")} />
				</View>
				<View className="h-full w-1/2 gap-2">
					<Screen1Card source={require("@/assets/onboarding/card6.png")} />
					<Screen1Card source={require("@/assets/onboarding/card7.png")} />
				</View>
			</View>
			<Animated.View
				style={[
					{
						position: "absolute",
						bottom: 16,
						left: 16,
						right: 16,
					},
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

const ShareItemWrapper = ({
	children,
	label,
}: {
	children: React.ReactNode;
	label?: string;
}) => {
	return (
		<View className="items-center gap-1">
			{children}
			{label && (
				<Text className="h-8 max-w-10 text-center font-medium text-[10px]">
					{label}
				</Text>
			)}
		</View>
	);
};

const ShareScreenItem = ({
	imageSource,
	icon,
	fullRounded = false,
}: {
	imageSource?: number;
	icon?: SFSymbol;
	fullRounded?: boolean;
}) => {
	const foreground = useThemeColor("foreground");

	return (
		<View
			className={cn(
				"size-12 items-center justify-center overflow-hidden rounded-2xl bg-surface-secondary",
				fullRounded && "rounded-full",
			)}
		>
			{imageSource && (
				<Image
					source={imageSource}
					style={{ width: "100%", height: "100%" }}
					contentFit="cover"
				/>
			)}
			{icon && (
				<SymbolView
					name={icon}
					size={20}
					tintColor={foreground}
					weight={"medium"}
				/>
			)}
		</View>
	);
};

function SlideScreen3() {
	const foreground = useThemeColor("foreground");

	return (
		<View className="flex-1">
			<View className="absolute top-14 right-2 left-2 z-30">
				<View
					style={{
						flexDirection: "row",
						alignItems: "flex-end",
						gap: 8,
						paddingHorizontal: 12,
					}}
				>
					<BlurGlass
						style={{ flex: 1, borderRadius: 9999, flexDirection: "row" }}
					>
						<TextInput
							nativeID="composer"
							cursorColorClassName="tint-foreground"
							selectionColorClassName="tint-foreground"
							style={{ fontSize: 16 }}
							className="flex-1 pl-4 pr-2 py-2 text-foreground max-h-25"
							placeholder="Search anything..."
							multiline
							maxLength={1000}
						/>
					</BlurGlass>
					<BlurGlass
						style={{
							width: 36,
							height: 36,
							borderRadius: 18,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Spinner size="sm" color={foreground} />
					</BlurGlass>
				</View>
			</View>
		</View>
	);
}

const SLIDE_SCREENS = [SlideScreen1, SlideScreen2, SlideScreen3];

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
				glassEffectStyle={"regular"}
			/>
			<ScreenContent />
			<View className="absolute top-2 right-0 left-0 w-full">
				<Image
					source={
						theme === "dark"
							? require("@/assets/onboarding/statusbar-dark.png")
							: require("@/assets/onboarding/statusbar.png")
					}
					style={{ width: "100%", height: 40, top: 0 }}
				/>
			</View>
		</Animated.View>
	);
}

function OnboardingPhone({ scrollX }: { scrollX: SharedValue<number> }) {
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

// ─── Slide text ───────────────────────────────────────────────────────────────

const SLIDE_COPY = [
	{
		headline: "ALL YOUR BOOKMARKS IN ONE PLACE.",
		tagline: "Slide 1 tagline text goes here.",
	},
	{ headline: "SHARE IT. DONE!", tagline: "Slide 2 tagline text goes here." },
	{
		headline: "SEARCH LIKE YOU THINK.",
		tagline: "Slide 3 tagline text goes here.",
	},
] as const;

function SlideTextItem({
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
		</Animated.View>
	);
}

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
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

	return (
		<View
			className="flex-1 overflow-hidden bg-background"
			onLayout={(e) => setScreenH(e.nativeEvent.layout.height)}
		>
			<MaskedView
				style={{
					width: "100%",
					height: "100%",
				}}
				maskElement={
					// 2. Static Gradient - this never moves
					<LinearGradient
						style={{ flex: 1 }}
						colors={["black", "black", "transparent"]}
						locations={[0, 0.6, 0.9]} // Adjust 0.6 to control where the fade starts
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

			<OnboardingButtons
				scrollX={scrollX}
				onComplete={onComplete}
				onContinue={handleContinue}
			/>
		</View>
	);
}

// ─── Onboarding buttons ───────────────────────────────────────────────────────

function OnboardingButtons({
	scrollX,
	onComplete,
	onContinue,
}: {
	scrollX: SharedValue<number>;
	onComplete: () => void;
	onContinue: () => void;
}) {
	const router = useRouter();

	// Continue button exits downward as slide 3 approaches (1.5 → 2)
	const continueStyle = useAnimatedStyle(() => {
		const p = scrollX.value / SW;
		const ty = interpolate(p, [1.5, 2], [0, 200], Extrapolation.CLAMP);
		const opacity = interpolate(p, [1.5, 2], [1, 0], Extrapolation.CLAMP);
		return { transform: [{ translateY: ty }], opacity };
	});

	// Top block (title + body + cta) enters from above halfway into last scroll (1.5 → 2)
	const topBlockStyle = useAnimatedStyle(() => {
		const p = scrollX.value / SW;
		const ty = interpolate(p, [1.5, 2], [-300, 0], Extrapolation.CLAMP);
		const opacity = interpolate(p, [1.5, 2], [0, 1], Extrapolation.CLAMP);
		return { transform: [{ translateY: ty }], opacity };
	});

	const foreground = useThemeColor("foreground");

	const signInWithApple = async () => {
		try {
			const credential = await AppleAuthentication.signInAsync({
				requestedScopes: [
					AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
					AppleAuthentication.AppleAuthenticationScope.EMAIL,
				],
			});
			if (!credential.identityToken) throw new Error("No identity token");
			await authClient.signIn.social(
				{ provider: "apple", idToken: { token: credential.identityToken } },
				{
					onError: () => {
						// toast.show({
						// 	label: "Sign in failed. Please try again.",
						// 	variant: "danger",
						// 	icon: (
						// 		<SymbolView
						// 			name={"exclamationmark"}
						// 			size={20}
						// 			tintColor={danger}
						// 		/>
						// 	),
						// });
					},
					onSuccess: () => router.replace("/(app)/(tabs)"),
				},
			);
		} catch (e: any) {
			if (e.code !== "ERR_REQUEST_CANCELED") Alert.alert("Error", e.message);
		}
	};
	return (
		<View
			style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
			pointerEvents="box-none"
		>
			<Animated.View
				style={[
					{ position: "absolute", bottom: 30, left: 32, right: 32 },
					continueStyle,
				]}
			>
				<Button
					variant="primary"
					className="w-full"
					// size="sm"
					onPress={onContinue}
				>
					Continue
				</Button>
			</Animated.View>

			<Animated.View
				style={[
					{ position: "absolute", top: 130, left: 32, right: 32, gap: 16 },
					topBlockStyle,
				]}
			>
				<Typography.Heading type="h2" weight="bold" className="text-center">
					Welcome to Musea
				</Typography.Heading>
				<AppleAuthentication.AppleAuthenticationButton
					buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
					buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
					cornerRadius={12}
					style={{ width: "100%", height: 44 }}
					onPress={signInWithApple}
				/>
				<BlurGlass
					style={{
						borderRadius: 16,
						height: 44,
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
						gap: 12,
					}}
				>
					<SourceIcon
						svgPath={simpleIcons.siGoogle.path}
						size={20}
						color={foreground}
					/>
					<Text className="font-medium">Continue with Google</Text>
				</BlurGlass>
			</Animated.View>
		</View>
	);
}

// ─── Auth page ────────────────────────────────────────────────────────────────

export default function AuthPage() {
	const router = useRouter();
	const foreground = useThemeColor("foreground");
	const danger = useThemeColor("danger");
	const [loading, setLoading] = useState(false);
	const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
	const { toast } = useToast();

	const signInWithApple = async () => {
		try {
			const credential = await AppleAuthentication.signInAsync({
				requestedScopes: [
					AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
					AppleAuthentication.AppleAuthenticationScope.EMAIL,
				],
			});
			if (!credential.identityToken) throw new Error("No identity token");
			await authClient.signIn.social(
				{ provider: "apple", idToken: { token: credential.identityToken } },
				{
					onError: () => {
						toast.show({
							label: "Sign in failed. Please try again.",
							variant: "danger",
							icon: (
								<SymbolView
									name={"exclamationmark"}
									size={20}
									tintColor={danger}
								/>
							),
						});
					},
					onSuccess: () => router.replace("/(app)/(tabs)"),
				},
			);
		} catch (e: any) {
			if (e.code !== "ERR_REQUEST_CANCELED") Alert.alert("Error", e.message);
		}
	};

	const signInWithGoogle = async () => {
		try {
			setLoading(true);
			await authClient.signIn.social(
				{ provider: "google", callbackURL: "musea://(app)/(tabs)/(index)" },
				{
					onError: (error) => {
						console.error(error);
						toast.show({
							label: "An error occurred during sign in. Please try again.",
							variant: "danger",
							icon: (
								<SymbolView
									name={"exclamationmark"}
									size={20}
									tintColor={danger}
								/>
							),
							description: error instanceof Error ? error.message : undefined,
						});
					},
					onSuccess: (data) => {
						console.log(data);
						router.replace("/(app)/(tabs)");
					},
				},
			);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	return <OnboardingScreen onComplete={() => {}} />;

	// return (
	// 	<View className="flex-1 items-center justify-center">
	// 		<View className="gap-2 px-4 w-2/3">
	// 			<AppleAuthentication.AppleAuthenticationButton
	// 				buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
	// 				buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
	// 				cornerRadius={12}
	// 				style={{ width: "100%", height: 44 }}
	// 				onPress={signInWithApple}
	// 			/>
	// 			<Button
	// 				isGlass
	// 				variant="tertiary"
	// 				className="text-center gap-3 w-full"
	// 				onPress={signInWithGoogle}
	// 			>
	// 				{loading ? (
	// 					<Spinner color="default" />
	// 				) : (
	// 					<>
	// 						<SourceIcon
	// 							svgPath={simpleIcons.siGoogle.path}
	// 							size={20}
	// 							color={foreground}
	// 						/>
	// 						<Text className="font-medium">Continue with Google</Text>
	// 					</>
	// 				)}
	// 			</Button>
	// 			<Button
	// 				variant="ghost"
	// 				className="w-full"
	// 				onPress={() => setShowOnboarding(true)}
	// 			>
	// 				Onboarding
	// 			</Button>
	// 		</View>
	// 	</View>
	// );
}
