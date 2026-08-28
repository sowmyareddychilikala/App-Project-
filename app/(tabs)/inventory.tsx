import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Dimensions, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { databaseService, MedicineItem } from '../../services/databaseService';
import { Theme } from '../../constants/Theme';
import Svg, { Path, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function ExpiryCabinet() {
  const router = useRouter();
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<MedicineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'near_expiry' | 'expired'>('all');

  const fetchInventory = async () => {
    try {
      const data = await databaseService.getMedicines();
      // Sort: Expired first, then Near Expiry, then Active
      const sorted = [...data].sort((a, b) => {
        const order = { expired: 0, near_expiry: 1, active: 2 };
        return order[a.status] - order[b.status];
      });
      setMedicines(sorted);
      applyFilter(sorted, activeFilter);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const applyFilter = (list: MedicineItem[], filter: typeof activeFilter) => {
    if (filter === 'all') {
      setFilteredMedicines(list);
    } else {
      setFilteredMedicines(list.filter((m) => m.status === filter));
    }
  };

  const handleFilterChange = (filter: typeof activeFilter) => {
    setActiveFilter(filter);
    applyFilter(medicines, filter);
  };

  const handleDelete = async (id: string, name: string) => {
    Alert.alert(
      'Dispose Medicine',
      `Are you sure you want to remove ${name} from your digital cabinet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispose',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await databaseService.deleteMedicine(id);
              await fetchInventory();
            } catch (err) {
              Alert.alert('Error', 'Failed to remove medicine record.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const calculateDaysLeft = (expiryString: string) => {
    const today = new Date();
    const expiry = new Date(expiryString);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatExpiryDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const renderMedicineCard = ({ item }: { item: MedicineItem }) => {
    const daysLeft = calculateDaysLeft(item.expiryDate);
    const riskColor = 
      item.riskLevel === 'Likely Genuine' ? Theme.colors.trusted :
      item.riskLevel === 'Needs Verification' ? Theme.colors.needsVerify : Theme.colors.highRisk;

    let statusText = 'ACTIVE';
    let statusColor = Theme.colors.trusted;
    let daysDescription = `${daysLeft} days remaining`;

    if (item.status === 'expired') {
      statusText = 'EXPIRED';
      statusColor = Theme.colors.highRisk;
      daysDescription = `Expired ${Math.abs(daysLeft)} days ago`;
    } else if (item.status === 'near_expiry') {
      statusText = 'EXPIRING SOON';
      statusColor = Theme.colors.needsVerify;
      daysDescription = `Expires in ${daysLeft} days!`;
    }

    return (
      <TouchableOpacity 
        style={[styles.medCard, { borderColor: statusColor + '40' }]}
        onPress={() => router.push(`/medicine/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.medName}>{item.name}</Text>
            <Text style={styles.medManufacturer}>{item.manufacturer}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15', borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        {/* Metadata Details Row */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailsCol}>
            <Text style={styles.detailTitle}>BATCH ID</Text>
            <Text style={styles.detailVal}>{item.batchNumber}</Text>
          </View>
          <View style={styles.detailsCol}>
            <Text style={styles.detailTitle}>EXPIRY DATE</Text>
            <Text style={styles.detailVal}>{formatExpiryDate(item.expiryDate)}</Text>
          </View>
        </View>

        {/* Expiry Timeline progress bar */}
        <View style={styles.progressContainer}>
          <Text style={[styles.progressDesc, { color: statusColor }]}>{daysDescription}</Text>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: item.status === 'expired' ? '100%' : `${Math.max(10, Math.min(100, (daysLeft / 365) * 100))}%`,
                  backgroundColor: statusColor 
                }
              ]} 
            />
          </View>
        </View>

        {/* Card Footer Actions */}
        <View style={styles.cardFooter}>
          <View style={[styles.riskLabelBadge, { backgroundColor: riskColor + '10' }]}>
            <Circle cx="4" cy="4" r="4" fill={riskColor} style={{ width: 8, height: 8, marginRight: 6 }} />
            <Text style={[styles.riskLabelText, { color: riskColor }]}>{item.riskLevel}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id!, item.name)}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path d="M3 6 H21 M19 6 V20 A2 2 0 0 1 17 22 H7 A2 2 0 0 1 5 20 V6 M8 6 V4 A2 2 0 0 1 10 2 H14 A2 2 0 0 1 16 4 V6" fill="none" stroke={Theme.colors.highRisk} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Medicine Cabinet</Text>
      <Text style={styles.subtitle}>Manage your medicine stocks, track expiry deadlines, and verify safety logs.</Text>

      {/* Filters strip */}
      <View style={styles.filterStrip}>
        {(['all', 'active', 'near_expiry', 'expired'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter ? styles.activeFilterTab : null
            ]}
            onPress={() => handleFilterChange(filter)}
          >
            <Text style={[
              styles.filterTabText,
              activeFilter === filter ? styles.activeFilterTabText : null
            ]}>
              {filter === 'near_expiry' ? 'NEAR EXPIRY' : filter.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Medicines list flatlist */}
      {loading && !refreshing ? (
        <View style={styles.centerSpinner}>
          <ActivityIndicator size="large" color={Theme.colors.primaryLight} />
        </View>
      ) : filteredMedicines.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Svg width={100} height={100} viewBox="0 0 24 24" style={styles.emptyIcon}>
            <Path d="M4 4 H20 V20 H4 Z" fill="none" stroke={Theme.colors.border} strokeWidth={2} />
            <Path d="M4 9 H20 M4 14 H20" stroke={Theme.colors.border} strokeWidth={2} />
          </Svg>
          <Text style={styles.emptyDesc}>No medicines found matching the active filter.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMedicines}
          renderItem={renderMedicineCard}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primaryLight} />}
        />
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
  filterStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.cardBackground,
  },
  activeFilterTab: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterTabText: {
    fontSize: 9,
    color: Theme.colors.textSecondary,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  activeFilterTabText: {
    color: Theme.colors.white,
  },
  centerSpinner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: 120, // space to avoid bottom tabs clipping
    marginTop: Theme.spacing.md,
  },
  medCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1,
    borderRadius: 20,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medName: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
  },
  medManufacturer: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  detailsGrid: {
    flexDirection: 'row',
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  detailsCol: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 8,
    color: Theme.colors.textMuted,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  detailVal: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: Theme.spacing.md,
  },
  progressDesc: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  riskLabelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  riskLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
    marginTop: 40,
  },
  emptyIcon: {
    marginBottom: Theme.spacing.md,
  },
  emptyTitle: {
    fontSize: Theme.typography.sizes.lg,
    color: Theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  emptyDesc: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Theme.spacing.sm,
    maxWidth: width * 0.75,
  },
  scanQuickBtn: {
    marginTop: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
  },
  scanQuickText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: Theme.typography.sizes.xs,
    letterSpacing: 1,
  },
});
