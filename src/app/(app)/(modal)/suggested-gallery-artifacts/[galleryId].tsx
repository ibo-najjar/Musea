import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Spinner, Typography, useThemeColor } from "heroui-native";
import { useMemo, useState } from "react";
import { View } from "react-native";
import SelectableMasonryCard from "@/components/selectable-masonry-card";
import { SelectedArtifactsStack } from "@/components/selected-artifact-stack";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";

export default function SuggestedGalleryArtifactsModal() {
	const { galleryId } = useLocalSearchParams<{ galleryId: string }>();
	const allArtifacts = useQuery(api.artifacts.listArtifacts);
	const [selectedIds, setSelectedIds] = useState<Id<"artificats">[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	const accentForeground = useThemeColor("accent-foreground");

	const router = useRouter();

	const selectedArtifacts = useMemo(
		() => allArtifacts?.filter((a) => selectedIds.includes(a._id)) ?? [],
		[allArtifacts, selectedIds],
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

			<FlashList
				contentInsetAdjustmentBehavior="automatic"
				data={allArtifacts}
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
		</>
	);
}
