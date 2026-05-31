import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  TextInput, 
  ActivityIndicator, 
  Alert, 
  Dimensions, 
  Image, 
  Platform, 
  StatusBar,
  Modal
} from 'react-native';
import { colors } from '../../theme/colors';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { listenUserMedications, saveUserMedication } from '../../services/dbService';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const MyMedicinesScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;

  const [medications, setMedications] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state for manual medicine addition
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedTime, setNewMedTime] = useState('09:00 AM');
  const [newMedInstructions, setNewMedInstructions] = useState('');
  const [newMedMfgDate, setNewMedMfgDate] = useState('2024-01-01');
  const [newMedExpDate, setNewMedExpDate] = useState('2025-12-31');
  const [newMedBatch, setNewMedBatch] = useState('BT-99218-GP');
  const [newMedMfg, setNewMedMfg] = useState('BioPharma Labs');

  // Load medications
  useEffect(() => {
    if (mockUser) {
      // Mock data matching Figma design
      const mockMeds = {
        'med_1': {
          id: 'med_1',
          name: 'Lipitor',
          dosage: '20mg',
          time: '09:00 AM',
          instructions: 'Take in the morning',
          taken: false,
          takenTime: '',
          mfgDate: '2023-10-01',
          expDate: '2024-10-28',
          batch: 'LP-1029-A',
          manufacturer: 'Pfizer Inc.',
          reminders: {
            'rem_1': { id: 'rem_1', time: '09:00 AM', label: 'Breakfast', active: true }
          }
        },
        'med_2': {
          id: 'med_2',
          name: 'Ibuprofen Softgels',
          dosage: '400mg',
          time: '02:00 PM',
          instructions: 'Take with food for joint pain',
          taken: true,
          takenTime: '02:15 PM',
          mfgDate: '2023-01-01',
          expDate: '2025-01-15',
          batch: 'IB-990-23',
          manufacturer: 'Johnson & Johnson'
        },
        'med_3': {
          id: 'med_3',
          name: 'Amoxicillin',
          dosage: '500mg',
          time: '08:00 AM',
          instructions: 'Finish full cycle',
          taken: false,
          takenTime: '',
          mfgDate: '2023-06-01',
          expDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expired yesterday
          batch: 'AX-2023-019',
          manufacturer: 'BioPharma Core'
        },
        'med_4': {
          id: 'med_4',
          name: 'Vicks DayQuil',
          dosage: '15ml',
          time: '10:00 AM',
          instructions: 'Every 4 hours as needed',
          taken: false,
          takenTime: '',
          mfgDate: '2023-07-01',
          expDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expiring in 12 days
          batch: 'VQ-992-B',
          manufacturer: 'Procter & Gamble'
        }
      };
      setMedications(mockMeds);
      setLoading(false);
      return;
    }

    if (uid) {
      const unsubscribe = listenUserMedications(uid, (data) => {
        setMedications(data || {});
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [uid, mockUser]);

  // Expiry calculation helpers
  const getExpiryDetails = (expDateStr) => {
    if (!expDateStr) return { status: 'Active', label: 'No date', color: colors.secondary, daysLeft: 999 };
    
    const exp = new Date(expDateStr);
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
    } else if (diffDays <= 30) {
      return { status: 'Expiring', label: `${diffDays} day${diffDays > 1 ? 's' : ''} left`, color: '#e67e22', daysLeft: diffDays };
    } else {
      const months = Math.round(diffDays / 30);
      let label = `${months} month${months > 1 ? 's' : ''} left`;
      if (months === 0) label = `${diffDays} days left`;
      return { status: 'Active', label, color: colors.secondary, daysLeft: diffDays };
    }
  };

  // Add custom manual medicine record to cabinet
  const handleAddManualMed = async () => {
    if (!newMedName.trim() || !newMedDosage.trim()) {
      Alert.alert("Input Needed", "Please enter the medication name and dosage.");
      return;
    }

    const medData = {
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      time: newMedTime,
      instructions: newMedInstructions.trim() || 'Take as directed',
      mfgDate: newMedMfgDate,
      expDate: newMedExpDate,
      batch: newMedBatch.trim() || 'BT-MOCK-2026',
      manufacturer: newMedMfg.trim() || 'Generic Labs',
      taken: false,
      takenTime: ''
    };

    if (mockUser) {
      const newId = `med_${Date.now()}`;
      setMedications(prev => ({
        ...prev,
        [newId]: { ...medData, id: newId }
      }));
      setIsAddingManually(false);
      resetForm();
      Alert.alert("Success", "Manual medicine added into your Cabinet mockup.");
    } else {
      try {
        setLoading(true);
        await saveUserMedication(uid, medData);
        setLoading(false);
        setIsAddingManually(false);
        resetForm();
        Alert.alert("Success", "Medication successfully added directly into your upcoming cabinet.");
      } catch (err) {
        setLoading(false);
        Alert.alert("Failed", "Could not register medication. Try again.");
      }
    }
  };

  const resetForm = () => {
    setNewMedName('');
    setNewMedDosage('');
    setNewMedTime('09:00 AM');
    setNewMedInstructions('');
    setNewMedMfgDate('2024-01-01');
    setNewMedExpDate('2025-12-31');
    setNewMedBatch('BT-99218-GP');
    setNewMedMfg('BioPharma Labs');
  };

  const medicationsList = Object.values(medications);
  
  // Categorize
  const expiredMeds = medicationsList.filter(m => getExpiryDetails(m.expDate).status === 'Expired');
  const expiringMeds = medicationsList.filter(m => getExpiryDetails(m.expDate).status === 'Expiring');
  const activeMeds = medicationsList.filter(m => getExpiryDetails(m.expDate).status === 'Active');

  // Filter list by search query
  const filteredMeds = medicationsList.filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (med.manufacturer && med.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Top Header App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity 
            style={styles.headerBackBtn}
            onPress={() => navigation.replace('Dashboard')}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MedClarity Cabinet</Text>
        </View>
        <TouchableOpacity 
          style={styles.scannerShortcutBtn}
          onPress={() => navigation.navigate('MedicineScanner', { uid, mockUser })}
        >
          <MaterialIcons name="qr-code-scanner" size={22} color={colors.primary} />
        </TouchableOpacity>
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
                {expiredMeds.length} expired medicine{expiredMeds.length > 1 ? 's' : ''} in cabinet. Tap to resolve safely.
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.error} />
          </TouchableOpacity>
        )}

        {/* Introduction Panel */}
        <View style={styles.introBlock}>
          <Text style={styles.introHeading}>Your Medicine Cabinet</Text>
          <Text style={styles.introSub}>Track shelf lives, view interactions, and configure dose alarms with clinical precision.</Text>
        </View>

        {/* Custom Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionBtnScan}
            onPress={() => navigation.navigate('MedicineScanner', { uid, mockUser })}
          >
            <MaterialIcons name="add-a-photo" size={18} color={colors.white} />
            <Text style={styles.actionBtnScanText}>Scan Blister Pack</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionBtnManual}
            onPress={() => setIsAddingManually(true)}
          >
            <MaterialIcons name="add" size={20} color={colors.primary} />
            <Text style={styles.actionBtnManualText}>Add Manually</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBlock}>
          <MaterialIcons name="search" size={20} color={colors.outline} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search by name or category..."
            placeholderTextColor={colors.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Main Bento Grid layout */}
        <View style={styles.bentoSection}>
          {/* Weekly usage chart component */}
          <View style={styles.chartBentoCard}>
            <View style={styles.chartHeader}>
              <MaterialIcons name="event" size={16} color="#653e00" />
              <Text style={styles.chartTitle}>Weekly Adherence Stats</Text>
            </View>
            <View style={styles.barsContainer}>
              <View style={[styles.bar, { height: '40%' }]} />
              <View style={[styles.bar, { height: '65%' }]} />
              <View style={[styles.bar, { height: '90%' }]} />
              <View style={[styles.bar, { height: '30%', backgroundColor: colors.primary }]} />
              <View style={[styles.bar, { height: '55%' }]} />
              <View style={[styles.bar, { height: '45%' }]} />
              <View style={[styles.bar, { height: '70%' }]} />
            </View>
            <Text style={styles.chartSubtitle}>Clinical consistency: 94% Adherence active.</Text>
          </View>
          
          {/* Upcoming Expiries Bento Card */}
          {expiringMeds.length > 0 && (
            <TouchableOpacity 
              style={styles.upcomingBentoCard}
              onPress={() => navigation.navigate('UpcomingExpiries', { uid, mockUser, medications })}
            >
              <View style={styles.upcomingHeader}>
                <MaterialIcons name="running-with-errors" size={16} color={colors.primary} />
                <Text style={styles.upcomingTitle}>Upcoming Expiries</Text>
              </View>
              <Text style={styles.upcomingCountText}>{expiringMeds.length} Items Expiring Soon</Text>
              <Text style={styles.upcomingDescText}>Action advised within 30 days to maintain dose coverage.</Text>
              <View style={styles.upcomingCardFooter}>
                <Text style={styles.upcomingLinkText}>View Refill Plans</Text>
                <MaterialIcons name="arrow-forward" size={12} color={colors.primary} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Cabinet Inventory List */}
        <Text style={styles.sectionHeading}>Medicine Cabinet Stock</Text>
        <View style={styles.cabinetStack}>
          {filteredMeds.length === 0 ? (
            <View style={styles.emptyCabinet}>
              <Ionicons name="medical-outline" size={40} color={colors.outlineVariant} />
              <Text style={styles.emptyCabinetText}>No medicines found matching query.</Text>
            </View>
          ) : (
            filteredMeds.map((med) => {
              const expiry = getExpiryDetails(med.expDate);
              return (
                <TouchableOpacity 
                  key={med.id}
                  style={styles.medCard}
                  onPress={() => navigation.navigate('MedicineDetails', { uid, mockUser, medId: med.id, medications })}
                >
                  {/* Blister Card Image / Placeholders */}
                  <Image 
                    source={{ 
                      uri: med.name.toLowerCase().includes('lipi') 
                        ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDv4ogaZFEMwi9bLPMueKru6Krq2sN43jbEDZvePYUaAADvo3YeyWU5qPDE21GmsIEftaB9kJShkduMpOOKKet1PlIeeM9jCQG9Xn14p6nJXXRlQ3qh2EvimRq7O2wjDw79ltjiycBgDStixOBkC0m4w_5jeVrc34dPvu17DKzVOBiiXdTPSMQch1JuomxyoDkJjpoih-dK6p60ZNQvlQ0PW6Bw5vOmvlRnebAg4FhUSUxbjd8iZ290scyvtrRkSGjjhCS9oCNy5q2P'
                        : med.name.toLowerCase().includes('ibup')
                        ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-6AATtS9j6G_zwAlNuHW6N2nRRJuPglxPxaK9aR8DHqp7pihch4ch95dgJBpIKNC8QZsLs_YT0RrxMxqiNKTmoLoLiyl5KiZR09UKY5LcenOwrdnQ5KyMbqUB12xxYLlz-_Skpy1J6x9DYYjhL5DpxMOj-rgzxRj6PfA7dPnY_3xXFjhoFJjz7nPcKxtZUIo6k8l1XLyJeH69vFVgFQR0ImoXeprTSZjXDa6cACtwFGrXEI1_Wtuon2SWHOjcdxuNa12KPU7vzC49'
                        : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjKs93OpOLNhJHW0NHwLDHDOIKZnhqQKKsLjw-sAr75h-ysMPzfcd-diq-0yQGc15qTJXzQnhEwRooxCcXP9n6dfKqtBQWYuIusiVUwF7qwTqm2EaGuYTp8Kdh4lftBbqQA6BDrZ5td1Lx7P9gsaHdmCWgF-Cf-sDu6cqOX31ihTt3-EAYBcygBaq8vi5EnThmWrXT1o4HDnErf4gLXyzOoFFW8_4FA2fK0hBQB-iEzp5hZ5y-c5AmyIiW4JALNep0xgApwqqscx3I'
                    }}
                    style={styles.medCardImg}
                  />

                  {/* High level Expiry Tag badge overlays */}
                  <View style={styles.medCardMetaHeader}>
                    <View style={[styles.expiryBadge, { backgroundColor: expiry.color + '1A' }]}>
                      <Text style={[styles.expiryBadgeText, { color: expiry.color }]}>{expiry.label}</Text>
                    </View>
                  </View>

                  <View style={styles.medCardContent}>
                    <Text style={styles.medNameText}>{med.name}</Text>
                    <Text style={styles.medDosageText}>{med.dosage} • {med.instructions || 'Daily dose'}</Text>
                    
                    <View style={styles.medDivider} />
                    
                    <View style={styles.medFooterRow}>
                      <Text style={[
                        styles.statusBadgeText, 
                        { color: expiry.status === 'Expired' ? colors.error : colors.secondary }
                      ]}>
                        {expiry.status.toUpperCase()}
                      </Text>
                      <MaterialIcons name="more-vert" size={20} color={colors.outline} />
                    </View>
                  </View>
                </TouchableOpacity>
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
        onRequestClose={() => setIsAddingManually(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manual Entry Form</Text>
              <TouchableOpacity onPress={() => setIsAddingManually(false)}>
                <MaterialIcons name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Medication Name</Text>
                <TextInput 
                  style={styles.formInput} 
                  placeholder="e.g. Lipitor"
                  value={newMedName}
                  onChangeText={setNewMedName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Dosage Strength</Text>
                <TextInput 
                  style={styles.formInput} 
                  placeholder="e.g. 20mg"
                  value={newMedDosage}
                  onChangeText={setNewMedDosage}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Instructions</Text>
                <TextInput 
                  style={styles.formInput} 
                  placeholder="e.g. Take 1 tablet in morning"
                  value={newMedInstructions}
                  onChangeText={setNewMedInstructions}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Manufacture Date (YYYY-MM-DD)</Text>
                <TextInput 
                  style={styles.formInput} 
                  placeholder="e.g. 2024-01-01"
                  value={newMedMfgDate}
                  onChangeText={setNewMedMfgDate}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Expiration Date (YYYY-MM-DD)</Text>
                <TextInput 
                  style={styles.formInput} 
                  placeholder="e.g. 2025-12-31"
                  value={newMedExpDate}
                  onChangeText={setNewMedExpDate}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Batch Serial Code</Text>
                <TextInput 
                  style={styles.formInput} 
                  placeholder="e.g. BT-99218-GP"
                  value={newMedBatch}
                  onChangeText={setNewMedBatch}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Manufacturer</Text>
                <TextInput 
                  style={styles.formInput} 
                  placeholder="e.g. Pfizer Labs"
                  value={newMedMfg}
                  onChangeText={setNewMedMfg}
                />
              </View>

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleAddManualMed}>
                <MaterialIcons name="done" size={20} color={colors.white} />
                <Text style={styles.modalSubmitBtnText}>Create Record</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Tabs Footer Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive}>
          <MaterialIcons name="inventory" size={22} color={colors.primary} />
          <Text style={styles.navTextActive}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('UpcomingExpiries', { uid, mockUser, medications })}
        >
          <MaterialIcons name="warning" size={22} color={colors.outline} />
          <Text style={styles.navText}>Urgent</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('ExpiredMedicines', { uid, mockUser, medications })}
        >
          <MaterialIcons name="delete-sweep" size={22} color={colors.outline} />
          <Text style={styles.navText}>Archive</Text>
        </TouchableOpacity>
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
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  medCardImg: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  medCardMetaHeader: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  expiryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  expiryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  medCardContent: {
    padding: 16,
  },
  medNameText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  medDosageText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  medDivider: {
    height: 0.5,
    backgroundColor: colors.outlineVariant + '66',
    marginVertical: 12,
  },
  medFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
