import { AppBottomNav, AppPageHeader, SafeArea, Screen } from "@components/layout";
import { AppModalSheet, Button, SectionHeader } from "@components/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCreateTag } from "@features/tags/hooks/useCreateTag";
import { useTags } from "@features/tags/hooks/useTags";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@styles/theme";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
  const { createTag, isLoading: isCreatingTag } = useCreateTag();
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const tagCardVisualStyle = {
    backgroundColor: PAGE_SURFACE,
    shadowColor: PAGE_TEXT,
  } as const;
  const modalSheetContentStyle = {
    ...styles.modalContent,
    backgroundColor: PAGE_SURFACE,
  };

  const handleCreateTag = useCallback(() => {
    setNewTagName("");
    setIsCreateTagOpen(true);
  }, []);

  const closeCreateTagModal = useCallback(() => {
    setIsCreateTagOpen(false);
    setNewTagName("");
  }, []);

  const handleSaveTag = useCallback(async () => {
    const trimmedName = newTagName.trim();

    if (!trimmedName) {
      Alert.alert("Name required", "Please enter a name for your tag.");
      return;
    }

    const created = await createTag({ name: trimmedName });

    if (!created) {
      Alert.alert("Unable to create tag", "Please try a different name.");
      return;
    }

    setIsCreateTagOpen(false);
    setNewTagName("");
    await fetchTags();
  }, [createTag, fetchTags, newTagName]);

  useFocusEffect(
    useCallback(() => {
      fetchTags();
    }, [fetchTags]),
  );

  return (
    <SafeArea>
      <Screen style={[styles.container, { backgroundColor: PAGE_BACKGROUND }]}>
        <AppPageHeader />

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

                <SectionHeader
                  label={tags.length > 0 ? "Your Tags" : "Example Tags"}
                  textColor={PAGE_MUTED}
                  dividerColor={theme.colors.accent1}
                />
              </>
            }
            ListEmptyComponent={
              <>
                {EXAMPLE_TAGS.map((tag, index) => (
                  <View
                    key={tag}
                    style={[
                      styles.card,
                      tagCardVisualStyle,
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
                    Tags help you connect moments across drawers, so related memories stay easy to revisit
                  </Text>
                </View>
              </>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.card,
                  tagCardVisualStyle,
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
                    Tags help you connect moments across drawers, so related memories stay easy to revisit.
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        <AppBottomNav currentRoute="/tags" />

        <AppModalSheet
          visible={isCreateTagOpen}
          onClose={closeCreateTagModal}
          contentStyle={modalSheetContentStyle}
        >
          <View style={styles.modalHeader}>
            <Text
              style={[
                styles.modalTitle,
                { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
              ]}
            >
              Create Tag
            </Text>
            <TouchableOpacity
              onPress={closeCreateTagModal}
              style={styles.modalCloseButton}
              accessibilityRole="button"
              accessibilityLabel="Close create tag"
            >
              <MaterialCommunityIcons name="close" size={28} color={PAGE_BORDER} />
            </TouchableOpacity>
          </View>

          <Text style={[theme.typography.body, styles.modalSubtitle, { color: PAGE_MUTED }]}>
            Add a short keyword to connect related entries.
          </Text>

          <Text style={[theme.typography.labelSm, styles.modalFieldLabel, { color: PAGE_TEXT }]}>
            TAG NAME
          </Text>
          <TextInput
            value={newTagName}
            onChangeText={setNewTagName}
            placeholder="e.g. gratitude"
            placeholderTextColor={PAGE_MUTED}
            style={[
                styles.modalInput,
                {
                  backgroundColor: "#F8F6F2",
                  color: PAGE_TEXT,
                  shadowColor: PAGE_TEXT,
                },
            ]}
            autoCapitalize="none"
            accessibilityLabel="Tag name input"
          />

          <View style={styles.modalActions}>
            <Button
              label="Cancel"
              onPress={closeCreateTagModal}
              variant="outline"
              style={[
                styles.modalSecondaryButton,
                { borderRadius: 999, borderColor: PAGE_BORDER },
              ]}
              textStyle={{ color: PAGE_SECONDARY, fontWeight: "700" }}
            />
            <Button
              label={isCreatingTag ? "Creating..." : "Create"}
              onPress={handleSaveTag}
              disabled={isCreatingTag}
              variant="primary"
              style={[
                styles.modalPrimaryButton,
                { borderRadius: 999, backgroundColor: PAGE_SECONDARY },
              ]}
              textStyle={{ color: "#FFFFFF", fontWeight: "700" }}
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
  modalContent: {
    borderRadius: 28,
    backgroundColor: PAGE_SURFACE,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "400",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubtitle: {
    lineHeight: 22,
    marginBottom: 16,
  },
  modalFieldLabel: {
    letterSpacing: 2.2,
    marginBottom: 8,
  },
  modalInput: {
    minHeight: 62,
    borderRadius: 18,
    paddingHorizontal: 18,
    fontSize: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalSecondaryButton: {
    flex: 1,
    minHeight: 52,
    backgroundColor: PAGE_SURFACE,
  },
  modalPrimaryButton: {
    flex: 1,
    minHeight: 52,
  },
});
