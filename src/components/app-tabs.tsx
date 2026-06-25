import { useRouter } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useThemeColor } from "heroui-native";
import { useEffect } from "react";
import {
	addInterceptedTabPressListener,
	setInterceptedTabIndex,
} from "../../modules/my-module/src/MyModule";

export default function AppTabs() {
	const [accent, background, foreground] = useThemeColor([
		"accent",
		"background",
		"muted",
	]);

	const ripple = useThemeColor("accent-soft-hover");

	const router = useRouter();

	useEffect(() => {
		// "add" is the 4th tab (index 3); intercept it natively before any visual change
		setInterceptedTabIndex(3);
		const subscription = addInterceptedTabPressListener(() => {
			router.push("/(app)/(modal)/add");
		});
		return () => subscription.remove();
	}, [router]);

	return (
		<NativeTabs
			minimizeBehavior="onScrollDown"
			backgroundColor={background}
			indicatorColor={ripple}
			rippleColor={ripple}
			iconColor={{
				default: foreground,
				selected: accent,
			}}
			labelStyle={{ selected: { color: accent } }}
		>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Label hidden>Home</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					src={require("@/assets/images/tabIcons/icon.png")}
					renderingMode="template"
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="(galleries)">
				<NativeTabs.Trigger.Label hidden>Galleries</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					src={require("@/assets/images/tabIcons/gallery.png")}
					renderingMode="template"
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="(settings)">
				<NativeTabs.Trigger.Label hidden>Settings</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					src={require("@/assets/images/tabIcons/user.png")}
					renderingMode="template"
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="add" role="search">
				<NativeTabs.Trigger.Label hidden>Add</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon sf={"plus"} renderingMode="template" />
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
