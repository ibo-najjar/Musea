import { FlashList } from "@shopify/flash-list";
import {
	useAction,
	useMutation,
	usePaginatedQuery,
	useQuery,
} from "convex/react";
import { Stack } from "expo-router";
import { Typography, useThemeColor } from "heroui-native";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
	Alert,
	InteractionManager,
	useWindowDimensions,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MasonryCard from "@/components/mansory-card";
import MasonrySkeletonGrid from "@/components/masonry-skeleton";
import { Button } from "@/components/ui/button";
import Image from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { SOURCE_ICONS, SOURCE_LABELS, type SourceType } from "@/lib/sources";
import { useAppToast } from "@/lib/toast";
import { api } from "~/convex/_generated/api";
import type { Doc, Id } from "~/convex/_generated/dataModel";

const SEARCH_DEBOUNCE_MS = 600;

type SortDir = "desc" | "asc";
type FilterType = "image" | "video" | "quote" | "link";

const FILTER_LABELS: Record<FilterType, string> = {
	image: "Images",
	video: "Videos",
	quote: "Quotes",
	link: "Links",
};

export default function HomeScreen() {
	const { top } = useSafeAreaInsets();
	const foreground = useThemeColor("foreground");
	const { height } = useWindowDimensions();

	const [sortDir, setSortDir] = useState<SortDir>("desc");
	const [filterType, setFilterType] = useState<FilterType | null>(null);
	const [sourceType, setSourceType] = useState<SourceType | null>(null);

	// Defer attaching the native search bar / toolbar until the tab transition
	// finishes — otherwise iOS builds them synchronously during the animation
	// and freezes the screen for ~1s on tab press.
	const [headerReady, setHeaderReady] = useState(false);
	useEffect(() => {
		const task = InteractionManager.runAfterInteractions(() =>
			setHeaderReady(true),
		);
		return () => task.cancel();
	}, []);

	const {
		results: allArtifacts,
		status,
		loadMore,
	} = usePaginatedQuery(
		api.artifacts.listArtifacts,
		{
			sortDir,
			filterTypes: filterType ? [filterType] : undefined,
			filterSourceTypes: sourceType ? [sourceType] : undefined,
		},
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
				{headerReady && (
					<NativeSearchBarHeader
						setQuery={setQuery}
						sortDir={sortDir}
						setSortDir={setSortDir}
						filterType={filterType}
						setFilterType={setFilterType}
						sourceType={sourceType}
						setSourceType={setSourceType}
					/>
				)}

				<MasonrySkeletonGrid count={12} />
			</View>
		);
	}

	return (
		<View className="flex-1 bg-background">
			{headerReady && (
				<NativeSearchBarHeader
					setQuery={setQuery}
					sortDir={sortDir}
					setSortDir={setSortDir}
					filterType={filterType}
					setFilterType={setFilterType}
					sourceType={sourceType}
					setSourceType={setSourceType}
				/>
			)}

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
						) : filterType !== null || sourceType !== null ? (
							<>
								<Typography.Heading type="h3">no matches</Typography.Heading>
								<Typography.Paragraph color="muted">
									try a different filter
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

const NativeSearchBarHeader = memo(function NativeSearchBarHeader({
	setQuery,
	sortDir,
	setSortDir,
	filterType,
	setFilterType,
	sourceType,
	setSourceType,
}: {
	setQuery: (query: string) => void;
	sortDir: SortDir;
	setSortDir: (dir: SortDir) => void;
	filterType: FilterType | null;
	setFilterType: (type: FilterType | null) => void;
	sourceType: SourceType | null;
	setSourceType: (type: SourceType | null) => void;
}) {
	const accent = useThemeColor("accent");

	const hasFilter = filterType !== null || sourceType !== null;

	return (
		<>
			<Stack.Toolbar placement="left">
				{/* Accent the toolbar button while a specific filter (not "All") is active. */}
				<Stack.Toolbar.Menu
					icon={
						hasFilter
							? "line.3.horizontal.decrease.circle.fill"
							: "line.3.horizontal.decrease.circle"
					}
					variant={hasFilter ? "prominent" : "plain"}
					tintColor={hasFilter ? accent : undefined}
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
					{/* Single-select: the current choice shows next to the "Filter"
						    label; "All" clears the filter. */}
					<Stack.Toolbar.Menu
						title={`Filter: ${filterType ? FILTER_LABELS[filterType] : "All"}`}
					>
						<Stack.Toolbar.MenuAction
							isOn={filterType === null}
							onPress={() => setFilterType(null)}
							icon={"square.grid.2x2.fill"}
						>
							All
						</Stack.Toolbar.MenuAction>
						<Stack.Toolbar.MenuAction
							isOn={filterType === "image"}
							onPress={() => setFilterType("image")}
							icon={"photo"}
						>
							Images
						</Stack.Toolbar.MenuAction>
						<Stack.Toolbar.MenuAction
							isOn={filterType === "video"}
							onPress={() => setFilterType("video")}
							icon={"video"}
						>
							Videos
						</Stack.Toolbar.MenuAction>
						<Stack.Toolbar.MenuAction
							isOn={filterType === "quote"}
							onPress={() => setFilterType("quote")}
							icon={"text.rectangle"}
						>
							Quotes
						</Stack.Toolbar.MenuAction>
						<Stack.Toolbar.MenuAction
							isOn={filterType === "link"}
							onPress={() => setFilterType("link")}
							icon={"link"}
						>
							Links
						</Stack.Toolbar.MenuAction>
					</Stack.Toolbar.Menu>
					{/* Single-select source filter; brand PNG icons render in
						    original colors. "All" clears it. */}
					<Stack.Toolbar.Menu
						title={`Source: ${sourceType ? SOURCE_LABELS[sourceType] : "All"}`}
					>
						<Stack.Toolbar.MenuAction
							isOn={sourceType === null}
							onPress={() => setSourceType(null)}
							icon={"square.grid.2x2.fill"}
						>
							All
						</Stack.Toolbar.MenuAction>
						{(Object.keys(SOURCE_LABELS) as SourceType[]).map((type) => (
							<Stack.Toolbar.MenuAction
								key={type}
								isOn={sourceType === type}
								onPress={() => setSourceType(type)}
								// icon={SOURCE_ICONS[type]}
								iconRenderingMode="original"
								discoverabilityLabel={`Filter by ${SOURCE_LABELS[type]}`}
							>
								{SOURCE_LABELS[type]}
							</Stack.Toolbar.MenuAction>
						))}
					</Stack.Toolbar.Menu>
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
});
