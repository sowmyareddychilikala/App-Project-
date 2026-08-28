import React from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  StatusBar,
  Linking,
  Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const PharmacyDetailsScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser, pharmacyData } = params;

  // Safeguard fallback
  const pharmacy = pharmacyData || {
    id: 'pharma_fallback',
    name: 'Pharmacy Details Unavailable',
    verified: false,
    distance: 0,
    trustScore: 'N/A',
    address: 'Address information unavailable',
    phone: 'Information unavailable',
    hours: 'Information unavailable',
    tags: [],
    complianceAlert: false
  };

  const mockMedicinesInStock = [
    { name: 'Paracetamol 500mg (GSK)', status: 'In Stock', price: '$4.50' },
    { name: 'Amoxicillin 500mg (Pfizer)', status: 'In Stock', price: '$12.00' },
    { name: 'Lisinopril 10mg (Sandoz)', status: 'Low Stock', price: '$9.25' },
    { name: 'Metformin 500mg (Merck)', status: 'In Stock', price: '$7.80' }
  ];

  const handleCall = () => {
    if (!pharmacy.phone || pharmacy.phone === 'Information unavailable') {
      Alert.alert("Call Unavailable", "This pharmacy does not have a registered phone number.");
      return;
    }
    const phoneUrl = `tel:${pharmacy.phone}`;
    Linking.openURL(phoneUrl).catch(() => {
      Alert.alert("Call Dialed", `Dialing ${pharmacy.name} support line: ${pharmacy.phone}`);
    });
  };

  const handleNavigate = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to start live turn-by-turn navigation. Launching map search fallback instead.",
          [
            {
              text: "OK",
              onPress: () => {
                const destQuery = pharmacy.latitude && pharmacy.longitude 
                  ? `${pharmacy.latitude},${pharmacy.longitude}`
                  : encodeURIComponent(pharmacy.address);
                const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${destQuery}`;
                Linking.openURL(fallbackUrl).catch(() => {
                  Alert.alert("Error", "Could not open maps application.");
                });
              }
            }
          ]
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const currentLat = loc.coords.latitude;
      const currentLon = loc.coords.longitude;
      
      const destLat = pharmacy.latitude;
      const destLon = pharmacy.longitude;

      if (typeof destLat === 'number' && typeof destLon === 'number') {
        const url = Platform.select({
          ios: `maps://app?saddr=${currentLat},${currentLon}&daddr=${destLat},${destLon}`,
          android: `google.navigation:q=${destLat},${destLon}`,
          web: `https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLon}&destination=${destLat},${destLon}`
        });
        
        Linking.openURL(url).catch(() => {
          const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLon}&destination=${destLat},${destLon}`;
          Linking.openURL(webUrl);
        });
      } else if (pharmacy.address && pharmacy.address !== 'Address information unavailable') {
        const query = encodeURIComponent(pharmacy.address);
        const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLon}&destination=${query}`;
        Linking.openURL(webUrl).catch(() => {
          Alert.alert("Error", "Could not initiate routing to pharmacy address.");
        });
      } else {
        Alert.alert("Navigation Unavailable", "This pharmacy's physical coordinates and address are unavailable.");
      }
    } catch (err) {
      console.warn("Navigation handler error:", err);
      if (pharmacy.address && pharmacy.address !== 'Address information unavailable') {
        const query = encodeURIComponent(pharmacy.address);
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      } else {
        Alert.alert("Navigation Error", "Failed to retrieve coordinates or launch maps application.");
      }
    }
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
          <Text style={styles.headerTitle}>{pharmacy.name}</Text>
        </View>
        <TouchableOpacity style={styles.avatarMini} onPress={() => navigation.navigate('Dashboard', { screen: 'profile' })}>
          <MaterialIcons name="account-circle" size={26} color={colors.outline} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Pharmacy Info Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>PHARMACY PROFILE</Text>
            <Text style={styles.heroName}>{pharmacy.name}</Text>
            <View style={styles.locationMeta}>
              <MaterialIcons name="location-on" size={16} color={colors.white} style={{ opacity: 0.8 }} />
              <Text style={styles.locationDistance}>
                {typeof pharmacy.distance === 'number' && !isNaN(pharmacy.distance) ? `${pharmacy.distance} km away` : 'Distance unavailable'}
              </Text>
            </View>
          </View>
          {pharmacy.verified && (
            <View style={styles.verifiedTag}>
              <MaterialIcons name="verified" size={14} color={colors.secondary} />
              <Text style={styles.verifiedTagText}>VERIFIED PARTNER</Text>
            </View>
          )}
        </View>

        {/* Primary Trust Score Analysis Card */}
        <View style={styles.trustScoreCard}>
          <View style={styles.scoreRow}>
            {/* SVG Circular Gauge representation */}
            <View style={styles.gaugeContainer}>
              <View style={[
                styles.gaugeOuter,
                pharmacy.complianceAlert ? { borderColor: colors.errorContainer } : { borderColor: colors.secondaryContainer }
              ]}>
                <Text style={[
                  styles.scoreValue,
                  pharmacy.complianceAlert ? { color: colors.error } : { color: colors.secondary },
                  typeof pharmacy.trustScore !== 'number' && { fontSize: 14 }
                ]}>
                  {typeof pharmacy.trustScore === 'number' ? pharmacy.trustScore : 'N/A'}
                </Text>
                <Text style={styles.scoreMax}>/ 100</Text>
              </View>
            </View>
            
            <View style={styles.scoreDetails}>
              <View style={[
                styles.ratingBadge,
                pharmacy.complianceAlert 
                  ? { backgroundColor: colors.errorContainer, borderColor: colors.error } 
                  : typeof pharmacy.trustScore === 'number'
                    ? { backgroundColor: colors.secondaryContainer, borderColor: colors.secondary }
                    : { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outline }
              ]}>
                <MaterialIcons 
                  name={pharmacy.complianceAlert ? "warning" : typeof pharmacy.trustScore === 'number' ? "shield" : "help"} 
                  size={14} 
                  color={pharmacy.complianceAlert ? colors.error : typeof pharmacy.trustScore === 'number' ? colors.secondary : colors.outline} 
                />
                <Text style={[
                  styles.ratingBadgeText,
                  pharmacy.complianceAlert ? { color: colors.error } : typeof pharmacy.trustScore === 'number' ? { color: colors.secondary } : { color: colors.outline }
                ]}>
                  {pharmacy.complianceAlert ? 'WARNING RATING' : typeof pharmacy.trustScore === 'number' ? 'EXCELLENT TRUST' : 'NOT RATED'}
                </Text>
              </View>
              <Text style={styles.scoreTitle}>AI Integrity Index</Text>
              <Text style={styles.scoreDesc}>
                {pharmacy.complianceAlert 
                  ? "This provider has active safety complaints and pricing discrepancies in the public registry database."
                  : typeof pharmacy.trustScore === 'number'
                    ? "Consistently verified safety protocols, authentic sourcing, and positive patient sentiment ratings."
                    : "No verification profile exists in our public registry database. Sourcing protocols remain unrated."
                }
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.analysisBtn}
            onPress={() => navigation.navigate('TrustScoreAnalysis', { uid, mockUser, pharmacyData: pharmacy })}
          >
            <Text style={styles.analysisBtnText}>Explore Trust Score Composition</Text>
            <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Action button rows */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
            <MaterialIcons name="phone" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Call Pharmacy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleNavigate}>
            <MaterialIcons name="directions" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Navigate Map</Text>
          </TouchableOpacity>
        </View>

        {/* Location & Details Specs */}
        <View style={styles.specCard}>
          <Text style={styles.sectionHeading}>Contact Details</Text>
          
          <View style={styles.specRowItem}>
            <Text style={styles.specLabel}>Address</Text>
            <Text style={styles.specValueText}>{pharmacy.address}</Text>
          </View>

          <View style={styles.specRowItem}>
            <Text style={styles.specLabel}>Phone Number</Text>
            <Text style={styles.specValueText}>{pharmacy.phone}</Text>
          </View>

          <View style={[styles.specRowItem, { borderBottomWidth: 0 }]}>
            <Text style={styles.specLabel}>Hours</Text>
            <Text style={styles.specValueText}>{pharmacy.hours}</Text>
          </View>
        </View>

        {/* Verified Stock List */}
        <View style={styles.specCard}>
          <Text style={styles.sectionHeading}>Verified Medicines In Stock</Text>
          {mockMedicinesInStock.map((med, idx) => (
            <View 
              key={idx} 
              style={[
                styles.stockRow, 
                idx === mockMedicinesInStock.length - 1 && { borderBottomWidth: 0 }
              ]}
            >
              <View>
                <Text style={styles.stockMedName}>{med.name}</Text>
                <Text style={styles.stockMedPrice}>{med.price} average MSRP</Text>
              </View>
              <View style={[
                styles.stockStatusBadge,
                med.status === 'In Stock' ? { backgroundColor: colors.secondaryContainer } : { backgroundColor: colors.errorContainer }
              ]}>
                <Text style={[
                  styles.stockStatusBadgeText,
                  med.status === 'In Stock' ? { color: colors.secondary } : { color: colors.error }
                ]}>{med.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Report / Submit Complaint CTA */}
        <View style={styles.reportCtaSection}>
          <Text style={styles.reportCtaHeading}>Have you noticed an issue?</Text>
          <Text style={styles.reportCtaDesc}>
            Report suspicious medicine packaging, overpricing, or subpar safety guidelines to help notify other users.
          </Text>
          <TouchableOpacity 
            style={styles.reportBtn}
            onPress={() => navigation.navigate('SubmitReport', { uid, mockUser, prefillName: pharmacy.name })}
          >
            <MaterialIcons name="report" size={20} color={colors.white} />
            <Text style={styles.reportBtnText}>Submit Complaint Report</Text>
          </TouchableOpacity>
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
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroLeft: {
    flex: 1,
    marginRight: 8,
  },
  heroLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
    opacity: 0.7,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationDistance: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
    fontWeight: '600',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.primary,
  },
  trustScoreCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    padding: 16,
    marginBottom: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  gaugeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  scoreMax: {
    fontSize: 8,
    color: colors.outline,
    fontWeight: '700',
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  scoreDetails: {
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 0.5,
    marginBottom: 6,
  },
  ratingBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: '850',
    color: colors.text,
  },
  scoreDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  analysisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  analysisBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  specCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '850',
    color: colors.primary,
    marginBottom: 12,
  },
  specRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '33',
  },
  specLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    width: '30%',
  },
  specValueText: {
    fontSize: 12.5,
    color: colors.text,
    fontWeight: '600',
    width: '70%',
    textAlign: 'right',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '33',
  },
  stockMedName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  stockMedPrice: {
    fontSize: 10.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stockStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  stockStatusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  reportCtaSection: {
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  reportCtaHeading: {
    fontSize: 15,
    fontWeight: '850',
    color: colors.text,
  },
  reportCtaDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    gap: 8,
  },
  reportBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  }
});

export default PharmacyDetailsScreen;
