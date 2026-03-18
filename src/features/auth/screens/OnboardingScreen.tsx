import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useTheme } from '@styles/theme';
import { useUIStore } from '@store';
import { Screen, SafeArea } from '@components/layout';
import { Button } from '@components/ui';

const ONBOARDING_SLIDES = [
  {
    id: 1,
    image: require('@assets/images/featherpen.png'),
    title: 'A calmer way to journal',
    description:
      'Life Drawer is a quiet space to capture thoughts, memories, and everyday moments without pressure.',
  },
  {
    id: 2,
    image: require('@assets/images/stackedcards.png'),
    title: 'Organize reflections your way',
    description:
      'Use drawers for parts of your life, life phases for different seasons, and tags to group moments across everything.',
  },
  {
    id: 3,
    image: require('@assets/images/ripple.png'),
    title: 'Look back with more meaning',
    description:
      'Revisit what you have written, notice patterns over time, and keep what matters in a way that feels personal.',
  },
];

export function OnboardingScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  const handleNext = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Complete onboarding and go to login
      navigation.navigate('Login' as never);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login' as never);
  };

  const slide = ONBOARDING_SLIDES[currentSlide];
  const isLastSlide = currentSlide === ONBOARDING_SLIDES.length - 1;

  return (
    <SafeArea>
      <Screen style={styles.container}>
        {/* Header with Skip */}
        <View style={styles.header}>
          <View />
          <Button
            label="Skip"
            onPress={handleSkip}
            variant="outline"
            size="sm"
            accessibilityLabel="Skip onboarding"
            accessibilityHint="Go directly to login"
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Image */}
          <View style={styles.imageContainer}>
            <Image
              source={slide.image}
              style={[styles.image, { width: screenWidth * 0.5 }]}
              resizeMode="contain"
              accessible
              accessibilityLabel={`Onboarding slide ${currentSlide + 1} illustration`}
            />
          </View>

          {/* Title */}
          <Text
            style={[
              theme.typography.h2,
              {
                color: theme.colors.text,
                textAlign: 'center',
                marginVertical: theme.spacing.lg,
              },
            ]}
          >
            {slide.title}
          </Text>

          {/* Description */}
          <Text
            style={[
              theme.typography.body,
              {
                color: theme.colors.textSecondary,
                textAlign: 'center',
                marginBottom: theme.spacing.xl,
                lineHeight: 24,
              },
            ]}
          >
            {slide.description}
          </Text>

          {/* Pagination Dots */}
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
                    width: index === currentSlide ? 24 : 8,
                  },
                ]}
                accessible
                accessibilityRole="progressbar"
                accessibilityValue={{
                  min: 0,
                  max: ONBOARDING_SLIDES.length,
                  current: currentSlide + 1,
                }}
              />
            ))}
          </View>
        </ScrollView>

        {/* Navigation Footer */}
        <View style={styles.footer}>
          {currentSlide > 0 && (
            <Button
              label="Previous"
              onPress={handlePrevious}
              variant="outline"
              style={{ flex: 1, marginRight: theme.spacing.md }}
              accessibilityLabel="Previous slide"
            />
          )}

          <Button
            label={isLastSlide ? 'Get started' : 'Next'}
            onPress={handleNext}
            style={{ flex: 1 }}
            accessibilityLabel={isLastSlide ? 'Get started with app' : 'Next slide'}
          />
        </View>
      </Screen>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 40,
    height: 200,
    justifyContent: 'center',
  },
  image: {
    height: 200,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
});