// components/selected-artifacts-stack.tsx

import { Skeleton } from "heroui-native";
import { View } from "react-native";
import Image from "@/components/ui/image";
import { Doc } from "~/convex/_generated/dataModel";
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
			className="rounded overflow-hidden border-2 border-surface bg-surface"
			style={{
				width: SIZE,
				height: SIZE,
			}}
		>
			<Skeleton isLoading={!artifact} className="w-full h-full">
				<Image
					source={{ uri: artifact?.image }}
					style={{ width: "100%", height: "100%" }}
					contentFit="cover"
				/>
			</Skeleton>
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
					className="rounded overflow-hidden border-2 border-surface bg-surface"
					style={{
						width: SIZE,
						height: SIZE,
						marginLeft: i === 0 ? 0 : -OVERLAP,
						zIndex: visible.length - i, // first item on top
					}}
				>
					<Image
						source={{ uri: item.image }}
						style={{ width: "100%", height: "100%" }}
						contentFit="cover"
					/>
				</View>
			))}
			{remaining > 0 && (
				<View
					className="rounded-md items-center justify-center bg-surface border-2 border-background"
					style={{
						width: SIZE,
						height: SIZE,
						marginLeft: -OVERLAP,
					}}
				>
					<Text className="text-[10px] font-medium text-foreground">
						+{remaining}
					</Text>
				</View>
			)}
		</View>
	);
};
