import { Card, Skeleton } from "heroui-native";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import Image from "@/components/ui/image";
import type { PreviewData } from "./types";

type DuplicateArtifact = {
	_id: string;
	title?: string;
	image?: string;
};

export function UrlPreview({
	loading,
	preview,
	duplicate,
	onViewDuplicate,
	onSaveAnyway,
}: {
	loading: boolean;
	preview: PreviewData | null;
	duplicate: DuplicateArtifact | null;
	onViewDuplicate: () => void;
	onSaveAnyway: () => void;
}) {
	return (
		<View>
			{duplicate && (
				<Card className="mt-4">
					<Card.Body className="gap-3">
						<View className="flex-row items-center gap-3">
							{duplicate.image ? (
								<Image
									source={{ uri: duplicate.image }}
									className="size-12 rounded-lg bg-surface-tertiary"
									contentFit="cover"
								/>
							) : null}
							<View className="flex-1">
								<Text className="font-semibold text-foreground">
									Already saved
								</Text>
								<Text className="text-muted-foreground" numberOfLines={1}>
									{duplicate.title}
								</Text>
							</View>
						</View>
						<View className="flex-row gap-2">
							<Button
								size="sm"
								isGlass
								variant="tertiary"
								className="flex-1"
								onPress={onViewDuplicate}
							>
								View
							</Button>
							<Button
								size="sm"
								isGlass
								variant="danger"
								className="flex-1"
								onPress={onSaveAnyway}
							>
								Save anyway
							</Button>
						</View>
					</Card.Body>
				</Card>
			)}

			{loading && (
				<View className="mt-4 gap-2">
					<Skeleton className="h-48 w-full rounded-xl" />
					<Skeleton className="h-5 w-3/4 rounded-md" />
					<Skeleton className="h-4 w-full rounded-md" />
					<Skeleton className="h-4 w-2/3 rounded-md" />
				</View>
			)}

			{!loading && preview && (
				<View className="mt-4 gap-2">
					{preview.image ? (
						<Image
							source={{ uri: preview.image }}
							className="w-full rounded-xl bg-surface-tertiary"
							contentFit="contain"
							style={{ height: "100%", width: "100%" }}
						/>
					) : null}
					<Text className="font-semibold text-foreground text-lg">
						{preview.title}
					</Text>
					{preview.description ? (
						<Text className="text-muted-foreground" numberOfLines={3}>
							{preview.description}
						</Text>
					) : null}
				</View>
			)}
		</View>
	);
}
