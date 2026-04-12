import { SafeArea, Screen } from "@components/layout";
import {
  Button,
  EntryImageStrip,
  EntryMediaToolbar,
  type EntryMediaToolbarButton,
  EntryMoodPickerModal,
  EntrySelectionModal,
} from "@components/ui";
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
  const entryPalette = {
    background: theme.colors.background,
    surface: theme.colors.background,
    text: theme.colors.text,
    muted: theme.colors.textSecondary,
    primary: theme.colors.primary,
    border: theme.colors.border,
    inverseText: theme.colors.background,
  };
  const toolbarButtons: EntryMediaToolbarButton[] = [
    {
      key: "tags",
      borderColor: selectedTags.length > 0 ? theme.colors.primary : theme.colors.border,
      onPress: () => setShowTagModal(true),
      accessibilityLabel: "Manage tags",
      accessibilityHint: `${selectedTags.length} tags selected`,
      content: <Text style={styles.toolbarIcon}>🏷️</Text>,
    },
    {
      key: "drawers",
      borderColor: selectedDrawers.length > 0 ? theme.colors.primary : theme.colors.border,
      onPress: () => setShowDrawerModal(true),
      accessibilityLabel: "Manage drawers",
      accessibilityHint: `${selectedDrawers.length} drawers selected`,
      content: <Text style={styles.toolbarIcon}>📁</Text>,
    },
    {
      key: "images",
      borderColor: totalImages > 0 ? theme.colors.primary : theme.colors.border,
      onPress: pickImages,
      disabled: totalImages >= MAX_IMAGES,
      accessibilityLabel: "Add images",
      accessibilityHint: `${totalImages}/${MAX_IMAGES} images`,
      content: <Text style={styles.toolbarIcon}>🖼️</Text>,
    },
    {
      key: "camera",
      borderColor: theme.colors.border,
      onPress: takePhoto,
      disabled: totalImages >= MAX_IMAGES,
      accessibilityLabel: "Take photo",
      content: <Text style={styles.toolbarIcon}>📷</Text>,
    },
    {
      key: "mood",
      borderColor: mood ? theme.colors.primary : theme.colors.border,
      onPress: () => setShowMoodPicker(true),
      accessibilityLabel: "Change mood",
      accessibilityHint: mood ? `Mood: ${MOOD_MAP[mood]?.label}` : "Select a mood",
      content: <Text style={styles.toolbarIcon}>{mood ? MOOD_MAP[mood]?.emoji : "😊"}</Text>,
    },
  ];

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

          <EntryMediaToolbar buttons={toolbarButtons} />

          <EntryImageStrip
            title="Existing Images"
            items={visibleExistingImages}
            titleColor={theme.colors.textSecondary}
            onRemove={(imageUri) => removeExistingImage(imageUri)}
            getItemAccessibilityLabel={() => "Existing image"}
          />

          <EntryImageStrip
            title="New Images"
            items={newImageUris}
            titleColor={theme.colors.textSecondary}
            onRemove={(_, index) => removeNewImage(index)}
            getItemAccessibilityLabel={(index) => `New image ${index + 1}`}
          />

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

        <EntryMoodPickerModal
          visible={showMoodPicker}
          selectedMood={mood}
          onSelectMood={(moodValue) => setValue("mood", moodValue)}
          onClose={() => setShowMoodPicker(false)}
          backgroundColor={entryPalette.background}
          textColor={entryPalette.text}
          borderColor={entryPalette.border}
          surfaceColor="transparent"
          primaryColor={entryPalette.primary}
        />

        <EntrySelectionModal
          visible={showDrawerModal}
          title="Select Drawers"
          items={drawers.map((drawer) => ({ id: drawer.id, name: drawer.name }))}
          selectedIds={selectedDrawers}
          onToggle={toggleDrawer}
          onClose={() => setShowDrawerModal(false)}
          createValue={newDrawerName}
          onCreateValueChange={setNewDrawerName}
          onCreate={handleAddDrawer}
          createPlaceholder="New drawer name"
          createAccessibilityLabel="New drawer name"
          createButtonAccessibilityLabel="Create drawer"
          placeholderTextColor={entryPalette.muted}
          textColor={entryPalette.text}
          backgroundColor={entryPalette.background}
          surfaceColor="transparent"
          borderColor={entryPalette.border}
          primaryColor={entryPalette.primary}
          inverseTextColor={entryPalette.inverseText}
        />

        <EntrySelectionModal
          visible={showTagModal}
          title="Select Tags"
          items={tags.map((tag) => ({ id: tag.id, name: tag.name }))}
          selectedIds={selectedTags}
          onToggle={toggleTag}
          onClose={() => setShowTagModal(false)}
          createValue={newTagName}
          onCreateValueChange={setNewTagName}
          onCreate={handleAddTag}
          createPlaceholder="New tag name"
          createAccessibilityLabel="New tag name"
          createButtonAccessibilityLabel="Create tag"
          placeholderTextColor={entryPalette.muted}
          textColor={entryPalette.text}
          backgroundColor={entryPalette.background}
          surfaceColor="transparent"
          borderColor={entryPalette.border}
          primaryColor={entryPalette.primary}
          inverseTextColor={entryPalette.inverseText}
        />
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
