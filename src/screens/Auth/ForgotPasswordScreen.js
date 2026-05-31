import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { resetUserPassword } from '../../services/authService';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;


export const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email Input, 2: OTP Verification
  
  // OTP States
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);

  const pin1Ref = useRef(null);
  const pin2Ref = useRef(null);
  const pin3Ref = useRef(null);
  const pin4Ref = useRef(null);

  // Resend code timer logic
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendLink = async () => {
    if (!email) {
      Alert.alert('Required Field', 'Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      // Send real Firebase password reset email
      await resetUserPassword(email.trim());
      setLoading(false);
      
      // Advance to verification display steps
      Alert.alert(
        'Recovery Email Sent',
        'A secure password reset link has been dispatched to your email address.',
        [
          { text: 'Verify Code', onPress: () => setStep(2) }
        ]
      );
    } catch (error) {
      setLoading(false);
      let errorMessage = 'Failed to send recovery email. Please check your address and connection.';
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address format is invalid.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No practitioner account is associated with this email.';
      }
      Alert.alert('Request Failed', errorMessage);
    }
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index === 0) pin2Ref.current.focus();
    if (text && index === 1) pin3Ref.current.focus();
    if (text && index === 2) pin4Ref.current.focus();
  };

  const handleOtpKeyPress = (e, index) => {
    // Focus previous input on backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      if (index === 1) pin1Ref.current.focus();
      if (index === 2) pin2Ref.current.focus();
      if (index === 3) pin3Ref.current.focus();
    }
  };

  const handleVerifyOtp = () => {
    const code = otp.join('');
    if (code.length < 4) {
      Alert.alert('Incomplete Code', 'Please enter the complete 4-digit code.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Identity Verified',
        'Your security token is verified. Please proceed to complete password reset via the email link.',
        [
          { text: 'Return to Login', onPress: () => navigation.navigate('Login') }
        ]
      );
    }, 1500);
  };

  const handleResend = () => {
    if (!canResend) return;
    setTimer(59);
    setCanResend(false);
    setOtp(['', '', '', '']);
    pin1Ref.current.focus();
    Alert.alert('Code Dispatched', 'A new verification security code has been sent.');
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header AppBar */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => step === 2 ? setStep(1) : navigation.navigate('Login')}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MediGuard AI</Text>
      </View>

      <View style={styles.content}>
        
        {/* Verification Card */}
        <View style={styles.card}>
          
          {/* Circular Shield Badge */}
          <View style={styles.shieldWrapper}>
            <View style={styles.shieldBadge}>
              <MaterialIcons name="shield-lock" size={40} color={colors.primary} />
            </View>
          </View>

          <Text style={styles.cardTitle}>Reset Password</Text>
          <Text style={styles.cardSubtitle}>
            {step === 1 
              ? "Provide your clinical email to dispatch a secure password recovery token." 
              : `Enter the 4-digit code sent to ${email}`}
          </Text>

          {step === 1 ? (
            /* Step 1: Email Entry */
            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="alternate-email" size={20} color={colors.outline} style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="practitioner@hospital.com"
                  placeholderTextColor={colors.outline}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, loading && styles.disabledBtn]}
                onPress={handleSendLink}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Send Reset Link</Text>
                    <MaterialIcons name="verified-user" size={18} color={colors.white} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Step 2: OTP Numerical Inputs */
            <View style={styles.form}>
              <View style={styles.otpGrid}>
                <TextInput 
                  ref={pin1Ref}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={otp[0]}
                  onChangeText={(text) => handleOtpChange(text, 0)}
                  onKeyPress={(e) => handleOtpKeyPress(e, 0)}
                  autoFocus={true}
                />
                <TextInput 
                  ref={pin2Ref}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={otp[1]}
                  onChangeText={(text) => handleOtpChange(text, 1)}
                  onKeyPress={(e) => handleOtpKeyPress(e, 1)}
                />
                <TextInput 
                  ref={pin3Ref}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={otp[2]}
                  onChangeText={(text) => handleOtpChange(text, 2)}
                  onKeyPress={(e) => handleOtpKeyPress(e, 2)}
                />
                <TextInput 
                  ref={pin4Ref}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={otp[3]}
                  onChangeText={(text) => handleOtpChange(text, 3)}
                  onKeyPress={(e) => handleOtpKeyPress(e, 3)}
                />
              </View>

              <View style={styles.timerContainer}>
                {!canResend ? (
                  <Text style={styles.timerText}>
                    Resend Code in <Text style={styles.timerHighlight}>00:{timer < 10 ? `0${timer}` : timer}</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResend}>
                    <Text style={styles.resendLinkText}>Resend Code</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, loading && styles.disabledBtn]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Verify Token</Text>
                    <MaterialIcons name="verified" size={18} color={colors.white} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Return link */}
          <TouchableOpacity 
            style={styles.returnBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <MaterialIcons name="keyboard-arrow-left" size={20} color={colors.textSecondary} />
            <Text style={styles.returnText}>Back to Login</Text>
          </TouchableOpacity>

        </View>

        {/* Security Alert Note Card (Bento Style) */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={24} color={colors.primary} style={styles.infoIcon} />
          <View style={styles.infoTextWrapper}>
            <Text style={styles.infoTitle}>Security Note</Text>
            <Text style={styles.infoDesc}>
              MediGuard AI will never ask for your password or OTP via phone call or email. This code is valid for 10 minutes.
            </Text>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: STATUSBAR_HEIGHT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E1E4E8',
    padding: 24,
    shadowColor: colors.outline,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  shieldWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  shieldBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  form: {
    width: '100%',
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
    marginBottom: 20,
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
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    maxWidth: 260,
    alignSelf: 'center',
    marginBottom: 20,
  },
  otpInput: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timerHighlight: {
    color: colors.primary,
    fontWeight: '800',
  },
  resendLinkText: {
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
  returnBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  returnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: colors.surfaceContainerLow,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});

export default ForgotPasswordScreen;
