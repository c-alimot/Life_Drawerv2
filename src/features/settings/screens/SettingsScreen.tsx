import { AppBottomNav, SafeArea, Screen } from "@components/layout";
import { Button, Modal, SectionHeader } from "@components/ui";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { authApi } from "@features/auth/api/auth.api";
import { useLogout } from "@features/auth/hooks/useLogout";
import { useAuthStore } from "@store";
import { useTheme } from "@styles/theme";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PAGE_BACKGROUND = "#EDEAE4";
const PAGE_SURFACE = "#FFFFFF";
const PAGE_TEXT = "#2F2924";
const PAGE_MUTED = "#6F6860";
const PAGE_PRIMARY = "#8C9A7F";
const PAGE_SECONDARY = "#556950";
const PAGE_BORDER = "#B39C87";
const SETTINGS_PREFERENCES_KEY = "lifeDrawer.settings.preferences";

type SettingsPanel =
  | "password"
  | "notifications"
  | "privacy"
  | "storage"
  | "help"
  | "about";

type LocalSettingsPreferences = {
  dailyReminders: boolean;
  weeklyReflection: boolean;
};

const DEFAULT_LOCAL_SETTINGS: LocalSettingsPreferences = {
  dailyReminders: true,
  weeklyReflection: true,
};

const settingsStorage =
  Platform.OS === "web"
    ? {
        getItem: async (key: string) =>
          typeof window === "undefined" ? null : window.localStorage.getItem(key),
        setItem: async (key: string, value: string) => {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, value);
          }
        },
      }
    : AsyncStorage;

export function SettingsScreen() {
  const theme = useTheme();
  const { logout, isLoading } = useLogout();
  const { user, setUser } = useAuthStore();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [activePanel, setActivePanel] = useState<SettingsPanel | null>(null);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [localSettings, setLocalSettings] =
    useState<LocalSettingsPreferences>(DEFAULT_LOCAL_SETTINGS);
  const [hasLoadedLocalSettings, setHasLoadedLocalSettings] = useState(false);

  const displayName =
    user?.displayName?.trim() ||
    user?.email.split("@")[0]?.replace(/[._-]+/g, " ") ||
    "Life Drawer User";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const profileImageUri = user?.avatarUrl;
  const editorImageUri = selectedPhotoUri ?? user?.avatarUrl;
  const editorAvatarLetter = (editedName.trim() || displayName).charAt(0).toUpperCase();
  const appVersion = Constants.expoConfig?.version || "1.0.0";
  const panelTitle =
    activePanel === "password"
      ? "Password & Security"
      : activePanel === "notifications"
        ? "Notifications"
        : activePanel === "privacy"
          ? "Privacy"
          : activePanel === "storage"
            ? "Storage"
            : activePanel === "help"
              ? "Help Center"
              : activePanel === "about"
                ? "About"
                : "";

  const openEditProfile = useCallback(() => {
    setEditedName(displayName);
    setSelectedPhotoUri(null);
    setIsEditProfileOpen(true);
  }, [displayName]);

  const closeEditProfile = useCallback(() => {
    setIsEditProfileOpen(false);
    setEditedName(displayName);
    setSelectedPhotoUri(null);
  }, [displayName]);

  const handlePickProfilePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Photo access needed",
        "Please enable photo library access to choose a profile image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setSelectedPhotoUri(result.assets[0].uri);
    }
  }, []);

  const handleSaveProfile = useCallback(async () => {
    if (!user?.id) {
      Alert.alert("Unable to update profile", "Please sign in again and try once more.");
      return;
    }

    const trimmedName = editedName.trim();

    if (!trimmedName) {
      Alert.alert("Name required", "Please enter a name for your profile.");
      return;
    }

    setIsSavingProfile(true);

    try {
      const profileUpdates: { displayName: string; avatarUrl?: string } = {
        displayName: trimmedName,
      };

      if (selectedPhotoUri) {
        const uploadResult = await authApi.uploadProfilePhoto(user.id, selectedPhotoUri);

        if (!uploadResult.success || !uploadResult.data) {
          throw uploadResult.error || new Error("Failed to upload profile photo");
        }

        profileUpdates.avatarUrl = uploadResult.data;
      }

      const updateResult = await authApi.updateProfile(user.id, profileUpdates);

      if (!updateResult.success || !updateResult.data) {
        throw updateResult.error || new Error("Failed to update profile");
      }

      setUser(updateResult.data);
      setSelectedPhotoUri(null);
      setIsEditProfileOpen(false);
    } catch (error: any) {
      Alert.alert(
        "Unable to save profile",
        error?.message || "Please try again in a moment.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  }, [editedName, selectedPhotoUri, setUser, user]);

  const openPanel = useCallback((panel: SettingsPanel) => {
    setActivePanel(panel);
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  const handlePasswordReset = useCallback(async () => {
    if (!user?.email) {
      Alert.alert("Email unavailable", "We couldn't find a sign-in email for this account.");
      return;
    }

    setIsSendingPasswordReset(true);

    try {
      const result = await authApi.resetPassword(user.email);

      if (!result.success) {
        throw result.error || new Error("Unable to send reset email");
      }

      Alert.alert(
        "Reset email sent",
        `We sent password reset instructions to ${user.email}.`,
      );
    } catch (error: any) {
      Alert.alert(
        "Unable to send reset email",
        error?.message || "Please try again in a moment.",
      );
    } finally {
      setIsSendingPasswordReset(false);
    }
  }, [user?.email]);

  useEffect(() => {
    let isMounted = true;

    const loadLocalSettings = async () => {
      try {
        const storedValue = await settingsStorage.getItem(SETTINGS_PREFERENCES_KEY);

        if (!isMounted) {
          return;
        }

        if (!storedValue) {
          setLocalSettings(DEFAULT_LOCAL_SETTINGS);
          setHasLoadedLocalSettings(true);
          return;
        }

        const parsed = JSON.parse(storedValue) as Partial<LocalSettingsPreferences>;

        setLocalSettings({
          dailyReminders:
            typeof parsed.dailyReminders === "boolean"
              ? parsed.dailyReminders
              : DEFAULT_LOCAL_SETTINGS.dailyReminders,
          weeklyReflection:
            typeof parsed.weeklyReflection === "boolean"
              ? parsed.weeklyReflection
              : DEFAULT_LOCAL_SETTINGS.weeklyReflection,
        });
      } catch (error) {
        console.warn("Failed to load local settings preferences", error);
        if (isMounted) {
          setLocalSettings(DEFAULT_LOCAL_SETTINGS);
        }
      } finally {
        if (isMounted) {
          setHasLoadedLocalSettings(true);
        }
      }
    };

    loadLocalSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedLocalSettings) {
      return;
    }

    settingsStorage
      .setItem(SETTINGS_PREFERENCES_KEY, JSON.stringify(localSettings))
      .catch((error) => {
        console.warn("Failed to persist local settings preferences", error);
      });
  }, [hasLoadedLocalSettings, localSettings]);

  const settingsOptions = useMemo(
    () => [
      {
        title: "Personal Information",
        subtitle: "",
        onPress: openEditProfile,
      },
      {
        title: "Password & Security",
        subtitle: "",
        onPress: () => openPanel("password"),
      },
      {
        title: "Notifications",
        subtitle: "Reminders and alerts",
        onPress: () => openPanel("notifications"),
      },
      {
        title: "Privacy",
        subtitle: "Data and permissions",
        onPress: () => openPanel("privacy"),
      },
      {
        title: "Storage",
        subtitle: "Manage your data",
        onPress: () => openPanel("storage"),
      },
      {
        title: "Help Center",
        subtitle: "",
        onPress: () => openPanel("help"),
      },
      {
        title: "About",
        subtitle: `Version ${appVersion}`,
        onPress: () => openPanel("about"),
      },
    ],
    [appVersion, openEditProfile, openPanel],
  );

  const panelContent = useMemo(() => {
    if (!activePanel) {
      return null;
    }

    if (activePanel === "password") {
      return (
        <View style={styles.panelBody}>
          <Text style={[theme.typography.body, styles.panelCopy, { color: PAGE_MUTED }]}>
            Use your sign-in email to receive a secure password reset link.
          </Text>
          <View style={[styles.infoCard, { backgroundColor: "#F8F6F2", borderColor: PAGE_BORDER }]}>
            <Text style={[theme.typography.labelSm, styles.infoLabel, { color: PAGE_MUTED }]}>
              SIGN-IN EMAIL
            </Text>
            <Text style={[styles.infoValue, { color: PAGE_TEXT }]}>
              {user?.email || "No email available"}
            </Text>
          </View>
          <Button
            label={isSendingPasswordReset ? "Sending..." : "Send reset email"}
            onPress={handlePasswordReset}
            disabled={isSendingPasswordReset || !user?.email}
            variant="primary"
            style={[styles.panelPrimaryButton, { backgroundColor: PAGE_SECONDARY }]}
            textStyle={styles.panelPrimaryButtonText}
          />
        </View>
      );
    }

    if (activePanel === "notifications") {
      return (
        <View style={styles.panelBody}>
          <Text style={[theme.typography.body, styles.panelCopy, { color: PAGE_MUTED }]}>
            These reminders are stored on this device for now, so you can keep the experience gentle without setting up extra backend preferences.
          </Text>
          <View style={styles.preferenceList}>
            <View style={[styles.preferenceRow, { backgroundColor: "#F8F6F2", borderColor: PAGE_BORDER }]}>
              <View style={styles.preferenceTextBlock}>
                <Text style={[styles.preferenceTitle, { color: PAGE_TEXT }]}>Daily reminders</Text>
                <Text style={[theme.typography.bodySm, { color: PAGE_MUTED }]}>
                  Gentle prompts to capture a moment from your day.
                </Text>
              </View>
              <Switch
                value={localSettings.dailyReminders}
                onValueChange={(value) =>
                  setLocalSettings((current) => ({ ...current, dailyReminders: value }))
                }
                trackColor={{ false: "#D8D2CA", true: PAGE_PRIMARY }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={[styles.preferenceRow, { backgroundColor: "#F8F6F2", borderColor: PAGE_BORDER }]}>
              <View style={styles.preferenceTextBlock}>
                <Text style={[styles.preferenceTitle, { color: PAGE_TEXT }]}>Weekly reflection prompts</Text>
                <Text style={[theme.typography.bodySm, { color: PAGE_MUTED }]}>
                  A softer weekly nudge to revisit your recent entries.
                </Text>
              </View>
              <Switch
                value={localSettings.weeklyReflection}
                onValueChange={(value) =>
                  setLocalSettings((current) => ({ ...current, weeklyReflection: value }))
                }
                trackColor={{ false: "#D8D2CA", true: PAGE_PRIMARY }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>
      );
    }

    if (activePanel === "privacy") {
      return (
        <View style={styles.panelBody}>
          <Text style={[theme.typography.body, styles.panelCopy, { color: PAGE_MUTED }]}>
            Your profile and journal content stay tied to your signed-in account, and private entry media is protected behind signed access.
          </Text>
          <View style={[styles.infoCard, { backgroundColor: "#F8F6F2", borderColor: PAGE_BORDER }]}>
            <Text style={[theme.typography.labelSm, styles.infoLabel, { color: PAGE_MUTED }]}>
              ACCOUNT
            </Text>
            <Text style={[styles.infoValue, { color: PAGE_TEXT }]}>
              {user?.email || "No email available"}
            </Text>
          </View>
          <Text style={[theme.typography.bodySm, styles.bulletText, { color: PAGE_MUTED }]}>
            • Profile edits sync to your account.
          </Text>
          <Text style={[theme.typography.bodySm, styles.bulletText, { color: PAGE_MUTED }]}>
            • Entry photos and audio are stored privately and shared through signed URLs.
          </Text>
          <Text style={[theme.typography.bodySm, styles.bulletText, { color: PAGE_MUTED }]}>
            • Notification choices in this version stay on this device.
          </Text>
          <Button
            label={isLoading ? "Signing out..." : "Sign out"}
            onPress={logout}
            variant="outline"
            style={[styles.panelSecondaryButton, { borderColor: PAGE_BORDER }]}
            textStyle={{ color: PAGE_SECONDARY, fontWeight: "700" }}
          />
        </View>
      );
    }

    if (activePanel === "storage") {
      return (
        <View style={styles.panelBody}>
          <Text style={[theme.typography.body, styles.panelCopy, { color: PAGE_MUTED }]}>
            Life Drawer keeps your core journal data in your account and a small set of preferences on this device to keep the app feeling personal.
          </Text>
          <View style={styles.preferenceList}>
            <View style={[styles.storageCard, { backgroundColor: "#F8F6F2", borderColor: PAGE_BORDER }]}>
              <Text style={[styles.preferenceTitle, { color: PAGE_TEXT }]}>Account data</Text>
              <Text style={[theme.typography.bodySm, { color: PAGE_MUTED }]}>
                Profile details, entries, tags, and drawers stay with your account.
              </Text>
            </View>
            <View style={[styles.storageCard, { backgroundColor: "#F8F6F2", borderColor: PAGE_BORDER }]}>
              <Text style={[styles.preferenceTitle, { color: PAGE_TEXT }]}>This device</Text>
              <Text style={[theme.typography.bodySm, { color: PAGE_MUTED }]}>
                Reminder choices are saved locally so they stay lightweight and fast.
              </Text>
            </View>
          </View>
        </View>
      );
    }

    if (activePanel === "help") {
      return (
        <View style={styles.panelBody}>
          <Text style={[theme.typography.body, styles.panelCopy, { color: PAGE_MUTED }]}>
            A few quick ways to get unstuck inside Life Drawer.
          </Text>
          <Text style={[theme.typography.bodySm, styles.bulletText, { color: PAGE_MUTED }]}>
            • Use Personal Information to update your name or profile photo.
          </Text>
          <Text style={[theme.typography.bodySm, styles.bulletText, { color: PAGE_MUTED }]}>
            • Use Password &amp; Security to send yourself a reset email.
          </Text>
          <Text style={[theme.typography.bodySm, styles.bulletText, { color: PAGE_MUTED }]}>
            • Use Storage and Privacy to review how your data is handled in this version.
          </Text>
          <View style={[styles.infoCard, { backgroundColor: "#F8F6F2", borderColor: PAGE_BORDER }]}>
            <Text style={[theme.typography.labelSm, styles.infoLabel, { color: PAGE_MUTED }]}>
              SUPPORT TIP
            </Text>
            <Text style={[theme.typography.bodySm, { color: PAGE_TEXT }]}>
              If something looks off after an update, signing out and back in usually refreshes your account state cleanly.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.panelBody}>
        <Text style={[theme.typography.body, styles.panelCopy, { color: PAGE_MUTED }]}>
          Life Drawer is currently running version {appVersion}.
        </Text>
        <View style={[styles.infoCard, { backgroundColor: "#F8F6F2", borderColor: PAGE_BORDER }]}>
          <Text style={[theme.typography.labelSm, styles.infoLabel, { color: PAGE_MUTED }]}>
            VERSION
          </Text>
          <Text style={[styles.infoValue, { color: PAGE_TEXT }]}>v{appVersion}</Text>
        </View>
        <Text style={[theme.typography.bodySm, styles.bulletText, { color: PAGE_MUTED }]}>
          Built to help you capture memories, moods, and meaning across the moments that matter.
        </Text>
      </View>
    );
  }, [
    activePanel,
    appVersion,
    handlePasswordReset,
    isLoading,
    isSendingPasswordReset,
    localSettings.dailyReminders,
    localSettings.weeklyReflection,
    logout,
    theme.typography.body,
    theme.typography.bodySm,
    theme.typography.labelSm,
    user?.email,
  ]);

  return (
    <SafeArea>
      <Screen style={[styles.container, { backgroundColor: PAGE_BACKGROUND }]}>
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
                styles.heroTitlePrimary,
                { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
              ]}
            >
              Account &{" "}
              <Text style={[styles.heroTitleSecondary, { color: PAGE_PRIMARY }]}>
                Settings
              </Text>
            </Text>
          </View>

          <SectionHeader
            label="Account"
            textColor={PAGE_MUTED}
            dividerColor={theme.colors.accent1}
          />

          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: PAGE_SURFACE,
                borderColor: PAGE_BORDER,
                shadowColor: PAGE_TEXT,
              },
            ]}
          >
            <View style={styles.profileTopRow}>
              {profileImageUri ? (
                <Image
                  source={{ uri: profileImageUri }}
                  style={[
                    styles.avatarCircle,
                    { borderColor: theme.colors.accent2 },
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.avatarCircle,
                    {
                      backgroundColor: theme.colors.accent1,
                      borderColor: theme.colors.accent2,
                    },
                  ]}
                >
                  <Text
                    style={[styles.avatarText, { color: PAGE_SECONDARY }]}
                  >
                    {avatarLetter}
                  </Text>
                </View>
              )}
              <View style={styles.profileText}>
                <Text
                  style={[
                    styles.profileName,
                    { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
                  ]}
                >
                  {displayName}
                </Text>
                <Text
                  style={[
                    theme.typography.body,
                    { color: PAGE_MUTED },
                  ]}
                >
                  {user?.email || "No email available"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryAction,
                {
                  backgroundColor: PAGE_PRIMARY,
                  shadowColor: PAGE_TEXT,
                },
              ]}
              onPress={openEditProfile}
              accessible
              accessibilityLabel="Edit profile"
            >
              <View style={styles.primaryActionIconBox}>
                <MaterialCommunityIcons
                  name="account-edit-outline"
                  size={22}
                  color="#F8F6F2"
                />
              </View>
              <View style={styles.primaryActionCopy}>
                <Text
                  style={[
                    styles.primaryActionText,
                    { fontFamily: theme.fonts.serif },
                  ]}
                >
                  Edit Profile
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <SectionHeader
            label="App Settings"
            textColor={PAGE_MUTED}
            dividerColor={theme.colors.accent1}
          />

          <View style={styles.optionList}>
            {settingsOptions.map(({ title, subtitle, onPress }) => (
              <TouchableOpacity
                key={title}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: PAGE_SURFACE,
                    shadowColor: PAGE_TEXT,
                  },
                ]}
                onPress={onPress}
              >
                <View style={styles.optionTextBlock}>
                  <Text style={[styles.optionTitle, { color: PAGE_TEXT }]}>{title}</Text>
                  {subtitle ? (
                    <Text
                      style={[
                        theme.typography.body,
                        { color: PAGE_MUTED },
                      ]}
                    >
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={PAGE_MUTED}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.signOutButton,
              {
                backgroundColor: PAGE_SECONDARY,
                shadowColor: PAGE_TEXT,
              },
            ]}
            onPress={logout}
            accessible
            accessibilityLabel="Sign out"
          >
            <Text style={styles.signOutButtonText}>
              {isLoading ? "Signing out..." : "Sign Out"}
            </Text>
          </TouchableOpacity>

          <View style={styles.helperPanel}>
            <Text
              style={[
                styles.helperText,
                {
                  color: PAGE_MUTED,
                  fontFamily: theme.fonts.serif,
                },
              ]}
            >
              Keep your account details, privacy choices, and app preferences aligned with the season of life you&apos;re in.
            </Text>
          </View>
        </ScrollView>

        <Modal
          visible={isEditProfileOpen}
          onClose={closeEditProfile}
          animationType="fade"
          backdropStyle={styles.editModalBackdrop}
          contentStyle={{
            ...styles.editModalContent,
            backgroundColor: PAGE_SURFACE,
          }}
        >
          <View style={styles.editModalHeader}>
            <Text
              style={[
                styles.editModalTitle,
                { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
              ]}
            >
              Edit profile
            </Text>
            <TouchableOpacity
              onPress={closeEditProfile}
              style={styles.editModalCloseButton}
              accessibilityRole="button"
              accessibilityLabel="Close edit profile"
            >
              <MaterialCommunityIcons name="close" size={28} color={PAGE_BORDER} />
            </TouchableOpacity>
          </View>

          <View style={styles.editAvatarBlock}>
            {editorImageUri ? (
              <Image
                source={{ uri: editorImageUri }}
                style={[
                  styles.editAvatarCircle,
                  { borderColor: theme.colors.accent2 },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.editAvatarCircle,
                  {
                    backgroundColor: theme.colors.accent1,
                    borderColor: theme.colors.accent2,
                  },
                ]}
              >
                <Text style={[styles.avatarText, { color: PAGE_SECONDARY }]}>
                  {editorAvatarLetter}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.changePhotoButton,
                {
                  backgroundColor: PAGE_PRIMARY,
                  borderColor: theme.colors.accent2,
                },
              ]}
              onPress={handlePickProfilePhoto}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
            >
              <Text style={[styles.changePhotoText, { color: "#F8F6F2" }]}>
                Change photo
              </Text>
            </TouchableOpacity>
            <Text style={[styles.changePhotoHint, { color: PAGE_MUTED }]}>
              Choose a square photo or illustration for your profile.
            </Text>
          </View>

          <View style={styles.editFieldBlock}>
            <Text style={[theme.typography.labelSm, styles.editFieldLabel, { color: PAGE_TEXT }]}>
              DISPLAY NAME
            </Text>
            <TextInput
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Your name"
              placeholderTextColor={PAGE_MUTED}
              style={[
                styles.editFieldInput,
                {
                  backgroundColor: "#F8F6F2",
                  color: PAGE_TEXT,
                  shadowColor: PAGE_TEXT,
                },
              ]}
              accessibilityLabel="Display name input"
            />
          </View>

          <View style={styles.editActions}>
            <Button
              label="Cancel"
              onPress={closeEditProfile}
              variant="outline"
              style={[
                styles.editSecondaryButton,
                { borderRadius: 999, borderColor: PAGE_BORDER },
              ]}
              textStyle={{ color: PAGE_SECONDARY, fontWeight: "700" }}
            />
            <Button
              label={isSavingProfile ? "Saving..." : "Save"}
              onPress={handleSaveProfile}
              disabled={isSavingProfile}
              variant="primary"
              style={[
                styles.editPrimaryButton,
                { borderRadius: 999, backgroundColor: PAGE_SECONDARY },
              ]}
              textStyle={{ color: "#FFFFFF", fontWeight: "700" }}
            />
          </View>
        </Modal>

        <Modal
          visible={!!activePanel}
          onClose={closePanel}
          animationType="fade"
          backdropStyle={styles.editModalBackdrop}
          contentStyle={{
            ...styles.editModalContent,
            backgroundColor: PAGE_SURFACE,
          }}
        >
          <View style={styles.editModalHeader}>
            <Text
              style={[
                styles.editModalTitle,
                { color: PAGE_TEXT, fontFamily: theme.fonts.serif },
              ]}
            >
              {panelTitle}
            </Text>
            <TouchableOpacity
              onPress={closePanel}
              style={styles.editModalCloseButton}
              accessibilityRole="button"
              accessibilityLabel={`Close ${panelTitle}`}
            >
              <MaterialCommunityIcons name="close" size={28} color={PAGE_BORDER} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.panelScrollContent}
          >
            {panelContent}
          </ScrollView>
        </Modal>

        <AppBottomNav currentRoute="/settings" />
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
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  sectionHeaderText: {
    textTransform: "uppercase",
    letterSpacing: 2.6,
    fontSize: 12,
    fontWeight: "600",
    marginRight: 14,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    opacity: 0.7,
  },
  profileCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 28,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "600",
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "300",
    marginBottom: 6,
  },
  primaryAction: {
    minHeight: 70,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  primaryActionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  primaryActionCopy: {
    flex: 1,
  },
  primaryActionText: {
    color: "#F8F6F2",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "300",
  },
  editModalBackdrop: {
    padding: 24,
    backgroundColor: "rgba(47, 41, 36, 0.28)",
  },
  editModalContent: {
    width: "100%",
    borderRadius: 28,
    padding: 24,
  },
  editModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  editModalTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "400",
  },
  editModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  editAvatarBlock: {
    alignItems: "center",
    marginBottom: 22,
  },
  editAvatarCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
  },
  changePhotoButton: {
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: "600",
  },
  changePhotoHint: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  editFieldBlock: {
    marginBottom: 22,
  },
  editFieldLabel: {
    letterSpacing: 2.2,
    marginBottom: 8,
  },
  editFieldInput: {
    minHeight: 64,
    borderRadius: 18,
    paddingHorizontal: 18,
    fontSize: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
  },
  editSecondaryButton: {
    flex: 1,
    minHeight: 54,
    backgroundColor: PAGE_SURFACE,
  },
  editPrimaryButton: {
    flex: 1,
    minHeight: 54,
  },
  optionList: {
    gap: 18,
  },
  optionCard: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  optionTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    marginBottom: 4,
  },
  signOutButton: {
    minHeight: 76,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    marginTop: 28,
  },
  signOutButtonText: {
    color: "#F8F6F2",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  helperPanel: {
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  helperText: {
    lineHeight: 28,
    textAlign: "center",
    fontSize: 18,
    fontStyle: "italic",
  },
  panelScrollContent: {
    paddingBottom: 4,
  },
  panelBody: {
    gap: 16,
  },
  panelCopy: {
    lineHeight: 24,
  },
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  infoLabel: {
    letterSpacing: 2,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  panelPrimaryButton: {
    minHeight: 54,
    borderRadius: 999,
  },
  panelPrimaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  panelSecondaryButton: {
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: PAGE_SURFACE,
  },
  preferenceList: {
    gap: 12,
  },
  preferenceRow: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  preferenceTextBlock: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    marginBottom: 4,
  },
  storageCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  bulletText: {
    lineHeight: 22,
  },
});
