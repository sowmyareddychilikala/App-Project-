import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { Theme } from '../../constants/Theme';
import Svg, { Path } from 'react-native-svg';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address to recover your password.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setEmailSent(true);
      Alert.alert(
        'Email Dispatched',
        `A password reset link has been dispatched to ${email.trim()}. Please inspect your inbox and spam folders.`
      );
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Failed to process password recovery. Please try again.';
      if (error.code === 'auth/invalid-email') errorMessage = 'The email address format is invalid.';
      if (error.code === 'auth/user-not-found') errorMessage = 'No account associated with this email address exists.';
      
      Alert.alert('Recovery Failed', errorMessage);
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
          <Text style={styles.title}>Recover Password</Text>
          <Text style={styles.subtitle}>Reset your password securely via your registered email address</Text>
        </View>

        {/* Input Card */}
        <View style={styles.formCard}>
          {emailSent ? (
            <View style={styles.successContainer}>
              <Text style={styles.successHeading}>Instructions Dispatched!</Text>
              <Text style={styles.successDescription}>
                We've sent password reset instructions to <Text style={styles.boldEmail}>{email}</Text>. Please click on the link provided in the email to set a new password, then return to sign in.
              </Text>
              <TouchableOpacity style={styles.backToLoginBtn} onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.backToLoginText}>RETURN TO SIGN IN</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
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

              <TouchableOpacity
                style={[styles.resetBtn, loading ? styles.disabledBtn : null]}
                onPress={handlePasswordReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Theme.colors.white} />
                ) : (
                  <Text style={styles.resetBtnText}>SEND RESET LINK</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          )}
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
    marginBottom: Theme.spacing.lg,
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
  resetBtn: {
    height: 54,
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  resetBtnText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: Theme.typography.sizes.md,
    letterSpacing: 1.2,
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    padding: Theme.spacing.sm,
  },
  cancelBtnText: {
    color: Theme.colors.textMuted,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  successHeading: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: Theme.colors.trusted,
    marginBottom: Theme.spacing.md,
  },
  successDescription: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Theme.spacing.xl,
  },
  boldEmail: {
    color: Theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  backToLoginBtn: {
    height: 50,
    width: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToLoginText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: Theme.typography.sizes.sm,
    letterSpacing: 1.2,
  },
});
