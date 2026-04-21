import { AppBottomNav, AppPageHeader, SafeArea, Screen } from "@components/layout";
import { Button, Card, CardIconWrap, SectionHeader } from "@components/ui";
import { MaterialCommunityIcons } from "@components/ui/icons";
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
import Svg, { Circle, Path } from "react-native-svg";

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

const CARD_THEME_BY_KEY = {
  entries: {
    surface: "#F6F3ED",
    border: "#DCCFC0",
    iconSurface: "#E9E3D9",
    iconColor: "#6A665F",
    accent: "#BFC8B5",
  },
  drawers: {
    surface: "#EEF4F0",
    border: "#C8D8CE",
    iconSurface: "#DCE8E1",
    iconColor: "#5E7668",
    accent: "#A9C2B3",
  },
  insights: {
    surface: "#F3F4F3",
    border: "#D6DCD8",
    iconSurface: "#DEE3E6",
    iconColor: "#687178",
    accent: "#CAD4DB",
  },
  account: {
    surface: "#F5F1F4",
    border: "#DCCFD8",
    iconSurface: "#E9DEE8",
    iconColor: "#716676",
    accent: "#D6C8D3",
  },
} as const;

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

  const renderCardAccent = useCallback((cardKey: keyof typeof CARD_THEME_BY_KEY) => {
    const accentColor = CARD_THEME_BY_KEY[cardKey].accent;

    if (cardKey === "entries") {
      return (
        <Svg viewBox="0 0 96 78" width={96} height={78} style={styles.accentBottomRight}>
          <Circle cx={86} cy={82} r={44} fill={accentColor + "7A"} />
          <Circle cx={86} cy={82} r={30} fill={accentColor + "56"} />
        </Svg>
      );
    }

    if (cardKey === "drawers") {
      return (
        <View style={styles.accentBottomRight}>
          <MaterialCommunityIcons
            name="sparkles-outline"
            size={14}
            color={accentColor + "B0"}
            style={styles.sparkleOne}
          />
          <MaterialCommunityIcons
            name="sparkles-outline"
            size={11}
            color={accentColor + "9A"}
            style={styles.sparkleTwo}
          />
          <MaterialCommunityIcons
            name="sparkles-outline"
            size={9}
            color={accentColor + "86"}
            style={styles.sparkleThree}
          />
          <MaterialCommunityIcons
            name="sparkles-outline"
            size={8}
            color={accentColor + "78"}
            style={styles.sparkleFour}
          />
        </View>
      );
    }

    if (cardKey === "insights") {
      return (
        <Svg viewBox="0 0 96 78" width={96} height={78} style={styles.accentBottomRight}>
          <Path
            d="M8 78 C24 54 48 50 96 42 L96 78 Z"
            fill={accentColor + "6C"}
          />
          <Path
            d="M24 78 C42 58 62 56 96 52 L96 78 Z"
            fill={accentColor + "52"}
          />
        </Svg>
      );
    }

    return (
      <Svg viewBox="0 0 96 78" width={96} height={78} style={styles.accentBottomRight}>
        <Path
          d="M40 78 A58 58 0 0 1 96 24"
          fill="none"
          stroke={accentColor + "AA"}
          strokeWidth={1.9}
        />
        <Path
          d="M54 78 A46 46 0 0 1 96 38"
          fill="none"
          stroke={accentColor + "95"}
          strokeWidth={1.7}
        />
        <Path
          d="M68 78 A33 33 0 0 1 96 50"
          fill="none"
          stroke={accentColor + "80"}
          strokeWidth={1.5}
        />
      </Svg>
    );
  }, []);

  return (
    <SafeArea>
      <Screen style={[styles.container, { backgroundColor: HOME_BACKGROUND }]}>
        <AppPageHeader onSearchPress={handleSearch} />

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
                variant="elevated"
                onPress={handleCreateFirstEntry}
                accessibilityLabel="Create first entry"
              >
                <CardIconWrap style={styles.dashboardIcon}>
                  <MaterialCommunityIcons
                    name="file-document-edit-outline"
                    size={24}
                    color="#556950"
                    style={styles.dashboardIconGlyph}
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
              {DASHBOARD_CARDS.map((card) => {
                const cardTheme = CARD_THEME_BY_KEY[card.key as keyof typeof CARD_THEME_BY_KEY];
                return (
                  <Card
                    key={card.key}
                    style={[
                      styles.dashboardCard,
                      {
                        backgroundColor: cardTheme.surface,
                        borderColor: cardTheme.border,
                      },
                    ]}
                    onPress={() => router.push(card.route)}
                    accessibilityLabel={`${card.title} dashboard card`}
                  >
                    <View pointerEvents="none" style={styles.cardAccentLayer}>
                      {renderCardAccent(card.key as keyof typeof CARD_THEME_BY_KEY)}
                    </View>
                    <CardIconWrap style={[styles.dashboardIcon, { backgroundColor: cardTheme.iconSurface }]}>
                      <MaterialCommunityIcons
                        name={card.icon}
                        size={24}
                        color={cardTheme.iconColor}
                        style={styles.dashboardIconGlyph}
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
                );
              })}
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
    backgroundColor: "#FBFAF7",
  },
  createFirstEntryButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#556950",
    marginTop: 12,
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
    borderWidth: 1,
    overflow: "hidden",
  },
  dashboardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#ECE6DB",
    marginBottom: 14,
  },
  dashboardIconGlyph: {
    opacity: 0.86,
  },
  dashboardTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "500",
    marginBottom: 14,
  },
  dashboardDescription: {
    lineHeight: 22,
    maxWidth: "84%",
  },
  cardAccentLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: "hidden",
  },
  accentBottomRight: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 96,
    height: 78,
  },
  sparkleOne: {
    position: "absolute",
    right: 14,
    bottom: 14,
  },
  sparkleTwo: {
    position: "absolute",
    right: 30,
    bottom: 20,
  },
  sparkleThree: {
    position: "absolute",
    right: 8,
    bottom: 30,
  },
  sparkleFour: {
    position: "absolute",
    right: 24,
    bottom: 8,
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
