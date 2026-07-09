// components/selected-artifacts-stack.tsx

import { Skeleton } from "heroui-native";
import { View } from "react-native";
import type { Doc } from "~/convex/_generated/dataModel";
import { PreviewTile } from "./preview-tile";
import { Text } from "./ui/text";

const SIZE = 36;
const OVERLAP = 16; // how much each square overlaps the previous
const MAX_VISIBLE = 20;

export const SelectedArtifact = ({
	artifact,
}: {
	artifact: Doc<"artificats"> | undefined | null;
}) => {
	return (
		<View
			className="relative overflow-hidden rounded border-2 border-surface bg-surface"
			style={{
				width: SIZE,
				height: SIZE,
			}}
		>
			{artifact ? (
				<PreviewTile
					item={{
						image: artifact.image,
						title: artifact.title,
						description: artifact.description,
					}}
					variant="compact"
					className="absolute inset-0"
				/>
			) : (
				<Skeleton isLoading className="absolute inset-0" />
			)}
		</View>
	);
};

export const SelectedArtifactsStack = ({
	artifacts,
}: {
	artifacts: Doc<"artificats">[];
}) => {
	const visible = artifacts.slice(0, MAX_VISIBLE);
	const remaining = artifacts.length - visible.length;

	return (
		<View className="flex-row items-center">
			{visible.map((item, i) => (
				<View
					key={item._id}
					className="relative overflow-hidden rounded border-2 border-surface bg-surface"
					style={{
						width: SIZE,
						height: SIZE,
						marginLeft: i === 0 ? 0 : -OVERLAP,
						zIndex: visible.length - i, // first item on top
					}}
				>
					<PreviewTile
						item={{
							image: item.image,
							title: item.title,
							description: item.description,
						}}
						variant="compact"
						className="absolute inset-0"
					/>
				</View>
			))}
			{remaining > 0 && (
				<View
					className="items-center justify-center rounded-md border-2 border-background bg-surface"
					style={{
						width: SIZE,
						height: SIZE,
						marginLeft: -OVERLAP,
					}}
				>
					<Text className="font-medium text-[10px] text-foreground">
						+{remaining}
					</Text>
				</View>
			)}
		</View>
	);
};
