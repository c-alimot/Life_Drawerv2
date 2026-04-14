import { AppBottomNav, AppSideMenu, SafeArea, Screen } from "@components/layout";
import { Button, Modal, SectionHeader } from "@components/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDrawers } from "@features/drawers/hooks/useDrawers";
import { useDeleteDrawer } from "@features/drawers/hooks/useDeleteDrawer";
import { useDeleteEntry } from "@features/entries/hooks/useDeleteEntry";
import { useEntries } from "@features/entries/hooks/useEntries";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "@store";
import { useTheme } from "@styles/theme";
import type { EntryWithRelations } from "@types";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { useLifePhase } from "../hooks/useLifePhase";

interface GroupedEntries {
  [date: string]: EntryWithRelations[];
}

type DrawerMenuTarget = {
  id: string;
  name: string;
  isStarter: boolean;
};

const STARTER_DRAWER = {
  id: "starter-drawer",
  name: "My Life Drawer",
  entryCount: 0,
  color: "#8C9A7F",
};

const HOME_BACKGROUND = "#EDEAE4";
const HOME_TEXT = "#2F2924";
const HOME_MUTED = "#6F6860";
const HOME_PRIMARY = "#8C9A7F";
const HOME_SECONDARY = "#556950";
const HOME_SURFACE = "#FFFFFF";
const CANCEL_BUTTON_BG = "#E3E1DC";
const CANCEL_BUTTON_BORDER = "#C9C4BB";
const CANCEL_BUTTON_TEXT = "#5F6368";

export function HomeScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const {
    entries,
    isLoading: entriesLoading,
    fetchRecentEntries,
  } = useEntries();
  const { deleteEntry } = useDeleteEntry();
  const { deleteDrawer } = useDeleteDrawer();
  const { drawers, isLoading: drawersLoading, fetchDrawers } = useDrawers();
  const {
    activePhase,
    isLoading: phaseLoading,
    fetchActivePhase,
  } = useLifePhase();

  const [groupedEntries, setGroupedEntries] = useState<GroupedEntries>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [entryMenuTarget, setEntryMenuTarget] = useState<EntryWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EntryWithRelations | null>(null);
  const [drawerMenuTarget, setDrawerMenuTarget] = useState<DrawerMenuTarget | null>(null);
  const [deleteDrawerTarget, setDeleteDrawerTarget] = useState<DrawerMenuTarget | null>(null);

  // Fetch data on screen focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchActivePhase();
        fetchRecentEntries();
        fetchDrawers();
      }
    }, [user, fetchActivePhase, fetchRecentEntries, fetchDrawers]),
  );

  // Group entries by date
  useEffect(() => {
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
    setGroupedEntries(grouped);
  }, [entries]);

  const handleSearch = useCallback(() => {
    router.push("/search");
  }, []);

  const handleSetLifePhase = useCallback(() => {
    router.push("/life-phases");
  }, []);

  const handleCreateFirstEntry = useCallback(() => {
    router.push("/create-entry");
  }, []);

  const handleEntryPress = useCallback((entryId: string) => {
    router.push(`/edit-entry/${entryId}`);
  }, []);

  const handleEditEntry = useCallback((entryId: string) => {
    router.push(`/edit-entry/${entryId}`);
  }, []);

  const closeEntryMenu = useCallback(() => {
    setEntryMenuTarget(null);
  }, []);

  const openEntryMenu = useCallback((entry: EntryWithRelations) => {
    setEntryMenuTarget(entry);
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
      await fetchRecentEntries();
    } else {
      Alert.alert("Error", "Failed to delete entry");
    }
  }, [deleteEntry, deleteTarget, fetchRecentEntries]);

  const handleDrawerPress = useCallback((drawerId: string) => {
    router.push(`/drawers/${drawerId}`);
  }, []);

  const openDrawerMenu = useCallback((drawer: { id: string; name: string }) => {
    setDrawerMenuTarget({
      id: drawer.id,
      name: drawer.name,
      isStarter: drawer.id === STARTER_DRAWER.id,
    });
  }, []);

  const closeDrawerMenu = useCallback(() => {
    setDrawerMenuTarget(null);
  }, []);

  const handleEditDrawerFromMenu = useCallback(() => {
    if (!drawerMenuTarget) {
      return;
    }

    if (drawerMenuTarget.isStarter) {
      setDrawerMenuTarget(null);
      Alert.alert("Not available yet", "Create a custom drawer first to edit options.");
      return;
    }

    const targetId = drawerMenuTarget.id;
    setDrawerMenuTarget(null);
    router.push(`/drawers/${targetId}`);
  }, [drawerMenuTarget]);

  const handleDeleteDrawerPrompt = useCallback(() => {
    if (!drawerMenuTarget) {
      return;
    }

    if (drawerMenuTarget.isStarter) {
      setDrawerMenuTarget(null);
      Alert.alert("Not available yet", "The starter drawer can't be deleted.");
      return;
    }

    setDeleteDrawerTarget(drawerMenuTarget);
    setDrawerMenuTarget(null);
  }, [drawerMenuTarget]);

  const handleDeleteDrawer = useCallback(async () => {
    if (!deleteDrawerTarget) {
      return;
    }

    const success = await deleteDrawer(deleteDrawerTarget.id);
    setDeleteDrawerTarget(null);

    if (success) {
      await fetchDrawers();
      await fetchRecentEntries();
    } else {
      Alert.alert("Error", "Failed to delete drawer");
    }
  }, [deleteDrawer, deleteDrawerTarget, fetchDrawers, fetchRecentEntries]);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleOpenMenu = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  const isLoading = entriesLoading || drawersLoading || phaseLoading;
  const recentDrawers = drawers.length > 0 ? drawers.slice(0, 5) : [STARTER_DRAWER];

  return (
    <SafeArea>
      <Screen style={[styles.container, { backgroundColor: HOME_BACKGROUND }]}>
        <AppSideMenu visible={isMenuOpen} onClose={closeMenu} currentRoute="/" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={handleOpenMenu}
              style={styles.headerIconButton}
              accessible
              accessibilityLabel="Open menu"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="menu" size={34} color={HOME_TEXT} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSetLifePhase}
              accessible
              accessibilityLabel={
                activePhase
                  ? `Current life phase: ${activePhase.name}`
                  : "Set life phase"
              }
              accessibilityHint="Tap to set or change your current life phase"
            >
              <Text
                style={[
                  styles.lifePhaseLink,
                  {
                    color: HOME_MUTED,
                    fontWeight: "300",
                  },
                ]}
              >
                {activePhase ? activePhase.name : "Set Life Phase"}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={handleSearch}
            style={styles.headerIconButton}
            accessible
            accessibilityLabel="Search entries"
            accessibilityHint="Open search and filter screen"
          >
            <MaterialCommunityIcons
              name="magnify"
              size={32}
              color={HOME_PRIMARY}
            />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={HOME_PRIMARY} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <Text
              style={[
                styles.heroTitle,
                {
                  color: HOME_TEXT,
                  fontFamily: theme.fonts.serif,
                },
              ]}
            >
              Document your life,{"\n"}
              <Text style={{ color: HOME_PRIMARY }}>one moment at a time.</Text>
            </Text>

            {/* Recent Entries Section */}
            <View style={styles.section}>
              <SectionHeader
                label="Recent Entries"
                textColor={HOME_MUTED}
                dividerColor={theme.colors.accent1}
              />

              {entries.length === 0 ? (
                // Empty State
                <View
                  style={[
                    styles.emptyState,
                    {
                      borderColor: theme.colors.accent1 + "AA",
                      backgroundColor: HOME_SURFACE,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.emptyIcon,
                      {
                        backgroundColor: theme.colors.accent1 + "3D",
                      },
                    ]}
                  >
                    <Text style={[styles.emptyIconText, { color: HOME_PRIMARY }]}>+</Text>
                  </View>
                  <Text
                    style={[
                      styles.emptyTitle,
                      {
                        color: HOME_TEXT,
                        fontFamily: theme.fonts.serif,
                        marginBottom: theme.spacing.md,
                      },
                    ]}
                  >
                    No entries yet
                  </Text>
                  <Text
                    style={[
                      theme.typography.body,
                      {
                        color: HOME_MUTED,
                        textAlign: "center",
                        marginBottom: theme.spacing.lg,
                        lineHeight: 30,
                      },
                    ]}
                  >
                    Your journey starts here. Capture your first moment whenever
                    you&apos;re ready.
                  </Text>
                  <Button
                    label="Create First Entry"
                    onPress={handleCreateFirstEntry}
                    variant="outline"
                    textStyle={{ color: HOME_PRIMARY }}
                    style={[
                      styles.inlineCta,
                      {
                        backgroundColor: "transparent",
                        borderColor: theme.colors.accent2,
                      },
                    ]}
                    accessibilityLabel="Create first entry button"
                  />
                </View>
              ) : (
                // Entries List
                <View>
                  {Object.entries(groupedEntries).map(([date, dateEntries]) => (
                    <View key={date} style={styles.dateGroup}>
                      <Text
                        style={[
                          theme.typography.bodySm,
                          {
                            color: HOME_TEXT,
                            marginBottom: theme.spacing.md,
                            fontWeight: "500",
                          },
                        ]}
                      >
                        {date}
                      </Text>
                      {dateEntries.map((entry) => (
                        <View
                          key={entry.id}
                          style={[
                            styles.entryCard,
                            {
                              backgroundColor: HOME_SURFACE,
                              shadowColor: HOME_TEXT,
                            },
                          ]}
                        >
                          <TouchableOpacity
                            onPress={() => openEntryMenu(entry)}
                            style={styles.entryMore}
                            accessible
                            accessibilityLabel={`More options for ${entry.title || "Untitled Entry"}`}
                            accessibilityRole="button"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <MaterialCommunityIcons
                              name="dots-vertical"
                              size={22}
                              color={theme.colors.textDisabled}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.entryContent}
                            onPress={() => handleEntryPress(entry.id)}
                            accessible
                            accessibilityLabel={`Entry: ${entry.title || "Untitled"}`}
                            accessibilityHint={`Created on ${new Date(entry.createdAt).toLocaleDateString()}`}
                          >
                            <View style={styles.entryHeader}>
                              <Text
                                style={[
                                  theme.typography.h3,
                                  styles.entryTitle,
                                  {
                                    color: HOME_TEXT,
                                    fontFamily: theme.fonts.serif,
                                  },
                                ]}
                                numberOfLines={1}
                              >
                                {entry.title || "Untitled Entry"}
                              </Text>
                            </View>
                            <Text
                              style={[
                                theme.typography.bodySm,
                                {
                                  color: HOME_MUTED,
                                },
                              ]}
                              numberOfLines={2}
                            >
                              {entry.content}
                            </Text>
                            {(entry.drawers?.length > 0 || entry.tags?.length > 0) && (
                              <View style={styles.entryTags}>
                                {entry.drawers?.map((drawer) => (
                                  <View
                                    key={drawer.id}
                                    style={[
                                      styles.tag,
                                      {
                                        backgroundColor: "#ECE6DB",
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        theme.typography.labelXs,
                                        { color: HOME_SECONDARY },
                                      ]}
                                    >
                                      {drawer.name}
                                    </Text>
                                  </View>
                                ))}
                                {entry.tags?.map((tag) => {
                                  const tagColor = tag.color || HOME_PRIMARY;
                                  return (
                                    <View
                                      key={tag.id}
                                      style={[
                                        styles.tag,
                                        {
                                          backgroundColor: `${tagColor}20`,
                                        },
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          theme.typography.labelXs,
                                          { color: tagColor },
                                        ]}
                                      >
                                        {tag.name}
                                      </Text>
                                    </View>
                                  );
                                })}
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Recently Opened Drawers Section */}
            <View style={styles.section}>
              <SectionHeader
                label="Recently Opened Drawers"
                textColor={HOME_MUTED}
                dividerColor={theme.colors.accent1}
              />

              <FlatList
                data={recentDrawers}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item: drawer }) => (
                  <TouchableOpacity
                    style={[
                      styles.drawerCard,
                      {
                        backgroundColor: HOME_SURFACE,
                        shadowColor: HOME_TEXT,
                      },
                    ]}
                    onPress={() => {
                      if (drawer.id === STARTER_DRAWER.id) {
                        return;
                      }
                      handleDrawerPress(drawer.id);
                    }}
                    accessible
                    accessibilityLabel={`Drawer: ${drawer.name}`}
                    accessibilityHint={`${drawer.entryCount} entries`}
                  >
                    <View
                      style={[
                        styles.drawerIcon,
                        {
                          backgroundColor: (drawer.color || HOME_PRIMARY) + "22",
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="archive-outline"
                        size={26}
                        color={drawer.color || HOME_PRIMARY}
                      />
                    </View>
                    <View style={styles.drawerInfo}>
                      <Text
                        style={[
                          styles.drawerTitle,
                          {
                            color: HOME_TEXT,
                            fontFamily: theme.fonts.serif,
                          },
                        ]}
                      >
                        {drawer.name}
                      </Text>
                      <Text
                        style={[
                          theme.typography.bodySm,
                          { color: HOME_MUTED },
                        ]}
                      >
                        {drawer.entryCount} entries
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => openDrawerMenu(drawer)}
                      style={styles.drawerMore}
                      accessible
                      accessibilityLabel={`More options for ${drawer.name}`}
                    >
                      <MaterialCommunityIcons
                        name="dots-vertical"
                        size={22}
                        color={theme.colors.textDisabled}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />

              <Text
                style={[
                  styles.drawerHelperText,
                  {
                    color: HOME_MUTED,
                    fontFamily: theme.fonts.serif,
                  },
                ]}
              >
                You can create custom drawers anytime to organize your thoughts.
              </Text>

            </View>
          </ScrollView>
        )}

        <AppBottomNav currentRoute="/" />

        <Modal
          visible={!!entryMenuTarget}
          onClose={closeEntryMenu}
          animationType="fade"
          backdropStyle={styles.menuBackdrop}
          contentStyle={styles.menuModal}
        >
          <Text style={[styles.menuTitle, { color: HOME_TEXT, fontFamily: theme.fonts.serif }]}>
            {entryMenuTarget?.title || "Untitled Entry"}
          </Text>
          <Text style={[theme.typography.bodySm, styles.menuSubtitle, { color: HOME_MUTED }]}>
            Choose an action for this journal entry.
          </Text>
          <Button
            label="Edit"
            onPress={handleEditFromMenu}
            variant="primary"
            style={[styles.menuActionButton, styles.menuEditButton]}
            textStyle={{ color: HOME_SECONDARY, fontWeight: "700" }}
          />
          <Button
            label="Delete"
            onPress={handleDeletePrompt}
            variant="primary"
            style={[styles.menuActionButton, styles.menuDeleteButton]}
            textStyle={{ color: "#FFFFFF", fontWeight: "700" }}
          />
          <Button
            label="Cancel"
            onPress={closeEntryMenu}
            variant="primary"
            style={[
              styles.menuActionButton,
              { backgroundColor: CANCEL_BUTTON_BG, borderColor: CANCEL_BUTTON_BORDER },
            ]}
            textStyle={{ color: CANCEL_BUTTON_TEXT, fontWeight: "700" }}
          />
        </Modal>

        <Modal
          visible={!!drawerMenuTarget}
          onClose={closeDrawerMenu}
          animationType="fade"
          backdropStyle={styles.menuBackdrop}
          contentStyle={styles.menuModal}
        >
          <Text style={[styles.menuTitle, { color: HOME_TEXT, fontFamily: theme.fonts.serif }]}>
            {drawerMenuTarget?.name || "Drawer"}
          </Text>
          <Text style={[theme.typography.bodySm, styles.menuSubtitle, { color: HOME_MUTED }]}>
            Choose an action for this drawer.
          </Text>
          <Button
            label="Edit"
            onPress={handleEditDrawerFromMenu}
            variant="primary"
            style={[styles.menuActionButton, styles.menuEditButton]}
            textStyle={{ color: HOME_SECONDARY, fontWeight: "700" }}
          />
          <Button
            label="Delete"
            onPress={handleDeleteDrawerPrompt}
            variant="primary"
            style={[styles.menuActionButton, styles.menuDeleteButton]}
            textStyle={{ color: "#FFFFFF", fontWeight: "700" }}
          />
          <Button
            label="Cancel"
            onPress={closeDrawerMenu}
            variant="primary"
            style={[
              styles.menuActionButton,
              { backgroundColor: CANCEL_BUTTON_BG, borderColor: CANCEL_BUTTON_BORDER },
            ]}
            textStyle={{ color: CANCEL_BUTTON_TEXT, fontWeight: "700" }}
          />
        </Modal>

        <Modal
          visible={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          animationType="fade"
          backdropStyle={styles.menuBackdrop}
          contentStyle={styles.menuModal}
        >
          <Text style={[styles.menuTitle, { color: HOME_TEXT, fontFamily: theme.fonts.serif }]}>
            Delete Entry
          </Text>
          <Text style={[theme.typography.body, styles.menuSubtitle, { color: HOME_MUTED }]}>
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
              textStyle={{ color: CANCEL_BUTTON_TEXT, fontWeight: "700" }}
            />
            <Button
              label="Delete"
              onPress={handleDeleteEntry}
              variant="primary"
              style={[styles.confirmButton, styles.menuDeleteButton]}
              textStyle={{ color: "#FFFFFF", fontWeight: "700" }}
            />
          </View>
        </Modal>

        <Modal
          visible={!!deleteDrawerTarget}
          onClose={() => setDeleteDrawerTarget(null)}
          animationType="fade"
          backdropStyle={styles.menuBackdrop}
          contentStyle={styles.menuModal}
        >
          <Text style={[styles.menuTitle, { color: HOME_TEXT, fontFamily: theme.fonts.serif }]}>
            Delete Drawer
          </Text>
          <Text style={[theme.typography.body, styles.menuSubtitle, { color: HOME_MUTED }]}>
            Are you sure you want to delete this drawer?
          </Text>
          <View style={styles.confirmActions}>
            <Button
              label="Cancel"
              onPress={() => setDeleteDrawerTarget(null)}
              variant="primary"
              style={[
                styles.confirmButton,
                { backgroundColor: CANCEL_BUTTON_BG, borderColor: CANCEL_BUTTON_BORDER },
              ]}
              textStyle={{ color: CANCEL_BUTTON_TEXT, fontWeight: "700" }}
            />
            <Button
              label="Delete"
              onPress={handleDeleteDrawer}
              variant="primary"
              style={[styles.confirmButton, styles.menuDeleteButton]}
              textStyle={{ color: "#FFFFFF", fontWeight: "700" }}
            />
          </View>
        </Modal>
      </Screen>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    flexShrink: 1,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  lifePhaseLink: {
    marginLeft: 12,
    fontSize: 18,
    lineHeight: 22,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 230,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 42,
    marginTop: 6,
    marginBottom: 28,
    fontWeight: "300",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  sectionHeaderText: {
    textTransform: "uppercase",
    letterSpacing: 2.6,
    fontSize: 12,
    fontWeight: "600",
    marginRight: 14,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    opacity: 0.7,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: "solid",
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 42,
    lineHeight: 42,
    fontWeight: "400",
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "200",
  },
  inlineCta: {
    minHeight: 58,
    borderRadius: 999,
    paddingHorizontal: 24,
    borderWidth: 1,
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
    marginBottom: 8,
  },
  entryTitle: {
    flex: 1,
    fontWeight: "400",
  },
  entryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
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
  drawerCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 22,
    marginBottom: 14,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  drawerIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  drawerInfo: {
    flex: 1,
  },
  drawerTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "300",
  },
  drawerMore: {
    width: 28,
    alignItems: "flex-end",
    marginLeft: 12,
  },
  infoBox: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  drawerHelperText: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    lineHeight: 28,
    textAlign: "center",
    fontSize: 18,
    fontStyle: "italic",
  },
  menuBackdrop: {
    paddingHorizontal: 24,
    backgroundColor: "rgba(47, 41, 36, 0.28)",
  },
  menuModal: {
    width: "100%",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: HOME_SURFACE,
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
  confirmButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
  },
});
