import React, { useState, useEffect } from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator, 
  Alert, 
  Platform, 
  StatusBar,
  Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { 
  saveUserMedication, 
  listenUserMedications, 
  saveUserReminderNotification,
  listenUserNotifications,
  deleteUserNotification
} from '../../services/dbService';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const AddReminderScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser, medId, medications: initialMeds } = params;

  const [med, setMed] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [reminderDate, setReminderDate] = useState('2024-10-24');
  const [frequency, setFrequency] = useState('daily'); // 'daily' | 'weekly' | 'expiry'
  const [reminderTime, setReminderTime] = useState('09:00');
  const [amPm, setAmPm] = useState('AM'); // 'AM' | 'PM'
  const [priority, setPriority] = useState('Standard Alert');
  const [customNote, setCustomNote] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [userReminders, setUserReminders] = useState([]);

  // Interactive Calendar state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(7); // 0-indexed (7 = August)

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleSelectDay = (dayNum) => {
    const m = String(calMonth + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    setReminderDate(`${calYear}-${m}-${d}`);
    setIsCalendarOpen(false);
  };

  const handleSetToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setReminderDate(`${y}-${m}-${d}`);
    setIsCalendarOpen(false);
  };

  const handleSetTomorrow = () => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const y = tom.getFullYear();
    const m = String(tom.getMonth() + 1).padStart(2, '0');
    const d = String(tom.getDate()).padStart(2, '0');
    setReminderDate(`${y}-${m}-${d}`);
    setIsCalendarOpen(false);
  };

  const activeUid = uid || 'guest_user';

  // Load details & listen for existing scheduled reminders
  useEffect(() => {
    if (params.medData) {
      setMed(params.medData);
      setLoading(false);
    } else if (mockUser) {
      if (initialMeds && initialMeds[medId]) {
        setMed(initialMeds[medId]);
      } else {
        setMed({
          id: medId || `med_${Date.now()}`,
          name: 'Lisinopril',
          dosage: '10mg Oral Tablet'
        });
      }
      setLoading(false);
    } else {
      const unsubscribe = listenUserMedications(activeUid, (data) => {
        if (data && medId && data[medId]) {
          setMed(data[medId]);
        } else if (!med) {
          setMed({
            id: medId || `med_${Date.now()}`,
            name: 'Medication',
            dosage: '500mg'
          });
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }

    // Listen for scheduled reminders to render under "Your Scheduled Reminders"
    const unsubNotifs = listenUserNotifications(activeUid, (notifData) => {
      if (notifData) {
        const list = Object.values(notifData).filter(n => n && (n.type === 'reminder' || (n.id && String(n.id).startsWith('reminder_'))));
        setUserReminders(list);
      } else {
        setUserReminders([]);
      }
    });

    return () => {
      if (typeof unsubNotifs === 'function') unsubNotifs();
    };
  }, [uid, medId, mockUser, initialMeds, params.medData]);

  // Submit dose reminder configuration
  const handleCreateReminder = async () => {
    if (!reminderTime) {
      Alert.alert("Input Needed", "Please specify the alarm time (HH:MM).");
      return;
    }

    const cleanTime = reminderTime.replace(/AM|PM/gi, '').trim();
    const formattedTime = `${cleanTime} ${amPm}`;
    
    const medName = med?.name || 'Medication';

    if (mockUser) {
      setSaving(true);
      setTimeout(() => {
        setSaving(false);
        setUserReminders(prev => [
          ...prev,
          {
            id: `reminder_${Date.now()}`,
            title: `Dose Reminder: ${medName}`,
            description: customNote.trim() || `Scheduled dose alert set for ${formattedTime}.`,
            time: formattedTime,
            type: 'reminder'
          }
        ]);
        Alert.alert(
          "Reminder Active", 
          `Dose alert scheduled successfully for ${medName} at ${formattedTime}! You can view your active reminders below.`
        );
      }, 600);
    } else {
      try {
        setSaving(true);
        await saveUserReminderNotification(activeUid, medName, formattedTime, customNote.trim());
        setSaving(false);
        Alert.alert(
          "Dose Reminder Active",
          `Dose alert scheduled successfully for ${medName} at ${formattedTime}! You can view your active reminders below.`
        );
      } catch (err) {
        setSaving(false);
        Alert.alert("Error", "Could not schedule dose reminder. Please try again.");
      }
    }
  };

  const handleDeleteReminder = async (remId) => {
    try {
      await deleteUserNotification(activeUid, remId);
      setUserReminders(prev => prev.filter(r => r.id !== remId));
    } catch (e) {}
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Fetching Blister Info...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Top Header App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity 
            style={styles.headerBackBtn}
            onPress={() => navigation.replace('MedicineDetails', { uid, mockUser, medId, medications: initialMeds })}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dose configuration</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Intro Block */}
        <View style={styles.introBlock}>
          <Text style={styles.introTitle}>Configure Alarm</Text>
          <Text style={styles.introDesc}>Enter dose schedules to keep patient cabinet safety aligned automatically.</Text>
        </View>

        {/* Form panel */}
        <View style={styles.formCard}>
          {/* Selected Medicine visual preview */}
          <View style={styles.medCardPreview}>
            <View style={styles.medIconCircle}>
              <MaterialIcons name="pill" size={24} color={colors.white} />
            </View>
            <View>
              <Text style={styles.medPreviewName}>{med?.name}</Text>
              <Text style={styles.medPreviewDosage}>{med?.dosage} • Blister Cabinet</Text>
            </View>
          </View>

          {/* Date Selector input with Interactive Calendar Modal */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Start Date</Text>
            <TouchableOpacity 
              style={styles.calendarTriggerBtn}
              onPress={() => setIsCalendarOpen(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
              <Text style={styles.datePickerValueText}>{reminderDate || 'Select Start Date'}</Text>
              <View style={styles.calendarBadge}>
                <MaterialIcons name="edit-calendar" size={16} color={colors.white} />
                <Text style={styles.calendarBadgeText}>Open Calendar</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Frequency selector buttons */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Frequency Strategy</Text>
            <View style={styles.radioGroup}>
              {/* Daily button */}
              <TouchableOpacity 
                style={[styles.radioButton, frequency === 'daily' && styles.radioButtonActive]}
                onPress={() => setFrequency('daily')}
              >
                <MaterialIcons name="event-repeat" size={20} color={frequency === 'daily' ? colors.primary : colors.outline} />
                <Text style={[styles.radioButtonLabel, frequency === 'daily' && styles.radioButtonLabelActive]}>Daily</Text>
              </TouchableOpacity>

              {/* Weekly button */}
              <TouchableOpacity 
                style={[styles.radioButton, frequency === 'weekly' && styles.radioButtonActive]}
                onPress={() => setFrequency('weekly')}
              >
                <MaterialIcons name="date-range" size={20} color={frequency === 'weekly' ? colors.primary : colors.outline} />
                <Text style={[styles.radioButtonLabel, frequency === 'weekly' && styles.radioButtonLabelActive]}>Weekly</Text>
              </TouchableOpacity>

              {/* Expiry warning button */}
              <TouchableOpacity 
                style={[styles.radioButton, frequency === 'expiry' && styles.radioButtonActive]}
                onPress={() => setFrequency('expiry')}
              >
                <MaterialIcons name="running-with-errors" size={20} color={frequency === 'expiry' ? colors.primary : colors.outline} />
                <Text style={[styles.radioButtonLabel, frequency === 'expiry' && styles.radioButtonLabelActive]}>Near Expiry</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Time & AM/PM Row */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1.5 }]}>
              <Text style={styles.formLabel}>Time of Day & Period</Text>
              <View style={styles.timeInputRow}>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <MaterialIcons name="schedule" size={18} color={colors.primary} style={styles.timeInputIcon} />
                  <TextInput 
                    style={styles.timeFormInput}
                    placeholder="09:00"
                    placeholderTextColor={colors.outline}
                    value={reminderTime}
                    onChangeText={setReminderTime}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                <View style={styles.amPmContainer}>
                  <TouchableOpacity 
                    style={[styles.amPmChip, amPm === 'AM' && styles.amPmChipActive]}
                    onPress={() => setAmPm('AM')}
                  >
                    <Text style={[styles.amPmText, amPm === 'AM' && styles.amPmTextActive]}>AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.amPmChip, amPm === 'PM' && styles.amPmChipActive]}
                    onPress={() => setAmPm('PM')}
                  >
                    <Text style={[styles.amPmText, amPm === 'PM' && styles.amPmTextActive]}>PM</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick Time Preset Pills */}
              <View style={styles.timePresetRow}>
                {['08:00', '12:00', '06:00', '09:00'].map((presetTime) => (
                  <TouchableOpacity 
                    key={presetTime}
                    style={[styles.timePresetChip, reminderTime === presetTime && styles.timePresetChipActive]}
                    onPress={() => setReminderTime(presetTime)}
                  >
                    <Text style={[styles.timePresetText, reminderTime === presetTime && styles.timePresetTextActive]}>{presetTime}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Priority Type</Text>
              <TouchableOpacity 
                style={styles.selectorDropdown}
                onPress={() => {
                  const nextP = priority === 'Standard Alert' ? 'Persistent Ringing' : priority === 'Persistent Ringing' ? 'Silent Notification' : 'Standard Alert';
                  setPriority(nextP);
                }}
              >
                <Text style={styles.selectorDropdownText} numberOfLines={1}>{priority}</Text>
                <MaterialIcons name="arrow-drop-down" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notes field */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Dose Note (Optional)</Text>
            <TextInput 
              style={[styles.formInput, styles.textArea]}
              placeholder="e.g. Take with food or full glass of water..."
              placeholderTextColor={colors.outline}
              multiline={true}
              numberOfLines={4}
              value={customNote}
              onChangeText={setCustomNote}
            />
          </View>

          {/* Form Actions */}
          <View style={styles.formActions}>
            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={handleCreateReminder}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <MaterialIcons name="notifications-active" size={18} color={colors.white} />
                  <Text style={styles.submitBtnText}>Create Reminder</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => navigation.replace('MedicineDetails', { uid, mockUser, medId, medications: initialMeds })}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bento Tip block */}
        <View style={styles.tipBentoCard}>
          <View style={styles.tipIconCircle}>
            <MaterialIcons name="lightbulb" size={18} color={colors.onSecondaryContainer} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Clinician's Advice</Text>
            <Text style={styles.tipDesc}>
              Regular timing maintains stable medication concentrations in the bloodstream. Silent priorities are best for vitamins, while Persistent Ringing ensures you never miss critical doses.
            </Text>
          </View>
        </View>

        {/* Scheduled Reminders List Section */}
        <View style={styles.remindersSection}>
          <View style={styles.remindersHeaderRow}>
            <MaterialIcons name="notifications-active" size={20} color={colors.primary} />
            <Text style={styles.remindersSectionTitle}>Your Scheduled Reminders ({userReminders.length})</Text>
          </View>

          {userReminders.length === 0 ? (
            <View style={styles.emptyRemindersBox}>
              <Text style={styles.emptyRemindersText}>No reminders scheduled yet. Fill out the form above to add your first dose alarm.</Text>
            </View>
          ) : (
            userReminders.map(item => (
              <View key={item.id} style={styles.reminderCardItem}>
                <View style={styles.reminderCardLeft}>
                  <View style={styles.reminderBellCircle}>
                    <MaterialIcons name="alarm" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderItemTitle}>{item.title}</Text>
                    <Text style={styles.reminderItemDesc}>{item.description}</Text>
                  </View>
                </View>

                <View style={styles.reminderCardRight}>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>{item.time || 'Scheduled'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteReminder(item.id)} style={{ padding: 4 }}>
                    <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Interactive Calendar Date Picker Modal */}
      <Modal visible={isCalendarOpen} transparent animationType="fade" onRequestClose={() => setIsCalendarOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalCard}>
            <View style={styles.calHeader}>
              <Text style={styles.calMonthTitle}>{MONTH_NAMES[calMonth]} {calYear}</Text>
              <View style={styles.calNavBtns}>
                <TouchableOpacity 
                  style={styles.calNavBtn} 
                  onPress={() => {
                    if (calMonth === 0) {
                      setCalMonth(11);
                      setCalYear(y => y - 1);
                    } else {
                      setCalMonth(m => m - 1);
                    }
                  }}
                >
                  <MaterialIcons name="chevron-left" size={24} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.calNavBtn}
                  onPress={() => {
                    if (calMonth === 11) {
                      setCalMonth(0);
                      setCalYear(y => y + 1);
                    } else {
                      setCalMonth(m => m + 1);
                    }
                  }}
                >
                  <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Days of week header */}
            <View style={styles.weekHeaderRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <Text key={i} style={styles.weekDayHeader}>{d}</Text>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View style={styles.daysGrid}>
              {Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, idx) => (
                <View key={`empty_${idx}`} style={styles.dayCellEmpty} />
              ))}
              {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, idx) => {
                const dayNum = idx + 1;
                const mStr = String(calMonth + 1).padStart(2, '0');
                const dStr = String(dayNum).padStart(2, '0');
                const fullStr = `${calYear}-${mStr}-${dStr}`;
                const isSelected = reminderDate === fullStr;

                return (
                  <TouchableOpacity
                    key={dayNum}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                    onPress={() => handleSelectDay(dayNum)}
                  >
                    <Text style={[styles.dayCellText, isSelected && styles.dayCellTextSelected]}>{dayNum}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Presets & Close */}
            <View style={styles.calPresetsRow}>
              <TouchableOpacity style={styles.calPresetBtn} onPress={handleSetToday}>
                <Text style={styles.calPresetBtnText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calPresetBtn} onPress={handleSetTomorrow}>
                <Text style={styles.calPresetBtnText}>Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calCloseBtn} onPress={() => setIsCalendarOpen(false)}>
                <Text style={styles.calCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
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
  scrollContainer: {
    padding: 24,
    paddingBottom: 60,
  },
  introBlock: {
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  introDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 20,
    gap: 20,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 2,
  },
  medCardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant + '33',
  },
  medIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medPreviewName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  medPreviewDosage: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 14,
  },
  formInput: {
    height: 48,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingLeft: 48,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  radioButton: {
    flex: 1,
    height: 64,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  radioButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFixed,
  },
  radioButtonLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  radioButtonLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  selectorDropdown: {
    height: 48,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorDropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  textArea: {
    height: 96,
    paddingTop: 12,
    paddingLeft: 16,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  submitBtn: {
    flex: 2,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  tipBentoCard: {
    backgroundColor: colors.secondaryContainer + '40',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.outlineVariant + '33',
  },
  tipIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  tipDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amPmContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    padding: 3,
  },
  amPmChip: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
  amPmChipActive: {
    backgroundColor: colors.primary,
  },
  amPmText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.outline,
  },
  amPmTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  remindersSection: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 16,
  },
  remindersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  remindersSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  emptyRemindersBox: {
    padding: 16,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyRemindersText: {
    fontSize: 12,
    color: colors.outline,
    textAlign: 'center',
    fontWeight: '500',
  },
  reminderCardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4D',
  },
  reminderCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  reminderBellCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  reminderItemDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  reminderCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },
  calendarTriggerBtn: {
    height: 48,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.primary + '66',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  datePickerValueText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    flex: 1,
  },
  calendarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  calendarBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },
  timeFormInput: {
    height: 48,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingLeft: 38,
    paddingRight: 8,
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  timeInputIcon: {
    position: 'absolute',
    left: 12,
    top: 15,
    zIndex: 10,
  },
  timePresetRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  timePresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant + '66',
  },
  timePresetChipActive: {
    backgroundColor: colors.primaryFixed,
    borderColor: colors.primary,
  },
  timePresetText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.outline,
  },
  timePresetTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant + '4D',
  },
  calMonthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  calNavBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  calNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayHeader: {
    width: 38,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: colors.outline,
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 6,
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 19,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  dayCellTextSelected: {
    color: colors.white,
    fontWeight: '800',
  },
  calPresetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant + '4D',
    gap: 8,
  },
  calPresetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primaryFixed,
    borderRadius: 8,
  },
  calPresetBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  calCloseBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
  },
  calCloseBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  }
});

export default AddReminderScreen;
