import React, { useState, useEffect } from 'react';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  FlatList, 
  Platform, 
  StatusBar,
  ActivityIndicator,
  Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { updateUserProfileFields, listenUserProfile } from '../../services/dbService';
import * as Location from 'expo-location';
import { ref, get } from 'firebase/database';
import { database } from '../../../firebaseConfig';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const SelectPharmacyScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser, query = '', verifiedOnly, openNow, delivery } = params;

  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const [rawPharmacies, setRawPharmacies] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [coords, setCoords] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Haversine formula to compute distance in kilometers
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  // Fetch nearby pharmacies from OpenStreetMap Overpass API
  const fetchNearbyPharmacies = async (latitude, longitude) => {
    const radius = 5000; // 5km radius
    const queryStr = `[out:json][timeout:25];node["amenity"="pharmacy"](around:${radius},${latitude},${longitude});out body;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(queryStr)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('OSM Overpass API response not OK');
    }
    const data = await response.json();
    return data.elements || [];
  };

  // Parse OSM element into standard Pharmacy object
  const parseOSMPharmacy = (element, userLat, userLon) => {
    const tags = element.tags || {};
    const name = tags.name || tags.brand || 'Unnamed Pharmacy';
    
    // Address parts
    let addressParts = [];
    if (tags['addr:housenumber']) addressParts.push(tags['addr:housenumber']);
    if (tags['addr:street']) addressParts.push(tags['addr:street']);
    if (tags['addr:suburb']) addressParts.push(tags['addr:suburb']);
    if (tags['addr:city']) addressParts.push(tags['addr:city']);
    if (tags['addr:postcode']) addressParts.push(tags['addr:postcode']);
    const address = addressParts.length > 0 ? addressParts.join(', ') : 'Address information unavailable';
    
    const phone = tags.phone || tags['contact:phone'] || 'Information unavailable';
    const hours = tags.opening_hours || 'Information unavailable';
    const distance = calculateDistance(userLat, userLon, element.lat, element.lon);
    
    const tagsList = [];
    if (tags.opening_hours) {
      tagsList.push(tags.opening_hours.toLowerCase().includes('24/7') ? '24/7 Open' : 'Open hours available');
    } else {
      tagsList.push('Hours unavailable');
    }
    if (tags.wheelchair === 'yes') {
      tagsList.push('Wheelchair Accessible');
    }
    if (tags.drive_through === 'yes' || tags['drive_thru'] === 'yes') {
      tagsList.push('Drive-thru');
    }
    if (tags.delivery === 'yes' || tags['service:delivery'] === 'yes') {
      tagsList.push('Delivery');
    }
    
    return {
      id: `osm_${element.id}`,
      name,
      address,
      phone,
      hours,
      distance,
      tags: tagsList,
      latitude: element.lat,
      longitude: element.lon,
      verified: false,
      trustScore: 'Information unavailable',
      complianceAlert: false
    };
  };

  // Get current user location permissions and coordinates on mount
  useEffect(() => {
    const getPermissionsAndLocation = async () => {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setCoords(loc.coords);
        } else {
          setLocationError('Permission to access location was denied.');
          // Default to Bangalore center where database pharmacies are seeded
          setCoords({ latitude: 12.9716, longitude: 77.5946 });
        }
      } catch (err) {
        console.warn('Error fetching location:', err);
        setLocationError('Could not retrieve current location.');
        setCoords({ latitude: 12.9716, longitude: 77.5946 });
      } finally {
        setLoading(false);
      }
    };
    getPermissionsAndLocation();
  }, []);

  // Fetch pharmacies around user location and match database ratings
  useEffect(() => {
    if (!coords) return;

    const loadPharmacies = async () => {
      setLoading(true);
      try {
        // Fetch OSM pharmacies
        const osmElements = await fetchNearbyPharmacies(coords.latitude, coords.longitude);
        
        // Fetch database pharmacies
        const pharmaciesDbRef = ref(database, 'pharmacies');
        const dbSnapshot = await get(pharmaciesDbRef);
        const dbPharmacies = dbSnapshot.exists() ? dbSnapshot.val() : {};

        // Parse OSM pharmacies and match against real DB
        let parsed = osmElements.map(el => {
          const pharmacy = parseOSMPharmacy(el, coords.latitude, coords.longitude);
          
          let matchedDb = null;
          if (dbPharmacies[pharmacy.id]) {
            matchedDb = dbPharmacies[pharmacy.id];
          } else {
            // Match by name similarity and distance proximity (within 300 meters)
            const nameClean = pharmacy.name.toLowerCase();
            for (const key of Object.keys(dbPharmacies)) {
              const dbItem = dbPharmacies[key];
              const dbNameClean = dbItem.name.toLowerCase();
              const distBetween = calculateDistance(
                pharmacy.latitude, 
                pharmacy.longitude, 
                dbItem.coordinates?.latitude, 
                dbItem.coordinates?.longitude
              );
              if ((nameClean.includes(dbNameClean) || dbNameClean.includes(nameClean)) && distBetween < 0.2) {
                matchedDb = dbItem;
                break;
              }
            }
          }

          if (matchedDb) {
            pharmacy.trustScore = matchedDb.trustScore;
            pharmacy.verified = matchedDb.status === 'Trusted';
            pharmacy.complianceAlert = matchedDb.status === 'High Risk';
            if (matchedDb.status === 'High Risk' && !pharmacy.tags.includes('Compliance Alert')) {
              pharmacy.tags.push('Compliance Alert');
            }
          }
          return pharmacy;
        });

        // Add seeded pharmacies directly if not already in the parsed list
        // This ensures the Bangalore demonstration works seamlessly even without GPS matching
        Object.keys(dbPharmacies).forEach(key => {
          const dbItem = dbPharmacies[key];
          const exists = parsed.some(p => p.id === dbItem.id || p.name.toLowerCase() === dbItem.name.toLowerCase());
          if (!exists) {
            const distance = calculateDistance(coords.latitude, coords.longitude, dbItem.coordinates.latitude, dbItem.coordinates.longitude);
            parsed.push({
              id: dbItem.id,
              name: dbItem.name,
              address: dbItem.address,
              phone: 'Information unavailable',
              hours: 'Information unavailable',
              distance,
              tags: dbItem.status === 'Trusted' ? ['Verified Network'] : [],
              latitude: dbItem.coordinates.latitude,
              longitude: dbItem.coordinates.longitude,
              verified: dbItem.status === 'Trusted',
              trustScore: dbItem.trustScore,
              complianceAlert: dbItem.status === 'High Risk'
            });
          }
        });

        // Sort by distance
        parsed.sort((a, b) => a.distance - b.distance);

        setRawPharmacies(parsed);
      } catch (err) {
        console.error('Error loading pharmacies:', err);
        Alert.alert("Data Error", "Could not fetch nearby pharmacy information.");
      } finally {
        setLoading(false);
      }
    };

    loadPharmacies();
  }, [coords]);

  // Load user profile to check currently selected preferred pharmacy
  useEffect(() => {
    if (mockUser) {
      setUserProfile({ preferredPharmacy: 'pharma_1' });
      setSelectedPharmacyId('pharma_1');
      return;
    }
    if (uid) {
      const unsubscribe = listenUserProfile(uid, (data) => {
        if (data) {
          setUserProfile(data);
          if (data.preferredPharmacyId) {
            setSelectedPharmacyId(data.preferredPharmacyId);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [uid, mockUser]);

  // Apply filters
  useEffect(() => {
    let filtered = rawPharmacies;

    // Search query match
    if (query) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.address.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filter Verified Only
    if (verifiedOnly) {
      filtered = filtered.filter(p => p.verified);
    }

    // Filter Open Now (24/7)
    if (openNow) {
      filtered = filtered.filter(p => p.hours.toLowerCase().includes('24/7') || p.hours.toLowerCase().includes('open 24 hours'));
    }

    // Filter Delivery
    if (delivery) {
      filtered = filtered.filter(p => p.tags.includes('Delivery') || p.verified);
    }

    setPharmacies(filtered);
  }, [rawPharmacies, query, verifiedOnly, openNow, delivery]);

  // Select pharmacy as user's preference in DB
  const handleSelectPharmacy = async (pharmacy) => {
    setSavingId(pharmacy.id);
    try {
      if (mockUser) {
        setSelectedPharmacyId(pharmacy.id);
        Alert.alert("Success", `${pharmacy.name} selected as your preferred provider.`);
      } else {
        await updateUserProfileFields(uid, {
          preferredPharmacyId: pharmacy.id,
          preferredPharmacyName: pharmacy.name,
          preferredPharmacyAddress: pharmacy.address
        });
        setSelectedPharmacyId(pharmacy.id);
        Alert.alert("Success", `${pharmacy.name} registered as your primary pharmacy.`);
      }
    } catch (err) {
      Alert.alert("Database Error", "Failed to update preferred pharmacy profile.");
    } finally {
      setSavingId(null);
    }
  };

  const renderPharmacyItem = ({ item }) => {
    const isSelected = selectedPharmacyId === item.id;
    const isSaving = savingId === item.id;

    return (
      <View style={styles.pharmacyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleCol}>
            <View style={styles.nameRow}>
              <Text style={styles.pharmacyName}>{item.name}</Text>
              {item.verified && (
                <MaterialIcons name="verified" size={18} color={colors.secondary} />
              )}
              {item.complianceAlert && (
                <MaterialIcons name="warning" size={18} color={colors.error} />
              )}
            </View>
            <View style={styles.distanceRow}>
              <MaterialIcons name="location-on" size={14} color={colors.outline} />
              <Text style={styles.distanceText}>
                {typeof item.distance === 'number' && !isNaN(item.distance) ? `${item.distance} km away` : 'Distance unavailable'}
              </Text>
            </View>
          </View>

          {/* Trust Score display badge */}
          <View style={[
            styles.trustBadge, 
            item.complianceAlert 
              ? styles.trustBadgeAlert 
              : (typeof item.trustScore === 'number' && item.trustScore >= 90) 
                ? styles.trustBadgeExcellent 
                : styles.trustBadgeMedium
          ]}>
            <Text style={styles.trustBadgeLabel}>TRUST</Text>
            <Text style={styles.trustBadgeValue}>
              {typeof item.trustScore === 'number' ? item.trustScore : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Address and details */}
        <View style={styles.cardBody}>
          <Text style={styles.addressText}>{item.address}</Text>
          <View style={styles.tagsRow}>
            {item.tags.map((tag, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.tagBadge, 
                  item.complianceAlert && tag === 'Compliance Alert' ? { backgroundColor: colors.errorContainer } : null
                ]}
              >
                <Text style={[
                  styles.tagBadgeText,
                  item.complianceAlert && tag === 'Compliance Alert' ? { color: colors.error } : null
                ]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer actions */}
        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.detailsBtn}
            onPress={() => navigation.navigate('PharmacyDetails', { uid, mockUser, pharmacyData: item })}
          >
            <Text style={styles.detailsBtnText}>
              {item.complianceAlert ? 'View Issues' : 'View Detailed Report'}
            </Text>
            <MaterialIcons name="chevron-right" size={18} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.selectBtn, 
              isSelected ? styles.selectBtnActive : null
            ]}
            onPress={() => handleSelectPharmacy(item)}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={[styles.selectBtnText, isSelected ? styles.selectBtnTextActive : null]}>
                {isSelected ? 'Selected' : 'Select'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
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
          <Text style={styles.headerTitle}>{query || 'All Pharmacies'}</Text>
        </View>
        <TouchableOpacity style={styles.avatarMini} onPress={() => navigation.navigate('Dashboard', { screen: 'profile' })}>
          <MaterialIcons name="account-circle" size={26} color={colors.outline} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {/* Results Metadata */}
        <View style={styles.resultsMetaRow}>
          <Text style={styles.resultsMetaTitle}>{pharmacies.length} Pharmacies Found</Text>
          <Text style={styles.resultsMetaSub}>Showing verified local distributors</Text>
        </View>

        {/* Pharmacy Cards List */}
        {pharmacies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="local-pharmacy" size={48} color={colors.outlineVariant} />
            <Text style={styles.emptyText}>No pharmacies match your active search filters.</Text>
          </View>
        ) : (
          <FlatList
            data={pharmacies}
            renderItem={renderPharmacyItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listScroll}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  resultsMetaRow: {
    marginBottom: 16,
  },
  resultsMetaTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  resultsMetaSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listScroll: {
    paddingBottom: 40,
    gap: 16,
  },
  pharmacyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    padding: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleCol: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  distanceText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  trustBadge: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  trustBadgeExcellent: {
    backgroundColor: colors.secondaryContainer,
    borderColor: colors.secondary + '33',
  },
  trustBadgeMedium: {
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.outlineVariant,
  },
  trustBadgeAlert: {
    backgroundColor: colors.errorContainer,
    borderColor: colors.error + '33',
  },
  trustBadgeLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textSecondary,
    opacity: 0.8,
  },
  trustBadgeValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  cardBody: {
    marginBottom: 16,
  },
  addressText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant + '33',
    paddingTop: 12,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  selectBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtnActive: {
    backgroundColor: colors.secondary,
  },
  selectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  selectBtnTextActive: {
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.outline,
    fontWeight: '600',
    textAlign: 'center',
  }
});

export default SelectPharmacyScreen;
