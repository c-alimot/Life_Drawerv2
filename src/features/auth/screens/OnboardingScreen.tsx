import { Screen } from "@components/layout";
import { useTheme } from "@styles/theme";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../../../constants/theme";
import { setOnboardingCompleted } from "../utils/onboarding";

const ONBOARDING_TEXT = "#2F2924";
const ONBOARDING_BACKGROUND = "#EDEAE4";

const ONBOARDING_SLIDES = [
  {
    id: 1,
    image: require("../../../../assets/images/featherpen.png"),
    title: "A calmer way to journal",
    description:
      "Life Drawer is a quiet space to capture thoughts, memories, and everyday moments without pressure.",
  },
  {
    id: 2,
    image: require("../../../../assets/images/stackedcards.png"),
    title: "Organize reflections your way",
    description:
      "Use drawers for parts of your life, life phases for different seasons, and tags to group moments across everything.",
  },
  {
    id: 3,
    image: require("../../../../assets/images/ripple.png"),
    title: "Look back with more meaning",
    description:
      "Revisit what you have written, notice patterns over time, and keep what matters in a way that feels personal.",
  },
];

export function OnboardingScreen() {
  const theme = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const { width, height } = useWindowDimensions();
  const isCompactViewport = width < 430 || height < 780;
  const horizontalPadding = width > 900 ? 48 : 28;

  const heroBaseSize = Math.min(width * 0.46, height * 0.22, 280);
  const heroLargeSize = Math.max(heroBaseSize, isCompactViewport ? 170 : 200);
  const heroMediumSize = heroLargeSize * 0.83;
  const heroSmallSize = heroLargeSize * 0.65;
  const imageOrbSize = heroLargeSize * 0.71;
  const imageSize = imageOrbSize * 0.65;
  const heroTopOffset = Math.max(18, heroLargeSize * 0.08);
  const titleMaxWidth = Math.min(width - horizontalPadding * 2, 360);

  const completeOnboarding = async () => {
    await setOnboardingCompleted();
    router.replace("/intro");
  };

  const handleNext = async () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const slide = ONBOARDING_SLIDES[currentSlide];
  const isLastSlide = currentSlide === ONBOARDING_SLIDES.length - 1;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: Colors.light.background },
      ]}
    >
      <Screen
        style={[
          styles.container,
          { backgroundColor: Colors.light.background },
        ]}
      >
        <View
          style={[
            styles.glowTop,
            { backgroundColor: theme.colors.primary + "14" },
          ]}
        />
        <View
          style={[
            styles.glowBottom,
            { backgroundColor: theme.colors.accent1 + "30" },
          ]}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[styles.topActions, { paddingHorizontal: horizontalPadding }]}>
            {currentSlide > 0 ? (
              <TouchableOpacity
                onPress={handlePrevious}
                style={styles.topActionButton}
                accessible
                accessibilityLabel="Previous slide"
                accessibilityRole="button"
              >
                <Text
                  style={[
                    theme.typography.bodySm,
                    styles.topActionText,
                    { color: ONBOARDING_TEXT },
                  ]}
                >
                  Previous
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.topActionPlaceholder} />
            )}
            <View style={styles.topActionPlaceholder} />
          </View>

          <View
            style={[
              styles.content,
              {
                paddingHorizontal: horizontalPadding,
                paddingTop: isCompactViewport ? 8 : 20,
              },
            ]}
          >
            <View
              style={[
                styles.heroVisual,
                {
                  height:
                    heroTopOffset + heroLargeSize + (isCompactViewport ? 8 : 20),
                  marginBottom: isCompactViewport ? 12 : 24,
                },
              ]}
            >
              <View
                style={[
                  styles.heroStack,
                  {
                    top: heroTopOffset,
                    width: heroLargeSize,
                    height: heroLargeSize,
                  },
                ]}
              >
                <View
                  style={[
                    styles.heroCircleLarge,
                    {
                      width: heroLargeSize,
                      height: heroLargeSize,
                      borderRadius: heroLargeSize / 2,
                    },
                    { backgroundColor: theme.colors.accent1 + "26" },
                  ]}
                />
                <View
                  style={[
                    styles.heroCircleMedium,
                    {
                      top: heroLargeSize * 0.13,
                      width: heroMediumSize,
                      height: heroMediumSize,
                      borderRadius: heroMediumSize / 2,
                    },
                    { backgroundColor: theme.colors.accent1 + "18" },
                  ]}
                />
                <View
                  style={[
                    styles.heroCircleSmall,
                    {
                      top: heroLargeSize * 0.24,
                      width: heroSmallSize,
                      height: heroSmallSize,
                      borderRadius: heroSmallSize / 2,
                    },
                    { backgroundColor: theme.colors.accent2 + "14" },
                  ]}
                />
                <View
                  style={[
                    styles.heroHalo,
                    {
                      top: heroLargeSize * 0.05,
                      width: heroLargeSize * 0.73,
                      height: heroLargeSize * 0.73,
                      borderRadius: (heroLargeSize * 0.73) / 2,
                    },
                    { backgroundColor: theme.colors.accent1 + "20" },
                  ]}
                />
                <View
                  style={[
                    styles.imageOrb,
                    {
                      top: heroLargeSize * 0.16,
                      width: imageOrbSize,
                      height: imageOrbSize,
                      borderRadius: imageOrbSize / 2,
                      shadowColor: theme.colors.text,
                    },
                    { backgroundColor: ONBOARDING_BACKGROUND },
                  ]}
                >
                  <Image
                    source={slide.image}
                    style={[styles.image, { width: imageSize, height: imageSize }]}
                    resizeMode="contain"
                    accessible
                    accessibilityLabel={`Onboarding slide ${currentSlide + 1} illustration`}
                  />
                </View>
              </View>
            </View>

            <Text
              style={[
                styles.title,
                {
                  color: ONBOARDING_TEXT,
                  fontFamily: theme.fonts.serif,
                  maxWidth: titleMaxWidth,
                  fontSize: isCompactViewport ? 26 : 30,
                  lineHeight: isCompactViewport ? 34 : 40,
                  marginBottom: isCompactViewport ? 16 : 20,
                },
              ]}
            >
              {slide.title}
            </Text>

            <Text
              style={[
                theme.typography.body,
                styles.description,
                {
                  color: ONBOARDING_TEXT,
                  maxWidth: titleMaxWidth,
                  lineHeight: isCompactViewport ? 24 : 30,
                  marginBottom: isCompactViewport ? 28 : 36,
                },
              ]}
            >
              {slide.description}
            </Text>

            <View style={styles.pagination}>
              {ONBOARDING_SLIDES.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        index === currentSlide
                          ? theme.colors.primary
                          : theme.colors.gray[300],
                      width: index === currentSlide ? 34 : 8,
                      opacity: index === currentSlide ? 1 : 0.9,
                    },
                  ]}
                  accessible
                  accessibilityRole="progressbar"
                  accessibilityValue={{
                    min: 0,
                    max: ONBOARDING_SLIDES.length,
                    now: currentSlide + 1,
                  }}
                />
              ))}
            </View>
          </View>

          <View style={[styles.footer, { paddingHorizontal: horizontalPadding }]}>
            <TouchableOpacity
              onPress={handleNext}
              style={[
                styles.ctaButton,
                {
                  backgroundColor: theme.colors.primary,
                  shadowColor: theme.colors.text,
                },
              ]}
              accessible
              accessibilityLabel={isLastSlide ? "Get started with app" : "Next slide"}
              accessibilityRole="button"
            >
              <Text style={[styles.ctaText, { color: theme.colors.surface }]}>
                {isLastSlide ? "GET STARTED" : "NEXT"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
              accessible
              accessibilityLabel="Skip onboarding"
              accessibilityRole="button"
            >
              <Text
                style={[
                  theme.typography.bodySm,
                  styles.skipText,
                  { color: ONBOARDING_TEXT },
                ]}
              >
                Skip
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    overflow: "hidden",
  },
  container: {
    flex: 1,
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingBottom: 18,
    minHeight: "100%",
  },
  glowTop: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 999,
    opacity: 0.9,
  },
  glowBottom: {
    position: "absolute",
    bottom: -110,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 999,
    opacity: 0.8,
  },
  topActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 40,
  },
  topActionButton: {
    minWidth: 76,
    minHeight: 0,
    justifyContent: "center",
  },
  topActionPlaceholder: {
    minWidth: 76,
    minHeight: 0,
  },
  topActionText: {
    fontWeight: "600",
  },
  content: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  heroVisual: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  heroStack: {
    position: "absolute",
    alignItems: "center",
  },
  heroHalo: {
    position: "absolute",
    opacity: 0.55,
    transform: [{ scale: 1.1 }],
  },
  heroCircleLarge: {
    position: "absolute",
    opacity: 0.9,
    alignSelf: "center",
  },
  heroCircleMedium: {
    position: "absolute",
    opacity: 0.9,
    alignSelf: "center",
  },
  heroCircleSmall: {
    position: "absolute",
    opacity: 0.95,
    alignSelf: "center",
  },
  imageOrb: {
    position: "absolute",
    top: 0,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.08,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  image: {
  },
  title: {
    fontSize: 30,
    lineHeight: 40,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 20,
  },
  description: {
    textAlign: "center",
    lineHeight: 30,
    marginBottom: 36,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  dot: {
    height: 5,
    borderRadius: 999,
  },
  footer: {
    paddingBottom: 32,
    paddingTop: 24,
  },
  ctaButton: {
    minHeight: 78,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  ctaText: {
    fontSize: 14,
    letterSpacing: 2.2,
    fontWeight: "700",
  },
  skipButton: {
    minHeight: 44,
    justifyContent: "center",
  },
  skipText: {
    textAlign: "center",
    marginTop: 14,
    fontSize: 13,
  },
});
