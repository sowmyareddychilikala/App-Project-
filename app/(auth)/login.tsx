import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { Theme } from '../../constants/Theme';
import Svg, { Path } from 'react-native-svg';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please fill in both email and password fields.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Auth state change handler in app/_layout.tsx will auto-reroute to /(tabs)
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Failed to sign in. Please verify your credentials.';
      if (error.code === 'auth/invalid-email') errorMessage = 'The email address format is invalid.';
      if (error.code === 'auth/user-not-found') errorMessage = 'No account associated with this email exists.';
      if (error.code === 'auth/wrong-password') errorMessage = 'Incorrect password. Please try again.';
      if (error.code === 'auth/invalid-credential') errorMessage = 'Invalid credentials. Please verify your email and password.';
      
      Alert.alert('Authentication Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerWrapper}>
          {/* Logo Header Accent */}
          <Svg width={60} height={60} viewBox="0 0 100 100">
            <Path
              d="M50 12 L80 26 V55 C80 72 67 85 50 88 C33 85 20 72 20 55 V26 L50 12 Z"
              fill="none"
              stroke={Theme.colors.primaryLight}
              strokeWidth={4}
            />
            <Path d="M50 32 V68 M32 50 H68" stroke={Theme.colors.primaryLight} strokeWidth={8} strokeLinecap="round" />
          </Svg>
          <Text style={styles.title}>Secure Login</Text>
          <Text style={styles.subtitle}>Welcome back to MediGuard AI hub</Text>
        </View>

        {/* Input Fields Card */}
        <View style={styles.formCard}>
          {/* Email field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputFieldWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                placeholderTextColor={Theme.colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password field */}
          <View style={styles.inputContainer}>
            <View style={styles.passwordHeader}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputFieldWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your password"
                placeholderTextColor={Theme.colors.textMuted}
                secureTextEntry={secureText}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setSecureText(!secureText)}>
                <Text style={styles.eyeBtnText}>{secureText ? 'SHOW' : 'HIDE'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading ? styles.disabledBtn : null]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Theme.colors.white} />
            ) : (
              <Text style={styles.loginBtnText}>SIGN IN SECURELY</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Redirect */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>New to MediGuard AI? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLinkText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  headerWrapper: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  title: {
    fontSize: Theme.typography.sizes.xxl,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.lg,
    ...Theme.shadows.medium,
  },
  inputContainer: {
    marginBottom: Theme.spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: Theme.spacing.sm,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 12,
    color: Theme.colors.primaryLight,
    fontWeight: 'bold',
  },
  inputFieldWrapper: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: Theme.spacing.md,
  },
  textInput: {
    flex: 1,
    color: Theme.colors.textPrimary,
    fontSize: Theme.typography.sizes.md,
  },
  eyeBtn: {
    padding: Theme.spacing.sm,
  },
  eyeBtnText: {
    color: Theme.colors.primaryLight,
    fontSize: 11,
    fontWeight: 'bold',
  },
  loginBtn: {
    height: 54,
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: Theme.typography.sizes.md,
    letterSpacing: 1.2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Theme.spacing.xl,
  },
  footerText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.sm,
  },
  registerLinkText: {
    color: Theme.colors.primaryLight,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: 'bold',
  },
});
