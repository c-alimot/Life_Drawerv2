import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeArea, Screen } from "@components/layout";
import { useTheme } from "@styles/theme";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const INTRO_BACKGROUND = "#EDEAE4";
const INTRO_TEXT = "#2F2924";
const INTRO_SUPPORTING_BROWN = "#5A4C3F";

const FEATURES = [
  "Capture life's moments",
  "Organize memories",
  "Reflect and discover",
];

const FEATURE_DETAILS = [
  "Turn fleeting thoughts into lasting reflections.",
  "Keep memories ordered in a calmer way.",
  "Notice patterns across your story over time.",
];

const FEATURE_ICONS = [
  "notebook-edit-outline",
  "archive-outline",
  "eye-outline",
] as const;

export function IntroScreen() {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(1)).current;
  const { width, height } = useWindowDimensions();
  const isCompactViewport = width < 430 || height < 780;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.008,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  return (
    <SafeArea backgroundColor={INTRO_BACKGROUND}>
      <Screen
        style={[
          styles.container,
          { backgroundColor: INTRO_BACKGROUND },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: isCompactViewport ? 28 : 44 },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
        <View style={styles.content}>
          <View style={styles.hero}>
            <View
              style={[
                styles.logoWrap,
              ]}
            >
              <Image
                source={require("../../../../assets/images/LDLOGO.png")}
                style={styles.logo}
                resizeMode="contain"
                accessible
                accessibilityLabel="Life Drawer logo"
              />
            </View>

            <Text
              style={[
                styles.title,
                {
                  color: INTRO_TEXT,
                  fontFamily: theme.fonts.serif,
                },
              ]}
            >
              Life Drawer
            </Text>

            <Text
              style={[
                theme.typography.body,
                styles.subtitle,
                { color: INTRO_TEXT },
              ]}
            >
              A quiet place for the moments that matter most
            </Text>
          </View>

          <View style={styles.featureList}>
            {FEATURES.map((feature, index) => (
              <View
                key={feature}
                style={[
                  styles.featureCard,
                  {
                    backgroundColor: "#FFFFFF",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={FEATURE_ICONS[index]}
                  size={22}
                  color={theme.colors.secondary}
                  style={styles.featureIcon}
                />
                <View style={styles.featureTextBlock}>
                  <Text
                    style={[
                      theme.typography.body,
                      styles.featureTitle,
                      {
                        color: INTRO_TEXT,
                        fontFamily: theme.fonts.sans,
                      },
                    ]}
                  >
                    {feature}
                  </Text>
                  <Text
                    style={[
                      theme.typography.body,
                      styles.featureText,
                      { color: INTRO_TEXT },
                    ]}
                  >
                    {FEATURE_DETAILS[index]}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Animated.View
              style={[
                styles.primaryButtonWrap,
                { transform: [{ scale: pulse }] },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => router.push("/signup")}
                accessible
                accessibilityLabel="Create account"
                accessibilityRole="button"
              >
                <Text
                  style={[
                    theme.typography.body,
                    styles.primaryButtonText,
                    {
                      color: theme.colors.text,
                      fontFamily: theme.fonts.sans,
                    },
                  ]}
                >
                  CREATE ACCOUNT
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  borderColor: theme.colors.primary,
                  backgroundColor: "transparent",
                },
              ]}
              onPress={() => router.push("/login")}
              accessible
              accessibilityLabel="Sign in"
              accessibilityRole="button"
            >
                <Text
                style={[
                  theme.typography.body,
                  styles.secondaryButtonText,
                  {
                    color: INTRO_SUPPORTING_BROWN,
                    fontFamily: theme.fonts.sans,
                  },
                ]}
              >
                SIGN IN
              </Text>
            </TouchableOpacity>

            <View style={styles.reassurance}>
              <Text
                style={[
                  theme.typography.body,
                  styles.reassuranceHeading,
                  { color: INTRO_SUPPORTING_BROWN },
                ]}
              >
                No pressure, no streaks
              </Text>
              <Text
                style={[
                  theme.typography.bodySm,
                  styles.reassuranceText,
                  { color: INTRO_SUPPORTING_BROWN },
                ]}
              >
                Your thoughts stay private and connected
              </Text>
            </View>
          </View>
        </View>
        </ScrollView>
      </Screen>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 6,
    justifyContent: "center",
    minHeight: "100%",
  },
  hero: {
    alignItems: "center",
    marginBottom: 18,
    minHeight: 170,
    justifyContent: "flex-end",
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  logo: {
    width: 104,
    height: 104,
  },
  title: {
    fontSize: 38,
    lineHeight: 44,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 24,
    marginBottom: 18,
  },
  featureList: {
    gap: 14,
    marginBottom: 22,
  },
  featureCard: {
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#D8D0C6",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  featureIcon: {
    width: 28,
    marginRight: 14,
  },
  featureTextBlock: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 22,
  },
  actions: {
    gap: 10,
    marginTop: 6,
  },
  primaryButtonWrap: {
    width: "100%",
  },
  primaryButton: {
    minHeight: 66,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 2.2,
  },
  secondaryButton: {
    minHeight: 66,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 2.2,
  },
  reassurance: {
    alignItems: "center",
    marginTop: 10,
  },
  reassuranceHeading: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  reassuranceText: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
  },
});
