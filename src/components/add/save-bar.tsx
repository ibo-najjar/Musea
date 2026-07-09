import { SymbolView } from "expo-symbols";
import { cn, Spinner, useThemeColor } from "heroui-native";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import Animated, {
	FadeIn,
	FadeOut,
	LinearTransition,
} from "react-native-reanimated";
import { TouchableGlass } from "@/components/ui/touchable-glass";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const layout = LinearTransition.springify();

export function SaveBar({
	showInput,
	input,
	onChangeInput,
	onClearInput,
	onSave,
	onRemove,
	saving,
	disabled,
}: {
	showInput: boolean;
	input: string;
	onChangeInput: (value: string) => void;
	onClearInput: () => void;
	onSave: () => void;
	onRemove: () => void;
	saving: boolean;
	disabled: boolean;
}) {
	const foreground = useThemeColor("foreground");
	const muted = useThemeColor("muted");
	const accent = useThemeColor("accent");

	return (
		<KeyboardStickyView>
			<View className="px-4 pb-4">
				<TouchableGlass
					className={cn("flex-row items-center gap-2 rounded-3xl px-1.5 py-1", {
						"pl-4": showInput,
					})}
				>
					{!showInput && (
						<Animated.View entering={FadeIn} exiting={FadeOut} layout={layout}>
							<Pressable
								onPress={onRemove}
								className="h-10 w-10 items-center justify-center rounded-3xl bg-surface-secondary"
							>
								<SymbolView
									name="arrow.left"
									size={20}
									tintColor={foreground}
								/>
							</Pressable>
						</Animated.View>
					)}

					{showInput && (
						<Animated.View
							entering={FadeIn}
							exiting={FadeOut}
							layout={layout}
							className="flex-1 flex-row items-center"
						>
							<TextInput
								placeholder="Paste URL or type text"
								className="flex-1 py-2.5 text-foreground"
								style={{ fontSize: 16 }}
								value={input}
								selectionColor={accent}
								selectionHandleColor={accent}
								cursorColor={accent}
								onChangeText={onChangeInput}
								autoCapitalize="none"
								autoCorrect={false}
								autoFocus
							/>
							{input.length > 0 && (
								<Pressable
									onPress={onClearInput}
									hitSlop={8}
									className="h-10 w-8 items-center justify-center"
								>
									<SymbolView
										name="xmark.circle.fill"
										size={20}
										tintColor={muted}
									/>
								</Pressable>
							)}
						</Animated.View>
					)}

					<AnimatedPressable
						layout={layout}
						onPress={onSave}
						disabled={disabled}
						className={cn(
							"h-10 items-center justify-center rounded-3xl border-continuous",
							showInput ? "px-3" : "flex-1",
							disabled ? "bg-surface-secondary" : "bg-accent",
						)}
					>
						{saving ? (
							<Spinner size="sm" />
						) : (
							<Text
								className={cn("font-semibold text-accent-foreground text-sm", {
									"text-foreground": disabled,
								})}
							>
								Save
							</Text>
						)}
					</AnimatedPressable>
				</TouchableGlass>
			</View>
		</KeyboardStickyView>
	);
}
