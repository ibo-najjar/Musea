import { FlashList } from "@shopify/flash-list";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { useCallback, useMemo, useState } from "react";
import { Alert, View } from "react-native";
import AddArtifactCard from "@/components/add-artifact-card";
import MasonryCard from "@/components/mansory-card";
import { MasonrySkeletonGrid } from "@/components/masonry-skeleton";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { BOARDS } from "@/constants/dummy-data";
import { api } from "~/convex/_generated/api";
import type { Id } from "~/convex/_generated/dataModel";

const ADD_CARD_ID = "__add_card__";

export default function GalleryScreen() {
	const { galleryId, galleryTitle } = useLocalSearchParams<{
		galleryId: string;
		galleryTitle?: string;
	}>();

	const router = useRouter();
	const accent = useThemeColor("accent");

	const gallery = useQuery(api.galleries.getGalleryById, {
		galleryId: galleryId as Id<"gallery">,
	});
	const deleteGallery = useMutation(api.galleries.deleteGallery);
	const promoteGallery = useMutation(api.galleries.promoteGallery);
	const dismissAutoGallery = useMutation(api.galleries.dismissAutoGallery);
	const removeArtifactsFromGallery = useMutation(
		api.galleryArtifacts.removeArtifactsFromGallery,
	);

	const [isSelecting, setIsSelecting] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const toggleSelect = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}, []);

	const exitSelection = useCallback(() => {
		setIsSelecting(false);
		setSelectedIds(new Set());
	}, []);

	const onRemoveSelected = useCallback(() => {
		if (selectedIds.size === 0) return;
		Alert.alert(
			"Remove from gallery",
			"Remove the selected items from this gallery? They will stay in your library.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Remove",
					style: "destructive",
					onPress: async () => {
						await removeArtifactsFromGallery({
							galleryId: galleryId as Id<"gallery">,
							artificatIds: [...selectedIds] as Id<"artificats">[],
						});
						exitSelection();
					},
				},
			],
		);
	}, [selectedIds, removeArtifactsFromGallery, galleryId, exitSelection]);

	const onDeleteGallery = useCallback(() => {
		Alert.alert(
			"Delete Gallery",
			"Are you sure you want to delete this gallery? The saved items will stay in your library.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						await deleteGallery({ galleryId: galleryId as Id<"gallery"> });
						router.back();
					},
				},
			],
		);
	}, [deleteGallery, galleryId, router]);

	const onPromoteGallery = useCallback(async () => {
		await promoteGallery({ galleryId: galleryId as Id<"gallery"> });
	}, [promoteGallery, galleryId]);

	const onDismissGallery = useCallback(() => {
		Alert.alert(
			"Dismiss auto-gallery",
			"Hide this auto-generated gallery and stop auto-filing this topic? The saved items will stay in your library.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Dismiss",
					style: "destructive",
					onPress: async () => {
						await dismissAutoGallery({ galleryId: galleryId as Id<"gallery"> });
						router.back();
					},
				},
			],
		);
	}, [dismissAutoGallery, galleryId, router]);

	const {
		results: artifacts,
		status,
		loadMore,
	} = usePaginatedQuery(
		api.galleryArtifacts.listArtifactsInGallery,
		{ galleryId: galleryId as Id<"gallery"> },
		{ initialNumItems: 24 },
	);

	const dataWithAddCard = useMemo(() => {
		return [...artifacts, { _id: ADD_CARD_ID } as any];
	}, [artifacts]);

	if (gallery === undefined || status === "LoadingFirstPage") {
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

	if (gallery === null || (artifacts.length === 0 && status === "Exhausted")) {
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
								pathname:
									"/(app)/(modal)/suggested-gallery-artifacts/[galleryId]",
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
				<Stack.Toolbar.Button hidden={!isSelecting} onPress={exitSelection}>
					Done
				</Stack.Toolbar.Button>
				<Stack.Toolbar.Button
					hidden={isSelecting}
					onPress={() => setIsSelecting(true)}
				>
					Select
				</Stack.Toolbar.Button>
				<Stack.Toolbar.Menu hidden={isSelecting} icon={"ellipsis"}>
					<Stack.Toolbar.MenuAction
						icon={"sparkles"}
						hidden={gallery.isAuto}
						onPress={onPromoteGallery}
					>
						Add to my galleries
					</Stack.Toolbar.MenuAction>
					<Stack.Toolbar.MenuAction
						icon={"xmark"}
						destructive
						onPress={onDismissGallery}
						hidden={gallery.isAuto}
					>
						Dismiss
					</Stack.Toolbar.MenuAction>

					<Stack.Toolbar.MenuAction
						icon={"square.and.pencil"}
						onPress={() =>
							router.push({
								pathname: "/(app)/(modal)/edit-gallery/[galleryId]",
								params: { galleryId },
							})
						}
						hidden={!gallery.isAuto}
					>
						Edit Gallery
					</Stack.Toolbar.MenuAction>
					<Stack.Toolbar.MenuAction
						icon={"trash"}
						destructive
						onPress={onDeleteGallery}
						hidden={!gallery.isAuto}
					>
						Delete Gallery
					</Stack.Toolbar.MenuAction>
				</Stack.Toolbar.Menu>
				<Stack.Toolbar.Menu hidden={!isSelecting} icon={"ellipsis"}>
					<Stack.Toolbar.MenuAction
						icon={"trash"}
						destructive
						onPress={onRemoveSelected}
					>
						Remove from Gallery
					</Stack.Toolbar.MenuAction>
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>
			<View className="flex-1 bg-background">
				<FlashList
					contentInsetAdjustmentBehavior="automatic"
					data={dataWithAddCard}
					ListHeaderComponent={
						gallery.isAuto ? (
							<View className="flex-row items-center gap-1.5 px-2 pb-2">
								<SymbolView name="sparkles" size={15} tintColor={accent} />
								<Text className="font-medium text-muted-foreground text-sm">
									Auto-generated
								</Text>
							</View>
						) : null
					}
					masonry
					showsVerticalScrollIndicator={false}
					numColumns={2}
					keyExtractor={(item) => item._id}
					onEndReachedThreshold={0.5}
					onEndReached={() => {
						if (status === "CanLoadMore") loadMore(24);
					}}
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
							<MasonryCard
								onRemoveFromGallery={(id) =>
									removeArtifactsFromGallery({
										galleryId: galleryId as Id<"gallery">,
										artificatIds: [id as Id<"artificats">],
									})
								}
								item={item}
								isSelecting={isSelecting}
								isSelected={selectedIds.has(item._id)}
								onToggle={toggleSelect}
							/>
						)
					}
				/>
			</View>
		</>
	);
}
