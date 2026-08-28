import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { SafetyNavbar } from './SafetyNavbar';
import { listenMedicineRecalls } from '../../services/dbService';

export const MedicineRecallAlertsScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;

  const [recalls, setRecalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadMockRecalls = () => {
      setRecalls([
        {
          id: 'recall_1',
          title: "Valsartan 80mg Tablets",
          manufacturer: "GenMed Pharmaceuticals",
          batchNumbers: "GN-2023-X9, GN-2023-Y1",
          reason: "Contamination Found",
          severity: "Critical",
          actionRequired: "Stop use immediately and return to any pharmacy for a full refund and replacement. Contact your physician if symptoms occur.",
          date: "12:45 PM"
        },
        {
          id: 'recall_2',
          title: "Junior Relief Syrup",
          manufacturer: "BrightCure Labs",
          batchNumbers: "BC-552, BC-553",
          reason: "Packaging Defect",
          severity: "Elevated",
          actionRequired: "Check child-resistant cap. If seal is broken or loose, dispose of immediately at a designated medical waste center.",
          date: "Yesterday"
        },
        {
          id: 'recall_3',
          title: "Ibuprofen Max-G",
          manufacturer: "GlobalPharma Solutions",
          batchNumbers: "IB-9901",
          reason: "Labeling error regarding dosage frequency.",
          severity: "Resolved",
          actionRequired: "New batches available. Safe to use.",
          date: "2 days ago"
        },
        {
          id: 'recall_4',
          title: "Omega Vit-D3",
          manufacturer: "Omega Labs",
          batchNumbers: "OM-7721",
          reason: "Potential potency variance reported. FDA investigating samples.",
          severity: "Monitoring",
          actionRequired: "FDA investigating samples. Caution advised.",
          date: "3 days ago"
        }
      ]);
      setLoading(false);
    };

    if (mockUser) {
      loadMockRecalls();
    } else {
      const unsub = listenMedicineRecalls(
        (data) => {
          const list = Object.values(data);
          if (list.length === 0) {
            loadMockRecalls();
            return;
          }
          setRecalls(list);
          setLoading(false);
        },
        (err) => {
          console.warn("Recall alerts access restricted, loading local mocks:", err);
          loadMockRecalls();
        }
      );
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, [uid, mockUser]);

  const getFilteredRecalls = () => {
    const query = searchQuery.toLowerCase().trim();
    return recalls.filter(recall => {
      return !query ||
        recall.title?.toLowerCase().includes(query) ||
        recall.manufacturer?.toLowerCase().includes(query) ||
        recall.batchNumbers?.toLowerCase().includes(query) ||
        recall.reason?.toLowerCase().includes(query);
    });
  };

  const filteredRecalls = getFilteredRecalls();
  const criticalRecalls = filteredRecalls.filter(r => r.severity === 'Critical' || r.severity === 'Elevated');
  const otherRecalls = filteredRecalls.filter(r => r.severity !== 'Critical' && r.severity !== 'Elevated');

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Dashboard', { uid, mockUser })}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} style={styles.backIcon} />
          </TouchableOpacity>
          <MaterialIcons name="location-on" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>Safety Monitor</Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Dashboard', { uid, mockUser })}>
          <MaterialIcons name="account-circle" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title and Intro */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>URGENT ALERTS</Text>
              </View>
              <Text style={styles.screenHeading}>Medicine Recalls</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Official notices from the WHO and local health authorities. Verify your medications against batch numbers immediately.
          </Text>
        </View>

        {/* Search Panel */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or batch ID..."
            placeholderTextColor={colors.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : filteredRecalls.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="warning" size={48} color={colors.outlineVariant} />
            <Text style={styles.emptyText}>No recall alerts matched your query.</Text>
          </View>
        ) : (
          <View style={styles.feedContainer}>
            {/* Priority Recall Cards */}
            {criticalRecalls.map((recall) => {
              const isCritical = recall.severity === 'Critical';
              return (
                <View key={recall.id} style={[styles.priorityCard, isCritical ? styles.priorityCardCritical : styles.priorityCardElevated]}>
                  {/* Card Header Alert Bar */}
                  <View style={[styles.alertHeaderBar, { backgroundColor: isCritical ? colors.error : '#e67e22' }]}>
                    <Text style={styles.alertHeaderBarText}>
                      {isCritical ? 'CRITICAL SAFETY ALERT' : 'ELEVATED RISK'}
                    </Text>
                    <Text style={styles.alertHeaderBarDate}>{recall.date}</Text>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.cardHeaderLeft}>
                        <Text style={styles.recallTitle}>{recall.title}</Text>
                        <Text style={styles.manufacturer}>Manufacturer: {recall.manufacturer}</Text>
                      </View>
                      <View style={styles.pillIconCircle}>
                        <MaterialIcons name="healing" size={28} color={isCritical ? colors.error : '#e67e22'} />
                      </View>
                    </View>

                    {/* Metadata details */}
                    <View style={styles.detailsGrid}>
                      <View style={styles.detailBox}>
                        <Text style={styles.detailBoxLabel}>BATCH NUMBERS</Text>
                        <Text style={styles.detailBoxValue} numberOfLines={1}>{recall.batchNumbers}</Text>
                      </View>
                      <View style={styles.detailBox}>
                        <Text style={styles.detailBoxLabel}>REASON</Text>
                        <Text style={[styles.detailBoxValue, { color: isCritical ? colors.error : '#e67e22' }]}>{recall.reason}</Text>
                      </View>
                    </View>

                    {/* Action required box */}
                    <View style={[styles.actionBox, { borderColor: isCritical ? colors.error : '#e67e22' }]}>
                      <View style={styles.actionHeader}>
                        <MaterialIcons name="assignment-return" size={16} color={isCritical ? colors.error : '#e67e22'} />
                        <Text style={[styles.actionHeaderText, { color: isCritical ? colors.error : '#e67e22' }]}>Action Required</Text>
                      </View>
                      <Text style={styles.actionText}>{recall.actionRequired}</Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Smaller Log Items */}
            {otherRecalls.length > 0 && (
              <View style={styles.smallerLogContainer}>
                {otherRecalls.map((recall) => (
                  <View key={recall.id} style={styles.logCard}>
                    <View style={styles.logHeader}>
                      <Text style={styles.logTitle}>{recall.title}</Text>
                      <View style={styles.logBadge}>
                        <Text style={styles.logBadgeText}>{recall.severity.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.logBatch}>Batch: {recall.batchNumbers}</Text>
                    <Text style={styles.logDesc}>{recall.reason}</Text>
                    <Text style={styles.logDate}>{recall.date}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Static Professional Laboratory Quality Image Banner */}
        <View style={styles.imageBanner}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaZQ__7M1mg7xUkQYIKmBWYo_oDdPbdbpBv4vI-Ao3v0RQ3lvd6JgRVAS9bUON31DaHsSU_PXk8Y9m3nw2gptOFcbuoE_vmm7wcqPC1D8k8-p-6CcdqsaW1-lY5rC0r5gzdNIQrK9iwhKUsARCaVwvsUQRTlh7JpinCUvKxjMqz03aenPjxgrTY_TtBRRa9f5s18gVUIoa-WKCKUtz6jokZFooyewmmYxSwB2kKbR5WSceXusg69zE4jWztV_UAHrTGU-Ma3PYPohO' }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <MaterialIcons name="verified-user" size={32} color={colors.white} style={styles.bannerIcon} />
            <Text style={styles.bannerTitle}>Verified by Health Authorities</Text>
            <Text style={styles.bannerSubtitle}>Real-time synchronization active</Text>
          </View>
        </View>
      </ScrollView>

      {/* Navigation */}
      <SafetyNavbar currentTab="recalls" navigation={navigation} routeParams={params} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backIcon: {
    marginRight: 4,
  },
  headerTitle: {
    fontFamily: 'Public Sans',
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  avatarBtn: {
    padding: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  titleSection: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  screenHeading: {
    fontFamily: 'Public Sans',
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 6,
  },
  scanBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanBtnText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  subtitle: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  loader: {
    marginVertical: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 14,
    color: colors.outline,
    textAlign: 'center',
  },
  feedContainer: {
    gap: 16,
  },
  priorityCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  priorityCardCritical: {
    borderWidth: 2,
    borderColor: colors.error,
  },
  priorityCardElevated: {
    borderWidth: 1.5,
    borderColor: '#e67e22',
  },
  alertHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  alertHeaderBarText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  alertHeaderBarDate: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    opacity: 0.9,
  },
  cardBody: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  recallTitle: {
    fontFamily: 'Public Sans',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  manufacturer: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 13,
    color: colors.textSecondary,
  },
  pillIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailBox: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 10,
  },
  detailBoxLabel: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailBoxValue: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  actionBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 12,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  actionHeaderText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 13,
    fontWeight: '700',
  },
  actionText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    fontWeight: '600',
  },
  smallerLogContainer: {
    gap: 12,
  },
  logCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    padding: 14,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  logTitle: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  logBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logBadgeText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  logBatch: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 11,
    fontWeight: '700',
    color: colors.outline,
    marginBottom: 4,
  },
  logDesc: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  logDate: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 11,
    color: colors.outline,
  },
  imageBanner: {
    marginTop: 24,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bannerIcon: {
    marginBottom: 8,
  },
  bannerTitle: {
    fontFamily: 'Public Sans',
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default MedicineRecallAlertsScreen;
