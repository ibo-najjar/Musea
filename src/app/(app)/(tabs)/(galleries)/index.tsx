import { FlashList } from "@shopify/flash-list";
import { useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useState } from "react";
import { GalleryCard } from "@/components/gallery-card";
import EmptyState from "@/components/ui/empty-state";
import { api } from "~/convex/_generated/api";

export default function GalleriesScreen() {
	const router = useRouter();
	const galleries = useQuery(api.galleries.listUserGalleries);

	const accent = useThemeColor("accent");
	const [query, setQuery] = useState("");

	const q = query.trim().toLowerCase();
	const filtered = (galleries ?? []).filter(
		(g) => !q || g.title.toLowerCase().includes(q),
	);

	return (
		<>
			<Stack.Toolbar placement="left">
				<Stack.Toolbar.Button
					icon={"plus"}
					onPress={() => router.push("/(app)/(modal)/create-gallery")}
				/>
			</Stack.Toolbar>
			<Stack.SearchBar
				placeholder="Search galleries"
				placement="integratedButton"
				hideWhenScrolling
				inputType="text"
				tintColor={accent}
				onChangeText={(e) => setQuery(e.nativeEvent.text)}
				onCancelButtonPress={() => setQuery("")}
			/>
			<FlashList
				className="flex-1 bg-background"
				data={filtered}
				numColumns={2}
				keyExtractor={(item) => item._id}
				contentInsetAdjustmentBehavior="always"
				showsVerticalScrollIndicator={false}
				contentContainerClassName="px-1 pb-10"
				renderItem={({ item }) => <GalleryCard gallery={item} />}
				ListEmptyComponent={() => (
					<EmptyState
						title="No galleries"
						description={
							q ? "Try a different search." : "Create a gallery to get started."
						}
						className="py-12"
					/>
				)}
			/>
		</>
	);
}
