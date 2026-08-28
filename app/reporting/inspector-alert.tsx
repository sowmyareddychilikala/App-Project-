import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { databaseService } from '../../services/databaseService';
import { Theme } from '../../constants/Theme';

export default function InspectorAlert() {
  const router = useRouter();
  const params = useLocalSearchParams<{ pharmacyId?: string; pharmacyName?: string }>();
  const decodedPharmacyName = params.pharmacyName ? decodeURIComponent(params.pharmacyName) : 'Discount Lifeline Pharmacy';

  const [medName, setMedName] = useState('');
  const [batchId, setBatchId] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleDispatchAlert = async () => {
    if (!medName.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'Medicine Name and Warning details are required to dispatch inspector flags.');
      return;
    }

    setSubmitting(true);
    try {
      await databaseService.submitInspectorAlert({
        pharmacyId: params.pharmacyId || 'p3',
        pharmacyName: decodedPharmacyName,
        medicineName: medName.trim(),
        batchNumber: batchId.trim(),
        description: `[CRITICAL INSPECTOR ALERT] ${description.trim()}`
      });

      Alert.alert(
        'Inspector Flagged',
        'State drug inspector alert dispatched immediately. Field officer will inspect chemical storage and seals within 24 hours.',
        [
          {
            text: 'Track Timeline',
            onPress: () => router.replace('/reporting/status')
          }
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to dispatch immediate inspector warnings.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← PROFILE</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Field Inspector Alert</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>CRITICAL ACTION INITIATED</Text>
          <Text style={styles.bannerDesc}>
            This action dispatches an immediate notification to the on-duty Field Drug Inspector for this region. Please verify all details.
          </Text>
        </View>

        {/* Dispatch Form */}
        <View style={styles.formCard}>
          <View style={styles.inputItem}>
            <Text style={styles.fieldLabel}>FLAGGED PHARMACY</Text>
            <TextInput style={[styles.fieldValueInput, styles.disabledInput]} value={decodedPharmacyName} editable={false} />
          </View>

          <View style={styles.inputItem}>
            <Text style={styles.fieldLabel}>MEDICINE NAME UNDER QUESTION</Text>
            <TextInput style={styles.fieldValueInput} placeholder="e.g. Viagra 100mg" placeholderTextColor={Theme.colors.textMuted} value={medName} onChangeText={setMedName} />
          </View>

          <View style={styles.inputItem}>
            <Text style={styles.fieldLabel}>BATCH NUMBER (IF DETECTED)</Text>
            <TextInput style={styles.fieldValueInput} placeholder="e.g. VIA-FAKE-88" placeholderTextColor={Theme.colors.textMuted} value={batchId} onChangeText={setBatchId} />
          </View>

          <View style={styles.inputItem}>
            <Text style={styles.fieldLabel}>WARNING DETAIL / LAB SHIFT EVIDENCE</Text>
            <TextInput
              style={[styles.fieldValueInput, styles.textArea]}
              placeholder="Describe exact packaging discrepancies or adverse symptoms experienced by patients."
              placeholderTextColor={Theme.colors.textMuted}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* Dispatch Button */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting ? styles.disabledBtn : null]}
          onPress={handleDispatchAlert}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Theme.colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>DISPATCH IMMEDIATE INSPECTOR FLAG</Text>
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
  banner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.highRisk,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.lg,
  },
  bannerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Theme.colors.highRisk,
    letterSpacing: 1.5,
  },
  bannerDesc: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.lg,
    marginTop: Theme.spacing.lg,
  },
  inputItem: {
    marginBottom: Theme.spacing.md,
  },
  fieldLabel: {
    fontSize: 9,
    color: Theme.colors.textMuted,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  fieldValueInput: {
    height: 48,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 10,
    color: Theme.colors.textPrimary,
    paddingHorizontal: Theme.spacing.md,
    fontSize: Theme.typography.sizes.md,
  },
  disabledInput: {
    backgroundColor: Theme.colors.border,
    color: Theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  textArea: {
    height: 96,
    textAlignVertical: 'top',
    paddingVertical: Theme.spacing.sm,
  },
  submitBtn: {
    height: 54,
    backgroundColor: Theme.colors.highRisk,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
    shadowColor: Theme.colors.highRisk,
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
    fontSize: Theme.typography.sizes.xs,
    letterSpacing: 1.2,
  },
});
