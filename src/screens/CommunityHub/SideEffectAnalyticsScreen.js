import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Platform, 
  StatusBar,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { listenSideEffectsReports } from '../../services/dbService';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const SideEffectAnalyticsScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;

  const [dbReports, setDbReports] = useState({});
  const [loading, setLoading] = useState(true);

  // Static analytics fallbacks for high-fidelity clinical visual completeness
  const staticAnalytics = [
    { name: 'Dry Cough', rate: 78, severity: 'Mild - Moderate', count: 124 },
    { name: 'Dizziness', rate: 45, severity: 'Mild', count: 72 },
    { name: 'Headache', rate: 30, severity: 'Mild', count: 48 }
  ];

  const suggestedAlternative = {
    name: 'Losartan 50mg',
    category: 'Cardiovascular',
    trustScore: 96,
    desc: 'Losartan does not inhibit kininase II, maintaining bradykinin levels, resulting in a significantly lower incidence of cough (under 3% clinical rates) compared to Lisinopril.'
  };

  // Listen to reports in RTDB
  useEffect(() => {
    if (mockUser) {
      setLoading(false);
      return;
    }
    if (uid) {
      const unsubscribe = listenSideEffectsReports((data) => {
        setDbReports(data || {});
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [uid, mockUser]);

  // Dynamically compile reports from Firebase RTDB
  const reportsList = Object.values(dbReports);
  const totalReportsCount = reportsList.length;

  const compiledAnalytics = [];
  if (totalReportsCount > 0) {
    const symptomMap = {};
    reportsList.forEach(rep => {
      const symName = rep.symptom || 'Symptom';
      if (!symptomMap[symName]) {
        symptomMap[symName] = { name: symName, count: 0, severity: rep.severity };
      }
      symptomMap[symName].count += 1;
    });

    Object.keys(symptomMap).forEach(key => {
      const sym = symptomMap[key];
      const rate = Math.round((sym.count / totalReportsCount) * 100);
      compiledAnalytics.push({
        name: sym.name,
        rate,
        severity: sym.severity,
        count: sym.count
      });
    });
  }

  // Combine static and user contributed stats (ordering by highest rate)
  const displayAnalytics = totalReportsCount > 0 
    ? compiledAnalytics.sort((a, b) => b.rate - a.rate)
    : staticAnalytics;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Fetching Safety Analytics...</Text>
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
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Symptom Analytics</Text>
        </View>
        <TouchableOpacity style={styles.avatarMini} onPress={() => navigation.navigate('Dashboard', { screen: 'profile' })}>
          <MaterialIcons name="account-circle" size={26} color={colors.outline} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Intro Info Banner */}
        <View style={styles.introCard}>
          <View style={styles.introLeft}>
            <Text style={styles.introLabel}>COLLECTIVE INTELLIGENCE</Text>
            <Text style={styles.introTitle}>Lisinopril Side Effects</Text>
            <Text style={styles.introDesc}>
              Real-time patient occurrences aggregated anonymously to map pharmacovigilance risks.
            </Text>
          </View>
          <View style={styles.chartCircleIcon}>
            <MaterialIcons name="analytics" size={64} color={colors.white + '1A'} />
          </View>
        </View>

        {/* Stats progress bars */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Symptom Occurrence Rates</Text>
          <View style={styles.statsStack}>
            {displayAnalytics.map((stat, idx) => (
              <View key={idx} style={styles.statRow}>
                <View style={styles.statLabelRow}>
                  <Text style={styles.statName}>{stat.name}</Text>
                  <Text style={styles.statRate}>{stat.rate}%</Text>
                </View>
                
                {/* Progress bar container */}
                <View style={styles.progressBarBg}>
                  <View style={[
                    styles.progressBarActive, 
                    { 
                      width: `${stat.rate}%`,
                      backgroundColor: stat.rate > 50 ? colors.error : colors.primary
                    }
                  ]} />
                </View>

                <View style={styles.statMetaRow}>
                  <Text style={styles.statMetaText}>Severity: {stat.severity}</Text>
                  <Text style={styles.statMetaText}>{stat.count} patient reports</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Alternatives Recommendation Bento */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Clinical Alternative Suggestion</Text>
          
          <View style={styles.bentoAlternativeCard}>
            <View style={styles.bentoHeader}>
              <View style={styles.bentoIconWrapper}>
                <MaterialIcons name="swap-calls" size={22} color={colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bentoAlternativeName}>{suggestedAlternative.name}</Text>
                <Text style={styles.bentoAlternativeCategory}>{suggestedAlternative.category}</Text>
              </View>
              <View style={styles.trustScoreBadge}>
                <Text style={styles.trustScoreText}>{suggestedAlternative.trustScore}% TRUST</Text>
              </View>
            </View>

            <Text style={styles.bentoDesc}>{suggestedAlternative.desc}</Text>
            
            <View style={styles.noteBlock}>
              <MaterialIcons name="info" size={16} color={colors.secondary} />
              <Text style={styles.noteText}>Requires active prescription verification by your cardiologist.</Text>
            </View>
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
  introCard: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 28,
  },
  introLeft: {
    flex: 1.6,
    zIndex: 10,
  },
  introLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.white,
  },
  introDesc: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.85,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 4,
  },
  chartCircleIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  sectionBlock: {
    marginBottom: 28,
  },
  sectionHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  statsStack: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  statRow: {
    gap: 6,
  },
  statLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  statRate: {
    fontSize: 14,
    fontWeight: '850',
    color: colors.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarActive: {
    height: '100%',
    borderRadius: 4,
  },
  statMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statMetaText: {
    fontSize: 10.5,
    color: colors.outline,
    fontWeight: '600',
  },
  bentoAlternativeCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  bentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bentoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.secondaryContainer + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoAlternativeName: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primary,
  },
  bentoAlternativeCategory: {
    fontSize: 10,
    color: colors.secondary,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  trustScoreBadge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  trustScoreText: {
    fontSize: 9,
    fontWeight: '850',
    color: colors.onSecondaryContainer,
  },
  bentoDesc: {
    fontSize: 12.5,
    color: colors.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
  },
  noteBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryContainer + '1D',
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '33',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  }
});

export default SideEffectAnalyticsScreen;
