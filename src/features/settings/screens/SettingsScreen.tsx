import { AppBottomNav, AppSideMenu, SafeArea, Screen } from "@components/layout";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLogout } from "@features/auth/hooks/useLogout";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "@store";
import { useTheme } from "@styles/theme";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const { user } = useAuthStore();
  const { activePhase, fetchActivePhase } = useLifePhase();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const displayName =
    user?.displayName?.trim() ||
    user?.email.split("@")[0]?.replace(/[._-]+/g, " ") ||
    "Life Drawer User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleSetLifePhase = useCallback(() => {
    router.push("/life-phases");
  }, []);

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
              onPress={() => router.replace("/")}
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
    minHeight: 92,
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
  primaryActionText: {
    color: "#F8F6F2",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "300",
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
