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
import { AddSafetyReportModal } from './AddSafetyReportModal';
import { listenSuspiciousMedicines } from '../../services/dbService';

export const RecentSuspiciousMedicinesScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('All'); // All, Label Errors, Discoloration, Packaging
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const loadMockMedicines = () => {
      setMedicines([
        {
          id: 'susp_1',
          name: "Amoxycillin 500mg",
          manufacturer: "GlobalPharma Solutions",
          reportsCount: 14,
          suspicion: "Mismatched pill color in Batch #2901-X",
          status: "Urgent",
          imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDp7hi7FdWJyAAGRF6T9s5Xux2ti8Kvjd4Xs6mDIejYa7iwYhLAseHV7ylSSpHOmIOIw9sT6DHzS9IjCMR5Qz2_YOpST2Ozqk-QUoglY0K7vzwco9vyZlsSohJ4PMjob9OqAaTKCvdiIWAcWULSNT53uVIQxuvmkw-d8GLQM99VStP4fH4UbnvBZ06DYh6T-xwbjUwaltJHIRHE-sYdkI3tB2IYnXzwJ1d_nDMeJ4OLc9fiOneQXmNqKKKKKVi2EnybKUEq-SIdtQh-"
        },
        {
          id: 'susp_2',
          name: "CardioPress XL",
          manufacturer: "HealthCore Labs",
          reportsCount: 8,
          suspicion: "Label typo 'Expiry' spelled 'Expirry'",
          status: "Active",
          imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuABKYt0-XK9_MHqLFeHJWOgfPxMB6NURZUq0Ici1ORCtwz3BiKB_KK7171Udno1i2imJoSAU2cyVDGTJpYYJVfwBKPXt9mmP4zQ4KHRQWoEjFntiFwjbul5teA5LxkfLWQEFUSTTrcVVf9i4UTORhPDXrD3DJScKzucSfqYz6xxe1t-eXSpo8hilOpE7dLW-Pns9HIjSLEPCR5DO_XBTZoZMRvhD8H8zQAgmM-5xwoaYLH62MPiup-LieBSuZE-k0XcwbWsaOtJ8OiH"
        },
        {
          id: 'susp_3',
          name: "Insulin Gen-A",
          manufacturer: "BioGenerics Inc.",
          reportsCount: 5,
          suspicion: "Box seal appears tampered or reglued",
          status: "Active",
          imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDZpr57q3Aq2Gdp7XYCzgC4vBvp-cr7FIVDR1x7jKt0wqBYPjtNwJyNv5RdPYAfh-0QklBDybuMxyyHwkkdTBqFxbUy_wZogjMShEzMS-FVQiBskLEBr0jB79FnTJJsOrRPA-JgXyZyGSijGQpZjxonuVw0j9CMXAFWMoM0vTZAq7RJlsO-y35LHkmB4E-8eLKURbteUtVuanARjeecjhmzFJZYzxEAA8IMJCPzzrZgsyFD9KdZZ2osZW77LKBXoPtvpZf4zRyMgAfP"
        },
        {
          id: 'susp_4',
          name: "NeuroZenic 10",
          manufacturer: "MindPath Medical",
          reportsCount: 22,
          suspicion: "Cloudy Liquid",
          status: "Investigation",
          imageUrl: ""
        }
      ]);
      setLoading(false);
    };

    if (mockUser) {
      loadMockMedicines();
    } else {
      const unsub = listenSuspiciousMedicines(
        (data) => {
          const list = Object.values(data);
          if (list.length === 0) {
            loadMockMedicines();
            return;
          }
          setMedicines(list);
          setLoading(false);
        },
        (err) => {
          console.warn("Suspicious medicines access restricted, loading local mocks:", err);
          loadMockMedicines();
        }
      );
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, [uid, mockUser]);

  const getFilteredMedicines = () => {
    return medicines.filter(med => {
      // 1. Search Query Filter
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        med.name?.toLowerCase().includes(query) ||
        med.manufacturer?.toLowerCase().includes(query) ||
        med.suspicion?.toLowerCase().includes(query);

      // 2. Chip Filter (Label Errors, Discoloration, Packaging)
      let matchesChip = true;
      if (activeChip === 'Label Errors') {
        matchesChip = med.suspicion?.toLowerCase().includes('label') || med.suspicion?.toLowerCase().includes('typo');
      } else if (activeChip === 'Discoloration') {
        matchesChip = med.suspicion?.toLowerCase().includes('color') || med.suspicion?.toLowerCase().includes('cloudy') || med.suspicion?.toLowerCase().includes('liquid');
      } else if (activeChip === 'Packaging') {
        matchesChip = med.suspicion?.toLowerCase().includes('packaging') || med.suspicion?.toLowerCase().includes('seal') || med.suspicion?.toLowerCase().includes('box') || med.suspicion?.toLowerCase().includes('tamper');
      }

      return matchesSearch && matchesChip;
    });
  };

  const filteredMedicines = getFilteredMedicines();

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
        {/* Search Panel */}
        <View style={styles.searchPanel}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search suspicious medicines..."
              placeholderTextColor={colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Quick Category Scroll */}
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {['All', 'Label Errors', 'Discoloration', 'Packaging'].map((chip) => {
              const isActive = activeChip === chip;
              return (
                <TouchableOpacity
                  key={chip}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setActiveChip(chip)}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {chip === 'All' ? 'All Reports' : chip}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Suspicious Items</Text>
            <Text style={styles.sectionSubTitle}>Recent Community Flags</Text>
          </View>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE ALERTS</Text>
          </View>
        </View>

        {/* List Feed */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : filteredMedicines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="healing" size={48} color={colors.outlineVariant} />
            <Text style={styles.emptyText}>No suspicious medicines flagged matching your search.</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredMedicines.map((med) => {
              const isUrgent = med.status === 'Urgent';
              return (
                <TouchableOpacity
                  key={med.id}
                  style={styles.card}
                  onPress={() => {
                    Alert.alert(
                      med.name,
                      `Manufacturer: ${med.manufacturer}\nFlags: ${med.reportsCount} Reports\n\nSuspicion:\n${med.suspicion}`
                    );
                  }}
                  activeOpacity={0.9}
                >
                  {/* Left Thumbnail */}
                  <View style={styles.thumbnailContainer}>
                    {med.imageUrl ? (
                      <Image source={{ uri: med.imageUrl }} style={styles.thumbnail} />
                    ) : (
                      <View style={styles.thumbnailPlaceholder}>
                        <MaterialIcons name="healing" size={32} color={colors.outline} />
                      </View>
                    )}
                    {isUrgent && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentBadgeText}>URGENT</Text>
                      </View>
                    )}
                  </View>

                  {/* Right Content */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.medName} numberOfLines={1}>{med.name}</Text>
                      <View style={styles.badgeRow}>
                        <MaterialIcons name="warning" size={12} color="#e67e22" />
                        <Text style={styles.badgeText}>{med.reportsCount} Reports</Text>
                      </View>
                    </View>

                    <Text style={styles.manufacturer}>{med.manufacturer.toUpperCase()}</Text>

                    <View style={styles.suspicionRow}>
                      <MaterialIcons
                        name={isUrgent ? "emergency" : "edit-note"}
                        size={14}
                        color={isUrgent ? colors.error : colors.textSecondary}
                      />
                      <Text style={styles.suspicionText} numberOfLines={2}>{med.suspicion}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Action SOS Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.9}
      >
        <MaterialIcons name="add-alert" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* Report Modal */}
      <AddSafetyReportModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        uid={uid}
        mockUser={mockUser}
      />

      {/* Bottom Navigation */}
      <SafetyNavbar currentTab="medicines" navigation={navigation} routeParams={params} />
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
  searchPanel: {
    marginBottom: 20,
    gap: 12,
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
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  chipRow: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Public Sans',
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionSubTitle: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    opacity: 0.75,
    marginTop: 2,
  },
  liveBadge: {
    backgroundColor: colors.error + '1A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveBadgeText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 10,
    fontWeight: '800',
    color: colors.error,
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
  listContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 2,
  },
  thumbnailContainer: {
    width: 96,
    height: 96,
    backgroundColor: colors.surfaceContainerLow,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  urgentBadgeText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 8,
    fontWeight: '800',
    color: colors.white,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  medName: {
    flex: 1,
    fontFamily: 'Public Sans',
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 3,
  },
  badgeText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  manufacturer: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 10,
    fontWeight: '700',
    color: colors.outline,
    marginTop: 2,
  },
  suspicionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  suspicionText: {
    flex: 1,
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 12,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 84,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10,
  },
});

export default RecentSuspiciousMedicinesScreen;
