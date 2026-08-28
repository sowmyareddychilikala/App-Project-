import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { databaseService } from '../../services/databaseService';
import { Theme } from '../../constants/Theme';
import Svg, { Path, Circle } from 'react-native-svg';

const SYMPTOMS_LIST = [
  'Nausea', 'Dizziness', 'Fatigue', 'Headache', 
  'Skin Rash', 'Insomnia', 'Stomach Pain', 'Muscle Pain'
];

const CONDITIONS_LIST = [
  'Pregnancy', 'Chronic Liver Disease', 'Diabetes', 
  'Heart Disease', 'Asthma', 'None'
];

export default function ReportSideEffect() {
  const router = useRouter();
  const { medicineName } = useLocalSearchParams<{ medicineName: string }>();
  
  const [medName, setMedName] = useState(medicineName ? decodeURIComponent(medicineName) : '');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Mild');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const toggleCondition = (condition: string) => {
    if (condition === 'None') {
      setSelectedConditions(['None']);
      return;
    }
    
    let updated = selectedConditions.filter(c => c !== 'None');
    if (updated.includes(condition)) {
      updated = updated.filter(c => c !== condition);
    } else {
      updated = [...updated, condition];
    }
    setSelectedConditions(updated);
  };

  const handleSubmit = async () => {
    if (!medName.trim()) {
      Alert.alert('Validation Error', 'Please enter the medicine name.');
      return;
    }
    if (selectedSymptoms.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one symptom.');
      return;
    }

    setSubmitting(true);
    try {
      await databaseService.submitSideEffect({
        medicineName: medName.trim(),
        symptoms: selectedSymptoms,
        severity,
        healthConditions: selectedConditions,
        reviewText: review.trim(),
      });

      Alert.alert(
        'Report Filed',
        'Your adverse reaction log has been recorded anonymously to improve community safety.',
        [
          {
            text: 'View Analytics',
            onPress: () => router.push(`/side-effects/analytics?medicineName=${encodeURIComponent(medName)}`)
          }
        ]
      );
    } catch (e) {
      Alert.alert('Failed', 'Failed to transmit side-effect report to Firebase.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Side Effect</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.instructionText}>
          Your report is entirely anonymous. Crowdsourced data helps identify suspicious batch anomalies and helps warn fellow citizens.
        </Text>

        {/* Medicine Name input card */}
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>MEDICINE NAME</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Type drug name (e.g. Paracetamol)"
            placeholderTextColor={Theme.colors.textMuted}
            value={medName}
            onChangeText={setMedName}
          />
        </View>

        {/* Symptoms Multi-select */}
        <Text style={styles.sectionTitle}>What Symptoms Did You Experience?</Text>
        <View style={styles.tagGrid}>
          {SYMPTOMS_LIST.map((symptom) => {
            const isSelected = selectedSymptoms.includes(symptom);
            return (
              <TouchableOpacity
                key={symptom}
                style={[styles.tagItem, isSelected ? styles.activeTagItem : null]}
                onPress={() => toggleSymptom(symptom)}
              >
                <Text style={[styles.tagText, isSelected ? styles.activeTagText : null]}>
                  {symptom}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Severity selection */}
        <Text style={styles.sectionTitle}>Symptom Severity</Text>
        <View style={styles.severityBar}>
          {(['Mild', 'Moderate', 'Severe'] as const).map((level) => {
            const isSelected = severity === level;
            let activeBgColor = Theme.colors.primary;
            if (level === 'Moderate') activeBgColor = Theme.colors.needsVerify;
            if (level === 'Severe') activeBgColor = Theme.colors.highRisk;

            return (
              <TouchableOpacity
                key={level}
                style={[
                  styles.severityTab,
                  isSelected ? { backgroundColor: activeBgColor } : null
                ]}
                onPress={() => setSeverity(level)}
              >
                <Text style={[styles.severityText, isSelected ? styles.activeSeverityText : null]}>
                  {level.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Co-morbidities selector */}
        <Text style={styles.sectionTitle}>Pre-existing Conditions</Text>
        <View style={styles.tagGrid}>
          {CONDITIONS_LIST.map((condition) => {
            const isSelected = selectedConditions.includes(condition);
            return (
              <TouchableOpacity
                key={condition}
                style={[
                  styles.tagItem, 
                  isSelected ? styles.activeTagItemCondition : null
                ]}
                onPress={() => toggleCondition(condition)}
              >
                <Text style={[styles.tagText, isSelected ? styles.activeTagText : null]}>
                  {condition}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Review details */}
        <Text style={styles.sectionTitle}>Review & Log Details</Text>
        <View style={styles.formCard}>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Describe your experience (e.g. onset delay, duration of symptoms, other drugs taken)"
            placeholderTextColor={Theme.colors.textMuted}
            multiline
            numberOfLines={4}
            value={review}
            onChangeText={setReview}
          />
        </View>

        {/* Submit action */}
        <TouchableOpacity 
          style={[styles.submitBtn, submitting ? styles.disabledBtn : null]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Theme.colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>TRANSMIT ANONYMOUS LOG</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: 54,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: Theme.spacing.sm,
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  backBtnText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 60,
    paddingHorizontal: Theme.spacing.lg,
  },
  instructionText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.xs,
    lineHeight: 18,
    marginTop: Theme.spacing.lg,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.lg,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: Theme.spacing.xs,
  },
  textInput: {
    color: Theme.colors.textPrimary,
    fontSize: Theme.typography.sizes.md,
    height: 38,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.md,
    letterSpacing: 0.5,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  tagItem: {
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: Theme.spacing.md,
    margin: 4,
  },
  activeTagItem: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  activeTagItemCondition: {
    backgroundColor: Theme.colors.secondary,
    borderColor: Theme.colors.secondary,
  },
  tagText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  activeTagText: {
    color: Theme.colors.white,
  },
  severityBar: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 4,
  },
  severityTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  severityText: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  activeSeverityText: {
    color: Theme.colors.white,
  },
  submitBtn: {
    height: 54,
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.xl,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: Theme.typography.sizes.sm,
    letterSpacing: 1.2,
  },
});
