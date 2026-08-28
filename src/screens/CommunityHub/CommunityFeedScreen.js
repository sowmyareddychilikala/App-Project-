import React, { useState, useEffect } from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
   
  ScrollView, 
  Platform, 
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { 
  listenAllMedicineReviews, 
  listenSideEffectsReports,
  updateMedicineReview,
  deleteMedicineReview,
  updateSideEffectReport,
  deleteSideEffectReport
} from '../../services/dbService';
import { auth } from '../../../firebaseConfig';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const CommunityFeedScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;
  const targetMedName = params.medName || '';

  // Selected category: 'All' | 'Cardiological' | 'Respiratory' | 'Neurological' | 'General'
  const [activeCategory, setActiveCategory] = useState('All');
  const [dbReviews, setDbReviews] = useState({});
  const [dbSideEffects, setDbSideEffects] = useState({});
  const [loading, setLoading] = useState(true);

  // Edit Modal States
  const [editingPost, setEditingPost] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [editMedName, setEditMedName] = useState('');
  const [editCategory, setEditCategory] = useState('General');
  const [editRating, setEditRating] = useState(5);
  const [editLocation, setEditLocation] = useState('Local Community');
  const [savingEdit, setSavingEdit] = useState(false);

  const activeUid = auth?.currentUser?.uid || uid || 'guest_user';

  const formatDateTime = (rawDate) => {
    if (!rawDate) return '07 Aug 2026 • 07:30 PM';
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return String(rawDate);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedHours = hours.toString().padStart(2, '0');
    return `${day} ${month} ${year} • ${formattedHours}:${minutes} ${ampm}`;
  };

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

  // Load reviews & side effect reports from RTDB and local cache
  useEffect(() => {
    if (mockUser) {
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    const unsubReviews = listenAllMedicineReviews(
      (data) => {
        clearTimeout(timer);
        setDbReviews(data || {});
        setLoading(false);
      },
      () => {
        clearTimeout(timer);
        setLoading(false);
      }
    );

    const unsubEffects = listenSideEffectsReports(
      (data) => {
        setDbSideEffects(data || {});
      }
    );

    return () => {
      clearTimeout(timer);
      if (typeof unsubReviews === 'function') unsubReviews();
      if (typeof unsubEffects === 'function') unsubEffects();
    };
  }, [uid, mockUser]);

  // Flatten and parse reviews from Firebase RTDB & local storage
  const parsedDbReviews = [];
  if (dbReviews && typeof dbReviews === 'object') {
    Object.keys(dbReviews).forEach(medId => {
      const medGroup = dbReviews[medId];
      if (medGroup && typeof medGroup === 'object') {
        Object.keys(medGroup).forEach(revId => {
          const r = medGroup[revId];
          if (r && typeof r === 'object' && (r.comment || r.title || r.medicineName)) {
            parsedDbReviews.push({
              id: r.id || revId,
              medicineId: medId,
              itemType: 'review',
              uid: r.uid || activeUid,
              userName: r.userName || 'Verified Patient',
              sender: r.userName || 'Verified Patient',
              medicineName: r.medicineName || 'Medication',
              reportType: 'Product Review',
              location: r.location || 'Local Community',
              role: `TREATMENT LOG • ${r.medicineName || 'Medication'}`,
              verified: false,
              category: r.category || 'General',
              title: r.title || 'Patient Review',
              text: r.comment || '',
              stars: r.rating || 5,
              likes: r.likes || 0,
              createdAt: r.createdAt,
              timestamp: formatDateTime(r.createdAt || Date.now())
            });
          }
        });
      }
    });
  }

  // Flatten and parse side effect reports from Firebase RTDB & local storage
  const parsedSideEffects = [];
  if (dbSideEffects && typeof dbSideEffects === 'object') {
    Object.keys(dbSideEffects).forEach(repId => {
      const rep = dbSideEffects[repId];
      if (rep && typeof rep === 'object' && (rep.symptom || rep.medicineName)) {
        const severityStars = rep.severity === 'High' ? 1 : rep.severity === 'Moderate' ? 3 : 4;
        parsedSideEffects.push({
          id: rep.id || repId,
          itemType: 'side_effect',
          uid: rep.uid || activeUid,
          userName: rep.userName || 'Verified Patient',
          sender: rep.userName || 'Verified Patient',
          medicineName: rep.medicineName || 'Medication',
          reportType: 'Side Effect Log',
          location: rep.location || 'Local Community',
          role: `ADVERSE REACTION LOG • ${rep.medicineName || 'Medication'}`,
          verified: false,
          category: rep.category || 'General',
          title: `Side Effect: ${rep.symptom || 'Unspecified Symptom'} (${rep.severity || 'Moderate'} Severity)`,
          text: rep.description || `Reported symptom "${rep.symptom}" lasting ${rep.duration || 'N/A'}. Severity level logged as ${rep.severity || 'Moderate'}.`,
          symptom: rep.symptom || '',
          duration: rep.duration || '',
          severity: rep.severity || 'Moderate',
          stars: severityStars,
          likes: rep.likes || 0,
          createdAt: rep.createdAt,
          timestamp: formatDateTime(rep.createdAt || Date.now())
        });
      }
    });
  }

  const handleDeletePost = (post) => {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to permanently delete this report/review from the database?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (post.itemType === 'review') {
                await deleteMedicineReview(post.medicineId, post.id);
              } else if (post.itemType === 'side_effect') {
                await deleteSideEffectReport(post.id);
              }
              Alert.alert("Deleted", "Your submission has been permanently removed.");
            } catch (e) {
              Alert.alert("Error", "Could not delete report. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditTitle(post.title || '');
    setEditText(post.text || '');
    setEditMedName(post.medicineName || '');
    setEditCategory(post.category || 'General');
    setEditRating(post.stars || 5);
    setEditLocation(post.location || 'Local Community');
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    if (!editMedName.trim() || !editTitle.trim() || !editText.trim()) {
      Alert.alert("Input Required", "Please provide a valid medicine name, title, and description.");
      return;
    }

    setSavingEdit(true);
    try {
      if (editingPost.itemType === 'review') {
        await updateMedicineReview(editingPost.medicineId, editingPost.id, {
          title: editTitle.trim(),
          comment: editText.trim(),
          medicineName: editMedName.trim(),
          category: editCategory,
          rating: editRating,
          location: editLocation.trim()
        });
      } else if (editingPost.itemType === 'side_effect') {
        await updateSideEffectReport(editingPost.id, {
          symptom: editTitle.trim(),
          description: editText.trim(),
          medicineName: editMedName.trim(),
          category: editCategory,
          location: editLocation.trim()
        });
      }
      setSavingEdit(false);
      setEditingPost(null);
      Alert.alert("Success", "Your post has been updated successfully.");
    } catch (e) {
      setSavingEdit(false);
      Alert.alert("Error", "Failed to update post. Please try again.");
    }
  };

  // Combine static, user reviews, and side effect reports
  const combinedFeed = [...parsedDbReviews, ...parsedSideEffects, ...staticFeed];

  // Filter feed by medicine name if provided
  const medFilteredFeed = targetMedName
    ? combinedFeed.filter(post => 
        (post.role && post.role.toLowerCase().includes(targetMedName.toLowerCase())) ||
        (post.text && post.text.toLowerCase().includes(targetMedName.toLowerCase())) ||
        (post.title && post.title.toLowerCase().includes(targetMedName.toLowerCase()))
      )
    : combinedFeed;

  // Filter feed by category
  const filteredFeed = activeCategory === 'All' 
    ? medFilteredFeed 
    : medFilteredFeed.filter(post => post.category === activeCategory);

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
            onPress={() => navigation.navigate('Dashboard')}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Community Hub</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Filter Banner */}
        {targetMedName ? (
          <View style={styles.filterBanner}>
            <View style={styles.filterBannerLeft}>
              <MaterialIcons name="filter-list" size={16} color={colors.primary} />
              <Text style={styles.filterBannerText}>Showing experiences for <Text style={{fontWeight: '900'}}>{targetMedName}</Text></Text>
            </View>
            <TouchableOpacity 
              style={styles.clearFilterBtn}
              onPress={() => navigation.setParams({ medName: undefined })}
            >
              <Text style={styles.clearFilterText}>Clear</Text>
              <MaterialIcons name="close" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}

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
            onPress={() => navigation.navigate('WriteReview', { uid, mockUser, medName: targetMedName })}
          >
            <MaterialIcons name="rate-review" size={20} color={colors.primary} />
            <Text style={styles.writeActionBtnLabel}>Write Product Review</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.writeActionBtn, { borderColor: colors.error }]}
            onPress={() => navigation.navigate('ReportSideEffect', { uid, mockUser, medName: targetMedName })}
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
              filteredFeed.map((post) => {
                const isOwner = post.uid === activeUid;

                return (
                  <View key={post.id} style={styles.feedCard}>
                    {/* Card Header Profile */}
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{(post.userName || post.sender || 'P').charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.senderRow}>
                          <Text style={styles.senderName}>{post.userName || post.sender}</Text>
                          {post.verified && (
                            <MaterialIcons name="verified" size={16} color={colors.secondary} />
                          )}
                        </View>

                        {/* Detailed Metadata Fields */}
                        <View style={styles.metaDetailBlock}>
                          <Text style={styles.metaLineText}>
                            <Text style={styles.metaLabelBold}>Medication: </Text>{post.medicineName || 'Medication'}
                          </Text>
                          <Text style={styles.metaLineText}>
                            <Text style={styles.metaLabelBold}>Report Type: </Text>{post.reportType || (post.itemType === 'side_effect' ? 'Side Effect Log' : 'Product Review')}
                          </Text>
                          <Text style={styles.metaLineText}>
                            <Text style={styles.metaLabelBold}>Location: </Text>{post.location || 'Local Community'}
                          </Text>
                        </View>
                      </View>

                      {/* Date + Time & Owner Edit/Delete Controls */}
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <Text style={styles.timeText}>{post.timestamp}</Text>
                        
                        {isOwner && (
                          <View style={styles.ownerActionsRow}>
                            <TouchableOpacity 
                              style={styles.actionIconButton} 
                              onPress={() => handleEditPost(post)}
                            >
                              <MaterialIcons name="edit" size={18} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.actionIconButton} 
                              onPress={() => handleDeletePost(post)}
                            >
                              <MaterialIcons name="delete" size={18} color={colors.error} />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
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

                    {/* Post Content / Description */}
                    <Text style={styles.postTitle}>{post.title}</Text>
                    <Text style={styles.postText}>{post.text}</Text>

                    {/* Actions Row */}
                    <View style={styles.actionsRow}>
                      <TouchableOpacity style={styles.likeBtn} onPress={() => Alert.alert("Liked Post", "Thank you for validating this patient safety report.")}>
                        <MaterialIcons name="thumb-up" size={16} color={colors.outline} />
                        <Text style={styles.likeText}>{post.likes || 0} Helpful</Text>
                      </TouchableOpacity>
                      <View style={styles.categoryChip}>
                        <Text style={styles.categoryChipText}>{(post.category || 'General').toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* Edit Submission Modal */}
      <Modal visible={Boolean(editingPost)} transparent animationType="slide" onRequestClose={() => setEditingPost(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Your Submission</Text>
              <TouchableOpacity onPress={() => setEditingPost(null)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Medication Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editMedName}
                  onChangeText={setEditMedName}
                  placeholder="e.g. Metformin"
                />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Title / Symptom</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Title or symptom summary"
                />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Location</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editLocation}
                  onChangeText={setEditLocation}
                  placeholder="Location or clinic"
                />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Detailed Description / Experience</Text>
                <TextInput
                  style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
                  multiline
                  value={editText}
                  onChangeText={setEditText}
                  placeholder="Share details of your experience..."
                />
              </View>
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setEditingPost(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveBtn} 
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  filterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
  },
  filterBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterBannerText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  clearFilterText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '800',
  },
  metaDetailBlock: {
    marginTop: 4,
    gap: 2,
  },
  metaLineText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metaLabelBold: {
    fontWeight: '800',
    color: colors.primary,
  },
  ownerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  actionIconButton: {
    padding: 4,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.outlineVariant + '4D',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant + '4D',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  modalFormGroup: {
    marginBottom: 14,
    gap: 6,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  modalInput: {
    height: 44,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant + '4D',
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  modalSaveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  }
});

export default CommunityFeedScreen;
