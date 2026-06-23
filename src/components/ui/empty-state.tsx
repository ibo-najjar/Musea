import { cn, Typography } from "heroui-native";
import { View, ViewProps } from "react-native";
import { Button } from "./button";

interface EmptyStateProps extends ViewProps {
	title: string;
	description?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
	title,
	description,
	className,
}) => {
	return (
		<View
			className={cn("items-center justify-center gap-2 px-4 py-8", className)}
		>
			<Typography.Heading type="h3">{title}</Typography.Heading>
			{description && (
				<Typography.Paragraph color="muted">{description}</Typography.Paragraph>
			)}
		</View>
	);
};

export default EmptyState;
