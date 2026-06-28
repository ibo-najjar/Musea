import { FlashList } from "@shopify/flash-list";
import { useAction, useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Spinner, Typography, useThemeColor } from "heroui-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import SelectableMasonryCard from "@/components/selectable-masonry-card";
import { SelectedArtifactsStack } from "@/components/selected-artifact-stack";
import { Button } from "@/components/ui/button";
import { api } from "~/convex/_generated/api";
import type { Doc, Id } from "~/convex/_generated/dataModel";

export default function SuggestedGalleryArtifactsModal() {
	const { galleryId } = useLocalSearchParams<{ galleryId: string }>();

	const gallery = useQuery(api.galleries.getGalleryById, {
		galleryId: galleryId as Id<"gallery">,
	});
	const currentUser = useQuery(api.auth.getCurrentUser);
	const existingArtifactIds = useQuery(
		api.galleryArtifacts.getGalleryArtifactIds,
		{ galleryId: galleryId as Id<"gallery"> },
	);
	const searchArtifacts = useAction(api.search.searchArtifacts);

	const [searchResults, setSearchResults] = useState<
		Doc<"artificats">[] | null
	>(null);
	const [selectedIds, setSelectedIds] = useState<Id<"artificats">[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	const accentForeground = useThemeColor("accent-foreground");

	const router = useRouter();

	// Seed the suggestions with a semantic search using the gallery name as the
	// fixed query. Runs once when the gallery title and user are available.
	const searchRequestRef = useRef(0);
	useEffect(() => {
		if (!gallery?.title || !currentUser?._id) return;

		const id = ++searchRequestRef.current;

		(async () => {
			try {
				const results = await searchArtifacts({
					query: gallery.title,
					userId: currentUser._id,
					limit: 100,
				});
				if (searchRequestRef.current !== id) return;
				setSearchResults(results as Doc<"artificats">[]);
			} catch (error) {
				console.error("Suggested search failed", error);
				if (searchRequestRef.current !== id) return;
				setSearchResults([]);
			}
		})();
	}, [gallery?.title, currentUser?._id, searchArtifacts]);

	const excludedIds = useMemo(
		() => new Set(existingArtifactIds ?? []),
		[existingArtifactIds],
	);

	const suggestions = useMemo(
		() => searchResults?.filter((a) => !excludedIds.has(a._id)) ?? [],
		[searchResults, excludedIds],
	);

	const selectedArtifacts = useMemo(
		() => suggestions.filter((a) => selectedIds.includes(a._id)),
		[suggestions, selectedIds],
	);

	const addArtifactsToGallery = useMutation(
		api.galleryArtifacts.addArtifactsToGallery,
	);

	const toggle = (id: string) => {
		setSelectedIds((prev) =>
			prev.includes(id as Id<"artificats">)
				? prev.filter((x) => x !== id)
				: [...prev, id as Id<"artificats">],
		);
	};

	const handleAddToGallery = async () => {
		if (!galleryId || selectedIds.length === 0) return;
		setIsSaving(true);
		try {
			await addArtifactsToGallery({
				galleryId: galleryId as Id<"gallery">,
				artificatIds: selectedIds,
			});
			router.back();
		} catch (error) {
			console.error("Failed to add artifacts to gallery", error);
		} finally {
			setIsSaving(false);
		}
	};

	const isLoading = searchResults === null || existingArtifactIds === undefined;

	return (
		<>
			<Stack.Screen
				options={{
					unstable_sheetFooter: () => (
						<View className="absolute bottom-0 w-full p-4">
							<Button
								isGlass
								isDisabled={selectedIds.length === 0 || isSaving}
								onPress={handleAddToGallery}
								// isLoading={isSaving}
								className="w-full"
							>
								{isSaving ? (
									<Spinner color={accentForeground} />
								) : (
									`Add ${selectedIds.length} to Gallery`
								)}
							</Button>
						</View>
					),
				}}
			/>
			<Stack.Title asChild>
				{selectedIds.length === 0 ? (
					<Typography.Heading type="h5">
						Suggested for this gallery
					</Typography.Heading>
				) : (
					<View className="flex-row items-center gap-2">
						<SelectedArtifactsStack artifacts={selectedArtifacts} />
					</View>
				)}
			</Stack.Title>

			{isLoading ? (
				<View className="flex-1 items-center justify-center bg-surface">
					<Spinner />
				</View>
			) : suggestions.length === 0 ? (
				<View className="flex-1 items-center justify-center bg-surface px-8">
					<Typography.Heading type="h5">Nothing to add</Typography.Heading>
					<Typography.Paragraph color="muted" className="text-center">
						Save some items first and they'll show up here.
					</Typography.Paragraph>
				</View>
			) : (
				<FlashList
					contentInsetAdjustmentBehavior="automatic"
					data={suggestions}
					masonry
					showsVerticalScrollIndicator={false}
					numColumns={2}
					className="flex-1 bg-surface"
					keyExtractor={(item) => item._id}
					renderItem={({ item }) => (
						<SelectableMasonryCard
							item={item}
							isSelected={selectedIds.includes(item._id)}
							onToggle={toggle}
						/>
					)}
				/>
			)}
		</>
	);
}
