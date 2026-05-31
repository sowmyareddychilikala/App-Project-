import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const WelcomeScreen = ({ navigation }) => {

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header App Bar */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MediGuard AI</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>About AI</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Visual Card Section with Floating Badge */}
        <View style={styles.visualContainer}>
          <View style={styles.illustrationPlaceholder}>
            {/* Volumetric background glowing circles */}
            <View style={styles.glow1} />
            <View style={styles.glow2} />
            
            <MaterialIcons name="healing" size={80} color={colors.primary} style={styles.mainIllustrIcon} />
            
            <View style={styles.floatingBadge}>
              <MaterialIcons name="verified" size={24} color={colors.primary} />
              <View>
                <Text style={styles.badgeTitle}>AI Verified</Text>
                <Text style={styles.badgeSubtitle}>99.8% Accuracy</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Intro Chip & Headings */}
        <View style={styles.introContainer}>
          <View style={styles.chipContainer}>
            <MaterialIcons name="auto-awesome" size={14} color={colors.onPrimaryFixed} />
            <Text style={styles.chipText}>Next-Gen Health Guardian</Text>
          </View>
          <Text style={styles.headline}>
            Your AI-Powered Medicine <Text style={styles.headlineHighlight}>Safety Guard</Text>
          </Text>
          <Text style={styles.subtitle}>
            Empowering patients and clinicians with real-time pharmaceutical intelligence to prevent adverse reactions and ensure optimal health outcomes.
          </Text>
        </View>

        {/* Bento Benefits List */}
        <View style={styles.benefitsContainer}>
          
          <View style={styles.benefitCard}>
            <View style={styles.benefitIconContainer}>
              <MaterialIcons name="qr-code-scanner" size={24} color={colors.primary} />
            </View>
            <View style={styles.benefitTextContainer}>
              <Text style={styles.benefitTitle}>Scan medicines instantly</Text>
              <Text style={styles.benefitDesc}>Identify complex pill labels in seconds using advanced OCR.</Text>
            </View>
          </View>

          <View style={styles.benefitCard}>
            <View style={styles.benefitIconContainer}>
              <MaterialIcons name="warning" size={24} color={colors.primary} />
            </View>
            <View style={styles.benefitTextContainer}>
              <Text style={styles.benefitTitle}>Detect side effects early</Text>
              <Text style={styles.benefitDesc}>AI-driven cross-referencing against your health profile.</Text>
            </View>
          </View>

          <View style={styles.benefitCard}>
            <View style={styles.benefitIconContainer}>
              <MaterialIcons name="inventory" size={24} color={colors.primary} />
            </View>
            <View style={styles.benefitTextContainer}>
              <Text style={styles.benefitTitle}>Manage inventory securely</Text>
              <Text style={styles.benefitDesc}>Expiration alerts and dosage tracking at your fingertips.</Text>
            </View>
          </View>

        </View>

        {/* Action Buttons CTAs */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity 
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Registration')}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <MaterialIcons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryBtnText}>Login</Text>
          </TouchableOpacity>
        </View>

        {/* Trust Footer */}
        <View style={styles.trustFooter}>
          <MaterialIcons name="people" size={22} color={colors.primary} style={styles.trustIcon} />
          <Text style={styles.trustText}>Trusted by thousands of health professionals.</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  headerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  visualContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  illustrationPlaceholder: {
    width: '100%',
    height: 240,
    backgroundColor: colors.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.outline,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryFixed,
    opacity: 0.4,
  },
  glow2: {
    position: 'absolute',
    bottom: -30,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#6ffb85',
    opacity: 0.15,
  },
  mainIllustrIcon: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  floatingBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(225, 228, 232, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  badgeSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  introContainer: {
    marginBottom: 24,
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    marginBottom: 16,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onPrimaryFixed,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 36,
    marginBottom: 12,
  },
  headlineHighlight: {
    color: colors.primary,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    fontWeight: '500',
  },
  benefitsContainer: {
    gap: 12,
    marginBottom: 28,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: colors.surfaceContainerLow,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  benefitIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  ctaContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 28,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 9999,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.transparent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  trustFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    opacity: 0.8,
  },
  trustIcon: {
    opacity: 0.9,
  },
  trustText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
