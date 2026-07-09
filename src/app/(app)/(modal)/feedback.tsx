import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useState } from "react";
import { Alert, TextInput } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import ModalCloseButton from "@/components/layout/modal-close-button";
import ModalSubmitButton from "@/components/layout/modal-submit-button";
import { Input } from "@/components/ui/input";
import { api } from "~/convex/_generated/api";

export default function FeedbackModal() {
	const accent = useThemeColor("accent");
	const router = useRouter();
	const submitFeedback = useMutation(api.feedback.submitFeedback);

	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const onSubmit = async () => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		try {
			await submitFeedback({ message });
			router.back();
		} catch (error) {
			Alert.alert(
				"Could not submit feedback",
				error instanceof Error ? error.message : "Please try again.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<KeyboardAwareScrollView
			className="bg-transparent px-2"
			contentContainerStyle={{ flexGrow: 1 }}
			contentInsetAdjustmentBehavior="automatic"
			keyboardShouldPersistTaps="handled"
		>
			<ModalSubmitButton
				onClick={onSubmit}
				isLoading={isSubmitting}
				disabled={!message.trim() || isSubmitting}
			/>
			<ModalCloseButton />
			<Input
				autoFocus
				value={message}
				onChangeText={setMessage}
				cursorColor={accent}
				selectionColor={accent}
				selectionHandleColor={accent}
				multiline
				textAlignVertical="top"
				placeholder="Enter your feedback here..."
				className="flex-1 border-0 bg-transparent text-xl ios:shadow-none"
			/>
		</KeyboardAwareScrollView>
	);
}
