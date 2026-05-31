import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Dimensions, 
  Image, 
  Platform, 
  StatusBar, 
  Alert,
  Linking
} from 'react-native';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const UpcomingExpiriesScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser, medications = {} } = params;

  const getExpiryDetails = (expDateStr) => {
    if (!expDateStr) return { label: 'No date', daysLeft: 999 };
    const exp = new Date(expDateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    exp.setHours(0,0,0,0);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { daysLeft: diffDays };
  };

  const medicationsList = Object.values(medications);
  
  // Filter expiring medicines (expiring within 30 days but not expired)
  const expiringList = medicationsList.filter(m => {
    const { daysLeft } = getExpiryDetails(m.expDate);
    return daysLeft >= 0 && daysLeft <= 30;
  });

  const handleOrderRefill = (medName) => {
    Alert.alert(
      "Refill Ordering",
      `Would you like to auto-route your prescription refill request for ${medName} to a trusted local pharmacy?`,
      [
        { text: "Confirm Request", onPress: () => Alert.alert("Success", `Refill request submitted. We've notified your primary pharmacist at CarePharmacy.`) },
        { text: "Cancel", style: "cancel" }
      ]
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
          <Text style={styles.headerTitle}>Urgent Expirations</Text>
        </View>
        <TouchableOpacity 
          style={styles.scannerShortcutBtn}
          onPress={() => navigation.navigate('MedicineScanner', { uid, mockUser })}
        >
          <MaterialIcons name="qr-code-scanner" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Warning Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIconCircle}>
            <MaterialIcons name="warning" size={24} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Critical Shelf Lives</Text>
            <Text style={styles.bannerDesc}>
              You have {expiringList.length} medication{expiringList.length > 1 ? 's' : ''} expiring within the next 30 days. Fast action is recommended to maintain medical coverage.
            </Text>
          </View>
        </View>

        {/* Bento Grid layout */}
        <View style={styles.bentoContainer}>
          {/* Asymmetric Hero Card */}
          {expiringList.length > 0 ? (
            <View style={styles.heroAsymmetricCard}>
              <View style={styles.heroCardHeader}>
                <View style={styles.alertBadge}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.alertBadgeText}>Urgent Refill Action</Text>
                </View>
                <Text style={styles.heroCountdownText}>{getExpiryDetails(expiringList[0].expDate).daysLeft} Days</Text>
              </View>
              <Text style={styles.heroMedName}>{expiringList[0].name} {expiringList[0].dosage}</Text>
              <Text style={styles.heroMedDesc}>
                Prescription expiring on {expiringList[0].expDate}. Blister pack refills suggested immediately to avoid treatment interruption.
              </Text>
              
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.primaryRefillBtn} onPress={() => handleOrderRefill(expiringList[0].name)}>
                  <MaterialIcons name="shopping-cart" size={16} color={colors.white} />
                  <Text style={styles.primaryRefillBtnText}>Order Refill</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.secondaryRefillBtn}
                  onPress={() => Linking.openURL('https://www.google.com/maps/search/pharmacy+near+me')}
                >
                  <Text style={styles.secondaryRefillBtnText}>View Pharmacies</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.noExpiriesCard}>
              <MaterialIcons name="check-circle" size={40} color={colors.secondary} />
              <Text style={styles.noExpiriesText}>No critical expiries inside cabinet.</Text>
            </View>
          )}

          {/* Value Stats Card */}
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Cabinet Stock Value</Text>
            <Text style={styles.statsValueText}>$142.50</Text>
            <Text style={styles.statsSubText}>Potential savings by utilizing standard packs before expiration.</Text>
            
            <View style={styles.statsProgressTrack}>
              <View style={styles.statsProgressFill} />
            </View>
            <Text style={styles.statsFooterText}>75% Shelf Life Consumed</Text>
          </View>
        </View>

        {/* List of Remaining Expiring Medications */}
        {expiringList.slice(1).length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionTitle}>Other Expiring Meds</Text>
            <View style={styles.listContainer}>
              {expiringList.slice(1).map((med) => {
                const { daysLeft } = getExpiryDetails(med.expDate);
                return (
                  <View key={med.id} style={styles.listCard}>
                    <View style={styles.listCardHeader}>
                      <View style={styles.listCardIconCircle}>
                        <MaterialIcons name="vaccines" size={24} color={colors.primary} />
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.listDaysText}>{daysLeft} Days</Text>
                        <Text style={styles.listSubText}>Remaining</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.listMedName}>{med.name} {med.dosage}</Text>
                    <Text style={styles.listMedDesc}>Standard prescription batch code. Expiration date scheduled on {med.expDate}.</Text>
                    
                    <View style={styles.listActions}>
                      <TouchableOpacity style={styles.listActionBtnPlan}>
                        <Text style={styles.listActionBtnPlanText}>Dispose Plan</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.listActionBtnCalendar}>
                        <MaterialIcons name="calendar-today" size={16} color={colors.outline} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Clinical Guidelines block */}
        <Text style={styles.sectionTitle}>Disposal Guidelines</Text>
        <View style={styles.guidelinesGrid}>
          <View style={styles.guidelineCard}>
            <MaterialIcons name="delete" size={24} color={colors.onTertiaryContainer} style={{ marginBottom: 12 }} />
            <Text style={styles.guidelineHeading}>Take-Back Sites</Text>
            <Text style={styles.guidelineDesc}>Locate safe waste repositories or clinical collection drops near you.</Text>
          </View>

          <View style={styles.guidelineCard}>
            <MaterialIcons name="water-drop" size={24} color={colors.onTertiaryContainer} style={{ marginBottom: 12 }} />
            <Text style={styles.guidelineHeading}>Flush List</Text>
            <Text style={styles.guidelineDesc}>Check standard FDA lists for medications permitted to be flushed safely.</Text>
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

        <TouchableOpacity style={styles.navItemActive}>
          <MaterialIcons name="warning" size={22} color={colors.primary} />
          <Text style={styles.navTextActive}>Urgent</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.replace('ExpiredMedicines', { uid, mockUser, medications })}
        >
          <MaterialIcons name="delete-sweep" size={22} color={colors.outline} />
          <Text style={styles.navText}>Archive</Text>
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
  banner: {
    backgroundColor: colors.tertiaryContainer,
    borderWidth: 1,
    borderColor: colors.onTertiaryContainer + '20',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  bannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.onTertiaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.onTertiaryContainer,
  },
  bannerDesc: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.onTertiaryContainer,
    opacity: 0.8,
    marginTop: 2,
    lineHeight: 15,
  },
  bentoContainer: {
    gap: 16,
  },
  heroAsymmetricCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  heroCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
  },
  alertBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.onErrorContainer,
  },
  heroCountdownText: {
    fontSize: 20,
    fontWeight: '950',
    color: colors.error,
  },
  heroMedName: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  heroMedDesc: {
    fontSize: 12.5,
    color: colors.textSecondary,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 20,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryRefillBtn: {
    flex: 1.2,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  primaryRefillBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  secondaryRefillBtn: {
    flex: 1,
    height: 44,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outline,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryRefillBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.primary,
  },
  noExpiriesCard: {
    height: 140,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  noExpiriesText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.outline,
  },
  statsCard: {
    backgroundColor: colors.tertiaryFixed + '1F',
    borderWidth: 1,
    borderColor: colors.onTertiaryContainer + '10',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.onTertiaryContainer,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsValueText: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  statsSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  statsProgressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.outlineVariant + '4D',
    borderRadius: 3,
    marginTop: 16,
    marginBottom: 8,
  },
  statsProgressFill: {
    height: '100%',
    width: '75%',
    backgroundColor: colors.onTertiaryContainer,
    borderRadius: 3,
  },
  statsFooterText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 16,
    marginTop: 24,
  },
  listContainer: {
    gap: 16,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 16,
  },
  listCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listCardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listDaysText: {
    fontSize: 16,
    fontWeight: '850',
    color: colors.onTertiaryContainer,
  },
  listSubText: {
    fontSize: 9.5,
    color: colors.outline,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  listMedName: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  listMedDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    lineHeight: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  listActions: {
    flexDirection: 'row',
    gap: 10,
  },
  listActionBtnPlan: {
    flex: 1,
    height: 38,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listActionBtnPlanText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  listActionBtnCalendar: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidelinesGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  guidelineCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
  },
  guidelineHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  guidelineDesc: {
    fontSize: 9.5,
    color: colors.textSecondary,
    fontWeight: '600',
    lineHeight: 13,
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

export default UpcomingExpiriesScreen;
