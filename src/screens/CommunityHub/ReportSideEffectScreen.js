import React, { useState } from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
   
  ScrollView, 
  TextInput, 
  Platform, 
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { saveUserSideEffectReport } from '../../services/dbService';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const ReportSideEffectScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;

  // Form states
  const [medName, setMedName] = useState(params.medName || '');
  const [symptom, setSymptom] = useState('');
  const [severity, setSeverity] = useState('Moderate'); // 'Mild' | 'Moderate' | 'Severe'
  const [category, setCategory] = useState('General'); // 'Cardiological' | 'Respiratory' | 'Neurological' | 'General'
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);

  const handleRegisterReport = async () => {
    if (!medName.trim() || !symptom.trim() || !duration.trim()) {
      Alert.alert("Input Needed", "Please specify the medicine, symptom, and duration details.");
      return;
    }

    const payload = {
      medicineName: medName.trim(),
      symptom: symptom.trim(),
      severity,
      category,
      duration: duration.trim(),
      userName: 'Verified Patient',
      location: 'Local Community',
      createdAt: new Date().toISOString()
    };

    try {
      setSaving(true);
      await saveUserSideEffectReport(uid, payload);
      setSaving(false);
      Alert.alert(
        "Report Submitted", 
        "Thank you! Your side effect report is logged securely and live on the Community Safety Feed.",
        [{ text: "View Feed", onPress: () => navigation.replace('CommunityFeed', { uid, mockUser }) }]
      );
    } catch (err) {
      setSaving(false);
      Alert.alert("Database Error", "Failed to upload side effect report. Please try again.");
    }
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
          <Text style={styles.headerTitle}>Report Side Effect</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Intro Branding Card */}
        <View style={styles.introBlock}>
          <Text style={styles.introTitle}>Report Symptom</Text>
          <Text style={styles.introDesc}>
            Log patient adverse symptoms to feed our collective AI analytics and protect other community members from safety anomalies.
          </Text>
        </View>

        {/* Form Card panel */}
        <View style={styles.formCard}>
          {/* Medicine Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Medication Name</Text>
            <TextInput 
              style={styles.formInput}
              placeholder="e.g. Lisinopril"
              placeholderTextColor={colors.outline}
              value={medName}
              onChangeText={setMedName}
            />
          </View>

          {/* Symptom Title */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Symptom Experienced</Text>
            <TextInput 
              style={styles.formInput}
              placeholder="e.g. Dry persistent cough"
              placeholderTextColor={colors.outline}
              value={symptom}
              onChangeText={setSymptom}
            />
          </View>

          {/* Severity Selector Row */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Severity Level</Text>
            <View style={styles.selectionRow}>
              {['Mild', 'Moderate', 'Severe'].map((sev) => {
                const active = severity === sev;
                return (
                  <TouchableOpacity 
                    key={sev}
                    style={[
                      styles.selectionBtn, 
                      active && styles.selectionBtnActive,
                      active && sev === 'Severe' && { borderColor: colors.error, backgroundColor: colors.errorContainer }
                    ]}
                    onPress={() => setSeverity(sev)}
                  >
                    <Text style={[
                      styles.selectionBtnText, 
                      active && styles.selectionBtnTextActive,
                      active && sev === 'Severe' && { color: colors.error }
                    ]}>{sev}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Category Chip Selector */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Systemic Category</Text>
            <View style={styles.selectionRow}>
              {['Cardiological', 'Respiratory', 'Neurological', 'General'].map((cat) => {
                const active = category === cat;
                return (
                  <TouchableOpacity 
                    key={cat}
                    style={[styles.chipBtn, active && styles.chipBtnActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.chipBtnText, active && styles.chipBtnTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Duration Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Onset & Duration Note</Text>
            <TextInput 
              style={[styles.formInput, styles.textArea]}
              placeholder="e.g. Started on 3rd day of treatment, persists for 4 days..."
              placeholderTextColor={colors.outline}
              multiline={true}
              numberOfLines={4}
              value={duration}
              onChangeText={setDuration}
            />
          </View>

          {/* Actions */}
          <View style={styles.formActions}>
            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={handleRegisterReport}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <MaterialIcons name="report" size={18} color={colors.white} />
                  <Text style={styles.submitBtnText}>Submit Safety Report</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clinical Reminder bento */}
        <View style={styles.disclaimerBento}>
          <MaterialIcons name="info" size={18} color={colors.secondary} />
          <Text style={styles.disclaimerText}>
            Reported side effects are aggregated anonymously. MediGuard AI scans these trends to trigger batch warning flags across cabinet schedule logs.
          </Text>
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
  header: {
    flexDirection: 'row',
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
    paddingBottom: 40,
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
    borderWidth: 1.5,
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
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '850',
    color: colors.primary,
  },
  formInput: {
    height: 48,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
  },
  selectionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  selectionBtn: {
    flex: 1,
    height: 40,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  selectionBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFixed,
  },
  selectionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  selectionBtnTextActive: {
    color: colors.primary,
    fontWeight: '850',
  },
  chipBtn: {
    height: 36,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  chipBtnActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  chipBtnTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  textArea: {
    height: 96,
    paddingTop: 12,
    paddingLeft: 16,
    textAlignVertical: 'top',
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
    fontSize: 13,
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
  disclaimerBento: {
    flexDirection: 'row',
    backgroundColor: colors.secondaryContainer + '1E',
    borderWidth: 1,
    borderColor: colors.outlineVariant + '33',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    lineHeight: 15,
  }
});

export default ReportSideEffectScreen;
