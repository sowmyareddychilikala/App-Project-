import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '../../services/firebaseConfig';
import { Theme } from '../../constants/Theme';
import Svg, { Path } from 'react-native-svg';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const handleRegister = async () => {
    // 1. Basic Validations
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Validation Error', 'Please fill in all requested fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      // 2. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 3. Write profile information to Firebase Realtime Database
      await set(ref(database, `users/${user.uid}`), {
        fullName: fullName.trim(),
        email: email.trim(),
        role: 'user',
        createdAt: new Date().toISOString(),
        preferences: {
          expiryAlerts: true,
          safetyAlerts: true,
        }
      });

      Alert.alert('Registration Successful', `Account created successfully for ${fullName}!`);
      // Auth state change handler in app/_layout.tsx will auto-reroute to /(tabs)
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Failed to create an account. Please try again.';
      if (error.code === 'auth/email-already-in-use') errorMessage = 'This email address is already in use by another account.';
      if (error.code === 'auth/invalid-email') errorMessage = 'The email address format is invalid.';
      if (error.code === 'auth/weak-password') errorMessage = 'The password is too weak. Please use at least 6 characters.';
      
      Alert.alert('Registration Failed', errorMessage);
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
          <Svg width={50} height={50} viewBox="0 0 100 100">
            <Path
              d="M50 12 L80 26 V55 C80 72 67 85 50 88 C33 85 20 72 20 55 V26 L50 12 Z"
              fill="none"
              stroke={Theme.colors.primaryLight}
              strokeWidth={4}
            />
            <Path d="M50 32 V68 M32 50 H68" stroke={Theme.colors.primaryLight} strokeWidth={8} strokeLinecap="round" />
          </Svg>
          <Text style={styles.title}>Register Account</Text>
          <Text style={styles.subtitle}>Join MediGuard AI to protect your family's medicine cabinet</Text>
        </View>

        {/* Input Fields Card */}
        <View style={styles.formCard}>
          {/* Full Name field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>FULL NAME</Text>
            <View style={styles.inputFieldWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter full name"
                placeholderTextColor={Theme.colors.textMuted}
                autoCapitalize="words"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          {/* Email field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputFieldWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter email address"
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
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.inputFieldWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Choose safe password"
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

          {/* Confirm Password field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
            <View style={styles.inputFieldWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Retype password"
                placeholderTextColor={Theme.colors.textMuted}
                secureTextEntry={secureText}
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          {/* Create Account Button */}
          <TouchableOpacity
            style={[styles.registerBtn, loading ? styles.disabledBtn : null]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Theme.colors.white} />
            ) : (
              <Text style={styles.registerBtnText}>CREATE SECURE ACCOUNT</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Redirect */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLinkText}>Sign In</Text>
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
    marginBottom: Theme.spacing.lg,
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
    paddingHorizontal: Theme.spacing.sm,
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
  registerBtn: {
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
  registerBtnText: {
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
  loginLinkText: {
    color: Theme.colors.primaryLight,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: 'bold',
  },
});
