import { Stack } from "expo-router";
import { Spinner, useThemeColor } from "heroui-native";
import { Pressable } from "react-native";

const ModalSubmitButton = ({
	onClick,
	isLoading = false,
	disabled = false,
}: {
	onClick?: () => void;
	isLoading?: boolean;
	disabled?: boolean;
}) => {
	const muted = useThemeColor("muted");
	const surface = useThemeColor("surface-tertiary");
	const accent = useThemeColor("accent");

	const handleSubmit = () => {
		if (disabled) return;
		onClick?.();
	};

	return (
		<Stack.Toolbar placement="right">
			{isLoading ? (
				<Stack.Toolbar.View>
					<Pressable className="size-8 items-center justify-center">
						<Spinner color={muted} />
					</Pressable>
				</Stack.Toolbar.View>
			) : (
				<Stack.Toolbar.Button
					onPress={handleSubmit}
					icon={"checkmark"}
					tintColor={disabled ? surface : accent}
					variant={disabled ? "plain" : "prominent"}
				/>
			)}
		</Stack.Toolbar>
	);
};

export default ModalSubmitButton;
