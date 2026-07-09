import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import {
	InputOTP,
	type InputOTPRef,
	REGEXP_ONLY_DIGITS,
	useThemeColor,
	useToast,
} from "heroui-native";
import { useRef, useState } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import ScrollView from "@/components/ui/scrollview";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailModal() {
	const { email } = useLocalSearchParams<{ email: string }>();
	const router = useRouter();
	const danger = useThemeColor("danger");
	const { toast } = useToast();
	const otpRef = useRef<InputOTPRef>(null);
	const [isVerifying, setIsVerifying] = useState(false);
	const [isResending, setIsResending] = useState(false);

	const handleComplete = async (code: string) => {
		setIsVerifying(true);
		const { error } = await authClient.emailOtp.verifyEmail({
			email,
			otp: code,
		});
		setIsVerifying(false);

		if (error) {
			otpRef.current?.clear();
			toast.show({
				label: "Invalid code",
				variant: "danger",
				icon: (
					<SymbolView
						name="exclamationmark"
						size={20}
						tintColor={danger}
						weight="medium"
					/>
				),
				description: error.message ?? "That code didn't work. Try again.",
			});
			return;
		}

		router.replace("/(app)/(tabs)/(discover)");
	};

	const handleResend = async () => {
		setIsResending(true);
		await authClient.emailOtp.sendVerificationOtp({
			email,
			type: "email-verification",
		});
		setIsResending(false);
		toast.show({ label: "Code sent", description: `Check ${email}` });
	};

	return (
		<ScrollView
			className="bg-transparent"
			contentInsetAdjustmentBehavior="always"
		>
			<View className="items-center gap-4 px-4 pt-8">
				<Text className="text-center font-semibold text-lg">
					Verify your email
				</Text>
				<Text className="text-center text-muted">
					Enter the 6-digit code we sent to {email}
				</Text>

				<InputOTP
					ref={otpRef}
					maxLength={6}
					pattern={REGEXP_ONLY_DIGITS}
					onComplete={handleComplete}
					isDisabled={isVerifying}
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

				<Button
					variant="ghost"
					size="sm"
					onPress={handleResend}
					isDisabled={isResending}
				>
					Resend code
				</Button>

				<Button
					variant="ghost"
					size="sm"
					onPress={() => router.replace("/(app)/(tabs)/(discover)")}
				>
					Skip for now
				</Button>
			</View>
		</ScrollView>
	);
}
