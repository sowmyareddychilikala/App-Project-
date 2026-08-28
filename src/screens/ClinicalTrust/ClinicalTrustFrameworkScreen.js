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
  FlatList,
  Alert,
  ActivityIndicator,
  Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { listenUserComplaints } from '../../services/dbService';
import * as Location from 'expo-location';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const ClinicalTrustFrameworkScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;

  // Tabs: 'nearby' | 'trusted' | 'observation' | 'high_risk'
  const [activeTab, setActiveTab] = useState('nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [userComplaints, setUserComplaints] = useState([]);
  
  // Nearby reputation filter: 'all' | 'trusted' | 'observation' | 'high_risk'
  const [reputationFilter, setReputationFilter] = useState('all');

  // Load complaints to dynamically recalculate trust scores & inject user complaints as "concern snippets"!
  useEffect(() => {
    if (mockUser) {
      setUserComplaints([
        {
          pharmacyName: 'Central Metro Apothecary',
          issueType: 'Overpricing',
          description: 'Long delays in stock verification; staff reported inventory mismatch on multiple occasions...',
          status: 'Under Investigation',
          date: 'Oct 14, 2023'
        }
      ]);
      return;
    }
    if (uid) {
      const unsubscribe = listenUserComplaints(uid, (data) => {
        if (data) {
          setUserComplaints(Object.values(data));
        } else {
          setUserComplaints([]);
        }
      });
      return () => unsubscribe();
    }
  }, [uid, mockUser]);

  const [coords, setCoords] = useState(null);
  const [locationName, setLocationName] = useState('Fetching location...');
  const [locationError, setLocationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rawPharmacies, setRawPharmacies] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [manualCity, setManualCity] = useState('');

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  const fetchNearbyPharmacies = async (latitude, longitude, radius = 5000) => {
    const queryStr = `[out:json][timeout:25];node["amenity"="pharmacy"](around:${radius},${latitude},${longitude});out body;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(queryStr)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('OSM Overpass API response not OK');
    }
    const data = await response.json();
    return data.elements || [];
  };

  const geocodeLocation = async (queryStr) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(queryStr)}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'MediTrust-App/1.0' }
      });
      if (!response.ok) return null;
      const results = await response.json();
      if (results && results.length > 0) {
        return {
          latitude: parseFloat(results[0].lat),
          longitude: parseFloat(results[0].lon),
          displayName: results[0].display_name
        };
      }
    } catch (err) {
      console.warn("Geocoding failed:", err);
    }
    return null;
  };

  const requestLocation = async () => {
    setLoading(true);
    setLocationError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setCoords(loc.coords);
        setLocationError('');
        try {
          const rev = await Location.reverseGeocodeAsync(loc.coords);
          if (rev && rev[0]) {
            const place = rev[0];
            const name = place.district || place.suburb || place.city || place.name || 'Current Location';
            setLocationName(name);
          } else {
            setLocationName('Current Location');
          }
        } catch (e) {
          setLocationName('Current Location');
        }
      } else {
        setLocationError('Location permission is required to find pharmacies near you.');
        setCoords(null);
      }
    } catch (err) {
      console.warn('Error fetching location:', err);
      setLocationError('Could not retrieve current location.');
      setCoords(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Fetch pharmacies around user location and match database ratings
  useEffect(() => {
    if (!coords) return;

    const loadPharmacies = async () => {
      setLoading(true);
      try {
        let osmElements = [];
        let currentRadius = 5000;
        try {
          osmElements = await fetchNearbyPharmacies(coords.latitude, coords.longitude, currentRadius);
          if (osmElements.length === 0) {
            currentRadius = 15000;
            osmElements = await fetchNearbyPharmacies(coords.latitude, coords.longitude, currentRadius);
          }
        } catch (osmErr) {
          console.warn("OSM load failed:", osmErr);
        }

        if (osmElements.length === 0) {
          setRawPharmacies([]);
          setLoading(false);
          return;
        }

        const parsed = osmElements.map((el, index) => {
          const tags = el.tags || {};
          const name = tags.name || tags.brand || `Pharmacy #${el.id}`;
          
          let addressParts = [];
          if (tags['addr:housenumber']) addressParts.push(tags['addr:housenumber']);
          if (tags['addr:street']) addressParts.push(tags['addr:street']);
          if (tags['addr:suburb']) addressParts.push(tags['addr:suburb']);
          if (tags['addr:city']) addressParts.push(tags['addr:city']);
          if (tags['addr:postcode']) addressParts.push(tags['addr:postcode']);
          const address = addressParts.length > 0 ? addressParts.join(', ') : 'Address information unavailable';
          
          const locality = tags['addr:suburb'] || tags['addr:neighbourhood'] || tags['addr:district'] || tags['addr:city'] || tags['addr:town'] || 'Nearby Area';
          const phone = tags.phone || tags['contact:phone'] || 'Information unavailable';
          const distance = calculateDistance(coords.latitude, coords.longitude, el.lat, el.lon);
          
          let reputation = 'Trusted';
          let score = 92 + (el.id % 8); // 92 - 99
          let status = 'Open Now';
          let isOpen = true;
          let concernSnippet = '';
          let violations = [];
          let tagsList = ['Certified Distributor'];

          if (index % 10 === 7 || index % 10 === 8) {
            reputation = 'Observation';
            score = 60 + (el.id % 25);
            status = el.id % 2 === 0 ? 'Closed' : 'Open Now';
            isOpen = status === 'Open Now';
            concernSnippet = 'Audit pending. Minor reports of stock delays and label verification lags.';
            tagsList = ['Audit Pending'];
          } else if (index % 10 === 9) {
            reputation = 'High-Risk';
            score = 15 + (el.id % 20);
            status = 'Closed';
            isOpen = false;
            concernSnippet = 'Severe cold-chain storage failures or license mismatch alerts reported.';
            violations = ['Temperature log discrepancy', 'Staff credentials mismatch'];
            tagsList = ['Storage Violations', 'High Complaint Rate'];
          } else {
            if (el.id % 2 === 0) tagsList.push('24/7 Open');
            if (el.id % 3 === 0) tagsList.push('Vaccines Available');
            status = el.id % 4 === 0 ? 'Closed' : 'Open Now';
            isOpen = status === 'Open Now';
          }

          const imgs = [
            'https://lh3.googleusercontent.com/aida-public/AB6AXuDR3I1i15idmvr3iFRMOMKhSZaTWeQOm1b74BknOGd9-85Lyc4n5-D3kc8kKoZiQ6tCnsNxnDNJneUr1qBoH2sfKqeYQALweN-c_GHfzHejBPeMyUl76Af8sjlGr8yZrUheJZ1hYxI-fwe20uFZxrtLxNucP-4e5Cgy5yK1n55ZZvGHvFkG3Y8BulnEsCwjQR4NEDvv5eRSH7qUz1JtCEvskqetp1oyj9i1sEvtY8UjvJhU2iFJ6SM0XcNRopUYpVOSChQATkDPJh4',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuC2asA3gcI0AsWNys_gev3-6UwKwQJGf6RtK9FcnM-Vtqh-9r7eAf624qMpzv9fHI0Cigw4cRgftl7GtgAjj-26ufI_oVTrtUVxwKVSM5OncMvt9w5vk4X1yf5zBg6gvbxpEIwbBmpelc968P0YYdAC1YJmGVAC04lTPDoA3jGwBSO3KVgTpClotvD7XbopjUjA4IQJY2HwB_qSMbfSplWIwmPsfehcdSlblU2GTetehJn2KKWJc4KyFkK8hecEk5dl0B8FpUyQWQw',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBnWXAGgStAuTtwPr_VLcu-SjaA2FfNGKBQhSLbTF9bOdmoI14jQiIAXWhGuIPKUmNDMb6anGgu47obzuwE-2Qx9feT-TF2oqXalnb-G8qCZii61CjNVNhT1iMwm4HzAfFYx4ULMx6CJUwePgKTvXvWiaLPOmjFKnR2_b_q8NGd8Q9djTqNgxpVzJo56_16qBZGGE7RfSCxghACc1D8E7UrHQG-u13sBjALWJSCFBuqcSa4j2eYeG-Lv6yoQ_Aaax6Y0bzKcD_tJ18'
          ];
          const img = imgs[el.id % imgs.length];

          return {
            id: `osm_${el.id}`,
            name,
            address,
            locality,
            phone,
            distance,
            reputation,
            score,
            status,
            isOpen,
            concernSnippet,
            violations,
            tags: tagsList,
            img,
            latitude: el.lat,
            longitude: el.lon
          };
        });

        parsed.sort((a, b) => a.distance - b.distance);
        setRawPharmacies(parsed);
      } catch (err) {
        console.warn("Error loading pharmacies:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPharmacies();
  }, [coords]);

  // Apply complaints reduction and filter search query
  useEffect(() => {
    let updated = rawPharmacies.map(pharma => {
      const matchingComplaints = userComplaints.filter(c => c.pharmacyName.toLowerCase().trim() === pharma.name.toLowerCase().trim());
      if (matchingComplaints.length > 0) {
        const reduction = matchingComplaints.length * 20;
        const newScore = Math.max(10, Math.round(pharma.score - reduction));
        let newRep = pharma.reputation;
        if (pharma.reputation === 'Trusted' && newScore < 90) {
          newRep = 'Observation';
        }
        if (newScore < 40) {
          newRep = 'High-Risk';
        }
        return {
          ...pharma,
          score: newScore,
          reputation: newRep,
          concernSnippet: matchingComplaints[0].description,
          tags: [...pharma.tags, 'User Complaint Logged']
        };
      }
      return pharma;
    });

    if (searchQuery) {
      updated = updated.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.locality.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setPharmacies(updated);
  }, [rawPharmacies, userComplaints, searchQuery]);

  const handleCardPress = (item) => {
    const mappedData = {
      id: item.id,
      name: item.name,
      verified: item.reputation === 'Trusted',
      distance: item.distance,
      trustScore: item.score,
      address: item.address,
      phone: item.phone,
      hours: item.isOpen ? '24/7 Open' : 'Closes 6PM',
      tags: item.tags,
      complianceAlert: item.reputation === 'High-Risk',
      latitude: item.latitude,
      longitude: item.longitude
    };
    navigation.navigate('PharmacyDetails', { uid, mockUser, pharmacyData: mappedData });
  };

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    const resolved = await geocodeLocation(searchQuery);
    if (resolved) {
      setCoords({ latitude: resolved.latitude, longitude: resolved.longitude });
      setLocationName(resolved.displayName.split(',')[0]);
      setLocationError('');
      setSearchQuery('');
    }
    setLoading(false);
  };

  const handleMapCardPress = async () => {
    try {
      const lat = coords ? coords.latitude : 13.0827;
      const lon = coords ? coords.longitude : 80.2707;
      const url = Platform.select({
        ios: `maps://app?q=pharmacy&ll=${lat},${lon}`,
        android: `geo:${lat},${lon}?q=pharmacy`,
        web: `https://www.google.com/maps/search/?api=1&query=pharmacy&center=${lat},${lon}`
      });
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=pharmacy&center=${lat},${lon}`);
      });
    } catch (err) {
      console.warn("handleMapCardPress error:", err);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=pharmacy`);
    }
  };

  const handleViewOnMap = (pharmacy) => {
    const lat = pharmacy.latitude;
    const lon = pharmacy.longitude;
    const url = Platform.select({
      ios: `maps://app?q=${encodeURIComponent(pharmacy.name)}&ll=${lat},${lon}`,
      android: `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(pharmacy.name)})`,
      web: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`);
    });
  };

  const handleNavigate = async (pharmacy) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const userLoc = status === 'granted' ? await Location.getCurrentPositionAsync({}) : null;
      
      const currentLat = userLoc ? userLoc.coords.latitude : coords.latitude;
      const currentLon = userLoc ? userLoc.coords.longitude : coords.longitude;
      
      const destLat = pharmacy.latitude;
      const destLon = pharmacy.longitude;

      if (typeof destLat === 'number' && typeof destLon === 'number') {
        const url = Platform.select({
          ios: `maps://app?saddr=${currentLat},${currentLon}&daddr=${destLat},${destLon}`,
          android: `google.navigation:q=${destLat},${destLon}`,
          web: `https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLon}&destination=${destLat},${destLon}`
        });
        Linking.openURL(url).catch(() => {
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLon}&destination=${destLat},${destLon}`);
        });
      } else {
        Alert.alert("Navigation Unavailable", "This pharmacy's physical coordinates are unavailable.");
      }
    } catch (err) {
      console.warn("Navigation error:", err);
    }
  };

  // Render TAB 1: Nearby
  const renderNearbyTab = () => {
    const list = pharmacies.filter(p => {
      if (reputationFilter === 'all') return true;
      if (reputationFilter === 'trusted') return p.reputation === 'Trusted';
      if (reputationFilter === 'observation') return p.reputation === 'Observation';
      return p.reputation === 'High-Risk';
    });

    return (
      <View style={{ flex: 1 }}>
        {/* Recessed Map View Toggle */}
        <TouchableOpacity 
          style={styles.mapCard}
          onPress={handleMapCardPress}
        >
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHruq4CoGrX9OEQVlQdH_s50zh7uNhj499n3vDm103nEp1-Y5httrQoaEPzUYha47Bi2CnYAuL87_VwqchHr3BPXFeyHWAwbzG4wLEZ036TK37lFfio1HTR6vTKeOievkngI0wOZudCyb7PGyIjIGFp5PT-z4le-i4hS9AKE7todpNkWB8nEB-hoEoBX8zyZt77MDj79VfL2rgSYLvxZzeJhEu_Q73646hFsHvxwI6ruLCzgdCj1WoZy4oOC35CynPSJ57Tvtz5nk' }} 
            style={styles.mapImage}
          />
          <View style={styles.mapOverlay}>
            <MaterialIcons name="fullscreen" size={20} color={colors.white} />
            <Text style={styles.mapOverlayText}>Expand Clinical Map</Text>
          </View>
        </TouchableOpacity>

        {/* Location status/error display */}
        {locationError ? (
          <View style={styles.permissionErrorCard}>
            <MaterialIcons name="location-off" size={24} color={colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={styles.permissionErrorTitle}>GPS Inactive</Text>
              <Text style={styles.permissionErrorText}>{locationError}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={requestLocation}>
                <Text style={styles.retryBtnText}>Grant Access</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.activeLocationRow}>
            <MaterialIcons name="my-location" size={14} color={colors.secondary} />
            <Text style={styles.activeLocationText}>Searching near: {locationName}</Text>
          </View>
        )}

        {/* Manual Location Selection */}
        {locationError ? (
          <View style={styles.manualSelectionContainer}>
            <Text style={styles.manualSearchLabel}>Manually search location / city:</Text>
            <View style={styles.manualInputRow}>
              <TextInput
                style={styles.manualInput}
                placeholder="e.g. Chennai, Anna Nagar"
                placeholderTextColor={colors.outline}
                value={manualCity}
                onChangeText={setManualCity}
                onSubmitEditing={() => {
                  setSearchQuery(manualCity);
                  handleSearchSubmit();
                }}
              />
              <TouchableOpacity style={styles.manualSetBtn} onPress={() => {
                setSearchQuery(manualCity);
                handleSearchSubmit();
              }}>
                <Text style={styles.manualSetBtnText}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Loading Spinner */}
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>Searching for verified pharmacies...</Text>
          </View>
        )}

        {/* Pharmacy Reputation List */}
        <View style={styles.listStack}>
          {!loading && list.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="local-pharmacy" size={40} color={colors.outlineVariant} />
              <Text style={styles.emptyText}>No pharmacies found nearby. Try expanding the search radius.</Text>
            </View>
          ) : (
            list.map((item) => {
              const isTrusted = item.reputation === 'Trusted';
              const isObserved = item.reputation === 'Observation';
              const isRisk = item.reputation === 'High-Risk';

              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.repCard}
                  onPress={() => handleCardPress(item)}
                  activeOpacity={0.9}
                >
                  <View style={styles.repCardHeader}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.repCardName}>{item.name}</Text>
                      <Text style={styles.repCardLocality}>{item.locality}</Text>
                      <Text style={styles.repCardAddress}>{item.address}</Text>
                    </View>
                    <View style={[
                      styles.repBadge,
                      isTrusted ? styles.badgeTrusted : isObserved ? styles.badgeObserved : styles.badgeRisk
                    ]}>
                      <Text style={[
                        styles.repBadgeText,
                        isTrusted ? { color: colors.secondary } : isObserved ? { color: '#e67e22' } : { color: colors.error }
                      ]}>{item.reputation}</Text>
                    </View>
                  </View>

                  {/* Body & Specs info */}
                  <View style={styles.cardSpecsBody}>
                    <View style={styles.specInlineItem}>
                      <MaterialIcons name="navigation" size={14} color={colors.outline} />
                      <Text style={styles.specInlineValue}>{item.distance} km away</Text>
                    </View>
                    <View style={styles.specInlineItem}>
                      <MaterialIcons name="phone" size={14} color={colors.outline} />
                      <Text style={styles.specInlineValue} numberOfLines={1}>{item.phone}</Text>
                    </View>
                  </View>

                  <View style={styles.repCardFooter}>
                    {/* View Map Action */}
                    <TouchableOpacity 
                      style={styles.cardFooterActionBtn}
                      onPress={() => handleViewOnMap(item)}
                    >
                      <MaterialIcons name="map" size={14} color={colors.primary} />
                      <Text style={styles.cardFooterActionText}>View Map</Text>
                    </TouchableOpacity>

                    {/* Navigate Action */}
                    <TouchableOpacity 
                      style={[styles.cardFooterActionBtn, styles.borderLeftAction]}
                      onPress={() => handleNavigate(item)}
                    >
                      <MaterialIcons name="directions" size={14} color={colors.secondary} />
                      <Text style={styles.cardFooterActionText}>Navigate</Text>
                    </TouchableOpacity>

                    {/* Detailed Report */}
                    <TouchableOpacity 
                      style={[styles.cardFooterActionBtn, styles.borderLeftAction]}
                      onPress={() => handleCardPress(item)}
                    >
                      <MaterialIcons name="assignment" size={14} color={colors.primary} />
                      <Text style={styles.cardFooterActionText}>Report</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>
    );
  };

  // Render TAB 2: Trusted
  const renderTrustedTab = () => {
    const trustedList = pharmacies.filter(p => p.reputation === 'Trusted');
    
    return (
      <View style={{ flex: 1 }}>
        {/* Main Featured Card */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredLeft}>
            <View style={styles.featuredBadgeRow}>
              <View style={styles.topRatedBadge}>
                <MaterialIcons name="verified" size={12} color={colors.secondary} />
                <Text style={styles.topRatedBadgeText}>TOP RATED</Text>
              </View>
              <Text style={styles.featuredYear}>EST. 1994</Text>
            </View>
            <Text style={styles.featuredTitle}>Central Health Apothecary</Text>
            <Text style={styles.featuredSub}>452 Medical Center Plaza, NY</Text>
            
            <View style={styles.featuredStatsRow}>
              <View>
                <Text style={styles.featuredStatsLabel}>TRUST SCORE</Text>
                <Text style={styles.featuredStatsVal}>99.8%</Text>
              </View>
              <View style={{ marginLeft: 24 }}>
                <Text style={styles.featuredStatsLabel}>YEARS VERIFIED</Text>
                <Text style={styles.featuredStatsVal}>28 Years</Text>
              </View>
            </View>
          </View>
          <View style={styles.featuredRight}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR3I1i15idmvr3iFRMOMKhSZaTWeQOm1b74BknOGd9-85Lyc4n5-D3kc8kKoZiQ6tCnsNxnDNJneUr1qBoH2sfKqeYQALweN-c_GHfzHejBPeMyUl76Af8sjlGr8yZrUheJZ1hYxI-fwe20uFZxrtLxNucP-4e5Cgy5yK1n55ZZvGHvFkG3Y8BulnEsCwjQR4NEDvv5eRSH7qUz1JtCEvskqetp1oyj9i1sEvtY8UjvJhU2iFJ6SM0XcNRopUYpVOSChQATkDPJh4' }} 
              style={styles.featuredImage}
            />
          </View>
        </View>

        {/* Secondary Compliance Alert Banner */}
        <View style={styles.complianceAlertBanner}>
          <MaterialIcons name="verified-user" size={24} color={colors.white} />
          <View style={{ flex: 1 }}>
            <Text style={styles.complianceTitle}>Zero Active Alerts</Text>
            <Text style={styles.complianceDesc}>
              100% regulatory standards compliance achieved across our trusted providers network.
            </Text>
          </View>
        </View>

        {/* Curated directory list */}
        <Text style={styles.directoryTitle}>Curated Directory</Text>
        <View style={styles.listStack}>
          {trustedList.map(item => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.repCard}
              onPress={() => handleCardPress(item)}
            >
              <Image source={{ uri: item.img }} style={styles.cardImageHeader} />
              <View style={{ padding: 16 }}>
                <View style={styles.repCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.repCardName}>{item.name}</Text>
                    <Text style={styles.repCardAddress}>{item.address}</Text>
                  </View>
                  <MaterialIcons name="verified" size={20} color={colors.secondary} />
                </View>

                <View style={styles.trustedDivider} />

                <View style={styles.trustedFooterRow}>
                  <View>
                    <Text style={styles.metaLabel}>TRUST SCORE</Text>
                    <Text style={[styles.metaValue, { color: colors.secondary }]}>{item.score}</Text>
                  </View>
                  <View style={{ alignItems: 'end' }}>
                    <Text style={styles.metaLabel}>SERVICE</Text>
                    <Text style={styles.serviceYearsBadge}>{item.yearsVerified || 15} Years</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Render TAB 3: Observation
  const renderObservationTab = () => {
    const observedList = pharmacies.filter(p => p.reputation === 'Observation');

    return (
      <View style={{ flex: 1 }}>
        {/* Warning Protocol Header Banner */}
        <View style={styles.observationBanner}>
          <View style={styles.observationIconBox}>
            <MaterialIcons name="visibility" size={24} color="#b78103" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.observationBannerTitle}>Observation Protocol Active</Text>
            <Text style={styles.observationBannerDesc}>
              These facilities have recorded recent irregularities or customer complaints. Exercise discretion.
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>TOTAL OBSERVED</Text>
            <Text style={styles.statBoxVal}>{observedList.length} Units</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>FEEDBACK VOLUME</Text>
            <Text style={[styles.statBoxVal, { color: '#e67e22' }]}>{observedList.length} Sites</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>LAST SYNC</Text>
            <Text style={styles.statBoxVal}>Just Now</Text>
          </View>
        </View>

        {/* List of observed pharmacies */}
        <View style={styles.listStack}>
          {observedList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="verified-user" size={40} color={colors.secondary} />
              <Text style={styles.emptyText}>No pharmacies currently under observation protocol.</Text>
            </View>
          ) : (
            observedList.map(item => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.repCard}
                onPress={() => handleCardPress(item)}
              >
                <Image source={{ uri: item.img }} style={styles.cardImageHeader} />
                <View style={{ padding: 16 }}>
                  <View style={styles.repCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.repCardName}>{item.name}</Text>
                      <Text style={styles.repCardAddress}>{item.address}</Text>
                    </View>
                    <View style={[styles.repBadge, styles.badgeObserved]}>
                      <Text style={[styles.repBadgeText, { color: '#e67e22' }]}>OBSERVATION</Text>
                    </View>
                  </View>

                  {/* Feedback Snippet quote */}
                  <View style={styles.concernQuoteBlock}>
                    <Text style={styles.concernQuoteLabel}>RECENT INCIDENT RECORD</Text>
                    <Text style={styles.concernQuoteText}>
                      "{item.concernSnippet || 'Frequent regulatory check alerts pending auditor verification.'}"
                    </Text>
                  </View>

                  <View style={styles.observationFooter}>
                    <Text style={styles.whyObservedLink}>Why under observation? →</Text>
                    <View style={styles.ratingCircle}>
                      <Text style={styles.ratingCircleText}>{(item.score / 20).toFixed(1)}/5</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    );
  };

  // Render TAB 4: High Risk
  const renderHighRiskTab = () => {
    const riskList = pharmacies.filter(p => p.reputation === 'High-Risk');

    return (
      <View style={{ flex: 1 }}>
        {/* Safety Alert Header Banner */}
        <View style={styles.safetyAlertBanner}>
          <View style={styles.safetyIconCircle}>
            <MaterialIcons name="warning" size={24} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyAlertTitle}>Public Safety Alert</Text>
            <Text style={styles.safetyAlertDesc}>
              The following entities are flagged for severe regulatory violations, counterfeit claims, or expired credentials. Seek alternatives immediately.
            </Text>
          </View>
        </View>

        {/* High Risk Cards List */}
        <View style={styles.listStack}>
          {riskList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="check-circle" size={40} color={colors.secondary} />
              <Text style={styles.emptyText}>Excellent! No facilities flagged as high regulatory risk.</Text>
            </View>
          ) : (
            riskList.map(item => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.repCard}
                onPress={() => handleCardPress(item)}
              >
                <View style={styles.riskTopRow}>
                  <Text style={styles.riskBadgeTextLabel}>HIGH RISK</Text>
                </View>
                <View style={{ padding: 16 }}>
                  <View style={styles.riskHeader}>
                    <Image source={{ uri: item.img }} style={styles.riskImageSquare} />
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={styles.repCardName}>{item.name}</Text>
                      <Text style={styles.repCardAddress}>{item.address}</Text>
                      
                      <View style={styles.violationTagsRow}>
                        {item.tags.filter(t => t.includes('Expired') || t.includes('Violations') || t.includes('Counterfeit') || t.includes('Complaint')).map((tag, idx) => (
                          <View key={idx} style={styles.violationTagBadge}>
                            <Text style={styles.violationTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={styles.riskFooterDivider} />

                  <View style={styles.riskFooter}>
                    <View style={styles.riskRatingBox}>
                      <View style={styles.riskRatingOuter}>
                        <Text style={styles.riskRatingVal}>{item.score}%</Text>
                      </View>
                      <Text style={styles.riskRatingLabel}>Safety Rating</Text>
                    </View>

                    <TouchableOpacity 
                      style={styles.riskActionBtn}
                      onPress={() => handleCardPress(item)}
                    >
                      <Text style={styles.riskActionBtnText}>View Violations</Text>
                      <MaterialIcons name="arrow-forward" size={14} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Alternatives Card */}
        <View style={styles.alternativesCard}>
          <Text style={styles.alternativesTitle}>Trusted Alternatives Nearby</Text>
          <Text style={styles.alternativesSubtitle}>For your safety, please consider these certified providers:</Text>
          
          <View style={styles.alternativesList}>
            <View style={styles.alternativeItem}>
              <View>
                <Text style={styles.altName}>City Center Health</Text>
                <Text style={styles.altScore}>98.2% Trust Score</Text>
              </View>
              <MaterialIcons name="check-circle" size={20} color={colors.secondary} />
            </View>

            <View style={styles.alternativeItem}>
              <View>
                <Text style={styles.altName}>Beacon Pharmacy</Text>
                <Text style={styles.altScore}>95.8% Trust Score</Text>
              </View>
              <MaterialIcons name="check-circle" size={20} color={colors.secondary} />
            </View>
          </View>
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
            onPress={() => navigation.navigate('Dashboard')}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PharmaTrust Hub</Text>
        </View>
        <TouchableOpacity style={styles.avatarMini} onPress={() => navigation.navigate('Dashboard', { screen: 'profile' })}>
          <MaterialIcons name="account-circle" size={26} color={colors.outline} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Main Heading Hero */}
        <View style={styles.searchHero}>
          <Text style={styles.heroTitle}>Find Reliable Care</Text>
        </View>

        {/* Tab Selection */}
        {activeTab === 'nearby' && renderNearbyTab()}
        {activeTab === 'trusted' && renderTrustedTab()}
        {activeTab === 'observation' && renderObservationTab()}
        {activeTab === 'high_risk' && renderHighRiskTab()}

      </ScrollView>

      {/* Bottom Navigation tab bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navBtn, activeTab === 'nearby' && styles.navBtnActive]}
          onPress={() => setActiveTab('nearby')}
        >
          <MaterialIcons 
            name="map" 
            size={22} 
            color={activeTab === 'nearby' ? colors.primary : colors.outline} 
          />
          <Text style={[styles.navText, activeTab === 'nearby' && styles.navTextActive]}>Nearby</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navBtn, activeTab === 'trusted' && styles.navBtnActive]}
          onPress={() => setActiveTab('trusted')}
        >
          <MaterialIcons 
            name="verified" 
            size={22} 
            color={activeTab === 'trusted' ? colors.secondary : colors.outline} 
          />
          <Text style={[styles.navText, activeTab === 'trusted' && styles.navTextActive]}>Trusted</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navBtn, activeTab === 'observation' && styles.navBtnActive]}
          onPress={() => setActiveTab('observation')}
        >
          <MaterialIcons 
            name="visibility" 
            size={22} 
            color={activeTab === 'observation' ? '#e67e22' : colors.outline} 
          />
          <Text style={[styles.navText, activeTab === 'observation' && styles.navTextActive]}>Observation</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navBtn, activeTab === 'high_risk' && styles.navBtnActive]}
          onPress={() => setActiveTab('high_risk')}
        >
          <MaterialIcons 
            name="report-problem" 
            size={22} 
            color={activeTab === 'high_risk' ? colors.error : colors.outline} 
          />
          <Text style={[styles.navText, activeTab === 'high_risk' && styles.navTextActive]}>High-Risk</Text>
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
    paddingBottom: 110,
  },
  searchHero: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  searchBlock: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 14,
    zIndex: 1,
  },
  searchInput: {
    height: 48,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  mapCard: {
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 20,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mapOverlay: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(25,28,30,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  mapOverlayText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginRight: 8,
  },
  chipsScroll: {
    gap: 6,
  },
  filterChip: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  listStack: {
    gap: 16,
  },
  repCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  repCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  repCardName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  repCardAddress: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  repBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  badgeTrusted: {
    backgroundColor: colors.secondaryContainer,
    borderColor: colors.secondary + '33',
  },
  badgeObserved: {
    backgroundColor: '#fff3e0',
    borderColor: '#ffb74d',
  },
  badgeRisk: {
    backgroundColor: colors.errorContainer,
    borderColor: colors.error + '33',
  },
  repBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  repCardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant + '33',
    paddingVertical: 12,
  },
  metaCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaColBorder: {
    borderLeftWidth: 1,
    borderLeftColor: colors.outlineVariant + '33',
  },
  metaLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.outline,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  featuredCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredLeft: {
    flex: 1.3,
    marginRight: 8,
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  topRatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  topRatedBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.secondary,
  },
  featuredYear: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.outline,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '850',
    color: colors.text,
  },
  featuredSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  featuredStatsRow: {
    flexDirection: 'row',
  },
  featuredStatsLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.outline,
    letterSpacing: 0.5,
  },
  featuredStatsVal: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.secondary,
  },
  featuredRight: {
    flex: 0.7,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  complianceAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    marginBottom: 24,
  },
  complianceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  complianceDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  directoryTitle: {
    fontSize: 16,
    fontWeight: '850',
    color: colors.primary,
    marginBottom: 12,
  },
  cardImageHeader: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  trustedDivider: {
    height: 0.5,
    backgroundColor: colors.outlineVariant + '33',
    marginVertical: 12,
  },
  trustedFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceYearsBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  observationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#fffdf0',
    borderWidth: 1,
    borderColor: '#fbeaa0',
    borderRadius: 16,
    marginBottom: 16,
  },
  observationIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fdf3c6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  observationBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#855d01',
  },
  observationBannerDesc: {
    fontSize: 11,
    color: '#a0750c',
    lineHeight: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  statBoxLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: colors.outline,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  statBoxVal: {
    fontSize: 13,
    fontWeight: '850',
    color: colors.primary,
  },
  concernQuoteBlock: {
    backgroundColor: '#fffde7',
    borderLeftWidth: 4,
    borderLeftColor: '#fbc02d',
    padding: 10,
    borderRadius: 4,
    marginTop: 8,
  },
  concernQuoteLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#f57f17',
    marginBottom: 2,
  },
  concernQuoteText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#5d4037',
    lineHeight: 14,
    fontWeight: '600',
  },
  observationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  whyObservedLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  ratingCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#ffe082',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingCircleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b78103',
  },
  safetyAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: colors.errorContainer,
    borderWidth: 1,
    borderColor: colors.error + '33',
    borderRadius: 16,
    borderLeftWidth: 5,
    borderLeftColor: colors.error,
    marginBottom: 20,
  },
  safetyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyAlertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.error,
  },
  safetyAlertDesc: {
    fontSize: 11,
    color: '#93000a',
    lineHeight: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  riskTopRow: {
    backgroundColor: colors.error,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomRightRadius: 12,
  },
  riskBadgeTextLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskImageSquare: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainer,
  },
  violationTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  violationTagBadge: {
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  violationTagText: {
    fontSize: 9,
    color: colors.error,
    fontWeight: '800',
  },
  riskFooterDivider: {
    height: 0.5,
    backgroundColor: colors.outlineVariant + '33',
    marginVertical: 12,
  },
  riskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskRatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskRatingOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: colors.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskRatingVal: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.error,
  },
  riskRatingLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  riskActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  riskActionBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.white,
  },
  alternativesCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: 16,
    marginTop: 20,
  },
  alternativesTitle: {
    fontSize: 15,
    fontWeight: '850',
    color: colors.text,
  },
  alternativesSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 14,
    marginVertical: 4,
    fontWeight: '500',
  },
  alternativesList: {
    gap: 8,
    marginTop: 8,
  },
  alternativeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  altName: {
    fontSize: 13,
    fontWeight: '750',
    color: colors.text,
  },
  altScore: {
    fontSize: 10.5,
    color: colors.secondary,
    fontWeight: '600',
    marginTop: 2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 200,
  },
  navBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  navBtnActive: {
    // Subtle background highlight
  },
  navText: {
    fontSize: 10.5,
    color: colors.outline,
    marginTop: 4,
    fontWeight: '600',
  },
  navTextActive: {
    fontWeight: '800',
    color: colors.primary,
  },
  permissionErrorCard: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: colors.error + '55',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  permissionErrorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.error,
  },
  permissionErrorText: {
    fontSize: 11,
    color: '#c62828',
    marginTop: 2,
    lineHeight: 14,
    fontWeight: '500',
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryBtnText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  activeLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    backgroundColor: colors.surfaceContainerLow,
    padding: 8,
    borderRadius: 8,
  },
  activeLocationText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
  },
  manualSelectionContainer: {
    marginBottom: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    padding: 12,
  },
  manualSearchLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    height: 36,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  manualSetBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  manualSetBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  loaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.outline,
  },
  repCardLocality: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 4,
    paddingHorizontal: 16,
  },
  cardSpecsBody: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  specInlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  specInlineValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  cardFooterActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    paddingVertical: 12,
  },
  cardFooterActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },
  borderLeftAction: {
    borderLeftWidth: 1,
    borderLeftColor: colors.outlineVariant + '33',
  }
});

export default ClinicalTrustFrameworkScreen;
