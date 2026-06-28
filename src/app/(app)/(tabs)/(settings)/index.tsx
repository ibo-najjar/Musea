import * as Application from "expo-application";
import { useRouter } from "expo-router";
import { Avatar } from "heroui-native";
import { Text, View } from "react-native";
import { ListGroup, ListGroupItem } from "@/components/ui/form";
import { Switch } from "@/components/ui/form/input/switch";
import ScrollView from "@/components/ui/scrollview";
import { authClient } from "@/lib/auth-client";

export default function ListGroupExample() {
	const router = useRouter();

	const { data: session } = authClient.useSession();

	const version = Application.nativeApplicationVersion ?? "0.0.1";
	const build = Application.nativeBuildVersion ?? "—";

	return (
		<ScrollView contentContainerClassName="px-4" className="flex-1">
			<Text className="mb-2 ml-2 text-muted text-sm">Account</Text>
			<ListGroup>
				<ListGroupItem
					iconName="label"
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
								<Text className="text-muted text-xs">@ibrahimnajjar</Text>
							</View>
						</View>
					}
					description="Change your username"
					onPress={() => {
						router.push("/(app)/(tabs)/(settings)/profile");
					}}
				>
					{/* <Switch /> */}
				</ListGroupItem>
			</ListGroup>
			<Text className="mb-2 ml-2 text-muted text-sm mt-4">Actions</Text>
			<ListGroup>
				<ListGroupItem
					label="Account settings"
					iconName="generator-mobile"
					onPress={() => {}}
				/>
			</ListGroup>
			<Text className="mb-2 ml-2 text-muted text-sm mt-4">Actions</Text>
			<ListGroup>
				<ListGroupItem
					iconName="door-open"
					label="Sign out"
					// description="Change your username"
					onPress={() => {
						console.log("Signing out...");
						authClient.signOut();
						router.replace("/");
					}}
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
