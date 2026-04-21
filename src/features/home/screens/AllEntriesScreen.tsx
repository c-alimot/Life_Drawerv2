import { AppBottomNav, AppPageHeader, SafeArea, Screen } from "@components/layout";
import { AppModalSheet, Button, EmptyStateCard, EntryPreviewCard, FilterPill, SectionHeader } from "@components/ui";
import { ENTRY_PREVIEW_PILLS } from "@constants/entryPreviewPills";
import { MaterialCommunityIcons } from "@components/ui/icons";
import { useDeleteEntry } from "@features/entries/hooks/useDeleteEntry";
import { useEntries } from "@features/entries/hooks/useEntries";
import { useDrawers } from "@features/drawers/hooks/useDrawers";
import { useTags } from "@features/tags/hooks/useTags";
import { useTheme } from "@styles/theme";
import type { EntryWithRelations, SearchEntriesRequest } from "@types";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface GroupedEntries {
  [date: string]: EntryWithRelations[];
}

const PAGE_BACKGROUND = "#EDEAE4";
const PAGE_TEXT = "#2F2924";
const PAGE_MUTED = "#6F6860";
const PAGE_PRIMARY = "#8C9A7F";
const PAGE_SECONDARY = "#556950";
const PAGE_SURFACE = "#FFFFFF";
const CANCEL_BUTTON_BG = "#E3E1DC";
const CANCEL_BUTTON_BORDER = "#C9C4BB";
const CANCEL_BUTTON_TEXT = "#5F6368";

export function AllEntriesScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ tagId?: string }>();
  const initialTagId = Array.isArray(params.tagId) ? params.tagId[0] : params.tagId;
  const { entries, isLoading, total, fetchEntries } = useEntries();
  const { deleteEntry } = useDeleteEntry();
  const { drawers, fetchDrawers } = useDrawers();
  const { tags, fetchTags } = useTags();

  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [selectedDrawerId, setSelectedDrawerId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(initialTagId ?? null);
  const [draftSortOrder, setDraftSortOrder] = useState<"desc" | "asc">("desc");
  const [draftDrawerId, setDraftDrawerId] = useState<string | null>(null);
  const [draftTagId, setDraftTagId] = useState<string | null>(initialTagId ?? null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [entryMenuTarget, setEntryMenuTarget] = useState<EntryWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EntryWithRelations | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const neutralButtonTextStyle = { color: PAGE_TEXT, fontWeight: "700" } as const;
  const secondaryButtonTextStyle = { color: PAGE_SECONDARY, fontWeight: "700" } as const;
  const cancelButtonTextStyle = { color: CANCEL_BUTTON_TEXT, fontWeight: "700" } as const;
  const dangerButtonTextStyle = { color: "#FFFFFF", fontWeight: "700" } as const;

  useEffect(() => {
    setSelectedTagId(initialTagId ?? null);
    setDraftTagId(initialTagId ?? null);
  }, [initialTagId]);

  useEffect(() => {
    fetchDrawers();
    fetchTags();
  }, [fetchDrawers, fetchTags]);

  const request = useMemo<SearchEntriesRequest>(
    () => ({
      limit: 100,
      offset: 0,
      sortOrder,
      drawerIds: selectedDrawerId ? [selectedDrawerId] : undefined,
      tagIds: selectedTagId ? [selectedTagId] : undefined,
    }),
    [selectedDrawerId, selectedTagId, sortOrder],
  );

  useEffect(() => {
    let isMounted = true;

    const loadEntries = async () => {
      setIsRefreshing(true);
      await fetchEntries(request);
      if (isMounted) {
        setIsRefreshing(false);
      }
    };

    loadEntries();

    return () => {
      isMounted = false;
    };
  }, [fetchEntries, request]);

  const groupedEntries = useMemo(() => {
    const grouped: GroupedEntries = {};
    entries.forEach((entry) => {
      const date = new Date(entry.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push(entry);
    });

    return grouped;
  }, [entries]);

  const handleSearch = useCallback(() => {
    router.push("/search");
  }, []);

  const handleEntryPress = useCallback((entryId: string) => {
    router.push(`/edit-entry/${entryId}`);
  }, []);

  const handleEditEntry = useCallback((entryId: string) => {
    router.push(`/edit-entry/${entryId}`);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedDrawerId(null);
    setSelectedTagId(null);
    setSortOrder("desc");
    setDraftDrawerId(null);
    setDraftTagId(null);
    setDraftSortOrder("desc");
  }, []);

  const openFilters = useCallback(() => {
    setDraftSortOrder(sortOrder);
    setDraftDrawerId(selectedDrawerId);
    setDraftTagId(selectedTagId);
    setIsFiltersOpen(true);
  }, [selectedDrawerId, selectedTagId, sortOrder]);

  const closeFilters = useCallback(() => {
    setIsFiltersOpen(false);
  }, []);

  const handleSaveFilters = useCallback(() => {
    setSortOrder(draftSortOrder);
    setSelectedDrawerId(draftDrawerId);
    setSelectedTagId(draftTagId);
    setIsFiltersOpen(false);
  }, [draftDrawerId, draftSortOrder, draftTagId]);

  const handleClearDraftFilters = useCallback(() => {
    setDraftDrawerId(null);
    setDraftTagId(null);
    setDraftSortOrder("desc");
  }, []);

  const closeEntryMenu = useCallback(() => {
    setEntryMenuTarget(null);
  }, []);

  const handleEditFromMenu = useCallback(() => {
    if (!entryMenuTarget) {
      return;
    }

    const targetId = entryMenuTarget.id;
    setEntryMenuTarget(null);
    handleEditEntry(targetId);
  }, [entryMenuTarget, handleEditEntry]);

  const handleDeletePrompt = useCallback(() => {
    if (!entryMenuTarget) {
      return;
    }

    setDeleteTarget(entryMenuTarget);
    setEntryMenuTarget(null);
  }, [entryMenuTarget]);

  const handleDeleteEntry = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    const success = await deleteEntry(deleteTarget.id);
    setDeleteTarget(null);

    if (success) {
      await fetchEntries(request);
    } else {
      Alert.alert("Error", "Failed to delete entry");
    }
  }, [deleteEntry, deleteTarget, fetchEntries, request]);

  const hasActiveFilters =
    sortOrder !== "desc" || selectedDrawerId !== null || selectedTagId !== null;

  if (isLoading && entries.length === 0) {
    return (
      <SafeArea>
        <Screen style={[styles.container, { backgroundColor: PAGE_BACKGROUND }]}>
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
        <AppPageHeader onSearchPress={handleSearch} />

        <FlatList
          data={Object.entries(groupedEntries)}
          keyExtractor={([date]) => date}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <>
              <View style={styles.heroBlock}>
                <Text
                  style={[
                    styles.heroTitle,
                    { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
                  ]}
                >
                  Your{" "}
                  <Text style={{ color: PAGE_PRIMARY }}>Entries</Text>
                </Text>
              </View>

              <View style={styles.archiveHeaderRow}>
                <View style={styles.archiveHeaderContent}>
                  <SectionHeader
                    label="Archive"
                    textColor={PAGE_MUTED}
                    dividerColor={theme.colors.accent1}
                  />
                </View>
                <TouchableOpacity
                  onPress={openFilters}
                  style={styles.archiveFilterButton}
                  accessible
                  accessibilityLabel="Open sort and filter options"
                >
                  <MaterialCommunityIcons name="tune-variant" size={24} color={PAGE_PRIMARY} />
                </TouchableOpacity>
              </View>

              {entries.length === 0 ? (
                <EmptyStateCard
                  icon="pencil-outline"
                  title="No matching entries"
                  description="Try a different sort or filter to explore more of your archive."
                />
              ) : null}
            </>
          }
          renderItem={({ item: [date, dateEntries] }) => (
            <View style={styles.dateGroup}>
              <Text
                style={[
                  theme.typography.bodySm,
                  {
                    color: PAGE_MUTED,
                    marginBottom: theme.spacing.md,
                    fontWeight: "500",
                  },
                ]}
              >
                {date}
              </Text>
              {dateEntries.map((entry) => (
                <EntryPreviewCard
                  key={entry.id}
                  entry={entry}
                  onPress={() => handleEntryPress(entry.id)}
                  onMenuPress={() => setEntryMenuTarget(entry)}
                />
              ))}
            </View>
          )}
        />

        <AppBottomNav currentRoute="/all-entries" />

        <AppModalSheet
          visible={isFiltersOpen}
          onClose={closeFilters}
          contentStyle={styles.filtersModal}
        >
          <View style={styles.filtersHeader}>
            <Text style={[styles.menuTitle, { color: PAGE_TEXT, fontFamily: theme.fonts.serif }]}>
              Sort & Filter
            </Text>
            <TouchableOpacity onPress={handleSaveFilters} accessible accessibilityLabel="Save filters">
              <Text style={[theme.typography.body, styles.saveText, { color: PAGE_SECONDARY }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

            <Text style={[theme.typography.bodySm, styles.menuSubtitle, { color: PAGE_MUTED }]}>
              Choose how you want to explore your archive.
            </Text>

          <View style={styles.metaRow}>
            <Text style={[theme.typography.bodySm, { color: PAGE_MUTED }]}>
              {total} {total === 1 ? "entry" : "entries"}
            </Text>
            <View style={styles.metaActions}>
              {isRefreshing ? <ActivityIndicator size="small" color={PAGE_PRIMARY} /> : null}
              {hasActiveFilters ? (
                <TouchableOpacity onPress={handleClearFilters}>
                  <Text style={[theme.typography.bodySm, { color: PAGE_SECONDARY }]}>
                    Clear all
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text
              style={[
                theme.typography.labelSm,
                styles.controlsLabel,
                { color: PAGE_MUTED },
              ]}
            >
              Sort
            </Text>
            <View style={styles.chipRow}>
              {[
                { label: "Recently Added", value: "desc" as const },
                { label: "Oldest First", value: "asc" as const },
              ].map((option) => {
                const isActive = draftSortOrder === option.value;
                return (
                  <FilterPill
                    key={option.value}
                    label={option.label}
                    selected={isActive}
                    onPress={() => setDraftSortOrder(option.value)}
                    accessibilityLabel={`Sort by ${option.label}`}
                  />
                );
              })}
            </View>

            <Text
              style={[
                theme.typography.labelSm,
                styles.controlsLabel,
                { color: PAGE_MUTED },
              ]}
            >
              Filter by Drawer
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              <FilterPill
                label="All drawers"
                selected={draftDrawerId === null}
                onPress={() => setDraftDrawerId(null)}
                accessibilityLabel="All drawers"
              />
              {drawers.map((drawer) => {
                const isActive = draftDrawerId === drawer.id;
                return (
                  <FilterPill
                    key={drawer.id}
                    label={drawer.name}
                    selected={isActive}
                    onPress={() => setDraftDrawerId(isActive ? null : drawer.id)}
                    accessibilityLabel={`Drawer filter ${drawer.name}`}
                  />
                );
              })}
            </ScrollView>

            <Text
              style={[
                theme.typography.labelSm,
                styles.controlsLabel,
                { color: PAGE_MUTED },
              ]}
            >
              Filter by Tag
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              <FilterPill
                label="All tags"
                selected={draftTagId === null}
                onPress={() => setDraftTagId(null)}
                accessibilityLabel="All tags"
              />
              {tags.map((tag) => {
                const isActive = draftTagId === tag.id;
                return (
                  <FilterPill
                    key={tag.id}
                    label={tag.name}
                    selected={isActive}
                    onPress={() => setDraftTagId(isActive ? null : tag.id)}
                    accessibilityLabel={`Tag filter ${tag.name}`}
                  />
                );
              })}
            </ScrollView>
          </ScrollView>

          <View style={styles.filtersFooter}>
            <Button
              label="Clear All"
              onPress={handleClearDraftFilters}
              variant="primary"
              style={[
                styles.footerButton,
                { backgroundColor: PAGE_BACKGROUND, borderColor: PAGE_BACKGROUND },
              ]}
              textStyle={neutralButtonTextStyle}
            />
            <Button
              label="Cancel"
              onPress={closeFilters}
              variant="primary"
              style={[
                styles.footerButton,
                { backgroundColor: PAGE_BACKGROUND, borderColor: PAGE_BACKGROUND },
              ]}
              textStyle={neutralButtonTextStyle}
            />
          </View>
        </AppModalSheet>

        <AppModalSheet
          visible={!!entryMenuTarget}
          onClose={closeEntryMenu}
          contentStyle={styles.menuModal}
        >
          <Text style={[styles.menuTitle, { color: PAGE_TEXT, fontFamily: theme.fonts.serif }]}>
            {entryMenuTarget?.title || "Untitled Entry"}
          </Text>
          <Text style={[theme.typography.bodySm, styles.menuSubtitle, { color: PAGE_MUTED }]}>
            Choose an action for this journal entry.
          </Text>
          <Button
            label="Edit"
            onPress={handleEditFromMenu}
            variant="primary"
            style={[styles.menuActionButton, styles.menuEditButton]}
            textStyle={secondaryButtonTextStyle}
          />
          <Button
            label="Delete"
            onPress={handleDeletePrompt}
            variant="primary"
            style={[styles.menuActionButton, styles.menuDeleteButton]}
            textStyle={dangerButtonTextStyle}
          />
          <Button
            label="Cancel"
            onPress={closeEntryMenu}
            variant="primary"
            style={[
              styles.menuActionButton,
              { backgroundColor: CANCEL_BUTTON_BG, borderColor: CANCEL_BUTTON_BORDER },
            ]}
            textStyle={cancelButtonTextStyle}
          />
        </AppModalSheet>

        <AppModalSheet
          visible={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          contentStyle={styles.menuModal}
        >
          <Text style={[styles.menuTitle, { color: PAGE_TEXT, fontFamily: theme.fonts.serif }]}>
            Delete Entry
          </Text>
          <Text style={[theme.typography.body, styles.menuSubtitle, { color: PAGE_MUTED }]}>
            Are you sure you want to delete this journal entry?
          </Text>
          <View style={styles.confirmActions}>
            <Button
              label="Cancel"
              onPress={() => setDeleteTarget(null)}
              variant="primary"
              style={[
                styles.confirmButton,
                {
                  backgroundColor: CANCEL_BUTTON_BG,
                  borderColor: CANCEL_BUTTON_BORDER,
                },
              ]}
              textStyle={cancelButtonTextStyle}
            />
            <Button
              label="Delete"
              onPress={handleDeleteEntry}
              variant="primary"
              style={[styles.confirmButton, styles.menuDeleteButton]}
              textStyle={dangerButtonTextStyle}
            />
          </View>
        </AppModalSheet>
      </Screen>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 230,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBlock: {
    marginBottom: 28,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "300",
    marginTop: 6,
    marginBottom: 16,
  },
  controlsLabel: {
    textTransform: "uppercase",
    letterSpacing: 1.6,
    marginBottom: 10,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 8,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  metaActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  archiveHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  archiveHeaderContent: {
    flex: 1,
  },
  archiveFilterButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    marginTop: -10,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: "solid",
    marginBottom: 24,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "200",
  },
  dateGroup: {
    marginBottom: 20,
  },
  entryCard: {
    position: "relative",
    borderRadius: 22,
    marginBottom: 14,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    paddingVertical: 18,
    paddingLeft: 18,
    paddingRight: 18,
  },
  entryContent: {
    flex: 1,
    paddingRight: 34,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  entryTitle: {
    flex: 1,
    fontWeight: "400",
  },
  entryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ENTRY_PREVIEW_PILLS.rowGap,
    marginTop: ENTRY_PREVIEW_PILLS.rowMarginTop,
  },
  tag: {
    paddingHorizontal: ENTRY_PREVIEW_PILLS.pillPaddingHorizontal,
    paddingVertical: ENTRY_PREVIEW_PILLS.pillPaddingVertical,
    borderRadius: ENTRY_PREVIEW_PILLS.pillRadius,
  },
  entryMore: {
    position: "absolute",
    top: 12,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  menuModal: {
    borderRadius: 24,
    backgroundColor: PAGE_SURFACE,
  },
  filtersModal: {
    maxHeight: "78%",
    borderRadius: 24,
    backgroundColor: PAGE_SURFACE,
    shadowColor: PAGE_TEXT,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  filtersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  saveText: {
    fontWeight: "700",
  },
  menuTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "400",
    marginBottom: 6,
  },
  menuSubtitle: {
    marginBottom: 14,
    lineHeight: 22,
  },
  menuActionButton: {
    minHeight: 52,
    borderRadius: 999,
    marginBottom: 10,
  },
  menuEditButton: {
    backgroundColor: "#DFE8D9",
    borderColor: "#C9D8C0",
  },
  menuDeleteButton: {
    backgroundColor: "#A6544E",
    borderColor: "#A6544E",
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
  },
  filtersFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  confirmButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
  },
  footerButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
  },
});
