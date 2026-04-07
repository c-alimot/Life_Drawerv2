import { AppBottomNav, AppSideMenu, SafeArea, Screen } from "@components/layout";
import { Button, Modal } from "@components/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { authApi } from "@features/auth/api/auth.api";
import { useLogout } from "@features/auth/hooks/useLogout";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "@store";
import { useTheme } from "@styles/theme";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLifePhase } from "../../home/hooks/useLifePhase";

const PAGE_BACKGROUND = "#EDEAE4";
const PAGE_SURFACE = "#FFFFFF";
const PAGE_TEXT = "#2F2924";
const PAGE_MUTED = "#6F6860";
const PAGE_PRIMARY = "#8C9A7F";
const PAGE_SECONDARY = "#556950";
const PAGE_BORDER = "#B39C87";

export function SettingsScreen() {
  const theme = useTheme();
  const { logout, isLoading } = useLogout();
  const { user, setUser } = useAuthStore();
  const { activePhase, fetchActivePhase } = useLifePhase();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const displayName =
    user?.displayName?.trim() ||
    user?.email.split("@")[0]?.replace(/[._-]+/g, " ") ||
    "Life Drawer User";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const profileImageUri = user?.avatarUrl;
  const editorImageUri = selectedPhotoUri || user?.avatarUrl;
  const editorAvatarLetter = (editedName.trim() || displayName).charAt(0).toUpperCase();

  const handleSetLifePhase = useCallback(() => {
    router.push("/life-phases");
  }, []);

  const openEditProfile = useCallback(() => {
    setEditedName(displayName);
    setSelectedPhotoUri(user?.avatarUrl ?? null);
    setIsEditProfileOpen(true);
  }, [displayName, user?.avatarUrl]);

  const closeEditProfile = useCallback(() => {
    setIsEditProfileOpen(false);
    setEditedName(displayName);
    setSelectedPhotoUri(user?.avatarUrl ?? null);
  }, [displayName, user?.avatarUrl]);

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
      let nextAvatarUrl = user.avatarUrl;

      if (selectedPhotoUri && selectedPhotoUri !== user.avatarUrl) {
        const uploadResult = await authApi.uploadProfilePhoto(user.id, selectedPhotoUri);

        if (!uploadResult.success || !uploadResult.data) {
          throw uploadResult.error || new Error("Failed to upload profile photo");
        }

        nextAvatarUrl = uploadResult.data;
      }

      const updateResult = await authApi.updateProfile(user.id, {
        displayName: trimmedName,
        avatarUrl: nextAvatarUrl,
      });

      if (!updateResult.success || !updateResult.data) {
        throw updateResult.error || new Error("Failed to update profile");
      }

      setUser(updateResult.data);
      setSelectedPhotoUri(updateResult.data.avatarUrl ?? null);
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

  useFocusEffect(
    useCallback(() => {
      fetchActivePhase();
    }, [fetchActivePhase]),
  );

  return (
    <SafeArea>
      <Screen style={[styles.container, { backgroundColor: PAGE_BACKGROUND }]}>
        <AppSideMenu
          visible={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          currentRoute="/settings"
        />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => setIsMenuOpen(true)}
              style={styles.headerIconButton}
            >
              <MaterialCommunityIcons name="menu" size={34} color={PAGE_TEXT} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSetLifePhase}
              accessible
              accessibilityLabel={
                activePhase
                  ? `Current life phase: ${activePhase.name}`
                  : "Set life phase"
              }
              accessibilityHint="Tap to set or change your current life phase"
            >
              <Text
                style={[
                  styles.pageTitle,
                  { color: PAGE_MUTED, fontWeight: "300" },
                ]}
              >
                {activePhase ? activePhase.name : "Set Life Phase"}
              </Text>
            </TouchableOpacity>
          </View>
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

          <View style={styles.sectionHeaderRow}>
            <Text
              style={[
                theme.typography.bodySm,
                styles.sectionHeaderText,
                { color: PAGE_MUTED },
              ]}
            >
              Account
            </Text>
            <View
              style={[
                styles.sectionDivider,
                { backgroundColor: theme.colors.accent1 },
              ]}
            />
          </View>

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

          <View style={styles.sectionHeaderRow}>
            <Text
              style={[
                theme.typography.bodySm,
                styles.sectionHeaderText,
                { color: PAGE_MUTED },
              ]}
            >
              App Settings
            </Text>
            <View
              style={[
                styles.sectionDivider,
                { backgroundColor: theme.colors.accent1 },
              ]}
            />
          </View>

          <View style={styles.optionList}>
            {[
              ["Personal Information", ""],
              ["Password & Security", ""],
              ["Notifications", "Reminders and alerts"],
              ["Privacy", "Data and permissions"],
              ["Storage", "Manage your data"],
              ["Help Center", ""],
              ["About", "Version 1.0.0"],
            ].map(([title, subtitle]) => (
              <TouchableOpacity
                key={title}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: PAGE_SURFACE,
                    shadowColor: PAGE_TEXT,
                  },
                ]}
                onPress={() => router.replace("/")}
              >
                <View style={styles.optionTextBlock}>
                    <Text style={[styles.optionTitle, { color: PAGE_TEXT }]}>
                      {title}
                    </Text>
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
          contentStyle={[
            styles.editModalContent,
            { backgroundColor: PAGE_SURFACE },
          ]}
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
  pageTitle: {
    marginLeft: 12,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "300",
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
});
