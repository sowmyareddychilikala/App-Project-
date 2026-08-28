import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { SafetyNavbar } from './SafetyNavbar';
import { AddSafetyReportModal } from './AddSafetyReportModal';
import { listenCommunityAlerts, updateCommunityAlert, deleteCommunityAlert } from '../../services/dbService';
import { auth } from '../../../firebaseConfig';

export const CommunityAlertsScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('All'); // All, High, Elevated, Low
  const [modalVisible, setModalVisible] = useState(false);

  // Edit Modal State
  const [editingAlert, setEditingAlert] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMedName, setEditMedName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editRiskLevel, setEditRiskLevel] = useState('High');
  const [savingEdit, setSavingEdit] = useState(false);

  const activeUid = auth?.currentUser?.uid || uid || 'guest_user';

  const formatDateTime = (rawDate) => {
    if (!rawDate) return '07 Aug 2026 • 07:30 PM';
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return String(rawDate);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedHours = hours.toString().padStart(2, '0');
    return `${day} ${month} ${year} • ${formattedHours}:${minutes} ${ampm}`;
  };

  const handleDeleteAlert = (alertItem) => {
    Alert.alert(
      "Delete Safety Alert",
      "Are you sure you want to permanently delete this safety alert?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCommunityAlert(alertItem.id);
              Alert.alert("Deleted", "Alert has been permanently removed.");
            } catch (e) {
              Alert.alert("Error", "Failed to delete alert.");
            }
          }
        }
      ]
    );
  };

  const handleEditAlert = (alertItem) => {
    setEditingAlert(alertItem);
    setEditTitle(alertItem.title || '');
    setEditMedName(alertItem.medicineName || '');
    setEditDesc(alertItem.description || '');
    setEditLocation(alertItem.location || '');
    setEditRiskLevel(alertItem.riskLevel || 'High');
  };

  const handleSaveAlertEdit = async () => {
    if (!editingAlert) return;
    if (!editMedName.trim() || !editTitle.trim() || !editDesc.trim()) {
      Alert.alert("Input Required", "Please provide a valid medicine name, title, and description.");
      return;
    }

    setSavingEdit(true);
    try {
      await updateCommunityAlert(editingAlert.id, {
        title: editTitle.trim(),
        medicineName: editMedName.trim(),
        description: editDesc.trim(),
        location: editLocation.trim(),
        riskLevel: editRiskLevel
      });
      setSavingEdit(false);
      setEditingAlert(null);
      Alert.alert("Success", "Safety alert updated successfully.");
    } catch (e) {
      setSavingEdit(false);
      Alert.alert("Error", "Failed to update safety alert.");
    }
  };

  useEffect(() => {
    const loadMockAlerts = () => {
      setAlerts([
        {
          id: 'alert_1',
          title: "Inconsistent Packaging",
          riskLevel: "High",
          medicineName: "Amoxicillin 500mg",
          description: "Reported batch numbers #AX-2024 showing compromised seals and inconsistent typography in North District pharmacies.",
          location: "North District",
          timestamp: new Date().toISOString()
        },
        {
          id: 'alert_2',
          title: "Storage Violation",
          riskLevel: "Elevated",
          medicineName: "Insulin Glargine",
          description: "Temperature control failure detected during transport to Central Hospital. Potential potency loss suspected.",
          location: "Central District",
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
        },
        {
          id: 'alert_3',
          title: "Labeling Update",
          riskLevel: "Low",
          medicineName: "Common Pain Relief",
          description: "Manufacturer issuing minor labeling correction regarding shelf-life extension from 24 to 36 months.",
          location: "East District",
          timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString()
        }
      ]);
      setLoading(false);
    };

    if (mockUser) {
      loadMockAlerts();
    } else {
      const unsub = listenCommunityAlerts(
        (data) => {
          const list = Object.values(data).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          if (list.length === 0) {
            loadMockAlerts();
            return;
          }
          setAlerts(list);
          setLoading(false);
        },
        (err) => {
          console.warn("Safety alerts access restricted, loading local mocks:", err);
          loadMockAlerts();
        }
      );
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, [uid, mockUser]);

  const getFilteredAlerts = () => {
    return alerts.filter(alert => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        alert.title?.toLowerCase().includes(query) ||
        alert.medicineName?.toLowerCase().includes(query) ||
        alert.description?.toLowerCase().includes(query) ||
        alert.location?.toLowerCase().includes(query);

      const matchesRisk = selectedRiskFilter === 'All' || alert.riskLevel === selectedRiskFilter;

      return matchesSearch && matchesRisk;
    });
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'High':
        return { bg: colors.error, text: colors.white };
      case 'Elevated':
        return { bg: '#e67e22', text: colors.white };
      case 'Low':
      default:
        return { bg: colors.primaryFixed, text: colors.primary };
    }
  };

  const filteredAlerts = getFilteredAlerts();

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      {/* Top App Bar */}
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
        {/* Filters Section */}
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search active alerts..."
              placeholderTextColor={colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.riskFiltersRow}>
            {['All', 'High', 'Elevated', 'Low'].map((risk) => {
              const isActive = selectedRiskFilter === risk;
              return (
                <TouchableOpacity
                  key={risk}
                  style={[styles.riskChip, isActive && styles.riskChipActive]}
                  onPress={() => setSelectedRiskFilter(risk)}
                >
                  <Text style={[styles.riskChipText, isActive && styles.riskChipTextActive]}>
                    {risk === 'All' ? 'All Risks' : `${risk} Risk`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Alerts Feed */}
        <Text style={styles.sectionHeading}>ACTIVE SAFETY FEED</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : filteredAlerts.length === 0 ? (
          <View style={styles.emptyFeed}>
            <MaterialIcons name="notifications-none" size={48} color={colors.outlineVariant} />
            <Text style={styles.emptyFeedText}>No active alerts match your search filter.</Text>
          </View>
        ) : (
          <View style={styles.alertsContainer}>
            {filteredAlerts.map((alertItem) => {
              const colorsInfo = getRiskColor(alertItem.riskLevel);
              const formattedTimeStr = formatDateTime(alertItem.timestamp);
              const isOwner = alertItem.uid === activeUid;

              return (
                <View key={alertItem.id} style={[styles.alertCard, alertItem.riskLevel === 'High' && styles.alertCardHigh]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.riskBadge, { backgroundColor: colorsInfo.bg }]}>
                      <Text style={[styles.riskBadgeText, { color: colorsInfo.text }]}>
                        {alertItem.riskLevel.toUpperCase()} RISK
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={styles.timestampText}>{formattedTimeStr}</Text>
                      {isOwner && (
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity onPress={() => handleEditAlert(alertItem)} style={{ padding: 2 }}>
                            <MaterialIcons name="edit" size={16} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteAlert(alertItem)} style={{ padding: 2 }}>
                            <MaterialIcons name="delete" size={16} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>

                  <Text style={styles.alertTitle}>{alertItem.title}</Text>

                  <View style={styles.medRow}>
                    <MaterialIcons name="healing" size={16} color={colors.primary} />
                    <Text style={styles.medNameText}>{alertItem.medicineName}</Text>
                  </View>

                  <Text style={styles.descriptionText}>{alertItem.description}</Text>

                  <View style={styles.locationRow}>
                    <MaterialIcons name="location-on" size={14} color={colors.textSecondary} />
                    <Text style={styles.locationText}>{alertItem.location}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Bento Grid Analytics */}
        <View style={styles.bentoContainer}>
          {/* Map Snippet */}
          <TouchableOpacity
            style={styles.mapSnippetCard}
            onPress={() => navigation.navigate('SafetyMap', params)}
            activeOpacity={0.9}
          >
            <View style={styles.mapSnippetHeader}>
              <Text style={styles.bentoTitle}>Hotspot Visualizer</Text>
              <Text style={styles.bentoSubTitle}>3 active clusters in North District</Text>
            </View>
            <View style={styles.pulseContainer}>
              <View style={styles.pulseRing} />
              <View style={styles.pulseDot} />
            </View>
          </TouchableOpacity>

          {/* Standby Network Card */}
          <View style={styles.respondersCard}>
            <View style={styles.respondersHeader}>
              <MaterialIcons name="verified-user" size={24} color={colors.primaryFixed} />
              <Text style={styles.respondersBadge}>ACTIVE MONITORING</Text>
            </View>
            <Text style={styles.respondersTitle}>Volunteer Network</Text>
            <Text style={styles.respondersDesc}>128 active community responders on standby.</Text>
          </View>
        </View>
      </ScrollView>

      {/* SOS FAB Button */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.9}
      >
        <MaterialIcons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* Quick SOS Modal */}
      <AddSafetyReportModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        uid={uid}
        mockUser={mockUser}
      />

      {/* Edit Alert Modal */}
      <Modal visible={Boolean(editingAlert)} transparent animationType="fade" onRequestClose={() => setEditingAlert(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Safety Alert</Text>
              <TouchableOpacity onPress={() => setEditingAlert(null)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Medicine Name</Text>
                <TextInput style={styles.modalInput} value={editMedName} onChangeText={setEditMedName} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Incident Title</Text>
                <TextInput style={styles.modalInput} value={editTitle} onChangeText={setEditTitle} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Location</Text>
                <TextInput style={styles.modalInput} value={editLocation} onChangeText={setEditLocation} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Description</Text>
                <TextInput style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]} multiline value={editDesc} onChangeText={setEditDesc} />
              </View>
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditingAlert(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveAlertEdit} disabled={savingEdit}>
                {savingEdit ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.modalSaveText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <SafetyNavbar currentTab="alerts" navigation={navigation} routeParams={params} />
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
    paddingBottom: 100, // Cushion for the bottom navbar
  },
  filterSection: {
    marginBottom: 20,
    gap: 10,
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
  riskFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  riskChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  riskChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  riskChipText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  riskChipTextActive: {
    color: colors.white,
  },
  sectionHeading: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  loader: {
    marginVertical: 40,
  },
  emptyFeed: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyFeedText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 14,
    color: colors.outline,
    textAlign: 'center',
  },
  alertsContainer: {
    gap: 12,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2,
  },
  alertCardHigh: {
    borderWidth: 2,
    borderColor: colors.error,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  riskBadgeText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timestampText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 12,
    color: colors.outline,
    fontWeight: '600',
  },
  alertTitle: {
    fontFamily: 'Public Sans',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  medNameText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  descriptionText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  bentoContainer: {
    marginTop: 20,
    gap: 16,
  },
  mapSnippetCard: {
    height: 180,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    padding: 16,
  },
  mapSnippetHeader: {
    zIndex: 2,
  },
  bentoTitle: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  bentoSubTitle: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  pulseContainer: {
    position: 'absolute',
    top: '60%',
    left: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.error,
    opacity: 0.2,
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.error,
    position: 'absolute',
  },
  respondersCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  respondersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  respondersBadge: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryFixed,
    letterSpacing: 1,
  },
  respondersTitle: {
    fontFamily: 'Public Sans',
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  respondersDesc: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 13,
    color: colors.primaryFixed,
    marginTop: 4,
  },
  fabButton: {
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
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant + '4D',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  modalFormGroup: {
    marginBottom: 12,
    gap: 4,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  modalInput: {
    height: 42,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant + '4D',
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  modalSaveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  }
});

export default CommunityAlertsScreen;
