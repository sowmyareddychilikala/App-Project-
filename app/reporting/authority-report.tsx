import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { databaseService } from '../../services/databaseService';
import { Theme } from '../../constants/Theme';

export default function RegulatoryReport() {
  const router = useRouter();
  const params = useLocalSearchParams<{ medicineName?: string; batchNumber?: string; manufacturer?: string }>();

  const [medName, setMedName] = useState(params.medicineName ? decodeURIComponent(params.medicineName) : '');
  const [batchId, setBatchId] = useState(params.batchNumber ? decodeURIComponent(params.batchNumber) : '');
  const [pharmacyName, setPharmacyName] = useState('');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReport = async () => {
    if (!medName.trim() || !pharmacyName.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'Medicine Name, Pharmacy Name, and Incident Description are required.');
      return;
    }

    setSubmitting(true);
    try {
      const reportId = await databaseService.submitInspectorAlert({
        pharmacyId: 'unknown',
        pharmacyName: pharmacyName.trim(),
        medicineName: medName.trim(),
        batchNumber: batchId.trim(),
        description: `[Anonymous Report: ${anonymous}] ${description.trim()}`
      });

      Alert.alert(
        'Alert Dispatched',
        'Your incident report has been registered with the State Drug Controller. You can track investigation logs on the dashboard.',
        [
          {
            text: 'Track Status',
            onPress: () => router.replace('/reporting/status')
          }
        ]
      );
    } catch (e) {
      Alert.alert('Escalation Failed', 'Failed to dispatch report to government node.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← CANCEL</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Regulatory Escalation</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>STATE DRUG CONTROLLER GATEWAY</Text>
          <Text style={styles.bannerDesc}>
            Lodge official reports regarding expired stocks, pricing infractions, or counterfeit medicine packaging.
          </Text>
        </View>

        {/* Wizard Form */}
        <View style={styles.formCard}>
          <View style={styles.inputItem}>
            <Text style={styles.fieldLabel}>MEDICINE / DRUG NAME</Text>
            <TextInput style={styles.fieldValueInput} placeholder="e.g. Lipitor 10mg" placeholderTextColor={Theme.colors.textMuted} value={medName} onChangeText={setMedName} />
          </View>

          <View style={styles.inputItem}>
            <Text style={styles.fieldLabel}>BATCH NUMBER (IF REGISTERED)</Text>
            <TextInput style={styles.fieldValueInput} placeholder="e.g. LP-99824" placeholderTextColor={Theme.colors.textMuted} value={batchId} onChangeText={setBatchId} />
          </View>

          <View style={styles.inputItem}>
            <Text style={styles.fieldLabel}>PHARMACY NAME & ADDRESS</Text>
            <TextInput style={styles.fieldValueInput} placeholder="e.g. Discount Chemists, MG Road" placeholderTextColor={Theme.colors.textMuted} value={pharmacyName} onChangeText={setPharmacyName} />
          </View>

          <View style={styles.inputItem}>
            <Text style={styles.fieldLabel}>INCIDENT DESCRIPTION</Text>
            <TextInput
              style={[styles.fieldValueInput, styles.textArea]}
              placeholder="Describe exactly what happened (e.g. suspicious packaging features, lack of license stickers, expired dates)"
              placeholderTextColor={Theme.colors.textMuted}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* Anonymous Toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Text style={styles.toggleTitle}>Protect Identity Anonymously</Text>
            <Text style={styles.toggleSubtitle}>Hide user account ID from inspectors</Text>
          </View>
          <Switch
            value={anonymous}
            onValueChange={setAnonymous}
            trackColor={{ false: Theme.colors.border, true: Theme.colors.primaryLight }}
            thumbColor={Theme.colors.white}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting ? styles.disabledBtn : null]}
          onPress={handleSubmitReport}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Theme.colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>TRANSMIT PUBLIC ESCALATION</Text>
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
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
  textArea: {
    height: 96,
    textAlignVertical: 'top',
    paddingVertical: Theme.spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.lg,
  },
  toggleLeft: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  toggleTitle: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  toggleSubtitle: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  submitBtn: {
    height: 54,
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
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
