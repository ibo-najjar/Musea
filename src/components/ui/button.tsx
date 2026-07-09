import {
	type ButtonRootProps,
	buttonClassNames,
	cn,
	Button as HeroUiButton,
} from "heroui-native";
import { Text } from "react-native";
import { TouchableGlass } from "@/components/ui/touchable-glass"; // adjust path

const glassVariantClassName: Record<
	NonNullable<ButtonRootProps["variant"]>,
	string
> = {
	primary: "bg-accent",
	secondary: "bg-surface-secondary",
	tertiary: "bg-surface-tertiary",
	outline: "bg-transparent",
	ghost: "bg-transparent",
	danger: "bg-danger/80",
	"danger-soft": "bg-danger/20",
};

// ─── Types ───────────────────────────────────────────────────────────────────

type ButtonProps = ButtonRootProps & {
	isGlass?: boolean;
};

// ─── Glass variant ───────────────────────────────────────────────────────────

const GlassButton: React.FC<ButtonProps> = ({
	children,
	variant = "primary",
	size = "md",
	isIconOnly = false,
	isDisabled = false,
	className,
	onPress,
	onPressIn,
	onPressOut,
}) => {
	const rootClassName = buttonClassNames.root({
		variant,
		size,
		isIconOnly,
		isDisabled,
		className: cn(glassVariantClassName[variant], className),
	});

	const labelClassName = buttonClassNames.label({ size, variant });

	// ButtonRootProps.onPress carries the full GestureResponderEvent signature;
	// TouchableGlass just wants () => void, so we wrap and drop the event arg.
	const handlePress = onPress ? () => (onPress as () => void)() : undefined;

	const handlePressIn = onPressIn
		? () => (onPressIn as () => void)()
		: undefined;

	const handlePressOut = onPressOut
		? () => (onPressOut as () => void)()
		: undefined;

	return (
		<TouchableGlass
			className={rootClassName}
			onPress={handlePress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			disabled={isDisabled}
		>
			{typeof children === "string" ? (
				<Text className={labelClassName}>{children}</Text>
			) : (
				children
			)}
		</TouchableGlass>
	);
};

// ─── Unified Button ───────────────────────────────────────────────────────────

const Button: React.FC<ButtonProps> = ({
	isGlass = false,
	className,
	...props
}) => {
	if (isGlass) {
		return (
			<GlassButton
				className={cn("rounded-2xl border-continuous", className)}
				{...props}
			/>
		);
	}

	return (
		<HeroUiButton
			className={cn("rounded-2xl border-continuous", className)}
			{...props}
		/>
	);
};

export { Button };
