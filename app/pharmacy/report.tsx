import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { databaseService } from '../../services/databaseService';
import { Theme } from '../../constants/Theme';

const CONCERN_CATEGORIES = [
  'Sold Expired Medicine',
  'Suspicious Packaging / Potential Counterfeit',
  'Dispensing without prescriptions',
  'Absence of Licensed Pharmacist',
  'Sanitation & Hygiene Concerns'
];

export default function ReportPharmacy() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const decodedName = name ? decodeURIComponent(name) : 'Chemist Shop';

  const [selectedConcern, setSelectedConcern] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!id) return;
    if (!selectedConcern) {
      Alert.alert('Validation Error', 'Please select a primary concern category.');
      return;
    }
    if (!details.trim()) {
      Alert.alert('Validation Error', 'Please describe the incident in the details box.');
      return;
    }

    setSubmitting(true);
    try {
      // Calls DB wrapper which dynamically recalculates and writes new score to Realtime DB!
      const complaintText = `[${selectedConcern}] ${details.trim()}`;
      await databaseService.reportPharmacy(id, complaintText);
      
      Alert.alert(
        'Complaint Lodged',
        `Thank you. Your complaint regarding ${decodedName} has been recorded. The shop trust rating has been downgraded on the Safety Map.`,
        [
          {
            text: 'Return to Profile',
            onPress: () => {
              router.back();
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to transmit complaint to Firebase.');
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
        <Text style={styles.headerTitle}>Report Pharmacy</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.brandingCard}>
          <Text style={styles.brandingLabel}>INCIDENT REPORT REGARDING</Text>
          <Text style={styles.pharmacyName}>{decodedName}</Text>
        </View>

        <Text style={styles.instructionText}>
          Your report will drop the pharmacy's public trust index to alert other patients. Serious concerns will be flagged for investigation by the state drug controller.
        </Text>

        {/* Primary Concern Category list */}
        <Text style={styles.sectionTitle}>Select Primary Concern</Text>
        <View style={styles.categoryCard}>
          {CONCERN_CATEGORIES.map((cat, idx) => {
            const isSelected = selectedConcern === cat;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.catRow,
                  isSelected ? styles.activeCatRow : null,
                  idx === CONCERN_CATEGORIES.length - 1 ? { borderBottomWidth: 0 } : null
                ]}
                onPress={() => setSelectedConcern(cat)}
              >
                <View style={[styles.radioOutline, isSelected ? styles.radioSelected : null]} />
                <Text style={[styles.catText, isSelected ? styles.activeCatText : null]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Details text area */}
        <Text style={styles.sectionTitle}>Additional Comments & Details</Text>
        <View style={styles.formCard}>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Provide specific details (date of purchase, batch number of medicine sold, or descriptive details)"
            placeholderTextColor={Theme.colors.textMuted}
            multiline
            numberOfLines={5}
            value={details}
            onChangeText={setDetails}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting ? styles.disabledBtn : null]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Theme.colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>TRANSMIT COMPLAINT</Text>
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
  brandingCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 20,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.lg,
  },
  brandingLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
    letterSpacing: 1,
  },
  pharmacyName: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
    marginTop: 4,
  },
  instructionText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
    marginTop: Theme.spacing.md,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.md,
    letterSpacing: 0.5,
  },
  categoryCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  activeCatRow: {
    backgroundColor: 'rgba(13, 148, 136, 0.05)',
  },
  radioOutline: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    marginRight: Theme.spacing.md,
  },
  radioSelected: {
    borderColor: Theme.colors.primaryLight,
    backgroundColor: Theme.colors.primary,
  },
  catText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  activeCatText: {
    color: Theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  formCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.md,
  },
  textInput: {
    color: Theme.colors.textPrimary,
    fontSize: Theme.typography.sizes.md,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
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
