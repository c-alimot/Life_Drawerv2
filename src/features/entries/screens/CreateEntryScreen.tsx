import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeArea, Screen } from "@components/layout";
import {
  Button,
  EntryImageStrip,
  EntryMediaToolbar,
  type EntryMediaToolbarButton,
  EntryMoodPickerModal,
  Modal,
  EntrySelectionModal,
} from "@components/ui";
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
import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import {
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

interface SelectedMedia {
  imageUris: string[];
  audioUri: string | null;
  location: { latitude: number; longitude: number; address?: string } | null;
}

function formatLocationLabelFromPlacemark(
  placemark: Location.LocationGeocodedAddress
): string {
  const locality =
    placemark.city ||
    placemark.district ||
    placemark.subregion ||
    placemark.name ||
    placemark.street;
  const area = placemark.region || placemark.country;
  return [locality, area].filter(Boolean).join(", ");
}

function formatLocationLabelFromNominatim(address?: Record<string, unknown>): string {
  if (!address) {
    return "";
  }

  const rawLocality = [
    address.city,
    address.town,
    address.village,
    address.municipality,
    address.county,
    address.suburb,
    address.hamlet,
  ].find((value) => typeof value === "string" && value.length > 0) as
    | string
    | undefined;

  const rawArea = [
    address.state,
    address.province,
    address.region,
    address.country,
  ].find((value) => typeof value === "string" && value.length > 0) as
    | string
    | undefined;

  return [rawLocality, rawArea].filter(Boolean).join(", ");
}

async function reverseGeocodeWithNominatim(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
    const response = await fetch(url);
    if (!response.ok) {
      return "";
    }

    const json = (await response.json()) as { address?: Record<string, unknown> };
    return formatLocationLabelFromNominatim(json.address);
  } catch {
    return "";
  }
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
  const [isStarterDrawerHidden, setIsStarterDrawerHidden] = useState(false);
  const [newDrawerName, setNewDrawerName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [locationText, setLocationText] = useState("");
  const [pendingImageRemoveIndex, setPendingImageRemoveIndex] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const mood = watch("mood");

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

  const requestRemoveImage = useCallback((index: number) => {
    setPendingImageRemoveIndex(index);
  }, []);

  const confirmRemoveImage = useCallback(() => {
    if (pendingImageRemoveIndex === null) {
      return;
    }
    removeImage(pendingImageRemoveIndex);
    setPendingImageRemoveIndex(null);
  }, [pendingImageRemoveIndex, removeImage]);

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
          address = formatLocationLabelFromPlacemark(geocode[0]);
        }
      } catch {
        // ignore reverse geocode failure
      }

      if (!address) {
        address = await reverseGeocodeWithNominatim(latitude, longitude);
      }

      if (!address) {
        Alert.alert(
          "Location unavailable",
          "Couldn't find your city/state name. Please try again where GPS is stronger."
        );
        return;
      }

      setSelectedMedia((prev) => ({
        ...prev,
        location: { latitude, longitude, address },
      }));

      setLocationText(address);
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
      drawerIds: selectedDrawers.filter((id) => id !== STARTER_DRAWER_ID),
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
      accessibilityLabel: "Add to drawers",
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
      accessibilityLabel: "Add tags",
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
      borderColor:
        selectedMedia.imageUris.length > 0 ? ENTRY_PRIMARY : `${ENTRY_ACCENT}AA`,
      onPress: pickImages,
      accessibilityLabel: "Add images",
      accessibilityHint: `${selectedMedia.imageUris.length}/${MAX_IMAGES} images`,
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
        selectedMedia.audioUri || isRecording ? ENTRY_PRIMARY : `${ENTRY_ACCENT}AA`,
      backgroundColor: isRecording ? `${theme.colors.error}20` : "transparent",
      onPress: isRecording ? stopRecording : startRecording,
      accessibilityLabel: isRecording ? "Stop recording" : "Start voice memo",
      content: renderToolbarItem(
        <MaterialCommunityIcons
          name={isRecording ? "stop-circle-outline" : "microphone-outline"}
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
      accessibilityLabel: "Add mood",
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
              style={[theme.typography.bodySm, { color: theme.colors.errorText }]}
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
                style={[theme.typography.bodySm, { color: ENTRY_DANGER_DARK }]}
              >
                Remove location
              </Text>
            </TouchableOpacity>
          )}

          <EntryMediaToolbar
            buttons={toolbarButtons}
            containerStyle={styles.toolbar}
            buttonStyle={styles.toolbarButton}
          />

          <EntryImageStrip
            items={selectedMedia.imageUris}
            titleColor={theme.colors.textSecondary}
            onRemove={(_, index) => requestRemoveImage(index)}
            getItemAccessibilityLabel={(index) => `Selected image ${index + 1}`}
          />

          {selectedMedia.audioUri && (
            <View
              style={[styles.audioBox, { borderColor: ENTRY_ACCENT }]}
            >
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

        <Modal
          visible={pendingImageRemoveIndex !== null}
          onClose={() => setPendingImageRemoveIndex(null)}
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
              onPress={() => setPendingImageRemoveIndex(null)}
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
