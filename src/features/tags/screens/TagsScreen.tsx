import { AppBottomNav, AppSideMenu, SafeArea, Screen } from "@components/layout";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTags } from "@features/tags/hooks/useTags";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@styles/theme";
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

const EXAMPLE_TAGS = [
  "gratitude",
  "milestone",
  "reflection",
  "goals",
  "learning",
  "mindfulness",
];

const PAGE_BACKGROUND = "#EDEAE4";
const PAGE_SURFACE = "#FFFFFF";
const PAGE_TEXT = "#2F2924";
const PAGE_MUTED = "#6F6860";
const PAGE_PRIMARY = "#8C9A7F";
const PAGE_SECONDARY = "#556950";
const PAGE_BORDER = "#B39C87";

export function TagsScreen() {
  const theme = useTheme();
  const { tags, isLoading, fetchTags } = useTags();
  const { activePhase, fetchActivePhase } = useLifePhase();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCreateTag = useCallback(() => {
    Alert.alert(
      "Create Tag",
      "Tag creation will live here next. Right now, you can create tags while writing or editing an entry.",
    );
  }, []);

  const handleSetLifePhase = useCallback(() => {
    router.push("/life-phases");
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchActivePhase();
      fetchTags();
    }, [fetchActivePhase, fetchTags]),
  );

  return (
    <SafeArea>
      <Screen style={[styles.container, { backgroundColor: PAGE_BACKGROUND }]}>
        <AppSideMenu
          visible={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          currentRoute="/tags"
        />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => setIsMenuOpen(true)} style={styles.headerIconButton}>
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
            data={tags}
            keyExtractor={(item, index) => item?.id ?? `${item?.name ?? "tag"}-${index}`}
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
                    Small Details{" "}
                    <Text style={[styles.heroTitleSecondary, { color: PAGE_PRIMARY }]}>
                      That Connect
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
                  onPress={handleCreateTag}
                  accessible
                  accessibilityLabel="Create tag"
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
                      Create Tag
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
                    {tags.length > 0 ? "Your Tags" : "Example Tags"}
                  </Text>
                  <View
                    style={[
                      styles.sectionDivider,
                      { backgroundColor: theme.colors.accent1 },
                    ]}
                  />
                </View>
              </>
            }
            ListEmptyComponent={
              <>
                {EXAMPLE_TAGS.map((tag, index) => (
                  <View
                    key={tag}
                    style={[
                      styles.card,
                      {
                        backgroundColor: PAGE_SURFACE,
                        shadowColor: PAGE_TEXT,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.icon,
                        {
                          backgroundColor:
                            (index % 3 === 1 ? theme.colors.accent1 : PAGE_PRIMARY) + "22",
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="label-outline"
                        size={24}
                        color={index % 3 === 1 ? PAGE_BORDER : PAGE_PRIMARY}
                      />
                    </View>
                    <View style={styles.cardContent}>
                      <Text
                        style={[
                          styles.cardTitle,
                          { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
                        ]}
                      >
                        {tag}
                      </Text>
                      <Text
                        style={[
                          theme.typography.bodySm,
                          { color: PAGE_MUTED, fontWeight: "600" },
                        ]}
                      >
                        Example tag for future entries
                      </Text>
                    </View>
                  </View>
                ))}

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
                    Tags help you connect moments across drawers and life phases, so related memories stay easy to revisit.
                  </Text>
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
              >
                <View
                  style={[
                    styles.icon,
                    {
                      backgroundColor: (item.color || theme.colors.primary) + "22",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="label-outline"
                    size={24}
                    color={item.color || theme.colors.primary}
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
                  onPress={handleCreateTag}
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
              tags.length > 0 ? (
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
                    Tags help you connect moments across drawers and life phases, so related memories stay easy to revisit.
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        <AppBottomNav currentRoute="/tags" />
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
