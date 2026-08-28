import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { saveCommunityAlert, saveSuspiciousMedicine } from '../../services/dbService';

export const AddSafetyReportModal = ({ visible, onClose, uid, mockUser }) => {
  const [medicineName, setMedicineName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [title, setTitle] = useState('');
  const [riskLevel, setRiskLevel] = useState('High'); // High, Elevated, Low
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('North District');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!medicineName.trim() || !title.trim() || !description.trim()) {
      Alert.alert('Required Fields', 'Please fill in the Medicine Name, Incident Type, and Description.');
      return;
    }

    setSubmitting(true);

    const alertData = {
      uid: uid || 'guest_user',
      userName: 'Verified Patient',
      title: title.trim(),
      medicineName: medicineName.trim(),
      riskLevel,
      description: description.trim() + (batchNumber.trim() ? ` (Batch #${batchNumber.trim()})` : ''),
      location: location.trim(),
      timestamp: new Date().toISOString()
    };

    const medData = {
      name: medicineName.trim(),
      manufacturer: manufacturer.trim() || 'Unknown Manufacturer',
      reportsCount: 1,
      suspicion: description.trim() + (batchNumber.trim() ? ` [Batch: ${batchNumber.trim()}]` : ''),
      status: riskLevel === 'High' ? 'Urgent' : riskLevel === 'Elevated' ? 'Active' : 'Investigation',
      imageUrl: ''
    };

    if (mockUser) {
      // Offline mock simulation
      setTimeout(() => {
        setSubmitting(false);
        Alert.alert('Report Registered', 'Mock safety report successfully created.');
        onClose();
        resetForm();
      }, 1000);
    } else {
      try {
        await saveCommunityAlert(alertData);
        await saveSuspiciousMedicine(medData);
        setSubmitting(false);
        Alert.alert('Report Registered', 'Thank you. Your safety alert has been published to the community network.');
        onClose();
        resetForm();
      } catch (error) {
        setSubmitting(false);
        Alert.alert('Submission Failed', 'Failed to publish alert to secure database.');
      }
    }
  };

  const resetForm = () => {
    setMedicineName('');
    setManufacturer('');
    setBatchNumber('');
    setTitle('');
    setRiskLevel('High');
    setDescription('');
    setLocation('North District');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialIcons name="add-alert" size={24} color={colors.primary} />
              <Text style={styles.headerTitle}>Quick Report (SOS)</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={submitting}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionSubtitle}>
              Log medicine anomalies to alert the local volunteer network and feed live dashboard analytics.
            </Text>

            {/* Incident Summary */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Incident Type / Category</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Compromised Seals, Color Discoloration, Label Error"
                placeholderTextColor={colors.outline}
                value={title}
                onChangeText={setTitle}
                editable={!submitting}
              />
            </View>

            {/* Medicine Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medicine Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Amoxicillin 500mg"
                placeholderTextColor={colors.outline}
                value={medicineName}
                onChangeText={setMedicineName}
                editable={!submitting}
              />
            </View>

            {/* Manufacturer */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Manufacturer (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. GlobalPharma Solutions"
                placeholderTextColor={colors.outline}
                value={manufacturer}
                onChangeText={setManufacturer}
                editable={!submitting}
              />
            </View>

            {/* Batch Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Batch Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. AX-2024"
                placeholderTextColor={colors.outline}
                value={batchNumber}
                onChangeText={setBatchNumber}
                editable={!submitting}
              />
            </View>

            {/* Region / District */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location / District</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. North District"
                placeholderTextColor={colors.outline}
                value={location}
                onChangeText={setLocation}
                editable={!submitting}
              />
            </View>

            {/* Risk Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Risk Severity</Text>
              <View style={styles.riskContainer}>
                {['High', 'Elevated', 'Low'].map((level) => {
                  const isActive = riskLevel === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.riskBtn,
                        isActive && {
                          backgroundColor:
                            level === 'High'
                              ? colors.error
                              : level === 'Elevated'
                              ? '#e67e22'
                              : colors.secondary,
                        },
                      ]}
                      onPress={() => setRiskLevel(level)}
                      disabled={submitting}
                    >
                      <Text style={[styles.riskBtnText, isActive && styles.riskBtnTextActive]}>
                        {level.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Incident Details</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Provide a detailed description of the suspicious activity, compromised packaging, or label issues..."
                placeholderTextColor={colors.outline}
                multiline={true}
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                editable={!submitting}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <MaterialIcons name="send" size={18} color={colors.white} />
                  <Text style={styles.submitBtnText}>Submit Safety Alert</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'Public Sans',
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  formScroll: {
    padding: 16,
  },
  sectionSubtitle: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 15,
    color: colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  riskContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  riskBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  riskBtnText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  riskBtnTextActive: {
    color: colors.white,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 30,
  },
  submitBtnDisabled: {
    backgroundColor: colors.outline,
  },
  submitBtnText: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});

export default AddSafetyReportModal;
