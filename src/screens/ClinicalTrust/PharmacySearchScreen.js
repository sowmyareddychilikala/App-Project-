import React, { useState } from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Image, 
  Platform, 
  StatusBar,
  Switch,
  Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const PharmacySearchScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;

  const [searchQuery, setSearchQuery] = useState('');
  const [nearMe, setNearMe] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [delivery, setDelivery] = useState(false);

  const recentSearches = [
    { name: 'City Care Pharmacy', location: 'North Manhattan, NY' },
    { name: 'HealthWay Clinic', location: '2.4 miles away • Bronx' },
    { name: 'MediQuick 24/7', location: 'Recently viewed' }
  ];

  const handleSearchSubmit = () => {
    navigation.navigate('SelectPharmacy', { 
      uid, 
      mockUser, 
      query: searchQuery.trim(),
      nearMe,
      verifiedOnly,
      openNow,
      delivery
    });
  };

  const handleRecentClick = (name) => {
    navigation.navigate('SelectPharmacy', { 
      uid, 
      mockUser, 
      query: name,
      nearMe,
      verifiedOnly,
      openNow,
      delivery
    });
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Top Header App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity 
            style={styles.headerBackBtn}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PharmaVerify</Text>
        </View>
        <TouchableOpacity style={styles.avatarMini} onPress={() => navigation.navigate('Dashboard', { screen: 'profile' })}>
          <MaterialIcons name="account-circle" size={26} color={colors.outline} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Search Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Find a Pharmacy</Text>
          <Text style={styles.heroSubtitle}>Verify authenticity and check local availability.</Text>
          
          <View style={styles.searchBlock}>
            <MaterialIcons name="search" size={20} color={colors.outline} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search pharmacy name or location"
              placeholderTextColor={colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
          </View>

          {/* Near Me Toggle */}
          <View style={styles.nearMeCard}>
            <View style={styles.nearMeLeft}>
              <MaterialIcons name="my-location" size={22} color={colors.primary} />
              <Text style={styles.nearMeText}>Find pharmacies near me</Text>
            </View>
            <Switch
              value={nearMe}
              onValueChange={setNearMe}
              trackColor={{ false: colors.outlineVariant, true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : nearMe ? colors.primaryContainer : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Quick Filters */}
        <View style={styles.sectionBlock}>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            <TouchableOpacity 
              style={[styles.filterChip, verifiedOnly && styles.filterChipActive]}
              onPress={() => setVerifiedOnly(!verifiedOnly)}
            >
              <MaterialIcons name="verified" size={16} color={verifiedOnly ? colors.white : colors.secondary} />
              <Text style={[styles.filterChipText, verifiedOnly && styles.filterChipTextActive]}>Verified Only</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterChip, openNow && styles.filterChipActive]}
              onPress={() => setOpenNow(!openNow)}
            >
              <MaterialIcons name="schedule" size={16} color={openNow ? colors.white : colors.textSecondary} />
              <Text style={[styles.filterChipText, openNow && styles.filterChipTextActive]}>Open Now</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterChip, delivery && styles.filterChipActive]}
              onPress={() => setDelivery(!delivery)}
            >
              <MaterialIcons name="local-shipping" size={16} color={delivery ? colors.white : colors.textSecondary} />
              <Text style={[styles.filterChipText, delivery && styles.filterChipTextActive]}>Delivery</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Recent Searches */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={() => Alert.alert("History Cleared", "Recent search history cleared.")}>
              <Text style={styles.clearAllText}>Clear all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recentList}>
            {recentSearches.map((item, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.recentRow, idx > 0 && styles.rowBorder]}
                onPress={() => handleRecentClick(item.name)}
              >
                <View style={styles.recentLeft}>
                  <MaterialIcons name="history" size={20} color={colors.outline} />
                  <View>
                    <Text style={styles.recentName}>{item.name}</Text>
                    <Text style={styles.recentMeta}>{item.location}</Text>
                  </View>
                </View>
                <MaterialIcons name="north-west" size={18} color={colors.outline} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Map Section (Bento Grid Style) */}
        <View style={styles.bentoContainer}>
          <TouchableOpacity 
            style={styles.mapCard}
            onPress={() => navigation.navigate('SelectPharmacy', { uid, mockUser, query: '' })}
          >
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6f8TibISkc_YJY5_zVcNVQXy3G0gsy2eKpy8VqfA5Sqx1i8xljcn7GrRxEZAyyjuhgdztsPjATBNtJAew7RFSJDEat53XLFViGjf4IpylrlBYSPYfmurNj6sIVLrDfCeFVnwm-yUBBtuG1ybbyBXwRR_7XGHJQHwrXCO9hx9Kec47FQNWb5LMaPRYAyfTPwAjgoIVnttnO_bgRcwa1Yy3kbnfFayta2T6EgluAR8bpU8DEoo_VltwjP0QWaIO3nnsacUsL7c18Ws' }} 
              style={styles.mapImage}
            />
            <View style={styles.mapOverlay}>
              <MaterialIcons name="map" size={18} color={colors.white} />
              <Text style={styles.mapOverlayText}>Explore Interactive Map</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.networkCard}>
            <View style={styles.networkIconWrapper}>
              <MaterialIcons name="health-and-safety" size={24} color={colors.primary} />
            </View>
            <Text style={styles.networkTitle}>Verified Networks</Text>
            <Text style={styles.networkDesc}>Connect only with certified pharmaceutical distributors.</Text>
            <TouchableOpacity onPress={() => Alert.alert("Verification Standards", "Our trust criteria include sourcing authentication (40%), customer compliance audits (30%), and facility regulatory checks (30%).")}>
              <Text style={styles.networkLink}>View standards →</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Module navigation buttons */}
        <View style={styles.historyNavRow}>
          <TouchableOpacity 
            style={styles.complaintHistoryBtn}
            onPress={() => navigation.navigate('ComplaintHistory', { uid, mockUser })}
          >
            <MaterialIcons name="assignment" size={20} color={colors.primary} />
            <Text style={styles.complaintHistoryBtnText}>View My Complaint Logs</Text>
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
  heroSection: {
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  searchBlock: {
    position: 'relative',
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 14,
    zIndex: 1,
  },
  searchInput: {
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  nearMeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.primaryFixed,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryFixedDim,
  },
  nearMeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nearMeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  chipsScroll: {
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: colors.white,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '850',
    color: colors.primary,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  recentList: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 16,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant + '33',
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  recentMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bentoContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  mapCard: {
    flex: 1,
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  mapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mapOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 6,
  },
  mapOverlayText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  networkCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 16,
    justifyContent: 'space-between',
  },
  networkIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  networkTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  networkDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 14,
    marginVertical: 4,
  },
  networkLink: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '800',
    marginTop: 4,
  },
  historyNavRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  complaintHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  complaintHistoryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  }
});

export default PharmacySearchScreen;
