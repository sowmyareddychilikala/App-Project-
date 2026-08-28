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
   Modal,
   TextInput,
   ActivityIndicator,
   Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { medicineService } from '../../services/medicineService';

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

  const [currentQuery, setCurrentQuery] = useState(query);
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [keyError, setKeyError] = useState(false);
  const [networkOffline, setNetworkOffline] = useState(false);
  const fetchMeds = async (q, keyToUse) => {
    setLoading(true);
    setKeyError(false);
    setNetworkOffline(false);

    try {
      const results = await medicineService.searchMedicine(q, keyToUse);
      setSearchResults(results);
      setSuggestions([]);
    } catch (err) {
      console.warn("Search failed: ", err.message);
      if (err.message && err.message.includes('Network request failed')) {
        setNetworkOffline(true);
      }
      const fallback = medicineService.runLocalSearch(q);
      setSearchResults(fallback);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Load API Key and trigger fetch
  useEffect(() => {
    const loadApiKey = async () => {
      const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (envKey && envKey.length > 10 && !envKey.includes('YOUR_GEMINI')) {
        setGeminiApiKey(envKey);
        fetchMeds(currentQuery, envKey);
        return;
      }
      try {
        const storedKey = await AsyncStorage.getItem('@meditrust_gemini_api_key');
        if (storedKey && storedKey.length > 10) {
          setGeminiApiKey(storedKey);
          fetchMeds(currentQuery, storedKey);
        } else {
          // If no key is set or key is placeholder, proceed to search with empty key
          fetchMeds(currentQuery, '');
        }
      } catch (err) {
        console.error('Failed to load Gemini API key:', err);
        fetchMeds(currentQuery, '');
      }
    };
    loadApiKey();
  }, [currentQuery]);

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
            <Text style={styles.queryText}>Query: "{currentQuery}"</Text>
          </View>
          <Text style={styles.resultsCount}>{searchResults.length} Clinical Matches Found</Text>
        </View>

        {keyError && (
          <View style={styles.keyErrorBanner}>
            <MaterialIcons name="error-outline" size={20} color="#b71c1c" />
            <View style={{ flex: 1 }}>
              <Text style={styles.keyErrorTitle}>Gemini API Key Error</Text>
              <Text style={styles.keyErrorDesc}>
                The configured API key is invalid or blocked. Showing fallback search results from local clinical database.
              </Text>
            </View>
          </View>
        )}

        {networkOffline && (
          <View style={styles.offlineBanner}>
            <MaterialIcons name="cloud-off" size={20} color="#616161" />
            <View style={{ flex: 1 }}>
              <Text style={styles.offlineTitle}>Working Offline</Text>
              <Text style={styles.offlineDesc}>
                Secure clinical servers are currently unreachable. Showing local fallback database search results instead.
              </Text>
            </View>
          </View>
        )}

        {/* Results List */}
        <View style={styles.resultsStack}>
          {loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.emptyText}>Consulting clinical databases...</Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.outlineVariant} />
              <Text style={styles.emptyText}>No matches found in clinical database.</Text>

              {suggestions.length > 0 && (
                <View style={styles.suggestionBlock}>
                  <Text style={styles.suggestionTitle}>Did you mean:</Text>
                  <View style={styles.suggestionRow}>
                    {suggestions.map((sug, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        style={styles.suggestionChip}
                        onPress={() => {
                          setCurrentQuery(sug);
                        }}
                      >
                        <Text style={styles.suggestionChipText}>{sug}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : (
            searchResults.map((med) => (
              <TouchableOpacity 
                key={med.id}
                style={styles.medCard}
                onPress={() => navigation.navigate('MedicineOverview', { uid, mockUser, medData: med })}
                activeOpacity={0.9}
              >
                <Image source={{ uri: med.img }} style={styles.medImg} />
                <View style={styles.medDetails}>
                  <View style={styles.medTitleRow}>
                    <Text style={styles.medName} numberOfLines={1} ellipsizeMode="tail">
                      {med.name} {med.strength && !med.name.includes(med.strength) ? `(${med.strength})` : ''}
                    </Text>
                    <Text style={styles.medPrice}>{med.price}</Text>
                  </View>
                  <Text style={styles.medManuf} numberOfLines={1}>{(med.manufacturer || 'PHARMA CORE').toUpperCase()}</Text>
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
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  medImg: {
    width: 72,
    height: 72,
    borderRadius: 10,
    resizeMode: 'cover',
    backgroundColor: colors.surfaceContainerHigh,
    flexShrink: 0,
  },
  medDetails: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  medTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  medName: {
    flex: 1,
    flexShrink: 1,
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.primary,
  },
  medPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 6,
    flexShrink: 0,
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
  },
  suggestionBlock: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  suggestionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  suggestionChip: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  suggestionChipText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '800',
  },
  keyErrorBanner: {
    flexDirection: 'row',
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#e57373',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  keyErrorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b71c1c',
  },
  keyErrorDesc: {
    fontSize: 11,
    color: '#c62828',
    lineHeight: 15,
    marginTop: 2,
    fontWeight: '500',
  },
  offlineBanner: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  offlineTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#424242',
  },
  offlineDesc: {
    fontSize: 11,
    color: '#616161',
    lineHeight: 15,
    marginTop: 2,
    fontWeight: '500',
  },
});

export default SearchResultsScreen;
