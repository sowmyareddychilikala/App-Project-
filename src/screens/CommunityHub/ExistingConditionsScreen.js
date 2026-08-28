import React, { useState, useEffect } from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
   
  ScrollView, 
  TextInput, 
  Platform, 
  StatusBar,
  Dimensions,
  Switch,
  Alert,
  ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { 
  saveUserConditions, 
  listenUserConditions 
} from '../../services/dbService';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const ExistingConditionsScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;

  const commonConditions = [
    { id: 'hypertension', name: 'Hypertension', desc: 'High blood pressure management', icon: 'favorite', iconColor: colors.error },
    { id: 'diabetes', name: 'Type 2 Diabetes', desc: 'Blood sugar monitoring & insulin', icon: 'opacity', iconColor: '#e67e22' },
    { id: 'asthma', name: 'Asthma', desc: 'Respiratory inhalers & chronic spasms', icon: 'air', iconColor: colors.secondary },
    { id: 'copd', name: 'COPD', desc: 'Chronic obstructive pulmonary issues', icon: 'air', iconColor: colors.primary },
    { id: 'anxiety', name: 'Anxiety Disorder', desc: 'Mental health support & guidance', icon: 'psychology', iconColor: colors.outline }
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Load user profile conditions
  useEffect(() => {
    if (mockUser || !uid) {
      setSelectedConditions(['asthma']);
      setLoading(false);
      return;
    }
    const unsubscribe = listenUserConditions(uid, (data) => {
      setSelectedConditions(data || []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [uid, mockUser]);

  // Toggle checklist selection
  const handleToggleCondition = async (condId) => {
    let nextConditions = [...selectedConditions];
    if (selectedConditions.includes(condId)) {
      nextConditions = nextConditions.filter(id => id !== condId);
    } else {
      nextConditions.push(condId);
    }
    setSelectedConditions(nextConditions);

    // Save to Firebase RTDB in real-time
    if (mockUser) {
      return;
    }
    try {
      setSyncing(true);
      await saveUserConditions(uid, nextConditions);
      setSyncing(false);
    } catch (err) {
      setSyncing(false);
      Alert.alert("Sync Error", "Failed to update health profile conditions.");
    }
  };

  // Filter conditions by query
  const filteredConditions = commonConditions.filter(cond => 
    cond.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cond.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Health Profile...</Text>
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
          <Text style={styles.headerTitle}>Health Profile</Text>
        </View>
        <View style={styles.cloudBadge}>
          {syncing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <View style={[styles.greenActiveDot, { backgroundColor: '#2ecc71' }]} />
              <Text style={styles.cloudBadgeText}>Profile Synced</Text>
            </>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Hero Branding Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Your Health Profile</Text>
          <Text style={styles.heroDesc}>
            Keeping track of your existing chronic conditions helps MediGuard customize your drug safety metrics and alerts.
          </Text>
          <View style={styles.abstractBlob} />
        </View>

        {/* Sticky Search bar */}
        <View style={styles.searchBlock}>
          <MaterialIcons name="search" size={20} color={colors.outline} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search conditions (e.g. Asthma, Diabetes)..."
            placeholderTextColor={colors.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Active Tags row */}
        {selectedConditions.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsLabel}>ACTIVE CONDITIONS:</Text>
            <View style={styles.tagsRow}>
              {selectedConditions.map((id) => {
                const match = commonConditions.find(c => c.id === id);
                if (!match) return null;
                return (
                  <View key={id} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{match.name}</Text>
                    <TouchableOpacity onPress={() => handleToggleCondition(id)}>
                      <MaterialIcons name="close" size={14} color={colors.secondary} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* List of common suggest conditions */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Suggested & Common</Text>
          <View style={styles.conditionsStack}>
            {filteredConditions.map((cond) => {
              const active = selectedConditions.includes(cond.id);
              return (
                <TouchableOpacity 
                  key={cond.id}
                  style={[styles.condCard, active && styles.condCardActive]}
                  onPress={() => handleToggleCondition(cond.id)}
                  activeOpacity={0.9}
                >
                  <View style={styles.condLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: cond.iconColor + '1A' }]}>
                      <MaterialIcons name={cond.icon} size={22} color={cond.iconColor} />
                    </View>
                    <View>
                      <Text style={styles.condName}>{cond.name}</Text>
                      <Text style={styles.condDesc}>{cond.desc}</Text>
                    </View>
                  </View>

                  <Switch 
                    value={active}
                    onValueChange={() => handleToggleCondition(cond.id)}
                    trackColor={{ false: colors.outlineVariant, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Medical Privacy Disclaimer */}
        <View style={styles.disclaimerCard}>
          <MaterialIcons name="info" size={20} color={colors.primary} />
          <Text style={styles.disclaimerText}>
            The selected data is encrypted locally and used solely to tailor cross-module contraindication warning logs. It is never shared with third-party networks.
          </Text>
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
  cloudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  greenActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cloudBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  heroSection: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.white,
    zIndex: 10,
  },
  heroDesc: {
    fontSize: 12.5,
    color: colors.white,
    opacity: 0.9,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 6,
    zIndex: 10,
    maxWidth: '85%',
  },
  abstractBlob: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.secondaryContainer,
    opacity: 0.15,
  },
  searchBlock: {
    position: 'relative',
    marginBottom: 20,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 14,
    zIndex: 10,
  },
  searchInput: {
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 14,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  tagsContainer: {
    marginBottom: 24,
  },
  tagsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.outline,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryContainer + '1D',
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },
  tagChipText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.secondary,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  conditionsStack: {
    gap: 12,
  },
  condCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 1,
  },
  condCardActive: {
    borderColor: colors.primary,
  },
  condLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  condName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.text,
  },
  condDesc: {
    fontSize: 11,
    color: colors.outline,
    fontWeight: '600',
    marginTop: 2,
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant + '4D',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 15,
  }
});

export default ExistingConditionsScreen;
