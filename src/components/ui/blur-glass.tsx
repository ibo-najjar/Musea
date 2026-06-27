import { BlurView } from "expo-blur";
import type { ViewProps } from "react-native";

type BlurGlassProps = ViewProps & {
	intensity?: number;
};

export function BlurGlass({
	style,
	children,
	intensity = 60,
	...props
}: BlurGlassProps) {
	return (
		<BlurView
			tint="systemMaterial"
			intensity={intensity}
			style={[{ overflow: "hidden" }, style]}
			{...props}
		>
			{children}
		</BlurView>
	);
}
