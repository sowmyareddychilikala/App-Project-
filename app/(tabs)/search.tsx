import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '../../constants/Theme';
import Svg, { Path, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

export interface InfoDrugItem {
  name: string;
  genericName: string;
  purpose: string;
  uses: string[];
  dosage: string;
  warnings: string[];
  precautions: string[];
  sideEffects: string[];
  manufacturer: string;
}

// Pre-populated comprehensive medical data library
export const drugLibrary: InfoDrugItem[] = [
  {
    name: 'Paracetamol (Acetaminophen)',
    genericName: 'Acetaminophen',
    purpose: 'Analgesic & Antipyretic',
    uses: [
      'Relief of mild to moderate pain (headaches, muscle aches, backaches).',
      'Temporary reduction of fever symptoms.'
    ],
    dosage: 'Adults: 500mg to 1000mg every 4-6 hours as needed. Do not exceed 4000mg in 24 hours.',
    warnings: [
      'Severe liver damage may occur if you take more than the maximum daily dose.',
      'Avoid taking other medications containing acetaminophen concurrently.'
    ],
    precautions: [
      'Consult a physician if you have chronic liver disease or alcohol dependency.',
      'Discontinue if pain worsens or persists beyond 10 days.'
    ],
    sideEffects: [
      'Nausea, rash, or allergic reactions (rare).',
      'Dark urine or yellowing of eyes/skin (indicates liver complications).'
    ],
    manufacturer: 'GlaxoSmithKline (GSK)'
  },
  {
    name: 'Lipitor (Atorvastatin)',
    genericName: 'Atorvastatin Calcium',
    purpose: 'Cholesterol-Lowering Statin',
    uses: [
      'Reduces LDL ("bad") cholesterol and triglycerides in the bloodstream.',
      'Elevates HDL ("good") cholesterol levels.',
      'Lowers the risk of cardiovascular events, stroke, and heart attacks.'
    ],
    dosage: 'Adults: 10mg to 80mg once daily, administered with or without food at any hour.',
    warnings: [
      'May cause muscle pain or weakness (statin-induced myopathy).',
      'Rare risk of severe skeletal muscle breakdown (rhabdomyolysis).'
    ],
    precautions: [
      'Monitor liver enzymes through blood checks prior to and during therapy.',
      'Strictly contraindicated during pregnancy or breastfeeding.'
    ],
    sideEffects: [
      'Joint aches, diarrhea, or mild nasal inflammation.',
      'Muscle tenderness, fever, or extreme exhaustion (report immediately).'
    ],
    manufacturer: 'Pfizer Inc.'
  },
  {
    name: 'Metformin HCl 500mg',
    genericName: 'Metformin Hydrochloride',
    purpose: 'Antidiabetic agent (Biguanide)',
    uses: [
      'Management of Type 2 Diabetes Mellitus alongside diet and exercise.',
      'Enhances insulin sensitivity and decreases hepatic glucose generation.'
    ],
    dosage: 'Adults: 500mg twice daily with breakfast and dinner, titrated gradually.',
    warnings: [
      'Extremely rare but fatal risk of lactic acidosis (acid buildup in blood).',
      'Avoid excessive alcohol usage while taking this medication.'
    ],
    precautions: [
      'Contraindicated in patients with severe kidney impairment or renal failure.',
      'Requires regular checks of renal filtration levels (eGFR).'
    ],
    sideEffects: [
      'Metallic taste in mouth, stomach upset, nausea, or loose stools.',
      'Fatigue, muscle cramping, or rapid deep breathing (requires emergency care).'
    ],
    manufacturer: 'Bristol-Myers Squibb'
  },
  {
    name: 'Amoxicillin Trihydrate',
    genericName: 'Amoxicillin',
    purpose: 'Broad-Spectrum Penicillin Antibiotic',
    uses: [
      'Treatment of middle ear infections, tonsillitis, throat infections.',
      'Treats respiratory tract infections and uncomplicated urinary tract infections.'
    ],
    dosage: 'Adults: 250mg to 500mg every 8 hours, or 500mg to 875mg every 12 hours.',
    warnings: [
      'Complete the full course of treatment even if symptoms disappear to prevent bacterial resistance.',
      'Do not use if you have a documented allergy to penicillin or cephalosporin antibiotics.'
    ],
    precautions: [
      'May decrease the effectiveness of oral contraceptive pills.',
      'Use with caution if you have a history of mononucleosis.'
    ],
    sideEffects: [
      'Mild diarrhea, nausea, vomiting, or skin rashes.',
      'Severe watery diarrhea with fever and cramping (potential C. diff infection).'
    ],
    manufacturer: 'Sandoz / Novartis'
  },
  {
    name: 'Aspirin (Cardio)',
    genericName: 'Acetylsalicylic Acid',
    purpose: 'NSAID / Platelet Aggregation Inhibitor',
    uses: [
      'Secondary prevention of cardiovascular diseases in high-risk patients.',
      'Inhibits blood clotting to reduce stroke risk.'
    ],
    dosage: 'Adults: 75mg to 100mg once daily for platelet inhibition. Take with liquid.',
    warnings: [
      'Increases susceptibility to gastrointestinal bleeding or stomach ulcers.',
      'Strictly avoid giving to children/teenagers due to risk of Reye\'s Syndrome.'
    ],
    precautions: [
      'Consult a surgeon before scheduled procedures due to prolonged clotting times.',
      'Avoid if you have asthma, active bleeding disorders, or gout.'
    ],
    sideEffects: [
      'Heartburn, mild indigestion, or increased bruising.',
      'Black tarry stools, coughing up blood, or ringing in ears (tinnitus).'
    ],
    manufacturer: 'Bayer Pharmaceuticals'
  }
];

export default function MedicineSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<InfoDrugItem[]>(drugLibrary);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setResults(drugLibrary);
    } else {
      const filtered = drugLibrary.filter(
        (drug) =>
          drug.name.toLowerCase().includes(query.toLowerCase()) ||
          drug.genericName.toLowerCase().includes(query.toLowerCase()) ||
          drug.purpose.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    }
  };

  const renderDrugRow = ({ item }: { item: InfoDrugItem }) => {
    return (
      <TouchableOpacity
        style={styles.drugCard}
        onPress={() => router.push(`/medicine/info-${encodeURIComponent(item.name)}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.drugName}>{item.name}</Text>
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path d="M9 18 L15 12 L9 6" fill="none" stroke={Theme.colors.primaryLight} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <Text style={styles.genericText}>Active: {item.genericName}</Text>
        
        <View style={styles.badgeContainer}>
          <View style={styles.purposeBadge}>
            <Text style={styles.purposeText}>{item.purpose.toUpperCase()}</Text>
          </View>
          <Text style={styles.mfgText}>{item.manufacturer}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medicine Directory</Text>
      <Text style={styles.subtitle}>Look up indications, dosage rules, precautions, and side effects from official educational libraries.</Text>

      {/* Search Input bar */}
      <View style={styles.searchBarWrapper}>
        <Svg width={20} height={20} viewBox="0 0 24 24" style={styles.searchIcon}>
          <Circle cx="11" cy="11" r="6" fill="none" stroke={Theme.colors.textMuted} strokeWidth={2.5} />
          <Path d="M16 16 L21 21" stroke={Theme.colors.textMuted} strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by drug name or category..."
          placeholderTextColor={Theme.colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Results List */}
      {results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptyDesc}>We couldn't locate any matching medicines in the database. Please check your spelling or search a different keyword.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderDrugRow}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: 54,
  },
  title: {
    fontSize: Theme.typography.sizes.xxl,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: Theme.spacing.md,
  },
  subtitle: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.xs,
    lineHeight: 16,
  },
  searchBarWrapper: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.md,
  },
  searchIcon: {
    marginRight: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.textPrimary,
    fontSize: Theme.typography.sizes.md,
  },
  listContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: 120, // prevents bottom tabs overlapping
    marginTop: Theme.spacing.md,
  },
  drugCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 20,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drugName: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
  },
  genericText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  purposeBadge: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    borderRadius: 6,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
  },
  purposeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Theme.colors.primaryLight,
  },
  mfgText: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: Theme.typography.sizes.lg,
    color: Theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  emptyDesc: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Theme.spacing.sm,
    maxWidth: width * 0.75,
  },
});
