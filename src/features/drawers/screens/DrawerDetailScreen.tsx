import {
    AppBottomNav,
    AppHeaderBrand,
    SafeArea,
    Screen,
} from "@components/layout";
import { Modal as AppModal, Button, SectionHeader } from "@components/ui";
import { MOOD_MAP, type MoodValue } from "@constants/moods";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Fonts, useTheme } from "@styles/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal as RNModal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useDrawerDetail } from "../hooks/useDrawerDetail";
import { useDrawerEntries } from "../hooks/useDrawerEntries";
import { useEditDrawer } from "../hooks/useEditDrawer";

const PAGE_BACKGROUND = "#EDEAE4";
const PAGE_SURFACE = "#FFFFFF";
const PAGE_SOFT_SURFACE = "#F8F6F2";
const PAGE_TEXT = "#2F2924";
const PAGE_MUTED = "#6F6860";
const PAGE_MUTED_LIGHT = "#8A8178";
const PAGE_PRIMARY = "#8C9A7F";
const PAGE_SECONDARY = "#556950";
const PAGE_BORDER = "#D8CCBD";
const PAGE_CARD_SHADOW = "rgba(85, 105, 80, 0.08)";
const CANCEL_BUTTON_BG = "#E3E1DC";
const CANCEL_BUTTON_BORDER = "#C9C4BB";
const CANCEL_BUTTON_TEXT = "#5F6368";

export function DrawerDetailScreen() {
  const theme = useTheme();
  const { drawerId } = useLocalSearchParams<{ drawerId: string }>();
  const drawerIdValue = Array.isArray(drawerId) ? drawerId[0] : drawerId;
  const resolvedDrawerId = drawerIdValue ?? "";

  const {
    drawer,
    isLoading: drawerLoading,
    fetchDrawer,
    deleteDrawer,
  } = useDrawerDetail(resolvedDrawerId);
  const { isLoading: updateLoading, updateDrawer } =
    useEditDrawer(resolvedDrawerId);
  const {
    entries: drawerEntries,
    isLoading: entriesLoading,
    fetchEntries,
  } = useDrawerEntries(resolvedDrawerId);

  const [showEditModal, setShowEditModal] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [draftSortOrder, setDraftSortOrder] = useState<"desc" | "asc">("desc");
  const [draftTagId, setDraftTagId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchDrawer();
      fetchEntries();
    }, [fetchDrawer, fetchEntries]),
  );

  // Initialize edit form
  useFocusEffect(
    useCallback(() => {
      if (drawer) {
        setEditName(drawer.name);
        setEditColor(drawer.color);
      }
    }, [drawer]),
  );

  const uniqueTags = useMemo(() => {
    const tagMap = new Map<
      string,
      { id: string; name: string; color: string | null }
    >();

    drawerEntries.forEach((entry) => {
      (entry.tags || []).forEach((tag) => {
        if (!tagMap.has(tag.id)) {
          tagMap.set(tag.id, {
            id: tag.id,
            name: tag.name,
            color: tag.color ?? null,
          });
        }
      });
    });

    return Array.from(tagMap.values());
  }, [drawerEntries]);

  const visibleEntries = useMemo(() => {
    const filtered = selectedTagId
      ? drawerEntries.filter((entry) =>
          (entry.tags || []).some((tag) => tag.id === selectedTagId),
        )
      : drawerEntries;

    return [...filtered].sort((a, b) => {
      const left = new Date(a.createdAt).getTime();
      const right = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? left - right : right - left;
    });
  }, [drawerEntries, selectedTagId, sortOrder]);

  const hasActiveFilters = sortOrder !== "desc" || selectedTagId !== null;

  const handleEdit = useCallback(async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Drawer name cannot be empty");
      return;
    }

    const success = await updateDrawer({
      name: editName,
      color: editColor,
    });

    if (success) {
      Alert.alert("Success", "Drawer updated");
      setShowEditModal(false);
      fetchDrawer();
    } else {
      Alert.alert("Error", "Failed to update drawer");
    }
  }, [editName, editColor, updateDrawer, fetchDrawer]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete Drawer",
      `Are you sure you want to delete "${drawer?.name}"? Entries will not be deleted.`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete",
          onPress: async () => {
            const success = await deleteDrawer();
            if (success) {
              Alert.alert("Success", "Drawer deleted");
              router.back();
            } else {
              Alert.alert("Error", "Failed to delete drawer");
            }
          },
          style: "destructive",
        },
      ],
    );
  }, [drawer?.name, deleteDrawer]);

  const handleEntryPress = useCallback((entryId: string) => {
    router.push(`/entry/${entryId}`);
  }, []);

  const handleCreateEntry = useCallback(() => {
    router.push(
      `/create-entry?drawerId=${encodeURIComponent(resolvedDrawerId)}`,
    );
  }, [resolvedDrawerId]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleSearch = useCallback(() => {
    router.push("/search");
  }, []);

  const openFilters = useCallback(() => {
    setDraftSortOrder(sortOrder);
    setDraftTagId(selectedTagId);
    setIsFiltersOpen(true);
  }, [selectedTagId, sortOrder]);

  const closeFilters = useCallback(() => {
    setIsFiltersOpen(false);
  }, []);

  const handleSaveFilters = useCallback(() => {
    setSortOrder(draftSortOrder);
    setSelectedTagId(draftTagId);
    setIsFiltersOpen(false);
  }, [draftSortOrder, draftTagId]);

  const handleClearFilters = useCallback(() => {
    setSortOrder("desc");
    setSelectedTagId(null);
    setDraftSortOrder("desc");
    setDraftTagId(null);
  }, []);

  const handleClearDraftFilters = useCallback(() => {
    setDraftSortOrder("desc");
    setDraftTagId(null);
  }, []);

  const colorOptions = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
  ];

  if (drawerLoading) {
    return (
      <SafeArea>
        <Screen style={[styles.container, styles.pageBackground]}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={PAGE_PRIMARY} />
          </View>
        </Screen>
      </SafeArea>
    );
  }

  if (!drawer) {
    return (
      <SafeArea>
        <Screen style={[styles.container, styles.pageBackground]}>
          <View style={styles.loaderContainer}>
            <Text style={[theme.typography.body, { color: PAGE_TEXT }]}>
              Drawer not found
            </Text>
          </View>
        </Screen>
      </SafeArea>
    );
  }

  return (
    <SafeArea>
      <Screen style={[styles.container, styles.pageBackground]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.headerIconButton}
              accessible
              accessibilityLabel="Go back"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={30}
                color={PAGE_PRIMARY}
              />
            </TouchableOpacity>
            <AppHeaderBrand />
          </View>
          <TouchableOpacity
            onPress={handleSearch}
            style={styles.headerIconButton}
            accessible
            accessibilityLabel="Search entries"
          >
            <MaterialCommunityIcons
              name="magnify"
              size={32}
              color={PAGE_PRIMARY}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.heroBlock}>
            <Text
              numberOfLines={1}
              style={[styles.heroTitle, { fontFamily: theme.fonts.serif }]}
            >
              <Text style={{ color: PAGE_TEXT }}>{drawer.name}</Text>{" "}
              <Text style={{ color: PAGE_PRIMARY }}>Entries</Text>
            </Text>
            <Text style={[theme.typography.bodySm, styles.heroSubtitle]}>
              {entriesLoading
                ? "Loading your archive..."
                : `${visibleEntries.length} of ${drawerEntries.length} ${drawerEntries.length === 1 ? "entry" : "entries"}`}
            </Text>
          </View>

          <View
            style={[
              styles.drawerInfoCard,
              {
                backgroundColor: PAGE_SURFACE,
                borderColor: drawer.color || PAGE_BORDER,
              },
            ]}
          >
            <View style={styles.drawerIcon}>
              <MaterialCommunityIcons
                name="archive-outline"
                size={34}
                color={drawer.color || PAGE_PRIMARY}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[theme.typography.h2, styles.drawerName]}>
                {drawer.name}
              </Text>
              <Text style={[theme.typography.bodySm, styles.drawerCount]}>
                {entriesLoading
                  ? "Loading entries..."
                  : `${drawerEntries.length} ${drawerEntries.length === 1 ? "entry" : "entries"}`}
              </Text>
            </View>
            <View
              style={[styles.colorDot, { backgroundColor: drawer.color }]}
            />
          </View>

          <View style={styles.heroActions}>
            <Button
              label="Edit Drawer"
              onPress={() => setShowEditModal(true)}
              size="sm"
              style={styles.editButton}
              textStyle={[theme.typography.body, styles.editButtonText]}
              accessibilityLabel="Edit drawer"
            />
            <Button
              label="Delete"
              onPress={handleDelete}
              size="sm"
              style={styles.deleteActionButton}
              textStyle={[theme.typography.body, styles.deleteActionButtonText]}
              accessibilityLabel="Delete drawer"
            />
          </View>

          <Button
            label="Add Entry to Drawer"
            onPress={handleCreateEntry}
            style={styles.createEntryButton}
            textStyle={[theme.typography.body, styles.createEntryButtonText]}
            accessibilityLabel="Create entry in this drawer"
          />

          <View style={styles.archiveHeaderRow}>
            <View style={styles.archiveHeaderContent}>
              <SectionHeader
                label="Archive"
                textColor={PAGE_MUTED}
                dividerColor={PAGE_BORDER}
              />
            </View>
            <TouchableOpacity
              onPress={openFilters}
              style={styles.archiveFilterButton}
              accessible
              accessibilityLabel="Open sort and filter options"
            >
              <MaterialCommunityIcons
                name="tune-variant"
                size={24}
                color={PAGE_PRIMARY}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.sortBar}>
            <Text style={[theme.typography.bodySm, styles.sortLabel]}>
              {sortOrder === "desc" ? "Recently Added" : "Oldest First"}
            </Text>
            <View style={styles.metaActions}>
              {hasActiveFilters ? (
                <TouchableOpacity onPress={handleClearFilters}>
                  <Text style={[theme.typography.bodySm, styles.clearAllText]}>
                    Clear all
                  </Text>
                </TouchableOpacity>
              ) : null}
              <Text style={[theme.typography.bodySm, styles.sortCount]}>
                {visibleEntries.length} shown
              </Text>
            </View>
          </View>

          {entriesLoading ? (
            <View style={styles.entriesLoadingContainer}>
              <ActivityIndicator size="small" color={PAGE_PRIMARY} />
            </View>
          ) : visibleEntries.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={32}
                  color={PAGE_PRIMARY}
                />
              </View>
              <Text style={[theme.typography.h2, styles.emptyTitle]}>
                {hasActiveFilters ? "No matching entries" : "No entries yet"}
              </Text>
              <Text style={[theme.typography.body, styles.emptyBody]}>
                {hasActiveFilters
                  ? "Try a different sort or tag filter to explore this drawer."
                  : "Create your first entry in this drawer when you&apos;re ready"}
              </Text>
              <Button
                label="Create First Entry"
                onPress={handleCreateEntry}
                style={styles.emptyButton}
                textStyle={[
                  theme.typography.body,
                  styles.createEntryButtonText,
                ]}
                accessibilityLabel="Create your first entry in this drawer"
              />
            </View>
          ) : (
            <View style={styles.entriesList}>
              {visibleEntries.map((item, index) => {
                const currentDate = new Date(item.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  },
                );
                const previous = visibleEntries[index - 1];
                const previousDate = previous
                  ? new Date(previous.createdAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : null;
                const showDateHeader = currentDate !== previousDate;

                return (
                  <View key={item.id} style={styles.dateGroup}>
                    {showDateHeader ? (
                      <Text
                        style={[theme.typography.bodySm, styles.dateHeading]}
                      >
                        {currentDate}
                      </Text>
                    ) : null}

                    <TouchableOpacity
                      style={[styles.entryCard, styles.entryCardSurface]}
                      onPress={() => handleEntryPress(item.id)}
                      accessible
                      accessibilityLabel={`Entry: ${item.title}`}
                      accessibilityRole="button"
                    >
                      <View style={styles.entryMore}>
                        <MaterialCommunityIcons
                          name="dots-vertical"
                          size={22}
                          color={PAGE_MUTED_LIGHT}
                        />
                      </View>
                      <View style={styles.entryHeader}>
                        <View style={styles.entryHeaderContent}>
                          <Text
                            numberOfLines={1}
                            style={[theme.typography.h3, styles.entryTitle]}
                          >
                            {item.title}
                          </Text>
                        </View>
                        {item.mood && (
                          <Text style={styles.moodEmoji}>
                            {MOOD_MAP[item.mood as MoodValue]?.emoji}
                          </Text>
                        )}
                      </View>

                      <Text
                        numberOfLines={2}
                        style={[theme.typography.bodySm, styles.entryBody]}
                      >
                        {item.content}
                      </Text>

                      <View style={styles.entryMeta}>
                        {item.images && item.images.length > 0 && (
                          <Text
                            style={[
                              theme.typography.labelXs,
                              styles.entryMetaText,
                            ]}
                          >
                            🖼️ {item.images.length}
                          </Text>
                        )}
                        {item.audioUrl && (
                          <Text
                            style={[
                              theme.typography.labelXs,
                              styles.entryMetaText,
                            ]}
                          >
                            🎙️
                          </Text>
                        )}
                        {item.location && (
                          <Text
                            style={[
                              theme.typography.labelXs,
                              styles.entryMetaText,
                            ]}
                          >
                            📍
                          </Text>
                        )}
                      </View>

                      {item.tags && item.tags.length > 0 && (
                        <View style={styles.tagsRow}>
                          {item.tags.slice(0, 3).map((tag) => (
                            <View
                              key={tag.id}
                              style={[
                                styles.tagBadge,
                                { backgroundColor: `${tag.color}20` },
                              ]}
                            >
                              <Text
                                style={[
                                  theme.typography.labelXs,
                                  { color: tag.color, fontWeight: "600" },
                                ]}
                              >
                                {tag.name}
                              </Text>
                            </View>
                          ))}
                          {item.tags.length > 3 && (
                            <Text
                              style={[
                                theme.typography.labelXs,
                                styles.entryDate,
                              ]}
                            >
                              +{item.tags.length - 3}
                            </Text>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <AppBottomNav currentRoute="/drawers" />

        <AppModal
          visible={isFiltersOpen}
          onClose={closeFilters}
          animationType="fade"
          backdropStyle={styles.menuBackdrop}
          contentStyle={styles.filtersModal}
        >
          <View style={styles.filtersHeader}>
            <Text style={[styles.menuTitle, { fontFamily: theme.fonts.serif }]}>
              Sort & Filter
            </Text>
            <TouchableOpacity
              onPress={handleSaveFilters}
              accessible
              accessibilityLabel="Save filters"
            >
              <Text style={[theme.typography.body, styles.saveText]}>Save</Text>
            </TouchableOpacity>
          </View>

          <Text style={[theme.typography.bodySm, styles.menuSubtitle]}>
            Choose how you want to explore this drawer.
          </Text>

          <View style={styles.metaRow}>
            <Text style={[theme.typography.bodySm, styles.sortLabel]}>
              {visibleEntries.length}{" "}
              {visibleEntries.length === 1 ? "entry" : "entries"}
            </Text>
            <View style={styles.metaActions}>
              {hasActiveFilters ? (
                <TouchableOpacity onPress={handleClearFilters}>
                  <Text style={[theme.typography.bodySm, styles.clearAllText]}>
                    Clear all
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[theme.typography.labelSm, styles.controlsLabel]}>
              Sort
            </Text>
            <View style={styles.chipRow}>
              {[
                { label: "Recently Added", value: "desc" as const },
                { label: "Oldest First", value: "asc" as const },
              ].map((option) => {
                const isActive = draftSortOrder === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setDraftSortOrder(option.value)}
                    style={[
                      styles.filterChip,
                      isActive && styles.filterChipActive,
                      {
                        borderColor: isActive ? PAGE_PRIMARY : PAGE_BORDER,
                        backgroundColor: isActive
                          ? `${PAGE_PRIMARY}18`
                          : PAGE_SURFACE,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.bodySm,
                        {
                          color: isActive ? PAGE_SECONDARY : PAGE_TEXT,
                          fontWeight: isActive ? "600" : "400",
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[theme.typography.labelSm, styles.controlsLabel]}>
              Filter by Tag
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <TouchableOpacity
                onPress={() => setDraftTagId(null)}
                style={[
                  styles.filterChip,
                  {
                    borderColor:
                      draftTagId === null ? PAGE_PRIMARY : PAGE_BORDER,
                    backgroundColor:
                      draftTagId === null ? `${PAGE_PRIMARY}18` : PAGE_SURFACE,
                  },
                ]}
              >
                <Text
                  style={[
                    theme.typography.bodySm,
                    {
                      color: draftTagId === null ? PAGE_SECONDARY : PAGE_TEXT,
                      fontWeight: draftTagId === null ? "600" : "400",
                    },
                  ]}
                >
                  All tags
                </Text>
              </TouchableOpacity>
              {uniqueTags.map((tag) => {
                const tagColor = tag.color || PAGE_PRIMARY;
                const isActive = draftTagId === tag.id;

                return (
                  <TouchableOpacity
                    key={tag.id}
                    onPress={() => setDraftTagId(isActive ? null : tag.id)}
                    style={[
                      styles.filterChip,
                      {
                        borderColor: isActive ? tagColor : PAGE_BORDER,
                        backgroundColor: isActive
                          ? `${tagColor}18`
                          : PAGE_SURFACE,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.bodySm,
                        {
                          color: isActive ? tagColor : PAGE_TEXT,
                          fontWeight: isActive ? "600" : "400",
                        },
                      ]}
                    >
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </ScrollView>

          <View style={styles.filtersFooter}>
            <Button
              label="Clear All"
              onPress={handleClearDraftFilters}
              variant="primary"
              style={styles.footerButton}
              textStyle={{ color: CANCEL_BUTTON_TEXT, fontWeight: "700" }}
            />
            <Button
              label="Cancel"
              onPress={closeFilters}
              variant="primary"
              style={styles.footerButton}
              textStyle={{ color: CANCEL_BUTTON_TEXT, fontWeight: "700" }}
            />
          </View>
        </AppModal>

        {/* Edit Modal */}
        <RNModal
          visible={showEditModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEditModal(false)}
        >
          <SafeArea>
            <Screen style={[styles.modalContainer, styles.pageBackground]}>
              <View style={styles.modalHeader}>
                <Text style={[theme.typography.h2, styles.modalTitle]}>
                  Edit Drawer
                </Text>
                <TouchableOpacity
                  onPress={() => setShowEditModal(false)}
                  style={styles.headerIconButton}
                  accessible
                  accessibilityLabel="Close"
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={30}
                    color={PAGE_PRIMARY}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalContent}
              >
                <View style={{ marginBottom: theme.spacing.lg }}>
                  <Text style={[theme.typography.labelSm, styles.modalLabel]}>
                    Drawer Name
                  </Text>
                  <TextInput
                    style={[styles.input]}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter drawer name"
                    placeholderTextColor={PAGE_MUTED_LIGHT}
                    accessibilityLabel="Drawer name"
                  />
                </View>

                <View>
                  <Text style={[theme.typography.labelSm, styles.modalLabel]}>
                    Color
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 12,
                      marginBottom: theme.spacing.lg,
                    }}
                  >
                    {colorOptions.map((color) => (
                      <TouchableOpacity
                        key={color}
                        onPress={() => setEditColor(color)}
                        style={[
                          styles.colorOption,
                          {
                            backgroundColor: color,
                            borderColor:
                              editColor === color ? PAGE_TEXT : "transparent",
                            borderWidth: editColor === color ? 2 : 0,
                          },
                        ]}
                        accessible
                        accessibilityLabel={`Color ${color}`}
                        accessibilityRole="button"
                      >
                        {editColor === color ? (
                          <MaterialCommunityIcons
                            name="check"
                            size={22}
                            color="#FFFFFF"
                          />
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Button
                  label={updateLoading ? "Saving..." : "Save Changes"}
                  onPress={handleEdit}
                  disabled={updateLoading}
                  style={styles.saveButton}
                  textStyle={[
                    theme.typography.body,
                    styles.createEntryButtonText,
                  ]}
                  accessibilityLabel="Save drawer changes"
                />
              </ScrollView>
            </Screen>
          </SafeArea>
        </RNModal>
      </Screen>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageBackground: {
    backgroundColor: PAGE_BACKGROUND,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBlock: {
    marginBottom: 18,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "300",
  },
  heroSubtitle: {
    color: PAGE_MUTED,
    marginTop: 6,
  },
  editButton: {
    minHeight: 46,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: PAGE_PRIMARY,
  },
  editButtonText: {
    color: PAGE_SURFACE,
    fontWeight: "600",
  },
  deleteActionButton: {
    minHeight: 46,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: "#A6544E",
    borderColor: "#A6544E",
  },
  deleteActionButtonText: {
    color: PAGE_SURFACE,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 120,
  },
  heroActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginBottom: 4,
  },
  drawerInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: PAGE_SECONDARY,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  drawerIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: PAGE_SOFT_SURFACE,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  drawerName: {
    color: PAGE_TEXT,
    fontFamily: Fonts.serif,
    fontWeight: "400",
  },
  drawerCount: {
    color: PAGE_MUTED,
    marginTop: 4,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: 12,
  },
  createEntryButton: {
    marginTop: 22,
    marginBottom: 28,
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: PAGE_PRIMARY,
    shadowColor: PAGE_CARD_SHADOW,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  createEntryButtonText: {
    color: PAGE_SURFACE,
    fontWeight: "600",
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
  sortBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sortLabel: {
    color: PAGE_MUTED,
  },
  sortCount: {
    color: PAGE_MUTED,
  },
  metaActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clearAllText: {
    color: PAGE_SECONDARY,
  },
  entriesList: {
    paddingBottom: 10,
  },
  dateGroup: {
    marginBottom: 8,
  },
  dateHeading: {
    color: PAGE_TEXT,
    marginBottom: 12,
    marginTop: 6,
    fontWeight: "500",
  },
  entriesLoadingContainer: {
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  entryCardSurface: {
    backgroundColor: PAGE_SURFACE,
    borderColor: PAGE_BORDER,
  },
  entryCard: {
    position: "relative",
    paddingVertical: 18,
    paddingLeft: 18,
    paddingRight: 18,
    borderRadius: 22,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: PAGE_TEXT,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  entryMore: {
    position: "absolute",
    top: 10,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  entryHeaderContent: {
    flex: 1,
    paddingRight: 34,
  },
  entryTitle: {
    color: PAGE_TEXT,
    fontFamily: Fonts.serif,
    fontWeight: "400",
  },
  entryDate: {
    color: PAGE_MUTED,
    marginTop: 4,
  },
  moodEmoji: {
    fontSize: 24,
    marginLeft: 10,
  },
  entryBody: {
    color: PAGE_MUTED,
    marginVertical: 12,
  },
  entryMeta: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  entryMetaText: {
    color: PAGE_PRIMARY,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  emptyCard: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 36,
    minHeight: 320,
    borderRadius: 28,
    backgroundColor: PAGE_SURFACE,
    borderWidth: 1,
    borderColor: PAGE_BORDER,
    shadowColor: PAGE_SECONDARY,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },
  emptyIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: PAGE_SOFT_SURFACE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    color: PAGE_TEXT,
    fontFamily: Fonts.serif,
    fontWeight: "400",
    textAlign: "center",
  },
  emptyBody: {
    color: PAGE_MUTED,
    marginTop: 12,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 22,
    minHeight: 54,
    borderRadius: 20,
    paddingHorizontal: 28,
    backgroundColor: PAGE_PRIMARY,
  },
  menuBackdrop: {
    paddingHorizontal: 24,
    backgroundColor: "rgba(47, 41, 36, 0.28)",
  },
  filtersModal: {
    width: "100%",
    maxHeight: "78%",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    backgroundColor: PAGE_SURFACE,
  },
  filtersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  saveText: {
    color: PAGE_SECONDARY,
    fontWeight: "700",
  },
  menuTitle: {
    color: PAGE_TEXT,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "400",
    marginBottom: 6,
  },
  menuSubtitle: {
    color: PAGE_MUTED,
    marginBottom: 14,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  controlsLabel: {
    color: PAGE_MUTED,
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
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipActive: {
    shadowOpacity: 0,
  },
  filtersFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  footerButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: CANCEL_BUTTON_BG,
    borderColor: CANCEL_BUTTON_BORDER,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  modalTitle: {
    color: PAGE_TEXT,
    fontFamily: Fonts.serif,
    fontWeight: "400",
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  modalLabel: {
    color: PAGE_MUTED,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 20,
    borderColor: PAGE_BORDER,
    backgroundColor: PAGE_SURFACE,
    color: PAGE_TEXT,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
  },
  colorOption: {
    width: "23%",
    aspectRatio: 1,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    marginTop: 8,
    minHeight: 54,
    borderRadius: 20,
    backgroundColor: PAGE_PRIMARY,
  },
});
