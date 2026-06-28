import { FlashList } from "@shopify/flash-list";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { Link, Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { GalleryCard } from "@/components/gallery-card";
import EmptyState from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { api } from "~/convex/_generated/api";
import { Doc } from "~/convex/_generated/dataModel";

export default function GalleriesScreen() {
	const router = useRouter();
	const galleries = useQuery(api.galleries.listUserGalleries);

	const accent = useThemeColor("accent");
	const [query, setQuery] = useState("");

	const manual = (galleries ?? []).filter((g) => !g.isAuto);
	const auto = (galleries ?? []).filter((g) => g.isAuto);

	const q = query.trim().toLowerCase();
	const filteredManual = q
		? manual.filter((g) => g.title.toLowerCase().includes(q))
		: manual;
	const filteredAuto = q
		? auto.filter((g) => g.title.toLowerCase().includes(q))
		: auto;

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
				className="bg-background"
				data={filteredManual}
				numColumns={2}
				keyExtractor={(item) => item._id}
				contentInsetAdjustmentBehavior="automatic"
				showsVerticalScrollIndicator={false}
				contentContainerClassName="px-1 pb-10"
				renderItem={({ item }) => <GalleryCard gallery={item} />}
				ListEmptyComponent={() =>
					filteredAuto.length === 0 ? (
						<EmptyState
							title="No galleries"
							description={
								q
									? "Try a different search."
									: "Create a gallery to get started."
							}
							className="py-12"
						/>
					) : null
				}
				ListFooterComponent={
					filteredAuto.length > 0 ? (
						<View className="mt-4">
							<View className="flex-row items-center gap-1.5 px-3 pb-1">
								<SymbolView name="sparkles" size={15} tintColor={accent} />
								<Text className="font-medium text-sm">Auto-generated</Text>
							</View>
							<View className="flex-row flex-wrap">
								{filteredAuto.map((item) => (
									<View key={item._id} className="w-1/2">
										<GalleryCard gallery={item} />
									</View>
								))}
							</View>
						</View>
					) : null
				}
			/>
		</>
	);
}
