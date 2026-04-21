import { AppBottomNav, AppPageHeader, SafeArea, Screen } from "@components/layout";
import { AppModalSheet, Button, Card, CardIconWrap } from "@components/ui";
import { MaterialCommunityIcons } from "@components/ui/icons";
import { MOOD_MAP, type MoodData } from "@constants/moods";
import { useEntries } from "@features/entries/hooks/useEntries";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@styles/theme";
import { router } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
const PAGE_SECONDARY = "#556950";
const PAGE_CARD_CREAM = "#FBFAF7";
const PAGE_CARD_BORDER = "#E7DED2";
const GALLERY_DETAIL_TITLE_BY_KEY = {
  photos: "Photos",
  audio: "Voice Notes",
  mood: "Mood",
  drawers: "Drawers",
} as const;

export function InsightsScreen() {
  const theme = useTheme();
  const { entries, isLoading, fetchEntries } = useEntries();
  const hasLoadedInitialData = useRef(false);
  const [activeGalleryKey, setActiveGalleryKey] = useState<
    "photos" | "audio" | "mood" | "drawers" | null
  >(null);
  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedInitialData.current) {
        hasLoadedInitialData.current = true;
        fetchEntries();
      }
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
      { name: string; count: number; color: string; icon?: string | null }
    > = {};

    archiveEntries.forEach((entry) => {
      entry.drawers?.forEach((drawer) => {
        if (!drawerMap[drawer.id]) {
          drawerMap[drawer.id] = {
            name: drawer.name,
            count: 0,
            color: drawer.color,
            icon: drawer.icon,
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

  const mostCommonMoodData: MoodData | null = mostCommonMood
    ? MOOD_MAP[mostCommonMood as keyof typeof MOOD_MAP]
    : null;
  const resolveDrawerIcon = useCallback((icon: string | undefined | null) => {
    if (!icon) return "archive-outline";
    return /^[a-z0-9-]+$/i.test(icon) ? icon : "archive-outline";
  }, []);

  const recentImageUris = useMemo(() => {
    const sorted = [...archiveEntries].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const uniqueUris: string[] = [];

    for (const entry of sorted) {
      for (const imageUri of entry.images || []) {
        if (
          typeof imageUri === "string" &&
          imageUri.trim().length > 0 &&
          !uniqueUris.includes(imageUri)
        ) {
          uniqueUris.push(imageUri);
          if (uniqueUris.length === 4) {
            return uniqueUris;
          }
        }
      }
    }

    return uniqueUris;
  }, [archiveEntries]);

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

  const isGalleryItemEmpty = useCallback(
    (key: "photos" | "audio" | "mood" | "drawers") => {
      if (key === "photos") return stats.totalImages === 0;
      if (key === "audio") return stats.entriesWithAudio === 0;
      if (key === "mood") return !mostCommonMoodData;
      return drawerFrequency.length === 0;
    },
    [drawerFrequency.length, mostCommonMoodData, stats.entriesWithAudio, stats.totalImages],
  );

  const renderGalleryDetail = useCallback(() => {
    if (!activeGalleryKey) return null;

    const isEmpty = isGalleryItemEmpty(activeGalleryKey);

    if (isEmpty) {
      return (
        <View style={styles.galleryDetailEmptyWrap}>
          <Text style={[styles.galleryDetailEmptyTitle, { color: PAGE_TEXT }]}>
            Nothing here yet
          </Text>
            <Text style={[styles.galleryDetailEmptyBody, { color: PAGE_MUTED }]}>
            As you add entries, your {GALLERY_DETAIL_TITLE_BY_KEY[activeGalleryKey].toLowerCase()} will appear here.
          </Text>
          <Button
            label="Create New Entry"
            onPress={() => {
              setActiveGalleryKey(null);
              router.push("/create-entry");
            }}
            size="md"
            style={styles.galleryDetailCreateButton}
          />
        </View>
      );
    }

    if (activeGalleryKey === "photos") {
      return (
        <View style={styles.galleryDetailBody}>
          <View style={styles.galleryDetailPhotoGrid}>
            {recentImageUris.slice(0, 4).map((imageUri) => (
              <Image
                key={`detail-${imageUri}`}
                source={{ uri: imageUri }}
                style={styles.galleryDetailPhoto}
                resizeMode="cover"
              />
            ))}
          </View>
          <Text style={[styles.galleryDetailMeta, { color: PAGE_MUTED }]}>
            {stats.totalImages} photo{stats.totalImages === 1 ? "" : "s"} across your entries
          </Text>
        </View>
      );
    }

    if (activeGalleryKey === "audio") {
      return (
        <View style={styles.galleryDetailBody}>
          <View style={styles.audioDetailVisual}>
            <View style={styles.audioDetailBars}>
              {[10, 18, 14, 22, 12, 20, 16, 22, 14, 18].map((height, index) => (
                <View
                  key={`detail-bar-${index}`}
                  style={[
                    styles.audioDetailBar,
                    {
                      height,
                      opacity: 0.5 + index * 0.04,
                    },
                  ]}
                />
              ))}
            </View>
            <MaterialCommunityIcons
              name="play-circle"
              size={34}
              color={PAGE_SECONDARY}
            />
          </View>
          <Text style={[styles.galleryDetailMeta, { color: PAGE_MUTED }]}>
            {stats.entriesWithAudio} voice note{stats.entriesWithAudio === 1 ? "" : "s"} in your archive
          </Text>
        </View>
      );
    }

    if (activeGalleryKey === "mood") {
      return (
        <View style={styles.galleryDetailBody}>
          <View style={styles.galleryDetailMoodWrap}>
            <Text style={styles.galleryDetailMoodEmoji}>{mostCommonMoodData?.emoji}</Text>
            <Text style={[styles.galleryDetailMoodLabel, { color: PAGE_TEXT }]}>
              {mostCommonMoodData?.label}
            </Text>
          </View>
          <Text style={[styles.galleryDetailMeta, { color: PAGE_MUTED }]}>
            This appears most often in your recent entries.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.galleryDetailBody}>
        <View style={styles.galleryDetailDrawerList}>
          {drawerFrequency.slice(0, 4).map((drawer) => (
            <View key={drawer.name} style={styles.galleryDetailDrawerRow}>
              <View style={styles.galleryDetailDrawerIconWrap}>
                <MaterialCommunityIcons
                  name={resolveDrawerIcon(drawer.icon)}
                  size={18}
                  color={PAGE_SECONDARY}
                />
              </View>
              <Text style={[styles.galleryDetailDrawerName, { color: PAGE_TEXT }]} numberOfLines={1}>
                {drawer.name}
              </Text>
              <Text style={[styles.galleryDetailDrawerCount, { color: PAGE_MUTED }]}>
                {drawer.count}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }, [
    activeGalleryKey,
    drawerFrequency,
    isGalleryItemEmpty,
    mostCommonMoodData,
    recentImageUris,
    resolveDrawerIcon,
    stats.entriesWithAudio,
    stats.totalImages,
  ]);

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
        <AppPageHeader onSearchPress={() => router.push("/search")} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.heroBlock}>
            <Text
              style={[
                styles.heroTitle,
                {
                  color: PAGE_TEXT,
                  fontFamily: theme.fonts.serif,
                },
              ]}
            >
              {hasArchiveContent ? (
                <>
                  Your Story Is{" "}
                  <Text style={{ color: PAGE_PRIMARY }}>Taking Shape</Text>
                </>
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
            <Card
              style={[
                styles.featureCard,
                { backgroundColor: PAGE_CARD_CREAM, borderColor: PAGE_CARD_BORDER },
              ]}
              variant="elevated"
            >
              <CardIconWrap style={styles.featureIconWrap}>
                <MaterialCommunityIcons
                  name="timer-sand"
                  size={24}
                  color={PAGE_SECONDARY}
                />
              </CardIconWrap>
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
            </Card>

            <Card
              style={[
                styles.featureCard,
                { backgroundColor: PAGE_CARD_CREAM, borderColor: PAGE_CARD_BORDER },
              ]}
              variant="elevated"
            >
              <CardIconWrap style={styles.featureIconWrap}>
                <MaterialCommunityIcons
                  name="star-four-points-outline"
                  size={24}
                  color={PAGE_SECONDARY}
                />
              </CardIconWrap>
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
            </Card>
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
                <Card
                  key={item.key}
                  style={[
                    styles.galleryTile,
                    { backgroundColor: PAGE_CARD_CREAM, borderColor: PAGE_CARD_BORDER },
                  ]}
                  variant="elevated"
                  onPress={() => setActiveGalleryKey(item.key)}
                  accessibilityLabel={`Open ${item.label} insights`}
                >
                  <View style={styles.galleryVisualSurface}>
                    {item.key === "photos" ? (
                      recentImageUris.length > 0 ? (
                        <View style={styles.photoCollageGrid}>
                          {[0, 1, 2, 3].map((slot) => {
                            const imageUri = recentImageUris[slot];
                            if (!imageUri) {
                              return (
                                <View
                                  key={`photo-slot-${slot}`}
                                  style={styles.photoCollagePlaceholder}
                                />
                              );
                            }

                            return (
                              <Image
                                key={imageUri}
                                source={{ uri: imageUri }}
                                style={styles.photoCollageImage}
                                resizeMode="cover"
                              />
                            );
                          })}
                        </View>
                      ) : (
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={28}
                          color={PAGE_SECONDARY}
                        />
                      )
                    ) : item.key === "audio" ? (
                      <View style={styles.audioVisual}>
                        <View style={styles.audioMetaRow}>
                          <View style={styles.audioBars}>
                            {[10, 18, 14, 22, 12, 20, 16].map((height, index) => (
                              <View
                                key={`bar-${index}`}
                                style={[
                                  styles.audioBar,
                                  {
                                    height,
                                    opacity: 0.55 + index * 0.06,
                                  },
                                ]}
                              />
                            ))}
                          </View>
                          <MaterialCommunityIcons
                            name="play-circle-outline"
                            size={24}
                            color={PAGE_SECONDARY}
                          />
                        </View>
                        <View style={styles.audioProgressTrack}>
                          <View style={styles.audioProgressFill} />
                        </View>
                      </View>
                    ) : item.key === "mood" ? (
                      mostCommonMoodData ? (
                        <View style={styles.moodVisual}>
                          <Text style={styles.moodEmoji}>
                            {mostCommonMoodData.emoji}
                          </Text>
                        </View>
                      ) : (
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={28}
                          color={PAGE_SECONDARY}
                        />
                      )
                    ) : item.key === "drawers" ? (
                      drawerFrequency[0] ? (
                        <View style={styles.drawerVisual}>
                          <View style={styles.drawerVisualIconWrap}>
                            <MaterialCommunityIcons
                              name={resolveDrawerIcon(drawerFrequency[0].icon)}
                              size={20}
                              color={PAGE_SECONDARY}
                            />
                          </View>
                          <Text style={styles.drawerVisualText} numberOfLines={1}>
                            {drawerFrequency[0].name}
                          </Text>
                        </View>
                      ) : (
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={28}
                          color={PAGE_SECONDARY}
                        />
                      )
                    ) : (
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={28}
                        color={PAGE_SECONDARY}
                      />
                    )}
                  </View>
                  <Text style={[styles.galleryLabel, { color: PAGE_TEXT }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.galleryValue, { color: PAGE_MUTED }]}>
                    {item.value}
                  </Text>
                </Card>
              ))}
            </View>
          </View>

          <Card
            style={[
              styles.snapshotCard,
              { backgroundColor: PAGE_CARD_CREAM, borderColor: PAGE_CARD_BORDER },
            ]}
            variant="elevated"
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
                ? `${stats.totalEntries} entries and ${stats.avgWordsPerEntry} average words are beginning to shape your archive.`
                : "Once you begin writing, this space will gently reflect your rhythms, themes, and returning moments."}
            </Text>
          </Card>

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

        <AppModalSheet
          visible={activeGalleryKey !== null}
          onClose={() => setActiveGalleryKey(null)}
        >
          {activeGalleryKey && (
            <View>
              <Text style={[styles.galleryDetailTitle, { color: PAGE_TEXT }]}>
                {GALLERY_DETAIL_TITLE_BY_KEY[activeGalleryKey]}
              </Text>
              {renderGalleryDetail()}
            </View>
          )}
        </AppModalSheet>

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
  content: {
    paddingHorizontal: 24,
    paddingTop: 6,
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
  },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#ECE6DB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  featureCopy: {
    flex: 1,
    paddingTop: 2,
  },
  featureTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "500",
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
    minHeight: 170,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  galleryVisualSurface: {
    width: "100%",
    minHeight: 84,
    borderRadius: 14,
    backgroundColor: "#F1ECE4",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  photoCollageGrid: {
    width: "100%",
    height: 84,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "space-between",
  },
  photoCollageImage: {
    width: "48%",
    height: "48%",
    borderRadius: 8,
    backgroundColor: "#E6E2D8",
  },
  photoCollagePlaceholder: {
    width: "48%",
    height: "48%",
    borderRadius: 8,
    backgroundColor: "#ECE6DB",
  },
  audioVisual: {
    width: "100%",
    justifyContent: "center",
    gap: 8,
  },
  audioMetaRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  audioBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    flex: 1,
    marginRight: 10,
  },
  audioBar: {
    width: 4,
    borderRadius: 999,
    backgroundColor: PAGE_PRIMARY,
  },
  audioProgressTrack: {
    width: "100%",
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E6E2D8",
    overflow: "hidden",
  },
  audioProgressFill: {
    width: "58%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: PAGE_PRIMARY,
  },
  moodVisual: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#ECE6DB",
    alignItems: "center",
    justifyContent: "center",
  },
  moodEmoji: {
    fontSize: 30,
    lineHeight: 34,
  },
  drawerVisual: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  drawerVisualIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E6E2D8",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerVisualText: {
    flex: 1,
    color: PAGE_SECONDARY,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "500",
  },
  galleryLabel: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
    textAlign: "left",
  },
  galleryValue: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "left",
  },
  galleryDetailTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600",
  },
  galleryDetailBody: {
    marginTop: 16,
  },
  galleryDetailPhotoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  galleryDetailPhoto: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#E6E2D8",
  },
  galleryDetailMeta: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 23,
  },
  audioDetailVisual: {
    width: "100%",
    borderRadius: 14,
    backgroundColor: "#F1ECE4",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  audioDetailBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    flex: 1,
    marginRight: 12,
  },
  audioDetailBar: {
    width: 5,
    borderRadius: 999,
    backgroundColor: PAGE_PRIMARY,
  },
  galleryDetailMoodWrap: {
    borderRadius: 14,
    backgroundColor: "#F1ECE4",
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  galleryDetailMoodEmoji: {
    fontSize: 34,
    lineHeight: 38,
  },
  galleryDetailMoodLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
  },
  galleryDetailDrawerList: {
    gap: 10,
  },
  galleryDetailDrawerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#F1ECE4",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  galleryDetailDrawerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#E6E2D8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  galleryDetailDrawerName: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  },
  galleryDetailDrawerCount: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  galleryDetailEmptyWrap: {
    marginTop: 14,
  },
  galleryDetailEmptyTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
  },
  galleryDetailEmptyBody: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 24,
  },
  galleryDetailCreateButton: {
    marginTop: 18,
  },
  snapshotCard: {
    marginBottom: 28,
  },
  snapshotTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "500",
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
