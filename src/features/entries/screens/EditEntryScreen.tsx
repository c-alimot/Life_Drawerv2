import { SafeArea, Screen } from "@components/layout";
import { Button } from "@components/ui";
import { MOOD_MAP, MOOD_VALUES } from "@constants/moods";
import { useCreateDrawer } from "@features/drawers/hooks/useCreateDrawer";
import { useDrawers } from "@features/drawers/hooks/useDrawers";
import { useCreateTag } from "@features/tags/hooks/useCreateTag";
import { useTags } from "@features/tags/hooks/useTags";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@styles/theme";
import type { MoodValue } from "@types";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { z } from "zod";
import { useEditEntry } from "../hooks/useEditEntry";
import { useEntryDetail } from "../hooks/useEntryDetail";

const editEntrySchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  mood: z
    .enum([
      "happy",
      "calm",
      "inspired",
      "grateful",
      "anxious",
      "stressed",
      "angry",
      "sad",
      "tired",
      "bored",
      "meh",
    ])
    .optional(),
});

type EditEntryFormData = z.infer<typeof editEntrySchema>;

const MAX_IMAGES = 10;

export function EditEntryScreen() {
  const theme = useTheme();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const entryIdValue = Array.isArray(entryId) ? entryId[0] : entryId;
  const resolvedEntryId = entryIdValue ?? "";

  const {
    entry,
    isLoading: entryLoading,
    fetchEntry,
  } = useEntryDetail(resolvedEntryId);
  const { isLoading: updateLoading, updateEntry, error: updateError } =
    useEditEntry(resolvedEntryId);
  const { drawers, fetchDrawers } = useDrawers();
  const { tags, fetchTags } = useTags();
  const { createDrawer } = useCreateDrawer();
  const { createTag } = useCreateTag();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EditEntryFormData>({
    resolver: zodResolver(editEntrySchema),
    defaultValues: {
      title: "",
      content: "",
      mood: undefined,
    },
  });

  const [newImageUris, setNewImageUris] = useState<string[]>([]);
  const [removedImageUris, setRemovedImageUris] = useState<string[]>([]);
  const [selectedDrawers, setSelectedDrawers] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showDrawerModal, setShowDrawerModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [newDrawerName, setNewDrawerName] = useState("");
  const [newTagName, setNewTagName] = useState("");

  const mood = watch("mood");

  // Initialize
  useFocusEffect(
    useCallback(() => {
      fetchEntry();
      fetchDrawers();
      fetchTags();
    }, [fetchEntry, fetchDrawers, fetchTags]),
  );

  // Populate form with entry data
  useEffect(() => {
    if (entry) {
      setValue("title", entry.title);
      setValue("content", entry.content);
      if (entry.mood) {
        setValue("mood", entry.mood as MoodValue);
      }
      setSelectedDrawers(entry.drawers?.map((d) => d.id) || []);
      setSelectedTags(entry.tags?.map((t) => t.id) || []);
    }
  }, [entry, setValue]);

  // Image picker
  const pickImages = useCallback(async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission denied",
          "Please enable camera roll access in settings",
        );
        return;
      }

      const availableSlots =
        MAX_IMAGES - (entry?.images?.length || 0) - newImageUris.length;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        selectionLimit: availableSlots,
      });

      if (!result.canceled) {
        const uris = result.assets.map((asset: ImagePicker.ImagePickerAsset) => asset.uri);
        setNewImageUris((prev) => [...prev, ...uris]);
      }
    } catch {
      Alert.alert("Error", "Failed to pick images");
    }
  }, [entry?.images, newImageUris.length]);

  const takePhoto = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission denied",
          "Please enable camera access in settings",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled) {
        const photoUri = result.assets[0].uri;
        setNewImageUris((prev) => [...prev, photoUri]);
      }
    } catch {
      Alert.alert("Error", "Failed to take photo");
    }
  }, []);

  const removeNewImage = useCallback((index: number) => {
    setNewImageUris((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeExistingImage = useCallback((imageUri: string) => {
    Alert.alert("Remove Image", "This image will be removed when you save.", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Remove",
        onPress: () => {
          setRemovedImageUris((prev) => [...prev, imageUri]);
        },
        style: "destructive",
      },
    ]);
  }, []);

  // Drawer management
  const handleAddDrawer = useCallback(async () => {
    if (!newDrawerName.trim()) {
      Alert.alert("Error", "Please enter a drawer name");
      return;
    }

    const result = await createDrawer({ name: newDrawerName });
    if (result) {
      setSelectedDrawers((prev) => [...prev, result.id]);
      setNewDrawerName("");
      fetchDrawers();
    }
  }, [newDrawerName, createDrawer, fetchDrawers]);

  const toggleDrawer = useCallback((drawerId: string) => {
    setSelectedDrawers((prev) =>
      prev.includes(drawerId)
        ? prev.filter((id) => id !== drawerId)
        : [...prev, drawerId],
    );
  }, []);

  // Tag management
  const handleAddTag = useCallback(async () => {
    if (!newTagName.trim()) {
      Alert.alert("Error", "Please enter a tag name");
      return;
    }

    const result = await createTag({ name: newTagName });
    if (result) {
      setSelectedTags((prev) => [...prev, result.id]);
      setNewTagName("");
      fetchTags();
    }
  }, [newTagName, createTag, fetchTags]);

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  }, []);

  // Submit
  const onSubmit = async (data: EditEntryFormData) => {
    if (!entry) {
      return;
    }

    const persistedImages = entry.images.filter(
      (imageUri) => !removedImageUris.includes(imageUri),
    );

    const result = await updateEntry({
      title: data.title,
      content: data.content,
      mood: data.mood,
      drawerIds: selectedDrawers,
      tagIds: selectedTags,
      imageUris: [...persistedImages, ...newImageUris],
      audioUrl: entry.audioUrl || null,
      location: entry.location || null,
      lifePhaseId: entry.lifePhaseId || null,
      occurredAt: entry.occurredAt || null,
    });

    if (result) {
      Alert.alert("Success", "Entry updated successfully");
      router.back();
    } else {
      Alert.alert("Error", updateError?.message || "Failed to update entry");
    }
  };

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const visibleExistingImages =
    entry?.images.filter((imageUri) => !removedImageUris.includes(imageUri)) ||
    [];
  const totalImages = visibleExistingImages.length + newImageUris.length;

  if (entryLoading) {
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

  return (
    <SafeArea>
      <Screen style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            accessible
            accessibilityLabel="Go back"
          >
            <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
              ←
            </Text>
          </TouchableOpacity>
          <Button
            label={updateLoading ? "Saving..." : "Save"}
            onPress={handleSubmit(onSubmit)}
            disabled={updateLoading}
            size="sm"
            accessibilityLabel="Save changes"
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Title */}
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  theme.typography.h2,
                  {
                    color: theme.colors.text,
                    marginBottom: theme.spacing.md,
                  },
                ]}
                placeholder="Entry title"
                placeholderTextColor={theme.colors.textSecondary}
                value={value}
                onChangeText={onChange}
                accessibilityLabel="Entry title"
              />
            )}
          />

          {errors.title && (
            <Text
              style={[theme.typography.bodySm, { color: theme.colors.error }]}
            >
              {errors.title.message}
            </Text>
          )}

          {/* Date (read-only) */}
          <Text
            style={[
              theme.typography.body,
              {
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            {new Date(entry.createdAt).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>

          {/* Media Toolbar */}
          <View style={styles.toolbar}>
            {/* Tags */}
            <TouchableOpacity
              style={[
                styles.toolbarButton,
                {
                  borderColor:
                    selectedTags.length > 0
                      ? theme.colors.primary
                      : theme.colors.border,
                },
              ]}
              onPress={() => setShowTagModal(true)}
              accessible
              accessibilityLabel="Manage tags"
              accessibilityHint={`${selectedTags.length} tags selected`}
              accessibilityRole="button"
            >
              <Text style={styles.toolbarIcon}>🏷️</Text>
            </TouchableOpacity>

            {/* Drawers */}
            <TouchableOpacity
              style={[
                styles.toolbarButton,
                {
                  borderColor:
                    selectedDrawers.length > 0
                      ? theme.colors.primary
                      : theme.colors.border,
                },
              ]}
              onPress={() => setShowDrawerModal(true)}
              accessible
              accessibilityLabel="Manage drawers"
              accessibilityHint={`${selectedDrawers.length} drawers selected`}
              accessibilityRole="button"
            >
              <Text style={styles.toolbarIcon}>📁</Text>
            </TouchableOpacity>

            {/* Images */}
            <TouchableOpacity
              style={[
                styles.toolbarButton,
                {
                  borderColor:
                    totalImages > 0
                      ? theme.colors.primary
                      : theme.colors.border,
                },
              ]}
              onPress={pickImages}
              disabled={totalImages >= MAX_IMAGES}
              accessible
              accessibilityLabel="Add images"
              accessibilityHint={`${totalImages}/${MAX_IMAGES} images`}
              accessibilityRole="button"
            >
              <Text style={styles.toolbarIcon}>🖼️</Text>
            </TouchableOpacity>

            {/* Camera */}
            <TouchableOpacity
              style={[
                styles.toolbarButton,
                { borderColor: theme.colors.border },
              ]}
              onPress={takePhoto}
              disabled={totalImages >= MAX_IMAGES}
              accessible
              accessibilityLabel="Take photo"
              accessibilityRole="button"
            >
              <Text style={styles.toolbarIcon}>📷</Text>
            </TouchableOpacity>

            {/* Mood */}
            <TouchableOpacity
              style={[
                styles.toolbarButton,
                {
                  borderColor: mood
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
              onPress={() => setShowMoodPicker(true)}
              accessible
              accessibilityLabel="Change mood"
              accessibilityHint={
                mood ? `Mood: ${MOOD_MAP[mood]?.label}` : "Select a mood"
              }
              accessibilityRole="button"
            >
              <Text style={styles.toolbarIcon}>
                {mood ? MOOD_MAP[mood]?.emoji : "😊"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Existing Images */}
          {visibleExistingImages.length > 0 && (
            <View style={{ marginBottom: theme.spacing.lg }}>
              <Text
                style={[
                  theme.typography.labelSm,
                  {
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.md,
                  },
                ]}
              >
                Existing Images
              </Text>
              <FlatList
                data={visibleExistingImages}
                keyExtractor={(_, index) => `existing-image-${index}`}
                horizontal
                scrollEnabled
                showsHorizontalScrollIndicator={false}
                renderItem={({ item: imageUri }) => (
                  <View style={styles.imageWrapper}>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.image}
                      accessible
                      accessibilityLabel="Existing image"
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeExistingImage(imageUri)}
                      accessible
                      accessibilityLabel="Remove image"
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}

          {/* New Images */}
          {newImageUris.length > 0 && (
            <View style={{ marginBottom: theme.spacing.lg }}>
              <Text
                style={[
                  theme.typography.labelSm,
                  {
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.md,
                  },
                ]}
              >
                New Images
              </Text>
              <FlatList
                data={newImageUris}
                keyExtractor={(_, index) => `new-image-${index}`}
                horizontal
                scrollEnabled
                showsHorizontalScrollIndicator={false}
                renderItem={({ item: imageUri, index }) => (
                  <View style={styles.imageWrapper}>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.image}
                      accessible
                      accessibilityLabel={`New image ${index + 1}`}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeNewImage(index)}
                      accessible
                      accessibilityLabel="Remove image"
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}

          {/* Content */}
          <Controller
            control={control}
            name="content"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  styles.contentInput,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="Edit entry content..."
                placeholderTextColor={theme.colors.textSecondary}
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={12}
                textAlignVertical="top"
                accessibilityLabel="Entry content"
              />
            )}
          />

          {errors.content && (
            <Text
              style={[theme.typography.bodySm, { color: theme.colors.error }]}
            >
              {errors.content.message}
            </Text>
          )}
        </ScrollView>

        {/* Mood Picker Modal */}
        <Modal
          visible={showMoodPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMoodPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowMoodPicker(false)}
            activeOpacity={1}
          >
            <View
              style={[
                styles.moodPicker,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Text
                style={[
                  theme.typography.h3,
                  { color: theme.colors.text, marginBottom: theme.spacing.md },
                ]}
              >
                How are you feeling?
              </Text>
              <View style={styles.moodGrid}>
                {MOOD_VALUES.map((moodValue) => {
                  const moodData = MOOD_MAP[moodValue];
                  return (
                    <TouchableOpacity
                      key={moodValue}
                      style={[
                        styles.moodOption,
                        {
                          backgroundColor:
                            mood === moodValue
                              ? theme.colors.primary + "20"
                              : "transparent",
                          borderColor:
                            mood === moodValue
                              ? theme.colors.primary
                              : theme.colors.border,
                        },
                      ]}
                      onPress={() => {
                        setValue("mood", moodValue);
                        setShowMoodPicker(false);
                      }}
                      accessible
                      accessibilityLabel={`Select mood: ${moodData.label}`}
                      accessibilityRole="button"
                    >
                      <Text style={styles.moodText}>{moodData.emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Drawer Modal */}
        <Modal
          visible={showDrawerModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDrawerModal(false)}
        >
          <SafeArea>
            <Screen
              style={[
                styles.modalContainer,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text
                  style={[theme.typography.h2, { color: theme.colors.text }]}
                >
                  Select Drawers
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDrawerModal(false)}
                  accessible
                  accessibilityLabel="Close"
                >
                  <Text
                    style={[theme.typography.h3, { color: theme.colors.text }]}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalContent}
              >
                {/* Create New Drawer */}
                <View style={{ marginBottom: theme.spacing.lg }}>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                          flex: 1,
                        },
                      ]}
                      placeholder="New drawer name"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={newDrawerName}
                      onChangeText={setNewDrawerName}
                      accessibilityLabel="New drawer name"
                    />
                    <Button
                      label="Add"
                      onPress={handleAddDrawer}
                      size="sm"
                      disabled={!newDrawerName.trim()}
                      accessibilityLabel="Create drawer"
                    />
                  </View>
                </View>

                {/* Existing Drawers */}
                {drawers.map((drawer) => (
                  <TouchableOpacity
                    key={drawer.id}
                    style={[
                      styles.modalItem,
                      {
                        borderColor: selectedDrawers.includes(drawer.id)
                          ? theme.colors.primary
                          : theme.colors.border,
                        backgroundColor: selectedDrawers.includes(drawer.id)
                          ? theme.colors.primary + "10"
                          : "transparent",
                      },
                    ]}
                    onPress={() => toggleDrawer(drawer.id)}
                    accessible
                    accessibilityLabel={`Drawer: ${drawer.name}`}
                    accessibilityHint={
                      selectedDrawers.includes(drawer.id)
                        ? "Selected"
                        : "Not selected"
                    }
                    accessibilityRole="checkbox"
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: selectedDrawers.includes(drawer.id)
                            ? theme.colors.primary
                            : "transparent",
                          borderColor: selectedDrawers.includes(drawer.id)
                            ? theme.colors.primary
                            : theme.colors.border,
                        },
                      ]}
                    >
                      {selectedDrawers.includes(drawer.id) && (
                        <Text style={{ color: theme.colors.background }}>
                          ✓
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        theme.typography.body,
                        { color: theme.colors.text },
                      ]}
                    >
                      {drawer.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Screen>
          </SafeArea>
        </Modal>

        {/* Tag Modal */}
        <Modal
          visible={showTagModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTagModal(false)}
        >
          <SafeArea>
            <Screen
              style={[
                styles.modalContainer,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text
                  style={[theme.typography.h2, { color: theme.colors.text }]}
                >
                  Select Tags
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTagModal(false)}
                  accessible
                  accessibilityLabel="Close"
                >
                  <Text
                    style={[theme.typography.h3, { color: theme.colors.text }]}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalContent}
              >
                {/* Create New Tag */}
                <View style={{ marginBottom: theme.spacing.lg }}>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                          flex: 1,
                        },
                      ]}
                      placeholder="New tag name"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={newTagName}
                      onChangeText={setNewTagName}
                      accessibilityLabel="New tag name"
                    />
                    <Button
                      label="Add"
                      onPress={handleAddTag}
                      size="sm"
                      disabled={!newTagName.trim()}
                      accessibilityLabel="Create tag"
                    />
                  </View>
                </View>

                {/* Existing Tags */}
                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.modalItem,
                      {
                        borderColor: selectedTags.includes(tag.id)
                          ? theme.colors.primary
                          : theme.colors.border,
                        backgroundColor: selectedTags.includes(tag.id)
                          ? theme.colors.primary + "10"
                          : "transparent",
                      },
                    ]}
                    onPress={() => toggleTag(tag.id)}
                    accessible
                    accessibilityLabel={`Tag: ${tag.name}`}
                    accessibilityHint={
                      selectedTags.includes(tag.id)
                        ? "Selected"
                        : "Not selected"
                    }
                    accessibilityRole="checkbox"
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: selectedTags.includes(tag.id)
                            ? theme.colors.primary
                            : "transparent",
                          borderColor: selectedTags.includes(tag.id)
                            ? theme.colors.primary
                            : theme.colors.border,
                        },
                      ]}
                    >
                      {selectedTags.includes(tag.id) && (
                        <Text style={{ color: theme.colors.background }}>
                          ✓
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        theme.typography.body,
                        { color: theme.colors.text },
                      ]}
                    >
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Screen>
          </SafeArea>
        </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
    marginTop: 12,
  },
  toolbarButton: {
    width: "22%",
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  toolbarIcon: {
    fontSize: 24,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 200,
    marginTop: 12,
  },
  imageWrapper: {
    position: "relative",
    marginRight: 12,
    marginBottom: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  moodPicker: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  moodOption: {
    width: "22%",
    aspectRatio: 1,
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  moodText: {
    fontSize: 28,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 40,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: "System",
    fontSize: 14,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
