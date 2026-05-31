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
  Platform, 
  StatusBar 
} from 'react-native';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { saveUserMedication, listenUserMedications } from '../../services/dbService';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const AddReminderScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser, medId, medications: initialMeds } = params;

  const [med, setMed] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [reminderDate, setReminderDate] = useState('2024-10-24');
  const [frequency, setFrequency] = useState('daily'); // 'daily' | 'weekly' | 'expiry'
  const [reminderTime, setReminderTime] = useState('08:00');
  const [priority, setPriority] = useState('Standard Alert');
  const [customNote, setCustomNote] = useState('');
  
  const [saving, setSaving] = useState(false);

  // Load details
  useEffect(() => {
    if (mockUser) {
      if (initialMeds && initialMeds[medId]) {
        setMed(initialMeds[medId]);
      } else {
        setMed({
          id: medId,
          name: 'Lisinopril',
          dosage: '10mg Oral Tablet'
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

  // Submit dose reminder configuration
  const handleCreateReminder = async () => {
    if (!reminderTime) {
      Alert.alert("Input Needed", "Please specify the alarm time.");
      return;
    }

    // Convert 24hr format to AM/PM string
    const formatTime12hr = (timeStr) => {
      const [hours, minutes] = timeStr.split(':');
      let hr = parseInt(hours);
      const ampm = hr >= 12 ? 'PM' : 'AM';
      hr = hr % 12;
      hr = hr ? hr : 12; // 0 should be 12
      const formattedHr = hr < 10 ? `0${hr}` : hr;
      return `${formattedHr}:${minutes} ${ampm}`;
    };

    const formattedTime = formatTime12hr(reminderTime);
    
    // Add reminder setting inside medication node
    const nextReminders = med.reminders ? { ...med.reminders } : {};
    const newRemId = `rem_${Date.now()}`;
    nextReminders[newRemId] = {
      id: newRemId,
      time: formattedTime,
      label: priority,
      active: true,
      frequency,
      date: reminderDate,
      note: customNote.trim()
    };

    const updatedMedData = {
      ...med,
      reminders: nextReminders,
      // If "Before Expiry" frequency selected, adjust warning fields
      instructions: customNote.trim() ? customNote.trim() : med.instructions
    };

    if (mockUser) {
      setSaving(true);
      setTimeout(() => {
        setSaving(false);
        Alert.alert(
          "Reminder Synced", 
          `Standard dose alert created successfully for Lisinopril at ${formattedTime}!`,
          [
            { text: "Confirm", onPress: () => navigation.replace('MedicineDetails', { uid, mockUser, medId, medications: { ...initialMeds, [medId]: updatedMedData } }) }
          ]
        );
      }, 1200);
    } else {
      try {
        setSaving(true);
        await saveUserMedication(uid, updatedMedData);
        setSaving(false);
        Alert.alert(
          "Dose Reminder Active",
          `Standard dose alert scheduled successfully at ${formattedTime}!`,
          [
            { text: "OK", onPress: () => navigation.replace('MedicineDetails', { uid, medId }) }
          ]
        );
      } catch (err) {
        setSaving(false);
        Alert.alert("Error", "Could not schedule dose reminder. Please try again.");
      }
    }
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

          {/* Date Selector input */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Start Date</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="calendar-today" size={18} color={colors.outline} style={styles.inputIcon} />
              <TextInput 
                style={styles.formInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.outline}
                value={reminderDate}
                onChangeText={setReminderDate}
              />
            </View>
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

          {/* Time & Priority Row */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Time of Day</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="schedule" size={18} color={colors.outline} style={styles.inputIcon} />
                <TextInput 
                  style={styles.formInput}
                  placeholder="e.g. 08:00"
                  placeholderTextColor={colors.outline}
                  value={reminderTime}
                  onChangeText={setReminderTime}
                />
              </View>
            </View>

            <View style={[styles.formGroup, { flex: 1.2 }]}>
              <Text style={styles.formLabel}>Priority Type</Text>
              <TouchableOpacity 
                style={styles.selectorDropdown}
                onPress={() => {
                  const nextP = priority === 'Standard Alert' ? 'Persistent Ringing' : priority === 'Persistent Ringing' ? 'Silent Notification' : 'Standard Alert';
                  setPriority(nextP);
                }}
              >
                <Text style={styles.selectorDropdownText}>{priority}</Text>
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
              Regular timing maintains stable medication concentrations in the bloodstream. Silent priorities are best for vitamins, while Persistent Ringing ensures you never miss critical cardiovascular doses.
            </Text>
          </View>
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
  }
});

export default AddReminderScreen;
