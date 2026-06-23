import { FlashList } from "@shopify/flash-list";
import { useAction, useMutation, useQuery } from "convex/react";
import { GlassContainer, GlassView } from "expo-glass-effect";
import { SymbolView } from "expo-symbols";
import { Spinner, Typography, useThemeColor } from "heroui-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, TextInput, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import MasonryCard from "@/components/mansory-card";
import MasonrySkeletonGrid from "@/components/masonry-skeleton";
import { Button } from "@/components/ui/button";
import { api } from "~/convex/_generated/api";
import { Doc, Id } from "~/convex/_generated/dataModel";

const StyledGlassContainer = withUniwind(GlassContainer);
const StyledGlassView = withUniwind(GlassView);

const SEARCH_DEBOUNCE_MS = 600;

export default function HomeScreen() {
	const { top } = useSafeAreaInsets();
	const foreground = useThemeColor("foreground");
	const { height } = useWindowDimensions();

	const allArtifacts = useQuery(api.artifacts.listArtifacts);
	const currentUser = useQuery(api.auth.getCurrentUser);
	const deleteArtifact = useMutation(api.artifacts.deleteArtifact);
	const searchArtifacts = useAction(api.search.searchArtifacts);

	const [query, setQuery] = useState("");
	const [searchResults, setSearchResults] = useState<
		Doc<"artificats">[] | null
	>(null);
	const [searching, setSearching] = useState(false);

	const searchRequestRef = useRef(0);

	useEffect(() => {
		const trimmed = query.trim();

		if (!trimmed) {
			setSearchResults(null);
			setSearching(false);
			return;
		}

		if (!currentUser?._id) return;

		const id = ++searchRequestRef.current;
		setSearching(true);

		const timer = setTimeout(async () => {
			try {
				const results = await searchArtifacts({
					query: trimmed,
					userId: currentUser._id,
				});
				if (searchRequestRef.current !== id) return;
				setSearchResults(results as Doc<"artificats">[]);
			} catch (err) {
				console.error("Search failed", err);
				if (searchRequestRef.current !== id) return;
				setSearchResults([]);
			} finally {
				if (searchRequestRef.current === id) setSearching(false);
			}
		}, SEARCH_DEBOUNCE_MS);

		return () => clearTimeout(timer);
	}, [query, currentUser?._id, searchArtifacts]);

	const artifacts = query.trim() ? searchResults : allArtifacts;

	const onDeleteArtifact = useCallback(
		(artifactId: Id<"artificats">) => {
			Alert.alert(
				"Delete Artifact",
				"Are you sure you want to delete this artifact? This action cannot be undone.",
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Delete",
						style: "destructive",
						onPress: () => deleteArtifact({ artificatId: artifactId }),
					},
				],
			);
		},
		[deleteArtifact],
	);

	if (artifacts === undefined || searching) {
		return (
			<View className="flex-1 bg-background">
				<SearchBarHeader
					query={query}
					setQuery={setQuery}
					searching={searching}
				/>
				<MasonrySkeletonGrid count={12} contentContainerClassName="pt-13" />
			</View>
		);
	}

	return (
		<View className="flex-1 bg-background">
			<SearchBarHeader
				query={query}
				setQuery={setQuery}
				searching={searching}
			/>

			<FlashList
				contentInsetAdjustmentBehavior="automatic"
				data={artifacts}
				masonry
				showsVerticalScrollIndicator={false}
				numColumns={2}
				className="flex-1"
				contentContainerClassName="pt-13"
				keyExtractor={(item) => item._id}
				ListEmptyComponent={() => (
					<View
						className="justify-center items-center absolute inset-0"
						style={{ height: height - top }}
					>
						{query.trim() && !searching ? (
							<>
								<Typography.Heading type="h3">no results</Typography.Heading>
								<Typography.Paragraph color="muted">
									try different words
								</Typography.Paragraph>
							</>
						) : (
							<>
								<Typography.Heading type="h3">
									it's pretty quiet here...
								</Typography.Heading>
								<Typography.Paragraph color="muted">
									save something to get started
								</Typography.Paragraph>
								<Button isGlass className="mt-2">
									Add your first Artifact
								</Button>
							</>
						)}
					</View>
				)}
				renderItem={({ item }) => (
					<MasonryCard
						item={item}
						onDeleteArtifact={() => onDeleteArtifact(item._id)}
					/>
				)}
			/>
		</View>
	);
}

const SearchBarHeader = ({
	query,
	setQuery,
	searching,
}: {
	query: string;
	setQuery: (query: string) => void;
	searching: boolean;
}) => {
	const { top } = useSafeAreaInsets();

	const foreground = useThemeColor("foreground");

	return (
		<View
			className="absolute top-0 right-0 left-0 z-30"
			style={{ paddingTop: top }}
		>
			<StyledGlassContainer
				className="flex-1 flex-row items-end px-3 gap-2"
				spacing={8}
			>
				<StyledGlassView
					isInteractive
					className="border-continuous flex-1 flex-row rounded-full"
				>
					<TextInput
						nativeID="composer"
						cursorColorClassName="tint-foreground"
						selectionColorClassName="tint-foreground"
						style={{ fontSize: 16 }}
						className="flex-1 pl-4 pr-2 py-3 text-foreground max-h-25"
						placeholder="Search anything..."
						multiline
						maxLength={1000}
						value={query}
						onChangeText={setQuery}
					/>
				</StyledGlassView>
				<Button
					hitSlop={4}
					className="size-11 rounded-full"
					isGlass
					variant="ghost"
					isDisabled={searching || !query.trim()}
				>
					{searching ? (
						<Spinner size="sm" color={foreground} />
					) : (
						<SymbolView
							name={{ ios: "magnifyingglass", android: "search" }}
							className="text-foreground"
							tintColor={foreground}
						/>
					)}
				</Button>
			</StyledGlassContainer>
		</View>
	);
};
