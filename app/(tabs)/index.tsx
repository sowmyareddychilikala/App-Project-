import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Dimensions, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ref, get } from 'firebase/database';
import { auth, database } from '../../services/firebaseConfig';
import { databaseService, MedicineItem } from '../../services/databaseService';
import { Theme } from '../../constants/Theme';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function HomeDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('User');
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, expiring: 0, expired: 0 });

  const loadDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // 1. Fetch user's profile details
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setUserName(snapshot.val().fullName || 'User');
        }

        // 2. Fetch user's medicine inventory
        const meds = await databaseService.getMedicines();
        setMedicines(meds);

        // 3. Compute stats
        const activeMeds = meds.length;
        const expiringCount = meds.filter((m) => m.status === 'near_expiry').length;
        const expiredCount = meds.filter((m) => m.status === 'expired').length;
        
        setStats({
          total: activeMeds,
          expiring: expiringCount,
          expired: expiredCount
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to log out of MediGuard AI?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await auth.signOut();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>HELLO,</Text>
          <Text style={styles.profileName}>{userName} 👋</Text>
        </View>
        <TouchableOpacity style={styles.profileAvatar} onPress={handleLogout}>
          {/* Custom SVG Avatar icon */}
          <Svg width={36} height={36} viewBox="0 0 24 24">
            <Circle cx="12" cy="8" r="4" fill="none" stroke={Theme.colors.primaryLight} strokeWidth={2} />
            <Path d="M4 20 C4 16 8 15 12 15 C16 15 20 16 20 20" fill="none" stroke={Theme.colors.primaryLight} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primaryLight} />}
      >
        {loading ? (
          <View style={styles.centerSpinner}>
            <ActivityIndicator size="large" color={Theme.colors.primaryLight} />
          </View>
        ) : (
          <View>
            {/* Quick Expiry Alerts Banner if expired medicines are detected */}
            {stats.expired > 0 && (
              <TouchableOpacity style={styles.alertBanner} onPress={() => router.push('/(tabs)/inventory')}>
                <View style={styles.alertBannerLeft}>
                  <Svg width={24} height={24} viewBox="0 0 24 24">
                    <Path d="M12 2 L2 22 H22 Z" fill={Theme.colors.highRisk} />
                    <Path d="M12 9 V13 M12 17 H12.01" stroke={Theme.colors.white} strokeWidth={2.5} strokeLinecap="round" />
                  </Svg>
                  <View style={styles.alertTextWrapper}>
                    <Text style={styles.alertTitle}>Expired Medicine Alert!</Text>
                    <Text style={styles.alertDesc}>You have {stats.expired} expired item(s) in your cabinet. Tap to clean up.</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Quick Stats Grid Widgets */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Active Drugs</Text>
              </View>
              <View style={[styles.statCard, { borderColor: stats.expiring > 0 ? Theme.colors.needsVerify : Theme.colors.border }]}>
                <Text style={[styles.statNumber, { color: Theme.colors.needsVerify }]}>{stats.expiring}</Text>
                <Text style={styles.statLabel}>Near Expiry</Text>
              </View>
              <View style={[styles.statCard, { borderColor: stats.expired > 0 ? Theme.colors.highRisk : Theme.colors.border }]}>
                <Text style={[styles.statNumber, { color: Theme.colors.highRisk }]}>{stats.expired}</Text>
                <Text style={styles.statLabel}>Expired Total</Text>
              </View>
            </View>

            {/* Quick Actions Grid */}
            <Text style={styles.sectionTitle}>Quick Services</Text>
            <View style={styles.gridContainer}>
              {/* My Medicines Cabinet */}
              <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(tabs)/inventory')}>
                <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Svg width={30} height={30} viewBox="0 0 24 24">
                    <Path d="M4 4 H20 V20 H4 Z" fill="none" stroke={Theme.colors.secondary} strokeWidth={2.5} />
                    <Path d="M4 9 H20 M4 14 H20" stroke={Theme.colors.secondary} strokeWidth={2} />
                  </Svg>
                </View>
                <Text style={styles.gridTitle}>My Cabinet</Text>
                <Text style={styles.gridDesc}>Track expiries</Text>
              </TouchableOpacity>

              {/* Medicine Lookup */}
              <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(tabs)/search')}>
                <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Svg width={30} height={30} viewBox="0 0 24 24">
                    <Circle cx="11" cy="11" r="6" fill="none" stroke={Theme.colors.needsVerify} strokeWidth={2.5} />
                    <Path d="M16 16 L21 21" stroke={Theme.colors.needsVerify} strokeWidth={2.5} strokeLinecap="round" />
                  </Svg>
                </View>
                <Text style={styles.gridTitle}>Search Drug</Text>
                <Text style={styles.gridDesc}>Dosages & warnings</Text>
              </TouchableOpacity>

              {/* Pharmacy Reputation Finder */}
              <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(tabs)/safety')}>
                <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Svg width={30} height={30} viewBox="0 0 24 24">
                    <Path d="M12 2 L22 8 V20 L12 22 L2 20 V8 Z" fill="none" stroke={Theme.colors.trusted} strokeWidth={2.5} />
                    <Path d="M9 12 L11 14 L15 10" fill="none" stroke={Theme.colors.trusted} strokeWidth={2.5} />
                  </Svg>
                </View>
                <Text style={styles.gridTitle}>Safety Alerts</Text>
                <Text style={styles.gridDesc}>Nearby recall map</Text>
              </TouchableOpacity>
            </View>

            {/* Critical Community Alerts */}
            <Text style={styles.sectionTitle}>Community Safety Recalls</Text>
            <View style={styles.recallContainer}>
              <View style={styles.recallCard}>
                <View style={styles.recallBadgeHigh}>
                  <Text style={styles.recallBadgeText}>RECALL URGENT</Text>
                </View>
                <Text style={styles.recallDrugName}>Paracetamol - Batch #PA8832</Text>
                <Text style={styles.recallDetails}>Reason: Contains higher concentration of impurities. Traced back to Discount Lifeline Pharmacy. Avoid usage immediately.</Text>
                <Text style={styles.recallDate}>3 hours ago</Text>
              </View>

              <View style={styles.recallCard}>
                <View style={styles.recallBadgeWarn}>
                  <Text style={styles.recallBadgeText}>UNDER OBSERVATION</Text>
                </View>
                <Text style={styles.recallDrugName}>Amoxicillin - Batch #AM2201</Text>
                <Text style={styles.recallDetails}>Reason: Packaging defects causing moisture ingress. Report any unusual texture or color shifts.</Text>
                <Text style={styles.recallDate}>Yesterday</Text>
              </View>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  greetingText: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  profileName: {
    fontSize: Theme.typography.sizes.xl,
    color: Theme.colors.textPrimary,
    fontWeight: '900',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.cardBackground,
  },
  scrollContent: {
    paddingBottom: 100, // Bottom padding to prevent layout clipping by navigation tabs
  },
  centerSpinner: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBanner: {
    margin: Theme.spacing.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: Theme.colors.highRisk,
    borderRadius: 16,
    padding: Theme.spacing.md,
  },
  alertBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertTextWrapper: {
    marginLeft: Theme.spacing.md,
    flex: 1,
  },
  alertTitle: {
    color: Theme.colors.textPrimary,
    fontWeight: 'bold',
    fontSize: Theme.typography.sizes.md,
  },
  alertDesc: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.xs,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  statCard: {
    width: (width - 48) / 3,
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 16,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    ...Theme.shadows.small,
  },
  statNumber: {
    fontSize: 28,
    color: Theme.colors.textPrimary,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
    letterSpacing: 0.5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  gridItem: {
    width: (width - 48) / 2,
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 20,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.small,
  },
  gridIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  gridTitle: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  gridDesc: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 4,
  },
  recallContainer: {
    paddingHorizontal: Theme.spacing.lg,
  },
  recallCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  recallBadgeHigh: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.highRisk,
    borderRadius: 6,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 3,
    marginBottom: Theme.spacing.sm,
  },
  recallBadgeWarn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.needsVerify,
    borderRadius: 6,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 3,
    marginBottom: Theme.spacing.sm,
  },
  recallBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
  },
  recallDrugName: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recallDetails: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  recallDate: {
    fontSize: 9,
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.sm,
    alignSelf: 'flex-end',
  },
});
