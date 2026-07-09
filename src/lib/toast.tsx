import { SymbolView } from "expo-symbols";
import { useThemeColor, useToast } from "heroui-native";
import { useMemo } from "react";

/**
 * Thin wrapper over heroui-native's `useToast` that standardizes the two toasts
 * the app actually shows — success and error — so call sites don't repeat the
 * icon JSX. The `ToastProvider` is already mounted by `HeroUINativeProvider`.
 */
export function useAppToast() {
	const { toast } = useToast();
	const success = useThemeColor("success");
	const danger = useThemeColor("danger");

	return useMemo(
		() => ({
			success: (label: string, description?: string) =>
				toast.show({
					label,
					description,
					variant: "success",
					icon: (
						<SymbolView
							name="checkmark.circle.fill"
							size={20}
							tintColor={success}
							weight="medium"
						/>
					),
				}),
			error: (label: string, description?: string) =>
				toast.show({
					label,
					description,
					variant: "danger",
					icon: (
						<SymbolView
							name="exclamationmark.circle.fill"
							size={20}
							tintColor={danger}
							weight="medium"
						/>
					),
				}),
			// Toast with a tappable action button (e.g. "Filed in Recipes · Undo").
			action: (label: string, actionLabel: string, onAction: () => void) =>
				toast.show({
					label,
					actionLabel,
					onActionPress: ({ hide }) => {
						onAction();
						hide();
					},
					icon: (
						<SymbolView
							name="sparkles"
							size={20}
							tintColor={success}
							weight="medium"
						/>
					),
				}),
		}),
		[toast, success, danger],
	);
}
