import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ref, get, update } from 'firebase/database';
import { auth, database } from '../../services/firebaseConfig';
import { databaseService, MedicineItem } from '../../services/databaseService';
import { Theme } from '../../constants/Theme';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export default function MedicineDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [medicine, setMedicine] = useState<MedicineItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggles, setToggles] = useState({
    reminders: true,
    remind30: true,
    remind7: true,
  });

  const loadMedicine = async () => {
    const user = auth.currentUser;
    if (!user || !id) return;

    try {
      const medRef = ref(database, `users/${user.uid}/medicines/${id}`);
      const snapshot = await get(medRef);
      if (snapshot.exists()) {
        const data = snapshot.val() as MedicineItem;
        setMedicine(data);
        setToggles({
          reminders: data.reminderScheduled !== false,
          remind30: true,
          remind7: true,
        });
      } else {
        Alert.alert('Not Found', 'The requested medicine record could not be found.');
        router.back();
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to retrieve medicine data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicine();
  }, [id]);

  const handleToggleChange = async (key: keyof typeof toggles, val: boolean) => {
    const user = auth.currentUser;
    if (!user || !id) return;

    const newToggles = { ...toggles, [key]: val };
    setToggles(newToggles);

    try {
      const medRef = ref(database, `users/${user.uid}/medicines/${id}`);
      await update(medRef, {
        reminderScheduled: newToggles.reminders,
      });
    } catch (e) {
      console.error('Failed to sync reminder settings:', e);
    }
  };

  const handleDelete = () => {
    if (!medicine) return;
    Alert.alert(
      'Dispose Medicine',
      `Are you sure you want to permanently dispose of ${medicine.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispose',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await databaseService.deleteMedicine(id);
              Alert.alert('Disposed', `${medicine.name} removed from your cabinet.`);
              router.replace('/(tabs)/inventory');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete record.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const calculateDaysLeft = (expiryString: string) => {
    const today = new Date();
    const expiry = new Date(expiryString);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatExpiryDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primaryLight} />
      </View>
    );
  }

  if (!medicine) return null;

  const daysLeft = calculateDaysLeft(medicine.expiryDate);
  const percentRemaining = Math.max(0, Math.min(100, (daysLeft / 365) * 100));

  let statusColor = Theme.colors.trusted;
  let statusText = 'ACTIVE';
  if (medicine.status === 'expired') {
    statusColor = Theme.colors.highRisk;
    statusText = 'EXPIRED';
  } else if (medicine.status === 'near_expiry') {
    statusColor = Theme.colors.needsVerify;
    statusText = 'EXPIRING';
  }

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← CABINET</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medicine Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Radial Expiry Progress Gauge */}
        <View style={styles.gaugeCard}>
          <View style={styles.gaugeWrapper}>
            <Svg width={180} height={180} viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r="40" stroke={Theme.colors.border} strokeWidth={6} fill="none" />
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke={statusColor}
                strokeWidth={7}
                strokeDasharray={`${2.5 * percentRemaining} 250`}
                strokeLinecap="round"
                fill="none"
                transform="rotate(-90 50 50)"
              />
            </Svg>
            <View style={styles.gaugeTextContent}>
              <Text style={[styles.daysLeftNumber, { color: statusColor }]}>
                {daysLeft > 0 ? daysLeft : 0}
              </Text>
              <Text style={styles.daysLeftText}>DAYS REMAINING</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15', borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText.toUpperCase()}</Text>
          </View>
        </View>

        {/* Technical Specifications */}
        <Text style={styles.sectionTitle}>Specifications</Text>
        <View style={styles.specCard}>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>DRUG NAME</Text>
            <Text style={styles.specVal}>{medicine.name}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>BATCH SERIAL ID</Text>
            <Text style={styles.specVal}>{medicine.batchNumber || 'N/A'}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>EXPIRATION DATE</Text>
            <Text style={styles.specVal}>{formatExpiryDate(medicine.expiryDate)}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>MANUFACTURER</Text>
            <Text style={styles.specVal}>{medicine.manufacturer || 'N/A'}</Text>
          </View>
          <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.specLabel}>VERIFICATION STATUS</Text>
            <View style={styles.riskBadgeWrapper}>
              <Circle cx="4" cy="4" r="4" fill={medicine.riskLevel === 'Likely Genuine' ? Theme.colors.trusted : Theme.colors.highRisk} style={{ width: 8, height: 8, marginRight: 6 }} />
              <Text style={[styles.riskLabel, { color: medicine.riskLevel === 'Likely Genuine' ? Theme.colors.trusted : Theme.colors.highRisk }]}>
                {medicine.riskLevel}
              </Text>
            </View>
          </View>
        </View>

        {/* Expiry Alarm Configurations */}
        <Text style={styles.sectionTitle}>Smart Alarm Scheduler</Text>
        <View style={styles.alarmCard}>
          <View style={styles.alarmRow}>
            <View>
              <Text style={styles.alarmTitle}>Enable Expiry Alerts</Text>
              <Text style={styles.alarmSubtitle}>Send push reminders before expiration</Text>
            </View>
            <Switch
              value={toggles.reminders}
              onValueChange={(val) => handleToggleChange('reminders', val)}
              trackColor={{ false: Theme.colors.border, true: Theme.colors.primaryLight }}
              thumbColor={Theme.colors.white}
            />
          </View>

          <View style={styles.alarmRow}>
            <View>
              <Text style={styles.alarmTitle}>30 Days Before Warning</Text>
              <Text style={styles.alarmSubtitle}>Early alert to plan replacements</Text>
            </View>
            <Switch
              value={toggles.remind30}
              disabled={!toggles.reminders}
              onValueChange={(val) => handleToggleChange('remind30', val)}
              trackColor={{ false: Theme.colors.border, true: Theme.colors.primaryLight }}
              thumbColor={Theme.colors.white}
            />
          </View>

          <View style={[styles.alarmRow, { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.alarmTitle}>7 Days Critical Alert</Text>
              <Text style={styles.alarmSubtitle}>Final alert before drug expires</Text>
            </View>
            <Switch
              value={toggles.remind7}
              disabled={!toggles.reminders}
              onValueChange={(val) => handleToggleChange('remind7', val)}
              trackColor={{ false: Theme.colors.border, true: Theme.colors.primaryLight }}
              thumbColor={Theme.colors.white}
            />
          </View>
        </View>

        {/* Cross Module Links */}
        <TouchableOpacity 
          style={styles.infoBtn}
          onPress={() => router.push(`/medicine/info-${encodeURIComponent(medicine.name)}`)}
        >
          <Text style={styles.infoBtnText}>VIEW USAGE & DOSAGE FILE</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.disposeBtn} onPress={handleDelete}>
          <Text style={styles.disposeBtnText}>PERMANENTLY DISPOSE MEDICINE</Text>
        </TouchableOpacity>
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
  gaugeCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
    ...Theme.shadows.medium,
  },
  gaugeWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  gaugeTextContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysLeftNumber: {
    fontSize: 48,
    fontWeight: '900',
  },
  daysLeftText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    marginTop: 4,
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
    letterSpacing: 1,
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
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  specVal: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textPrimary,
    fontWeight: '600',
  },
  riskBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: 'bold',
  },
  alarmCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: Theme.spacing.lg,
  },
  alarmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  alarmTitle: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  alarmSubtitle: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  infoBtn: {
    height: 52,
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
  },
  infoBtnText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: Theme.typography.sizes.xs,
    letterSpacing: 1.2,
  },
  disposeBtn: {
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
  disposeBtnText: {
    color: Theme.colors.highRisk,
    fontWeight: 'bold',
    fontSize: Theme.typography.sizes.xs,
    letterSpacing: 1,
  },
});
