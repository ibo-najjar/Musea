import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import {
	Description,
	FieldError,
	InputOTP,
	Label,
	REGEXP_ONLY_DIGITS,
	Spinner,
	TextField,
	useThemeColor,
	useToast,
} from "heroui-native";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import z from "zod";
import ModalCloseButton from "@/components/layout/modal-close-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ScrollView from "@/components/ui/scrollview";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";

const schema = z.object({
	otp: z.string().length(6, "Enter the 6-digit code"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});
type Form = z.infer<typeof schema>;

export default function ResetPasswordModal() {
	const { email } = useLocalSearchParams<{ email: string }>();
	const router = useRouter();
	const danger = useThemeColor("danger");
	const { toast } = useToast();

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<Form>({
		resolver: zodResolver(schema),
		defaultValues: { otp: "", password: "" },
	});

	const onSubmit = async (data: Form) => {
		const { error } = await authClient.emailOtp.resetPassword({
			email,
			otp: data.otp,
			password: data.password,
		});

		if (error) {
			toast.show({
				label: "Couldn't reset password",
				variant: "danger",
				icon: (
					<SymbolView
						name="exclamationmark"
						size={20}
						tintColor={danger}
						weight="medium"
					/>
				),
				description: error.message ?? "Check the code and try again.",
			});
			return;
		}

		toast.show({
			label: "Password updated",
			description: "Sign in with your new password.",
		});
		router.replace("/(auth)/email-and-password");
	};

	return (
		<ScrollView
			className="bg-transparent"
			contentInsetAdjustmentBehavior="always"
			contentContainerClassName="mb-20"
		>
			<ModalCloseButton />
			<Stack.Screen
				options={{
					unstable_sheetFooter: () => (
						<View className="absolute right-0 bottom-0 left-0 p-3">
							<Button
								className="rounded-3xl"
								onPress={handleSubmit(onSubmit)}
								isDisabled={isSubmitting}
							>
								{isSubmitting ? <Spinner /> : "Reset password"}
							</Button>
						</View>
					),
				}}
			/>
			<View className="items-center gap-4 px-4 pt-4">
				<Text className="text-center text-muted">
					Enter the code we sent to {email} and choose a new password.
				</Text>

				<Controller
					control={control}
					name="otp"
					render={({ field: { onChange, value } }) => (
						<InputOTP
							value={value}
							onChange={onChange}
							maxLength={6}
							pattern={REGEXP_ONLY_DIGITS}
							isInvalid={!!errors.otp}
						>
							<InputOTP.Group>
								<InputOTP.Slot index={0} />
								<InputOTP.Slot index={1} />
								<InputOTP.Slot index={2} />
							</InputOTP.Group>
							<InputOTP.Separator />
							<InputOTP.Group>
								<InputOTP.Slot index={3} />
								<InputOTP.Slot index={4} />
								<InputOTP.Slot index={5} />
							</InputOTP.Group>
						</InputOTP>
					)}
				/>
				<FieldError isInvalid={!!errors.otp}>{errors.otp?.message}</FieldError>

				<TextField className="w-full">
					<Label>New password</Label>
					<Controller
						control={control}
						name="password"
						render={({ field: { onChange, value } }) => (
							<Input
								value={value}
								onChangeText={onChange}
								placeholder="New password"
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
		</ScrollView>
	);
}
