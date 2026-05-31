import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Modal, 
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { signInUser } from '../../services/authService';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;


export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Biometric Modal States
  const [biometricVisible, setBiometricVisible] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await signInUser(email.trim(), password);
      // Successfully authenticated
      setLoading(false);
      navigation.replace('Dashboard', { uid: user.uid });
    } catch (error) {
      setLoading(false);
      let errorMessage = 'An error occurred during sign in. Please try again.';
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address is invalid.';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Incorrect credentials. Please verify your email and password.';
      }
      Alert.alert('Authentication Failed', errorMessage);
    }
  };

  const startBiometricScan = () => {
    setBiometricVisible(true);
    setBiometricScanning(true);
    setBiometricSuccess(false);

    // Simulate scanning micro-interactions
    setTimeout(() => {
      setBiometricScanning(false);
      setBiometricSuccess(true);

      // Auto close and login after success
      setTimeout(() => {
        setBiometricVisible(false);
        // Navigate to Dashboard with a mock user
        navigation.replace('Dashboard', { mockUser: true });
      }, 1200);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* App Bar Header */}
        <View style={styles.header}>
          <MaterialIcons name="security" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>MediGuard AI</Text>
        </View>

        {/* Center Container Form */}
        <View style={styles.formCard}>
          
          {/* Brand Identity */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <MaterialIcons name="shield" size={40} color={colors.primary} />
            </View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subText}>Please enter your clinical credentials</Text>
          </View>

          {/* Identifier Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="mail-outline" size={20} color={colors.outline} style={styles.inputIcon} />
              <TextInput 
                style={styles.textInput}
                placeholder="dr.smith@hospital.com"
                placeholderTextColor={colors.outline}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordLabelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotBtnText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock-outline" size={20} color={colors.outline} style={styles.inputIcon} />
              <TextInput 
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor={colors.outline}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons 
                  name={showPassword ? "visibility" : "visibility-off"} 
                  size={20} 
                  color={colors.outline} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Keep logged in & Biometrics options */}
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => setKeepLoggedIn(!keepLoggedIn)}
            >
              <MaterialIcons 
                name={keepLoggedIn ? "check-box" : "check-box-outline-blank"} 
                size={22} 
                color={colors.primary} 
              />
              <Text style={styles.checkboxLabel}>Keep me logged in</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.biometricBtn} onPress={startBiometricScan}>
              <MaterialIcons name="face" size={20} color={colors.primary} />
              <Text style={styles.biometricBtnText}>FaceID</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.disabledBtn]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Login</Text>
                <MaterialIcons name="login" size={20} color={colors.white} />
              </>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpRow}>
            <Text style={styles.signUpText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
              <Text style={styles.signUpLink}>Sign up</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* HIPAA Compliant Shield Footer */}
        <View style={styles.securityFooter}>
          <MaterialIcons name="lock-person" size={16} color={colors.outline} />
          <Text style={styles.securityText}>HIPAA Compliant & End-to-End Encrypted</Text>
        </View>

      </ScrollView>

      {/* Biometric Scanning Overlay Modal */}
      <Modal
        visible={biometricVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[
              styles.modalIconWrapper, 
              biometricSuccess && styles.modalIconSuccess
            ]}>
              {biometricScanning ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <MaterialIcons 
                  name={biometricSuccess ? "verified" : "face"} 
                  size={48} 
                  color={biometricSuccess ? colors.secondary : colors.primary} 
                />
              )}
            </View>
            
            <Text style={styles.modalTitle}>
              {biometricScanning ? "Scanning FaceID" : "Authenticated"}
            </Text>
            
            <Text style={styles.modalSubtitle}>
              {biometricScanning 
                ? "Position your face in the front camera frame" 
                : "Biometric login successful. Accessing system..."
              }
            </Text>

            <TouchableOpacity 
              style={styles.modalCancelBtn}
              onPress={() => setBiometricVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    justifyContent: 'center',
    minHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 64,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E1E4E8',
    paddingHorizontal: 24,
    paddingVertical: 32,
    shadowColor: colors.outline,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  subText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primaryFixed,
  },
  biometricBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
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
    marginBottom: 24,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  signUpText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  securityFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
    opacity: 0.6,
  },
  securityText: {
    fontSize: 12,
    color: colors.outline,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 280,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconSuccess: {
    backgroundColor: '#6ffb85',
    opacity: 0.8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  modalCancelBtn: {
    width: '100%',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});

export default LoginScreen;
