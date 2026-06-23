import { Stack, useRouter } from "expo-router";

const ModalCloseButton = ({ onClick }: { onClick?: () => void }) => {
	const router = useRouter();

	const handleClose = () => {
		if (onClick) {
			onClick();
		}
		router.back();
	};

	return (
		<Stack.Toolbar placement="left">
			<Stack.Toolbar.Button icon="xmark" onPress={handleClose} />
		</Stack.Toolbar>
	);
};

export default ModalCloseButton;
