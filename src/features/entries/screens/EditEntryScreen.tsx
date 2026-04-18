import { SafeArea, Screen } from "@components/layout";
import {
    Button,
    EntryImageStrip,
    EntryMediaToolbar,
    type EntryMediaToolbarButton,
    EntryMoodPickerModal,
    EntrySelectionModal,
    AppModalSheet,
} from "@components/ui";
import { ENTRY_PREVIEW_PILLS, sanitizeEntryPreviewLabel } from "@constants/entryPreviewPills";
import { MOOD_MAP } from "@constants/moods";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCreateDrawer } from "@features/drawers/hooks/useCreateDrawer";
import { useDeleteDrawer } from "@features/drawers/hooks/useDeleteDrawer";
import { useDrawers } from "@features/drawers/hooks/useDrawers";
import { useUpdateDrawer } from "@features/drawers/hooks/useUpdateDrawer";
import { useCreateTag } from "@features/tags/hooks/useCreateTag";
import { useDeleteTag } from "@features/tags/hooks/useDeleteTag";
import { useTags } from "@features/tags/hooks/useTags";
import { useUpdateTag } from "@features/tags/hooks/useUpdateTag";
import { zodResolver } from "@hookform/resolvers/zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@styles/theme";
import type { MoodValue } from "@types";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const ENTRY_PLACEHOLDER = "#8A8178";
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
  const { entryId, fromSearch } = useLocalSearchParams<{
    entryId: string;
    fromSearch?: string;
  }>();
  const entryIdValue = Array.isArray(entryId) ? entryId[0] : entryId;
  const resolvedEntryId = entryIdValue ?? "";
  const fromSearchValue = Array.isArray(fromSearch)
    ? fromSearch[0]
    : fromSearch;
  const openedFromSearch = fromSearchValue === "1";

  const {
    entry,
    isLoading: entryLoading,
    fetchEntry,
  } = useEntryDetail(resolvedEntryId);
  const {
    isLoading: updateLoading,
    updateEntry,
    error: updateError,
  } = useEditEntry(resolvedEntryId);
  const { drawers, fetchDrawers } = useDrawers();
  const { tags, fetchTags } = useTags();
  const { createDrawer } = useCreateDrawer();
  const { updateDrawer } = useUpdateDrawer();
  const { deleteDrawer } = useDeleteDrawer();
  const { createTag } = useCreateTag();
  const { updateTag } = useUpdateTag();
  const { deleteTag } = useDeleteTag();

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
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [isStarterDrawerHidden, setIsStarterDrawerHidden] = useState(false);
  const [newDrawerName, setNewDrawerName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [pendingImageRemoval, setPendingImageRemoval] = useState<
    { kind: "new"; index: number } | { kind: "existing"; uri: string } | null
  >(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const mood = watch("mood");
  const titleValue = watch("title");
  const contentValue = watch("content");
  const neutralActionTextStyle = { color: ENTRY_CANCEL_TEXT, fontWeight: "700" } as const;
  const primaryActionTextStyle = { color: "#FFFFFF", fontWeight: "700" } as const;
  const discardActionTextStyle = { color: ENTRY_TEXT, fontWeight: "700" } as const;

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
        const value = await starterDrawerStorage.getItem(
          STARTER_DRAWER_HIDDEN_KEY,
        );
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
  }, [entry, setValue]);

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
        const uris = result.assets.map(
          (asset: ImagePicker.ImagePickerAsset) => asset.uri,
        );
        setNewImageUris((prev) => [...prev, ...uris]);
      }
    } catch {
      Alert.alert("Error", "Failed to pick images");
    }
  }, [entry?.images, newImageUris.length]);

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
        await soundRef.current.playAsync();
        setIsAudioPlaying(true);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          setIsAudioPlaying(false);
          return;
        }
        setIsAudioPlaying(status.isPlaying);
        if (status.didJustFinish) {
          setIsAudioPlaying(false);
        }
      });
      setIsAudioPlaying(true);
    } catch {
      Alert.alert("Error", "Failed to play audio");
    }
  }, [audioUri]);

  const pauseAudio = useCallback(async () => {
    try {
      if (!soundRef.current) return;
      await soundRef.current.pauseAsync();
      setIsAudioPlaying(false);
    } catch {
      Alert.alert("Error", "Failed to pause audio");
    }
  }, []);

  const removeAudio = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setIsAudioPlaying(false);
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

    const result = await createTag({ name: newTagName.trim() });
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

  const handleEditDrawer = useCallback(
    async (drawerIdValue: string, name: string) => {
      if (drawerIdValue === STARTER_DRAWER_ID) {
        return false;
      }

      const result = await updateDrawer(drawerIdValue, { name });
      if (!result) {
        return false;
      }

      await fetchDrawers();
      return true;
    },
    [fetchDrawers, updateDrawer],
  );

  const handleDeleteDrawer = useCallback(
    async (drawerIdValue: string) => {
      if (drawerIdValue === STARTER_DRAWER_ID) {
        return false;
      }

      const success = await deleteDrawer(drawerIdValue);
      if (!success) {
        return false;
      }

      setSelectedDrawers((prev) => prev.filter((id) => id !== drawerIdValue));
      await fetchDrawers();
      return true;
    },
    [deleteDrawer, fetchDrawers],
  );

  const handleEditTag = useCallback(
    async (tagIdValue: string, name: string) => {
      const result = await updateTag(tagIdValue, { name });
      if (!result) {
        return false;
      }

      await fetchTags();
      return true;
    },
    [fetchTags, updateTag],
  );

  const handleDeleteTag = useCallback(
    async (tagIdValue: string) => {
      const success = await deleteTag(tagIdValue);
      if (!success) {
        return false;
      }

      setSelectedTags((prev) => prev.filter((id) => id !== tagIdValue));
      await fetchTags();
      return true;
    },
    [deleteTag, fetchTags],
  );

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
      occurredAt: entry.occurredAt || null,
    });

    if (result) {
      Alert.alert("Success", "Entry updated successfully");
      if (openedFromSearch) {
        router.replace("/search");
      } else {
        router.back();
      }
    } else {
      Alert.alert("Error", updateError?.message || "Failed to update entry");
    }
  };

  const handleBack = useCallback(() => {
    if (openedFromSearch) {
      router.replace("/search");
      return;
    }

    router.back();
  }, [openedFromSearch]);

  const arraysEqual = useCallback((left: string[], right: string[]) => {
    if (left.length !== right.length) return false;
    const leftSorted = [...left].sort();
    const rightSorted = [...right].sort();
    return leftSorted.every((value, index) => value === rightSorted[index]);
  }, []);

  const hasUnsavedChanges = useMemo(() => {
    if (!entry) {
      return false;
    }

    const baseDrawerIds = entry.drawers?.map((drawer) => drawer.id) || [];
    const baseTagIds = entry.tags?.map((tag) => tag.id) || [];

    return (
      (titleValue || "") !== entry.title ||
      (contentValue || "") !== entry.content ||
      (mood || undefined) !== (entry.mood || undefined) ||
      !arraysEqual(selectedDrawers, baseDrawerIds) ||
      !arraysEqual(selectedTags, baseTagIds) ||
      newImageUris.length > 0 ||
      removedImageUris.length > 0 ||
      (audioUri || null) !== (entry.audioUrl || null)
    );
  }, [
    arraysEqual,
    audioUri,
    contentValue,
    entry,
    mood,
    newImageUris.length,
    removedImageUris.length,
    selectedDrawers,
    selectedTags,
    titleValue,
  ]);

  const handleBackPress = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowExitPrompt(true);
      return;
    }

    handleBack();
  }, [handleBack, hasUnsavedChanges]);

  const handleDiscardEntry = useCallback(() => {
    setShowExitPrompt(false);
    handleBack();
  }, [handleBack]);

  const handleSaveFromExitPrompt = () => {
    setShowExitPrompt(false);
    handleSubmit(onSubmit)();
  };

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
  const displayDrawerPreview = [
    ...starterDrawerPreview,
    ...selectedDrawerPreview,
  ];
  const selectableDrawers = isStarterDrawerHidden
    ? drawers
    : [{ ...STARTER_DRAWER, isManageable: false }, ...drawers];
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
  const renderToolbarItem = (icon: ReactNode, label: string) => (
    <View style={styles.toolbarItemContent}>
      {icon}
      <Text style={styles.toolbarItemLabel}>{label}</Text>
    </View>
  );
  const toolbarButtons: EntryMediaToolbarButton[] = [
    {
      key: "drawers",
      borderColor:
        selectedDrawers.length > 0 ? ENTRY_SECONDARY : ENTRY_ACCENT,
      backgroundColor: selectedDrawers.length > 0 ? "#E6E2D8" : "#ECE6DB",
      onPress: () => setShowDrawerModal(true),
      accessibilityLabel: "Manage drawers",
      accessibilityHint: `${selectedDrawers.length} drawers selected`,
      content: renderToolbarItem(
        <MaterialCommunityIcons
          name="archive-outline"
          size={28}
          color={ENTRY_SECONDARY}
        />,
        "Drawer",
      ),
    },
    {
      key: "tags",
      borderColor:
        selectedTags.length > 0 ? ENTRY_SECONDARY : ENTRY_ACCENT,
      backgroundColor: selectedTags.length > 0 ? "#E6E2D8" : "#ECE6DB",
      onPress: () => setShowTagModal(true),
      accessibilityLabel: "Manage tags",
      accessibilityHint: `${selectedTags.length} tags selected`,
      content: renderToolbarItem(
        <MaterialCommunityIcons
          name="tag-outline"
          size={28}
          color={ENTRY_SECONDARY}
        />,
        "Tags",
      ),
    },
    {
      key: "images",
      borderColor: totalImages > 0 ? ENTRY_SECONDARY : ENTRY_ACCENT,
      backgroundColor: totalImages > 0 ? "#E6E2D8" : "#ECE6DB",
      onPress: pickImages,
      disabled: totalImages >= MAX_IMAGES,
      accessibilityLabel: "Add images",
      accessibilityHint: `${totalImages}/${MAX_IMAGES} images`,
      content: renderToolbarItem(
        <MaterialCommunityIcons
          name="image-outline"
          size={28}
          color={ENTRY_SECONDARY}
        />,
        "Image",
      ),
    },
    {
      key: "audio",
      borderColor:
        isRecording || audioUri ? ENTRY_SECONDARY : ENTRY_ACCENT,
      backgroundColor: isRecording || audioUri ? "#E6E2D8" : "#ECE6DB",
      onPress: isRecording
        ? stopRecording
        : audioUri
          ? playAudio
          : startRecording,
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
          color={ENTRY_SECONDARY}
        />,
        "Voice Memo",
      ),
    },
    {
      key: "mood",
      borderColor: mood ? ENTRY_SECONDARY : ENTRY_ACCENT,
      backgroundColor: mood ? "#E6E2D8" : "#ECE6DB",
      onPress: () => setShowMoodPicker(true),
      accessibilityLabel: "Change mood",
      accessibilityHint: mood
        ? `Mood: ${MOOD_MAP[mood]?.label}`
        : "Select a mood",
      content: renderToolbarItem(
        mood ? (
          <Text style={styles.toolbarMoodIcon}>{MOOD_MAP[mood]?.emoji}</Text>
        ) : (
          <MaterialCommunityIcons
            name="emoticon-happy-outline"
            size={28}
            color={ENTRY_SECONDARY}
          />
        ),
        "Mood",
      ),
    },
  ];

  if (entryLoading) {
    return (
      <SafeArea>
        <Screen
          style={[styles.container, { backgroundColor: ENTRY_BACKGROUND }]}
        >
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
        <Screen
          style={[styles.container, { backgroundColor: ENTRY_BACKGROUND }]}
        >
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
            onPress={handleBackPress}
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
                    fontWeight: value?.trim() ? "600" : "400",
                  },
                ]}
                placeholder="Add a title"
                placeholderTextColor={ENTRY_PLACEHOLDER}
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
              style={[
                theme.typography.bodySm,
                { color: theme.colors.errorText, marginBottom: 6 },
              ]}
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
            title="MEDIA"
            items={visibleExistingImages}
            titleColor="#8A8178"
            titleStyle={styles.linkedPreviewLabel}
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
                <Text style={[theme.typography.body, { color: ENTRY_TEXT }]}>
                  Voice Memo
                </Text>
                <View style={styles.audioActions}>
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
                  <TouchableOpacity
                    onPress={pauseAudio}
                    disabled={!isAudioPlaying}
                    accessible
                    accessibilityLabel="Pause voice memo"
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        theme.typography.bodySm,
                        { color: isAudioPlaying ? ENTRY_TEXT : "#8A8178" },
                      ]}
                    >
                      Pause
                    </Text>
                  </TouchableOpacity>
                </View>
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

          {(displayDrawerPreview.length > 0 ||
            selectedTagPreview.length > 0) && (
            <View style={styles.linkedPreviewSection}>
              {displayDrawerPreview.length > 0 && (
                <>
                  <Text style={styles.linkedPreviewLabel}>Linked Drawers</Text>
                  <View style={styles.linkedChipRow}>
                    {displayDrawerPreview.map((drawer) => (
                      <View
                        key={`drawer-${drawer.id}`}
                        style={styles.linkedDrawerChip}
                      >
                        <Text style={styles.linkedDrawerChipText}>
                          {sanitizeEntryPreviewLabel(drawer.name)}
                        </Text>
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
                      <View key={`tag-${tag.id}`} style={styles.linkedTagChip}>
                        <Text style={styles.linkedTagChipText}>
                          {sanitizeEntryPreviewLabel(tag.name)}
                        </Text>
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
                    backgroundColor: "#F8F6F2",
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
          items={selectableDrawers.map((drawer) => ({
            id: drawer.id,
            name: drawer.name,
            isManageable: "isManageable" in drawer ? drawer.isManageable : true,
          }))}
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
          itemTypeLabel="drawer"
          onEditItem={handleEditDrawer}
          onDeleteItem={handleDeleteDrawer}
        />

        <EntrySelectionModal
          visible={showTagModal}
          title="Select Tags"
          items={tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            isManageable: true,
          }))}
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
          itemTypeLabel="tag"
          onEditItem={handleEditTag}
          onDeleteItem={handleDeleteTag}
        />

        <EntryMoodPickerModal
          visible={showMoodPicker}
          selectedMood={mood}
          onSelectMood={(moodValue) => setValue("mood", moodValue)}
          onClose={() => setShowMoodPicker(false)}
          backgroundColor={entryPalette.background}
          textColor={entryPalette.text}
          borderColor={entryPalette.border}
          surfaceColor={entryPalette.surface}
          primaryColor={entryPalette.primary}
        />

        <AppModalSheet
          visible={pendingImageRemoval !== null}
          onClose={() => setPendingImageRemoval(null)}
          contentStyle={styles.actionModal}
        >
          <Text
            style={[
              styles.actionTitle,
              { color: ENTRY_TEXT, fontFamily: theme.fonts.serif },
            ]}
          >
            Delete Image
          </Text>
          <Text
            style={[
              theme.typography.body,
              styles.actionSubtitle,
              { color: ENTRY_MUTED },
            ]}
          >
            Are you sure you want to delete this image?
          </Text>
          <View style={styles.actionRow}>
            <Button
              label="Cancel"
              onPress={() => setPendingImageRemoval(null)}
              variant="primary"
              style={[
                styles.actionButton,
                {
                  backgroundColor: ENTRY_CANCEL_BG,
                  borderColor: ENTRY_CANCEL_BORDER,
                },
              ]}
              textStyle={neutralActionTextStyle}
            />
            <Button
              label="Delete"
              onPress={confirmRemoveImage}
              variant="primary"
              style={[
                styles.actionButton,
                { backgroundColor: ENTRY_DANGER, borderColor: ENTRY_DANGER },
              ]}
              textStyle={primaryActionTextStyle}
            />
          </View>
        </AppModalSheet>

        <AppModalSheet
          visible={showExitPrompt}
          onClose={() => setShowExitPrompt(false)}
          contentStyle={styles.actionModal}
        >
          <Text
            style={[
              styles.actionTitle,
              { color: ENTRY_TEXT, fontFamily: theme.fonts.serif },
            ]}
          >
            Leave Entry?
          </Text>
          <Text
            style={[
              theme.typography.body,
              styles.actionSubtitle,
              { color: ENTRY_MUTED },
            ]}
          >
            Do you want to save your changes before leaving?
          </Text>
          <View style={styles.actionRow}>
            <Button
              label="Save Changes"
              onPress={handleSaveFromExitPrompt}
              variant="primary"
              style={[
                styles.actionButton,
                { backgroundColor: ENTRY_SECONDARY, borderColor: ENTRY_SECONDARY },
              ]}
              textStyle={primaryActionTextStyle}
            />
            <Button
              label="Discard Entry"
              onPress={handleDiscardEntry}
              variant="primary"
              style={[
                styles.actionButton,
                {
                  backgroundColor: ENTRY_CANCEL_BG,
                  borderColor: ENTRY_CANCEL_BORDER,
                },
              ]}
              textStyle={discardActionTextStyle}
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
    gap: 10,
    marginBottom: 14,
    marginTop: 4,
  },
  toolbarButton: {
    width: "17.6%",
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ECE6DB",
    borderColor: ENTRY_ACCENT,
    padding: 8,
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
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    minHeight: 200,
    marginTop: 12,
    fontSize: 19,
    lineHeight: 32,
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
  audioActions: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  linkedPreviewSection: {
    marginBottom: 14,
    gap: 6,
  },
  linkedPreviewLabel: {
    color: "#8A8178",
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  linkedChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  linkedDrawerChip: {
    borderWidth: 1,
    borderColor: "#556950",
    backgroundColor: "#E6E2D8",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  linkedDrawerChipText: {
    color: "#556950",
    fontSize: 14,
    fontWeight: "500",
  },
  linkedTagChip: {
    borderWidth: 1,
    borderColor: ENTRY_PREVIEW_PILLS.tagBorder,
    backgroundColor: ENTRY_PREVIEW_PILLS.tagBackground,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  linkedTagChipText: {
    color: ENTRY_PREVIEW_PILLS.tagText,
    fontSize: 14,
    fontWeight: "400",
  },
  actionModal: {
    borderRadius: 24,
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
