

import { cn, useThemeColor } from "heroui-native";
import Svg, { G, Path, Rect } from "react-native-svg";

type props = React.ComponentProps<typeof Svg> & {
  ref?: React.RefObject<Svg>;
  size?: number;
};

export const AppIcon = ({ className, size, ...props }: props) => {

  const [accent, background, surface] = useThemeColor([
    "accent",
    "surface-tertiary",
    "surface-secondary",
  ]);

  return (
    <Svg
      className={cn("w-full h-full", className)}
      viewBox="0 0 397 414"
      width={size ?? "100%"}
      height={size ?? "100%"}
      {...props}
    >
      <Rect y="71" width="343" height="343" rx="52" fill={background} />
      <Rect x="54" y="16" width="343" height="343" rx="52" fill={surface} />
      <Path
        d="M211 162.029V15C211 6.71573 217.716 0 226 0H304C312.284 0 319 6.71573 319 15V162.029C319 173.574 306.504 180.791 296.504 175.021L272.496 161.17C267.857 158.494 262.143 158.494 257.504 161.17L233.496 175.021C223.496 180.791 211 173.574 211 162.029Z"
        fill={accent}
      />
    </Svg>
  )
}