import { Host, Text } from "@expo/ui/swift-ui";
import {
	Animation,
	animation,
	contentTransition,
	font,
	foregroundStyle,
	frame,
} from "@expo/ui/swift-ui/modifiers";
import { useEffect, useState } from "react";

const SEARCH_QUERIES = [
	"that sunset photo from Bali",
	"minimal desk setups",
	"articles on deep work",
	"recipes I want to try",
];
const QUERY_DURATION = 2000;

export function AnimatedSearchQuery({
	active,
	color,
}: {
	active: boolean;
	color: string;
}) {
	const [i, setI] = useState(0);

	useEffect(() => {
		if (!active) return;
		const id = setInterval(
			() => setI((p) => (p + 1) % SEARCH_QUERIES.length),
			QUERY_DURATION,
		);
		return () => clearInterval(id);
	}, [active]);

	return (
		<Host matchContents>
			<Text
				modifiers={[
					contentTransition("identity"),
					animation(
						Animation.spring({
							response: 0.8,
							dampingFraction: 0.5,
							duration: 1,
						}),
						i,
					),
					foregroundStyle(color),
					font({ size: 13, weight: "medium" }),
					frame({ maxWidth: 280, alignment: "leading" }),
				]}
			>
				{SEARCH_QUERIES[i]}
			</Text>
		</Host>
	);
}
