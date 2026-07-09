import { Input as HeroUiInput, type InputProps } from "heroui-native";
import { forwardRef } from "react";
import type { TextInput } from "react-native";

const Input = forwardRef<TextInput, InputProps>(({ style, ...props }, ref) => (
	<HeroUiInput
		ref={ref}
		style={[{ textAlignVertical: "center", paddingVertical: 0 }, style]}
		{...props}
	/>
));
Input.displayName = "Input";

export { Input };
