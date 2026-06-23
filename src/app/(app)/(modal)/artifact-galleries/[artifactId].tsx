import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useHeaderHeight } from "expo-router/build/react-navigation";
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";
import { useCallback, useMemo, useState } from "react";
import {
	Alert,
	FlatList,
	Pressable,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { GalleryListItem } from "@/components/gallery-list-Item";
import ModalSubmitButton from "@/components/layout/modal-submit-button";
import { SelectedArtifact } from "@/components/selected-artifact-stack";
import { api } from "~/convex/_generated/api";
import { Doc, Id } from "~/convex/_generated/dataModel";

export default function ItemBoards() {
	const router = useRouter();
	const { artifactId } = useLocalSearchParams<{ artifactId: string }>();
	const typedArtifactId = artifactId as Id<"artificats"> | undefined;

	const artifact = useQuery(
		api.artifacts.getArtifactById,
		typedArtifactId ? { artificatId: typedArtifactId } : "skip",
	);
	const galleries = useQuery(api.galleries.listUserGalleries);
	const existingGalleries = useQuery(
		api.galleryArtifacts.listGalleriesForArtifact,
		typedArtifactId ? { artificatId: typedArtifactId } : "skip",
	);

	const setGalleriesForArtifact = useMutation(
		api.galleryArtifacts.setGalleriesForArtifact,
	);

	const accent = useThemeColor("accent");
	const headerHeight = useHeaderHeight();
	const [isSaving, setIsSaving] = useState(false);

	// What the server currently says is true (live, no copying into state)
	const existingIds = useMemo(
		() => new Set(existingGalleries?.map((g) => g._id) ?? []),
		[existingGalleries],
	);

	// Only the user's pending toggles — deltas, not a full copy of server state
	const [added, setAdded] = useState<Set<Id<"gallery">>>(() => new Set());
	const [removed, setRemoved] = useState<Set<Id<"gallery">>>(() => new Set());

	const isGallerySelected = useCallback(
		(id: Id<"gallery">) =>
			existingIds.has(id) ? !removed.has(id) : added.has(id),
		[existingIds, removed, added],
	);

	const toggleSelected = useCallback(
		(id: Id<"gallery">, nextValue: boolean) => {
			const wasOriginallySelected = existingIds.has(id);

			if (nextValue) {
				// Selecting: un-mark as removed if it was originally there, else mark as added
				if (wasOriginallySelected) {
					setRemoved((prev) => {
						if (!prev.has(id)) return prev;
						const next = new Set(prev);
						next.delete(id);
						return next;
					});
				} else {
					setAdded((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
				}
			} else {
				// Deselecting: mark as removed if it was originally there, else un-mark as added
				if (wasOriginallySelected) {
					setRemoved((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
				} else {
					setAdded((prev) => {
						if (!prev.has(id)) return prev;
						const next = new Set(prev);
						next.delete(id);
						return next;
					});
				}
			}
		},
		[existingIds],
	);

	const hasChanges = added.size > 0 || removed.size > 0;

	const handleSave = useCallback(async () => {
		if (!typedArtifactId || !hasChanges) return;
		setIsSaving(true);
		try {
			const finalGalleryIds = [
				...[...existingIds].filter((id) => !removed.has(id)),
				...added,
			];
			await setGalleriesForArtifact({
				artificatId: typedArtifactId,
				galleryIds: finalGalleryIds,
			});
			router.back();
		} catch (error) {
			console.error("Error saving gallery selections:", error);
		} finally {
			setIsSaving(false);
		}
	}, [
		typedArtifactId,
		hasChanges,
		existingIds,
		removed,
		added,
		setGalleriesForArtifact,
		router,
	]);

	const renderItem = useCallback(
		({ item }: { item: NonNullable<typeof galleries>[number] }) => (
			<GalleryListItem
				gallery={item}
				isSelected={isGallerySelected(item._id)}
				onSelectedChange={(nextValue) => toggleSelected(item._id, nextValue)}
			/>
		),
		[isGallerySelected, toggleSelected],
	);

	const keyExtractor = useCallback(
		(item: NonNullable<typeof galleries>[number]) => item._id,
		[],
	);

	return (
		<>
			<Stack.Title asChild>
				<View className="flex-row items-center gap-0">
					<SelectedArtifact artifact={artifact} />
				</View>
			</Stack.Title>
			<Stack.Screen options={{}} />
			{/* <Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					icon={"checkmark"}
					tintColor={accent}
					variant="prominent"
					onPress={handleSave}
					disabled={isSaving || !hasChanges}
				/>
			</Stack.Toolbar> */}
			<ModalSubmitButton
				disabled={isSaving || !hasChanges}
				isLoading={isSaving}
				onClick={handleSave}
			/>
			<Stack.Toolbar placement="left">
				<Stack.Toolbar.Button icon={"xmark"} onPress={() => router.back()} />
			</Stack.Toolbar>

			<FlatList
				contentContainerClassName="px-5"
				contentContainerStyle={{ paddingTop: headerHeight + 16 }}
				data={galleries}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
			/>
		</>
	);
}
