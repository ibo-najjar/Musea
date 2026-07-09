import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { useHeaderHeight } from "expo-router/build/react-navigation";
import {
	Label,
	Spinner,
	TextField,
	Typography,
	useThemeColor,
} from "heroui-native";
import { useState } from "react";
import { Alert, View } from "react-native";
import {
	KeyboardAwareScrollView,
	KeyboardStickyView,
	useKeyboardState,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ModalCloseButton from "@/components/layout/modal-close-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ScrollView from "@/components/ui/scrollview";
import { authClient } from "@/lib/auth-client";
import { useAppToast } from "@/lib/toast";
import { api } from "~/convex/_generated/api";

const CONFIRM_WORD = "DELETE";

export default function DeleteAccountScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const isKeyboardVisible = useKeyboardState((state) => state.isVisible);
	const deleteAccount = useMutation(api.user.deleteAccount);
	const toast = useAppToast();
	const [confirmText, setConfirmText] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);

	const canDelete = confirmText.trim().toUpperCase() === CONFIRM_WORD;

	const handleDeleteAccount = async () => {
		if (isDeleting || !canDelete) return;
		try {
			setIsDeleting(true);
			await deleteAccount();
			toast.success("Account deleted");
			await authClient.signOut();
			router.replace("/");
		} catch (error) {
			setIsDeleting(false);
			Alert.alert(
				"Couldn't delete account",
				error instanceof Error ? error.message : "Please try again.",
			);
		}
	};

	const headerHeight = useHeaderHeight();

	const dangerForeground = useThemeColor("danger-foreground");
	const danger = useThemeColor("danger");

	return (
		<>
			<ScrollView
				contentContainerClassName="px-4"
				contentInsetAdjustmentBehavior="automatic"
				className="flex-1"
			>
				<Typography.Paragraph type="body" weight="medium">
					This action will permanently delete your account and all of your
					artifacts and galleries. This cannot be undone. Please proceed with
					caution.
				</Typography.Paragraph>
				<TextField className="mt-4">
					<Label>Type "{CONFIRM_WORD}" to confirm</Label>
					<Input
						className="focus:border-danger"
						autoFocus
						placeholder={`Type ${CONFIRM_WORD}`}
						autoCapitalize="characters"
						autoCorrect={false}
						value={confirmText}
						cursorColor={danger}
						onChangeText={setConfirmText}
					/>
				</TextField>
			</ScrollView>
			<KeyboardStickyView>
				<View
					className="gap-4 px-4"
					style={{
						paddingBottom: 16,
						paddingTop: 8,
					}}
				>
					<Button
						variant="danger"
						isGlass
						isDisabled={!canDelete || isDeleting}
						onPress={handleDeleteAccount}
					>
						{isDeleting ? (
							<Spinner color={dangerForeground} />
						) : (
							"Delete Account"
						)}
					</Button>
					<Button variant="tertiary" isGlass onPress={() => router.dismiss()}>
						Cancel
					</Button>
				</View>
			</KeyboardStickyView>
		</>
	);
}
