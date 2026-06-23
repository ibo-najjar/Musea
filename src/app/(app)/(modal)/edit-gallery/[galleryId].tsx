import { FlashList } from "@shopify/flash-list";
import { Stack, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/build/react-navigation";
import {
	Avatar,
	Description,
	Input,
	Label,
	PressableFeedback,
	TextField,
} from "heroui-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MasonryCard from "@/components/mansory-card";
import ScrollView from "@/components/ui/scrollview";
import { Text } from "@/components/ui/text";
import { BOARDS } from "@/constants/dummy-data";

export default function EditGalleryScreen() {
	const { boardId } = useLocalSearchParams<{
		boardId: string;
	}>();

	const board = BOARDS.find((b) => b.id === boardId);

	const { top } = useSafeAreaInsets();

	const headerHeight = useHeaderHeight();

	if (!board) {
		return null;
	}

	return (
		<>
			<Stack.Screen options={{ title: board.name }} />
			<ScrollView
				className="bg-transparent"
				contentContainerClassName="px-4 pt-4"
				style={{ paddingTop: headerHeight }}
				showsVerticalScrollIndicator={false}
			>
				<PressableFeedback className="mx-auto">
					<PressableFeedback.Scale />
					<Avatar className="rounded-2xl size-44" variant="soft">
						<Avatar.Image />
						<Avatar.Fallback>{board.name}</Avatar.Fallback>
					</Avatar>
				</PressableFeedback>
				<TextField className="mt-4">
					<Label>Gallery name</Label>
					<Input
						defaultValue={board.name}
						placeholder="Enter gallery name"
						className="shadow-none"
					/>
				</TextField>
				<TextField className="mt-4">
					<Label>Gallery Prompt</Label>
					<Input
						// defaultValue={board.name}
						placeholder="A prompt to describe your gallery"
						className="shadow-none"
						variant="primary"
					/>
					<Description>
						This prompt will be used to generate images for your gallery. Make
						sure to be descriptive and specific.
					</Description>
				</TextField>
			</ScrollView>
		</>
	);
}
