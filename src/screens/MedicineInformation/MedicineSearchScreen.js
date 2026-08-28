import React, { useState, useEffect } from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Image, 
  Platform, 
  StatusBar,
  Alert,
  Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { 
  getRecentSearches, 
  saveRecentSearch, 
  removeRecentSearch, 
  clearRecentSearches, 
  getLiveSuggestions 
} from '../../services/medicineService';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const MedicineSearchScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;

  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    getRecentSearches().then(list => setRecentSearches(list || []));
  }, []);

  const handleQueryChange = (text) => {
    setSearchQuery(text);
    setSuggestions(getLiveSuggestions(text));
  };

  const handleSearchSubmit = async (queryToRun) => {
    const q = (queryToRun || searchQuery).trim();
    if (!q) return;
    const updatedRecent = await saveRecentSearch(q);
    if (updatedRecent) setRecentSearches(updatedRecent);
    navigation.navigate('SearchResults', { uid, mockUser, query: q });
  };

  const handleRemoveRecent = async (item) => {
    const updated = await removeRecentSearch(item);
    setRecentSearches(updated);
  };

  const handleClearAll = async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  };

  const trendingMeds = [
    {
      id: 'med_c1',
      name: 'Ibuprofen Complex',
      category: 'Pain Relief',
      type: 'Capsule',
      strength: '400mg',
      desc: 'Fast acting relief for intense pain.',
      manufacturer: 'BioPharma Core',
      tag: 'MOST VIEWED',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3pC0fKopLrSH4oHYKcDv6dxiJEDG1OKKy9octvd4VvsIOmjk03XUD1bkEaBbZMgsFjZg48O7lxGCLIyF4nsuxzhJT-GFHMpMmIaVvGQ3QnJfHKf8Taf-vJR9cugvtP1GdqFsX3SiHUGz8h6f68ockg1uyLL1fqTU_5YVwAbwW89qKY6h95EP2xyqIVo78hd0i94gNwivuM7YCZwg1yho01xn_Epwm-9SZmEPyMPvLZEkXf2PYlIwV76K1LjyctX2xJsx8UGhl80Y'
    },
    {
      id: 'med_c2',
      name: 'Vitamin C Plus',
      category: 'Vitamins',
      type: 'Tablet',
      strength: '1000mg',
      desc: 'High potency immunity booster.',
      manufacturer: 'NatureLabs Inc.',
      tag: 'DAILY SUPPORT',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAiRrEdP4f-iR11_-4fUxl-ZVeMNt8RKPjNusvWNc-7EuHsbbADShmZBzZymtzRBWXPq5pW9M3tev51Iw_XBKtHIo61MwmLP6kdIivSUNji895gwBQR6fClw3Z_MURCVP_eiWfWI75V9yy_GfDxfEI46D-_uyhMOqBfkiMPKUdYK-6c5mWhsW0AyIyQqbSmn1IUbhXjc9m9mQIfyB1xVF7yfsehIiSRCyWe0J5PV9I6YzbtU_K3ns4hKTAuP4sJ1-6vEpzmteKMg-8'
    },
    {
      id: 'med_c3',
      name: 'Acid Relief Syrup',
      category: 'Digestion',
      type: 'Syrup',
      strength: '150ml',
      desc: 'Rapid stomach acid neutralizer.',
      manufacturer: 'Bayer Pharmaceuticals',
      tag: 'SOOTHING',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBs-v6RItF9zzDrCGLQgkF8XhvdTAPgy2pYCQr1CMJeTwVakKnPYTSOaQkLjMoS94-4QinJa37zaE-nh77jaHtSodgZMlqI2a3aFutPuxyxjC8SrQV5jGSigzRQmGqzV3OUAp33OWREreIOxF1-nvwYoU9kjCQiG8BDyfEozRvyCWu-WAE9JxnnI0RQDvV9lVdBeFDypwAyotDr6AutjivWT0jlypdnJsy9bqd4D6kvKsOPocynwDRtmPOQlVpHPwv_tFOoBfxI3I'
    }
  ];

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
          <Text style={styles.headerTitle}>MedInfo Portal</Text>
        </View>
        <TouchableOpacity style={styles.avatarMini}>
          <MaterialIcons name="account-circle" size={26} color={colors.outline} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Prominent Search Input Box */}
        <View style={styles.searchBlock}>
          <MaterialIcons name="search" size={20} color={colors.outline} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search medicine, brand, or condition..."
            placeholderTextColor={colors.outline}
            value={searchQuery}
            onChangeText={handleQueryChange}
            onSubmitEditing={() => handleSearchSubmit()}
            returnKeyType="search"
            numberOfLines={1}
          />
          {searchQuery.trim().length > 0 && (
            <TouchableOpacity onPress={() => handleQueryChange('')}>
              <MaterialIcons name="close" size={18} color={colors.outline} />
            </TouchableOpacity>
          )}
        </View>

        {/* Live Search Auto-Suggestions as User Types */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsCard}>
            <Text style={styles.suggestionsHeader}>Suggestions</Text>
            {suggestions.map((sug, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={styles.suggestionRowItem}
                onPress={() => handleSearchSubmit(sug)}
              >
                <MaterialIcons name="search" size={18} color={colors.primary} />
                <Text style={styles.suggestionRowText}>{sug}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Categories Chips Row */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>Categories</Text>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            <TouchableOpacity style={styles.chipActive}><Text style={styles.chipTextActive}>All</Text></TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => handleSearchSubmit('Pain Relief')}><Text style={styles.chipText}>Pain Relief</Text></TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => handleSearchSubmit('Antibiotics')}><Text style={styles.chipText}>Antibiotics</Text></TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => handleSearchSubmit('Vitamins')}><Text style={styles.chipText}>Vitamins</Text></TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => handleSearchSubmit('Allergy')}><Text style={styles.chipText}>Allergy</Text></TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => handleSearchSubmit('Digestion')}><Text style={styles.chipText}>Digestion</Text></TouchableOpacity>
          </ScrollView>
        </View>

        {/* Recent Searches feeds */}
        {recentSearches.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={handleClearAll}><Text style={styles.clearAllText}>Clear All</Text></TouchableOpacity>
            </View>
            <View style={styles.searchesStack}>
              {recentSearches.map((search, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.searchRow}
                  onPress={() => handleSearchSubmit(search)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <MaterialIcons name="history" size={20} color={colors.outline} />
                    <Text style={styles.searchRowText}>{search}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveRecent(search)}>
                    <MaterialIcons name="close" size={16} color={colors.outline} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Trending Bento Grid cards */}
        <View style={[styles.sectionBlock, { marginBottom: 32 }]}>
          <Text style={styles.sectionTitle}>Trending Medicines</Text>
          
          <View style={styles.trendingGrid}>
            {/* Main Asymmetric Bento Card */}
            <TouchableOpacity 
              style={styles.heroTrendingCard}
              onPress={() => navigation.navigate('MedicineOverview', { uid, mockUser, medData: trendingMeds[0] })}
            >
              <View style={styles.heroTrendingLeft}>
                <Text style={styles.heroTrendingBadge}>{trendingMeds[0].tag}</Text>
                <Text style={styles.heroTrendingName}>{trendingMeds[0].name}</Text>
                <Text style={styles.heroTrendingDesc}>{trendingMeds[0].desc}</Text>
              </View>
              <Image source={{ uri: trendingMeds[0].img }} style={styles.heroTrendingImg} />
            </TouchableOpacity>

            <View style={styles.smallCardsRow}>
              {/* Card 1 */}
              <TouchableOpacity 
                style={styles.smallTrendingCard}
                onPress={() => navigation.navigate('MedicineOverview', { uid, mockUser, medData: trendingMeds[1] })}
              >
                <Image source={{ uri: trendingMeds[1].img }} style={styles.smallCardImg} />
                <View style={styles.smallCardContent}>
                  <Text style={styles.smallCardName}>{trendingMeds[1].name}</Text>
                  <Text style={styles.smallCardCategory}>{trendingMeds[1].category}</Text>
                </View>
              </TouchableOpacity>

              {/* Card 2 */}
              <TouchableOpacity 
                style={styles.smallTrendingCard}
                onPress={() => navigation.navigate('MedicineOverview', { uid, mockUser, medData: trendingMeds[2] })}
              >
                <Image source={{ uri: trendingMeds[2].img }} style={styles.smallCardImg} />
                <View style={styles.smallCardContent}>
                  <Text style={styles.smallCardName}>{trendingMeds[2].name}</Text>
                  <Text style={styles.smallCardCategory}>{trendingMeds[2].category}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer tab controls */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive}>
          <MaterialIcons name="search" size={22} color={colors.primary} />
          <Text style={styles.navTextActive}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => Alert.alert("Clinical Saved Items", "Bookmark system is loading in next medical update.")}
        >
          <MaterialIcons name="bookmark-outline" size={22} color={colors.outline} />
          <Text style={styles.navText}>Saved</Text>
        </TouchableOpacity>


      </View>
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
    paddingBottom: 90,
  },
  searchBlock: {
    position: 'relative',
    marginBottom: 24,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 14,
  },
  searchInput: {
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  chipsScroll: {
    gap: 8,
  },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    height: 36,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  chipTextActive: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '800',
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
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  searchesStack: {
    gap: 4,
  },
  searchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4D',
  },
  searchRowText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
  },
  trendingGrid: {
    gap: 16,
    marginTop: 16,
  },
  heroTrendingCard: {
    height: 140,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  heroTrendingLeft: {
    flex: 1.2,
    padding: 16,
    justifyContent: 'center',
  },
  heroTrendingBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroTrendingName: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  heroTrendingDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    lineHeight: 14,
    marginTop: 4,
  },
  heroTrendingImg: {
    flex: 1,
    height: '100%',
    resizeMode: 'cover',
  },
  smallImgContainer: {
    flex: 1,
  },
  smallCardsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  smallTrendingCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    overflow: 'hidden',
  },
  smallCardImg: {
    width: '100%',
    height: 90,
    resizeMode: 'cover',
  },
  smallCardContent: {
    padding: 12,
  },
  smallCardName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  smallCardCategory: {
    fontSize: 10,
    color: colors.outline,
    fontWeight: '600',
    marginTop: 2,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 16 : 0,
  },
  navItem: {
    alignItems: 'center',
  },
  navItemActive: {
    alignItems: 'center',
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  navText: {
    fontSize: 10,
    color: colors.outline,
    fontWeight: '700',
    marginTop: 2,
  },
  navTextActive: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '800',
    marginTop: 2,
  },
  suggestionsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary + '4D',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  suggestionsHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  suggestionRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4D',
  },
  suggestionRowText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
  }
});

export default MedicineSearchScreen;
