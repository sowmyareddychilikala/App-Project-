import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Animated,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { SafetyNavbar } from './SafetyNavbar';
import { AddSafetyReportModal } from './AddSafetyReportModal';
import { listenCommunityAlerts, seedDefaultSafetyData } from '../../services/dbService';

const { width, height } = Dimensions.get('window');

export const SafetyMapScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, medicine, pharmacy
  const [alerts, setAlerts] = useState({});
  const [loading, setLoading] = useState(true);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);

  // Animation for the drawer collapse/expand
  const [drawerHeight] = useState(new Animated.Value(180));

  useEffect(() => {
    // Seed default safety data
    const initializeSafetyData = async () => {
      try {
        if (!mockUser) {
          await seedDefaultSafetyData();
        }
      } catch (err) {
        console.warn("Seeding safety data restricted by permissions, loading mock fallback.");
      }
    };
    initializeSafetyData();

    const loadMockAlerts = () => {
      setAlerts({
        'alert_1': {
          id: 'alert_1',
          title: "Inconsistent Packaging",
          riskLevel: "High",
          medicineName: "Amoxicillin 500mg",
          description: "Reported batch numbers #AX-2024 showing compromised seals and inconsistent typography in North District pharmacies.",
          location: "North District",
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          pinCoords: { top: '35%', left: '28%' }
        },
        'alert_2': {
          id: 'alert_2',
          title: "Storage Violation",
          riskLevel: "Elevated",
          medicineName: "Insulin Glargine",
          description: "Temperature control failure detected during transport to Central Hospital. Potential potency loss suspected.",
          location: "Central District",
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          pinCoords: { top: '60%', left: '55%' }
        }
      });
      setLoading(false);
    };

    // Listen to community alerts
    if (mockUser) {
      loadMockAlerts();
    } else {
      const unsub = listenCommunityAlerts(
        (data) => {
          const processedAlerts = {};
          const keys = Object.keys(data);
          if (keys.length === 0) {
            loadMockAlerts();
            return;
          }
          keys.forEach((key, index) => {
            const item = data[key];
            let pinCoords = item.pinCoords;
            if (!pinCoords) {
              const seedTop = (25 + (index * 17) % 50) + '%';
              const seedLeft = (20 + (index * 23) % 65) + '%';
              pinCoords = { top: seedTop, left: seedLeft };
            }
            processedAlerts[key] = { ...item, pinCoords };
          });
          setAlerts(processedAlerts);
          setLoading(false);
        },
        (err) => {
          console.warn("Safety map access restricted, loading local mocks:", err);
          loadMockAlerts();
        }
      );
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, [uid, mockUser]);

  const toggleDrawer = () => {
    const toValue = drawerCollapsed ? 180 : 70;
    Animated.spring(drawerHeight, {
      toValue,
      useNativeDriver: false,
    }).start();
    setDrawerCollapsed(!drawerCollapsed);
  };

  const getCommunityRiskStatus = () => {
    const items = Object.values(alerts);
    if (items.some(a => a.riskLevel === 'High')) {
      return { label: 'High Risk', color: colors.error };
    }
    if (items.some(a => a.riskLevel === 'Elevated')) {
      return { label: 'Elevated Risk', color: '#e67e22' };
    }
    return { label: 'Low Risk', color: colors.secondary };
  };

  const getFilteredAlerts = () => {
    const query = searchQuery.toLowerCase().trim();
    return Object.values(alerts).filter(alert => {
      // Apply search query
      if (query && !alert.medicineName?.toLowerCase().includes(query) && !alert.title?.toLowerCase().includes(query) && !alert.location?.toLowerCase().includes(query)) {
        return false;
      }
      // Apply category filter
      if (activeFilter === 'medicine') {
        return alert.title.toLowerCase().includes('packaging') || alert.title.toLowerCase().includes('label');
      }
      if (activeFilter === 'pharmacy') {
        return alert.title.toLowerCase().includes('storage') || alert.title.toLowerCase().includes('conduct') || alert.title.toLowerCase().includes('pharmacy');
      }
      return true;
    });
  };

  const riskStatus = getCommunityRiskStatus();
  const filteredAlerts = getFilteredAlerts();

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      {/* Top Header */}
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

      {/* Main Map Background */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>Syncing Live Safety Coordinate Grid...</Text>
          </View>
        ) : (
          <>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDo9hQPVE6aEvSIxNXqvjQ37IO-KtmaQGvoV11gfHwdkTvEB5BVi8jMfsAoRYJ61KVc50OXl6-Zg1fHwuzZZvRrjuMd9VkmzcTLD9U1-mjj0QEBYxh5QDTLZ1ZWajkqhO2EctiyJ2BUpcIGryI_l0UQbrxr1UeyrnWDTJ-7MHnB4w5kNcYImpsrTwsxWHavhcy-eCd0D6sBPHNPCf0BuFXQUQbLraYBuegytK-AklowSFMGZ26fU9CWy8djXyA-lTfGMwVCxWv6YNcf' }}
              style={styles.mapImage}
              resizeMode="cover"
            />

            {/* Map Pins overlay */}
            {filteredAlerts.map((alert) => {
              const top = alert.pinCoords?.top || '50%';
              const left = alert.pinCoords?.left || '50%';
              const isHigh = alert.riskLevel === 'High';
              const isElevated = alert.riskLevel === 'Elevated';
              const isSelected = selectedPin === alert.id;

              return (
                <View key={alert.id} style={[styles.pinWrapper, { top, left }]}>
                  <TouchableOpacity
                    style={[
                      styles.pin,
                      isHigh && styles.pinHigh,
                      isElevated && styles.pinElevated,
                      isSelected && styles.pinSelected
                    ]}
                    onPress={() => setSelectedPin(isSelected ? null : alert.id)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons
                      name={isHigh ? 'warning' : 'healing'}
                      size={16}
                      color={colors.white}
                    />
                  </TouchableOpacity>

                  {/* Tooltip Overlay */}
                  {isSelected && (
                    <View style={[styles.tooltip, isHigh && styles.tooltipHigh]}>
                      <Text style={[styles.tooltipRisk, { color: isHigh ? colors.error : '#e67e22' }]}>
                        {alert.riskLevel.toUpperCase()} RISK
                      </Text>
                      <Text style={styles.tooltipTitle}>{alert.title}</Text>
                      <Text style={styles.tooltipMed}>{alert.medicineName}</Text>
                      <Text style={styles.tooltipLoc}>
                        {alert.location} • {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <TouchableOpacity style={styles.tooltipClose} onPress={() => setSelectedPin(null)}>
                        <MaterialIcons name="close" size={12} color={colors.outline} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* Floating Search Panel */}
        <View style={styles.floatingSearchPanel}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search suspicious locations..."
              placeholderTextColor={colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="cancel" size={18} color={colors.outline} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Filters */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
              onPress={() => setActiveFilter('all')}
            >
              <MaterialIcons name="filter-list" size={14} color={activeFilter === 'all' ? colors.white : colors.textSecondary} />
              <Text style={[styles.filterChipLabel, activeFilter === 'all' && styles.filterChipLabelActive]}>
                All Reports
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'medicine' && styles.filterChipActive]}
              onPress={() => setActiveFilter('medicine')}
            >
              <Text style={[styles.filterChipLabel, activeFilter === 'medicine' && styles.filterChipLabelActive]}>
                Medicines
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'pharmacy' && styles.filterChipActive]}
              onPress={() => setActiveFilter('pharmacy')}
            >
              <Text style={[styles.filterChipLabel, activeFilter === 'pharmacy' && styles.filterChipLabelActive]}>
                Pharmacies
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SOS Floating Action Button */}
        <TouchableOpacity
          style={styles.sosButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.9}
        >
          <MaterialIcons name="add-alert" size={28} color={colors.white} />
        </TouchableOpacity>

        {/* Bottom Drawer */}
        <Animated.View style={[styles.bottomDrawer, { height: drawerHeight }]}>
          <View style={styles.drawerHeader}>
            <View style={styles.drawerTitleRow}>
              <View style={[styles.statusDot, { backgroundColor: riskStatus.color }]} />
              <Text style={styles.drawerTitle}>Community Status: {riskStatus.label}</Text>
            </View>
            <TouchableOpacity onPress={toggleDrawer} style={styles.drawerToggle}>
              <MaterialIcons
                name={drawerCollapsed ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {!drawerCollapsed && (
            <View style={styles.drawerStatsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TOTAL REPORTS</Text>
                <Text style={styles.statValue}>{Object.keys(alerts).length}</Text>
                <Text style={styles.statSubText}>+12% vs Yesterday</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>ACTIVE ALERTS</Text>
                <Text style={[styles.statValue, { color: riskStatus.color }]}>
                  {Object.values(alerts).filter(a => a.riskLevel !== 'Low').length}
                </Text>
                <Text style={styles.statSubText}>Nearby radius: 2km</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </View>

      {/* SOS Report Modal */}
      <AddSafetyReportModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        uid={uid}
        mockUser={mockUser}
      />

      {/* Safety Navigation Bar */}
      <SafetyNavbar currentTab="map" navigation={navigation} routeParams={params} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.surface,
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
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.surfaceContainerLow,
    marginBottom: 60, // Avoid overlapping navbar
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  floatingSearchPanel: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
    gap: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipLabel: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterChipLabelActive: {
    color: colors.white,
  },
  pinWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pinHigh: {
    backgroundColor: colors.error,
  },
  pinElevated: {
    backgroundColor: '#e67e22',
  },
  pinSelected: {
    transform: [{ scale: 1.2 }],
    borderWidth: 3,
    borderColor: colors.primaryFixed,
  },
  tooltip: {
    position: 'absolute',
    bottom: 38,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: 10,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  tooltipHigh: {
    borderColor: colors.error,
  },
  tooltipRisk: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },
  tooltipTitle: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  tooltipMed: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tooltipLoc: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 10,
    color: colors.outline,
    marginTop: 4,
  },
  tooltipClose: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  sosButton: {
    position: 'absolute',
    bottom: 200,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },
  bottomDrawer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
    overflow: 'hidden',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  drawerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  drawerTitle: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  drawerToggle: {
    padding: 2,
  },
  drawerStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: 10,
  },
  statLabel: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  statValue: {
    fontFamily: 'Public Sans',
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginVertical: 2,
  },
  statSubText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 10,
    color: colors.outline,
  },
});

export default SafetyMapScreen;
