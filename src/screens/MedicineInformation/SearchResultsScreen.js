import React, { useState } from 'react';
import { 
   View, 
   Text, 
   StyleSheet, 
   TouchableOpacity, 
   SafeAreaView, 
   ScrollView, 
   Image, 
   Platform, 
   StatusBar,
   Dimensions,
   Modal,
   TextInput,
   Alert
} from 'react-native';
import { colors } from '../../theme/colors';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const SearchResultsScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser, query = 'Pain relief' } = params;

  // Modal chat state
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLogs, setChatLogs] = useState([
    { sender: 'pharmacist', text: 'Hello! I am MedVigilance’s on-duty clinical pharmacist. How can I assist you with your prescriptions or alternatives today?' }
  ]);

  const databaseMedicines = [
    {
      id: 'med_c1',
      name: 'Paracetamol',
      category: 'Pain Relief',
      type: 'Tablet',
      strength: '500mg',
      price: '$4.50',
      manufacturer: 'GSK Pharma',
      tag: 'IN STOCK',
      desc: 'Used for relieving mild to moderate pain including headache, migraine, muscle ache.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9sRImLSNHu1l3G9vE9HfRV8snZ4v1V6iPu-xt47H7JhCYR4FB6Xpbd2qA6GfUQwofY0g1xUm38_5igW_uSkXuflU_ADiXlcWbPlE8fDMx78TgUF6-ExWcUxRC5PrVVPn1v1l4s-tvGrn0Y4kYSu-p_kRSdv7mx1N9GtulyO4i9_-h_yq8U20cE7M_0ImF409cz-rGIJK6Zl_XTQ5PvKmmURQiNJV9IhMzJGNjbVHHM6lLl_WYWt7py5778ys9kQakqS1YhSfgI78'
    },
    {
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
    },
    {
      id: 'med_c3',
      name: 'Cetirizine Syrup',
      category: 'Allergy',
      type: 'Syrup',
      strength: '150ml',
      price: '$8.25',
      manufacturer: 'Bayer',
      tag: 'IN STOCK',
      desc: 'An antihistamine used to relieve allergy symptoms such as watery eyes, runny nose, and sneezing.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcIK_CNAytWJxRMwMuYZXOgMQzXlec_0fXvysllBMdwKdBNsMk_temaX2_r24-WtGjsljQplnfFh3Ap46180riMwTLwDog_AUomgy7N6ltLgySPIPjlFLZU_l9AnrMUWkMpOOfo1wRT2HdiQ6uFNS507Jn40-HN4AfuNOa6e9qBprg1GaluUDE5r2Eu4GdR-HtT0XvMvbMjpt6BIxdi3Peg3b62RxvcexlQpxTArjsmmrAyW4hMedxlAqwFW8HnRBfnZ1lY1GZr-k'
    }
  ];

  // Perform a case-insensitive query match
  const filteredMeds = databaseMedicines.filter(med => 
    med.name.toLowerCase().includes(query.toLowerCase()) ||
    med.category.toLowerCase().includes(query.toLowerCase()) ||
    med.desc.toLowerCase().includes(query.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const nextLogs = [...chatLogs, { sender: 'user', text: chatMessage.trim() }];
    setChatLogs(nextLogs);
    setChatMessage('');

    // Simulate pharmacist reply
    setTimeout(() => {
      setChatLogs(prev => [
        ...prev,
        { sender: 'pharmacist', text: 'I understand. That is a commonly requested inquiry. For alternatives, please make sure your registered allergies under your Profile tab are fully updated so I can suggest allergen-safe substitutes!' }
      ]);
    }, 1200);
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
          <Text style={styles.headerTitle}>Search Results</Text>
        </View>
        <TouchableOpacity style={styles.avatarMini} onPress={() => navigation.navigate('Dashboard', { screen: 'profile' })}>
          <MaterialIcons name="account-circle" size={26} color={colors.outline} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Search Query Info */}
        <View style={styles.queryBlock}>
          <View style={styles.queryBar}>
            <MaterialIcons name="search" size={20} color={colors.outline} />
            <Text style={styles.queryText}>Query: "{query}"</Text>
          </View>
          <Text style={styles.resultsCount}>{filteredMeds.length} Clinical Matches Found</Text>
        </View>

        {/* Results List */}
        <View style={styles.resultsStack}>
          {filteredMeds.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.outlineVariant} />
              <Text style={styles.emptyText}>No matches found in clinical database.</Text>
            </View>
          ) : (
            filteredMeds.map((med) => (
              <TouchableOpacity 
                key={med.id}
                style={styles.medCard}
                onPress={() => navigation.navigate('MedicineOverview', { uid, mockUser, medData: med })}
                activeOpacity={0.9}
              >
                <Image source={{ uri: med.img }} style={styles.medImg} />
                <View style={styles.medDetails}>
                  <View style={styles.medTitleRow}>
                    <Text style={styles.medName}>{med.name} {med.strength}</Text>
                    <Text style={styles.medPrice}>{med.price}</Text>
                  </View>
                  <Text style={styles.medManuf}>{med.manufacturer.toUpperCase()}</Text>
                  <Text style={styles.medDesc} numberOfLines={2}>{med.desc}</Text>
                  
                  <View style={styles.badgeRow}>
                    <View style={styles.formBadge}>
                      <Text style={styles.formBadgeText}>{med.type}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      med.tag === 'PRESCRIPTION' ? { backgroundColor: colors.errorContainer } : { backgroundColor: colors.secondaryContainer }
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        med.tag === 'PRESCRIPTION' ? { color: colors.error } : { color: colors.primary }
                      ]}>{med.tag}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Bento Pharmacist CTA banner */}
        <View style={styles.pharmacistBentoCard}>
          <View style={styles.bentoLeft}>
            <Text style={styles.bentoTitle}>Can't find what you need?</Text>
            <Text style={styles.bentoDesc}>Our certified clinical pharmacists are standing by to consult alternative treatments.</Text>
            <TouchableOpacity 
              style={styles.bentoBtn}
              onPress={() => setChatVisible(true)}
            >
              <MaterialIcons name="chat" size={18} color={colors.primary} />
              <Text style={styles.bentoBtnLabel}>Ask a Pharmacist</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bentoRightIcon}>
            <MaterialIcons name="medical-services" size={80} color={colors.white + '1A'} />
          </View>
        </View>
      </ScrollView>

      {/* 4. Pharmacist Consultation Modal Chat */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.chatCard}>
            <View style={styles.chatHeader}>
              <View style={styles.pharmacistBadge}>
                <View style={styles.greenActiveDot} />
                <Text style={styles.pharmacistTitle}>Clinical Pharmacist (Live)</Text>
              </View>
              <TouchableOpacity onPress={() => setChatVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.chatScroll} contentContainerStyle={{ paddingVertical: 12, gap: 12 }}>
              {chatLogs.map((log, idx) => (
                <View 
                  key={idx}
                  style={[
                    styles.chatBubble,
                    log.sender === 'user' ? styles.chatBubbleUser : styles.chatBubblePharma
                  ]}
                >
                  <Text style={[
                    styles.chatText,
                    log.sender === 'user' ? { color: colors.white } : { color: colors.text }
                  ]}>{log.text}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.chatInputRow}>
              <TextInput 
                style={styles.chatInput}
                placeholder="Ask regarding dosage, forms, alternatives..."
                placeholderTextColor={colors.outline}
                value={chatMessage}
                onChangeText={setChatMessage}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity 
                style={styles.chatSendBtn}
                onPress={handleSendMessage}
              >
                <MaterialIcons name="send" size={20} color={colors.white} />
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
  queryBlock: {
    marginBottom: 20,
  },
  queryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  queryText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
  },
  resultsCount: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
  },
  resultsStack: {
    gap: 16,
    marginBottom: 28,
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
  },
  medCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    flexDirection: 'row',
    padding: 12,
    gap: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  medImg: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
    backgroundColor: colors.surfaceContainerHigh,
  },
  medDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  medTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medName: {
    fontSize: 15,
    fontWeight: '850',
    color: colors.primary,
  },
  medPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  medManuf: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.secondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  medDesc: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  formBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.primaryFixed,
    borderRadius: 4,
  },
  formBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '850',
    textTransform: 'uppercase',
  },
  pharmacistBentoCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  bentoLeft: {
    flex: 1.5,
    zIndex: 10,
  },
  bentoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
  bentoDesc: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.8,
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  bentoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    height: 38,
    backgroundColor: colors.white,
    borderRadius: 19,
    paddingHorizontal: 16,
    gap: 8,
  },
  bentoBtnLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  bentoRightIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },

  // Modal Chat styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  chatCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.75,
    padding: 20,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingBottom: 14,
  },
  pharmacistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greenActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2ecc71',
  },
  pharmacistTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  chatScroll: {
    flex: 1,
  },
  chatBubble: {
    maxWidth: '80%',
    borderRadius: 14,
    padding: 12,
    marginVertical: 4,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  chatBubblePharma: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant,
  },
  chatText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingTop: 12,
  },
  chatInput: {
    flex: 1,
    height: 46,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 23,
    paddingHorizontal: 16,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  chatSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default SearchResultsScreen;
