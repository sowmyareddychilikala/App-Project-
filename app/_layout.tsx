import React, { useEffect, useState, createContext, useContext } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { Theme } from '../constants/Theme';

// Create Global Auth Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;

    // Check if the user is in the auth route group
    const inAuthGroup = segments[0] === '(auth)';

    if (!user) {
      // Redirect to welcome/login if not authenticated and not in auth screens
      if (!inAuthGroup) {
        router.replace('/(auth)/splash');
      }
    } else {
      // Redirect to main tabs if authenticated and currently in auth screens
      if (inAuthGroup || segments.length === 0) {
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primaryLight} />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Theme.colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="medicine/[id]" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="medicine/info-[name]" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="pharmacy/[id]" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="pharmacy/report" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="side-effects/report" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="side-effects/analytics" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="reporting/authority-report" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="reporting/inspector-alert" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="reporting/status" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="profile" options={{ presentation: 'card', headerShown: false }} />
      </Stack>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
