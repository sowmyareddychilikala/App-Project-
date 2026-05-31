import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  TextInput, 
  Platform, 
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { saveMedicineReview } from '../../services/dbService';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const WriteReviewScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;

  // Form states
  const [medName, setMedName] = useState('');
  const [title, setTitle] = useState('');
  const [rating, setRating] = useState(5); // 1 to 5 stars
  const [category, setCategory] = useState('General'); // 'Cardiological' | 'Respiratory' | 'Neurological' | 'General'
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleRegisterReview = async () => {
    if (!medName.trim() || !title.trim() || !comment.trim()) {
      Alert.alert("Input Needed", "Please specify the medicine name, review title, and comment.");
      return;
    }

    const payload = {
      medicineName: medName.trim(),
      title: title.trim(),
      rating,
      category,
      comment: comment.trim()
    };

    if (mockUser) {
      setSaving(true);
      setTimeout(() => {
        setSaving(false);
        Alert.alert(
          "Review Registered", 
          "Your review has been successfully published in the public community experience feed!",
          [{ text: "Confirm", onPress: () => navigation.replace('CommunityFeed', { uid, mockUser }) }]
        );
      }, 1200);
      return;
    }

    try {
      setSaving(true);
      // Clean medicineId key out of string name (e.g. "lisinopril" -> "med_lisinopril")
      const formattedMedId = `med_${medName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      await saveMedicineReview(uid, formattedMedId, payload);
      setSaving(false);
      Alert.alert(
        "Review Synced", 
        "Thank you. Your clinical treatment review is now published globally on our patient experiences board!",
        [{ text: "OK", onPress: () => navigation.replace('CommunityFeed', { uid }) }]
      );
    } catch (err) {
      setSaving(false);
      Alert.alert("Database Error", "Failed to upload medication review.");
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
          <Text style={styles.headerTitle}>Write Review</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Intro branding block */}
        <View style={styles.introBlock}>
          <Text style={styles.introTitle}>Share Experience</Text>
          <Text style={styles.introDesc}>
            Your treatment logs help fellow patients and clinicians trace efficacy rates and side effect mitigations accurately.
          </Text>
        </View>

        {/* Review Form panel */}
        <View style={styles.formCard}>
          {/* Medicine Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Medication Name</Text>
            <TextInput 
              style={styles.formInput}
              placeholder="e.g. Metformin"
              placeholderTextColor={colors.outline}
              value={medName}
              onChangeText={setMedName}
            />
          </View>

          {/* Star selector row */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Clinical Rating</Text>
            <View style={styles.starsSelectRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity 
                  key={s}
                  onPress={() => setRating(s)}
                >
                  <MaterialIcons 
                    name={s <= rating ? "star" : "star-outline"} 
                    size={38} 
                    color="#f1c40f" 
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.starsRatingLabel}>
              {rating === 5 ? 'Excellent Toleration' : rating === 4 ? 'Good Toleration' : rating === 3 ? 'Moderate Side Effects' : rating === 2 ? 'High Discomfort' : 'Severe Safety Concern'}
            </Text>
          </View>

          {/* Category Chip Selector */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Anatomical Category</Text>
            <View style={styles.selectionRow}>
              {['Cardiological', 'Respiratory', 'Neurological', 'General'].map((cat) => {
                const active = category === cat;
                return (
                  <TouchableOpacity 
                    key={cat}
                    style={[styles.chipBtn, active && styles.chipBtnActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.chipBtnText, active && styles.chipBtnTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Review Title */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Review Title Summary</Text>
            <TextInput 
              style={styles.formInput}
              placeholder="e.g. Tolerable when taken with food"
              placeholderTextColor={colors.outline}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Comment/Note description */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Detailed Experience Review</Text>
            <TextInput 
              style={[styles.formInput, styles.textArea]}
              placeholder="Outline dosage timelines, initial side effects, and how you managed or mitigated them successfully..."
              placeholderTextColor={colors.outline}
              multiline={true}
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
            />
          </View>

          {/* Form Actions */}
          <View style={styles.formActions}>
            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={handleRegisterReview}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <MaterialIcons name="publish" size={18} color={colors.white} />
                  <Text style={styles.submitBtnText}>Publish Review</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bento clinician advice */}
        <View style={styles.adviceBento}>
          <MaterialIcons name="verified-user" size={18} color={colors.secondary} />
          <Text style={styles.adviceText}>
            Review logs are anonymized. Patient identities are protected following HIPAA/GDPR clinical privacy frameworks.
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
  },
  header: {
    flexDirection: 'row',
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
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  introBlock: {
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  introDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 20,
    gap: 20,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 2,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '850',
    color: colors.primary,
  },
  formInput: {
    height: 48,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
  },
  starsSelectRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginVertical: 4,
  },
  starsRatingLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  selectionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  chipBtn: {
    height: 36,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  chipBtnActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  chipBtnTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  textArea: {
    height: 96,
    paddingTop: 12,
    paddingLeft: 16,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  submitBtn: {
    flex: 2,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  adviceBento: {
    flexDirection: 'row',
    backgroundColor: colors.secondaryContainer + '1D',
    borderWidth: 1,
    borderColor: colors.outlineVariant + '33',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  adviceText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    lineHeight: 15,
  }
});

export default WriteReviewScreen;
