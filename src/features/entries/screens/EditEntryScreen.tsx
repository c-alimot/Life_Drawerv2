import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeArea, Screen } from "@components/layout";
import {
  Button,
  EntryImageStrip,
  EntryMediaToolbar,
  type EntryMediaToolbarButton,
  Modal,
  EntryMoodPickerModal,
  EntrySelectionModal,
} from "@components/ui";
import { MOOD_MAP, MOOD_VALUES } from "@constants/moods";
import { useCreateDrawer } from "@features/drawers/hooks/useCreateDrawer";
import { useDrawers } from "@features/drawers/hooks/useDrawers";
import { useCreateTag } from "@features/tags/hooks/useCreateTag";
import { useTags } from "@features/tags/hooks/useTags";
import { zodResolver } from "@hookform/resolvers/zod";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@styles/theme";
import type { MoodValue } from "@types";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    ActivityIndicator,
    Alert,
    Platform,
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
const ENTRY_BACKGROUND = "#EDEAE4";
const ENTRY_SURFACE = "#FFFFFF";
const ENTRY_TEXT = "#2F2924";
const ENTRY_MUTED = "#6F6860";
const ENTRY_PRIMARY = "#8C9A7F";
const ENTRY_SECONDARY = "#556950";
const ENTRY_ACCENT = "#DAC8B1";
const ENTRY_DANGER_DARK = "#8B2D2A";
const ENTRY_DANGER = "#A6544E";
const ENTRY_CANCEL_BG = "#E3E1DC";
const ENTRY_CANCEL_BORDER = "#C9C4BB";
const ENTRY_CANCEL_TEXT = "#5F6368";
const STARTER_DRAWER_HIDDEN_KEY = "life-drawer:starter-drawer-hidden";
const STARTER_DRAWER_ID = "starter-drawer";
const STARTER_DRAWER = {
  id: STARTER_DRAWER_ID,
  name: "My Life Drawer",
};

const webStorage = {
  async getItem(key: string) {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
};

const starterDrawerStorage = Platform.OS === "web" ? webStorage : AsyncStorage;

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
  const [isStarterDrawerHidden, setIsStarterDrawerHidden] = useState(false);
  const [newDrawerName, setNewDrawerName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [pendingImageRemoval, setPendingImageRemoval] = useState<
    { kind: "new"; index: number } | { kind: "existing"; uri: string } | null
  >(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const mood = watch("mood");

  // Initialize
  useFocusEffect(
    useCallback(() => {
      fetchEntry();
      fetchDrawers();
      fetchTags();
    }, [fetchEntry, fetchDrawers, fetchTags]),
  );

  useEffect(() => {
    const loadStarterDrawerPreference = async () => {
      try {
        const value = await starterDrawerStorage.getItem(STARTER_DRAWER_HIDDEN_KEY);
        setIsStarterDrawerHidden(value === "true");
      } catch {
        setIsStarterDrawerHidden(false);
      }
    };

    loadStarterDrawerPreference();
  }, []);

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
      setAudioUri(entry.audioUrl ?? null);
      setNewImageUris([]);
      setRemovedImageUris([]);
    }
  }, [entry?.id, setValue]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

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
    setRemovedImageUris((prev) => [...prev, imageUri]);
  }, []);

  const requestRemoveNewImage = useCallback((index: number) => {
    setPendingImageRemoval({ kind: "new", index });
  }, []);

  const requestRemoveExistingImage = useCallback((uri: string) => {
    setPendingImageRemoval({ kind: "existing", uri });
  }, []);

  const confirmRemoveImage = useCallback(() => {
    if (!pendingImageRemoval) {
      return;
    }

    if (pendingImageRemoval.kind === "new") {
      removeNewImage(pendingImageRemoval.index);
    } else {
      removeExistingImage(pendingImageRemoval.uri);
    }

    setPendingImageRemoval(null);
  }, [pendingImageRemoval, removeExistingImage, removeNewImage]);

  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission denied",
          "Please enable microphone access in settings",
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
    } catch {
      Alert.alert("Error", "Failed to start recording");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      if (uri) {
        setAudioUri(uri);
      }
      recordingRef.current = null;
      setIsRecording(false);
    } catch {
      Alert.alert("Error", "Failed to stop recording");
    }
  }, []);

  const playAudio = useCallback(async () => {
    try {
      if (!audioUri) return;
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
      );
      soundRef.current = sound;
      await sound.playAsync();
    } catch {
      Alert.alert("Error", "Failed to play audio");
    }
  }, [audioUri]);

  const removeAudio = useCallback(() => {
    setAudioUri(null);
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
      drawerIds: selectedDrawers.filter((id) => id !== STARTER_DRAWER_ID),
      tagIds: selectedTags,
      imageUris: [...persistedImages, ...newImageUris],
      audioUrl: audioUri || null,
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
  const formattedDate = entry
    ? new Date(entry.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const selectedDrawerPreview = drawers
    .filter((drawer) => selectedDrawers.includes(drawer.id))
    .map((drawer) => ({ id: drawer.id, name: drawer.name }));
  const starterDrawerPreview = selectedDrawers.includes(STARTER_DRAWER_ID)
    ? [STARTER_DRAWER]
    : [];
  const displayDrawerPreview = [...starterDrawerPreview, ...selectedDrawerPreview];
  const selectableDrawers = isStarterDrawerHidden
    ? drawers
    : [STARTER_DRAWER, ...drawers];
  const selectedTagPreview = tags
    .filter((tag) => selectedTags.includes(tag.id))
    .map((tag) => ({ id: tag.id, name: tag.name }));
  const entryPalette = {
    background: ENTRY_BACKGROUND,
    surface: ENTRY_SURFACE,
    text: ENTRY_TEXT,
    muted: ENTRY_MUTED,
    primary: ENTRY_PRIMARY,
    border: ENTRY_ACCENT,
    inverseText: "#F8F6F2",
  };
  const renderToolbarItem = (
    icon: ReactNode,
    label: string,
  ) => (
    <View style={styles.toolbarItemContent}>
      {icon}
      <Text style={styles.toolbarItemLabel}>{label}</Text>
    </View>
  );
  const toolbarButtons: EntryMediaToolbarButton[] = [
    {
      key: "drawers",
      borderColor: selectedDrawers.length > 0 ? ENTRY_PRIMARY : `${ENTRY_ACCENT}AA`,
      onPress: () => setShowDrawerModal(true),
      accessibilityLabel: "Manage drawers",
      accessibilityHint: `${selectedDrawers.length} drawers selected`,
      content: renderToolbarItem(
        <MaterialCommunityIcons
          name="archive-outline"
          size={28}
          color={ENTRY_PRIMARY}
        />,
        "Drawer",
      ),
    },
    {
      key: "tags",
      borderColor: selectedTags.length > 0 ? ENTRY_PRIMARY : `${ENTRY_ACCENT}AA`,
      onPress: () => setShowTagModal(true),
      accessibilityLabel: "Manage tags",
      accessibilityHint: `${selectedTags.length} tags selected`,
      content: renderToolbarItem(
        <MaterialCommunityIcons
          name="tag-outline"
          size={28}
          color={ENTRY_PRIMARY}
        />,
        "Tags",
      ),
    },
    {
      key: "images",
      borderColor: totalImages > 0 ? ENTRY_PRIMARY : `${ENTRY_ACCENT}AA`,
      onPress: pickImages,
      disabled: totalImages >= MAX_IMAGES,
      accessibilityLabel: "Add images",
      accessibilityHint: `${totalImages}/${MAX_IMAGES} images`,
      content: renderToolbarItem(
        <MaterialCommunityIcons
          name="image-outline"
          size={28}
          color={ENTRY_PRIMARY}
        />,
        "Image",
      ),
    },
    {
      key: "audio",
      borderColor:
        isRecording || audioUri ? ENTRY_PRIMARY : `${ENTRY_ACCENT}AA`,
      backgroundColor: isRecording ? `${theme.colors.error}20` : "transparent",
      onPress: isRecording ? stopRecording : audioUri ? playAudio : startRecording,
      accessibilityLabel: isRecording
        ? "Stop recording"
        : audioUri
          ? "Play voice memo"
          : "Record voice memo",
      content: renderToolbarItem(
        <MaterialCommunityIcons
          name={
            isRecording
              ? "stop-circle-outline"
              : audioUri
                ? "play-circle-outline"
                : "microphone-outline"
          }
          size={28}
          color={isRecording ? theme.colors.error : ENTRY_PRIMARY}
        />,
        "Voice Memo",
      ),
    },
    {
      key: "mood",
      borderColor: mood ? ENTRY_PRIMARY : `${ENTRY_ACCENT}AA`,
      onPress: () => setShowMoodPicker(true),
      accessibilityLabel: "Change mood",
      accessibilityHint: mood ? `Mood: ${MOOD_MAP[mood]?.label}` : "Select a mood",
      content: renderToolbarItem(
        mood ? (
          <Text style={styles.toolbarMoodIcon}>{MOOD_MAP[mood]?.emoji}</Text>
        ) : (
          <MaterialCommunityIcons
            name="emoticon-happy-outline"
            size={28}
            color={ENTRY_PRIMARY}
          />
        ),
        "Mood",
      ),
    },
  ];

  if (entryLoading) {
    return (
      <SafeArea>
        <Screen style={[styles.container, { backgroundColor: ENTRY_BACKGROUND }]}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={ENTRY_PRIMARY} />
          </View>
        </Screen>
      </SafeArea>
    );
  }

  if (!entry) {
    return (
      <SafeArea>
        <Screen style={[styles.container, { backgroundColor: ENTRY_BACKGROUND }]}>
          <View style={styles.loaderContainer}>
            <Text style={[theme.typography.body, { color: ENTRY_TEXT }]}>
              Entry not found
            </Text>
          </View>
        </Screen>
      </SafeArea>
    );
  }

  return (
    <SafeArea>
      <Screen style={[styles.container, { backgroundColor: ENTRY_BACKGROUND }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.headerBack}
            accessible
            accessibilityLabel="Go back"
          >
            <Text style={[theme.typography.body, styles.headerBackText]}>
              Back
            </Text>
          </TouchableOpacity>
          <Button
            label={updateLoading ? "Saving..." : "Save"}
            onPress={handleSubmit(onSubmit)}
            disabled={updateLoading}
            size="sm"
            textStyle={{ color: "#FFFFFF", letterSpacing: 1.5 }}
            style={styles.saveButton}
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
                  styles.titleInput,
                  {
                    color: ENTRY_TEXT,
                    fontFamily: theme.fonts.serif,
                  },
                ]}
                placeholder="Add a title"
                placeholderTextColor={theme.colors.accent2}
                value={value}
                onChangeText={onChange}
                cursorColor={ENTRY_PRIMARY}
                selectionColor={ENTRY_PRIMARY}
                underlineColorAndroid="transparent"
                autoCorrect={false}
                autoCapitalize="sentences"
                returnKeyType="done"
                spellCheck={false}
                focusable
                accessibilityLabel="Entry title"
              />
            )}
          />

          {errors.title && (
            <Text
              style={[theme.typography.bodySm, { color: theme.colors.error, marginBottom: 6 }]}
            >
              {errors.title.message}
            </Text>
          )}

          <View style={styles.metaRow}>
            <View style={styles.inlineMetaItem}>
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={24}
                color={ENTRY_PRIMARY}
              />
              <Text style={styles.inlineMetaText}>{formattedDate}</Text>
            </View>
          </View>

          <EntryMediaToolbar
            buttons={toolbarButtons}
            containerStyle={styles.toolbar}
            buttonStyle={styles.toolbarButton}
          />

          <EntryImageStrip
            title="Existing Images"
            items={visibleExistingImages}
            titleColor={theme.colors.textSecondary}
            onRemove={(imageUri) => requestRemoveExistingImage(imageUri)}
            getItemAccessibilityLabel={() => "Existing image"}
          />

          <EntryImageStrip
            title="New Images"
            items={newImageUris}
            titleColor={theme.colors.textSecondary}
            onRemove={(_, index) => requestRemoveNewImage(index)}
            getItemAccessibilityLabel={(index) => `New image ${index + 1}`}
          />

          {audioUri && (
            <View style={[styles.audioBox, { borderColor: ENTRY_ACCENT }]}>
              <View style={styles.audioContent}>
                <Text
                  style={[theme.typography.body, { color: ENTRY_TEXT }]}
                >
                  🎙️ Voice Memo
                </Text>
                <TouchableOpacity
                  onPress={playAudio}
                  accessible
                  accessibilityLabel="Play voice memo"
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      theme.typography.bodySm,
                      { color: ENTRY_TEXT },
                    ]}
                  >
                    Play
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={removeAudio}
                accessible
                accessibilityLabel="Remove voice memo"
              >
                <Text
                  style={[theme.typography.body, { color: theme.colors.error }]}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {(displayDrawerPreview.length > 0 || selectedTagPreview.length > 0) && (
            <View style={styles.linkedPreviewSection}>
              {displayDrawerPreview.length > 0 && (
                <>
                  <Text style={styles.linkedPreviewLabel}>Linked Drawers</Text>
                  <View style={styles.linkedChipRow}>
                    {displayDrawerPreview.map((drawer) => (
                      <View key={`drawer-${drawer.id}`} style={styles.linkedChip}>
                        <Text style={styles.linkedChipText}>{drawer.name}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              {selectedTagPreview.length > 0 && (
                <>
                  <Text style={styles.linkedPreviewLabel}>Linked Tags</Text>
                  <View style={styles.linkedChipRow}>
                    {selectedTagPreview.map((tag) => (
                      <View key={`tag-${tag.id}`} style={styles.linkedChip}>
                        <Text style={styles.linkedChipText}>{tag.name}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Content */}
          {errors.content && (
            <Text
              style={[theme.typography.bodySm, { color: ENTRY_DANGER_DARK }]}
            >
              {errors.content.message}
            </Text>
          )}

          <Controller
            control={control}
            name="content"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  styles.contentInput,
                  {
                    borderColor: ENTRY_ACCENT,
                    color: ENTRY_TEXT,
                    backgroundColor: ENTRY_SURFACE,
                  },
                ]}
                placeholder="Start writing..."
                placeholderTextColor={ENTRY_MUTED}
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={12}
                textAlignVertical="top"
                accessibilityLabel="Entry content"
              />
            )}
          />
        </ScrollView>

        <EntrySelectionModal
          visible={showDrawerModal}
          title="Select Drawers"
          items={selectableDrawers.map((drawer) => ({ id: drawer.id, name: drawer.name }))}
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
          surfaceColor={entryPalette.surface}
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
          surfaceColor={entryPalette.surface}
          borderColor={entryPalette.border}
          primaryColor={entryPalette.primary}
          inverseTextColor={entryPalette.inverseText}
        />

        <EntryMoodPickerModal
          visible={showMoodPicker}
          selectedMood={mood}
          onSelectMood={(moodValue) => setValue("mood", moodValue)}
          onClose={() => setShowMoodPicker(false)}
        />

        <Modal
          visible={pendingImageRemoval !== null}
          onClose={() => setPendingImageRemoval(null)}
          animationType="fade"
          backdropStyle={styles.actionBackdrop}
          contentStyle={styles.actionModal}
        >
          <Text style={[styles.actionTitle, { color: ENTRY_TEXT, fontFamily: theme.fonts.serif }]}>
            Delete Image
          </Text>
          <Text style={[theme.typography.body, styles.actionSubtitle, { color: ENTRY_MUTED }]}>
            Are you sure you want to delete this image?
          </Text>
          <View style={styles.actionRow}>
            <Button
              label="Cancel"
              onPress={() => setPendingImageRemoval(null)}
              variant="primary"
              style={[styles.actionButton, { backgroundColor: ENTRY_CANCEL_BG, borderColor: ENTRY_CANCEL_BORDER }]}
              textStyle={{ color: ENTRY_CANCEL_TEXT, fontWeight: "700" }}
            />
            <Button
              label="Delete"
              onPress={confirmRemoveImage}
              variant="primary"
              style={[styles.actionButton, { backgroundColor: ENTRY_DANGER, borderColor: ENTRY_DANGER }]}
              textStyle={{ color: "#FFFFFF", fontWeight: "700" }}
            />
          </View>
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
    paddingTop: 40,
    paddingBottom: 12,
  },
  headerBack: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  headerBackText: {
    color: ENTRY_MUTED,
    fontWeight: "500",
  },
  saveButton: {
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: ENTRY_SECONDARY,
    paddingHorizontal: 20,
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
    gap: 8,
    marginBottom: 14,
    marginTop: 4,
  },
  toolbarButton: {
    width: "17.6%",
    aspectRatio: 1,
    borderWidth: 2,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  toolbarItemContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  toolbarItemLabel: {
    color: ENTRY_TEXT,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  toolbarMoodIcon: {
    fontSize: 24,
  },
  titleInput: {
    fontSize: 46,
    lineHeight: 54,
    fontWeight: "400",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  inlineMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  inlineMetaText: {
    marginLeft: 8,
    fontSize: 16,
    color: ENTRY_MUTED,
    maxWidth: 220,
  },
  contentInput: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    minHeight: 200,
    marginTop: 12,
    fontSize: 19,
    lineHeight: 30,
  },
  audioBox: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  audioContent: {
    gap: 4,
  },
  linkedPreviewSection: {
    marginBottom: 14,
    gap: 8,
  },
  linkedPreviewLabel: {
    color: ENTRY_MUTED,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  linkedChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  linkedChip: {
    borderWidth: 1,
    borderColor: ENTRY_ACCENT,
    backgroundColor: ENTRY_SURFACE,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  linkedChipText: {
    color: ENTRY_TEXT,
    fontSize: 14,
    fontWeight: "500",
  },
  actionBackdrop: {
    paddingHorizontal: 24,
    backgroundColor: "rgba(47, 41, 36, 0.28)",
  },
  actionModal: {
    width: "100%",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: ENTRY_SURFACE,
  },
  actionTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "400",
    marginBottom: 6,
  },
  actionSubtitle: {
    marginBottom: 14,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
  },
});
