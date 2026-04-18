import { AppBottomNav, AppHeaderBrand, SafeArea, Screen } from "@components/layout";
import { Button, Card, CardIconWrap, SectionHeader } from "@components/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEntries } from "@features/entries/hooks/useEntries";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "@store";
import { useTheme } from "@styles/theme";
import { router } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const HOME_BACKGROUND = "#EDEAE4";
const HOME_TEXT = "#2F2924";
const HOME_MUTED = "#6F6860";
const HOME_PRIMARY = "#8C9A7F";

const DASHBOARD_CARDS = [
  {
    key: "entries",
    title: "Entries",
    description: "Browse and revisit your moments",
    icon: "file-document-outline" as const,
    route: "/all-entries" as const,
  },
  {
    key: "drawers",
    title: "Drawers",
    description: "Organize entries from different parts of your life",
    icon: "archive-outline" as const,
    route: "/drawers" as const,
  },
  {
    key: "insights",
    title: "Insights",
    description: "Discover patterns in your reflections",
    icon: "chart-box-outline" as const,
    route: "/insights" as const,
  },
  {
    key: "account",
    title: "Account",
    description: "Manage your profile and preferences",
    icon: "account-cog-outline" as const,
    route: "/settings" as const,
  },
];

export function HomeScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { entries, isLoading, fetchRecentEntries } = useEntries();
  const hasLoadedInitialData = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (user && !hasLoadedInitialData.current) {
        hasLoadedInitialData.current = true;
        fetchRecentEntries(40);
      }
    }, [user, fetchRecentEntries]),
  );

  const recentlyUsedTags = useMemo(() => {
    const seen = new Set<string>();
    const tags = [];

    for (const entry of entries) {
      for (const tag of entry.tags || []) {
        if (seen.has(tag.id)) {
          continue;
        }

        seen.add(tag.id);
        tags.push(tag);

        if (tags.length === 8) {
          return tags;
        }
      }
    }

    return tags;
  }, [entries]);

  const handleSearch = useCallback(() => {
    router.push("/search");
  }, []);

  const handleCreateFirstEntry = useCallback(() => {
    router.push("/create-entry");
  }, []);

  return (
    <SafeArea>
      <Screen style={[styles.container, { backgroundColor: HOME_BACKGROUND }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <AppHeaderBrand />
          </View>
          <TouchableOpacity
            onPress={handleSearch}
            style={styles.headerIconButton}
            accessible
            accessibilityLabel="Search entries"
            accessibilityHint="Open search and filter screen"
          >
            <MaterialCommunityIcons name="magnify" size={32} color={HOME_PRIMARY} />
          </TouchableOpacity>
        </View>

        {isLoading && entries.length === 0 ? (
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

            {!isLoading && entries.length === 0 ? (
              <Card
                style={styles.createFirstEntryCard}
                onPress={handleCreateFirstEntry}
                accessibilityLabel="Create first entry"
              >
                <CardIconWrap style={styles.dashboardIcon}>
                  <MaterialCommunityIcons
                    name="file-document-edit-outline"
                    size={28}
                    color="#556950"
                  />
                </CardIconWrap>
                <Text
                  style={[
                    styles.dashboardTitle,
                    {
                      color: HOME_TEXT,
                      fontFamily: theme.fonts.serif,
                    },
                  ]}
                >
                  Create first entry
                </Text>
                <Text
                  style={[
                    theme.typography.bodySm,
                    styles.dashboardDescription,
                    { color: HOME_MUTED },
                  ]}
                >
                  Start with one small moment. You can always add more details later.
                </Text>
                <Button
                  label="Create first entry"
                  onPress={handleCreateFirstEntry}
                  variant="primary"
                  size="md"
                  style={styles.createFirstEntryButton}
                  textStyle={styles.createFirstEntryButtonText}
                  accessibilityLabel="Create first entry button"
                />
              </Card>
            ) : null}

            <View style={styles.dashboardGrid}>
              {DASHBOARD_CARDS.map((card) => (
                <Card
                  key={card.key}
                  style={styles.dashboardCard}
                  onPress={() => router.push(card.route)}
                  accessibilityLabel={`${card.title} dashboard card`}
                >
                  <CardIconWrap style={styles.dashboardIcon}>
                    <MaterialCommunityIcons
                      name={card.icon}
                      size={28}
                      color="#556950"
                    />
                  </CardIconWrap>
                  <Text
                    style={[
                      styles.dashboardTitle,
                      {
                        color: HOME_TEXT,
                        fontFamily: theme.fonts.serif,
                      },
                    ]}
                  >
                    {card.title}
                  </Text>
                  <Text style={[theme.typography.bodySm, styles.dashboardDescription, { color: HOME_MUTED }]}>
                    {card.description}
                  </Text>
                </Card>
              ))}
            </View>

            {recentlyUsedTags.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader
                  label="Recently Used Tags"
                  textColor="#8A8178"
                  dividerColor={theme.colors.accent1}
                />

                <View style={styles.tagsWrap}>
                  {recentlyUsedTags.map((tag) => {
                    return (
                      <TouchableOpacity
                        key={tag.id}
                        onPress={() =>
                          router.push({
                            pathname: "/all-entries",
                            params: { tagId: tag.id },
                          })
                        }
                        style={[
                          styles.tagChip,
                          {
                            backgroundColor: "#ECE6DB",
                            borderColor: "#DAC8B1",
                          },
                        ]}
                        accessible
                        accessibilityLabel={`Filter entries by ${tag.name}`}
                      >
                        <Text
                          style={[
                            theme.typography.bodySm,
                            { color: "#556950", fontWeight: "500" },
                          ]}
                        >
                          {tag.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}
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
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  createFirstEntryCard: {
    width: "100%",
    minHeight: 168,
    marginBottom: 22,
  },
  createFirstEntryButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#556950",
    marginTop: 4,
    minHeight: 42,
    paddingHorizontal: 18,
  },
  createFirstEntryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  dashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 22,
    marginBottom: 34,
  },
  dashboardCard: {
    width: "48%",
    minHeight: 168,
  },
  dashboardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#ECE6DB",
    marginBottom: 14,
  },
  dashboardTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "500",
    marginBottom: 14,
  },
  dashboardDescription: {
    lineHeight: 22,
  },
  section: {
    marginBottom: 20,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tagChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
