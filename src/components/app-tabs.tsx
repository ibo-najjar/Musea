import { useRouter } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useThemeColor } from "heroui-native";
import { useEffect } from "react";

export default function AppTabs() {
	const [accent, background, foreground] = useThemeColor([
		"accent",
		"background",
		"muted",
	]);

	const ripple = useThemeColor("accent-soft-hover");

	const router = useRouter();

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
			<NativeTabs.Trigger name="(discover)">
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
			<NativeTabs.Trigger
				name="add"
				role="search"
				disabled
				listeners={{
					tabPress: (e) => {
						if (e.data.isPrevented) {
							router.push("/(app)/(modal)/add");
						}
					},
				}}
			>
				<NativeTabs.Trigger.Label hidden>Add</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon sf={"plus"} renderingMode="template" />
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
