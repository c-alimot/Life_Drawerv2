import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const NAV_BACKGROUND = "#F8F6F299";
const NAV_TEXT = "#8C9A7F";
const NAV_TEXT_ACTIVE = "#556950";
const NAV_CIRCLE = "#E6E2D8";
const NAV_ACTIVE_ACCENT = "#C8D1BE";
const NAV_PLUS = "#556950";
const NAV_PLUS_TEXT = "#FFFFFF";
const NAV_SHADOW = "#2F2924";

type NavRoute =
  | "/"
  | "/drawers"
  | "/insights"
  | "/search"
  | "/settings"
  | "/tags";

interface AppBottomNavProps {
  currentRoute: NavRoute;
}

const ITEMS: {
  label: string;
  route: NavRoute;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { label: "Home", route: "/", icon: "home" },
  { label: "Drawers", route: "/drawers", icon: "archive-outline" },
  { label: "Insights", route: "/insights", icon: "chart-box-outline" },
  { label: "Account", route: "/settings", icon: "cog-outline" },
];

export function AppBottomNav({ currentRoute }: AppBottomNavProps) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.container} pointerEvents="box-none">
        <BlurView
          intensity={36}
          tint="light"
          style={styles.blurLayer}
          pointerEvents="none"
        />
        <View style={styles.row} pointerEvents="auto">
          {ITEMS.slice(0, 2).map((item) => {
            const isActive = currentRoute === item.route;

            return (
              <TouchableOpacity
                key={item.route}
                style={styles.item}
                onPress={() => router.replace(item.route)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={[styles.itemInner, isActive && styles.itemInnerActive]}>
                  <View
                    style={[
                      styles.activeIndicator,
                      isActive && styles.activeIndicatorVisible,
                    ]}
                  />
                  <View style={[styles.iconCircle, isActive && styles.iconCircleActive]}>
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={32}
                      color={isActive ? NAV_TEXT_ACTIVE : NAV_TEXT}
                    />
                  </View>
                  <Text
                    style={[
                      styles.label,
                      isActive && styles.labelActive,
                      { color: isActive ? NAV_TEXT_ACTIVE : NAV_TEXT },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={styles.plusItem}>
            <TouchableOpacity
              style={styles.plusButton}
              onPress={() => router.push("/create-entry")}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Create new entry"
            >
              <Text style={styles.plusText}>+</Text>
            </TouchableOpacity>
          </View>

          {ITEMS.slice(2).map((item) => {
            const isActive = currentRoute === item.route;

            return (
              <TouchableOpacity
                key={item.route}
                style={styles.item}
                onPress={() => router.replace(item.route)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={[styles.itemInner, isActive && styles.itemInnerActive]}>
                  <View
                    style={[
                      styles.activeIndicator,
                      isActive && styles.activeIndicatorVisible,
                    ]}
                  />
                  <View style={[styles.iconCircle, isActive && styles.iconCircleActive]}>
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={32}
                      color={isActive ? NAV_TEXT_ACTIVE : NAV_TEXT}
                    />
                  </View>
                  <Text
                    style={[
                      styles.label,
                      isActive && styles.labelActive,
                      { color: isActive ? NAV_TEXT_ACTIVE : NAV_TEXT },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    borderRadius: 0,
    backgroundColor: NAV_BACKGROUND,
    overflow: "hidden",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    shadowColor: NAV_SHADOW,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 8,
  },
  blurLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  item: {
    width: 60,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  itemInner: {
    alignItems: "center",
    justifyContent: "flex-end",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 4,
    minWidth: 64,
  },
  itemInnerActive: {
    backgroundColor: NAV_CIRCLE,
  },
  plusItem: {
    width: 60,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  activeIndicator: {
    width: 18,
    height: 4,
    borderRadius: 999,
    backgroundColor: NAV_ACTIVE_ACCENT,
    opacity: 0,
    marginBottom: 5,
  },
  activeIndicatorVisible: {
    opacity: 1,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    marginBottom: 3,
  },
  iconCircleActive: {
    backgroundColor: NAV_CIRCLE,
  },
  label: {
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: "500",
    textAlign: "center",
  },
  labelActive: {
    fontWeight: "600",
  },
  plusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: NAV_PLUS,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: NAV_SHADOW,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  plusText: {
    color: NAV_PLUS_TEXT,
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "300",
    marginTop: -2,
  },
});
