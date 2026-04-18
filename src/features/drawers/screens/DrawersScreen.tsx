import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppBottomNav, AppPageHeader, SafeArea, Screen } from "@components/layout";
import { AppModalSheet, Button, Card, CardIconWrap, SectionHeader } from "@components/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCreateDrawer } from "@features/drawers/hooks/useCreateDrawer";
import { useDeleteDrawer } from "@features/drawers/hooks/useDeleteDrawer";
import { useDrawers } from "@features/drawers/hooks/useDrawers";
import { useUpdateDrawer } from "@features/drawers/hooks/useUpdateDrawer";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@styles/theme";
import type { Drawer } from "@types";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type DrawerListItem = Drawer & { entryCount: number };

const PAGE_BACKGROUND = "#EDEAE4";
const PAGE_SURFACE = "#FFFFFF";
const PAGE_TEXT = "#2F2924";
const PAGE_MUTED = "#6F6860";
const PAGE_PRIMARY = "#8C9A7F";
const PAGE_SECONDARY = "#556950";
const PAGE_BORDER = "#B39C87";
const CANCEL_BUTTON_BG = "#E3E1DC";
const CANCEL_BUTTON_BORDER = "#C9C4BB";
const CANCEL_BUTTON_TEXT = "#5F6368";
const DELETE_BUTTON_BG = "#A6544E";
const STARTER_DRAWER_HIDDEN_KEY = "life-drawer:starter-drawer-hidden";

const STARTER_DRAWER: DrawerListItem = {
  id: "starter-drawer",
  userId: "starter-user",
  name: "My Life Drawer",
  entryCount: 0,
  color: "#8C9A7F",
  icon: "🗃️",
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

const EXAMPLE_DRAWER_IDEAS = [
  "Career & Growth",
  "Health & Habits",
  "Family Moments",
  "Travel Memories",
] as const;

const webStorage = {
  async getItem(key: string) {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
};

const starterDrawerStorage = Platform.OS === "web" ? webStorage : AsyncStorage;

export function DrawersScreen() {
  const theme = useTheme();
  const { drawers, isLoading, fetchDrawers } = useDrawers();
  const { createDrawer, isLoading: isCreatingDrawer } = useCreateDrawer();
  const { updateDrawer, isLoading: isUpdatingDrawer } = useUpdateDrawer();
  const { deleteDrawer, isLoading: isDeletingDrawer } = useDeleteDrawer();
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [newDrawerName, setNewDrawerName] = useState("");
  const [drawerMenuTarget, setDrawerMenuTarget] = useState<DrawerListItem | null>(null);
  const [deleteDrawerTarget, setDeleteDrawerTarget] = useState<DrawerListItem | null>(null);
  const [editingDrawer, setEditingDrawer] = useState<DrawerListItem | null>(null);
  const [editDrawerName, setEditDrawerName] = useState("");
  const [isStarterDrawerHidden, setIsStarterDrawerHidden] = useState(false);
  const hasLoadedInitialData = useRef(false);
  const secondaryButtonTextStyle = { color: PAGE_SECONDARY, fontWeight: "700" } as const;
  const dangerButtonTextStyle = { color: "#FFFFFF", fontWeight: "700" } as const;
  const cancelButtonTextStyle = { color: CANCEL_BUTTON_TEXT, fontWeight: "700" } as const;
  const displayDrawers: DrawerListItem[] = isStarterDrawerHidden
    ? drawers
    : [STARTER_DRAWER, ...drawers];

  useEffect(() => {
    const loadStarterDrawerPreference = async () => {
      try {
        const value = await starterDrawerStorage.getItem(STARTER_DRAWER_HIDDEN_KEY);
        setIsStarterDrawerHidden(value === "true");
      } catch {
        setIsStarterDrawerHidden(false);
      }
    };

    loadStarterDrawerPreference();
  }, []);

  const handleCreateDrawer = useCallback(() => {
    setNewDrawerName("");
    setIsCreateDrawerOpen(true);
  }, []);

  const handleEditDrawers = useCallback((drawer: DrawerListItem) => {
    if (drawer.id === STARTER_DRAWER.id) {
      Alert.alert(
        "Not available yet",
        "The starter drawer can't be renamed. Create a custom drawer to edit it.",
      );
      return;
    }

    setEditingDrawer(drawer);
    setEditDrawerName(drawer.name);
  }, []);

  const openDrawerMenu = useCallback((drawer: DrawerListItem) => {
    setDrawerMenuTarget(drawer);
  }, []);

  const closeDrawerMenu = useCallback(() => {
    setDrawerMenuTarget(null);
  }, []);

  const closeCreateDrawerModal = useCallback(() => {
    setIsCreateDrawerOpen(false);
    setNewDrawerName("");
  }, []);

  const closeEditDrawerModal = useCallback(() => {
    setEditingDrawer(null);
    setEditDrawerName("");
  }, []);

  const handleSaveDrawer = useCallback(async () => {
    const trimmedName = newDrawerName.trim();

    if (!trimmedName) {
      Alert.alert("Name required", "Please enter a name for your drawer.");
      return;
    }

    const created = await createDrawer({ name: trimmedName, color: PAGE_PRIMARY });

    if (!created) {
      Alert.alert("Unable to create drawer", "Please try a different name.");
      return;
    }

    closeCreateDrawerModal();
    await fetchDrawers();
  }, [closeCreateDrawerModal, createDrawer, fetchDrawers, newDrawerName]);

  const handleUpdateDrawer = useCallback(async () => {
    if (!editingDrawer) {
      return;
    }

    const trimmedName = editDrawerName.trim();

    if (!trimmedName) {
      Alert.alert("Name required", "Please enter a name for your drawer.");
      return;
    }

    const updated = await updateDrawer(editingDrawer.id, { name: trimmedName });

    if (!updated) {
      Alert.alert("Unable to update drawer", "Please try again.");
      return;
    }

    closeEditDrawerModal();
    await fetchDrawers();
  }, [
    closeEditDrawerModal,
    editDrawerName,
    editingDrawer,
    fetchDrawers,
    updateDrawer,
  ]);

  const handleEditFromMenu = useCallback(() => {
    if (!drawerMenuTarget) {
      return;
    }

    const target = drawerMenuTarget;
    setDrawerMenuTarget(null);
    handleEditDrawers(target);
  }, [drawerMenuTarget, handleEditDrawers]);

  const handleDeletePrompt = useCallback(() => {
    if (!drawerMenuTarget) {
      return;
    }

    setDeleteDrawerTarget(drawerMenuTarget);
    setDrawerMenuTarget(null);
  }, [drawerMenuTarget]);

  const handleDeleteDrawer = useCallback(async () => {
    if (!deleteDrawerTarget) {
      return;
    }

    if (deleteDrawerTarget.id === STARTER_DRAWER.id) {
      try {
        await starterDrawerStorage.setItem(STARTER_DRAWER_HIDDEN_KEY, "true");
        setIsStarterDrawerHidden(true);
        setDeleteDrawerTarget(null);
        return;
      } catch {
        Alert.alert("Unable to remove drawer", "Please try again.");
        return;
      }
    }

    const success = await deleteDrawer(deleteDrawerTarget.id);

    if (!success) {
      Alert.alert("Unable to delete drawer", "Please try again.");
      return;
    }

    setDeleteDrawerTarget(null);
    await fetchDrawers();
  }, [deleteDrawer, deleteDrawerTarget, fetchDrawers]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedInitialData.current) {
        hasLoadedInitialData.current = true;
        fetchDrawers();
      }
    }, [fetchDrawers]),
  );

  return (
    <SafeArea>
      <Screen style={[styles.container, { backgroundColor: PAGE_BACKGROUND }]}>
        <AppPageHeader onSearchPress={() => router.push("/search")} />

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={PAGE_PRIMARY} />
          </View>
        ) : (
          <FlatList
            data={displayDrawers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.content}
            ListHeaderComponent={
              <>
                <View style={styles.heroBlock}>
                  <Text
                    style={[
                      styles.heroTitlePrimary,
                      { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
                    ]}
                  >
                    Your Personal{" "}
                    <Text style={[styles.heroTitleSecondary, { color: PAGE_PRIMARY }]}>
                      Archive
                    </Text>
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.primaryAction,
                    {
                      backgroundColor: PAGE_PRIMARY,
                      shadowColor: PAGE_TEXT,
                    },
                  ]}
                  onPress={handleCreateDrawer}
                >
                  <View style={styles.primaryActionIconBox}>
                    <Text style={styles.primaryActionIcon}>+</Text>
                  </View>
                  <View style={styles.primaryActionCopy}>
                    <Text
                      style={[
                        styles.primaryActionText,
                        { fontFamily: theme.fonts.serif },
                      ]}
                    >
                      Create Drawer
                    </Text>
                  </View>
                </TouchableOpacity>

                <SectionHeader
                  label="Your Drawers"
                  textColor={PAGE_MUTED}
                  dividerColor={theme.colors.accent1}
                />
              </>
            }
            renderItem={({ item }) => (
              <Card style={styles.card} variant="elevated">
                <TouchableOpacity
                  style={styles.cardPressable}
                  onPress={() => {
                    if (item.id === STARTER_DRAWER.id) {
                      Alert.alert(
                        "Starter Drawer",
                        "This is your built-in drawer. Once you start creating entries and custom drawers, they will appear here.",
                      );
                      return;
                    }

                    router.push(`/drawers/${item.id}`);
                  }}
                  accessible
                  accessibilityLabel={`Open drawer ${item.name}`}
                >
                  <CardIconWrap style={styles.icon}>
                    <MaterialCommunityIcons
                      name="archive-outline"
                      size={26}
                      color="#556950"
                    />
                  </CardIconWrap>
                  <View style={styles.cardContent}>
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={[theme.typography.bodySm, { color: PAGE_MUTED }]}>
                      {item.entryCount} entries
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openDrawerMenu(item)}
                  style={styles.cardMore}
                  accessible
                  accessibilityLabel={`More options for ${item.name}`}
                >
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={22}
                    color={theme.colors.textDisabled}
                  />
                </TouchableOpacity>
              </Card>
            )}
            ListFooterComponent={
              <>
                {drawers.length === 0 ? (
                  <View style={styles.exampleSection}>
                    <Text
                      style={[
                        theme.typography.labelSm,
                        styles.exampleSectionLabel,
                        { color: "#8A8178" },
                      ]}
                    >
                      EXAMPLE DRAWER IDEAS
                    </Text>
                    <View style={styles.examplePillWrap}>
                      {EXAMPLE_DRAWER_IDEAS.map((idea) => (
                        <View key={idea} style={styles.examplePill}>
                          <Text
                            style={[
                              theme.typography.bodySm,
                              styles.examplePillText,
                            ]}
                          >
                            {idea}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
                <View style={styles.helperPanel}>
                  <Text
                    style={[
                      styles.emptyText,
                      {
                        color: PAGE_MUTED,
                        fontFamily: theme.fonts.serif,
                      },
                    ]}
                  >
                    Create new drawers to organize your entries by theme, topic,
                    or anything that matters to you.
                  </Text>
                </View>
              </>
            }
          />
        )}

        <AppBottomNav currentRoute="/drawers" />

        <AppModalSheet
          visible={!!drawerMenuTarget}
          onClose={closeDrawerMenu}
          contentStyle={styles.menuModal}
        >
          <Text
            style={[
              styles.menuTitle,
              { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
            ]}
          >
            {drawerMenuTarget?.name || "Drawer"}
          </Text>
          <Text style={[theme.typography.body, styles.menuSubtitle, { color: PAGE_MUTED }]}>
            Choose what you want to do with this drawer.
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
            onPress={closeDrawerMenu}
            variant="primary"
            style={[
              styles.menuActionButton,
              { backgroundColor: CANCEL_BUTTON_BG, borderColor: CANCEL_BUTTON_BORDER },
            ]}
            textStyle={cancelButtonTextStyle}
          />
        </AppModalSheet>

        <AppModalSheet
          visible={!!deleteDrawerTarget}
          onClose={() => setDeleteDrawerTarget(null)}
          contentStyle={styles.menuModal}
        >
          <Text
            style={[
              styles.menuTitle,
              { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
            ]}
          >
            Delete Drawer
          </Text>
          <Text style={[theme.typography.body, styles.menuSubtitle, { color: PAGE_MUTED }]}>
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
              textStyle={cancelButtonTextStyle}
            />
            <Button
              label="Delete"
              onPress={handleDeleteDrawer}
              loading={isDeletingDrawer}
              variant="primary"
              style={[styles.confirmButton, styles.menuDeleteButton]}
              textStyle={dangerButtonTextStyle}
            />
          </View>
        </AppModalSheet>

        <AppModalSheet
          visible={isCreateDrawerOpen}
          onClose={closeCreateDrawerModal}
          contentStyle={styles.drawerModal}
        >
          <Text
            style={[
              styles.drawerModalTitle,
              { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
            ]}
          >
            Create Drawer
          </Text>
          <Text
            style={[
              styles.drawerModalMessage,
              theme.typography.body,
              { color: PAGE_MUTED },
            ]}
          >
            Give this drawer a name so you can start organizing entries by theme,
            season, or topic.
          </Text>
          <TextInput
            value={newDrawerName}
            onChangeText={setNewDrawerName}
            placeholder="Drawer name"
            placeholderTextColor="#8A8178"
            style={[
              styles.drawerInput,
              {
                color: PAGE_TEXT,
                borderColor: theme.colors.accent1,
                backgroundColor: "#F8F6F2",
              },
            ]}
          />
          <View style={styles.drawerModalActions}>
            <Button
              label="Cancel"
              onPress={closeCreateDrawerModal}
              variant="outline"
              style={styles.drawerModalSecondaryButton}
              textStyle={secondaryButtonTextStyle}
            />
            <Button
              label="Create"
              onPress={handleSaveDrawer}
              loading={isCreatingDrawer}
              variant="primary"
              style={styles.drawerModalPrimaryButton}
              textStyle={dangerButtonTextStyle}
            />
          </View>
        </AppModalSheet>

        <AppModalSheet
          visible={!!editingDrawer}
          onClose={closeEditDrawerModal}
          contentStyle={styles.drawerModal}
        >
          <Text
            style={[
              styles.drawerModalTitle,
              { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
            ]}
          >
            Edit Drawer
          </Text>
          <Text
            style={[
              styles.drawerModalMessage,
              theme.typography.body,
              { color: PAGE_MUTED },
            ]}
          >
            Update the drawer name for {editingDrawer?.name}.
          </Text>
          <TextInput
            value={editDrawerName}
            onChangeText={setEditDrawerName}
            placeholder="Drawer name"
            placeholderTextColor="#8A8178"
            style={[
              styles.drawerInput,
              {
                color: PAGE_TEXT,
                borderColor: theme.colors.accent1,
                backgroundColor: "#F8F6F2",
              },
            ]}
          />
          <View style={styles.drawerModalActions}>
            <Button
              label="Cancel"
              onPress={closeEditDrawerModal}
              variant="outline"
              style={styles.drawerModalSecondaryButton}
              textStyle={secondaryButtonTextStyle}
            />
            <Button
              label="Save"
              onPress={handleUpdateDrawer}
              loading={isUpdatingDrawer}
              variant="primary"
              style={styles.drawerModalPrimaryButton}
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
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 230,
  },
  heroBlock: {
    marginTop: 6,
    marginBottom: 30,
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
    marginTop: 2,
  },
  primaryAction: {
    minHeight: 92,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    marginBottom: 24,
  },
  primaryActionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  primaryActionCopy: {
    flex: 1,
  },
  primaryActionIcon: {
    color: "#F8F6F2",
    fontSize: 32,
    lineHeight: 32,
  },
  primaryActionText: {
    color: "#F8F6F2",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "300",
  },
  exampleSection: {
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#F8F6F2",
    borderWidth: 1,
    borderColor: "#E7DED2",
  },
  exampleSectionLabel: {
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  examplePillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  examplePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ECE6DB",
    borderWidth: 1,
    borderColor: "#DAC8B1",
  },
  examplePillText: {
    color: "#6F6860",
    fontWeight: "500",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    marginBottom: 22,
  },
  cardPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "600",
    marginBottom: 14,
  },
  cardMore: {
    width: 28,
    alignItems: "flex-end",
    marginLeft: 12,
  },
  helperPanel: {
    marginTop: 26,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  emptyText: {
    lineHeight: 28,
    textAlign: "center",
    fontSize: 18,
    fontStyle: "italic",
  },
  menuModal: {
    borderRadius: 24,
    backgroundColor: PAGE_SURFACE,
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
    backgroundColor: DELETE_BUTTON_BG,
    borderColor: DELETE_BUTTON_BG,
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
  drawerModal: {
    borderRadius: 24,
    backgroundColor: PAGE_SURFACE,
  },
  drawerModalTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "400",
    marginBottom: 8,
  },
  drawerModalMessage: {
    lineHeight: 24,
    marginBottom: 16,
  },
  drawerInput: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  drawerModalActions: {
    flexDirection: "row",
    gap: 10,
  },
  drawerModalPrimaryButton: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: PAGE_PRIMARY,
    borderColor: PAGE_PRIMARY,
  },
  drawerModalSecondaryButton: {
    flex: 1,
    borderRadius: 999,
    borderColor: PAGE_BORDER,
    backgroundColor: "#FFFFFF",
  },
});
