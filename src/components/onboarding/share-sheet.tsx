import { type SFSymbol, SymbolView } from "expo-symbols";
import { cn, useThemeColor } from "heroui-native";
import { View } from "react-native";
import Image from "@/components/ui/image";
import { Text } from "@/components/ui/text";

export function ShareItemWrapper({
	children,
	label,
}: {
	children: React.ReactNode;
	label?: string;
}) {
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
}

export function ShareScreenItem({
	imageSource,
	icon,
	fullRounded = false,
}: {
	imageSource?: number;
	icon?: SFSymbol;
	fullRounded?: boolean;
}) {
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
					weight="medium"
				/>
			)}
		</View>
	);
}
