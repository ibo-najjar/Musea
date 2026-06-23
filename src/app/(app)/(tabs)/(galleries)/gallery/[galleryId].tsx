import { FlashList } from "@shopify/flash-list";
import { useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { View } from "react-native";
import AddArtifactCard from "@/components/add-artifact-card";
import MasonryCard from "@/components/mansory-card";
import { MasonrySkeletonGrid } from "@/components/masonry-skeleton";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { BOARDS } from "@/constants/dummy-data";
import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";

const ADD_CARD_ID = "__add_card__";

export default function GalleryScreen() {
	const { galleryId, galleryTitle } = useLocalSearchParams<{
		galleryId: string;
		galleryTitle?: string;
	}>();

	const router = useRouter();

	const gallery = useQuery(api.galleries.getGalleryById, {
		galleryId: galleryId as Id<"gallery">,
	});

	const artifacts = useQuery(api.galleryArtifacts.listArtifactsInGallery, {
		galleryId: galleryId as Id<"gallery">,
	});

	const dataWithAddCard = useMemo(() => {
		if (!artifacts) return [];
		return [...artifacts, { _id: ADD_CARD_ID } as any];
	}, [artifacts]);

	if (gallery === undefined || artifacts === undefined) {
		return (
			<>
				<Stack.Screen options={{ title: galleryTitle }} />
				<Stack.Toolbar placement="right">
					<Stack.Toolbar.Menu icon={"ellipsis"} />
				</Stack.Toolbar>
				<MasonrySkeletonGrid count={8} />
			</>
		);
	}

	if (gallery === null || artifacts.length === 0) {
		return (
			<>
				<Stack.Screen options={{ title: galleryTitle }} />
				<Stack.Toolbar placement="right">
					<Stack.Toolbar.Menu icon={"ellipsis"} />
				</Stack.Toolbar>
				<View className="flex-1 items-center justify-center bg-background">
					<EmptyState
						title="No items yet"
						description="Start adding items to this gallery."
						className="py-4"
					/>
					<Button
						isGlass
						onPress={() =>
							router.push({
								pathname: "/(app)/(modal)/suggested-gallery-artifacts/[galleryId]",
								params: { galleryId },
							})
						}
					>
						Add your first Artifact
					</Button>
				</View>
			</>
		);
	}

	return (
		<>
			<Stack.Screen options={{ title: gallery.title }} />
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Menu icon={"ellipsis"}>
					<Stack.Toolbar.MenuAction
						icon={"square.and.pencil"}
						onPress={() =>
							router.push({
								pathname: "/(app)/(modal)/edit-gallery/[galleryId]",
								params: { galleryId },
							})
						}
					>
						Edit Gallery
					</Stack.Toolbar.MenuAction>
					<Stack.Toolbar.MenuAction icon={"trash"} destructive>
						Remove
					</Stack.Toolbar.MenuAction>
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>
			<View className="flex-1 bg-background">
				<FlashList
					contentInsetAdjustmentBehavior="automatic"
					data={dataWithAddCard}
					masonry
					showsVerticalScrollIndicator={false}
					numColumns={2}
					keyExtractor={(item) => item._id}
					renderItem={({ item }) =>
						item._id === ADD_CARD_ID ? (
							<AddArtifactCard
								onPress={() =>
									router.push({
										pathname:
											"/(app)/(modal)/suggested-gallery-artifacts/[galleryId]",
										params: { galleryId },
									})
								}
							/>
						) : (
							<MasonryCard item={item} />
						)
					}
				/>
			</View>
		</>
	);
}
