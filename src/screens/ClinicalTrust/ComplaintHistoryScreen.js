import React, { useState, useEffect } from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  FlatList, 
  Platform, 
  StatusBar,
  ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { listenUserComplaints } from '../../services/dbService';
import { auth } from '../../../firebaseConfig';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const ComplaintHistoryScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock list in offline mode
  const mockComplaints = [
    {
      id: 'comp_1',
      pharmacyName: 'Central Metro Pharmacy',
      issueType: 'Overpricing',
      severity: 'Critical',
      date: 'Oct 14, 2023',
      description: 'Patient reported markup of 400% on insulin analogues compared to MSRP.',
      status: 'Under Investigation'
    },
    {
      id: 'comp_2',
      pharmacyName: 'Central Metro Pharmacy',
      issueType: 'Expired Medication',
      severity: 'Moderate',
      date: 'Sep 02, 2023',
      description: 'Shelf audit revealed 3 units of Amoxicillin past expiry date. Pharmacy complied with removal.',
      status: 'Resolved'
    },
    {
      id: 'comp_3',
      pharmacyName: 'Central Metro Pharmacy',
      issueType: 'Suspected Counterfeit',
      severity: 'High Risk',
      date: 'Jul 22, 2023',
      description: 'Packaging inconsistencies detected during spot check. Material sent for lab verification.',
      status: 'Flagged'
    },
    {
      id: 'comp_4',
      pharmacyName: 'Central Metro Pharmacy',
      issueType: 'Unprofessional Conduct',
      severity: 'Low',
      date: 'May 15, 2023',
      description: 'Staff behavior complaint. Management issued formal apology and retraining initiated.',
      status: 'Resolved'
    }
  ];

  useEffect(() => {
    if (mockUser) {
      setComplaints(mockComplaints);
      setLoading(false);
      return;
    }
    const activeUid = auth?.currentUser?.uid || uid;
    if (activeUid) {
      const unsubscribe = listenUserComplaints(activeUid, (data) => {
        if (data && Object.keys(data).length > 0) {
          const list = Object.values(data).sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
          setComplaints(list);
        } else {
          setComplaints([]);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [uid, mockUser]);

  const renderComplaintItem = ({ item }) => {
    // Styling attributes based on severity/status
    const isCritical = item.severity === 'Critical' || item.severity === 'High Risk';
    const isModerate = item.severity === 'Moderate';
    const isResolved = item.status === 'Resolved';
    const isFlagged = item.status === 'Flagged';

    const getSeverityBadgeColor = () => {
      if (item.severity === 'Critical') return { bg: '#ffebee', txt: '#b71c1c', border: '#e57373' };
      if (item.severity === 'High Risk') return { bg: '#fff3e0', txt: '#e65100', border: '#ffb74d' };
      if (item.severity === 'Moderate') return { bg: '#fffde7', txt: '#f57f17', border: '#fff176' };
      return { bg: '#e8f5e9', txt: '#1b5e20', border: '#81c784' };
    };

    const badge = getSeverityBadgeColor();

    return (
      <View style={[
        styles.complaintCard,
        isCritical ? styles.cardBorderCritical : isModerate ? styles.cardBorderModerate : styles.cardBorderLow
      ]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconCircle, isCritical ? { backgroundColor: '#ffebee' } : { backgroundColor: colors.primaryFixed }]}>
              <MaterialIcons 
                name={item.issueType.includes('price') || item.issueType.includes('Overpricing') ? "payments" : item.issueType.includes('Expired') ? "event-busy" : "warning"} 
                size={20} 
                color={isCritical ? colors.error : colors.primary} 
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={styles.issueTitle}>{item.issueType}</Text>
                <View style={[styles.severityBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                  <Text style={[styles.severityBadgeText, { color: badge.txt }]}>{item.severity}</Text>
                </View>
              </View>
              <Text style={styles.metaText}>
                ID: #{item.id.slice(-8).toUpperCase()} • {item.date}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.descText}>{item.description}</Text>
          <Text style={styles.pharmacyMeta}>Pharmacy: {item.pharmacyName}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={[
            styles.statusBadge,
            isResolved ? styles.statusResolved : isFlagged ? styles.statusFlagged : styles.statusPending
          ]}>
            <MaterialIcons 
              name={isResolved ? "check-circle" : isFlagged ? "flag" : "pending"} 
              size={14} 
              color={isResolved ? colors.secondary : isFlagged ? '#e67e22' : colors.outline} 
            />
            <Text style={[
              styles.statusText,
              isResolved ? { color: colors.secondary } : isFlagged ? { color: '#e67e22' } : { color: colors.outline }
            ]}>{item.status}</Text>
          </View>
        </View>
      </View>
    );
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
          <Text style={styles.headerTitle}>Incident Log</Text>
        </View>
        <TouchableOpacity style={styles.avatarMini} onPress={() => navigation.navigate('Dashboard', { screen: 'profile' })}>
          <MaterialIcons name="account-circle" size={26} color={colors.outline} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Intro */}
        <View style={styles.introBlock}>
          <Text style={styles.introTitle}>Historical Audits</Text>
          <Text style={styles.introSubtitle}>
            Track regulatory status of all complaints submitted under your profile.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading history log...</Text>
          </View>
        ) : complaints.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="assignment-late" size={48} color={colors.outlineVariant} />
            <Text style={styles.emptyText}>You haven't filed any complaint logs yet.</Text>
          </View>
        ) : (
          <FlatList
            data={complaints}
            renderItem={renderComplaintItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listScroll}
            showsVerticalScrollIndicator={false}
          />
        )}
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
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  introBlock: {
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  introSubtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.outline,
    fontWeight: '600',
  },
  listScroll: {
    paddingBottom: 40,
    gap: 16,
  },
  complaintCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    padding: 16,
    borderLeftWidth: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  cardBorderCritical: {
    borderLeftColor: colors.error,
  },
  cardBorderModerate: {
    borderLeftColor: '#e67e22',
  },
  cardBorderLow: {
    borderLeftColor: colors.outline,
  },
  cardHeader: {
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  issueTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  severityBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metaText: {
    fontSize: 11,
    color: colors.outline,
    marginTop: 2,
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: 12,
  },
  descText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 17,
    fontWeight: '500',
  },
  pharmacyMeta: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant + '33',
    paddingTop: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusResolved: {
    backgroundColor: colors.secondaryContainer,
  },
  statusFlagged: {
    backgroundColor: '#fff3e0',
  },
  statusPending: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.outline,
    fontWeight: '600',
    textAlign: 'center',
  }
});

export default ComplaintHistoryScreen;
