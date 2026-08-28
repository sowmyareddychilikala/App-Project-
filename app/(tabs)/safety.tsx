import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { databaseService, PharmacyItem } from '../../services/databaseService';
import { Theme } from '../../constants/Theme';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function SafetyMap() {
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState<PharmacyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyItem | null>(null);
  const [viewTab, setViewTab] = useState<'map' | 'recalls'>('map');

  const loadSafetyData = async () => {
    try {
      const data = await databaseService.getNearbyPharmacies();
      setPharmacies(data);
      // Default select the first one to show the bottom sheet preview
      if (data.length > 0) setSelectedPharmacy(data[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSafetyData();
  }, []);

  const handlePinClick = (pharmacy: PharmacyItem) => {
    setSelectedPharmacy(pharmacy);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Safety Network Map</Text>
      <Text style={styles.subtitle}>Track local pharmacy reputation and active regional medicine recall batches.</Text>

      {/* Map vs Recalls Tab bar */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.headerTabItem, viewTab === 'map' ? styles.activeHeaderTab : null]}
          onPress={() => setViewTab('map')}
        >
          <Text style={[styles.headerTabText, viewTab === 'map' ? styles.activeHeaderTabText : null]}>
            GEOGRAPHIC MAP
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.headerTabItem, viewTab === 'recalls' ? styles.activeHeaderTab : null]}
          onPress={() => setViewTab('recalls')}
        >
          <Text style={[styles.headerTabText, viewTab === 'recalls' ? styles.activeHeaderTabText : null]}>
            BATCH RECALL LIST
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerSpinner}>
          <ActivityIndicator size="large" color={Theme.colors.primaryLight} />
        </View>
      ) : viewTab === 'map' ? (
        <View style={styles.mapContainer}>
          
          {/* Futuristic Premium SVG Map */}
          <View style={styles.svgMapWrapper}>
            <Svg width={width - 32} height={height * 0.35} viewBox="0 0 400 300">
              {/* Dark Cyber Background Grid */}
              <Rect width="400" height="300" fill={Theme.colors.cardBackground} rx="24" />
              <Path d="M 0 50 H 400 M 0 100 H 400 M 0 150 H 400 M 0 200 H 400 M 0 250 H 400" stroke="rgba(31, 41, 61, 0.2)" strokeWidth="1" />
              <Path d="M 50 0 V 300 M 100 0 V 300 M 150 0 V 300 M 200 0 V 300 M 250 0 V 300 M 300 0 V 300 M 350 0 V 300" stroke="rgba(31, 41, 61, 0.2)" strokeWidth="1" />

              {/* Grid Roads */}
              <Path d="M 0 120 H 400" stroke={Theme.colors.border} strokeWidth="24" fill="none" />
              <Path d="M 180 0 V 300" stroke={Theme.colors.border} strokeWidth="24" fill="none" />
              
              {/* Central Roundabout */}
              <Circle cx="180" cy="120" r="28" fill={Theme.colors.border} />
              <Circle cx="180" cy="120" r="16" fill={Theme.colors.background} />

              {/* Park Zone */}
              <Rect x="40" y="20" width="80" height="60" fill="rgba(16, 185, 129, 0.08)" stroke={Theme.colors.trusted + '30'} strokeWidth="1.5" rx="8" />
              <Circle cx="80" cy="50" r="8" fill="rgba(16, 185, 129, 0.15)" />

              {/* Residential Block */}
              <Rect x="260" y="160" width="100" height="100" fill="rgba(59, 130, 246, 0.04)" stroke={Theme.colors.secondary + '20'} strokeWidth="1.5" rx="12" />

              {/* Interactive clickable SVG Pins for Pharmacies */}
              {pharmacies.map((pharm) => {
                // Map latitude/longitude to SVG coordinate space
                // Bangalore coordinates center: Lat 12.9716, Long 77.5946 -> (180, 120) roundabout
                const latDiff = (pharm.coordinates.latitude - 12.9716) * 4000;
                const lonDiff = (pharm.coordinates.longitude - 77.5946) * 4000;
                
                const pinX = 180 + lonDiff;
                const pinY = 120 - latDiff;

                const pinColor = 
                  pharm.status === 'Trusted' ? Theme.colors.trusted :
                  pharm.status === 'Under Observation' ? Theme.colors.needsVerify : Theme.colors.highRisk;

                const isSelected = selectedPharmacy?.id === pharm.id;

                return (
                  <G key={pharm.id} onPress={() => handlePinClick(pharm)}>
                    {/* Glowing outer circle if selected */}
                    {isSelected && (
                      <Circle cx={pinX} cy={pinY} r="18" fill={pinColor} opacity="0.25" />
                    )}
                    {/* Outer ring */}
                    <Circle cx={pinX} cy={pinY} r="10" fill={Theme.colors.background} stroke={pinColor} strokeWidth="3" />
                    {/* Center Core dot */}
                    <Circle cx={pinX} cy={pinY} r="4" fill={pinColor} />
                  </G>
                );
              })}
            </Svg>
          </View>

          {/* Bottom Sheet Information Preview Panel */}
          {selectedPharmacy && (
            <View style={styles.sheetContainer}>
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetName}>{selectedPharmacy.name}</Text>
                  <Text style={styles.sheetAddress}>{selectedPharmacy.address}</Text>
                </View>
                <View style={[
                  styles.statusBadge, 
                  { 
                    backgroundColor: 
                      selectedPharmacy.status === 'Trusted' ? Theme.colors.trusted + '15' : 
                      selectedPharmacy.status === 'Under Observation' ? Theme.colors.needsVerify + '15' : Theme.colors.highRisk + '15',
                    borderColor: 
                      selectedPharmacy.status === 'Trusted' ? Theme.colors.trusted : 
                      selectedPharmacy.status === 'Under Observation' ? Theme.colors.needsVerify : Theme.colors.highRisk,
                  }
                ]}>
                  <Text style={[
                    styles.statusText, 
                    { 
                      color: 
                        selectedPharmacy.status === 'Trusted' ? Theme.colors.trusted : 
                        selectedPharmacy.status === 'Under Observation' ? Theme.colors.needsVerify : Theme.colors.highRisk,
                    }
                  ]}>
                    {selectedPharmacy.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.sheetStats}>
                <View style={styles.sheetStatCol}>
                  <Text style={styles.sheetStatNum}>{selectedPharmacy.trustScore}%</Text>
                  <Text style={styles.sheetStatLabel}>TRUST RATING</Text>
                </View>
                <View style={styles.sheetStatCol}>
                  <Text style={[styles.sheetStatNum, { color: selectedPharmacy.complaintsCount > 0 ? Theme.colors.highRisk : Theme.colors.textPrimary }]}>
                    {selectedPharmacy.complaintsCount}
                  </Text>
                  <Text style={styles.sheetStatLabel}>PATIENT FLAGS</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.sheetBtn}
                onPress={() => router.push(`/pharmacy/${selectedPharmacy.id}`)}
              >
                <Text style={styles.sheetBtnText}>VIEW FULL PHARMACY FILE</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Active Recall Batch alert list (Module 9) */}
          <View style={styles.recallsList}>
            <View style={styles.recallItem}>
              <View style={styles.recallItemHeader}>
                <View style={styles.recallItemBadgeHigh}>
                  <Text style={styles.recallItemBadgeText}>CRITICAL RECALL</Text>
                </View>
                <Text style={styles.recallItemDate}>Today</Text>
              </View>
              <Text style={styles.recallItemName}>Erythromycin 250mg - Batch #ER-552</Text>
              <Text style={styles.recallItemDesc}>
                State Drug Controller issued warning regarding severe packaging integrity issues. Batch was found to degrade prematurely under ambient humidity. Traced stocks returned.
              </Text>
              <TouchableOpacity
                style={styles.reportInspectorBtn}
                onPress={() => router.push('/reporting/authority-report')}
              >
                <Text style={styles.reportInspectorBtnText}>LODGE COMPLAINT WITH DRUG CONTROLLER</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recallItem}>
              <View style={styles.recallItemHeader}>
                <View style={styles.recallItemBadgeWarn}>
                  <Text style={styles.recallItemBadgeText}>OBSERVATION FLAG</Text>
                </View>
                <Text style={styles.recallItemDate}>3 days ago</Text>
              </View>
              <Text style={styles.recallItemName}>Ibuprofen Syrup - Batch #IB-8812</Text>
              <Text style={styles.recallItemDesc}>
                Warning issued regarding dosing syringe scale accuracy issues. Syringe markers may show 15% discrepancy in dosage markings. Exchange at chemist recommended.
              </Text>
            </View>

            <View style={styles.recallItem}>
              <View style={styles.recallItemHeader}>
                <View style={styles.recallItemBadgeHigh}>
                  <Text style={styles.recallItemBadgeText}>CRITICAL RECALL</Text>
                </View>
                <Text style={styles.recallItemDate}>1 week ago</Text>
              </View>
              <Text style={styles.recallItemName}>Lipitor Imitation - Batch #LP-FAKE-99</Text>
              <Text style={styles.recallItemDesc}>
                Counterfeit blister packs detected containing zero active statin compound. Flagged sources traced directly to Discount Lifeline Pharmacy. Escalate check instantly.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: 54,
  },
  title: {
    fontSize: Theme.typography.sizes.xxl,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: Theme.spacing.md,
  },
  subtitle: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.xs,
    lineHeight: 16,
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.lg,
    padding: 4,
  },
  headerTabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeHeaderTab: {
    backgroundColor: Theme.colors.primary,
  },
  headerTabText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  activeHeaderTabText: {
    color: Theme.colors.white,
  },
  centerSpinner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
    paddingHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.md,
  },
  svgMapWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.cardBackground,
  },
  sheetContainer: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.md,
    ...Theme.shadows.medium,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    paddingBottom: Theme.spacing.sm,
  },
  sheetName: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  sheetAddress: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  sheetStats: {
    flexDirection: 'row',
    paddingVertical: Theme.spacing.md,
  },
  sheetStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  sheetStatNum: {
    fontSize: 20,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  sheetStatLabel: {
    fontSize: 8,
    color: Theme.colors.textMuted,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  sheetBtn: {
    height: 48,
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetBtnText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: Theme.typography.sizes.xs,
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: 120, // Bottom padding to avoid navigation overlaps
  },
  recallsList: {
    marginTop: Theme.spacing.md,
  },
  recallItem: {
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 20,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.small,
  },
  recallItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  recallItemBadgeHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.highRisk,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recallItemBadgeWarn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.needsVerify,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recallItemBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
  },
  recallItemDate: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  recallItemName: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  recallItemDesc: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  reportInspectorBtn: {
    height: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: Theme.colors.highRisk,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
  },
  reportInspectorBtnText: {
    color: Theme.colors.highRisk,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
