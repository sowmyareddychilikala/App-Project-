import React, { useState, useEffect } from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
   
  ScrollView, 
  Platform, 
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { 
  saveUserMedication, 
  listenUserMedications 
} from '../../services/dbService';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const UsageDosageScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser, medData } = params;

  // Safeguard if opened directly
  const med = medData || {
    id: 'med_c2',
    name: 'Amoxicillin',
    strength: '500mg',
    type: 'Capsule'
  };

  const [cabinetMeds, setCabinetMeds] = useState({});
  const [loading, setLoading] = useState(false);

  // Monitor cabinet medications to check if present
  useEffect(() => {
    if (mockUser) {
      setCabinetMeds({
        'med_1': { id: 'med_1', name: 'Lisinopril', dosage: '10mg', time: '09:00 AM', instructions: 'Take with food', taken: false, takenTime: '' }
      });
      return;
    }
    if (uid) {
      const unsubscribe = listenUserMedications(uid, (data) => {
        setCabinetMeds(data || {});
      });
      return () => unsubscribe();
    }
  }, [uid, mockUser]);

  // Handle "Set Dosage Reminder" trigger
  const handleSetReminder = () => {
    navigation.navigate('AddReminder', {
      uid,
      mockUser,
      medData: {
        id: med.id || `med_${Date.now()}`,
        name: med.name,
        dosage: med.strength || '500mg',
        type: med.type || 'Tablet',
        instructions: med.usage || 'Take as directed'
      }
    });
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
          <Text style={styles.headerTitle}>Usage & Dosage</Text>
        </View>
        <TouchableOpacity style={styles.avatarMini} onPress={() => navigation.navigate('Dashboard', { screen: 'profile' })}>
          <MaterialIcons name="account-circle" size={26} color={colors.outline} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Medicine Branding Panel */}
        <View style={styles.brandCard}>
          <View style={styles.pillIconCircle}>
            <MaterialIcons name="pill" size={30} color={colors.white} />
          </View>
          <View>
            <Text style={styles.medBrandName}>{med.name} {med.strength || '500mg'}</Text>
            <Text style={styles.medBrandCategory}>Clinical Guidelines • {med.type || 'Capsule'}</Text>
          </View>
        </View>

        {/* Dosage Grid Table */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeadingRow}>
            <MaterialIcons name="table-chart" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Recommended Dose</Text>
          </View>
          
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: 1.2 }]}>Age Group</Text>
              <Text style={[styles.headerCell, { flex: 2 }]}>Dosage Instruction</Text>
            </View>
            
            {(med.dosageTable || [
              { group: 'Adults', sub: '18+ years', desc: '500mg every 8 hours or 875mg every 12 hours' },
              { group: 'Children', sub: '3 - 17 years', desc: '20mg/kg/day in divided doses every 8 hours' },
              { group: 'Infants', sub: 'Under 3 months', desc: 'Max 30mg/kg/day divided every 12 hours' }
            ]).map((row, idx, arr) => (
              <View key={idx} style={[styles.tableRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[{ flex: 1.2 }]}>
                  <Text style={styles.rowTitle}>{row.group}</Text>
                  <Text style={styles.rowSub}>{row.sub}</Text>
                </View>
                <Text style={[styles.rowDesc, { flex: 2 }]}>{row.desc}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.cautionNote}>
            {med.dosageInfo || "* Note: Absolute dosages are dependent on body weight and severity of infection. Consult your primary practitioner."}
          </Text>
        </View>

        {/* Safe Administration Instructions */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeadingRow}>
            <MaterialIcons name="fact-check" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>How to Take Safely</Text>
          </View>

          <View style={styles.instructionsStack}>
            {(med.instructionsList || [
              'Take with or without food. Taking it with meals can help prevent moderate stomach irritation.',
              'Swallow the capsule whole with a full glass of water. Never crush, split, or chew clinical capsules.',
              'Always complete the full prescribed clinical course, even if symptoms vanish early, to prevent antibiotic resistance.'
            ]).map((step, idx) => (
              <View key={idx} style={styles.instructionStep}>
                <View style={styles.stepNumberCircle}><Text style={styles.stepNum}>{idx + 1}</Text></View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
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
  brandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 28,
  },
  pillIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medBrandName: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  medBrandCategory: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionBlock: {
    marginBottom: 28,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '850',
    color: colors.primary,
  },
  tableCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerCell: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant + '33',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  rowSub: {
    fontSize: 10.5,
    color: colors.outline,
    fontWeight: '600',
    marginTop: 1,
  },
  rowDesc: {
    fontSize: 12.5,
    color: colors.textSecondary,
    fontWeight: '600',
    lineHeight: 16,
  },
  cautionNote: {
    fontSize: 10.5,
    fontStyle: 'italic',
    color: colors.outline,
    fontWeight: '600',
    paddingHorizontal: 4,
    marginTop: 10,
    lineHeight: 14,
  },
  instructionsStack: {
    gap: 12,
  },
  instructionStep: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    padding: 14,
    borderRadius: 14,
    gap: 14,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.outlineVariant,
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '850',
    color: colors.white,
  },
  stepText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.textSecondary,
    fontWeight: '600',
    lineHeight: 17,
  },
  actionContainer: {
    alignItems: 'center',
    gap: 10,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 24,
    width: '100%',
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  reminderBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  actionNote: {
    fontSize: 10.5,
    color: colors.outline,
    fontWeight: '600',
  }
});

export default UsageDosageScreen;
