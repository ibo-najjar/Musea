import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import {
	FieldError,
	Label,
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
	email: z.email("Enter a valid email"),
});
type Form = z.infer<typeof schema>;

export default function ForgotPasswordModal() {
	const router = useRouter();
	const danger = useThemeColor("danger");
	const { toast } = useToast();

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<Form>({
		resolver: zodResolver(schema),
		defaultValues: { email: "" },
	});

	const onSubmit = async (data: Form) => {
		const { error } = await authClient.forgetPassword.emailOtp({
			email: data.email,
		});

		if (error) {
			toast.show({
				label: "Couldn't send code",
				variant: "danger",
				icon: (
					<SymbolView
						name="exclamationmark"
						size={20}
						tintColor={danger}
						weight="medium"
					/>
				),
				description: error.message ?? "Please try again.",
			});
			return;
		}

		router.push({
			pathname: "/(auth)/reset-password",
			params: { email: data.email },
		});
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
								{isSubmitting ? <Spinner /> : "Send code"}
							</Button>
						</View>
					),
				}}
			/>
			<View className="gap-4 px-4 pt-4">
				<Text className="text-center text-muted">
					Enter your email and we'll send you a code to reset your password.
				</Text>
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
			</View>
		</ScrollView>
	);
}
