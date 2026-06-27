import { BlurView } from "expo-blur";
import { cn } from "heroui-native";
import type { ViewProps } from "react-native";
import { useUniwind, withUniwind } from "uniwind";

type BlurGlassProps = ViewProps & {
	intensity?: number;
};

const StyledBlurView = withUniwind(BlurView);

export function BlurGlass({
	style,
	children,
	intensity = 60,
	className,
	...props
}: BlurGlassProps) {
	return (
		<StyledBlurView
			className={cn("rounded-lg", className)}
			tint="systemMaterial"
			intensity={intensity}
			style={[{ overflow: "hidden" }, style]}
			{...props}
		>
			{children}
		</StyledBlurView>
	);
}
