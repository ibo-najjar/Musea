import { Host } from "@expo/ui";
import { ScrollView, Text } from "@expo/ui/swift-ui";
import {
	frame,
	lineLimit,
	lineSpacing,
	multilineTextAlignment,
	padding,
} from "@expo/ui/swift-ui/modifiers";
import ModalCloseButton from "@/components/layout/modal-close-button";
import { PRIVACY_POLICY } from "@/constants/legal";

export default function PrivacyPolicy() {
	return (
		<>
			<ModalCloseButton />
			<Host style={{ flex: 1 }}>
				<ScrollView>
					<Text
						markdownEnabled
						modifiers={[
							lineLimit(),
							multilineTextAlignment("leading"),
							frame({ maxWidth: 100000 }),
							lineSpacing(4),
							padding({ all: 16 }),
						]}
					>
						{PRIVACY_POLICY}
					</Text>
				</ScrollView>
			</Host>
		</>
	);
}
