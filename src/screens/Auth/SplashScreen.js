import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Platform, StatusBar } from 'react-native';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const SplashScreen = ({ navigation }) => {
  const [authResolved, setAuthResolved] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // 1. Subscribe to Firebase Auth state to check active session persistence
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthResolved(true);
    });

    return () => unsubscribe();
  }, []);

  // Handle routing once auth is resolved and minimum display timer (2000ms) completes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authResolved) {
        if (currentUser) {
          navigation.replace('Dashboard', { uid: currentUser.uid });
        } else {
          navigation.replace('Welcome');
        }
      }
    }, 2000); // 2.0 seconds minimum display for premium branding visual duration

    return () => clearTimeout(timer);
  }, [authResolved, currentUser, navigation]);

  return (
    <View style={styles.container}>
      {/* Background Blobs (Simulated with translucent rounded shapes) */}
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <View style={styles.logoContainer}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="security" size={60} color={colors.primary} />
        </View>
        <Text style={styles.title}>MediGuard AI</Text>
        <Text style={styles.tagline}>Clinical Precision. Human Accessibility.</Text>
      </View>

      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Securing Platform...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: STATUSBAR_HEIGHT + 30,
    paddingBottom: 50,
  },

  blobTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primaryFixed,
    opacity: 0.3,
  },
  blobBottom: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: colors.primaryFixed,
    opacity: 0.15,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.outline,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  loaderContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
    color: colors.outline,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default SplashScreen;
