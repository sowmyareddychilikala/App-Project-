import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Platform, 
  StatusBar,
  Dimensions,
  Linking,
  Alert
} from 'react-native';
import { colors } from '../../theme/colors';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const PrecautionsWarningsScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { medData, initialTab = 'precautions' } = params;

  // Safeguard if opened directly
  const med = medData || {
    id: 'med_c2',
    name: 'Amoxicillin',
    strength: '500mg',
    type: 'Capsule'
  };

  // Toggle active tab: 'precautions' or 'side_effects'
  const [activeSubTab, setActiveSubTab] = useState(initialTab);

  // Trigger Mock Call for emergency clinician support
  const handleEmergencyCall = () => {
    const phoneUrl = `tel:911`;
    Linking.canOpenURL(phoneUrl)
      .then(supported => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert("Emergency Triggered", "Mock emergency call initiated. Seeking immediate local safety clinics.");
        }
      });
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Top Header App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity 
            style={styles.headerBackBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Safety Information</Text>
        </View>
        <TouchableOpacity style={styles.avatarMini} onPress={() => navigation.navigate('Dashboard', { screen: 'profile' })}>
          <MaterialIcons name="account-circle" size={26} color={colors.outline} />
        </TouchableOpacity>
      </View>

      {/* Tabs Switcher Slider */}
      <View style={styles.tabsSliderContainer}>
        <TouchableOpacity 
          style={[styles.tabSliderBtn, activeSubTab === 'precautions' && styles.tabSliderBtnActive]}
          onPress={() => setActiveSubTab('precautions')}
        >
          <Text style={[styles.tabSliderText, activeSubTab === 'precautions' && styles.tabSliderTextActive]}>Precautions</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabSliderBtn, activeSubTab === 'side_effects' && styles.tabSliderBtnActive]}
          onPress={() => setActiveSubTab('side_effects')}
        >
          <Text style={[styles.tabSliderText, activeSubTab === 'side_effects' && styles.tabSliderTextActive]}>Side Effects</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Dynamic content depending on active sub tab */}
        {activeSubTab === 'precautions' ? (
          <View style={styles.tabContent}>
            {/* Context Header */}
            <View style={[styles.contextBanner, { backgroundColor: colors.primaryContainer }]}>
              <Text style={styles.contextBadge}>MEDICINE SAFETY GUIDE</Text>
              <Text style={styles.contextMedName}>{med.name} {med.strength || '500mg'}</Text>
              <Text style={styles.contextMedSub}>Critical Warnings & Precautionary Directives</Text>
              <MaterialIcons name="health-and-safety" size={72} color={colors.white + '1A'} style={styles.bannerIcon} />
            </View>

            {/* Critical Warnings */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeadingRow}>
                <MaterialIcons name="warning" size={20} color={colors.error} />
                <Text style={[styles.sectionTitle, { color: colors.error }]}>Critical Warnings</Text>
              </View>

              <View style={styles.warningsGrid}>
                <View style={styles.warningCard}>
                  <View style={styles.warningCardHeader}>
                    <MaterialIcons name="pregnant-woman" size={18} color={colors.error} />
                    <Text style={styles.warningCardTitle}>CONTRAINDICATION</Text>
                  </View>
                  <Text style={styles.warningItemTitle}>Do not use if pregnant</Text>
                  <Text style={styles.warningItemDesc}>May cause serious fetal injury or clinical complications if administered during pregnancy.</Text>
                </View>

                <View style={styles.warningCard}>
                  <View style={styles.warningCardHeader}>
                    <MaterialIcons name="emergency" size={18} color={colors.error} />
                    <Text style={styles.warningCardTitle}>ANGIOEDEMA</Text>
                  </View>
                  <Text style={styles.warningItemTitle}>Severe swelling history</Text>
                  <Text style={styles.warningItemDesc}>Contraindicated if patient has history of drug-induced facial swelling or respiratory distress.</Text>
                </View>
              </View>
            </View>

            {/* Daily Lifestyle Precaution Chips */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Daily Lifestyle Precautions</Text>
              
              <View style={styles.lifestyleGrid}>
                {/* 1 */}
                <View style={styles.lifestyleCard}>
                  <View style={styles.lifestyleIconCircle}>
                    <MaterialIcons name="no-drinks" size={22} color={colors.primary} />
                  </View>
                  <Text style={styles.lifestyleCardTitle}>Avoid Alcohol</Text>
                  <Text style={styles.lifestyleCardDesc}>May lowering blood pressure levels excessively.</Text>
                </View>

                {/* 2 */}
                <View style={styles.lifestyleCard}>
                  <View style={styles.lifestyleIconCircle}>
                    <MaterialIcons name="no-meals" size={22} color={colors.primary} />
                  </View>
                  <Text style={styles.lifestyleCardTitle}>Specific Foods</Text>
                  <Text style={styles.lifestyleCardDesc}>Avoid grapefruit or acidic supplements during administration.</Text>
                </View>

                {/* 3 */}
                <View style={styles.lifestyleCard}>
                  <View style={styles.lifestyleIconCircle}>
                    <MaterialIcons name="opacity" size={22} color={colors.primary} />
                  </View>
                  <Text style={styles.lifestyleCardTitle}>Stay Hydrated</Text>
                  <Text style={styles.lifestyleCardDesc}>Dehydration significantly amplifies clinical warnings.</Text>
                </View>

                {/* 4 */}
                <View style={styles.lifestyleCard}>
                  <View style={styles.lifestyleIconCircle}>
                    <MaterialIcons name="medical-information" size={22} color={colors.primary} />
                  </View>
                  <Text style={styles.lifestyleCardTitle}>Salt Warning</Text>
                  <Text style={styles.lifestyleCardDesc}>Avoid mineral supplements containing high potassium levels.</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.tabContent}>
            {/* Side Effects Categorizations */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeadingRow}>
                <MaterialIcons name="healing" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Possible Adverse Reactions</Text>
              </View>

              <View style={styles.effectsStack}>
                {/* Common */}
                <View style={styles.effectsCard}>
                  <View style={styles.effectsCardHeader}>
                    <Text style={styles.effectsCategoryTitle}>COMMON SIDE EFFECTS</Text>
                    <View style={styles.frequencyBadge}><Text style={styles.freqBadgeText}>1 in 10</Text></View>
                  </View>
                  
                  <View style={styles.bulletItem}>
                    <MaterialIcons name="check-circle" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                    <Text style={styles.bulletText}>Dry, persistent, irritating cough</Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <MaterialIcons name="check-circle" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                    <Text style={styles.bulletText}>Dizziness, vertigo, or lightheadedness</Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <MaterialIcons name="check-circle" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                    <Text style={styles.bulletText}>Moderate headache or localized fatigue</Text>
                  </View>
                </View>

                {/* Rare */}
                <View style={styles.effectsCard}>
                  <View style={styles.effectsCardHeader}>
                    <Text style={styles.effectsCategoryTitle}>RARE SIDE EFFECTS</Text>
                    <View style={styles.frequencyBadge}><Text style={styles.freqBadgeText}>1 in 1000</Text></View>
                  </View>
                  
                  <View style={styles.bulletItem}>
                    <MaterialIcons name="info" size={16} color={colors.secondary} style={{ marginTop: 2 }} />
                    <Text style={styles.bulletText}>Mild skin rashes or localized itching</Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <MaterialIcons name="info" size={16} color={colors.secondary} style={{ marginTop: 2 }} />
                    <Text style={styles.bulletText}>Taste disturbances (metallic taste)</Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <MaterialIcons name="info" size={16} color={colors.secondary} style={{ marginTop: 2 }} />
                    <Text style={styles.bulletText}>Reversible alopecia (hair thinning)</Text>
                  </View>
                </View>

                {/* Serious */}
                <View style={[styles.effectsCard, { backgroundColor: colors.errorContainer, borderColor: colors.error }]}>
                  <View style={styles.effectsCardHeader}>
                    <Text style={[styles.effectsCategoryTitle, { color: colors.error }]}>SERIOUS REACTIONS</Text>
                    <View style={[styles.frequencyBadge, { backgroundColor: colors.error }]}><Text style={[styles.freqBadgeText, { color: colors.white }]}>IMMEDIATE ACTION</Text></View>
                  </View>
                  
                  <View style={styles.bulletItem}>
                    <MaterialIcons name="warning" size={16} color={colors.error} style={{ marginTop: 2 }} />
                    <Text style={[styles.bulletText, { color: colors.error }]}>Yellowing of skin or eyes (Jaundice / hepatic issues)</Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <MaterialIcons name="warning" size={16} color={colors.error} style={{ marginTop: 2 }} />
                    <Text style={[styles.bulletText, { color: colors.error }]}>Acute difficulty in breathing, swallowing or severe swelling</Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <MaterialIcons name="warning" size={16} color={colors.error} style={{ marginTop: 2 }} />
                    <Text style={[styles.bulletText, { color: colors.error }]}>High fever accompanied by unexplained persistent sore throat</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Emergency Contact CTA Button */}
        <View style={styles.emergencyContainer}>
          <TouchableOpacity 
            style={styles.emergencyBtn}
            onPress={handleEmergencyCall}
          >
            <MaterialIcons name="phone-in-talk" size={22} color={colors.white} />
            <Text style={styles.emergencyBtnText}>Emergency Medical Support</Text>
          </TouchableOpacity>
          <Text style={styles.emergencyNote}>Seek immediate clinical intervention if severe allergic reactions or angioedema symptoms present.</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 64,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    zIndex: 100,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsSliderContainer: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  tabSliderBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabSliderBtnActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabSliderText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.outline,
  },
  tabSliderTextActive: {
    color: colors.primary,
    fontWeight: '850',
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  tabContent: {
    gap: 24,
  },
  contextBanner: {
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  contextBadge: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.white,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  contextMedName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
  },
  contextMedSub: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.85,
    fontWeight: '600',
    marginTop: 2,
  },
  bannerIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  sectionBlock: {
    gap: 12,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '850',
    color: colors.primary,
  },
  warningsGrid: {
    gap: 16,
  },
  warningCard: {
    backgroundColor: colors.errorContainer,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: 16,
    borderRadius: 12,
    gap: 4,
  },
  warningCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  warningCardTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.error,
    letterSpacing: 0.5,
  },
  warningItemTitle: {
    fontSize: 14.5,
    fontWeight: '850',
    color: colors.error,
  },
  warningItemDesc: {
    fontSize: 12,
    color: colors.error,
    opacity: 0.85,
    lineHeight: 16,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  lifestyleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  lifestyleCard: {
    width: (width - 64) / 2,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
  },
  lifestyleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lifestyleCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  lifestyleCardDesc: {
    fontSize: 10.5,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 14,
  },
  effectsStack: {
    gap: 16,
  },
  effectsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  effectsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  effectsCategoryTitle: {
    fontSize: 10,
    fontWeight: '850',
    color: colors.outline,
    letterSpacing: 0.5,
  },
  frequencyBadge: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freqBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  bulletItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  bulletText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.textSecondary,
    fontWeight: '600',
    lineHeight: 16,
  },
  emergencyContainer: {
    alignItems: 'center',
    gap: 10,
    marginTop: 28,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: colors.error,
    borderRadius: 24,
    width: '100%',
    gap: 10,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  emergencyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  emergencyNote: {
    fontSize: 10.5,
    color: colors.outline,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  }
});

export default PrecautionsWarningsScreen;
