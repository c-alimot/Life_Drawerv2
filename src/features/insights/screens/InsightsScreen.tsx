import { AppBottomNav, SafeArea, Screen } from "@components/layout";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MOOD_MAP, type MoodData } from "@constants/moods";
import { useEntries } from "@features/entries/hooks/useEntries";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@styles/theme";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PAGE_BACKGROUND = "#EDEAE4";
const PAGE_SURFACE = "#FFFFFF";
const PAGE_TEXT = "#2F2924";
const PAGE_MUTED = "#6F6860";
const PAGE_PRIMARY = "#8C9A7F";
const PAGE_BORDER = "#B39C87";

export function InsightsScreen() {
  const theme = useTheme();
  const { entries, isLoading, fetchEntries } = useEntries();
  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [fetchEntries]),
  );

  const archiveEntries = useMemo(() => entries ?? [], [entries]);

  const tagFrequency = useMemo(() => {
    const tagMap: Record<
      string,
      { name: string; count: number; color: string }
    > = {};

    archiveEntries.forEach((entry) => {
      entry.tags?.forEach((tag) => {
        if (!tagMap[tag.id]) {
          tagMap[tag.id] = { name: tag.name, count: 0, color: tag.color };
        }
        tagMap[tag.id].count++;
      });
    });

    return Object.values(tagMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [archiveEntries]);

  const drawerFrequency = useMemo(() => {
    const drawerMap: Record<
      string,
      { name: string; count: number; color: string }
    > = {};

    archiveEntries.forEach((entry) => {
      entry.drawers?.forEach((drawer) => {
        if (!drawerMap[drawer.id]) {
          drawerMap[drawer.id] = {
            name: drawer.name,
            count: 0,
            color: drawer.color,
          };
        }
        drawerMap[drawer.id].count++;
      });
    });

    return Object.values(drawerMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [archiveEntries]);

  const stats = useMemo(() => {
    const totalEntries = archiveEntries.length;
    const entriesWithAudio = archiveEntries.filter((e) => e.audioUrl).length;
    const entriesWithImages = archiveEntries.filter(
      (e) => e.images && e.images.length > 0,
    ).length;
    const totalImages = archiveEntries.reduce(
      (sum, e) => sum + (e.images?.length || 0),
      0,
    );
    const avgWordsPerEntry = Math.round(
      archiveEntries.reduce((sum, e) => sum + e.content.split(" ").length, 0) /
        (totalEntries || 1),
    );

    return {
      totalEntries,
      entriesWithAudio,
      entriesWithImages,
      totalImages,
      avgWordsPerEntry,
    };
  }, [archiveEntries]);

  const mostCommonMood = useMemo(() => {
    const counts: Record<string, number> = {};
    let maxMood: string | null = null;
    let maxCount = 0;

    archiveEntries.forEach((entry) => {
      if (!entry.mood) return;
      counts[entry.mood] = (counts[entry.mood] || 0) + 1;
    });

    Object.entries(counts).forEach(([mood, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxMood = mood;
      }
    });

    return maxMood;
  }, [archiveEntries]);

  const writingStreak = useMemo(() => {
    const dates = new Set(
      archiveEntries.map((e) => new Date(e.createdAt).toLocaleDateString()),
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (dates.has(currentDate.toLocaleDateString())) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }, [archiveEntries]);

  const mostCommonMoodData: MoodData | null = mostCommonMood
    ? MOOD_MAP[mostCommonMood as keyof typeof MOOD_MAP]
    : null;

  const onThisDayCount = useMemo(() => {
    const today = new Date();
    return archiveEntries.filter((entry) => {
      const entryDate = new Date(entry.createdAt);
      return (
        entryDate.getMonth() === today.getMonth() &&
        entryDate.getDate() === today.getDate() &&
        entryDate.getFullYear() < today.getFullYear()
      );
    }).length;
  }, [archiveEntries]);

  const hasArchiveContent = stats.totalEntries > 0;
  const heroTitle = hasArchiveContent
    ? "Your Story Is Taking Shape"
    : "Your Journey Begins Here";
  const heroBody =
    stats.totalEntries > 0
      ? "A quiet picture of your archive is beginning to emerge through the moments you keep."
      : "Welcome to your quiet space. Your archive will evolve as you document your days.";

  const onThisDayBody =
    onThisDayCount > 0
      ? `${onThisDayCount} memory${onThisDayCount === 1 ? "" : "ies"} from this date can already return to you as echoes of another year.`
      : "In one year, your first memories will reappear here as echoes of today.";

  const patternsBody =
    tagFrequency[0]
      ? `So far, "${tagFrequency[0].name}" is one of the threads shaping your story. The patterns will deepen as you keep writing.`
      : drawerFrequency[0]
        ? `${drawerFrequency[0].name} is starting to define this chapter of your archive. Over time, your themes will become clearer.`
        : "Over time, your reflections will reveal the themes, moods, and rhythms that define your journey.";

  const galleryItems = [
    {
      key: "photos",
      icon: "image-outline",
      label: "Photos",
      value:
        stats.totalImages > 0
          ? `${stats.totalImages} saved`
          : "Imagery will gather here",
    },
    {
      key: "audio",
      icon: "microphone-outline",
      label: "Voice Notes",
      value:
        stats.entriesWithAudio > 0
          ? `${stats.entriesWithAudio} recorded`
          : "Audio moments will appear here",
    },
    {
      key: "mood",
      icon: "heart-outline",
      label: "Mood",
      value: mostCommonMoodData
        ? mostCommonMoodData.label
        : "Emotional patterns will emerge",
    },
    {
      key: "drawers",
      icon: "archive-outline",
      label: "Drawers",
      value: drawerFrequency[0]
        ? drawerFrequency[0].name
        : "Your themes will take shape",
    },
  ] as const;

  if (isLoading) {
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <TouchableOpacity
            onPress={() => router.push("/search")}
            style={styles.headerIconButton}
            accessible
            accessibilityLabel="Search entries"
          >
            <MaterialCommunityIcons name="magnify" size={32} color={PAGE_PRIMARY} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.heroBlock}>
            <Text
              style={[
                styles.heroTitle,
                {
                  color: hasArchiveContent ? PAGE_PRIMARY : PAGE_TEXT,
                  fontFamily: theme.fonts.serif,
                },
              ]}
            >
              {hasArchiveContent ? (
                heroTitle
              ) : (
                <>
                  Your Journey Begins{" "}
                  <Text style={{ color: PAGE_PRIMARY }}>Here</Text>
                </>
              )}
            </Text>
            <Text
              style={[
                styles.heroBody,
                { color: PAGE_MUTED },
              ]}
            >
              {heroBody}
            </Text>
          </View>

          <View style={styles.featureStack}>
            <View
              style={[
                styles.featureCard,
                {
                  backgroundColor: PAGE_SURFACE,
                  borderColor: `${PAGE_BORDER}55`,
                  shadowColor: PAGE_TEXT,
                },
              ]}
            >
              <View style={styles.featureIconWrap}>
                <MaterialCommunityIcons
                  name="timer-sand"
                  size={24}
                  color={PAGE_PRIMARY}
                />
              </View>
              <View style={styles.featureCopy}>
                <Text
                  style={[
                    styles.featureTitle,
                    { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
                  ]}
                >
                  On This Day
                </Text>
                <Text style={[styles.featureBody, { color: PAGE_MUTED }]}>
                  {onThisDayBody}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.featureCard,
                {
                  backgroundColor: PAGE_SURFACE,
                  borderColor: `${PAGE_BORDER}55`,
                  shadowColor: PAGE_TEXT,
                },
              ]}
            >
              <View style={styles.featureIconWrap}>
                <MaterialCommunityIcons
                  name="star-four-points-outline"
                  size={24}
                  color={PAGE_PRIMARY}
                />
              </View>
              <View style={styles.featureCopy}>
                <Text
                  style={[
                    styles.featureTitle,
                    { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
                  ]}
                >
                  Patterns & Themes
                </Text>
                <Text style={[styles.featureBody, { color: PAGE_MUTED }]}>
                  {patternsBody}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
              ]}
            >
              The Visual Gallery
            </Text>
            <Text
              style={[
                styles.sectionBody,
                { color: PAGE_MUTED },
              ]}
            >
              Imagery and signals from your journey, gathered gently over time.
            </Text>

            <View style={styles.galleryGrid}>
              {galleryItems.map((item) => (
                <View
                  key={item.key}
                  style={[
                    styles.galleryTile,
                    {
                      backgroundColor: PAGE_SURFACE,
                      borderColor: `${PAGE_BORDER}55`,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={28}
                    color={theme.colors.textDisabled}
                  />
                  <Text style={[styles.galleryLabel, { color: PAGE_TEXT }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.galleryValue, { color: PAGE_MUTED }]}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.snapshotCard,
              {
                backgroundColor: PAGE_SURFACE,
                borderColor: `${PAGE_BORDER}55`,
                shadowColor: PAGE_TEXT,
              },
            ]}
          >
            <Text
              style={[
                styles.snapshotTitle,
                { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
              ]}
            >
              Quiet Snapshot
            </Text>
            <Text style={[styles.snapshotBody, { color: PAGE_MUTED }]}>
              {stats.totalEntries > 0
                ? `${stats.totalEntries} entries, ${stats.avgWordsPerEntry} average words, and a ${writingStreak}-day writing rhythm are beginning to shape your archive.`
                : "Once you begin writing, this space will gently reflect your rhythms, themes, and returning moments."}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryCta,
              {
                backgroundColor: PAGE_PRIMARY,
                shadowColor: PAGE_TEXT,
              },
            ]}
            onPress={() => router.push("/create-entry")}
            accessible
            accessibilityLabel="Create new entry"
            accessibilityHint="Open the create entry screen"
          >
            <Text
              style={[
                styles.primaryCtaText,
                { color: PAGE_SURFACE },
              ]}
            >
              Create New Entry
            </Text>
          </TouchableOpacity>

          {stats.totalEntries === 0 && (
            <View style={styles.emptyHint}>
              <Text
                style={[
                  styles.emptyHintText,
                  { color: PAGE_MUTED },
                ]}
              >
                Your insights will deepen as your archive grows.
              </Text>
            </View>
          )}
        </ScrollView>

        <AppBottomNav currentRoute="/insights" />
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
    alignItems: "center",
    justifyContent: "center",
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
  content: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 230,
  },
  heroBlock: {
    marginTop: 4,
    marginBottom: 34,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "300",
  },
  heroBody: {
    marginTop: 18,
    fontSize: 18,
    lineHeight: 32,
    maxWidth: 560,
  },
  featureStack: {
    gap: 18,
    marginBottom: 40,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  featureIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F1ECE4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },
  featureCopy: {
    flex: 1,
    paddingTop: 2,
  },
  featureTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "300",
  },
  featureBody: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 30,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "300",
  },
  sectionBody: {
    marginTop: 14,
    marginBottom: 18,
    fontSize: 16,
    lineHeight: 28,
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  galleryTile: {
    width: "47%",
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 170,
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
  },
  galleryLabel: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  galleryValue: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  snapshotCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    marginBottom: 28,
  },
  snapshotTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "300",
  },
  snapshotBody: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 30,
  },
  primaryCta: {
    minHeight: 76,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    marginBottom: 18,
  },
  primaryCtaText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  emptyHint: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyHintText: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 24,
  },
});
