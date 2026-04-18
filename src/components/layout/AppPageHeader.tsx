import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { AppHeaderBrand } from "./AppHeaderBrand";
import { useTheme } from "@styles/theme";

interface AppPageHeaderProps {
  showBack?: boolean;
  showSearch?: boolean;
  onSearchPress?: () => void;
  rightSlot?: React.ReactNode;
}

export function AppPageHeader({
  showBack = false,
  showSearch = true,
  onSearchPress,
  rightSlot,
}: AppPageHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          paddingHorizontal: theme.layout.screenPaddingX,
          paddingTop: theme.layout.headerPaddingTop,
          paddingBottom: theme.layout.headerPaddingBottom,
        },
      ]}
    >
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButton}
            accessible
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={30} color="#8C9A7F" />
          </TouchableOpacity>
        ) : null}
        <AppHeaderBrand />
      </View>

      {rightSlot ? (
        rightSlot
      ) : showSearch ? (
        <TouchableOpacity
          onPress={onSearchPress || (() => router.push("/search"))}
          style={styles.iconButton}
          accessible
          accessibilityLabel="Search entries"
        >
          <MaterialCommunityIcons name="magnify" size={32} color="#8C9A7F" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
