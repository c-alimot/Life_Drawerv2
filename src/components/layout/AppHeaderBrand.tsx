import { router } from "expo-router";
import { Image, StyleSheet, TouchableOpacity } from "react-native";

const HEADER_LOGO = require("../../../assets/images/LDLOGO-web-favicon-tight.png");

export function AppHeaderBrand() {
  return (
    <TouchableOpacity
      onPress={() => router.replace("/")}
      style={styles.button}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Go to home"
    >
      <Image source={HEADER_LOGO} style={styles.logo} resizeMode="contain" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 28,
    height: 28,
  },
});
