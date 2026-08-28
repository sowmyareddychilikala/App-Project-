import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { Theme } from '../../constants/Theme';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.85))[0];
  const progressAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Elegant entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false, // width style animation requires false
      })
    ]).start();

    // Auto-transition to Welcome/Onboarding screen after 2.8 seconds
    const timer = setTimeout(() => {
      router.replace('/(auth)/welcome');
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        
        {/* Glowing Medical Shield Logo SVG */}
        <View style={styles.logoWrapper}>
          <Svg width={100} height={100} viewBox="0 0 100 100">
            {/* Outer Hexagon Shield */}
            <Path
              d="M50 8 L85 24 V60 C85 78 70 90 50 94 C30 90 15 78 15 60 V24 L50 8 Z"
              fill="none"
              stroke={Theme.colors.primaryLight}
              strokeWidth={3}
              strokeLinejoin="round"
            />
            {/* Glowing Cross inside */}
            <Path
              d="M50 32 V68 M32 50 H68"
              stroke={Theme.colors.primaryLight}
              strokeWidth={8}
              strokeLinecap="round"
            />
            {/* Surrounding concentric cyber radar rings */}
            <Circle cx="50" cy="50" r="42" stroke="rgba(45, 212, 191, 0.15)" strokeWidth={1} strokeDasharray="5 5" />
          </Svg>
        </View>

        {/* Branding Typography */}
        <Text style={styles.title}>MediGuard <Text style={styles.accentText}>AI</Text></Text>
        <Text style={styles.tagline}>"Empowering Citizens for Safer Medicines."</Text>
      </Animated.View>

      {/* Cybernetic Loading Progress Bar */}
      <View style={styles.footerContainer}>
        <Text style={styles.loadingText}>INITIALIZING AI VERIFIER...</Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressBarWidth }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoWrapper: {
    marginBottom: Theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.primaryLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  title: {
    fontSize: 34,
    color: Theme.colors.textPrimary,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: Theme.spacing.xs,
  },
  accentText: {
    color: Theme.colors.primaryLight,
  },
  tagline: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    maxWidth: width * 0.8,
  },
  footerContainer: {
    width: '80%',
    alignItems: 'center',
    marginBottom: Theme.spacing.xxl,
  },
  loadingText: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: Theme.spacing.sm,
  },
  progressTrack: {
    height: 4,
    width: '100%',
    backgroundColor: Theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Theme.colors.primaryLight,
    borderRadius: 2,
  },
});
