import { useMutation } from "convex/react";
import * as Application from "expo-application";
import { useRouter } from "expo-router";
import { Avatar } from "heroui-native";
import { useState } from "react";
import { Alert, View } from "react-native";
import { ListGroup, ListGroupItem } from "@/components/ui/form";
import ScrollView from "@/components/ui/scrollview";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { useAppToast } from "@/lib/toast";
import { api } from "~/convex/_generated/api";

export default function ListGroupExample() {
	const router = useRouter();

	const { data: session } = authClient.useSession();
	const deleteAccount = useMutation(api.user.deleteAccount);
	const toast = useAppToast();
	const [isDeleting, setIsDeleting] = useState(false);

	const version = Application.nativeApplicationVersion ?? "0.0.1";
	const build = Application.nativeBuildVersion ?? "—";

	const handleDeleteAccount = () => {
		if (isDeleting) return;
		Alert.alert(
			"Delete Account",
			"This permanently deletes your account and all of your artifacts and galleries. This can't be undone.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							setIsDeleting(true);
							await deleteAccount();
							toast.success("Account deleted");
							await authClient.signOut();
							router.replace("/");
						} catch (error) {
							setIsDeleting(false);
							Alert.alert(
								"Couldn't delete account",
								error instanceof Error ? error.message : "Please try again.",
							);
						}
					},
				},
			],
		);
	};

	return (
		<ScrollView contentContainerClassName="px-4" className="flex-1">
			<Text className="mb-2 ml-2 text-muted text-sm">Account</Text>
			<ListGroup>
				<ListGroupItem
					// iconName="label"
					label="Username"
					hidePrefix
					customContent={
						<View className="flex-1 flex-row items-center gap-3">
							<Avatar className="rounded-lg">
								<Avatar.Image
									source={{
										uri: session?.user.image || undefined,
									}}
								/>
								<Avatar.Fallback />
							</Avatar>
							<View className="flex-1">
								<Text className="font-medium">{session?.user.name}</Text>
								<Text className="text-muted text-xs">
									@{session?.user.username ?? session?.user.displayUsername}
								</Text>
							</View>
						</View>
					}
					description="Edit your profile"
					onPress={() => {
						router.push("/(app)/(tabs)/(settings)/profile");
					}}
				/>
			</ListGroup>
			<Text className="mt-4 mb-2 ml-2 text-muted text-sm">Actions</Text>
			<ListGroup>
				<ListGroupItem
					iconName="bubble.left.and.bubble.right"
					label="Feedback"
					// description="Change your username"
					onPress={() => {
						router.push("/feedback");
					}}
				/>
				<ListGroupItem
					iconName="rectangle.portrait.and.arrow.right"
					label="Sign out"
					// description="Change your username"
					onPress={() => {
						console.log("Signing out...");
						authClient.signOut();
						router.replace("/");
					}}
				/>
			</ListGroup>
			<Text className="mt-4 mb-2 ml-2 text-muted text-sm">Legal</Text>
			<ListGroup>
				<ListGroupItem
					iconName="hand.raised"
					label="Privacy Policy"
					onPress={() => router.push("/(app)/(tabs)/(settings)/privacy-policy")}
				/>
				<ListGroupItem
					iconName="doc.text"
					label="Terms of Service"
					onPress={() => router.push("/(app)/(tabs)/(settings)/terms")}
				/>
			</ListGroup>
			<Text className="mt-4 mb-2 ml-2 text-muted text-sm">Danger</Text>
			<ListGroup>
				<ListGroupItem
					destructive
					iconName="person.crop.circle.badge.minus"
					label={"Delete Account"}
					onPress={() => router.push("/(app)/(tabs)/(settings)/delete-account")}
				/>
			</ListGroup>
			<View className="mt-8 mb-4 items-center">
				<Text className="text-muted text-xs">
					{`Version ${version} (${build})`}
				</Text>
			</View>
		</ScrollView>
	);
}
