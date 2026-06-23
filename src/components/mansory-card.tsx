import { Link, useRouter } from "expo-router";
import { Spinner } from "heroui-native";
import { useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { Doc } from "~/convex/_generated/dataModel";
import { Button } from "./ui/button";
import Image from "./ui/image";
import { Text } from "./ui/text";

const NUM_COLUMNS = 2;
const ITEM_MARGIN = 8;

const MasonryCard = ({
	item,
	onDeleteArtifact,
}: {
	item: Doc<"artificats">;
	onDeleteArtifact?: (id: string) => void;
}) => {
	const { width: screenWidth } = useWindowDimensions();
	const columnWidth = screenWidth / NUM_COLUMNS - ITEM_MARGIN * 2;

	const [imgHeight, setImgHeight] = useState<number>(200);

	const router = useRouter();

	const isPending = item.status === "pending";

	return (
		<View className="m-2 overflow-hidden rounded-2xl bg-surface">
			<Link
				href={{
					pathname: "/(app)/(modal)/artifact/[artifactId]",
					params: {
						artifactId: item._id,
						image: item.image,
						title: item.title,
					},
				}}
				asChild
			>
				<Link.Trigger>
					<Link.AppleZoom>
						<Pressable>
							{item.image ? (
								<Image
									className="w-full"
									source={{ uri: item.image }}
									style={{ height: imgHeight, width: columnWidth }}
									contentFit="cover"
									onLoad={(e) => {
										const { width, height } = e.source;
										if (width && height) {
											setImgHeight((height / width) * columnWidth);
										}
									}}
								/>
							) : (
								<View
									className="w-full bg-muted/20"
									style={{ height: 120, width: columnWidth }}
								/>
							)}
							{isPending && (
								<Button
									size="sm"
									isGlass
									variant="ghost"
									className="absolute bottom-2 left-2 h-7 px-2 gap-1 bg-surface/80 "
								>
									<Spinner size="sm" />
									<Text className="text-xs text-foreground/70">
										Processing...
									</Text>
								</Button>
							)}
						</Pressable>
					</Link.AppleZoom>
				</Link.Trigger>
				<Link.Menu>
					<Link.MenuAction
						icon="rectangle.stack.fill.badge.plus"
						onPress={() =>
							router.push({
								pathname: "/(app)/(modal)/artifact-galleries/[artifactId]",
								params: { artifactId: item._id },
							})
						}
					>
						Add to Gallery
					</Link.MenuAction>
					<Link.MenuAction icon="heart">Add to Favorite</Link.MenuAction>
					{onDeleteArtifact && (
						<Link.MenuAction
							icon="xmark.square"
							destructive
							onPress={() => onDeleteArtifact(item._id)}
						>
							Delete Artifact
						</Link.MenuAction>
					)}
				</Link.Menu>
			</Link>
		</View>
	);
};

export default MasonryCard;
