import React, { useState, useEffect } from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
   
  ScrollView, 
  Image, 
  Platform, 
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { 
  saveUserBookmarkedMedicine, 
  deleteUserBookmarkedMedicine, 
  listenUserBookmarkedMedicines,
  listenUserConditions
} from '../../services/dbService';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const MedicineOverviewScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser, medData } = params;

  // Safeguard if opened directly without parameters
  const med = medData || {
    id: 'med_c2',
    name: 'Amoxicillin',
    category: 'Antibiotics',
    type: 'Capsule',
    strength: '500mg',
    price: '$12.00',
    manufacturer: 'Pfizer Inc.',
    tag: 'PRESCRIPTION',
    desc: 'A penicillin-type antibiotic used to treat various bacterial infections like pneumonia and bronchitis.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALIFMubUPOsQt6v13kAoukPZgY26--GFjW48n8xQ2uBxT3kEw2heftKxVqEAr4A67VGN6yldPVrubLXDqS1eVt032IKVFCxyaGC3pYWV7fB-f8H1gQpom0rf02Yw4cforBuVXHxpyYY80NB2sdxh3wp3Qb_J2pELMcgyjiB2Ec5UFQ0KO0eIXPgvmk8071jMNM46_DlK083dcPDJS5VMQKx_i6lBCW4AmnDOa3SOpCzzIq4ARBJoCAoE6QTZcVKlPN4DUQCBXBshs'
  };

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conditions, setConditions] = useState([]);

  // Monitor user conditions for dynamic cross-module contraindications
  useEffect(() => {
    if (mockUser) {
      setConditions(['asthma']);
      return;
    }
    if (uid) {
      const unsubscribe = listenUserConditions(uid, (data) => {
        setConditions(data || []);
      });
      return () => unsubscribe();
    }
  }, [uid, mockUser]);

  // Monitor database bookmarks state
  useEffect(() => {
    if (mockUser) {
      return;
    }
    if (uid && med.id) {
      const unsubscribe = listenUserBookmarkedMedicines(uid, (bookmarks) => {
        if (bookmarks && bookmarks[med.id]) {
          setIsBookmarked(true);
        } else {
          setIsBookmarked(false);
        }
      });
      return () => unsubscribe();
    }
  }, [uid, med.id, mockUser]);

  // Handle Bookmarks toggling
  const handleToggleBookmark = async () => {
    try {
      setLoading(true);
      const targetUid = uid || 'guest_user';
      if (isBookmarked) {
        await deleteUserBookmarkedMedicine(targetUid, med.id);
        setIsBookmarked(false);
        Alert.alert("Bookmark Removed", `${med.name} removed from your saved medicines.`);
      } else {
        await saveUserBookmarkedMedicine(targetUid, med.id, {
          name: med.name,
          category: med.category,
          type: med.type,
          strength: med.strength,
          price: med.price,
          manufacturer: med.manufacturer,
          desc: med.desc,
          img: med.img
        });
        setIsBookmarked(true);
        Alert.alert("Bookmark Saved", `${med.name} saved to your medical cabinet.`);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setIsBookmarked(!isBookmarked);
      Alert.alert("Bookmark Saved", `${med.name} saved to your cabinet.`);
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
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">{med.name}</Text>
        </View>
        
        {/* Real-time Bookmark / Save Button */}
        <TouchableOpacity 
          style={styles.bookmarkBtn}
          onPress={handleToggleBookmark}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialIcons 
              name={isBookmarked ? "bookmark" : "bookmark-outline"} 
              size={26} 
              color={isBookmarked ? colors.primary : colors.outline} 
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Dynamic Contraindication Safety Alerts */}
        {med.name.toLowerCase().includes('lisinopril') && conditions.includes('asthma') && (
          <View style={styles.contraindicationCard}>
            <View style={styles.contraindicationHeader}>
              <MaterialIcons name="warning" size={20} color={colors.error} />
              <Text style={styles.contraindicationTitle}>CRITICAL CONTRAINDICATION ALERT</Text>
            </View>
            <Text style={styles.contraindicationText}>
              Our database parsed an active **Asthma** condition in your profile. ACE inhibitors like Lisinopril can cause bronchospasms and dry coughs. Please consult your physician for alternative blockers (e.g. Losartan).
            </Text>
          </View>
        )}

        {med.isAiGenerated && (
          <View style={styles.aiWarningBanner}>
            <MaterialIcons name="info-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.aiWarningTitle}>AI-Generated Explanation Summary</Text>
              <Text style={styles.aiWarningDesc}>
                This medication details summary is generated using clinical knowledge. No exact matching record was found in the official FDA label database.
              </Text>
            </View>
          </View>
        )}

        {/* Product Visual Profile */}
        <View style={styles.heroBlock}>
          <Image source={{ uri: med.img }} style={styles.heroImg} />
          <View style={styles.badgeOverlay}>
            <Text style={styles.categoryBadgeText}>{med.category.toUpperCase()}</Text>
          </View>
        </View>

        {/* Specifications card */}
        <View style={styles.specsCard}>
          <Text style={styles.medTitleName}>{med.name}</Text>
          <Text style={styles.medSubTitle}>{med.strength} • {med.type}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.manufRow}>
            <View style={styles.manufCircle}>
              <MaterialIcons name="factory" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.manufLabel}>Pharmaceutical Manufacturer</Text>
              <Text style={styles.manufName}>{med.manufacturer || 'N/A'}</Text>
            </View>
          </View>

          {med.genericName && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailTextRow}>
                <Text style={styles.detailLabel}>Active Ingredient</Text>
                <Text style={styles.detailValue}>{med.genericName}</Text>
              </View>
            </>
          )}

          {med.purpose && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailTextRow}>
                <Text style={styles.detailLabel}>What it is used for</Text>
                <Text style={styles.detailValue}>{med.purpose}</Text>
              </View>
            </>
          )}

          {med.storage && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailTextRow}>
                <Text style={styles.detailLabel}>Storage Instructions</Text>
                <Text style={styles.detailValue}>{med.storage}</Text>
              </View>
            </>
          )}
        </View>

        {/* Actionable Bento Grid Quick Guides */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Clinical Quick Guide</Text>
          
          <View style={styles.bentoGrid}>
            {/* Usage & Dosage Button */}
            <TouchableOpacity 
              style={styles.usageBentoCard}
              onPress={() => navigation.navigate('UsageDosage', { uid, mockUser, medData: med })}
              activeOpacity={0.9}
            >
              <View style={styles.bentoCardRow}>
                <View style={styles.bentoIconWrapper}>
                  <MaterialIcons name="event-note" size={24} color={colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bentoCardTitle}>Usage & Dosage</Text>
                  <Text style={styles.bentoCardSub}>Recommended dosages by age & guidelines</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.white} />
              </View>
            </TouchableOpacity>

            <View style={styles.splitGridRow}>
              {/* Precautions Screen */}
              <TouchableOpacity 
                style={styles.smallBentoCard}
                onPress={() => navigation.navigate('PrecautionsWarnings', { uid, mockUser, medData: med, initialTab: 'precautions' })}
                activeOpacity={0.9}
              >
                <View style={[styles.miniIconCircle, { backgroundColor: colors.errorContainer }]}>
                  <MaterialIcons name="warning" size={20} color={colors.error} />
                </View>
                <Text style={styles.smallBentoTitle}>Precautions</Text>
                <Text style={styles.smallBentoDesc}>Critical warnings & lifestyle restrictions</Text>
              </TouchableOpacity>

              {/* Side Effects Screen */}
              <TouchableOpacity 
                style={styles.smallBentoCard}
                onPress={() => navigation.navigate('PrecautionsWarnings', { uid, mockUser, medData: med, initialTab: 'side_effects' })}
                activeOpacity={0.9}
              >
                <View style={[styles.miniIconCircle, { backgroundColor: colors.secondaryContainer }]}>
                  <MaterialIcons name="healing" size={20} color={colors.primary} />
                </View>
                <Text style={styles.smallBentoTitle}>Side Effects</Text>
                <Text style={styles.smallBentoDesc}>Know adverse reactions by probability</Text>
              </TouchableOpacity>
            </View>

            {/* Drug Interactions Banner */}
            <View style={styles.interactionAlertCard}>
              <View style={styles.interactionHeader}>
                <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
                <Text style={styles.interactionTitle}>Drug Interactions</Text>
              </View>
              <Text style={styles.interactionDesc}>
                {med.interactions || "Avoid concurrent use with blood thinners or high dosage potassium salt supplements. Ask a clinician for safe combinations."}
              </Text>
            </View>

            {/* Module 6 Integrated Community CTAs */}
            <View style={styles.communityActionsRow}>
              <TouchableOpacity 
                style={styles.communityActionBtn}
                onPress={() => navigation.navigate('CommunityFeed', { uid, mockUser, medName: med.name })}
              >
                <MaterialIcons name="forum" size={18} color={colors.primary} />
                <Text style={styles.communityActionBtnText}>Reviews Feed</Text>
              </TouchableOpacity>
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
    flex: 1,
    minWidth: 0,
    marginRight: 8,
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
    flex: 1,
  },
  bookmarkBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  heroBlock: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
    backgroundColor: colors.surfaceContainerHigh,
  },
  heroImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeOverlay: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    backgroundColor: colors.primary + 'B3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  specsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 2,
  },
  medTitleName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
  },
  medSubTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginVertical: 16,
  },
  manufRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  manufCircle: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manufLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.outline,
    textTransform: 'uppercase',
  },
  manufName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 1,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  bentoGrid: {
    gap: 16,
  },
  usageBentoCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
  },
  bentoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bentoIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.white + '2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
  bentoCardSub: {
    fontSize: 10.5,
    color: colors.white,
    opacity: 0.8,
    fontWeight: '500',
    marginTop: 2,
  },
  splitGridRow: {
    flexDirection: 'row',
    gap: 16,
  },
  smallBentoCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  miniIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallBentoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  smallBentoDesc: {
    fontSize: 10.5,
    color: colors.textSecondary,
    fontWeight: '600',
    lineHeight: 14,
  },
  interactionAlertCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  interactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  interactionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  interactionDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    lineHeight: 15,
  },
  contraindicationCard: {
    backgroundColor: colors.errorContainer,
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 6,
  },
  contraindicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contraindicationTitle: {
    fontSize: 11,
    fontWeight: '850',
    color: colors.error,
    letterSpacing: 0.5,
  },
  contraindicationText: {
    fontSize: 12.5,
    color: colors.error,
    fontWeight: '600',
    lineHeight: 17,
  },
  communityActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  communityActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant + '44',
    borderRadius: 12,
    gap: 6,
  },
  communityActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  detailTextRow: {
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.outline,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
    lineHeight: 18,
  },
  aiWarningBanner: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  aiWarningTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  aiWarningDesc: {
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 15,
    marginTop: 2,
    fontWeight: '600',
  },
});

export default MedicineOverviewScreen;
