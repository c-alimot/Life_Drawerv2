import { AppBottomNav, AppSideMenu, SafeArea, Screen } from "@components/layout";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDrawers } from "@features/drawers/hooks/useDrawers";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@styles/theme";
import type { Drawer } from "@types";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLifePhase } from "../../home/hooks/useLifePhase";

type DrawerListItem = Drawer & { entryCount: number };

const PAGE_BACKGROUND = "#EDEAE4";
const PAGE_SURFACE = "#FFFFFF";
const PAGE_TEXT = "#2F2924";
const PAGE_MUTED = "#6F6860";
const PAGE_PRIMARY = "#8C9A7F";
const PAGE_SECONDARY = "#556950";
const PAGE_BORDER = "#B39C87";

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

export function DrawersScreen() {
  const theme = useTheme();
  const { drawers, isLoading, fetchDrawers } = useDrawers();
  const { activePhase, fetchActivePhase } = useLifePhase();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasRealDrawers = drawers.length > 0;
  const displayDrawers: DrawerListItem[] = hasRealDrawers ? drawers : [STARTER_DRAWER];

  const handleCreateDrawer = useCallback(() => {
    Alert.alert(
      "Create Drawer",
      "Drawer creation will live here next. For now, you can create drawers while writing a new entry.",
    );
  }, []);

  const handleEditDrawers = useCallback(() => {
    Alert.alert(
      "Edit Drawers",
      "Drawer editing options will live here next. You can already open existing drawers from this page.",
    );
  }, []);

  const handleSetLifePhase = useCallback(() => {
    router.push("/life-phases");
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchActivePhase();
      fetchDrawers();
    }, [fetchActivePhase, fetchDrawers]),
  );

  return (
    <SafeArea>
      <Screen style={[styles.container, { backgroundColor: PAGE_BACKGROUND }]}>
        <AppSideMenu
          visible={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          currentRoute="/drawers"
        />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => setIsMenuOpen(true)}
              style={styles.headerIconButton}
            >
              <MaterialCommunityIcons name="menu" size={34} color={PAGE_TEXT} />
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
                  styles.pageTitle,
                  { color: PAGE_MUTED, fontWeight: "300" },
                ]}
              >
                {activePhase ? activePhase.name : "Set Life Phase"}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/search")}
            style={styles.headerIconButton}
            accessible
            accessibilityLabel="Search entries"
          >
            <MaterialCommunityIcons name="magnify" size={32} color={PAGE_PRIMARY} />
          </TouchableOpacity>
        </View>

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

                <View style={styles.sectionHeaderRow}>
                  <Text
                    style={[
                      theme.typography.bodySm,
                      styles.sectionHeaderText,
                      { color: PAGE_MUTED },
                    ]}
                  >
                    Your Drawers
                  </Text>
                  <View
                    style={[
                      styles.sectionDivider,
                      { backgroundColor: theme.colors.accent1 },
                    ]}
                  />
                </View>

                <View style={styles.topRow}>
                  <TouchableOpacity
                    style={[
                      styles.secondaryAction,
                      {
                        borderColor: PAGE_BORDER,
                        backgroundColor: PAGE_SURFACE,
                        shadowColor: PAGE_TEXT,
                      },
                    ]}
                    onPress={handleEditDrawers}
                  >
                    <Text
                      style={[
                        theme.typography.body,
                        { color: PAGE_TEXT, fontWeight: "700" },
                      ]}
                    >
                      Edit
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.card,
                  {
                    backgroundColor: PAGE_SURFACE,
                    shadowColor: PAGE_TEXT,
                  },
                ]}
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
              >
                <View
                  style={[
                    styles.icon,
                    {
                      backgroundColor: (item.color || PAGE_PRIMARY) + "22",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="archive-outline"
                    size={26}
                    color={item.color || PAGE_PRIMARY}
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      theme.typography.bodySm,
                      { color: PAGE_MUTED, fontWeight: "600" },
                      ]}
                    >
                    {item.entryCount} entries
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleEditDrawers}
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
              </TouchableOpacity>
            )}
            ListFooterComponent={
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
            }
          />
        )}

        <AppBottomNav currentRoute="/drawers" />
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
    alignItems: "center",
    justifyContent: "space-between",
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
  pageTitle: {
    marginLeft: 12,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "300",
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
  topRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 22,
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
  secondaryAction: {
    display: "none",
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
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 18,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    minHeight: 106,
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "300",
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
});
