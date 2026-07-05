import { useMutation } from "convex/react";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { SymbolView } from "expo-symbols";
import { Avatar, InputGroup, ListGroup, useThemeColor } from "heroui-native";
import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import ModalSubmitButton from "@/components/layout/modal-submit-button";
import { Button } from "@/components/ui/button";
import ScrollView from "@/components/ui/scrollview";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { useAppToast } from "@/lib/toast";
import { api } from "~/convex/_generated/api";

export default function Profile() {
	const { data: session, refetch } = authClient.useSession();
	const [isUploading, setIsUploading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [displayName, setDisplayName] = useState(session?.user.name ?? "");
	const [username, setUsername] = useState(session?.user.username ?? "");
	const foreground = useThemeColor("foreground");
	const toast = useAppToast();
	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const saveFile = useMutation(api.files.saveFile);
	const updateProfileImage = useMutation(api.user.updateProfileImage);
	const updateProfile = useMutation(api.user.updateProfileName); // adjust to your actual mutation name
	const updateUsername = useMutation(api.user.updateUsername);

	// Keep local state in sync if session data loads/refetches after mount
	useEffect(() => {
		if (session?.user.name !== undefined) {
			setDisplayName(session.user.name);
		}
	}, [session?.user.name]);

	useEffect(() => {
		if (session?.user.username !== undefined) {
			setUsername(session.user.username ?? "");
		}
	}, [session?.user.username]);

	const trimmedName = displayName.trim();
	const hasNameChanged =
		trimmedName.length > 0 && trimmedName !== (session?.user.name ?? "");
	const trimmedUsername = username.trim();
	const hasUsernameChanged =
		trimmedUsername.length > 0 &&
		trimmedUsername !== (session?.user.username ?? "");
	const hasChanges = hasNameChanged || hasUsernameChanged;

	const handleEditImage = async () => {
		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ["images"],
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.8,
			});
			if (result.canceled) return;
			setIsUploading(true);
			const selectedImage = result.assets[0];
			const uploadUrl = await generateUploadUrl();
			const file = new File(selectedImage.uri);
			const uploadResult = await file.upload(uploadUrl, {
				httpMethod: "POST",
				uploadType: 0, // UploadType.BINARY_CONTENT
				headers: {
					"Content-Type": selectedImage.mimeType ?? "image/jpeg",
				},
			});
			const { storageId } = JSON.parse(uploadResult.body);
			await saveFile({ storageId, userId: session?.user.id as string });
			await updateProfileImage({ storageId });
			refetch();
		} catch (error) {
			console.error("Error uploading image:", error);
			toast.error(
				"Couldn't update photo",
				error instanceof Error ? error.message : undefined,
			);
		} finally {
			setIsUploading(false);
		}
	};

	const handleSubmit = async () => {
		if (!hasChanges) return;
		try {
			setIsSaving(true);
			if (hasNameChanged) await updateProfile({ name: trimmedName });
			if (hasUsernameChanged)
				await updateUsername({ username: trimmedUsername });
			await refetch();
			toast.success("Profile updated");
		} catch (error) {
			Alert.alert(
				"Couldn't save profile",
				error instanceof Error ? error.message : "Please try again.",
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<>
			<ModalSubmitButton
				onClick={handleSubmit}
				isLoading={isSaving}
				disabled={!hasChanges}
			/>
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				contentContainerClassName="px-4"
			>
				<View className="justify-center items-center">
					<Button
						isGlass
						className="size-40 rounded-3xl"
						onPress={handleEditImage}
					>
						<Avatar className="rounded-3xl size-40 bg-transparent">
							<Avatar.Image
								source={{
									uri: session?.user.image || undefined,
								}}
							/>
							<Avatar.Fallback>
								<Text className="text-7xl font-bold text-foreground/30 leading-0">
									{session?.user.name
										? session.user.name
												.split(" ")
												.map((n) => n[0])
												.join("")
										: "?"}
								</Text>
							</Avatar.Fallback>
						</Avatar>
					</Button>
					{/* <Button size="sm" isGlass variant="tertiary" className="mt-2">
						<SymbolView
							name="person.crop.circle.fill.badge.xmark"
							size={16}
							tintColor={foreground}
						/>
						<Text className="font-medium text-sm">
							{isUploading ? "Uploading..." : "Remove"}
						</Text>
					</Button> */}
				</View>
				<ListGroup className="mt-6">
					<ListGroup.Item className="p-0">
						<InputGroup className="w-full">
							<InputGroup.Prefix>
								<SymbolView
									name="person.text.rectangle.fill"
									size={16}
									tintColor={foreground}
								/>
							</InputGroup.Prefix>
							<InputGroup.Input
								placeholder="Your Display Name"
								variant="secondary"
								className="bg-transparent outline-0 border-0"
								value={displayName}
								onChangeText={setDisplayName}
							/>
						</InputGroup>
					</ListGroup.Item>
					<ListGroup.Item className="p-0">
						<InputGroup className="w-full">
							<InputGroup.Prefix>
								<SymbolView name="at" size={16} tintColor={foreground} />
							</InputGroup.Prefix>
							<InputGroup.Input
								placeholder="username"
								variant="secondary"
								className="bg-transparent outline-0 border-0"
								autoCapitalize="none"
								autoCorrect={false}
								value={username}
								onChangeText={setUsername}
							/>
						</InputGroup>
					</ListGroup.Item>
				</ListGroup>
			</ScrollView>
		</>
	);
}
