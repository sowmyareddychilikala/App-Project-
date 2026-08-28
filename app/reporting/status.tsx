import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { databaseService, InspectorReport } from '../../services/databaseService';
import { Theme } from '../../constants/Theme';
import Svg, { Path, Circle } from 'react-native-svg';

export default function ReportStatusTracking() {
  const router = useRouter();
  const [reports, setReports] = useState<InspectorReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const data = await databaseService.getInspectorReports();
      
      // Dynamic fallback mock templates so the list has beautiful tracking timelines if DB is new!
      let reportsList = data;
      if (reportsList.length === 0) {
        reportsList = [
          {
            id: 'rep-99881',
            pharmacyId: 'p3',
            pharmacyName: 'Discount Lifeline Pharmacy',
            medicineName: 'Viagra 100mg (Counterfeit)',
            batchNumber: 'VIA-FAKE-88',
            description: 'Patient reported critical batch ID match warning. Dispatched immediate field officer.',
            status: 'Under Investigation',
            reportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'rep-99882',
            pharmacyId: 'p2',
            pharmacyName: 'MediGuard Care Chemists',
            medicineName: 'Aspirin Cardio 100mg',
            batchNumber: 'ASP-UNKNOWN-9',
            description: 'Report regarding slight packaging color tint and font anomalies.',
            status: 'Submitted',
            reportedAt: new Date().toISOString()
          }
        ];
      }
      setReports(reportsList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const formatTimestamp = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderReportCard = ({ item }: { item: InspectorReport }) => {
    let statusColor = Theme.colors.needsVerify;
    let step = 1;
    if (item.status === 'Submitted') {
      statusColor = Theme.colors.secondary;
      step = 1;
    } else if (item.status === 'Under Investigation') {
      statusColor = Theme.colors.needsVerify;
      step = 2;
    } else if (item.status === 'Action Taken') {
      statusColor = Theme.colors.trusted;
      step = 3;
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardId}>CASE ID: #{item.id?.toUpperCase()}</Text>
            <Text style={styles.pharmacyName}>{item.pharmacyName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15', borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.detailsText}>
          Medication: <Text style={styles.boldText}>{item.medicineName}</Text> {item.batchNumber ? `(Batch #${item.batchNumber})` : ''}
        </Text>
        <Text style={styles.descText}>"{item.description}"</Text>

        {/* 3-Step Timeline Progression Tracker */}
        <View style={styles.timelineRow}>
          {/* Step 1 */}
          <View style={styles.timelineStep}>
            <Circle cx="8" cy="8" r="8" fill={step >= 1 ? Theme.colors.primaryLight : Theme.colors.border} style={styles.timelineDot} />
            <Text style={[styles.timelineLabel, step >= 1 ? styles.activeLabel : null]}>SUBMITTED</Text>
          </View>

          <View style={[styles.timelineLine, { backgroundColor: step >= 2 ? Theme.colors.primaryLight : Theme.colors.border }]} />

          {/* Step 2 */}
          <View style={styles.timelineStep}>
            <Circle cx="8" cy="8" r="8" fill={step >= 2 ? Theme.colors.primaryLight : Theme.colors.border} style={styles.timelineDot} />
            <Text style={[styles.timelineLabel, step >= 2 ? styles.activeLabel : null]}>INVESTIGATING</Text>
          </View>

          <View style={[styles.timelineLine, { backgroundColor: step >= 3 ? Theme.colors.primaryLight : Theme.colors.border }]} />

          {/* Step 3 */}
          <View style={styles.timelineStep}>
            <Circle cx="8" cy="8" r="8" fill={step >= 3 ? Theme.colors.primaryLight : Theme.colors.border} style={styles.timelineDot} />
            <Text style={[styles.timelineLabel, step >= 3 ? styles.activeLabel : null]}>ACTION TAKEN</Text>
          </View>
        </View>

        <Text style={styles.timestampText}>Logged: {formatTimestamp(item.reportedAt)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/safety')}>
          <Text style={styles.backBtnText}>← SAFETY MAP</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Tracking</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.centerSpinner}>
          <ActivityIndicator size="large" color={Theme.colors.primaryLight} />
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportCard}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Incidents Filed</Text>
              <Text style={styles.emptyDesc}>You haven't escalated any pharmacy warnings or counterfeits to the Drug Inspector registry yet.</Text>
            </View>
          }
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
  centerSpinner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: 60,
    marginTop: Theme.spacing.lg,
  },
  card: {
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 24,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    paddingBottom: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  cardId: {
    fontSize: 9,
    color: Theme.colors.textMuted,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  pharmacyName: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.textPrimary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  detailsText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  boldText: {
    color: Theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  descText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textMuted,
    lineHeight: 16,
    fontStyle: 'italic',
    marginBottom: Theme.spacing.lg,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  timelineStep: {
    alignItems: 'center',
    width: 60,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  timelineLabel: {
    fontSize: 7,
    color: Theme.colors.textMuted,
    fontWeight: 'bold',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  activeLabel: {
    color: Theme.colors.primaryLight,
  },
  timelineLine: {
    flex: 1,
    height: 3,
    marginTop: -14, // aligns line centering with dots
  },
  timestampText: {
    fontSize: 9,
    color: Theme.colors.textMuted,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
    marginTop: 80,
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
  },
});
