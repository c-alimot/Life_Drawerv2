import { SafeArea, Screen } from "@components/layout";
import { Button } from "@components/ui";
import { MOOD_MAP, MOOD_VALUES } from "@constants/mood";
import { useCreateDrawer } from "@features/drawers/hooks/useCreateDrawer";
import { useDrawers } from "@features/drawers/hooks/useDrawers";
import { useLifePhase } from "@features/home/hooks/useLifePhase";
import { useCreateTag } from "@features/tags/hooks/useCreateTag";
import { useTags } from "@features/tags/hooks/useTags";
import { zodResolver } from "@hookform/resolvers/zod";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@styles/theme";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
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
import { useCreateEntryWithMedia } from "../hooks/useCreateEntryWithMedia";

const entrySchema = z.object({
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

type EntryFormData = z.infer<typeof entrySchema>;

const MAX_IMAGES = 10;
const ENTRY_BACKGROUND = "#EDEAE4";
const ENTRY_SURFACE = "#FFFFFF";
const ENTRY_TEXT = "#2F2924";
const ENTRY_MUTED = "#6F6860";
const ENTRY_PRIMARY = "#8C9A7F";
const ENTRY_ACCENT = "#DAC8B1";

interface SelectedMedia {
  imageUris: string[];
  audioUri: string | null;
  location: { latitude: number; longitude: number; address?: string } | null;
}

export function CreateEntryScreen() {
  const theme = useTheme();
  const { createEntry, isLoading, error } = useCreateEntryWithMedia();
  const { drawers, fetchDrawers } = useDrawers();
  const { activePhase, fetchActivePhase } = useLifePhase();
  const { tags, fetchTags } = useTags();
  const { createDrawer } = useCreateDrawer();
  const { createTag } = useCreateTag();
  const { drawerId } = useLocalSearchParams<{ drawerId?: string }>();
  const initialDrawerId = Array.isArray(drawerId) ? drawerId[0] : drawerId;

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      title: "",
      content: "",
      mood: undefined,
    },
  });

  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia>({
    imageUris: [],
    audioUri: null,
    location: null,
  });

  const [selectedDrawers, setSelectedDrawers] = useState<string[]>(
    initialDrawerId ? [initialDrawerId] : []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showDrawerModal, setShowDrawerModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [newDrawerName, setNewDrawerName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [locationText, setLocationText] = useState("");
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const mood = watch("mood");

  useEffect(() => {
    fetchDrawers();
    fetchTags();
    fetchActivePhase();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [fetchActivePhase, fetchDrawers, fetchTags]);

  const pickImages = useCallback(async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission denied",
          "Please enable photo library access in settings"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: MAX_IMAGES,
      });

      if (!result.canceled) {
        const newUris = result.assets.map((asset: ImagePicker.ImagePickerAsset) => asset.uri);
        setSelectedMedia((prev) => ({
          ...prev,
          imageUris: [...prev.imageUris, ...newUris].slice(0, MAX_IMAGES),
        }));
      }
    } catch {
      Alert.alert("Error", "Failed to pick images");
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setSelectedMedia((prev) => ({
      ...prev,
      imageUris: prev.imageUris.filter((_, i) => i !== index),
    }));
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission denied",
          "Please enable microphone access in settings"
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
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
        setSelectedMedia((prev) => ({
          ...prev,
          audioUri: uri,
        }));
      }

      recordingRef.current = null;
      setIsRecording(false);
    } catch {
      Alert.alert("Error", "Failed to stop recording");
    }
  }, []);

  const playAudio = useCallback(async () => {
    try {
      if (!selectedMedia.audioUri) return;

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: selectedMedia.audioUri },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      await sound.playAsync();
    } catch {
      Alert.alert("Error", "Failed to play audio");
    }
  }, [selectedMedia.audioUri]);

  const removeAudio = useCallback(() => {
    setSelectedMedia((prev) => ({
      ...prev,
      audioUri: null,
    }));
  }, []);

  const requestLocation = useCallback(async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission denied",
          "Please enable location access in settings"
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      let address = "";
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (geocode.length > 0) {
          const { city, region } = geocode[0];
          address = [city, region].filter(Boolean).join(", ");
        }
      } catch {
        // ignore reverse geocode failure
      }

      setSelectedMedia((prev) => ({
        ...prev,
        location: { latitude, longitude, address },
      }));

      setLocationText(
        address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      );
    } catch {
      Alert.alert("Error", "Failed to get location");
    }
  }, []);

  const removeLocation = useCallback(() => {
    setSelectedMedia((prev) => ({
      ...prev,
      location: null,
    }));
    setLocationText("");
  }, []);

  const handleAddDrawer = useCallback(async () => {
    if (!newDrawerName.trim()) {
      Alert.alert("Error", "Please enter a drawer name");
      return;
    }

    const result = await createDrawer({ name: newDrawerName.trim() });

    if (result) {
      setSelectedDrawers((prev) =>
        prev.includes(result.id) ? prev : [...prev, result.id]
      );
      setNewDrawerName("");
      fetchDrawers();
    }
  }, [newDrawerName, createDrawer, fetchDrawers]);

  const toggleDrawer = useCallback((drawerIdValue: string) => {
    setSelectedDrawers((prev) =>
      prev.includes(drawerIdValue)
        ? prev.filter((id) => id !== drawerIdValue)
        : [...prev, drawerIdValue]
    );
  }, []);

  const handleAddTag = useCallback(async () => {
    if (!newTagName.trim()) {
      Alert.alert("Error", "Please enter a tag name");
      return;
    }

    const result = await createTag({ name: newTagName.trim() });

    if (result) {
      setSelectedTags((prev) =>
        prev.includes(result.id) ? prev : [...prev, result.id]
      );
      setNewTagName("");
      fetchTags();
    }
  }, [newTagName, createTag, fetchTags]);

  const toggleTag = useCallback((tagIdValue: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagIdValue)
        ? prev.filter((id) => id !== tagIdValue)
        : [...prev, tagIdValue]
    );
  }, []);

  const onSubmit = async (data: EntryFormData) => {
    const entry = await createEntry({
      title: data.title,
      content: data.content,
      mood: data.mood,
      drawerIds: selectedDrawers,
      tagIds: selectedTags,
      imageUris: selectedMedia.imageUris,
      audioUri: selectedMedia.audioUri || undefined,
      location: selectedMedia.location || undefined,
      lifePhaseId: activePhase?.id,
    });

    if (entry) {
      Alert.alert("Success", "Entry created successfully");
      router.back();
    } else {
      Alert.alert("Error", error?.message || "Failed to save entry");
    }
  };

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleSetPhasePress = useCallback(() => {
    router.push("/life-phases");
  }, []);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <SafeArea>
      <Screen style={[styles.container, { backgroundColor: ENTRY_BACKGROUND }]}>
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
            label={isLoading ? "Saving..." : "Save"}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            size="sm"
            textStyle={{ color: "#FFFFFF", letterSpacing: 1.5 }}
            style={styles.saveButton}
            accessibilityLabel="Save entry"
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
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
                editable
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
              style={[theme.typography.bodySm, { color: theme.colors.error }]}
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
              <Text style={styles.inlineMetaText}>{currentDate}</Text>
            </View>

            <TouchableOpacity
              onPress={requestLocation}
              style={styles.inlineMetaItem}
              accessible
              accessibilityLabel="Add location"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="map-marker"
                size={24}
                color={ENTRY_PRIMARY}
              />
              <Text
                style={[
                  styles.inlineMetaText,
                  locationText ? styles.inlineMetaTextActive : null,
                ]}
                numberOfLines={1}
              >
                {locationText || "Add location"}
              </Text>
            </TouchableOpacity>
          </View>

          {activePhase && (
            <TouchableOpacity
              onPress={handleSetPhasePress}
              style={styles.phaseLink}
              accessible
              accessibilityLabel={`Life phase: ${activePhase.name}`}
            >
              <Text style={styles.phaseLinkText}>{activePhase.name}</Text>
            </TouchableOpacity>
          )}

          {selectedMedia.location && (
            <TouchableOpacity
              onPress={removeLocation}
              style={{ marginBottom: theme.spacing.lg }}
            >
              <Text
                style={[theme.typography.bodySm, { color: theme.colors.error }]}
              >
                Remove location
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.toolbar}>
            <TouchableOpacity
              style={[
                styles.toolbarButton,
                {
                  borderColor:
                    selectedTags.length > 0
                      ? ENTRY_PRIMARY
                      : `${ENTRY_ACCENT}AA`,
                },
              ]}
              onPress={() => setShowTagModal(true)}
              accessible
              accessibilityLabel="Add tags"
              accessibilityHint={`${selectedTags.length} tags selected`}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="tag-outline"
                size={34}
                color={ENTRY_PRIMARY}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolbarButton,
                {
                  borderColor:
                    selectedDrawers.length > 0
                      ? ENTRY_PRIMARY
                      : `${ENTRY_ACCENT}AA`,
                },
              ]}
              onPress={() => setShowDrawerModal(true)}
              accessible
              accessibilityLabel="Add to drawers"
              accessibilityHint={`${selectedDrawers.length} drawers selected`}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="archive-outline"
                size={34}
                color={ENTRY_PRIMARY}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolbarButton,
                {
                  borderColor:
                    selectedMedia.imageUris.length > 0
                      ? ENTRY_PRIMARY
                      : `${ENTRY_ACCENT}AA`,
                },
              ]}
              onPress={pickImages}
              accessible
              accessibilityLabel="Add images"
              accessibilityHint={`${selectedMedia.imageUris.length}/${MAX_IMAGES} images`}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="image-outline"
                size={34}
                color={ENTRY_PRIMARY}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolbarButton,
                {
                  borderColor:
                    selectedMedia.audioUri || isRecording
                      ? ENTRY_PRIMARY
                      : `${ENTRY_ACCENT}AA`,
                  backgroundColor: isRecording
                    ? `${theme.colors.error}20`
                    : "transparent",
                },
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              accessible
              accessibilityLabel={
                isRecording ? "Stop recording" : "Start voice memo"
              }
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name={isRecording ? "stop-circle-outline" : "microphone-outline"}
                size={34}
                color={isRecording ? theme.colors.error : ENTRY_PRIMARY}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolbarButton,
                {
                  borderColor: mood
                    ? ENTRY_PRIMARY
                    : `${ENTRY_ACCENT}AA`,
                },
              ]}
              onPress={() => setShowMoodPicker(true)}
              accessible
              accessibilityLabel="Add mood"
              accessibilityHint={
                mood ? `Mood: ${MOOD_MAP[mood]?.label}` : "Select a mood"
              }
              accessibilityRole="button"
            >
              {mood ? (
                <Text style={styles.toolbarMoodIcon}>{MOOD_MAP[mood]?.emoji}</Text>
              ) : (
                <MaterialCommunityIcons
                  name="emoticon-happy-outline"
                  size={34}
                  color={ENTRY_PRIMARY}
                />
              )}
            </TouchableOpacity>
          </View>

          {selectedMedia.imageUris.length > 0 && (
            <View style={{ marginBottom: theme.spacing.lg }}>
              <FlatList
                data={selectedMedia.imageUris}
                keyExtractor={(_, index) => `image-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item: imageUri, index }) => (
                  <View style={styles.imageWrapper}>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.image}
                      accessible
                      accessibilityLabel={`Selected image ${index + 1}`}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
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

          {selectedMedia.audioUri && (
            <View
              style={[styles.audioBox, { borderColor: ENTRY_ACCENT }]}
            >
              <View style={styles.audioContent}>
                <Text
                  style={[theme.typography.body, { color: theme.colors.text }]}
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
                      { color: theme.colors.primary },
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

          {errors.content && (
            <Text
              style={[theme.typography.bodySm, { color: theme.colors.error }]}
            >
              {errors.content.message}
            </Text>
          )}
        </ScrollView>

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
                { backgroundColor: ENTRY_BACKGROUND },
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
                              ? `${ENTRY_PRIMARY}20`
                              : ENTRY_SURFACE,
                          borderColor:
                            mood === moodValue
                              ? ENTRY_PRIMARY
                              : ENTRY_ACCENT,
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
                { backgroundColor: ENTRY_BACKGROUND },
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
                <View style={{ marginBottom: theme.spacing.lg }}>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: theme.colors.border,
                          color: ENTRY_TEXT,
                          backgroundColor: ENTRY_SURFACE,
                          flex: 1,
                        },
                      ]}
                      placeholder="New drawer name"
                      placeholderTextColor={ENTRY_MUTED}
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

                {drawers.map((drawer) => (
                  <TouchableOpacity
                    key={drawer.id}
                    style={[
                      styles.modalItem,
                      {
                        borderColor: selectedDrawers.includes(drawer.id)
                          ? theme.colors.primary
                          : ENTRY_ACCENT,
                        backgroundColor: selectedDrawers.includes(drawer.id)
                          ? `${theme.colors.primary}10`
                          : ENTRY_SURFACE,
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
                            : ENTRY_ACCENT,
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
                { backgroundColor: ENTRY_BACKGROUND },
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
                <View style={{ marginBottom: theme.spacing.lg }}>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: theme.colors.border,
                          color: ENTRY_TEXT,
                          backgroundColor: ENTRY_SURFACE,
                          flex: 1,
                        },
                      ]}
                      placeholder="New tag name"
                      placeholderTextColor={ENTRY_MUTED}
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

                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.modalItem,
                      {
                        borderColor: selectedTags.includes(tag.id)
                          ? theme.colors.primary
                          : ENTRY_ACCENT,
                        backgroundColor: selectedTags.includes(tag.id)
                          ? `${theme.colors.primary}10`
                          : ENTRY_SURFACE,
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
                            : ENTRY_ACCENT,
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
    paddingTop: 40,
    paddingBottom: 12,
  },
  headerBack: {
    paddingVertical: 8,
  },
  headerBackText: {
    color: ENTRY_TEXT,
    fontSize: 18,
  },
  saveButton: {
    backgroundColor: ENTRY_PRIMARY,
    borderRadius: 999,
    minHeight: 42,
    paddingHorizontal: 18,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    paddingTop: 4,
  },
  metaRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 24,
  },
  inlineMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  inlineMetaText: {
    color: ENTRY_MUTED,
    fontSize: 16,
    lineHeight: 22,
    flexShrink: 1,
  },
  inlineMetaTextActive: {
    color: ENTRY_PRIMARY,
  },
  titleInput: {
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 14,
    width: "100%",
    minHeight: 92,
    fontSize: 44,
    lineHeight: 52,
    fontWeight: "300",
    marginBottom: 18,
  },
  phaseLink: {
    alignSelf: "flex-start",
    marginTop: -12,
    marginBottom: 20,
  },
  phaseLinkText: {
    color: ENTRY_PRIMARY,
    fontSize: 14,
    fontWeight: "500",
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
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
    backgroundColor: "transparent",
    shadowColor: "#2F2924",
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 1,
  },
  toolbarMoodIcon: {
    fontSize: 28,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    minHeight: 430,
    marginTop: 12,
    shadowColor: "#2F2924",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 4,
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
  audioBox: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: ENTRY_SURFACE,
    shadowColor: "#2F2924",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 3,
  },
  audioContent: {
    flex: 1,
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
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "System",
    fontSize: 14,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 18,
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
