import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, ViewToken } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Theme } from '../../constants/Theme';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function WelcomeScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const slides: Slide[] = [
    {
      id: '1',
      title: 'Medicine Management',
      description: 'Easily track medicine expiration dates, dosage schedules, and manage your health cabinet with confidence.',
      icon: (
        <Svg width={120} height={120} viewBox="0 0 100 100">
          <Rect x="20" y="20" width="60" height="60" rx="10" stroke={Theme.colors.primaryLight} strokeWidth={3} fill="none" />
          <Path d="M30 40 H70 M30 60 H70" stroke={Theme.colors.primaryLight} strokeWidth={3} strokeLinecap="round" />
        </Svg>
      )
    },
    {
      id: '2',
      title: 'Smart Expiry Cabinet',
      description: 'Never worry about expired medicines again. The app automatically tracks expiration timelines and alerts you well in advance.',
      icon: (
        <Svg width={120} height={120} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="40" stroke={Theme.colors.primaryLight} strokeWidth={3} fill="none" />
          <Path d="M50 20 V50 L70 50" stroke={Theme.colors.primaryLight} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M25 25 L35 35 M75 25 L65 35" stroke={Theme.colors.secondary} strokeWidth={3} strokeLinecap="round" />
        </Svg>
      )
    },
    {
      id: '3',
      title: 'Community Network',
      description: 'Submit medicine side effects anonymously, look up pharmacy trust reviews, and receive vital regional drug recalls.',
      icon: (
        <Svg width={120} height={120} viewBox="0 0 100 100">
          <Circle cx="30" cy="40" r="12" stroke={Theme.colors.primaryLight} strokeWidth={3} fill="none" />
          <Circle cx="70" cy="40" r="12" stroke={Theme.colors.primaryLight} strokeWidth={3} fill="none" />
          <Circle cx="50" cy="75" r="12" stroke={Theme.colors.secondary} strokeWidth={3} fill="none" />
          <Path d="M42 40 H58 M38 52 L44 63 M62 52 L56 63" stroke={Theme.colors.textSecondary} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      )
    }
  ];

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex !== activeIndex) {
      setActiveIndex(roundIndex);
    }
  };

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (activeIndex + 1) * width,
        animated: true,
      });
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      {activeIndex < slides.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>
      )}

      {/* Slide Carousels */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slideContainer}>
            <View style={styles.iconContainer}>
              {slide.icon}
            </View>
            <View style={styles.textWrapper}>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideDesc}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer Navigation Overlay */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeIndex === index ? styles.activeDot : null
              ]}
            />
          ))}
        </View>

        {/* Dynamic Action Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleNext}>
          <Text style={styles.actionText}>
            {activeIndex === slides.length - 1 ? 'GET STARTED' : 'CONTINUE'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
    padding: Theme.spacing.sm,
  },
  skipText: {
    color: Theme.colors.textMuted,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  scrollView: {
    flex: 1,
  },
  slideContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  iconContainer: {
    height: 180,
    width: 180,
    borderRadius: 90,
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.xxl,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  textWrapper: {
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
  },
  slideTitle: {
    fontSize: Theme.typography.sizes.xxl,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  slideDesc: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.xl,
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.border,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: Theme.colors.primaryLight,
  },
  actionButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  actionText: {
    color: Theme.colors.white,
    fontSize: Theme.typography.sizes.md,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});
