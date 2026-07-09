import { Link, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Checkbox, Spinner, Typography } from "heroui-native";
import { useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import type { Doc } from "~/convex/_generated/dataModel";
import { Button } from "./ui/button";
import Image from "./ui/image";
import { Text } from "./ui/text";

const NUM_COLUMNS = 2;
const ITEM_MARGIN = 8;

const TEXT_SIZE_TYPE = {
	sm: "body-xs",
	md: "body-sm",
	lg: "body",
	xl: "h4",
} as const;

const TEXT_SIZE_LINES = {
	sm: 9,
	md: 7,
	lg: 6,
	xl: 4,
} as const;

const MasonryCard = ({
	item,
	onDeleteArtifact,
	isSelecting,
	isSelected,
	onToggle,
	onRemoveFromGallery,
}: {
	item: Doc<"artificats">;
	onDeleteArtifact?: (id: string) => void;
	isSelecting?: boolean;
	isSelected?: boolean;
	onToggle?: (id: string) => void;
	onRemoveFromGallery?: (id: string) => void;
}) => {
	const { width: screenWidth } = useWindowDimensions();
	const columnWidth = screenWidth / NUM_COLUMNS - ITEM_MARGIN * 2;

	const [imgHeight, setImgHeight] = useState<number>(200);

	const router = useRouter();

	const isPending = item.status === "pending";
	const isFailed = item.status === "failed";

	return (
		<View className="m-2 overflow-hidden rounded-2xl ">
			<Link
				href={{
					pathname: "/(app)/(modal)/artifact/[artifactId]",
					params: {
						artifactId: item._id,
						image: item.image,
						title: item.title,
						sourceType: item.sourceType,
					},
				}}
				className="bg-surface"
				asChild
			>
				<Link.Trigger>
					<Link.AppleZoom>
						<Pressable>
							{item.sourceType === "richtext" ? (
								<View
									className="w-full overflow-hidden p-3"
									style={{ width: columnWidth }}
								>
									<Typography type={"h4"} weight={"semibold"} numberOfLines={2}>
										{item.title}
									</Typography>
									<Typography.Paragraph
										type="body-xs"
										color="muted"
										numberOfLines={12}
									>
										{item.description}
									</Typography.Paragraph>
								</View>
							) : item.image ? (
								<Image
									className="w-full"
									source={{ uri: item.image }}
									style={{ height: imgHeight, width: columnWidth }}
									contentFit="cover"
									cachePolicy="memory-disk"
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
							{item.videoUrl && !isPending && (
								<View className="absolute inset-0 items-center justify-center">
									<View className="rounded-full bg-black/50 p-2">
										<SymbolView name="play.fill" size={24} tintColor="white" />
									</View>
								</View>
							)}
							{isPending && (
								<Button
									size="sm"
									isGlass
									variant="ghost"
									className="absolute bottom-2 left-2 h-7 gap-1 bg-surface/80 px-2"
								>
									<Spinner size="sm" />
									<Text className="text-foreground/70 text-xs">
										Organizing...
									</Text>
								</Button>
							)}
							{isFailed && (
								<Button
									size="sm"
									isGlass
									variant="ghost"
									className="absolute bottom-2 left-2 h-7 gap-1 bg-surface/80 px-2"
								>
									<SymbolView
										name="exclamationmark.triangle.fill"
										size={12}
										tintColor="#f59e0b"
									/>
									<Text className="text-foreground/70 text-xs">
										Couldn't process
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
					{onRemoveFromGallery && (
						<Link.MenuAction
							icon="rectangle.stack.badge.minus"
							destructive
							onPress={() => onRemoveFromGallery(item._id)}
						>
							Remove from Gallery
						</Link.MenuAction>
					)}
					{onDeleteArtifact && (
						<Link.MenuAction
							icon="trash"
							destructive
							onPress={() => onDeleteArtifact(item._id)}
						>
							Delete Artifact
						</Link.MenuAction>
					)}
				</Link.Menu>
			</Link>
			{isSelecting && (
				<Pressable
					className="absolute inset-0"
					onPress={() => onToggle?.(item._id)}
				>
					{isSelected && <View className="absolute inset-0 bg-black/30" />}
					<View className="absolute top-2 right-2">
						<Checkbox
							isSelected={isSelected}
							className="bg-foreground/30"
							onPress={() => onToggle?.(item._id)}
						/>
					</View>
				</Pressable>
			)}
		</View>
	);
};

export default MasonryCard;
