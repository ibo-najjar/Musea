// components/ui/source-icon.tsx
import Svg, { Path } from "react-native-svg";

export function SourceIcon({
	svgPath,
	color,
	size = 16,
}: {
	svgPath: string;
	color: string;
	size?: number;
}) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24">
			<Path d={svgPath} fill={color} />
		</Svg>
	);
}
