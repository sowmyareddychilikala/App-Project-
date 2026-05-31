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
  ActivityIndicator,
  Alert
} from 'react-native';
import { colors } from '../../theme/colors';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { listenAllMedicineReviews } from '../../services/dbService';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const CommunityFeedScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;

  // Selected category: 'All' | 'Cardiological' | 'Respiratory' | 'Neurological' | 'General'
  const [activeCategory, setActiveCategory] = useState('All');
  const [dbReviews, setDbReviews] = useState({});
  const [loading, setLoading] = useState(true);

  // Static clinician and default patient logs for initial high fidelity
  const staticFeed = [
    {
      id: 'feed_1',
      sender: 'Dr. Sarah Johnson',
      role: 'CLINICAL CARDIOLOGIST',
      verified: true,
      category: 'Cardiological',
      title: 'Important Note on ACE Inhibitors & Hydration',
      text: 'For patients taking blood pressure medications like Lisinopril, maintaining proper daily fluid balance is key. Dehydration excessively lowers blood pressure, leading to vertigo or fainting. Stay hydrated!',
      stars: 5,
      likes: 42,
      timestamp: '2h ago'
    },
    {
      id: 'feed_2',
      sender: 'Anonymous Patient',
      role: 'DIABETES TYPE 2 RECORD',
      verified: false,
      category: 'General',
      title: 'Metformin Toleration Experience',
      text: 'Taking Metformin strictly with my breakfast significantly reduced initial stomach irritation. The body seems to adapt well after the first 2 weeks. Consistent adherence pays off.',
      stars: 4,
      likes: 18,
      timestamp: '1 day ago'
    }
  ];

  // Load reviews from RTDB
  useEffect(() => {
    if (mockUser) {
      setLoading(false);
      return;
    }
    if (uid) {
      const unsubscribe = listenAllMedicineReviews((data) => {
        setDbReviews(data || {});
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [uid, mockUser]);

  // Flatten and parse reviews from Firebase RTDB
  const parsedDbReviews = [];
  Object.keys(dbReviews).forEach(medId => {
    const medGroup = dbReviews[medId];
    Object.keys(medGroup).forEach(revId => {
      const r = medGroup[revId];
      parsedDbReviews.push({
        id: r.id,
        sender: 'Verified Patient',
        role: `TREATMENT LOG • ${r.medicineName || 'Medication'}`,
        verified: false,
        category: r.category || 'General',
        title: r.title,
        text: r.comment,
        stars: r.rating || 5,
        likes: 0,
        timestamp: 'Just Now'
      });
    });
  });

  // Combine static and user contributed posts
  const combinedFeed = [...parsedDbReviews, ...staticFeed];

  // Filter feed by category
  const filteredFeed = activeCategory === 'All' 
    ? combinedFeed 
    : combinedFeed.filter(post => post.category === activeCategory);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Connecting to Community Feed...</Text>
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
            onPress={() => navigation.replace('Dashboard')}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Community Hub</Text>
        </View>
        <TouchableOpacity 
          style={styles.headerAnalyticsBtn}
          onPress={() => navigation.navigate('SideEffectAnalytics', { uid, mockUser })}
        >
          <MaterialIcons name="insights" size={22} color={colors.primary} />
          <Text style={styles.analyticsBtnLabel}>Analytics</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Category selection slider */}
        <View style={styles.sliderBlock}>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {['All', 'Cardiological', 'Respiratory', 'Neurological', 'General'].map((cat) => {
              const active = activeCategory === cat;
              return (
                <TouchableOpacity 
                  key={cat}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Quick Report & Reviews Buttons Row */}
        <View style={styles.quickWriteBlock}>
          <TouchableOpacity 
            style={styles.writeActionBtn}
            onPress={() => navigation.navigate('WriteReview', { uid, mockUser })}
          >
            <MaterialIcons name="rate-review" size={20} color={colors.primary} />
            <Text style={styles.writeActionBtnLabel}>Write Product Review</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.writeActionBtn, { borderColor: colors.error }]}
            onPress={() => navigation.navigate('ReportSideEffect', { uid, mockUser })}
          >
            <MaterialIcons name="report-problem" size={20} color={colors.error} />
            <Text style={[styles.writeActionBtnLabel, { color: colors.error }]}>Report Side Effect</Text>
          </TouchableOpacity>
        </View>

        {/* Community Feed Stack */}
        <View style={styles.feedBlock}>
          <Text style={styles.feedHeading}>Safety Experiences Stream</Text>
          
          <View style={styles.feedStack}>
            {filteredFeed.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.outlineVariant} />
                <Text style={styles.emptyText}>No experiences shared in this category yet.</Text>
              </View>
            ) : (
              filteredFeed.map((post) => (
                <View key={post.id} style={styles.feedCard}>
                  {/* Card Header Profile */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>{post.sender.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.senderRow}>
                        <Text style={styles.senderName}>{post.sender}</Text>
                        {post.verified && (
                          <MaterialIcons name="verified" size={16} color={colors.secondary} />
                        )}
                      </View>
                      <Text style={styles.senderRole}>{post.role}</Text>
                    </View>
                    <Text style={styles.timeText}>{post.timestamp}</Text>
                  </View>

                  {/* Rating Stars if Patient Post */}
                  {post.stars > 0 && (
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <MaterialIcons 
                          key={s} 
                          name={s <= post.stars ? "star" : "star-outline"} 
                          size={16} 
                          color="#f1c40f" 
                        />
                      ))}
                    </View>
                  )}

                  {/* Post Content */}
                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.postText}>{post.text}</Text>

                  {/* Actions Row */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.likeBtn} onPress={() => Alert.alert("Liked Post", "Thank you for validating this patient safety report.")}>
                      <MaterialIcons name="thumb-up" size={16} color={colors.outline} />
                      <Text style={styles.likeText}>{post.likes || 0} Helpful</Text>
                    </TouchableOpacity>
                    <View style={styles.categoryChip}>
                      <Text style={styles.categoryChipText}>{post.category.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
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
    justifyContainer: 'center',
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
  headerAnalyticsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  analyticsBtnLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  sliderBlock: {
    marginBottom: 20,
  },
  chipsScroll: {
    gap: 8,
  },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  quickWriteBlock: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  writeActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 12,
    gap: 8,
  },
  writeActionBtnLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  feedBlock: {
    marginBottom: 16,
  },
  feedHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  feedStack: {
    gap: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.outline,
    fontWeight: '600',
    textAlign: 'center',
  },
  feedCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  senderName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.primary,
  },
  senderRole: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.outline,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  timeText: {
    fontSize: 11,
    color: colors.outline,
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primary,
    lineHeight: 20,
    marginBottom: 6,
  },
  postText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.outline,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.secondaryContainer + '1E',
    borderRadius: 4,
  },
  categoryChipText: {
    fontSize: 9,
    fontWeight: '850',
    color: colors.secondary,
    letterSpacing: 0.5,
  }
});

export default CommunityFeedScreen;
