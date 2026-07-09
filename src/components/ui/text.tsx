import { Typography } from "heroui-native";

type TextProps = React.ComponentProps<typeof Typography>;

const Text: React.FC<TextProps> = ({ ...props }) => {
	return <Typography {...props} />;
};

export { Text };
