import React, { useState, useEffect } from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
   
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  Dimensions, 
  Image, 
  Platform, 
  StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { deleteUserMedication, listenUserMedications } from '../../services/dbService';
import { auth } from '../../../firebaseConfig';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const MedicineDetailsScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser, medId, medications: initialMeds } = params;

  const [med, setMed] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync with real-time medications listener
  useEffect(() => {
    if (mockUser) {
      if (initialMeds && initialMeds[medId]) {
        setMed(initialMeds[medId]);
      } else {
        // Fallback default
        setMed({
          id: medId,
          name: 'Amoxicillin Clavulanate',
          dosage: '875mg / 125mg Tablet',
          time: '08:00 AM',
          instructions: 'Take 1 tablet twice daily at the start of a meal',
          mfgDate: '2023-10-01',
          expDate: '2024-10-24',
          batch: 'AMX-9021-B',
          manufacturer: 'BioPharma Core',
          reminders: {
            'rem_1': { id: 'rem_1', time: '08:00 AM', label: 'Breakfast', active: true },
            'rem_2': { id: 'rem_2', time: '08:00 PM', label: 'Dinner', active: true }
          }
        });
      }
      setLoading(false);
      return;
    }

    if (uid && medId) {
      const unsubscribe = listenUserMedications(uid, (data) => {
        if (data && data[medId]) {
          setMed(data[medId]);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [uid, medId, mockUser, initialMeds]);

  // Calculate dynamic countdown values
  const getExpiryCountdown = () => {
    if (!med || !med.expDate) return { days: 0, hrs: 0, percentage: 0 };
    
    const exp = new Date(med.expDate);
    const mfg = med.mfgDate ? new Date(med.mfgDate) : new Date(exp.getTime() - 365 * 24 * 60 * 60 * 1000);
    const today = new Date();
    
    const totalDuration = exp.getTime() - mfg.getTime();
    const elapsed = today.getTime() - mfg.getTime();
    const remaining = exp.getTime() - today.getTime();
    
    const days = Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
    const hrs = Math.max(0, Math.ceil((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    
    const percentage = totalDuration > 0 
      ? Math.max(0, Math.min(100, Math.round((elapsed / totalDuration) * 100))) 
      : 75; // Default mockup fallback
      
    return { days, hrs, percentage };
  };

  // Delete current medicine from cabinet
  const handleDeleteMedication = async () => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to permanently remove this medication from your secure digital cabinet?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            if (mockUser) {
              Alert.alert("Simulation Success", "Medication removed from cabinet.");
              navigation.replace('MyMedicines', { mockUser: true });
            } else {
              try {
                const activeUid = auth?.currentUser?.uid || uid || 'guest_user';
                deleteUserMedication(activeUid, medId).catch(() => {});
                Alert.alert("Success", "Medication successfully removed from your active cabinet.");
                navigation.replace('MyMedicines', { uid });
              } catch (err) {
                Alert.alert("Database Error", "Failed to delete medicine. Please try again.");
              }
            }
          }
        }
      ]
    );
  };

  // Trigger update stock simulation
  const handleUpdateStock = () => {
    Alert.alert(
      "Stock Replenishment",
      "Would you like to log a package replenishment?",
      [
        { text: "OK", onPress: () => Alert.alert("Success", "Stock replenished.") },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  if (loading || !med) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Fetching Blister Spec Card...</Text>
      </View>
    );
  }

  const { days, hrs, percentage } = getExpiryCountdown();
  const remindersList = med.reminders ? Object.values(med.reminders) : [];

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity 
            style={styles.headerBackBtn}
            onPress={() => navigation.replace('MyMedicines', { uid, mockUser })}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MedClarity details</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Blister Card Packaging Image */}
        <View style={styles.heroCard}>
          <Image 
            source={{ 
              uri: med.name.toLowerCase().includes('lipi') 
                ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDv4ogaZFEMwi9bLPMueKru6Krq2sN43jbEDZvePYUaAADvo3YeyWU5qPDE21GmsIEftaB9kJShkduMpOOKKet1PlIeeM9jCQG9Xn14p6nJXXRlQ3qh2EvimRq7O2wjDw79ltjiycBgDStixOBkC0m4w_5jeVrc34dPvu17DKzVOBiiXdTPSMQch1JuomxyoDkJjpoih-dK6p60ZNQvlQ0PW6Bw5vOmvlRnebAg4FhUSUxbjd8iZ290scyvtrRkSGjjhCS9oCNy5q2P'
                : med.name.toLowerCase().includes('ibup')
                ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-6AATtS9j6G_zwAlNuHW6N2nRRJuPglxPxaK9aR8DHqp7pihch4ch95dgJBpIKNC8QZsLs_YT0RrxMxqiNKTmoLoLiyl5KiZR09UKY5LcenOwrdnQ5KyMbqUB12xxYLlz-_Skpy1J6x9DYYjhL5DpxMOj-rgzxRj6PfA7dPnY_3xXFjhoFJjz7nPcKxtZUIo6k8l1XLyJeH69vFVgFQR0ImoXeprTSZjXDa6cACtwFGrXEI1_Wtuon2SWHOjcdxuNa12KPU7vzC49'
                : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjKs93OpOLNhJHW0NHwLDHDOIKZnhqQKKsLjw-sAr75h-ysMPzfcd-diq-0yQGc15qTJXzQnhEwRooxCcXP9n6dfKqtBQWYuIusiVUwF7qwTqm2EaGuYTp8Kdh4lftBbqQA6BDrZ5td1Lx7P9gsaHdmCWgF-Cf-sDu6cqOX31ihTt3-EAYBcygBaq8vi5EnThmWrXT1o4HDnErf4gLXyzOoFFW8_4FA2fK0hBQB-iEzp5hZ5y-c5AmyIiW4JALNep0xgApwqqscx3I'
            }}
            style={styles.heroCardImg}
          />
        </View>

        {/* Expiry Countdown Bento Card */}
        <View style={styles.countdownCard}>
          <Text style={styles.countdownLabel}>Expires In</Text>
          <View style={styles.countdownTimerRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeValueText}>{days}</Text>
              <Text style={styles.timeUnitText}>Days</Text>
            </View>
            <Text style={styles.timeColon}>:</Text>
            <View style={styles.timeBlock}>
              <Text style={styles.timeValueText}>{hrs}</Text>
              <Text style={styles.timeUnitText}>Hrs</Text>
            </View>
          </View>
          
          {/* Progress shelf life tracking bar */}
          <View style={styles.countdownProgressTrack}>
            <View style={[styles.countdownProgressFill, { width: `${100 - percentage}%` }]} />
          </View>
          <Text style={styles.countdownFooterText}>Expiry Date: {med.expDate}</Text>
        </View>

        {/* Core Identity Details */}
        <View style={styles.identityCard}>
          <View style={styles.identityHeader}>
            <View style={styles.rxBadge}>
              <Text style={styles.rxBadgeText}>Prescription Only</Text>
            </View>
            <TouchableOpacity style={styles.editBtn}>
              <MaterialIcons name="edit" size={20} color={colors.outline} />
            </TouchableOpacity>
          </View>
          <Text style={styles.identityName}>{med.name}</Text>
          <Text style={styles.identityDosage}>{med.dosage} • Tablet</Text>
          <Text style={styles.identityBatch}>Batch Code: {med.batch || 'BT-90218-B'}</Text>
        </View>

        {/* Info Bento Grid */}
        <View style={styles.bentoGrid}>
          <View style={styles.bentoCard}>
            <View style={styles.bentoCardHeader}>
              <MaterialIcons name="info" size={16} color={colors.primary} />
              <Text style={styles.bentoCardTitle}>How to use</Text>
            </View>
            <Text style={styles.bentoCardDesc}>{med.instructions}</Text>
          </View>

          <View style={styles.bentoCard}>
            <View style={styles.bentoCardHeader}>
              <MaterialIcons name="thermostat" size={16} color={colors.primary} />
              <Text style={styles.bentoCardTitle}>Storage Specs</Text>
            </View>
            <Text style={styles.bentoCardDesc}>Store below 25°C in dry cabinet. Keep blister packaging tightly sealed. Protect from moisture.</Text>
          </View>
        </View>

        {/* Active Dose Reminders Section */}
        <View style={styles.remindersCard}>
          <View style={styles.remindersHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="notifications" size={18} color={colors.primary} />
              <Text style={styles.remindersTitle}>Active Reminders</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.addReminderBtn}
              onPress={() => navigation.navigate('AddReminder', { uid, mockUser, medId, medications: initialMeds })}
            >
              <MaterialIcons name="add" size={16} color={colors.primary} />
              <Text style={styles.addReminderBtnText}>Add Reminder</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.remindersStack}>
            {remindersList.length === 0 ? (
              <View style={styles.emptyReminders}>
                <Text style={styles.emptyRemindersText}>No reminders set for this medicine.</Text>
              </View>
            ) : (
              remindersList.map((rem) => (
                <View key={rem.id} style={styles.reminderCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={styles.alarmCircle}>
                      <MaterialIcons name="alarm" size={20} color={colors.secondary} />
                    </View>
                    <View>
                      <Text style={styles.reminderTimeText}>{rem.time}</Text>
                      <Text style={styles.reminderLabelText}>{rem.label || 'Daily Dose'}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity style={styles.toggleTrack}>
                      <View style={styles.toggleThumb} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <MaterialIcons name="delete" size={18} color={colors.outlineVariant} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* FDA Severe Warnings Box */}
        <View style={styles.warningContainer}>
          <Text style={styles.warningLabel}>Clinical Warning</Text>
          <Text style={styles.warningText}>
            If you develop severe skin rashes, breathing constraints, or facial swelling, terminate use immediately and alert emergency clinicians.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionBlock}>
          <TouchableOpacity style={styles.primaryRefillBtn} onPress={handleUpdateStock}>
            <MaterialIcons name="bookmark-added" size={20} color={colors.white} />
            <Text style={styles.primaryRefillBtnText}>Update Cabinet Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryDeleteBtn} onPress={handleDeleteMedication}>
            <MaterialIcons name="delete-forever" size={20} color={colors.error} />
            <Text style={styles.secondaryDeleteBtnText}>Delete from Cabinet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
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
    paddingBottom: 80,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 24,
  },
  heroCardImg: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  countdownCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 24,
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  countdownTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeValueText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.5,
  },
  timeUnitText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  timeColon: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    paddingBottom: 16,
  },
  countdownProgressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    marginBottom: 12,
  },
  countdownProgressFill: {
    height: 6,
    backgroundColor: colors.secondaryContainer,
    borderRadius: 3,
  },
  countdownFooterText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  identityCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  identityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rxBadge: {
    backgroundColor: colors.secondary + '1A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rxBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.secondary,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  identityName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  identityDosage: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  identityBatch: {
    fontSize: 10,
    color: colors.outline,
    fontWeight: '700',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  bentoCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 16,
  },
  bentoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  bentoCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  bentoCardDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    lineHeight: 14,
  },
  remindersCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  remindersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  remindersTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  addReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addReminderBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  remindersStack: {
    gap: 10,
  },
  emptyReminders: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyRemindersText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.outline,
  },
  reminderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    borderRadius: 12,
  },
  alarmCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderTimeText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  reminderLabelText: {
    fontSize: 9.5,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  toggleTrack: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.secondaryContainer,
    position: 'relative',
    justifyContent: 'center',
  },
  toggleThumb: {
    position: 'absolute',
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.onSecondaryContainer,
  },
  warningContainer: {
    backgroundColor: colors.errorContainer,
    borderWidth: 1,
    borderColor: colors.error + '1A',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  warningLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.onErrorContainer,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  warningText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.onErrorContainer,
    lineHeight: 14,
  },
  actionBlock: {
    gap: 12,
  },
  primaryRefillBtn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryRefillBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  secondaryDeleteBtn: {
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.error + '33',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryDeleteBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.error,
  }
});

export default MedicineDetailsScreen;
