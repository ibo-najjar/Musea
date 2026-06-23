import { FlashList } from "@shopify/flash-list";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { Link, Stack, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { GalleryCard } from "@/components/gallery-card";
import { api } from "~/convex/_generated/api";
import { Doc } from "~/convex/_generated/dataModel";

export default function GalleriesScreen() {
	const router = useRouter();
	const galleries = useQuery(api.galleries.listUserGalleries);
	return (
		<>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					icon={"plus"}
					onPress={() => router.push("/(app)/(modal)/create-gallery")}
				/>
			</Stack.Toolbar>
			<FlashList
				className="bg-background"
				data={galleries}
				numColumns={2}
				keyExtractor={(item) => item._id}
				contentInsetAdjustmentBehavior="automatic"
				showsVerticalScrollIndicator={false}
				contentContainerClassName="pt-2 px-2 pb-10"
				renderItem={({ item }) => <GalleryCard gallery={item} />}
			/>
		</>
	);
}
