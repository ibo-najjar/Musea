import { ImageBackground } from "expo-image";
import { Stack } from "expo-router";
import { Dimensions, View } from "react-native";
import { Button } from "@/components/ui/button";
import ScrollView from "@/components/ui/scrollview";
import { Text } from "@/components/ui/text";

export default function SignIn() {
	return (
		<View className="flex-1">
			<ImageBackground
				source={{
					uri: "https://server.wallpaperalchemy.com/storage/wallpapers/261/minecraft-4k-cherry-blossom-spring-valley-wallpaper-card.jpg",
				}}
				style={{
					position: "absolute",
					width: Dimensions.get("window").width,
					height: Dimensions.get("window").height,
				}}
			/>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.Button>sdfsd</Stack.Toolbar.Button>
			</Stack.Toolbar>
			<ScrollView
				contentContainerClassName="items-center justify-center gap-4 flex-1"
				className="bg-transparent"
				showsVerticalScrollIndicator={false}
			>
				<Button>Hey</Button>
				<Button isGlass variant="primary">
					hey
				</Button>
				<Button isGlass variant="outline">
					hey
				</Button>
				<Button isGlass variant="secondary">
					hey
				</Button>
				<Button isGlass variant="tertiary">
					hey
				</Button>
				<Button isGlass variant="danger">
					hey
				</Button>
				<Button isGlass variant="danger-soft">
					hey
				</Button>
			</ScrollView>
		</View>
	);
}
