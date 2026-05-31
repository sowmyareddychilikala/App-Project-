import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { signUpUser } from '../../services/authService';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;


export const RegistrationScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Required Fields', 'Please fill in all input fields.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password Security', 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Confirm password does not match original password.');
      return;
    }

    if (!agreeTerms) {
      Alert.alert('Agreement Required', 'You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const user = await signUpUser(email.trim(), password, fullName.trim());
      setLoading(false);
      Alert.alert(
        'Registration Success', 
        'Your Practitioner Account has been secured successfully.',
        [
          { text: 'Access Dashboard', onPress: () => navigation.replace('Dashboard', { uid: user.uid }) }
        ]
      );
    } catch (error) {
      setLoading(false);
      let errorMessage = 'An error occurred during account creation. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already registered.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address format is invalid.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak. Please add special characters or numbers.';
      }
      Alert.alert('Registration Failed', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Brand Header */}
        <View style={styles.header}>
          <MaterialIcons name="security" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>MediGuard AI</Text>
        </View>

        {/* Visual Medical Decisions Banner (Adaptation of Figma HTML left-column) */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerGlow} />
          <Text style={styles.bannerHeading}>Empowering Medical Decisions</Text>
          <Text style={styles.bannerSubtitle}>
            Join over 15,000 healthcare providers using MediGuard AI for real-time diagnostic insights and secure patient data management.
          </Text>
          
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <MaterialIcons name="verified" size={16} color={colors.primary} />
              <Text style={styles.badgeText}>HIPAA Compliant</Text>
            </View>
            <View style={styles.badge}>
              <MaterialIcons name="offline-bolt" size={16} color={colors.secondary} />
              <Text style={styles.badgeText}>Real-time Analytics</Text>
            </View>
          </View>
        </View>

        {/* Form Container */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Create Your Account</Text>
          <Text style={styles.formSubtitle}>Start your journey with secure AI medical assistance today.</Text>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="person-outline" size={20} color={colors.outline} style={styles.inputIcon} />
              <TextInput 
                style={styles.textInput}
                placeholder="Dr. Jane Doe"
                placeholderTextColor={colors.outline}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="mail-outline" size={20} color={colors.outline} style={styles.inputIcon} />
              <TextInput 
                style={styles.textInput}
                placeholder="name@hospital.com"
                placeholderTextColor={colors.outline}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password Inputs */}
          <View style={styles.passwordRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Create Password</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock-outline" size={18} color={colors.outline} style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor={colors.outline}
                  secureTextEntry={true}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock-outline" size={18} color={colors.outline} style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor={colors.outline}
                  secureTextEntry={true}
                  autoCapitalize="none"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>
          </View>

          {/* Terms Checkbox */}
          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setAgreeTerms(!agreeTerms)}
          >
            <MaterialIcons 
              name={agreeTerms ? "check-box" : "check-box-outline-blank"} 
              size={22} 
              color={colors.primary} 
            />
            <Text style={styles.checkboxLabel}>
              I agree to the <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.disabledBtn]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Sign Up</Text>
                <MaterialIcons name="arrow-forward" size={20} color={colors.white} />
              </>
            )}
          </TouchableOpacity>

          {/* Back to Login Link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: STATUSBAR_HEIGHT,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 64,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  bannerCard: {
    backgroundColor: colors.primaryFixed,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: colors.outline,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  bannerGlow: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  bannerHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onPrimaryFixed,
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(225, 228, 232, 0.5)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E1E4E8',
    paddingHorizontal: 20,
    paddingVertical: 28,
    shadowColor: colors.outline,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  passwordRow: {
    flexDirection: 'row',
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 16,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '700',
  },
  submitBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 16,
    marginBottom: 20,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  loginText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default RegistrationScreen;
