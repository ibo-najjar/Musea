import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import {
	Description,
	FieldError,
	Label,
	Spinner,
	TextField,
	useThemeColor,
	useToast,
} from "heroui-native";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import Animated, {
	useAnimatedRef,
	useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import z from "zod";
import ModalCloseButton from "@/components/layout/modal-close-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";

const TABS = ["Sign in", "Sign up"] as const;

type PanelRef = { submit: () => void };

const signInSchema = z.object({
	email: z.email("Enter a valid email"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});
type SignInForm = z.infer<typeof signInSchema>;

const signUpSchema = z.object({
	name: z.string().min(1, "Enter your name"),
	email: z.email("Enter a valid email"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});
type SignUpForm = z.infer<typeof signUpSchema>;

const SignInPanel = forwardRef<
	PanelRef,
	{ width: number; onSubmittingChange: (v: boolean) => void }
>(({ width, onSubmittingChange }, ref) => {
	const router = useRouter();
	const danger = useThemeColor("danger");
	const { toast } = useToast();

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<SignInForm>({
		resolver: zodResolver(signInSchema),
		defaultValues: { email: "", password: "" },
	});

	const onSubmit = async (data: SignInForm) => {
		onSubmittingChange(true);
		await authClient.signIn.email(
			{ email: data.email, password: data.password },
			{
				onError: (error) => {
					toast.show({
						label: "Sign in failed",
						variant: "danger",
						icon: (
							<SymbolView
								name="exclamationmark"
								size={20}
								tintColor={danger}
								weight="medium"
							/>
						),
						description:
							error.error.message ?? "Check your email and password.",
					});
				},
				onSuccess: () => router.replace("/(app)/(tabs)/(discover)"),
			},
		);
		onSubmittingChange(false);
	};

	useImperativeHandle(ref, () => ({
		submit: () => handleSubmit(onSubmit)(),
	}));

	return (
		<View style={{ width }} className="gap-4 px-4 pt-4">
			<TextField>
				<Label>Email</Label>
				<Controller
					control={control}
					name="email"
					render={({ field: { onChange, value } }) => (
						<Input
							value={value}
							onChangeText={onChange}
							placeholder="you@example.com"
							autoCapitalize="none"
							autoCorrect={false}
							keyboardType="email-address"
							textContentType="emailAddress"
						/>
					)}
				/>
				<FieldError isInvalid={!!errors.email}>
					{errors.email?.message}
				</FieldError>
			</TextField>
			<TextField>
				<Label>Password</Label>
				<Controller
					control={control}
					name="password"
					render={({ field: { onChange, value } }) => (
						<Input
							value={value}
							onChangeText={onChange}
							placeholder="Password"
							secureTextEntry
							textContentType="password"
						/>
					)}
				/>
				<FieldError isInvalid={!!errors.password}>
					{errors.password?.message}
				</FieldError>
			</TextField>
			<Button
				variant="ghost"
				size="sm"
				className="self-end"
				onPress={() => router.push("/(auth)/forgot-password")}
			>
				Forgot password?
			</Button>
		</View>
	);
});
SignInPanel.displayName = "SignInPanel";

const SignUpPanel = forwardRef<
	PanelRef,
	{ width: number; onSubmittingChange: (v: boolean) => void }
>(({ width, onSubmittingChange }, ref) => {
	const router = useRouter();
	const danger = useThemeColor("danger");
	const { toast } = useToast();

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<SignUpForm>({
		resolver: zodResolver(signUpSchema),
		defaultValues: { name: "", email: "", password: "" },
	});

	const onSubmit = async (data: SignUpForm) => {
		onSubmittingChange(true);
		await authClient.signUp.email(
			{ name: data.name, email: data.email, password: data.password },
			{
				onError: (error) => {
					toast.show({
						label: "Sign up failed",
						variant: "danger",
						icon: (
							<SymbolView
								name="exclamationmark"
								size={20}
								tintColor={danger}
								weight="medium"
							/>
						),
						description: error.error.message ?? "Please try again.",
					});
				},
				onSuccess: async () => {
					await authClient.emailOtp.sendVerificationOtp({
						email: data.email,
						type: "email-verification",
					});
					router.replace({
						pathname: "/(auth)/verify-email",
						params: { email: data.email },
					});
				},
			},
		);
		onSubmittingChange(false);
	};

	useImperativeHandle(ref, () => ({
		submit: () => handleSubmit(onSubmit)(),
	}));

	return (
		<View style={{ width }} className="gap-4 px-4 pt-4">
			<TextField>
				<Label>Name</Label>
				<Controller
					control={control}
					name="name"
					render={({ field: { onChange, value } }) => (
						<Input
							value={value}
							onChangeText={onChange}
							placeholder="Your name"
							autoCapitalize="words"
							textContentType="name"
						/>
					)}
				/>
				<FieldError isInvalid={!!errors.name}>
					{errors.name?.message}
				</FieldError>
			</TextField>
			<TextField>
				<Label>Email</Label>
				<Controller
					control={control}
					name="email"
					render={({ field: { onChange, value } }) => (
						<Input
							value={value}
							onChangeText={onChange}
							placeholder="you@example.com"
							autoCapitalize="none"
							autoCorrect={false}
							keyboardType="email-address"
							textContentType="emailAddress"
						/>
					)}
				/>
				<FieldError isInvalid={!!errors.email}>
					{errors.email?.message}
				</FieldError>
			</TextField>
			<TextField>
				<Label>Password</Label>
				<Controller
					control={control}
					name="password"
					render={({ field: { onChange, value } }) => (
						<Input
							value={value}
							onChangeText={onChange}
							placeholder="Password"
							secureTextEntry
							textContentType="newPassword"
						/>
					)}
				/>
				<Description>Must be at least 8 characters.</Description>
				<FieldError isInvalid={!!errors.password}>
					{errors.password?.message}
				</FieldError>
			</TextField>
		</View>
	);
});
SignUpPanel.displayName = "SignUpPanel";

export default function EmailAndPasswordModal() {
	const [pageWidth, setPageWidth] = useState(0);
	const [activeIndex, setActiveIndex] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const flatListRef =
		useAnimatedRef<Animated.FlatList<(typeof TABS)[number]>>();
	const signInRef = useRef<PanelRef>(null);
	const signUpRef = useRef<PanelRef>(null);

	const goToIndex = (index: number) => {
		flatListRef.current?.scrollToIndex({ index, animated: true });
		setActiveIndex(index);
	};

	const handleSubmit = () => {
		if (activeIndex === 0) signInRef.current?.submit();
		else signUpRef.current?.submit();
	};

	const insets = useSafeAreaInsets();

	return (
		<View
			className="bg-transparent"
			onLayout={(e) => {
				if (pageWidth === 0) setPageWidth(e.nativeEvent.layout.width);
			}}
		>
			<ModalCloseButton />
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					onPress={() => goToIndex(activeIndex === 0 ? 1 : 0)}
				>
					Sign {activeIndex === 0 ? "Up" : "In"}
				</Stack.Toolbar.Button>
			</Stack.Toolbar>
			<Stack.Screen
				options={{
					unstable_sheetFooter: () => (
						<KeyboardStickyView className="absolute right-0 bottom-0 left-0 p-3">
							<Button
								className="rounded-3xl"
								onPress={handleSubmit}
								isDisabled={isSubmitting || pageWidth === 0}
							>
								{isSubmitting ? (
									<Spinner />
								) : activeIndex === 0 ? (
									"Sign In"
								) : (
									"Create account"
								)}
							</Button>
						</KeyboardStickyView>
					),
				}}
			/>

			{pageWidth > 0 && (
				<Animated.FlatList
					ref={flatListRef}
					data={TABS as unknown as string[]}
					horizontal
					pagingEnabled
					scrollEnabled={false}
					showsHorizontalScrollIndicator={false}
					keyExtractor={(item) => item}
					getItemLayout={(_, index) => ({
						length: pageWidth,
						offset: pageWidth * index,
						index,
					})}
					renderItem={({ index }) =>
						index === 0 ? (
							<SignInPanel
								ref={signInRef}
								width={pageWidth}
								onSubmittingChange={setIsSubmitting}
							/>
						) : (
							<SignUpPanel
								ref={signUpRef}
								width={pageWidth}
								onSubmittingChange={setIsSubmitting}
							/>
						)
					}
					contentContainerStyle={{
						paddingBottom: insets.bottom + 60,
						paddingTop: insets.top + 20,
					}}
					contentInsetAdjustmentBehavior={"never"}
				/>
			)}
		</View>
	);
}
