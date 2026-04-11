import { AppBottomNav, AppSideMenu, SafeArea, Screen } from "@components/layout";
import { Button } from "@components/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDrawers } from "@features/drawers/hooks/useDrawers";
import { useEntries } from "@features/entries/hooks/useEntries";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "@store";
import { useTheme } from "@styles/theme";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLifePhase } from "../hooks/useLifePhase";

interface GroupedEntries {
  [date: string]: any[];
}

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
const HOME_SURFACE = "#FFFFFF";

export function HomeScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const {
    entries,
    isLoading: entriesLoading,
    fetchRecentEntries,
  } = useEntries();
  const { drawers, isLoading: drawersLoading, fetchDrawers } = useDrawers();
  const {
    activePhase,
    isLoading: phaseLoading,
    fetchActivePhase,
  } = useLifePhase();

  const [groupedEntries, setGroupedEntries] = useState<GroupedEntries>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    router.push(`/entry/${entryId}`);
  }, []);

  const handleDrawerPress = useCallback((drawerId: string) => {
    router.push(`/drawers/${drawerId}`);
  }, []);

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
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[
                    theme.typography.bodySm,
                    styles.sectionHeaderText,
                    { color: HOME_MUTED },
                  ]}
                >
                  Recent Entries
                </Text>
                <View
                  style={[
                    styles.sectionDivider,
                    { backgroundColor: theme.colors.accent1 },
                  ]}
                />
              </View>

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
                      {(dateEntries as any[]).map((entry) => (
                        <TouchableOpacity
                          key={entry.id}
                          style={[
                            styles.entryCard,
                            {
                              backgroundColor: HOME_SURFACE,
                              shadowColor: HOME_TEXT,
                            },
                          ]}
                          onPress={() => handleEntryPress(entry.id)}
                          accessible
                          accessibilityLabel={`Entry: ${entry.title || "Untitled"}`}
                          accessibilityHint={`Created on ${new Date(entry.createdAt).toLocaleDateString()}`}
                        >
                          <View style={styles.entryHeader}>
                            <Text
                              style={[
                                theme.typography.h3,
                                {
                                  color: HOME_TEXT,
                                  flex: 1,
                                  fontFamily: theme.fonts.serif,
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {entry.title || "Untitled Entry"}
                            </Text>
                            {entry.mood && (
                              <Text
                                style={[theme.typography.body]}
                                accessible
                                accessibilityLabel={`Mood: ${entry.mood}`}
                              >
                                {entry.mood}
                              </Text>
                            )}
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
                          {entry.drawers && entry.drawers.length > 0 && (
                            <View style={styles.entryTags}>
                              {entry.drawers.map((drawer: any) => (
                                <View
                                  key={drawer.id}
                                  style={[
                                    styles.tag,
                                    {
                                      backgroundColor: drawer.color + "20",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      theme.typography.labelXs,
                                      { color: drawer.color },
                                    ]}
                                  >
                                    {drawer.name}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Recently Opened Drawers Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[
                    theme.typography.bodySm,
                    styles.sectionHeaderText,
                    { color: HOME_MUTED },
                  ]}
                >
                  Recently Opened Drawers
                </Text>
                <View
                  style={[
                    styles.sectionDivider,
                    { backgroundColor: theme.colors.accent1 },
                  ]}
                />
              </View>

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
                      onPress={() => {}}
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
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 22,
    marginBottom: 14,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
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
});
