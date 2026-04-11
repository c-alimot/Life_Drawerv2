import { useLogout } from "@features/auth/hooks/useLogout";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@styles/theme";
import { router } from "expo-router";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type MenuRoute =
  | "/"
  | "/search"
  | "/life-phases"
  | "/drawers"
  | "/tags"
  | "/insights"
  | "/settings";

interface AppSideMenuProps {
  visible: boolean;
  onClose: () => void;
  currentRoute: MenuRoute;
}

const MENU_BACKGROUND = "#EDEAE4";
const MENU_TEXT = "#2F2924";
const MENU_MUTED = "#6F6860";
const MENU_SECONDARY = "#556950";
const MENU_BORDER = "#B39C87";
const MENU_DIVIDER = "#DAC8B1";

const MENU_ITEMS: {
  label: string;
  route: MenuRoute;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { label: "Home", route: "/", icon: "home-outline" },
  { label: "Tags", route: "/tags", icon: "tag-outline" },
  {
    label: "Account & Settings",
    route: "/settings",
    icon: "cog-outline",
  },
];

export function AppSideMenu({
  visible,
  onClose,
  currentRoute,
}: AppSideMenuProps) {
  const theme = useTheme();
  const { logout } = useLogout();

  const navigateTo = (route: MenuRoute) => {
    onClose();
    if (route === currentRoute) {
      return;
    }
    router.push(route);
  };

  const handleHelpSupport = () => {
    onClose();
    Alert.alert(
      "Help & Support",
      "Help and support options will live here next. For now, use Account & Settings from the menu.",
    );
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.menuOverlay}>
        <View
          style={[
            styles.menuPanel,
            {
              backgroundColor: MENU_BACKGROUND,
              borderRightColor: MENU_BORDER,
            },
          ]}
        >
          <View style={styles.menuHeader}>
            <TouchableOpacity
              onPress={onClose}
              accessible
              accessibilityLabel="Close menu"
              accessibilityRole="button"
            >
              <Text style={[styles.menuClose, { color: MENU_TEXT }]}>
                ×
              </Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.menuTitle,
                { color: MENU_TEXT, fontFamily: theme.fonts.serif },
              ]}
            >
              Menu
            </Text>
          </View>

          {MENU_ITEMS.map((item) => {
            const isActive = item.route === currentRoute;

            return (
              <TouchableOpacity
                key={item.route}
                style={styles.menuRow}
                onPress={() => navigateTo(item.route)}
                accessible
                accessibilityLabel={item.label}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={30}
                  color={isActive ? MENU_SECONDARY : MENU_MUTED}
                  style={styles.menuRowIcon}
                />
                <Text
                  style={[
                    theme.typography.body,
                    styles.menuRowText,
                    {
                      color: isActive ? MENU_SECONDARY : MENU_MUTED,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.menuFooter}>
            <View
              style={[
                styles.menuDivider,
                { backgroundColor: MENU_DIVIDER },
              ]}
            />
            <TouchableOpacity
              style={styles.menuRow}
              onPress={handleHelpSupport}
              accessible
              accessibilityLabel="Help and support"
            >
              <MaterialCommunityIcons
                name="help-circle-outline"
                size={30}
                color={MENU_MUTED}
                style={styles.menuRowIcon}
              />
              <Text
                style={[
                  theme.typography.body,
                  styles.menuRowText,
                  { color: MENU_MUTED },
                ]}
              >
                Help & Support
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={handleLogout}
              accessible
              accessibilityLabel="Log out"
            >
              <MaterialCommunityIcons
                name="logout"
                size={30}
                color={MENU_MUTED}
                style={styles.menuRowIcon}
              />
              <Text
                style={[
                  theme.typography.body,
                  styles.menuRowText,
                  { color: MENU_MUTED },
                ]}
              >
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Pressable style={styles.menuBackdrop} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menuOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  menuPanel: {
    width: "86%",
    maxWidth: 360,
    paddingLeft: 30,
    paddingRight: 22,
    paddingTop: 40,
    paddingBottom: 28,
    borderRightWidth: 1,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  menuClose: {
    fontSize: 34,
    lineHeight: 34,
    marginRight: 16,
  },
  menuTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "500",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
  },
  menuRowIcon: {
    width: 40,
    textAlign: "center",
    marginRight: 14,
  },
  menuRowText: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "400",
  },
  menuFooter: {
    flex: 1,
    justifyContent: "flex-end",
  },
  menuDivider: {
    height: 1,
    marginTop: 10,
    marginBottom: 18,
  },
});
