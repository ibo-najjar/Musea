import { useQuery } from "convex/react";
import { View } from "react-native";
import { api } from "~/convex/_generated/api";
import { Doc, Id } from "~/convex/_generated/dataModel";
import { GalleryPreview } from "./gallery-card";
import { Text } from "./ui/text";

const OVERLAP = 10;
const MAX_VISIBLE = 5;

export const SelectedGallery = ({
	galleryId,
	SIZE = 36,
}: {
	galleryId: Id<"gallery">;
	SIZE?: number;
}) => {
	const preview = useQuery(api.galleryArtifacts.getGalleryPreview, {
		galleryId: galleryId,
	});

	const images = (preview ?? [])
		.map((artifact) => artifact.image)
		.filter((url): url is string => Boolean(url));
	const count = preview?.length ?? 0;
	return (
		<View
			className="overflow-hidden rounded border-2 border-surface bg-surface"
			style={{
				width: SIZE,
				height: SIZE,
			}}
		>
			<GalleryPreview count={count} images={images} className="rounded-none" />
		</View>
	);
};

const GalleryItem = ({ galleryId }: { galleryId: Id<"gallery"> }) => {
	const preview = useQuery(api.galleryArtifacts.getGalleryPreview, {
		galleryId: galleryId,
	});

	const images = (preview ?? [])
		.map((artifact) => artifact.image)
		.filter((url): url is string => Boolean(url));
	const count = preview?.length ?? 0;
	return (
		<GalleryPreview
			count={count}
			images={images}
			className="rounded-none"
			gapClassName="gap-0.5"
		/>
	);
};

export const SelectedGalleriesStack = ({
	galleries,
	SIZE = 36,
}: {
	galleries?: Doc<"gallery">[];
	SIZE?: number;
}) => {
	if (!galleries || galleries.length === 0) {
		return null;
	}

	const visible = galleries.slice(0, MAX_VISIBLE);
	const remaining = galleries.length - visible.length;

	return (
		<View className="flex-row items-center">
			{visible.map(({ _id }, i) => (
				<View
					key={_id}
					className="overflow-hidden rounded border-2 border-surface bg-surface-secondary"
					style={{
						width: SIZE,
						height: SIZE,
						marginLeft: i === 0 ? 0 : -OVERLAP,
						zIndex: visible.length - i,
					}}
				>
					<GalleryItem galleryId={_id} />
				</View>
			))}

			{remaining > 0 && (
				<View
					className="items-center justify-center rounded bg-surface-tertiary border-2 border-surface"
					style={{
						width: SIZE,
						height: SIZE,
						marginLeft: -OVERLAP,
					}}
				>
					<Text className="text-[10px] font-semibold text-muted">
						+{remaining}
					</Text>
				</View>
			)}
		</View>
	);
};
