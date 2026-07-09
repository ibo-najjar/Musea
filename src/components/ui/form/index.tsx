import {
	MaterialDesignIcons,
	type MaterialDesignIconsIconName,
} from "@react-native-vector-icons/material-design-icons";
import { type SFSymbol, SymbolView } from "expo-symbols";
import {
	cn,
	ListGroup as HerouiListGroup,
	type ListGroupItemProps as HerouiListGroupItemProps,
	type ListGroupRootProps,
	PressableFeedback,
	useThemeColor,
} from "heroui-native";
import type React from "react";
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
	iconName?: SFSymbol;
	customContent?: React.ReactNode;
	hidePrefix?: boolean;
	hideSuffix?: boolean;
	destructive?: boolean;
} & HerouiListGroupItemProps;

const ListGroupItem: React.FC<ListGroupItemProps> = ({
	children,
	label,
	description,
	iconName,
	hidePrefix = false,
	hideSuffix = false,
	destructive = false,
	customContent,
	onPress,
	...props
}) => {
	const foreground = useThemeColor("foreground");
	const danger = useThemeColor("danger");

	return (
		<PressableFeedback animation={false} onPress={onPress}>
			<PressableFeedback.Ripple />
			<PressableFeedback.Scale>
				<HerouiListGroup.Item {...props} disabled>
					{!hidePrefix && (
						<HerouiListGroup.ItemPrefix>
							{iconName && (
								<SymbolView
									name={iconName}
									size={24}
									tintColor={destructive ? danger : foreground}
								/>
							)}
						</HerouiListGroup.ItemPrefix>
					)}
					{customContent ? (
						customContent
					) : (
						<HerouiListGroup.ItemContent>
							<HerouiListGroup.ItemTitle
								className={cn("", { "text-danger": destructive })}
							>
								{label}
							</HerouiListGroup.ItemTitle>
							{description && (
								<HerouiListGroup.ItemDescription>
									{description}
								</HerouiListGroup.ItemDescription>
							)}
						</HerouiListGroup.ItemContent>
					)}
					{hideSuffix ? null : (
						<HerouiListGroup.ItemSuffix>{children}</HerouiListGroup.ItemSuffix>
					)}
				</HerouiListGroup.Item>
			</PressableFeedback.Scale>
		</PressableFeedback>
	);
};

ListGroupItem.displayName = "ListGroupItem";

export { ListGroup, ListGroupItem };
