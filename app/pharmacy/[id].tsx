import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ref, get } from 'firebase/database';
import { database } from '../../services/firebaseConfig';
import { databaseService, PharmacyItem } from '../../services/databaseService';
import { Theme } from '../../constants/Theme';
import Svg, { Path, Circle } from 'react-native-svg';

export default function PharmacyDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pharmacy, setPharmacy] = useState<PharmacyItem | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPharmacy = async () => {
    if (!id) return;
    try {
      const dbRef = ref(database);
      const snapshot = await get(ref(database, `pharmacies/${id}`));
      if (snapshot.exists()) {
        setPharmacy(snapshot.val() as PharmacyItem);
      } else {
        // Fallback fallback if not initialized in database yet
        const pharmacies = await databaseService.getNearbyPharmacies();
        const found = pharmacies.find(p => p.id === id);
        if (found) setPharmacy(found);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPharmacy();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primaryLight} />
      </View>
    );
  }

  if (!pharmacy) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pharmacy Not Found</Text>
      </View>
    );
  }

  const statusColor = 
    pharmacy.status === 'Trusted' ? Theme.colors.trusted :
    pharmacy.status === 'Under Observation' ? Theme.colors.needsVerify : Theme.colors.highRisk;

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← SAFETY MAP</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pharmacy Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Trust Score Gauge Card */}
        <View style={styles.ratingCard}>
          <View style={styles.gaugeContainer}>
            <Svg width={140} height={140} viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r="40" stroke={Theme.colors.border} strokeWidth={7} fill="none" />
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke={statusColor}
                strokeWidth={7.5}
                strokeDasharray={`${2.5 * pharmacy.trustScore} 250`}
                strokeLinecap="round"
                fill="none"
                transform="rotate(-90 50 50)"
              />
            </Svg>
            <View style={styles.gaugeTextWrapper}>
              <Text style={styles.gaugeNumber}>{pharmacy.trustScore}%</Text>
              <Text style={styles.gaugeLabel}>TRUST INDEX</Text>
            </View>
          </View>

          <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
          <Text style={styles.pharmacyAddress}>{pharmacy.address}</Text>

          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15', borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{pharmacy.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* License Verification Specs */}
        <Text style={styles.sectionTitle}>Regulatory Compliance</Text>
        <View style={styles.specCard}>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>LICENSE STATUS</Text>
            <Text style={[styles.specVal, { color: Theme.colors.trusted }]}>Active & Verified</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>LICENSE ID</Text>
            <Text style={styles.specVal}>DL-99882/KAR-26</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>REGISTERED REGISTER</Text>
            <Text style={styles.specVal}>State Pharmacy Council</Text>
          </View>
          <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.specLabel}>CRITICAL COMPLAINTS</Text>
            <Text style={[styles.specVal, { color: pharmacy.complaintsCount > 0 ? Theme.colors.highRisk : Theme.colors.textPrimary }]}>
              {pharmacy.complaintsCount} filed
            </Text>
          </View>
        </View>

        {/* Complaints Timeline History */}
        <Text style={styles.sectionTitle}>Audit Timeline Logs</Text>
        <View style={styles.timelineCard}>
          {pharmacy.complaintsCount === 0 ? (
            <View style={styles.timelineEmpty}>
              <Text style={styles.timelineEmptyTitle}>Flawless Compliance Record</Text>
              <Text style={styles.timelineEmptyDesc}>No patient complaints or regulatory infractions have been reported for this chemist in the past 12 months.</Text>
            </View>
          ) : (
            <View>
              <View style={styles.timelineRow}>
                <View style={[styles.timelineNode, { backgroundColor: Theme.colors.highRisk }]} />
                <View style={styles.timelineTextWrapper}>
                  <Text style={styles.timelineTitle}>Adverse Batch Dispensation Reported</Text>
                  <Text style={styles.timelineDesc}>Patient filed flag regarding expired or suspicious batch packaging. Escalate verification recommended.</Text>
                  <Text style={styles.timelineDate}>3 days ago</Text>
                </View>
              </View>

              <View style={[styles.timelineRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <View style={[styles.timelineNode, { backgroundColor: Theme.colors.needsVerify }]} />
                <View style={styles.timelineTextWrapper}>
                  <Text style={styles.timelineTitle}>Minor Dispensing Crease Checked</Text>
                  <Text style={styles.timelineDesc}>Inspector check resolved. Advised to update electronic prescription record logs immediately.</Text>
                  <Text style={styles.timelineDate}>1 month ago</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Escalation complaint buttons */}
        <TouchableOpacity 
          style={styles.complaintBtn}
          onPress={() => router.push(`/pharmacy/report?id=${pharmacy.id}&name=${encodeURIComponent(pharmacy.name)}`)}
        >
          <Text style={styles.complaintBtnText}>REPORT TRUST CONCERN</Text>
        </TouchableOpacity>

        {pharmacy.status === 'High Risk' && (
          <TouchableOpacity 
            style={styles.inspectorBtn}
            onPress={() => router.push(`/reporting/inspector-alert?pharmacyId=${pharmacy.id}&pharmacyName=${encodeURIComponent(pharmacy.name)}`)}
          >
            <Text style={styles.inspectorBtnText}>ALERT STATE DRUG INSPECTOR</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: 54,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: Theme.spacing.sm,
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  backBtnText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 60,
    paddingHorizontal: Theme.spacing.lg,
  },
  ratingCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
    ...Theme.shadows.medium,
  },
  gaugeContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  gaugeTextWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  gaugeLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    marginTop: 4,
  },
  pharmacyName: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
    textAlign: 'center',
  },
  pharmacyAddress: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: Theme.spacing.xs,
    marginBottom: Theme.spacing.md,
  },
  statusBadge: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 4,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: Theme.typography.sizes.xs,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.md,
    letterSpacing: 0.5,
  },
  specCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: Theme.spacing.lg,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  specLabel: {
    fontSize: 9,
    color: Theme.colors.textMuted,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  specVal: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textPrimary,
    fontWeight: '600',
  },
  timelineCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.lg,
  },
  timelineEmpty: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  timelineEmptyTitle: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.trusted,
    fontWeight: 'bold',
  },
  timelineEmptyDesc: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Theme.spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    paddingBottom: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  timelineNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: Theme.spacing.md,
  },
  timelineTextWrapper: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
  },
  timelineDesc: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    lineHeight: 16,
    marginTop: 4,
  },
  timelineDate: {
    fontSize: 9,
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.xs,
  },
  complaintBtn: {
    height: 52,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: Theme.colors.needsVerify,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
  },
  complaintBtnText: {
    color: Theme.colors.needsVerify,
    fontWeight: 'bold',
    fontSize: Theme.typography.sizes.xs,
    letterSpacing: 1.2,
  },
  inspectorBtn: {
    height: 52,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: Theme.colors.highRisk,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
  },
  inspectorBtnText: {
    color: Theme.colors.highRisk,
    fontWeight: 'bold',
    fontSize: Theme.typography.sizes.xs,
    letterSpacing: 1,
  },
});
