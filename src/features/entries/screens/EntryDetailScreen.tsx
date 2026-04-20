import { AppPageHeader, SafeArea, Screen } from "@components/layout";
import { Button } from "@components/ui";
import { ENTRY_PREVIEW_PILLS, sanitizeEntryPreviewLabel } from "@constants/entryPreviewPills";
import { MOOD_MAP } from "@constants/moods";
import { MaterialCommunityIcons } from "@components/ui/icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@styles/theme";
import type { MoodValue } from "@types";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { useEntryDetail } from "../hooks/useEntryDetail";

type TabType = "content" | "media" | "details";

export function EntryDetailScreen() {
  const theme = useTheme();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const entryIdValue = Array.isArray(entryId) ? entryId[0] : entryId;
  const resolvedEntryId = entryIdValue ?? "";
  const { entry, isLoading, fetchEntry, deleteEntry, unlinkDrawer, unlinkTag } =
    useEntryDetail(resolvedEntryId);
  const { isPlaying, duration, position, play } = useAudioPlayer(
    entry?.audioUrl || null,
  );

  const [activeTab, setActiveTab] = useState<TabType>("content");

  useFocusEffect(
    useCallback(() => {
      fetchEntry();
    }, [fetchEntry]),
  );

  const handleEdit = useCallback(() => {
    router.push(`/edit-entry/${resolvedEntryId}`);
  }, [resolvedEntryId]);

  const handleDelete = useCallback(() => {
    Alert.alert("Delete Entry", "Are you sure you want to delete this entry?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Delete",
        onPress: async () => {
          const success = await deleteEntry();
          if (success) {
            Alert.alert("Success", "Entry deleted");
            router.back();
          } else {
            Alert.alert("Error", "Failed to delete entry");
          }
        },
        style: "destructive",
      },
    ]);
  }, [deleteEntry]);

  const handleRemoveDrawer = useCallback(
    (drawerId: string) => {
      Alert.alert("Remove Drawer", "Remove this entry from this drawer?", [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Remove",
          onPress: async () => {
            await unlinkDrawer(drawerId);
          },
          style: "destructive",
        },
      ]);
    },
    [unlinkDrawer],
  );

  const handleRemoveTag = useCallback(
    (tagId: string) => {
      Alert.alert("Remove Tag", "Remove this tag from the entry?", [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Remove",
          onPress: async () => {
            await unlinkTag(tagId);
          },
          style: "destructive",
        },
      ]);
    },
    [unlinkTag],
  );

  if (isLoading) {
    return (
      <SafeArea>
        <Screen style={styles.container}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </Screen>
      </SafeArea>
    );
  }

  if (!entry) {
    return (
      <SafeArea>
        <Screen style={styles.container}>
          <View style={styles.loaderContainer}>
            <Text style={[theme.typography.body, { color: theme.colors.text }]}>
              Entry not found
            </Text>
          </View>
        </Screen>
      </SafeArea>
    );
  }

  const formattedDate = new Date(entry.createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <SafeArea>
      <Screen style={styles.container}>
        <AppPageHeader
          showBack
          showSearch={false}
          rightSlot={
            <View style={styles.headerActions}>
              <Button
                label="Edit"
                onPress={handleEdit}
                size="sm"
                accessibilityLabel="Edit entry"
              />
              <TouchableOpacity
                onPress={handleDelete}
                accessible
                accessibilityLabel="Delete entry"
                style={styles.deleteButton}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={22}
                  color={theme.colors.error}
                />
              </TouchableOpacity>
            </View>
          }
        />

        {/* Tab Navigation */}
        <View
          style={[styles.tabBar, { borderBottomColor: theme.colors.border }]}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("content")}
            style={[
              styles.tabButton,
              {
                borderBottomColor:
                  activeTab === "content"
                    ? theme.colors.primary
                    : "transparent",
              },
            ]}
            accessible
            accessibilityLabel="Content tab"
            accessibilityRole="tab"
          >
            <Text
              style={[
                theme.typography.body,
                {
                  color:
                    activeTab === "content"
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                  fontWeight: activeTab === "content" ? "600" : "400",
                },
              ]}
            >
              Content
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("media")}
            style={[
              styles.tabButton,
              {
                borderBottomColor:
                  activeTab === "media" ? theme.colors.primary : "transparent",
              },
            ]}
            accessible
            accessibilityLabel="Media tab"
            accessibilityRole="tab"
          >
            <Text
              style={[
                theme.typography.body,
                {
                  color:
                    activeTab === "media"
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                  fontWeight: activeTab === "media" ? "600" : "400",
                },
              ]}
            >
              Media
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("details")}
            style={[
              styles.tabButton,
              {
                borderBottomColor:
                  activeTab === "details"
                    ? theme.colors.primary
                    : "transparent",
              },
            ]}
            accessible
            accessibilityLabel="Details tab"
            accessibilityRole="tab"
          >
            <Text
              style={[
                theme.typography.body,
                {
                  color:
                    activeTab === "details"
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                  fontWeight: activeTab === "details" ? "600" : "400",
                },
              ]}
            >
              Details
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Content Tab */}
          {activeTab === "content" && (
            <View>
              <Text
                style={[
                  theme.typography.h2,
                  { color: theme.colors.text, marginBottom: theme.spacing.sm },
                ]}
              >
                {entry.title}
              </Text>

              <Text
                style={[
                  theme.typography.bodySm,
                  {
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.lg,
                  },
                ]}
              >
                {formattedDate}
              </Text>

              {entry.mood && (
                <View style={[styles.moodRow, { marginBottom: theme.spacing.lg }]}>
                  <Text style={[styles.moodEmoji, { marginRight: theme.spacing.sm }]}>
                    {MOOD_MAP[entry.mood as MoodValue]?.emoji}
                  </Text>
                  <Text
                    style={[
                      theme.typography.body,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {MOOD_MAP[entry.mood as MoodValue]?.label}
                  </Text>
                </View>
              )}

              <Text
                style={[
                  theme.typography.body,
                  {
                    color: theme.colors.text,
                    lineHeight: 24,
                  },
                ]}
              >
                {entry.content}
              </Text>
            </View>
          )}

          {/* Media Tab */}
          {activeTab === "media" && (
            <View>
              {/* Images */}
              {entry.images && entry.images.length > 0 && (
                <View style={[styles.sectionBlock, { marginBottom: theme.spacing.xl }]}>
                  <Text
                    style={[
                      theme.typography.h3,
                      {
                        color: theme.colors.text,
                        marginBottom: theme.spacing.md,
                      },
                    ]}
                  >
                    Images
                  </Text>
                  <FlatList
                    data={entry.images}
                    keyExtractor={(_, index) => `image-${index}`}
                    horizontal
                    scrollEnabled
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item: imageUri }) => (
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.detailImage}
                        accessible
                        accessibilityLabel="Entry image"
                      />
                    )}
                  />
                </View>
              )}

              {/* Audio */}
              {entry.audioUrl && (
                <View style={[styles.sectionBlock, { marginBottom: theme.spacing.xl }]}>
                  <Text
                    style={[
                      theme.typography.h3,
                      {
                        color: theme.colors.text,
                        marginBottom: theme.spacing.md,
                      },
                    ]}
                  >
                    Voice Memo
                  </Text>
                  <View
                    style={[
                      styles.audioPlayer,
                      { borderColor: theme.colors.border },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={play}
                      style={[
                        styles.playButton,
                        { backgroundColor: theme.colors.primary },
                      ]}
                      accessible
                      accessibilityLabel={
                        isPlaying ? "Pause audio" : "Play audio"
                      }
                      accessibilityRole="button"
                    >
                      <Text style={styles.playButtonText}>
                        {isPlaying ? "⏸️" : "▶️"}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.audioInfo}>
                      <View
                        style={[
                          styles.progressBar,
                          { backgroundColor: theme.colors.gray[200] },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            {
                              backgroundColor: theme.colors.primary,
                              width: `${progressPercent}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          theme.typography.bodySm,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {Math.floor(position / 1000)}s /{" "}
                        {Math.floor(duration / 1000)}s
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Details Tab */}
          {activeTab === "details" && (
            <View>
              {/* Location */}
              {entry.location && (
                <View style={[styles.sectionBlock, { marginBottom: theme.spacing.lg }]}>
                  <Text
                    style={[
                      theme.typography.labelSm,
                      styles.sectionLabel,
                      { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
                    ]}
                  >
                    Location
                  </Text>
                  <Text
                    style={[
                      theme.typography.body,
                      { color: theme.colors.text },
                    ]}
                  >
                    📍 {entry.location.address || "Location unavailable"}
                  </Text>
                </View>
              )}

              {/* Drawers */}
              {entry.drawers && entry.drawers.length > 0 && (
                <View style={[styles.sectionBlock, { marginBottom: theme.spacing.lg }]}>
                  <Text
                    style={[
                      theme.typography.labelSm,
                      styles.sectionLabel,
                      { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
                    ]}
                  >
                    Drawers
                  </Text>
                  <View style={styles.badgeRow}>
                    {entry.drawers.map((drawer) => (
                      <TouchableOpacity
                        key={drawer.id}
                        style={[
                          styles.tagBadge,
                          {
                            backgroundColor: "#E6E2D8",
                            borderColor: "#556950",
                          },
                        ]}
                        onLongPress={() => handleRemoveDrawer(drawer.id)}
                        accessible
                        accessibilityLabel={`Drawer: ${drawer.name}`}
                        accessibilityHint="Long press to remove"
                      >
                        <Text
                          style={[
                            theme.typography.bodySm,
                            { color: "#556950", fontWeight: "500" },
                          ]}
                        >
                          {sanitizeEntryPreviewLabel(drawer.name)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Tags */}
              {entry.tags && entry.tags.length > 0 && (
                <View style={[styles.sectionBlock, { marginBottom: theme.spacing.lg }]}>
                  <Text
                    style={[
                      theme.typography.labelSm,
                      styles.sectionLabel,
                      { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
                    ]}
                  >
                    Tags
                  </Text>
                  <View style={styles.badgeRow}>
                    {entry.tags.map((tag) => (
                      <TouchableOpacity
                        key={tag.id}
                        style={[
                          styles.tagBadge,
                          {
                            backgroundColor: ENTRY_PREVIEW_PILLS.tagBackground,
                            borderColor: ENTRY_PREVIEW_PILLS.tagBorder,
                          },
                        ]}
                        onLongPress={() => handleRemoveTag(tag.id)}
                        accessible
                        accessibilityLabel={`Tag: ${tag.name}`}
                        accessibilityHint="Long press to remove"
                      >
                        <Text
                          style={[
                            theme.typography.bodySm,
                            {
                              color: ENTRY_PREVIEW_PILLS.tagText,
                              fontWeight: "400",
                            },
                          ]}
                        >
                          {sanitizeEntryPreviewLabel(tag.name)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Author */}
              {entry.author && (
                <View style={[styles.sectionBlock, { marginBottom: theme.spacing.lg }]}>
                  <Text
                    style={[
                      theme.typography.labelSm,
                      styles.sectionLabel,
                      { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
                    ]}
                  >
                    Author
                  </Text>
                  <Text
                    style={[
                      theme.typography.body,
                      { color: theme.colors.text },
                    ]}
                  >
                    {entry.author.displayName || entry.author.email}
                  </Text>
                </View>
              )}

              {/* Created/Updated */}
              <View>
                <Text
                  style={[
                    theme.typography.labelSm,
                    styles.sectionLabel,
                    { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
                  ]}
                >
                  Dates
                </Text>
                <Text
                  style={[
                    theme.typography.bodySm,
                    {
                      color: theme.colors.textSecondary,
                      marginBottom: theme.spacing.xs,
                    },
                  ]}
                >
                  Created: {new Date(entry.createdAt).toLocaleString()}
                </Text>
                <Text
                  style={[
                    theme.typography.bodySm,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Updated: {new Date(entry.updatedAt).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </Screen>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 3,
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  detailImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginRight: 12,
  },
  audioPlayer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  playButtonText: {
    fontSize: 24,
  },
  audioInfo: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  moodRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  moodEmoji: {
    fontSize: 24,
  },
  sectionBlock: {
    width: "100%",
  },
  sectionLabel: {
    textTransform: "uppercase",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
});
