import React from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
   
  ScrollView, 
  Dimensions, 
  Image, 
  Platform, 
  StatusBar, 
  Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const ExpiredMedicinesScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser, medications = {} } = params;

  const getExpiryDetails = (expDateStr) => {
    if (!expDateStr) return { status: 'Active', label: 'No date', daysLeft: 999 };
    const exp = new Date(expDateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    exp.setHours(0,0,0,0);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      const absoluteDays = Math.abs(diffDays);
      let label = `Expired ${absoluteDays} day${absoluteDays > 1 ? 's' : ''} ago`;
      if (absoluteDays === 1) label = 'Expired yesterday';
      return { status: 'Expired', label, color: colors.error, daysLeft: diffDays };
    }
    return { status: 'Active', label: '', daysLeft: diffDays };
  };

  const medicationsList = Object.values(medications);
  const expiredList = medicationsList.filter(m => getExpiryDetails(m.expDate).status === 'Expired');

  // Trigger FDA official 4-step secure disposal guidelines popup
  const handleShowDisposalInstructions = (medName) => {
    Alert.alert(
      `FDA Safe Disposal Protocol: ${medName}`,
      "Follow these standard clinical steps to safely dispose of expired medications:\n\n" +
      "1. Mix medications (do not crush tablets) with an unappealing substance like dirt, cat litter, or coffee grounds.\n\n" +
      "2. Place the mixture in a sealed container (plastic bag or bottle).\n\n" +
      "3. Throw the container in your household trash bin.\n\n" +
      "4. Scratch out all personal information on the original prescription label before recycling.",
      [{ text: "Understood", style: "default" }]
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Top Header App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity 
            style={styles.headerBackBtn}
            onPress={() => navigation.replace('MyMedicines', { uid, mockUser })}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expired Archive</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Urgent Attention Alert Banner */}
        <View style={styles.alertBanner}>
          <MaterialIcons name="warning" size={32} color={colors.onErrorContainer} style={{ marginRight: 6 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertBannerTitle}>Expired Medications Detected</Text>
            <Text style={styles.alertBannerDesc}>
              Your digital cabinet contains expired items. Consumption of these medications may be ineffective or harmful. Please follow safe disposal protocols immediately.
            </Text>
          </View>
        </View>

        {/* Bento Grid for Expired Items */}
        <View style={styles.cabinetGrid}>
          {expiredList.length === 0 ? (
            <View style={styles.emptyCabinet}>
              <MaterialIcons name="check-circle" size={44} color={colors.secondary} />
              <Text style={styles.emptyCabinetText}>No expired medicines found in archive.</Text>
            </View>
          ) : (
            expiredList.map((med) => {
              const expiry = getExpiryDetails(med.expDate);
              return (
                <View key={med.id} style={styles.medCard}>
                  {/* Rotated Stamp Watermark Overlay on Blister Pack Image */}
                  <View style={styles.stampWrapper}>
                    <Text style={styles.stampText}>EXPIRED</Text>
                  </View>

                  <Image 
                    source={{ 
                      uri: med.name.toLowerCase().includes('lipi') 
                        ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDv4ogaZFEMwi9bLPMueKru6Krq2sN43jbEDZvePYUaAADvo3YeyWU5qPDE21GmsIEftaB9kJShkduMpOOKKet1PlIeeM9jCQG9Xn14p6nJXXRlQ3qh2EvimRq7O2wjDw79ltjiycBgDStixOBkC0m4w_5jeVrc34dPvu17DKzVOBiiXdTPSMQch1JuomxyoDkJjpoih-dK6p60ZNQvlQ0PW6Bw5vOmvlRnebAg4FhUSUxbjd8iZ290scyvtrRkSGjjhCS9oCNy5q2P'
                        : med.name.toLowerCase().includes('ibup')
                        ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-6AATtS9j6G_zwAlNuHW6N2nRRJuPglxPxaK9aR8DHqp7pihch4ch95dgJBpIKNC8QZsLs_YT0RrxMxqiNKTmoLoLiyl5KiZR09UKY5LcenOwrdnQ5KyMbqUB12xxYLlz-_Skpy1J6x9DYYjhL5DpxMOj-rgzxRj6PfA7dPnY_3xXFjhoFJjz7nPcKxtZUIo6k8l1XLyJeH69vFVgFQR0ImoXeprTSZjXDa6cACtwFGrXEI1_Wtuon2SWHOjcdxuNa12KPU7vzC49'
                        : 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGIpTYk1PNRlM1RwyEaBcxmbrs9OzlMqU74msWE76GHh2kuqrh_EnXTe3nkEyKusMJupPRDDZvzT9HkZ6VCQo3pItngd9cNQ2zb9faqxJNvXRJKV_pNiAsIc31nAfA9DWrBr1mFpk205FYGTIGy4DeqN0Dz8gJl0ROfqosE_jzoI0X2akaShnjbd8t2RwNYp8E3McCQPF1k5TeI5WKofCj_H_bEKujgdwbVG8uRYnR04V82XpJgDcg3z8_C0orpuIOq1huPX7UsBKT'
                    }}
                    style={styles.medCardImg}
                  />

                  <View style={styles.medCardContent}>
                    <View style={styles.badgeRow}>
                      <View style={styles.expiredBadge}>
                        <Text style={styles.expiredBadgeText}>{expiry.label}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.medName}>{med.name} {med.dosage}</Text>
                    <Text style={styles.medBatch}>Batch: {med.batch || 'AX-2023-019'} • {med.instructions || 'Daily dose'}</Text>
                    
                    <View style={styles.actionRow}>
                      <TouchableOpacity 
                        style={styles.primaryDisposalBtn}
                        onPress={() => handleShowDisposalInstructions(med.name)}
                      >
                        <MaterialIcons name="delete-forever" size={16} color={colors.white} />
                        <Text style={styles.primaryDisposalBtnText}>Disposal Instructions</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.secondaryInfoBtn}
                        onPress={() => navigation.navigate('MedicineDetails', { uid, mockUser, medId: med.id, medications })}
                      >
                        <Text style={styles.secondaryInfoBtnText}>View Medication info</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Informational Bento Guidelines Section */}
        <Text style={styles.sectionHeading}>Why Disposal Matters?</Text>
        <View style={styles.infoBentoStack}>
          <View style={styles.infoBentoCard}>
            <View style={styles.infoIconCircle}>
              <MaterialIcons name="water-drop" size={24} color={colors.onSecondaryContainer} />
            </View>
            <Text style={styles.infoHeading}>Environment</Text>
            <Text style={styles.infoDesc}>Improper flushing can contaminate local reservoir systems and harm native marine ecologies.</Text>
          </View>

          <View style={styles.infoBentoCard}>
            <View style={styles.infoIconCircle}>
              <MaterialIcons name="health-and-safety" size={24} color={colors.onSecondaryContainer} />
            </View>
            <Text style={styles.infoHeading}>Public Safety</Text>
            <Text style={styles.infoDesc}>Secure old chemical compounds to completely avoid accidental dosing by children or pets.</Text>
          </View>

          <View style={styles.infoBentoCard}>
            <View style={styles.infoIconCircle}>
              <MaterialIcons name="clinical-notes" size={24} color={colors.onSecondaryContainer} />
            </View>
            <Text style={styles.infoHeading}>Efficacy</Text>
            <Text style={styles.infoDesc}>Expired chemical compositions lose standard potency, failing to treat clinical states effectively.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Tabs Navigation Footer */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.replace('MyMedicines', { uid, mockUser })}
        >
          <MaterialIcons name="inventory" size={22} color={colors.outline} />
          <Text style={styles.navText}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.replace('UpcomingExpiries', { uid, mockUser, medications })}
        >
          <MaterialIcons name="warning" size={22} color={colors.outline} />
          <Text style={styles.navText}>Urgent</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItemActive}>
          <MaterialIcons name="delete-sweep" size={22} color={colors.primary} />
          <Text style={styles.navTextActive}>Archive</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: STATUSBAR_HEIGHT,
    ...Platform.select({
      web: {
        maxWidth: 1024,
        width: '100%',
        alignSelf: 'center',
      }
    })
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
  scannerShortcutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  alertBanner: {
    backgroundColor: colors.errorContainer,
    borderWidth: 1,
    borderColor: colors.error + '1F',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  alertBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.onErrorContainer,
  },
  alertBannerDesc: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.onErrorContainer,
    opacity: 0.8,
    marginTop: 3,
    lineHeight: 16,
  },
  cabinetGrid: {
    gap: 20,
    marginBottom: 24,
  },
  emptyCabinet: {
    height: 140,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyCabinetText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.outline,
  },
  medCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 2,
  },
  medCardImg: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  stampWrapper: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    borderWidth: 3,
    borderColor: colors.error + '99',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    transform: [{ rotate: '-12deg' }],
  },
  stampText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.error,
    letterSpacing: 1.5,
  },
  medCardContent: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  expiredBadge: {
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expiredBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.error,
  },
  medName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  medBatch: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 16,
  },
  actionRow: {
    gap: 8,
  },
  primaryDisposalBtn: {
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  primaryDisposalBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  secondaryInfoBtn: {
    height: 40,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryInfoBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 16,
    marginTop: 12,
  },
  infoBentoStack: {
    gap: 16,
  },
  infoBentoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    textAlign: 'center',
  },
  infoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 16 : 0,
  },
  navItem: {
    alignItems: 'center',
  },
  navItemActive: {
    alignItems: 'center',
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  navText: {
    fontSize: 10,
    color: colors.outline,
    fontWeight: '700',
    marginTop: 2,
  },
  navTextActive: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '800',
    marginTop: 2,
  }
});

export default ExpiredMedicinesScreen;
