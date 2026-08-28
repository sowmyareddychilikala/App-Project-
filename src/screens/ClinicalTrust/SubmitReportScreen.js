import React, { useState } from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Platform, 
  StatusBar,
  Switch,
  ActivityIndicator,
  Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { ref, push, set } from 'firebase/database';
import { database } from '../../../firebaseConfig';
import { saveUserComplaint } from '../../services/dbService';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const SubmitReportScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser, prefillName = 'Central Metro Pharmacy' } = params;

  const [issueType, setIssueType] = useState('overpricing');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const issueOptions = [
    { label: 'Overpricing / Price Gouging', value: 'overpricing', severity: 'Critical' },
    { label: 'Suspicious Medications / Counterfeits', value: 'suspicious', severity: 'High Risk' },
    { label: 'Poor Service / Unprofessional Conduct', value: 'service', severity: 'Low' },
    { label: 'Refusal to Fill Prescriptions', value: 'refusal', severity: 'Moderate' },
    { label: 'Facility Hygiene / Subpar Standards', value: 'hygiene', severity: 'Moderate' },
    { label: 'Other Regulatory Issues', value: 'other', severity: 'Low' }
  ];

  const handleDropdownSelect = (val) => {
    setIssueType(val);
    setShowDropdown(false);
  };

  const selectedOptionLabel = issueOptions.find(opt => opt.value === issueType)?.label || 'Select Issue Type';

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert("Input Required", "Please describe your experience or issue.");
      return;
    }

    setLoading(true);
    const selectedOption = issueOptions.find(opt => opt.value === issueType);
    const severity = selectedOption ? selectedOption.severity : 'Low';
    const label = selectedOption ? selectedOption.label : 'Complaint';

    const complaintPayload = {
      pharmacyName: prefillName,
      issueType: label,
      severity: severity,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      description: description.trim(),
      status: 'Under Investigation',
      anonymous: anonymous
    };

    try {
      if (mockUser) {
        Alert.alert(
          "Report Submitted",
          "Your report has been logged successfully (Offline mode).",
          [{ text: "OK", onPress: () => navigation.navigate('ComplaintHistory', { uid, mockUser }) }]
        );
      } else {
        // Save complaint report to database
        const saved = await saveUserComplaint(uid, complaintPayload);

        // Spawn a critical notification system alert in the database dynamically!
        const notifRef = ref(database, `users/${uid}/notifications`);
        const newNotifRef = push(notifRef);
        await set(newNotifRef, {
          id: newNotifRef.key,
          type: severity === 'Critical' ? 'critical' : 'expiry',
          category: 'Complaint Logged',
          timestamp: 'Just now',
          title: `Report Registered: ${prefillName}`,
          description: `Your incident report regarding "${label}" is registered under ID: #${saved.id.slice(-6).toUpperCase()}. Audit investigation has been initiated.`,
          unread: true,
          actionLabel: 'Audit Details'
        });

        Alert.alert(
          "Report Filed",
          "A safety auditor has been assigned. You can monitor the audit progress in your notifications.",
          [{ text: "View History", onPress: () => navigation.navigate('ComplaintHistory', { uid, mockUser }) }]
        );
      }
    } catch (err) {
      Alert.alert("Error", "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
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
          <Text style={styles.headerTitle}>Submit Complaint</Text>
        </View>
        <TouchableOpacity style={styles.avatarMini} onPress={() => navigation.navigate('Dashboard', { screen: 'profile' })}>
          <MaterialIcons name="account-circle" size={26} color={colors.outline} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Form Intro */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Report Pharmacy</Text>
          <Text style={styles.introSubtitle}>
            Your feedback helps us maintain the highest standards of safety and professional integrity.
          </Text>
        </View>

        {/* Selected Location Card */}
        <View style={styles.locationBanner}>
          <MaterialIcons name="local-pharmacy" size={20} color={colors.primary} />
          <Text style={styles.locationName}>{prefillName}</Text>
        </View>

        {/* Issue Type Selector */}
        <View style={styles.inputCard}>
          <Text style={styles.label}>ISSUE TYPE</Text>
          <TouchableOpacity 
            style={styles.dropdownTrigger}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.dropdownTriggerText}>{selectedOptionLabel}</Text>
            <MaterialIcons name={showDropdown ? "expand-less" : "expand-more"} size={24} color={colors.outline} />
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownMenu}>
              {issueOptions.map((opt) => (
                <TouchableOpacity 
                  key={opt.value}
                  style={[styles.dropdownItem, issueType === opt.value && styles.dropdownItemActive]}
                  onPress={() => handleDropdownSelect(opt.value)}
                >
                  <Text style={[styles.dropdownItemText, issueType === opt.value && styles.dropdownItemTextActive]}>
                    {opt.label} ({opt.severity})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Description Text Input */}
        <View style={styles.inputCard}>
          <Text style={styles.label}>DESCRIBE YOUR EXPERIENCE</Text>
          <TextInput
            style={styles.textArea}
            multiline={true}
            numberOfLines={6}
            placeholder="Provide details about what happened, including dates, pricing margins, or pack batch codes if applicable..."
            placeholderTextColor={colors.outline}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Anonymous Toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleTextCol}>
            <View style={styles.toggleTitleRow}>
              <MaterialIcons name="visibility-off" size={18} color={colors.primary} />
              <Text style={styles.toggleTitle}>Submit Anonymously</Text>
            </View>
            <Text style={styles.toggleSubtitle}>
              Mask your personal identity from the provider. Auditors will still receive your audit record securely.
            </Text>
          </View>
          <Switch
            value={anonymous}
            onValueChange={setAnonymous}
            trackColor={{ false: colors.outlineVariant, true: colors.primary }}
            thumbColor={Platform.OS === 'ios' ? '#fff' : anonymous ? colors.primaryContainer : '#f4f3f4'}
          />
        </View>

        {/* Action Button Cabinet */}
        <View style={styles.btnRow}>
          <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <MaterialIcons name="send" size={18} color={colors.white} />
                <Text style={styles.submitBtnText}>Submit Complaint Report</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.historyBtn} 
            onPress={() => navigation.navigate('ComplaintHistory', { uid, mockUser })}
          >
            <Text style={styles.historyBtnText}>View Incident Logs</Text>
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
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  introSection: {
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  introSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
    fontWeight: '500',
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 20,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    padding: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.outline,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceContainerLow,
  },
  dropdownTriggerText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
  },
  dropdownMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '33',
  },
  dropdownItemActive: {
    backgroundColor: colors.primaryFixed,
  },
  dropdownItemText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    fontWeight: '700',
    color: colors.primary,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.surfaceContainerLow,
    fontSize: 13.5,
    color: colors.text,
    textAlignVertical: 'top',
    height: 120,
  },
  toggleCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  toggleTextCol: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  toggleSubtitle: {
    fontSize: 10.5,
    color: colors.textSecondary,
    lineHeight: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  btnRow: {
    gap: 12,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 24,
    gap: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  historyBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
  },
  historyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  }
});

export default SubmitReportScreen;
