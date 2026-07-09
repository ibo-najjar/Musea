import { Image as ExpoImage, type ImageProps } from "expo-image";
import { cn } from "heroui-native";
import type { FC } from "react";
import { withUniwind } from "uniwind";

interface Props extends ImageProps {}

const StyledImage = withUniwind(ExpoImage);

const Image: FC<Props> = ({ className, ...props }) => {
	return <StyledImage {...props} className={cn("", className)} />;
};

export default Image;
