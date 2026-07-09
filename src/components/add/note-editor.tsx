import { useThemeColor } from "heroui-native";
import { TextInput, View } from "react-native";

export function NoteEditor({
	title,
	content,
	onChangeTitle,
	onChangeContent,
	autoFocusField = "content",
}: {
	title: string;
	content: string;
	onChangeTitle: (value: string) => void;
	onChangeContent: (value: string) => void;
	autoFocusField?: "title" | "content";
}) {
	const foreground = useThemeColor("foreground");
	const muted = useThemeColor("muted");

	const accent = useThemeColor("accent");

	return (
		<View className="mt-3 gap-2">
			<TextInput
				selectionColor={accent}
				selectionHandleColor={accent}
				cursorColor={accent}
				placeholder="Title"
				placeholderTextColor={muted}
				className="font-bold text-3xl text-foreground"
				value={title}
				onChangeText={onChangeTitle}
				autoFocus={autoFocusField === "title"}
				submitBehavior="submit"
			/>
			<TextInput
				placeholder="Start writing…"
				selectionColor={accent}
				selectionHandleColor={accent}
				cursorColor={accent}
				placeholderTextColor={muted}
				className="min-h-40 flex-1 text-base text-foreground"
				value={content}
				onChangeText={onChangeContent}
				autoFocus={autoFocusField === "content"}
				multiline
				textAlignVertical="top"
			/>
		</View>
	);
}
