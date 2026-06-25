import { useQuery } from "convex/react";
import { Stack, useLocalSearchParams } from "expo-router";
import { Skeleton, Typography } from "heroui-native";
import { View } from "react-native";
import ModalCloseButton from "@/components/layout/modal-close-button";
import { SelectedArtifact } from "@/components/selected-artifact-stack";
import EmptyState from "@/components/ui/empty-state";
import ScrollView from "@/components/ui/scrollview";
import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";

export default function ArtifactDetailsModal() {
	const { artifactId } = useLocalSearchParams<{ artifactId: string }>();

	const artifact = useQuery(api.artifacts.getArtifactById, {
		artificatId: artifactId as Id<"artificats">,
	});

	const isLoading = artifact === undefined;

	if (artifact === null) {
		return (
			<>
				<ModalCloseButton />
				<View className="flex-1 items-center justify-center bg-background">
					<EmptyState
						title="Artifact not found"
						description="The artificat you're looking for doesn't exist."
						className="px-8"
					/>
				</View>
			</>
		);
	}

	return (
		<>
			<Stack.Title asChild>
				<View className="flex-row items-center gap-0">
					<SelectedArtifact artifact={artifact} />
				</View>
			</Stack.Title>
			<ModalCloseButton />
			<ScrollView
				contentContainerClassName="px-4 py-4 gap-4"
				contentInsetAdjustmentBehavior="automatic"
			>
				{/* Title */}
				<Skeleton isLoading={isLoading} className="h-7 w-3/4 rounded-lg">
					<Typography.Heading type="h3">{artifact?.title}</Typography.Heading>
				</Skeleton>

				{/* Tags row */}
				<View className="flex-row gap-2 flex-wrap">
					{isLoading ? (
						<>
							<Skeleton className="h-6 w-16 rounded-full" />
							<Skeleton className="h-6 w-20 rounded-full" />
							<Skeleton className="h-6 w-14 rounded-full" />
						</>
					) : (
						artifact?.tags?.map((tag) => (
							<View key={tag} className="bg-surface px-3 py-1 rounded-full">
								<Typography.Paragraph className="text-xs text-muted-foreground">
									{tag}
								</Typography.Paragraph>
							</View>
						))
					)}
				</View>

				{/* Description */}
				{isLoading ? (
					<View className="gap-2">
						<Skeleton className="h-4 w-full rounded-md" />
						<Skeleton className="h-4 w-full rounded-md" />
						<Skeleton className="h-4 w-5/6 rounded-md" />
						<Skeleton className="h-4 w-full rounded-md" />
						<Skeleton className="h-4 w-4/6 rounded-md" />
					</View>
				) : (
					<Typography.Paragraph color="muted">
						{artifact?.description || "No description available."}
					</Typography.Paragraph>
				)}
			</ScrollView>
		</>
	);
}
