import {
	MaterialDesignIcons,
	type MaterialDesignIconsIconName,
} from "@react-native-vector-icons/material-design-icons";
import {
	ListGroup as HerouiListGroup,
	type ListGroupItemProps as HerouiListGroupItemProps,
	type ListGroupRootProps,
	PressableFeedback,
	useThemeColor,
} from "heroui-native";
import React from "react";
import { withUniwind } from "uniwind";

const StyledMaterialDesignIcons = withUniwind(MaterialDesignIcons);

type ListGroupProps = ListGroupRootProps;

const ListGroup = (props: ListGroupProps) => {
	return <HerouiListGroup {...props} className="shadow-none" />;
};

ListGroup.displayName = "ListGroup";

type ListGroupItemProps = {
	children?: React.ReactNode;
	label?: string;
	description?: string;
	iconName?: MaterialDesignIconsIconName;
	customContent?: React.ReactNode;
	hidePrefix?: boolean;
} & HerouiListGroupItemProps;

const ListGroupItem: React.FC<ListGroupItemProps> = ({
	children,
	label,
	description,
	iconName,
	hidePrefix = false,
	customContent,
	onPress,
	...props
}) => {
	return (
		<PressableFeedback animation={false} onPress={onPress}>
			<PressableFeedback.Ripple />
			<PressableFeedback.Scale>
				<HerouiListGroup.Item {...props} disabled>
					{!hidePrefix && (
						<HerouiListGroup.ItemPrefix>
							{iconName && (
								<StyledMaterialDesignIcons name={iconName} size={24} />
							)}
						</HerouiListGroup.ItemPrefix>
					)}
					{customContent ? (
						customContent
					) : (
						<HerouiListGroup.ItemContent>
							<HerouiListGroup.ItemTitle>{label}</HerouiListGroup.ItemTitle>
							{description && (
								<HerouiListGroup.ItemDescription>
									{description}
								</HerouiListGroup.ItemDescription>
							)}
						</HerouiListGroup.ItemContent>
					)}
					<HerouiListGroup.ItemSuffix>{children}</HerouiListGroup.ItemSuffix>
				</HerouiListGroup.Item>
			</PressableFeedback.Scale>
		</PressableFeedback>
	);
};

ListGroupItem.displayName = "ListGroupItem";

export { ListGroup, ListGroupItem };
