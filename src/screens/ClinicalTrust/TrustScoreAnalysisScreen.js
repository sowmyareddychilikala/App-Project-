import React from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const TrustScoreAnalysisScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { pharmacyData } = params;

  const pharmacy = pharmacyData || {
    id: 'pharma_1',
    name: 'CVS Health Center',
    verified: true,
    distance: 0.8,
    trustScore: 98,
    address: '1242 Medical Plaza, Suite 400\nCentral District, NY 10001',
    phone: '+1 (555) 124-2400',
    hours: '24/7 Open',
    tags: ['24/7 Open', 'Vaccines Available'],
    complianceAlert: false
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
          <Text style={styles.headerTitle}>AI Trust Analysis</Text>
        </View>
        <TouchableOpacity style={styles.avatarMini} onPress={() => navigation.navigate('Dashboard', { screen: 'profile' })}>
          <MaterialIcons name="account-circle" size={26} color={colors.outline} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header Intro */}
        <View style={styles.introSection}>
          <Text style={styles.introLabel}>AI TRUST REPORT</Text>
          <Text style={styles.introTitle}>Trust Analysis: {pharmacy.name}</Text>
          {pharmacy.verified && (
            <View style={styles.verifiedRow}>
              <MaterialIcons name="verified" size={16} color={colors.secondary} />
              <Text style={styles.verifiedText}>VERIFIED PARTNER</Text>
            </View>
          )}
        </View>

        {/* Large Score Card */}
        <View style={styles.mainScoreCard}>
          {/* Radial score gauge simulated layout */}
          <View style={styles.radialGaugeCol}>
            <View style={[
              styles.circleOuter,
              pharmacy.complianceAlert ? { borderColor: colors.errorContainer } : { borderColor: colors.secondaryContainer }
            ]}>
              <Text style={[
                styles.radialScoreText,
                pharmacy.complianceAlert ? { color: colors.error } : { color: colors.secondary }
              ]}>{pharmacy.trustScore}</Text>
              <Text style={styles.radialMaxText}>OUT OF 100</Text>
            </View>
          </View>

          <View style={styles.scoreIntegrityCol}>
            <View style={[
              styles.ratingBadge,
              pharmacy.complianceAlert ? { backgroundColor: colors.errorContainer, borderColor: colors.error } : { backgroundColor: colors.secondaryContainer, borderColor: colors.secondary }
            ]}>
              <MaterialIcons name="shield" size={14} color={pharmacy.complianceAlert ? colors.error : colors.secondary} />
              <Text style={[
                styles.ratingBadgeText,
                pharmacy.complianceAlert ? { color: colors.error } : { color: colors.secondary }
              ]}>
                {pharmacy.complianceAlert ? 'HIGH REGULATORY RISK' : 'EXCELLENT TRUST RATING'}
              </Text>
            </View>
            <Text style={styles.summaryTitle}>AI Integrity Summary</Text>
            <Text style={styles.summaryDesc}>
              {pharmacy.complianceAlert
                ? "Our clinical records identify frequent price discrepancies on essential prescription medications and outstanding facility compliance alerts. Continuous audit monitoring is activated."
                : "This pharmacy consistently receives high marks for authenticity and speed. CarePoint and CVS Global have demonstrated a remarkable commitment to regulatory compliance and patient safety standards."
              }
            </Text>
          </View>
        </View>

        {/* User Sentiment & Feedback (Progress Bars) */}
        <View style={styles.specCard}>
          <Text style={styles.cardHeading}>User Sentiment Analysis</Text>
          <Text style={styles.cardSub}>Aggregate analysis of 4,200+ patient surveys</Text>
          
          <View style={styles.sentimentItem}>
            <View style={styles.sentimentTitleRow}>
              <View style={styles.sentimentLabelCol}>
                <MaterialIcons name="sentiment-very-satisfied" size={18} color={colors.secondary} />
                <Text style={styles.sentimentName}>Positive Reviews</Text>
              </View>
              <Text style={styles.sentimentPercent}>{pharmacy.complianceAlert ? '45%' : '85%'}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[
                styles.progressBarFill, 
                pharmacy.complianceAlert ? { width: '45%', backgroundColor: colors.error } : { width: '85%', backgroundColor: colors.secondary }
              ]} />
            </View>
          </View>

          <View style={styles.sentimentItem}>
            <View style={styles.sentimentTitleRow}>
              <View style={styles.sentimentLabelCol}>
                <MaterialIcons name="sentiment-neutral" size={18} color={colors.outline} />
                <Text style={styles.sentimentName}>Neutral / Mixed Reviews</Text>
              </View>
              <Text style={styles.sentimentPercent}>{pharmacy.complianceAlert ? '35%' : '12%'}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[
                styles.progressBarFill, 
                pharmacy.complianceAlert ? { width: '35%', backgroundColor: colors.outline } : { width: '12%', backgroundColor: colors.outline }
              ]} />
            </View>
          </View>
        </View>

        {/* Complaint Frequency Card */}
        <View style={styles.specCard}>
          <View style={styles.headingRow}>
            <View style={styles.iconWrapper}>
              <MaterialIcons name="report-problem" size={20} color={colors.primary} />
            </View>
            <View style={[
              styles.riskBadge,
              pharmacy.complianceAlert ? { backgroundColor: colors.errorContainer } : { backgroundColor: colors.secondaryContainer }
            ]}>
              <Text style={[
                styles.riskBadgeText,
                pharmacy.complianceAlert ? { color: colors.error } : { color: colors.secondary }
              ]}>{pharmacy.complianceAlert ? 'HIGH RISK' : 'LOW RISK'}</Text>
            </View>
          </View>
          <Text style={styles.cardHeading}>Complaint Frequency</Text>
          <Text style={styles.cardSub}>
            {pharmacy.complianceAlert 
              ? "Over 12 safety or pricing complaints filed during the past 6 months."
              : "Only 2 validated complaints registered in the last 6 months."
            }
          </Text>
          
          {/* Simulated chart bars */}
          <View style={styles.chartContainer}>
            <View style={[styles.chartBar, { height: '10%' }]} />
            <View style={[styles.chartBar, { height: '15%' }]} />
            <View style={[styles.chartBar, pharmacy.complianceAlert ? { height: '80%', backgroundColor: colors.error } : { height: '40%', backgroundColor: colors.secondary }]} />
            <View style={[styles.chartBar, { height: '12%' }]} />
            <View style={[styles.chartBar, { height: '8%' }]} />
            <View style={[styles.chartBar, pharmacy.complianceAlert ? { height: '95%', backgroundColor: colors.error } : { height: '25%', backgroundColor: colors.secondary }]} />
          </View>
          <View style={styles.chartLabelRow}>
            <Text style={styles.chartLabel}>Jan</Text>
            <Text style={styles.chartLabel}>Jun</Text>
          </View>
        </View>

        {/* Report Severity Parameters */}
        <View style={styles.specCard}>
          <Text style={styles.cardHeading}>Audit Parameters Breakdown</Text>
          
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownPointDot} />
            <View style={styles.breakdownContent}>
              <Text style={styles.breakdownTitle}>Sourcing Verification (40% Weight)</Text>
              <Text style={styles.breakdownDesc}>
                Auditing prescription batch codes from official state pharmaceutical supply records.
              </Text>
            </View>
          </View>

          <View style={styles.breakdownRow}>
            <View style={[styles.breakdownPointDot, { backgroundColor: colors.secondary }]} />
            <View style={styles.breakdownContent}>
              <Text style={styles.breakdownTitle}>User Review Compliance (30% Weight)</Text>
              <Text style={styles.breakdownDesc}>
                Aggregated patient sentiment score mapping pricing consistency and professional behavior.
              </Text>
            </View>
          </View>

          <View style={[styles.breakdownRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={[styles.breakdownPointDot, { backgroundColor: colors.outline }]} />
            <View style={styles.breakdownContent}>
              <Text style={styles.breakdownTitle}>Facility Regulatory Audits (30% Weight)</Text>
              <Text style={styles.breakdownDesc}>
                Safety, hygiene, storage temperature regulation parameters, and licensing compliance audits.
              </Text>
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
  introLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.secondary,
  },
  mainScoreCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  radialGaugeCol: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radialScoreText: {
    fontSize: 24,
    fontWeight: '900',
  },
  radialMaxText: {
    fontSize: 8,
    color: colors.outline,
    fontWeight: '700',
    marginTop: 2,
  },
  scoreIntegrityCol: {
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 0.5,
    marginBottom: 6,
  },
  ratingBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  summaryDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  specCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    padding: 16,
    marginBottom: 20,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '850',
    color: colors.primary,
  },
  cardSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 16,
    fontWeight: '500',
  },
  sentimentItem: {
    marginBottom: 12,
  },
  sentimentTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sentimentLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sentimentName: {
    fontSize: 12,
    fontWeight: '750',
    color: colors.text,
  },
  sentimentPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.outlineVariant + '33',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  riskBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  chartContainer: {
    flexDirection: 'row',
    height: 80,
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 8,
  },
  chartBar: {
    flex: 1,
    backgroundColor: colors.outlineVariant,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  chartLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 8,
  },
  chartLabel: {
    fontSize: 10,
    color: colors.outline,
    fontWeight: '700',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '33',
  },
  breakdownPointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  breakdownContent: {
    flex: 1,
  },
  breakdownTitle: {
    fontSize: 12.5,
    fontWeight: '750',
    color: colors.text,
  },
  breakdownDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 14,
    marginTop: 2,
    fontWeight: '500',
  }
});

export default TrustScoreAnalysisScreen;
