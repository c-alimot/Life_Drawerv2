import {
    AppPageHeader,
    AppBottomNav,
    SafeArea,
    Screen,
} from "@components/layout";
import { EmptyStateCard, EntryPreviewCard, FilterPill, SectionHeader } from "@components/ui";
import { MOOD_MAP } from "@constants/moods";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEntries } from "@features/entries/hooks/useEntries";
import {
    useSearch,
    type SearchFilters,
} from "@features/search/hooks/useSearch";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@styles/theme";
import type { MoodValue } from "@types";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const PAGE_BACKGROUND = "#EDEAE4";
const PAGE_SURFACE = "#FFFFFF";
const PAGE_SOFT_SURFACE = "#F8F6F2";
const PAGE_TEXT = "#2F2924";
const PAGE_MUTED = "#6F6860";
const PAGE_PRIMARY = "#8C9A7F";
const PAGE_SECONDARY = "#556950";
const PAGE_BORDER = "#B39C87";

type FilterType = "all" | "mood" | "drawer" | "tag" | "date";

export function SearchScreen() {
  const theme = useTheme();
  const { entries, isLoading, total, fetchEntries } = useEntries();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [hasLoadedSearch, setHasLoadedSearch] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    mood: null,
    drawer: null,
    tag: null,
    dateRange: "all",
  });
  const { searchRequest } = useSearch(searchTerm, filters);

  const loadSearchResults = useCallback(async () => {
    await fetchEntries(searchRequest);
    setHasLoadedSearch(true);
  }, [fetchEntries, searchRequest]);

  useFocusEffect(
    useCallback(() => {
      loadSearchResults();
    }, [loadSearchResults]),
  );

  const handleEntryPress = useCallback((entryId: string) => {
    router.push({
      pathname: "/edit-entry/[entryId]",
      params: { entryId, fromSearch: "1" },
    });
  }, []);

  const handleMoodFilterChange = useCallback((mood: MoodValue | null) => {
    setFilters((prev) => ({ ...prev, mood }));
  }, []);

  const handleDrawerFilterChange = useCallback((drawerId: string | null) => {
    setFilters((prev) => ({ ...prev, drawer: drawerId }));
  }, []);

  const handleTagFilterChange = useCallback((tagId: string | null) => {
    setFilters((prev) => ({ ...prev, tag: tagId }));
  }, []);

  const handleDateRangeChange = useCallback(
    (range: "all" | "today" | "week" | "month") => {
      setFilters((prev) => ({ ...prev, dateRange: range }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters({
      mood: null,
      drawer: null,
      tag: null,
      dateRange: "all",
    });
    setSearchTerm("");
    setActiveFilter("all");
  }, []);

  const uniqueDrawers = useMemo(() => {
    const drawerMap = new Map();
    entries?.forEach((entry) => {
      entry.drawers?.forEach((drawer) => {
        drawerMap.set(drawer.id, drawer);
      });
    });
    return Array.from(drawerMap.values());
  }, [entries]);

  const uniqueTags = useMemo(() => {
    const tagMap = new Map();
    entries?.forEach((entry) => {
      entry.tags?.forEach((tag) => {
        tagMap.set(tag.id, tag);
      });
    });
    return Array.from(tagMap.values());
  }, [entries]);

  const hasActiveFilters =
    Boolean(filters.mood) ||
    Boolean(filters.drawer) ||
    Boolean(filters.tag) ||
    filters.dateRange !== "all" ||
    searchTerm !== "";

  const renderFilterSectionTitle = (title: string) => (
    <Text
      style={[
        theme.typography.labelSm,
        styles.filterSectionTitle,
        { color: PAGE_MUTED },
      ]}
    >
      {title}
    </Text>
  );

  if (isLoading && !hasLoadedSearch) {
    return (
      <SafeArea>
        <Screen
          style={[styles.container, { backgroundColor: PAGE_BACKGROUND }]}
        >
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={PAGE_PRIMARY} />
          </View>
        </Screen>
      </SafeArea>
    );
  }

  return (
    <SafeArea>
      <Screen style={[styles.container, { backgroundColor: PAGE_BACKGROUND }]}>
        <AppPageHeader
          rightSlot={
            <View style={styles.headerIconButton}>
              <MaterialCommunityIcons
                name="magnify"
                size={30}
                color={PAGE_PRIMARY}
              />
            </View>
          }
        />

        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.pageContent}
          ListHeaderComponent={
            <>
              <View style={styles.heroBlock}>
                <Text
                  style={[
                    styles.heroTitlePrimary,
                    { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
                  ]}
                >
                  Search your{" "}
                  <Text
                    style={[styles.heroTitleSecondary, { color: PAGE_PRIMARY }]}
                  >
                    archive
                  </Text>
                </Text>
                <Text style={[styles.heroDescription, { color: PAGE_MUTED }]}>
                  Revisit moments by memory, mood, drawer, tag, or time.
                </Text>
              </View>

              <View
                style={[
                  styles.searchCard,
                  {
                    backgroundColor: PAGE_SURFACE,
                    shadowColor: PAGE_TEXT,
                    borderColor: PAGE_BORDER,
                  },
                ]}
              >
                <View
                  style={[
                    styles.searchBar,
                    {
                      backgroundColor: PAGE_SOFT_SURFACE,
                      borderColor: theme.colors.accent1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="magnify"
                    size={22}
                    color={PAGE_PRIMARY}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={[styles.searchInput, { color: PAGE_TEXT }]}
                    placeholder="Search by title or content"
                    placeholderTextColor={PAGE_MUTED}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    accessibilityLabel="Search entries"
                  />
                </View>

                <View style={styles.searchMetaRow}>
                  <Text
                    style={[theme.typography.bodySm, { color: PAGE_MUTED }]}
                  >
                    {total} {total === 1 ? "entry" : "entries"} found
                  </Text>
                  <View style={styles.searchMetaActions}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color={PAGE_PRIMARY} />
                    ) : null}
                    {hasActiveFilters ? (
                      <TouchableOpacity
                        onPress={clearFilters}
                        accessible
                        accessibilityLabel="Clear filters"
                      >
                        <Text
                          style={[styles.clearText, { color: PAGE_SECONDARY }]}
                        >
                          Clear all
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>

              <SectionHeader
                label="Filters"
                textColor={PAGE_MUTED}
                dividerColor={theme.colors.accent1}
              />

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterTabs}
              >
                <FilterPill
                  label="All"
                  selected={activeFilter === "all"}
                  onPress={() => setActiveFilter("all")}
                  accessibilityLabel="All entries filter"
                />
                <FilterPill
                  label="Mood"
                  selected={activeFilter === "mood"}
                  onPress={() => setActiveFilter("mood")}
                  accessibilityLabel="Filter by mood"
                />
                <FilterPill
                  label="Drawer"
                  selected={activeFilter === "drawer"}
                  onPress={() => setActiveFilter("drawer")}
                  accessibilityLabel="Filter by drawer"
                />
                <FilterPill
                  label="Tag"
                  selected={activeFilter === "tag"}
                  onPress={() => setActiveFilter("tag")}
                  accessibilityLabel="Filter by tag"
                />
                <FilterPill
                  label="Date"
                  selected={activeFilter === "date"}
                  onPress={() => setActiveFilter("date")}
                  accessibilityLabel="Filter by date"
                />
              </ScrollView>

              <View
                style={[
                  styles.filterPanel,
                  {
                    backgroundColor: PAGE_SURFACE,
                    shadowColor: PAGE_TEXT,
                    borderColor: PAGE_BORDER,
                  },
                ]}
              >
                {activeFilter === "all" && (
                  <Text style={[styles.filterHintText, { color: PAGE_MUTED }]}>
                    Search across every entry, or choose a filter to narrow the
                    view.
                  </Text>
                )}

                {activeFilter === "mood" && (
                  <View>
                    {renderFilterSectionTitle("Filter by Mood")}
                    <TouchableOpacity
                      onPress={() => handleMoodFilterChange(null)}
                      style={[
                        styles.filterOption,
                        {
                          backgroundColor:
                            filters.mood === null
                              ? PAGE_PRIMARY + "1F"
                              : PAGE_SOFT_SURFACE,
                          borderColor:
                            filters.mood === null
                              ? PAGE_PRIMARY
                              : theme.colors.accent1,
                        },
                      ]}
                      accessible
                      accessibilityLabel="Clear mood filter"
                    >
                      <Text
                        style={[theme.typography.body, { color: PAGE_TEXT }]}
                      >
                        All moods
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.moodGrid}>
                      {Object.entries(MOOD_MAP).map(([moodKey, moodData]) => (
                        <TouchableOpacity
                          key={moodKey}
                          onPress={() =>
                            handleMoodFilterChange(
                              filters.mood === (moodKey as MoodValue)
                                ? null
                                : (moodKey as MoodValue),
                            )
                          }
                          style={[
                            styles.moodFilterOption,
                            {
                              backgroundColor:
                                filters.mood === moodKey
                                  ? PAGE_PRIMARY + "26"
                                  : PAGE_SOFT_SURFACE,
                              borderColor:
                                filters.mood === moodKey
                                  ? PAGE_PRIMARY
                                  : theme.colors.accent1,
                            },
                          ]}
                          accessible
                          accessibilityLabel={`Filter by ${moodData.label}`}
                        >
                          <Text style={styles.moodEmoji}>{moodData.emoji}</Text>
                          <Text
                            style={[
                              theme.typography.bodySm,
                              styles.moodLabel,
                              { color: PAGE_TEXT },
                            ]}
                          >
                            {moodData.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {activeFilter === "drawer" && (
                  <View>
                    {renderFilterSectionTitle("Filter by Drawer")}
                    <TouchableOpacity
                      onPress={() => handleDrawerFilterChange(null)}
                      style={[
                        styles.filterOption,
                        {
                          backgroundColor:
                            filters.drawer === null
                              ? PAGE_PRIMARY + "1F"
                              : PAGE_SOFT_SURFACE,
                          borderColor:
                            filters.drawer === null
                              ? PAGE_PRIMARY
                              : theme.colors.accent1,
                        },
                      ]}
                      accessible
                      accessibilityLabel="Clear drawer filter"
                    >
                      <Text
                        style={[theme.typography.body, { color: PAGE_TEXT }]}
                      >
                        All drawers
                      </Text>
                    </TouchableOpacity>
                    {uniqueDrawers.map((drawer) => (
                      <TouchableOpacity
                        key={drawer.id}
                        onPress={() =>
                          handleDrawerFilterChange(
                            filters.drawer === drawer.id ? null : drawer.id,
                          )
                        }
                        style={[
                          styles.filterOption,
                          {
                            backgroundColor:
                              filters.drawer === drawer.id
                                ? PAGE_PRIMARY + "1F"
                                : PAGE_SOFT_SURFACE,
                            borderColor:
                              filters.drawer === drawer.id
                                ? PAGE_PRIMARY
                                : theme.colors.accent1,
                          },
                        ]}
                        accessible
                        accessibilityLabel={`Filter by ${drawer.name}`}
                      >
                        <Text
                          style={[theme.typography.body, { color: PAGE_TEXT }]}
                        >
                          {drawer.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {uniqueDrawers.length === 0 ? (
                      <Text
                        style={[styles.filterHintText, { color: PAGE_MUTED }]}
                      >
                        No drawers found yet.
                      </Text>
                    ) : null}
                  </View>
                )}

                {activeFilter === "tag" && (
                  <View>
                    {renderFilterSectionTitle("Filter by Tag")}
                    <TouchableOpacity
                      onPress={() => handleTagFilterChange(null)}
                      style={[
                        styles.filterOption,
                        {
                          backgroundColor:
                            filters.tag === null
                              ? PAGE_PRIMARY + "1F"
                              : PAGE_SOFT_SURFACE,
                          borderColor:
                            filters.tag === null
                              ? PAGE_PRIMARY
                              : theme.colors.accent1,
                        },
                      ]}
                      accessible
                      accessibilityLabel="Clear tag filter"
                    >
                      <Text
                        style={[theme.typography.body, { color: PAGE_TEXT }]}
                      >
                        All tags
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.tagWrap}>
                      {uniqueTags.map((tag) => (
                        <TouchableOpacity
                          key={tag.id}
                          onPress={() =>
                            handleTagFilterChange(
                              filters.tag === tag.id ? null : tag.id,
                            )
                          }
                          style={[
                            styles.tagFilterOption,
                            {
                              backgroundColor:
                                filters.tag === tag.id
                                  ? PAGE_PRIMARY + "1F"
                                  : tag.color + "22",
                              borderColor:
                                filters.tag === tag.id
                                  ? PAGE_PRIMARY
                                  : tag.color,
                            },
                          ]}
                          accessible
                          accessibilityLabel={`Filter by ${tag.name}`}
                        >
                          <Text
                            style={[
                              theme.typography.bodySm,
                              {
                                color:
                                  filters.tag === tag.id
                                    ? PAGE_SECONDARY
                                    : tag.color,
                                fontWeight: "600",
                              },
                            ]}
                          >
                            {tag.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {uniqueTags.length === 0 ? (
                      <Text
                        style={[styles.filterHintText, { color: PAGE_MUTED }]}
                      >
                        No tags found yet.
                      </Text>
                    ) : null}
                  </View>
                )}

                {activeFilter === "date" && (
                  <View>
                    {renderFilterSectionTitle("Filter by Date")}
                    {(["all", "today", "week", "month"] as const).map(
                      (range) => (
                        <TouchableOpacity
                          key={range}
                          onPress={() => handleDateRangeChange(range)}
                          style={[
                            styles.filterOption,
                            {
                              backgroundColor:
                                filters.dateRange === range
                                  ? PAGE_PRIMARY + "1F"
                                  : PAGE_SOFT_SURFACE,
                              borderColor:
                                filters.dateRange === range
                                  ? PAGE_PRIMARY
                                  : theme.colors.accent1,
                            },
                          ]}
                          accessible
                          accessibilityLabel={`Filter by ${range}`}
                        >
                          <Text
                            style={[
                              theme.typography.body,
                              { color: PAGE_TEXT },
                            ]}
                          >
                            {range === "all" && "All time"}
                            {range === "today" && "Today"}
                            {range === "week" && "This week"}
                            {range === "month" && "This month"}
                          </Text>
                        </TouchableOpacity>
                      ),
                    )}
                  </View>
                )}
              </View>

              <SectionHeader
                label="Results"
                textColor={PAGE_MUTED}
                dividerColor={theme.colors.accent1}
              />
            </>
          }
          renderItem={({ item }) => (
            <EntryPreviewCard
              entry={item}
              onPress={() => handleEntryPress(item.id)}
              showDate
              dateText={new Date(item.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            />
          )}
          ListEmptyComponent={
            <EmptyStateCard
              icon="magnify"
              title="No entries found"
              description={
                hasActiveFilters
                  ? "Try adjusting your search terms or clearing a few filters."
                  : "Once you start writing, your searchable archive will appear here."
              }
            />
          }
        />

        <AppBottomNav currentRoute="/search" />
      </Screen>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pageContent: {
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 140,
  },
  heroBlock: {
    marginBottom: 26,
  },
  heroTitlePrimary: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "300",
  },
  heroTitleSecondary: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "300",
  },
  heroDescription: {
    fontSize: 16,
    lineHeight: 26,
    marginTop: 12,
    maxWidth: 360,
  },
  searchCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    minHeight: 62,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  searchMetaRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  searchMetaActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clearText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  filterTabs: {
    paddingBottom: 14,
    gap: 10,
  },
  filterPanel: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 26,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  filterSectionTitle: {
    letterSpacing: 2.2,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  filterHintText: {
    fontSize: 15,
    lineHeight: 24,
  },
  filterOption: {
    minHeight: 54,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 18,
    marginBottom: 10,
    justifyContent: "center",
  },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  moodFilterOption: {
    width: "23%",
    minHeight: 96,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabel: {
    marginTop: 6,
    textAlign: "center",
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tagFilterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 999,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
