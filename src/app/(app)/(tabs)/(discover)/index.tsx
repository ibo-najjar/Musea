import { FlashList } from "@shopify/flash-list";
import {
	useAction,
	useMutation,
	usePaginatedQuery,
	useQuery,
} from "convex/react";
import { Stack, useRouter } from "expo-router";
import { Typography, useThemeColor } from "heroui-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MasonryCard from "@/components/mansory-card";
import MasonrySkeletonGrid from "@/components/masonry-skeleton";
import { Button } from "@/components/ui/button";
import Image from "@/components/ui/image";
import { useAppToast } from "@/lib/toast";
import { api } from "~/convex/_generated/api";
import type { Doc, Id } from "~/convex/_generated/dataModel";

const SEARCH_DEBOUNCE_MS = 600;

type SortDir = "desc" | "asc";
type FilterType = "image" | "video" | "quote" | "link";

export default function HomeScreen() {
	const { top } = useSafeAreaInsets();
	const foreground = useThemeColor("foreground");
	const { height } = useWindowDimensions();

	const [sortDir, setSortDir] = useState<SortDir>("desc");
	const [filterTypes, setFilterTypes] = useState<FilterType[]>([]);

	const toggleFilter = useCallback((type: FilterType) => {
		setFilterTypes((prev) =>
			prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
		);
	}, []);
	const clearFilters = useCallback(() => setFilterTypes([]), []);

	const {
		results: allArtifacts,
		status,
		loadMore,
	} = usePaginatedQuery(
		api.artifacts.listArtifacts,
		{ sortDir, filterTypes: filterTypes.length ? filterTypes : undefined },
		{ initialNumItems: 24 },
	);
	const currentUser = useQuery(api.auth.getCurrentUser);
	const deleteArtifact = useMutation(api.artifacts.deleteArtifact);
	const searchArtifacts = useAction(api.search.searchArtifacts);
	const toast = useAppToast();

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

	const isSearch = !!query.trim();
	const artifacts = isSearch ? searchResults : allArtifacts;

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
						onPress: async () => {
							try {
								await deleteArtifact({ artificatId: artifactId });
								toast.success("Deleted");
							} catch (err) {
								toast.error(
									"Couldn't delete",
									err instanceof Error ? err.message : undefined,
								);
							}
						},
					},
				],
			);
		},
		[deleteArtifact, toast],
	);

	if (searching || (!isSearch && status === "LoadingFirstPage")) {
		return (
			<View className="flex-1 bg-background">
				<NativeSearchBarHeader
					setQuery={setQuery}
					sortDir={sortDir}
					setSortDir={setSortDir}
					filterTypes={filterTypes}
					toggleFilter={toggleFilter}
					clearFilters={clearFilters}
				/>
				<MasonrySkeletonGrid count={12} />
			</View>
		);
	}

	return (
		<View className="flex-1 bg-background">
			<NativeSearchBarHeader
				setQuery={setQuery}
				sortDir={sortDir}
				setSortDir={setSortDir}
				filterTypes={filterTypes}
				toggleFilter={toggleFilter}
				clearFilters={clearFilters}
			/>
			<FlashList
				contentInsetAdjustmentBehavior="automatic"
				data={artifacts}
				masonry
				showsVerticalScrollIndicator={false}
				numColumns={2}
				className="flex-1"
				keyExtractor={(item) => item._id}
				onEndReachedThreshold={0.5}
				onEndReached={() => {
					if (!isSearch && status === "CanLoadMore") loadMore(24);
				}}
				ListEmptyComponent={() => (
					<View
						className="absolute inset-0 items-center justify-center"
						style={{ height: height - top - 100 }}
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
								<Image
									source={require("@/assets/images/arrow.svg")}
									className="mt-2 h-52 w-32 absolute bottom-14 right-4 -rotate-12"
									tintColor={foreground}
								/>
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

const NativeSearchBarHeader = ({
	setQuery,
	sortDir,
	setSortDir,
	filterTypes,
	toggleFilter,
	clearFilters,
}: {
	setQuery: (query: string) => void;
	sortDir: SortDir;
	setSortDir: (dir: SortDir) => void;
	filterTypes: FilterType[];
	toggleFilter: (type: FilterType) => void;
	clearFilters: () => void;
}) => {
	const router = useRouter();
	const accent = useThemeColor("accent");

	const hasFilters = filterTypes.length > 0;

	return (
		<>
			<Stack.Toolbar placement="left">
				<Stack.Toolbar.Menu
					icon={
						hasFilters
							? "line.3.horizontal.decrease.circle.fill"
							: "line.3.horizontal.decrease.circle"
					}
					variant={hasFilters ? "prominent" : "plain"}
					tintColor={hasFilters ? accent : undefined}
				>
					<Stack.Toolbar.Menu inline title="Sort By">
						<Stack.Toolbar.MenuAction
							isOn={sortDir === "desc"}
							onPress={() => setSortDir("desc")}
							unstable_keepPresented
						>
							Newest
						</Stack.Toolbar.MenuAction>
						<Stack.Toolbar.MenuAction
							isOn={sortDir === "asc"}
							onPress={() => setSortDir("asc")}
							unstable_keepPresented
						>
							Oldest
						</Stack.Toolbar.MenuAction>
					</Stack.Toolbar.Menu>
					<Stack.Toolbar.Menu title="Filter">
						<Stack.Toolbar.Menu inline>
							<Stack.Toolbar.MenuAction
								isOn={filterTypes.includes("image")}
								onPress={() => toggleFilter("image")}
								unstable_keepPresented
								icon={"photo"}
							>
								Images
							</Stack.Toolbar.MenuAction>
							<Stack.Toolbar.MenuAction
								isOn={filterTypes.includes("video")}
								onPress={() => toggleFilter("video")}
								unstable_keepPresented
								icon={"video"}
							>
								Videos
							</Stack.Toolbar.MenuAction>
							<Stack.Toolbar.MenuAction
								isOn={filterTypes.includes("quote")}
								onPress={() => toggleFilter("quote")}
								unstable_keepPresented
								icon={"text.rectangle"}
							>
								Quotes
							</Stack.Toolbar.MenuAction>
							<Stack.Toolbar.MenuAction
								isOn={filterTypes.includes("link")}
								onPress={() => toggleFilter("link")}
								unstable_keepPresented
								icon={"link"}
							>
								Links
							</Stack.Toolbar.MenuAction>
						</Stack.Toolbar.Menu>
					</Stack.Toolbar.Menu>

					<Stack.Toolbar.MenuAction
						hidden={!hasFilters}
						destructive
						onPress={clearFilters}
						icon={"xmark.circle"}
						subtitle={filterTypes.join(", ") || "No filters applied"}
					>
						Remove filters
					</Stack.Toolbar.MenuAction>
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>

			<Stack.SearchBar
				placeholder="Search anything..."
				placement="integratedButton"
				hideWhenScrolling
				inputType="text"
				tintColor={accent}
				onChangeText={(e) => setQuery(e.nativeEvent.text)}
				onCancelButtonPress={() => setQuery("")}
			/>
		</>
	);
};
