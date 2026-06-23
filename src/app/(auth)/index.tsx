import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Spinner, Toast, useThemeColor, useToast } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";
import * as simpleIcons from "simple-icons";
import { SourceIcon } from "@/components/source-icon";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";

export default function AuthPage() {
	const router = useRouter();

	const foreground = useThemeColor("foreground");
	const danger = useThemeColor("danger");
	const [loading, setLoading] = useState(false);

	const { toast } = useToast();

	const signInWithGoogle = async () => {
		try {
			setLoading(true);
			await authClient.signIn.social(
				{
					provider: "google",
					callbackURL: "starterai://(app)/(tabs)/(index)",
				},
				{
					onError: (error) => {
						console.error(error);

						toast.show({
							label: "An error occurred during sign in. Please try again.",
							variant: "danger",
							icon: (
								<SymbolView
									name={"exclamationmark"}
									size={20}
									tintColor={danger}
								/>
							),
							description: error instanceof Error ? error.message : undefined,
						});
					},
					onSuccess: (data) => {
						console.log(data);
						router.replace("/(app)/(tabs)");
					},
				},
			);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View className="flex-1 items-center justify-center">
			<View className="gap-2 px-4 w-2/3">
				<Button
					isGlass
					variant="tertiary"
					className="text-center gap-3 w-full"
					onPress={signInWithGoogle}
				>
					{loading ? (
						<Spinner color="default" />
					) : (
						<>
							<SourceIcon
								svgPath={simpleIcons.siGoogle.path}
								size={20}
								color={foreground}
							/>
							<Text className="font-medium">Continue with Google</Text>
						</>
					)}
				</Button>
			</View>
		</View>
	);
}
