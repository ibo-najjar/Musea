import { cn } from "heroui-native";
import { FC } from "react";
import type { ScrollViewProps } from "react-native";
import { ScrollView as RNScrollView } from "react-native";

const ScrollView: FC<ScrollViewProps> = ({ className, ...props }) => {
	return (
		<RNScrollView
			{...props}
			className={cn("bg-background", className)}
			// contentInsetAdjustmentBehavior="automatic"
		/>
	);
};

export default ScrollView;
