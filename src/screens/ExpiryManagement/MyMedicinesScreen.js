import React, { useState, useEffect } from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator, 
  Alert, 
  Dimensions, 
  Image, 
  Platform, 
  StatusBar,
  Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { listenUserMedications, saveUserMedication, deleteUserMedication, syncExpiryAlerts } from '../../services/dbService';
import { auth } from '../../../firebaseConfig';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const MyMedicinesScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;

  const [medications, setMedications] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state for manual medicine addition & editing
  const [editingMedId, setEditingMedId] = useState(null);
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedTime, setNewMedTime] = useState('09:00 AM');
  const [newMedInstructions, setNewMedInstructions] = useState('');
  const [newMedMfgDate, setNewMedMfgDate] = useState('');
  const [newMedExpDate, setNewMedExpDate] = useState('');
  const [newMedBatch, setNewMedBatch] = useState('');
  const [newMedMfg, setNewMedMfg] = useState('');

  // Load medications
  useEffect(() => {
    const activeUid = auth?.currentUser?.uid || uid || 'guest_user';

    const unsubscribe = listenUserMedications(activeUid, (data) => {
      setMedications(data || {});
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [uid]);

  // Expiry calculation helpers
  const getExpiryDetails = (expDateStr) => {
    if (!expDateStr) return { status: 'Active', label: 'No date', color: colors.secondary, daysLeft: 999 };
    
    const parts = String(expDateStr).split('-');
    let exp;
    if (parts.length === 3) {
      exp = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      exp = new Date(expDateStr);
    }
    
    const today = new Date();
    today.setHours(0,0,0,0);
    exp.setHours(0,0,0,0);
    
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      const absoluteDays = Math.abs(diffDays);
      let label = `Expired ${absoluteDays} day${absoluteDays > 1 ? 's' : ''} ago`;
      if (absoluteDays === 1) label = 'Expired yesterday';
      return { status: 'Expired', label, color: colors.error, daysLeft: diffDays };
    } else if (diffDays <= 7) {
      const dayText = diffDays === 0 ? 'today' : `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
      return { status: 'Expiring Soon', label: `Expires ${dayText}`, color: '#e67e22', daysLeft: diffDays };
    } else if (diffDays <= 30) {
      return { status: 'Expiring', label: `${diffDays} days left`, color: '#e67e22', daysLeft: diffDays };
    } else {
      const months = Math.round(diffDays / 30);
      let label = `${months} month${months > 1 ? 's' : ''} left`;
      if (months === 0) label = `${diffDays} days left`;
      return { status: 'Active', label, color: colors.secondary, daysLeft: diffDays };
    }
  };

  // Open edit modal pre-populated
  const handleEditMedication = (med) => {
    if (!med) return;
    setEditingMedId(med.id);
    setNewMedName(med.medicineName || med.name || '');
    setNewMedExpDate(med.expDate || '');
    setNewMedInstructions(med.notes || med.instructions || '');
    setNewMedDosage(med.dosage || '');
    setNewMedMfg(med.manufacturer || '');
    setIsAddingManually(true);
  };

  // Add or update custom manual medicine record to cabinet & Firebase
  const handleAddManualMed = async () => {
    if (!newMedName.trim()) {
      Alert.alert("Input Needed", "Please enter the Medication Name.");
      return;
    }
    if (!newMedExpDate.trim()) {
      Alert.alert("Input Needed", "Please enter the Expiration Date (YYYY-MM-DD).");
      return;
    }

    const currentUserId = auth?.currentUser?.uid || uid || 'guest_user';
    const medData = {
      ...(editingMedId ? { id: editingMedId } : {}),
      name: newMedName.trim(),
      medicineName: newMedName.trim(),
      dosage: newMedDosage.trim() || 'Standard',
      time: newMedTime || '09:00 AM',
      instructions: newMedInstructions.trim() || '',
      notes: newMedInstructions.trim() || '',
      mfgDate: newMedMfgDate.trim() || '',
      expDate: newMedExpDate.trim(),
      batch: newMedBatch.trim() || '',
      manufacturer: newMedMfg.trim() || '',
      taken: false,
      takenStatus: false,
      takenTime: '',
      userId: currentUserId,
      createdAt: new Date().toISOString()
    };

    try {
      setIsAddingManually(false);
      resetForm();
      const savedMed = await saveUserMedication(currentUserId, medData);
      setMedications(prev => ({
        ...prev,
        [savedMed.id]: savedMed
      }));
      Alert.alert(
        "Success",
        `✓ "${savedMed.medicineName || savedMed.name}" record ${editingMedId ? 'updated' : 'created'} successfully and saved to Firebase!`
      );
    } catch (err) {
      Alert.alert("Save Failed", err.message || "Could not save medicine record. Please try again.");
    }
  };

  // Delete medicine record
  const handleDeleteMedication = (medId, medName) => {
    Alert.alert(
      "Delete Record",
      `Are you sure you want to delete "${medName || 'this record'}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const activeUid = auth?.currentUser?.uid || uid || 'guest_user';
            setMedications(prev => {
              const nextMeds = { ...prev };
              delete nextMeds[medId];
              return nextMeds;
            });

            try {
              await deleteUserMedication(activeUid, medId);
            } catch (err) {
              console.error("Failed to delete medication from Firebase:", err);
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setEditingMedId(null);
    setNewMedName('');
    setNewMedDosage('');
    setNewMedTime('09:00 AM');
    setNewMedInstructions('');
    setNewMedMfgDate('');
    setNewMedExpDate('');
    setNewMedBatch('');
    setNewMedMfg('');
  };

  const medicationsList = Object.values(medications || {});
  const expiredMeds = medicationsList.filter(m => getExpiryDetails(m.expDate).status === 'Expired');

  // Filter list by search query
  const filteredMeds = medicationsList.filter(med => {
    const nameStr = (med.medicineName || med.name || '').toLowerCase();
    const manufStr = (med.manufacturer || '').toLowerCase();
    const notesStr = (med.notes || med.instructions || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    return nameStr.includes(q) || manufStr.includes(q) || notesStr.includes(q);
  });

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Top Header App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity 
            style={styles.headerBackBtn}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expiry Management</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Urgent Attention Warning Bar */}
        {expiredMeds.length > 0 && (
          <TouchableOpacity 
            style={styles.urgentBanner}
            onPress={() => navigation.navigate('ExpiredMedicines', { uid, mockUser, medications })}
          >
            <View style={styles.urgentBannerIconCircle}>
              <MaterialIcons name="warning" size={20} color={colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.urgentBannerTitle}>Requires Attention</Text>
              <Text style={styles.urgentBannerDesc}>
                {expiredMeds.length} expired medicine{expiredMeds.length > 1 ? 's' : ''} in records. Tap to view details.
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.error} />
          </TouchableOpacity>
        )}

        {/* Introduction Panel */}
        <View style={styles.introBlock}>
          <Text style={styles.introHeading}>Expiry Management</Text>
          <Text style={styles.introSub}>Add and manage medicine expiry dates to receive automated expiration alerts.</Text>
        </View>

        {/* Custom Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionBtnManual}
            onPress={() => { resetForm(); setIsAddingManually(true); }}
          >
            <MaterialIcons name="add" size={20} color={colors.white} />
            <Text style={styles.actionBtnManualText}>Add Manually</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBlock}>
          <MaterialIcons name="search" size={20} color={colors.outline} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search medicine records..."
            placeholderTextColor={colors.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Expiry Records List */}
        <Text style={styles.sectionHeading}>Medicine Expiry Records ({filteredMeds.length})</Text>
        <View style={styles.cabinetStack}>
          {filteredMeds.length === 0 ? (
            <View style={styles.emptyCabinet}>
              <Ionicons name="medical-outline" size={40} color={colors.outlineVariant} />
              <Text style={styles.emptyCabinetText}>No medicine records found.</Text>
            </View>
          ) : (
            filteredMeds.map((med) => {
              const expiry = getExpiryDetails(med.expDate);
              const medName = med.medicineName || med.name || 'Unnamed Medicine';
              const medNotes = med.notes || med.instructions;

              return (
                <View 
                  key={med.id || Math.random().toString()}
                  style={styles.medCard}
                >
                  <View style={styles.medCardMainRow}>
                    <View style={styles.medCardContent}>
                      <View style={styles.medCardMetaHeader}>
                        <View style={[styles.expiryBadge, { backgroundColor: expiry.color + '1F' }]}>
                          <Text style={[styles.expiryBadgeText, { color: expiry.color }]}>{expiry.label}</Text>
                        </View>
                        <Text style={[
                          styles.statusBadgeText, 
                          { color: expiry.status === 'Expired' ? colors.error : expiry.status.includes('Expiring') ? '#e67e22' : colors.secondary }
                        ]}>
                          {expiry.status.toUpperCase()}
                        </Text>
                      </View>

                      <Text style={styles.medNameText}>{medName}</Text>
                      <Text style={styles.medDosageText}>
                        Expiry Date: <Text style={{ fontWeight: '700', color: colors.primary }}>{med.expDate || 'Not specified'}</Text>
                      </Text>
                      
                      {med.dosage && med.dosage !== 'Standard' && (
                        <Text style={styles.medSubDetailText}>Dosage: {med.dosage}</Text>
                      )}

                      {medNotes ? (
                        <Text style={styles.medNotesText} numberOfLines={2}>Notes: {medNotes}</Text>
                      ) : null}
                    </View>

                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity 
                        style={styles.editRecordBtn}
                        onPress={() => handleEditMedication(med)}
                      >
                        <MaterialIcons name="edit" size={18} color={colors.primary} />
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.deleteRecordBtn}
                        onPress={() => handleDeleteMedication(med.id, medName)}
                      >
                        <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Manual Input Entry Dialog Modal */}
      <Modal
        visible={isAddingManually}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setIsAddingManually(false); resetForm(); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingMedId ? "Edit Expiry Record" : "Add Expiry Record"}</Text>
              <TouchableOpacity onPress={() => { setIsAddingManually(false); resetForm(); }}>
                <MaterialIcons name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Medicine Name *</Text>
                <TextInput 
                  style={styles.formInput} 
                  placeholder="e.g. Lipitor, Paracetamol"
                  value={newMedName}
                  onChangeText={setNewMedName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Expiration Date (YYYY-MM-DD) *</Text>
                <TextInput 
                  style={styles.formInput} 
                  placeholder="e.g. 2026-08-15"
                  value={newMedExpDate}
                  onChangeText={setNewMedExpDate}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Optional Notes</Text>
                <TextInput 
                  style={styles.formInput} 
                  placeholder="e.g. Take with food, store below 25°C"
                  value={newMedInstructions}
                  onChangeText={setNewMedInstructions}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Dosage Strength (Optional)</Text>
                <TextInput 
                  style={styles.formInput} 
                  placeholder="e.g. 500mg"
                  value={newMedDosage}
                  onChangeText={setNewMedDosage}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Manufacturer (Optional)</Text>
                <TextInput 
                  style={styles.formInput} 
                  placeholder="e.g. Pfizer Labs"
                  value={newMedMfg}
                  onChangeText={setNewMedMfg}
                />
              </View>

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleAddManualMed}>
                <MaterialIcons name="done" size={20} color={colors.white} />
                <Text style={styles.modalSubmitBtnText}>{editingMedId ? "Save Changes" : "Create Record"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: STATUSBAR_HEIGHT,
    ...Platform.select({
      web: {
        maxWidth: 1024,
        width: '100%',
        alignSelf: 'center',
      }
    })
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
  scannerShortcutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  urgentBanner: {
    backgroundColor: colors.errorContainer,
    borderWidth: 1,
    borderColor: colors.error + '33',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  urgentBannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.onErrorContainer,
  },
  urgentBannerDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onErrorContainer,
    opacity: 0.8,
    marginTop: 2,
  },
  introBlock: {
    marginBottom: 28,
  },
  introHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  introSub: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionBtnScan: {
    flex: 1.2,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnScanText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  actionBtnManual: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary + '20',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnManualText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  searchBlock: {
    position: 'relative',
    marginBottom: 24,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 14,
  },
  searchInput: {
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  bentoSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },
  chartBentoCard: {
    flex: 1.2,
    backgroundColor: colors.tertiaryFixed + '33',
    borderWidth: 1,
    borderColor: colors.onTertiaryContainer + '1A',
    borderRadius: 16,
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#653e00',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'end',
    height: 72,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  bar: {
    width: 6,
    backgroundColor: colors.onTertiaryContainer + '40',
    borderRadius: 3,
  },
  chartSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#653e00',
    textAlign: 'center',
  },
  upcomingBentoCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upcomingTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  upcomingCountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#e67e22',
  },
  upcomingDescText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 12,
  },
  upcomingCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  upcomingLinkText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 16,
  },
  cabinetStack: {
    gap: 16,
  },
  emptyCabinet: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    borderRadius: 16,
  },
  emptyCabinetText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: colors.outline,
  },
  medCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  medCardMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  medCardContent: {
    flex: 1,
    gap: 4,
  },
  medCardMetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  expiryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  medNameText: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  medDosageText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  medSubDetailText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  medNotesText: {
    fontSize: 11.5,
    color: colors.primary,
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: 4,
    backgroundColor: colors.surfaceContainerLow,
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  editRecordBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryFixed + '60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteRecordBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.errorContainer + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 16 : 0,
  },
  navItem: {
    alignItems: 'center',
  },
  navItemActive: {
    alignItems: 'center',
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  navText: {
    fontSize: 10,
    color: colors.outline,
    fontWeight: '700',
    marginTop: 2,
  },
  navTextActive: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '800',
    marginTop: 2,
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  modalFormScroll: {
    padding: 24,
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  formInput: {
    height: 48,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  modalSubmitBtn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 32,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  }
});

export default MyMedicinesScreen;
