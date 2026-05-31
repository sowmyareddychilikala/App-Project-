import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
  Modal,
  Image,
  Linking,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { colors } from '../../theme/colors';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { signOutUser } from '../../services/authService';
import { 
  listenUserProfile, 
  listenUserMedications, 
  listenUserNotifications, 
  saveUserMedication, 
  toggleMedicationTakenState, 
  deleteUserMedication, 
  updateNotificationReadState, 
  markAllNotificationsAsRead, 
  deleteUserNotification,
  updateUserPreferences, 
  updateUserProfileFields, 
  seedDefaultClinicalData 
} from '../../services/dbService';

const { width } = Dimensions.get('window');

export const DashboardScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;
  
  // Navigation active tab: 'dashboard', 'alerts', 'profile', 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Shared Real-time Database state
  const [profile, setProfile] = useState(null);
  const [medications, setMedications] = useState({});
  const [notifications, setNotifications] = useState({});
  const [loading, setLoading] = useState(true);

  // Tab 1: Dashboard states
  const [isAddingMed, setIsAddingMed] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedTime, setNewMedTime] = useState('09:00 AM');
  const [newMedInstructions, setNewMedInstructions] = useState('');

  // Tab 2: Alerts states
  const [alertFilter, setAlertFilter] = useState('all');
  const [consultingNotifId, setConsultingNotifId] = useState(null);

  // Tab 3: Profile edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editBloodType, setEditBloodType] = useState('');
  const [editAllergies, setEditAllergies] = useState('');

  // Local state for mock FaceID flow
  const [mockState, setMockState] = useState({
    profile: {
      fullName: "Dr. Sarah Johnson",
      email: "sarah.johnson@mediguard.ai",
      phone: "+1 (555) 234-5678",
      dob: 'May 14, 1978',
      bloodType: 'O Positive (O+)',
      allergies: ['Penicillin', 'Shellfish', 'Lactose'],
      contacts: [
        { id: '1', name: 'Sarah Wilson', relation: 'Spouse', type: 'Primary', phone: '555-0123' },
        { id: '2', name: 'Dr. Aris', relation: 'Cardiologist', type: 'Specialist', phone: '555-0987' }
      ],
      preferences: {
        pushEnabled: true,
        emailEnabled: false,
        smsEnabled: true
      }
    },
    medications: {
      'med_1': { id: 'med_1', name: 'Lisinopril', dosage: '10mg', time: '09:00 AM', instructions: 'Take with food', taken: false, takenTime: '' },
      'med_2': { id: 'med_2', name: 'Metformin', dosage: '500mg', time: '08:00 AM', instructions: 'Taken 8:05 AM', taken: true, takenTime: '08:05 AM' },
      'med_3': { id: 'med_3', name: 'Vitamin D3', dosage: '2000 IU', time: '02:00 PM', instructions: '1 Capsule', taken: false, takenTime: '' }
    },
    notifications: {
      'notif_1': { id: 'notif_1', type: 'critical', category: 'Safety Alert', timestamp: '2m ago', title: 'Drug Interaction Warning', description: 'System detected a potential moderate interaction between Lisinopril and your new supplement. Please consult your physician before the next dose.', unread: true, actionLabel: 'Consult AI Assistant' },
      'notif_2': { id: 'notif_2', type: 'expiry', category: 'Expiry Warning', timestamp: '1h ago', title: 'Medication Expiring Soon', description: 'Your prescription for Amoxicillin (500mg) expires in 3 days (Oct 24, 2023). Disposal is recommended after this date.', unread: true, actionLabel: 'Find Disposal Location' },
      'notif_3': { id: 'notif_3', type: 'system', category: 'System', timestamp: '5h ago', title: 'Privacy Policy Update', description: 'We\'ve updated our data encryption protocols to enhance your patient record security. Review the changes in your settings.', unread: false },
      'notif_4': { id: 'notif_4', type: 'critical', category: 'FDA Recall Notice', timestamp: 'Yesterday', title: 'Batch Recall: Valsartan', description: 'Specific batches of Valsartan (Lot #44921) have been voluntarily recalled. Check your bottle immediately.', unread: false, actionLabel: 'Report Batch Match' },
      'notif_5': { id: 'notif_5', type: 'system', category: 'Account', timestamp: '2 days ago', title: 'Biometric Login Enabled', description: 'FaceID has been successfully linked to your MedVigilance profile for faster access.', unread: false }
    }
  });

  // Seed default data & setup real-time DB listeners
  useEffect(() => {
    if (mockUser) {
      // Offline/Mock mode
      setProfile(mockState.profile);
      setMedications(mockState.medications);
      setNotifications(mockState.notifications);
      
      // Seed prefilled edit states
      setEditName(mockState.profile.fullName);
      setEditDob(mockState.profile.dob);
      setEditBloodType(mockState.profile.bloodType);
      setEditAllergies(mockState.profile.allergies.join(', '));
      
      setLoading(false);
      return;
    }

    if (uid) {
      const initializeData = async () => {
        try {
          // Pre-seed default Figma clinical records if first time loading
          await seedDefaultClinicalData(uid);
        } catch (err) {
          console.error("Failed to seed default clinical database records: ", err);
        }
      };
      initializeData();

      // Set up real-time Firebase listeners
      const unsubProfile = listenUserProfile(uid, (data) => {
        if (data) {
          setProfile(data);
          setEditName(data.fullName || '');
          setEditDob(data.dob || '');
          setEditBloodType(data.bloodType || '');
          setEditAllergies((data.allergies || []).join(', '));
        } else {
          setProfile({
            fullName: "Practitioner Patient",
            email: "secure@mediguard.ai",
            dob: 'May 14, 1978',
            bloodType: 'O Positive (O+)',
            allergies: ['Penicillin'],
            contacts: [{ id: '1', name: 'Emergency Support', phone: '911' }]
          });
        }
        setLoading(false);
      });

      const unsubMeds = listenUserMedications(uid, (data) => {
        setMedications(data || {});
      });

      const unsubNotifs = listenUserNotifications(uid, (data) => {
        setNotifications(data || {});
      });

      return () => {
        if (typeof unsubProfile === 'function') unsubProfile();
        if (typeof unsubMeds === 'function') unsubMeds();
        if (typeof unsubNotifs === 'function') unsubNotifs();
      };
    }
  }, [uid, mockUser]);

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to end your secured MedVigilance clinical session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await signOutUser();
              navigation.replace('Login');
            } catch (error) {
              setLoading(false);
              Alert.alert('Sign Out Failed', 'An error occurred during logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Helper: toggle dose taken status
  const handleToggleTaken = async (medId, currentState) => {
    if (mockUser) {
      const now = new Date();
      const updatedTime = !currentState 
        ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : '';
      setMockState(prev => {
        const nextMeds = { ...prev.medications };
        nextMeds[medId] = {
          ...nextMeds[medId],
          taken: !currentState,
          takenTime: updatedTime
        };
        const nextState = { ...prev, medications: nextMeds };
        setMedications(nextMeds);
        return nextState;
      });
    } else {
      try {
        await toggleMedicationTakenState(uid, medId, !currentState);
      } catch (err) {
        Alert.alert("Database Error", "Failed to update medication taken state.");
      }
    }
  };

  // Helper: add custom medication
  const handleAddMedication = async () => {
    if (!newMedName.trim() || !newMedDosage.trim()) {
      Alert.alert("Input Needed", "Please enter the medication name and dosage.");
      return;
    }

    const medData = {
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      time: newMedTime,
      instructions: newMedInstructions.trim() || 'No special instructions',
      taken: false,
      takenTime: ''
    };

    if (mockUser) {
      const newId = `med_${Date.now()}`;
      setMockState(prev => {
        const nextMeds = { ...prev.medications, [newId]: { ...medData, id: newId } };
        setMedications(nextMeds);
        return { ...prev, medications: nextMeds };
      });
      setIsAddingMed(false);
      resetAddMedForm();
    } else {
      try {
        setLoading(true);
        await saveUserMedication(uid, medData);
        setLoading(false);
        setIsAddingMed(false);
        resetAddMedForm();
      } catch (err) {
        setLoading(false);
        Alert.alert("Failed", "Failed to save medication to your cabinet.");
      }
    }
  };

  const resetAddMedForm = () => {
    setNewMedName('');
    setNewMedDosage('');
    setNewMedTime('09:00 AM');
    setNewMedInstructions('');
  };

  // Helper: Read a notification alert
  const handleReadNotification = async (notifId, currentUnread) => {
    if (!currentUnread) return;

    if (mockUser) {
      setMockState(prev => {
        const nextNotifs = { ...prev.notifications };
        nextNotifs[notifId] = { ...nextNotifs[notifId], unread: false };
        setNotifications(nextNotifs);
        return { ...prev, notifications: nextNotifs };
      });
    } else {
      try {
        await updateNotificationReadState(uid, notifId, false);
      } catch (err) {
        console.error("Failed to update notification read state: ", err);
      }
    }
  };

  // Helper: Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (mockUser) {
      setMockState(prev => {
        const nextNotifs = { ...prev.notifications };
        Object.keys(nextNotifs).forEach(key => {
          nextNotifs[key].unread = false;
        });
        setNotifications(nextNotifs);
        return { ...prev, notifications: nextNotifs };
      });
    } else {
      try {
        await markAllNotificationsAsRead(uid);
      } catch (err) {
        Alert.alert("Error", "Failed to mark notifications as read.");
      }
    }
  };

  // Helper: Dismiss alert
  const handleDismissNotification = async (notifId) => {
    if (mockUser) {
      setMockState(prev => {
        const nextNotifs = { ...prev.notifications };
        delete nextNotifs[notifId];
        setNotifications(nextNotifs);
        return { ...prev, notifications: nextNotifs };
      });
    } else {
      try {
        await deleteUserNotification(uid, notifId);
      } catch (err) {
        console.error("Failed to dismiss notification: ", err);
      }
    }
  };

  // Helper: Update profile fields in DB
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Name field cannot be left blank.");
      return;
    }

    const allergiesArray = editAllergies
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    const updatedFields = {
      fullName: editName.trim(),
      dob: editDob.trim(),
      bloodType: editBloodType.trim(),
      allergies: allergiesArray
    };

    if (mockUser) {
      setMockState(prev => {
        const nextProfile = { ...prev.profile, ...updatedFields };
        setProfile(nextProfile);
        return { ...prev, profile: nextProfile };
      });
      setIsEditingProfile(false);
    } else {
      try {
        setLoading(true);
        await updateUserProfileFields(uid, updatedFields);
        setLoading(false);
        setIsEditingProfile(false);
      } catch (err) {
        setLoading(false);
        Alert.alert("Database Error", "Failed to save profile changes.");
      }
    }
  };

  // Helper: Toggle database preferences
  const handlePreferenceToggle = async (prefKey, currentValue) => {
    const nextPrefs = {
      ...profile.preferences,
      [prefKey]: !currentValue
    };

    if (mockUser) {
      setMockState(prev => {
        const nextProfile = { ...prev.profile, preferences: nextPrefs };
        setProfile(nextProfile);
        return { ...prev, profile: nextProfile };
      });
    } else {
      try {
        await updateUserPreferences(uid, nextPrefs);
      } catch (err) {
        console.error("Failed to update preferences: ", err);
      }
    }
  };

  // Dynamic calculations
  const medicationsList = Object.values(medications || {});
  const remainingDoses = medicationsList.filter(m => !m.taken).length;
  const totalDoses = medicationsList.length;
  
  // Calculate dynamic adherence score
  const takenDosesCount = medicationsList.filter(m => m.taken).length;
  const adherenceRate = totalDoses > 0 
    ? Math.round((takenDosesCount / totalDoses) * 100) 
    : 94; // Premium Figma fallback default

  const unreadAlertsCount = Object.values(notifications || {}).filter(n => n.unread).length;
  const criticalAlertsCount = Object.values(notifications || {}).filter(n => n.type === 'critical' && n.unread).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Fetching Secured Clinical Session...</Text>
      </View>
    );
  }

  // -------------------------------------------------------------
  // TAB CONTENT RENDERERS
  // -------------------------------------------------------------

  const renderDashboardTab = () => {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeLeft}>
            <Text style={styles.welcomeGreeting}>Hello, {profile?.fullName?.split(' ')[0] || 'User'}</Text>
            <Text style={styles.welcomeSubtitle}>
              {remainingDoses === 0 
                ? "All caught up for today! Outstanding work."
                : `You have ${remainingDoses} dose${remainingDoses > 1 ? 's' : ''} remaining for today.`
              }
            </Text>
          </View>
          <TouchableOpacity style={styles.avatarMini} onPress={() => setActiveTab('profile')}>
            <Text style={styles.avatarMiniText}>
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'P'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Prominent Search Bar Entry Point (Module 5) */}
        <TouchableOpacity 
          style={styles.dashSearchBlock}
          onPress={() => navigation.navigate('MedicineSearch', { uid, mockUser })}
          activeOpacity={0.9}
        >
          <MaterialIcons name="search" size={22} color={colors.primary} style={styles.dashSearchIcon} />
          <Text style={styles.dashSearchPlaceholder}>Search medicine, usage, precautions...</Text>
        </TouchableOpacity>

        {/* Urgent Alerts Bento Section */}
        {Object.values(notifications).filter(n => n.unread).length > 0 && (
          <View style={styles.bentoSection}>
            <View style={styles.bentoHeaderRow}>
              <Text style={styles.bentoSectionTitle}>Urgent Alerts</Text>
              {unreadAlertsCount > 0 && (
                <View style={styles.bentoBadge}>
                  <Text style={styles.bentoBadgeText}>
                    {unreadAlertsCount} ACTION ITEM{unreadAlertsCount > 1 ? 'S' : ''}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.bentoCardsStack}>
              {Object.values(notifications)
                .filter(n => n.unread && (n.type === 'critical' || n.type === 'expiry'))
                .slice(0, 2)
                .map((alert) => (
                  <TouchableOpacity 
                    key={alert.id} 
                    style={styles.bentoAlertCard}
                    onPress={() => {
                      handleReadNotification(alert.id, true);
                      setActiveTab('alerts');
                    }}
                  >
                    <View style={[
                      styles.alertIconCircle, 
                      { backgroundColor: alert.type === 'critical' ? colors.error + '1A' : colors.primaryFixed }
                    ]}>
                      <MaterialIcons 
                        name={alert.type === 'critical' ? "warning" : "event-busy"} 
                        size={22} 
                        color={alert.type === 'critical' ? colors.error : colors.primary} 
                      />
                    </View>
                    <View style={styles.alertContentText}>
                      <Text style={styles.alertCardHeading}>{alert.title}</Text>
                      <Text style={styles.alertCardBody} numberOfLines={2}>{alert.description}</Text>
                      <View style={styles.alertPillRow}>
                        <View style={[styles.statusDot, { backgroundColor: alert.type === 'critical' ? colors.error : '#e67e22' }]} />
                        <Text style={[styles.alertPillText, { color: alert.type === 'critical' ? colors.error : '#e67e22' }]}>
                          {alert.type === 'critical' ? 'CRITICAL' : 'WARNING'}
                        </Text>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
                  </TouchableOpacity>
                ))
              }
            </View>
          </View>
        )}

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={[styles.quickActionBtn, { backgroundColor: colors.primary }]}
            onPress={() => setIsAddingMed(true)}
          >
            <Ionicons name="add-circle" size={24} color={colors.white} />
            <Text style={[styles.quickActionLabel, { color: colors.white }]}>Add Med</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickActionBtn, styles.quickActionGhost]}
            onPress={() => navigation.navigate('MedicineScanner', { uid, mockUser })}
          >
            <MaterialIcons name="qr-code-scanner" size={24} color={colors.primary} />
            <Text style={styles.quickActionLabel}>Scan Pill</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickActionBtn, styles.quickActionGhost]}
            onPress={() => {
              Alert.alert(
                "Clinical History", 
                `Verification Report:\n\n• Tracked Doses: ${takenDosesCount}\n• Missed Doses: 0\n• Overall Adherence: ${adherenceRate}%`
              );
            }}
          >
            <MaterialIcons name="history" size={24} color={colors.primary} />
            <Text style={styles.quickActionLabel}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Doses */}
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>Upcoming Doses</Text>
          <View style={styles.medsStack}>
            {medicationsList.length === 0 ? (
              <View style={styles.emptyMedsContainer}>
                <Ionicons name="medical-outline" size={40} color={colors.outlineVariant} />
                <Text style={styles.emptyMedsText}>Your medicine cabinet is empty.</Text>
                <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setIsAddingMed(true)}>
                  <Text style={styles.emptyAddBtnText}>Add Medication Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              medicationsList
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((med) => (
                  <View 
                    key={med.id} 
                    style={[styles.medCard, med.taken && styles.medCardCompleted]}
                  >
                    <View style={med.taken ? styles.medCardCompleted : styles.medCardActive} />
                    <View style={styles.medCardLeft}>
                      <View style={styles.medTimeCol}>
                        <Text style={[styles.medTimeText, med.taken && styles.medTextMuted]}>
                          {med.time.split(' ')[0]}
                        </Text>
                        <Text style={[styles.medTimeAmPm, med.taken && styles.medTextMuted]}>
                          {med.time.split(' ')[1]}
                        </Text>
                      </View>
                      
                      {/* Fluid indicator bar */}
                      <View style={[
                        styles.indicatorBar, 
                        { backgroundColor: med.taken ? colors.secondary : colors.primaryFixed }
                      ]} />

                      <View style={styles.medInfoCol}>
                        <Text style={[styles.medNameText, med.taken && styles.medNameCompleted]}>
                          {med.name}
                        </Text>
                        <Text style={styles.medDosageText}>
                          {med.dosage} • {med.instructions}
                        </Text>
                        {med.taken && (
                          <Text style={styles.takenLabelText}>
                            Taken at {med.takenTime || '08:05 AM'}
                          </Text>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={[
                        styles.checkCircleBtn, 
                        med.taken ? styles.checkCircleBtnSuccess : styles.checkCircleBtnActive
                      ]}
                      onPress={() => handleToggleTaken(med.id, med.taken)}
                    >
                      <MaterialIcons 
                        name={med.taken ? "done-all" : "check"} 
                        size={20} 
                        color={med.taken ? colors.white : colors.primary} 
                      />
                    </TouchableOpacity>
                  </View>
                ))
            )}
          </View>
        </View>

        {/* Community Safety Bento Grid & Recall Box */}
        <Text style={styles.sectionTitle}>MediGuard AI Core Modules</Text>
        <View style={styles.grid}>
          <TouchableOpacity 
            style={styles.gridCard}
            onPress={() => navigation.navigate('MedicineScanner', { uid, mockUser })}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name="qr-code-scanner" size={24} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Medicine Scanner</Text>
            <Text style={styles.cardDesc}>Scan pill packaging labels and check holograms & barcodes in real-time.</Text>
            <View style={styles.cardAction}>
              <Text style={styles.cardActionText}>Module 3</Text>
              <MaterialIcons name="arrow-forward" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridCard}
            onPress={() => navigation.navigate('MyMedicines', { uid, mockUser })}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name="inventory" size={24} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Expiry Management</Text>
            <Text style={styles.cardDesc}>Register and trace clinical expiration alerts automatically.</Text>
            <View style={styles.cardAction}>
              <Text style={styles.cardActionText}>Module 4</Text>
              <MaterialIcons name="arrow-forward" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Module 6: Community Experiences & Analytics Bento card */}
        <View style={[styles.grid, { marginTop: 16 }]}>
          <TouchableOpacity 
            style={[styles.gridCard, { width: '100%', flex: 1 }]}
            onPress={() => navigation.navigate('CommunityFeed', { uid, mockUser })}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name="forum" size={24} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Community Safety Feed</Text>
            <Text style={styles.cardDesc}>Read patient-contributed reviews, side effect logs, and verified clinician guidelines.</Text>
            <View style={styles.cardAction}>
              <Text style={styles.cardActionText}>Module 6</Text>
              <MaterialIcons name="arrow-forward" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Community Safety Glass Banner */}
        <View style={[styles.glassRecallBanner, { marginTop: 24 }]}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFKsu46DWbYtts1fuUmo810PE4jvYg2Iak0yyMkHgjZxWNSaK1tVTilKZOjZhpBjYDlfKzAZYkHPZxabCn0jxkv-n7t02jyTuifeihUbcgmnZMG9KUa1MYoD2B9RfjVGykr4IdBg9AZ7M79lfB8PWHr_IQsjrrUpAZ_gqP-Ea4iHfh7m0a-m2kDsI_7LUMKiHLysxJXDkRMi05OWangtieuphTP4PxBaoYuoV9B3xveXXCYFzEW2WsB3_nRA8cG9rswtSwK58tnKlr' }}
            style={styles.recallBannerImage}
          />
          <View style={styles.recallBannerOverlay}>
            <Text style={styles.recallTag}>Local Health Alert</Text>
          </View>
          <View style={styles.recallTextBodyContainer}>
            <Text style={styles.recallTextBody}>
              FDA recall issued for Batch #4092 of generic Aspirin in the Greater Seattle area. Check your cabinet immediately.
            </Text>
            <TouchableOpacity 
              style={styles.recallDetailsBtn}
              onPress={() => {
                Linking.openURL('https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts');
              }}
            >
              <Text style={styles.recallDetailsBtnText}>READ MORE DETAILS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderAlertsTab = () => {
    const alertsList = Object.values(notifications || {});
    
    const filteredAlerts = alertsList.filter(alert => {
      if (alertFilter === 'unread') return alert.unread;
      if (alertFilter === 'critical') return alert.type === 'critical';
      return true; // 'all'
    });

    return (
      <View style={styles.tabContainer}>
        {/* Alerts Sub Header */}
        <View style={styles.alertsHeaderRow}>
          <Text style={styles.tabHeading}>Notifications</Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllReadText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Slider Pills */}
        <View style={styles.filterPillContainer}>
          <TouchableOpacity 
            style={[styles.filterPill, alertFilter === 'all' && styles.filterPillActive]}
            onPress={() => setAlertFilter('all')}
          >
            <Text style={[styles.filterPillLabel, alertFilter === 'all' && styles.filterPillLabelActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterPill, alertFilter === 'unread' && styles.filterPillActive]}
            onPress={() => setAlertFilter('unread')}
          >
            <Text style={[styles.filterPillLabel, alertFilter === 'unread' && styles.filterPillLabelActive]}>
              Unread {unreadAlertsCount > 0 && `(${unreadAlertsCount})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterPill, alertFilter === 'critical' && styles.filterPillActive]}
            onPress={() => setAlertFilter('critical')}
          >
            <Text style={[styles.filterPillLabel, alertFilter === 'critical' && styles.filterPillLabelActive]}>
              Critical {criticalAlertsCount > 0 && `(${criticalAlertsCount})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notification Feed */}
        <ScrollView style={styles.feedScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {filteredAlerts.length === 0 ? (
            <View style={styles.emptyFeedContainer}>
              <MaterialIcons name="notifications-none" size={48} color={colors.outlineVariant} />
              <Text style={styles.emptyFeedText}>No notifications found matching filter.</Text>
            </View>
          ) : (
            filteredAlerts.map((alert) => (
              <TouchableOpacity 
                key={alert.id}
                style={[styles.feedCard, alert.unread && styles.feedCardUnread]}
                onPress={() => handleReadNotification(alert.id, alert.unread)}
                activeOpacity={0.9}
              >
                <View style={styles.feedCardTop}>
                  <View style={[
                    styles.feedIconWrapper, 
                    alert.type === 'critical' && { backgroundColor: colors.error + '1A' },
                    alert.type === 'expiry' && { backgroundColor: '#ffdcc2' }
                  ]}>
                    <MaterialIcons 
                      name={alert.type === 'critical' ? "warning" : alert.type === 'expiry' ? "event-busy" : "settings-suggest"} 
                      size={22} 
                      color={alert.type === 'critical' ? colors.error : alert.type === 'expiry' ? '#e67e22' : colors.outline} 
                    />
                  </View>
                  
                  <View style={styles.feedContent}>
                    <View style={styles.feedMetadata}>
                      <Text style={[
                        styles.feedCategoryText,
                        alert.type === 'critical' && { color: colors.error },
                        alert.type === 'expiry' && { color: '#e67e22' }
                      ]}>
                        {alert.category || 'Safety Alert'}
                      </Text>
                      <Text style={styles.feedTimeText}>{alert.timestamp || '2m ago'}</Text>
                    </View>

                    <Text style={styles.feedTitleText}>{alert.title}</Text>
                    <Text style={styles.feedDescText}>{alert.description}</Text>
                    
                    {alert.actionLabel && (
                      <View style={styles.feedActionsRow}>
                        <TouchableOpacity 
                          style={styles.feedActionPrimaryBtn}
                          onPress={() => {
                            if (alert.actionLabel.includes("AI")) {
                              setConsultingNotifId(alert.id);
                            } else if (alert.actionLabel.includes("Location")) {
                              Linking.openURL('https://www.google.com/maps/search/medication+disposal+location+near+me');
                            } else {
                              Alert.alert("Recall Report Submitted", "MediGuard safety specialists have flagged your clinical batch numbers. Safe disposal coordinates sent to your device.");
                            }
                          }}
                        >
                          <Text style={styles.feedActionPrimaryBtnText}>{alert.actionLabel}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.feedActionDismissBtn}
                          onPress={() => handleDismissNotification(alert.id)}
                        >
                          <Text style={styles.feedActionDismissBtnText}>Dismiss</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {alert.unread && <View style={styles.unreadPillDot} />}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  const renderProfileTab = () => {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.profileHeaderLayout}>
            <View style={styles.avatarBigWrapper}>
              <View style={styles.avatarBig}>
                <Text style={styles.avatarBigText}>
                  {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'P'}
                </Text>
              </View>
              <TouchableOpacity style={styles.editAvatarBadge} onPress={() => setIsEditingProfile(true)}>
                <MaterialIcons name="edit" size={14} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileMetaInfo}>
              <Text style={styles.profileNameText}>{profile?.fullName || 'Clinical User'}</Text>
              <View style={styles.healthIdBadge}>
                <Text style={styles.healthIdBadgeText}>
                  HEALTH ID: {profile?.uid ? `MV-${profile.uid.substring(0, 6).toUpperCase()}` : 'MV-8829-XP'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editBtnCircle} onPress={() => setIsEditingProfile(true)}>
              <MaterialIcons name="edit" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Adherence Bento Stats */}
        <View style={styles.profileBentoStats}>
          <View style={styles.bentoAdherenceCard}>
            <Text style={styles.bentoStatPercentage}>{adherenceRate}%</Text>
            <Text style={styles.bentoStatLabel}>ADHERENCE</Text>
            <View style={[
              styles.adherenceStatusPill, 
              { backgroundColor: adherenceRate >= 80 ? '#e8f5e9' : '#fff3e0' }
            ]}>
              <Text style={[
                styles.adherenceStatusText,
                { color: adherenceRate >= 80 ? '#2e7d32' : '#e65100' }
              ]}>
                {adherenceRate >= 90 ? 'EXCELLENT' : adherenceRate >= 70 ? 'GOOD' : 'ATTENTION'}
              </Text>
            </View>
          </View>

          <View style={styles.bentoMedsCard}>
            <Text style={[styles.bentoStatPercentage, { color: '#e67e22' }]}>{totalDoses}</Text>
            <Text style={styles.bentoStatLabel}>ACTIVE MEDS</Text>
            <View style={[styles.adherenceStatusPill, { backgroundColor: '#fff3e0' }]}>
              <Text style={[styles.adherenceStatusText, { color: '#e65100' }]}>TRACKED</Text>
            </View>
          </View>
        </View>

        {/* Personal Details Card */}
        <View style={styles.clinicalDataCard}>
          <View style={styles.cardSectionHeaderRow}>
            <Text style={styles.cardSectionHeaderTitle}>Personal Information</Text>
            <MaterialIcons name="info" size={20} color={colors.outline} />
          </View>

          <View style={styles.personalDataGrid}>
            <View style={styles.gridDataRow}>
              <View style={styles.gridItemHalf}>
                <Text style={styles.gridItemLabel}>Date of Birth</Text>
                <Text style={styles.gridItemValue}>{profile?.dob || 'May 14, 1978'}</Text>
              </View>
              <View style={styles.gridItemHalf}>
                <Text style={styles.gridItemLabel}>Blood Type</Text>
                <Text style={[styles.gridItemValue, { color: colors.error, fontWeight: '700' }]}>
                  {profile?.bloodType || 'O Positive (O+)'}
                </Text>
              </View>
            </View>

            <View style={styles.gridDataDivider} />

            <View style={styles.allergiesSection}>
              <Text style={styles.gridItemLabel}>Allergies & Sensitivities</Text>
              <View style={styles.allergiesPillsContainer}>
                {(profile?.allergies || ['Penicillin', 'Shellfish', 'Lactose']).map((allergy, index) => (
                  <View 
                    key={allergy + index} 
                    style={[
                      styles.allergyPill, 
                      (allergy.toLowerCase().includes('penicillin') || allergy.toLowerCase().includes('shellfish')) 
                        ? styles.allergyPillCritical 
                        : styles.allergyPillNormal
                    ]}
                  >
                    {(allergy.toLowerCase().includes('penicillin') || allergy.toLowerCase().includes('shellfish')) && (
                      <MaterialIcons name="warning" size={12} color={colors.error} style={{ marginRight: 4 }} />
                    )}
                    <Text style={[
                      styles.allergyPillText,
                      (allergy.toLowerCase().includes('penicillin') || allergy.toLowerCase().includes('shellfish'))
                        ? { color: colors.error }
                        : { color: colors.textSecondary }
                    ]}>
                      {allergy}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.contactsSection}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <View style={styles.contactsStack}>
            {(profile?.contacts || [
              { id: '1', name: 'Sarah Wilson', relation: 'Spouse', type: 'Primary', phone: '555-0123' },
              { id: '2', name: 'Dr. Aris', relation: 'Cardiologist', type: 'Specialist', phone: '555-0987' }
            ]).map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View style={styles.contactLeft}>
                  <View style={styles.contactInitialsWrapper}>
                    <Text style={styles.contactInitials}>
                      {contact.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.contactDetails}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactRelation}>{contact.relation} • {contact.type}</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.callCircleBtn}
                  onPress={() => {
                    const phoneUrl = `tel:${contact.phone}`;
                    Linking.canOpenURL(phoneUrl)
                      .then(supported => {
                        if (supported) {
                          Linking.openURL(phoneUrl);
                        } else {
                          Alert.alert("Not Supported", "Calling is not supported on this simulator device.");
                        }
                      });
                  }}
                >
                  <MaterialIcons name="call" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons Link Card */}
        <View style={styles.actionButtonsCabinet}>
          <TouchableOpacity 
            style={styles.actionCabinetBtn}
            onPress={() => navigation.navigate('ExistingConditions', { uid, mockUser })}
          >
            <View style={styles.btnCabinetLeft}>
              <MaterialIcons name="psychology" size={20} color={colors.outline} />
              <Text style={styles.actionCabinetBtnText}>Chronic Health Conditions</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCabinetBtn}>
            <View style={styles.btnCabinetLeft}>
              <MaterialIcons name="security" size={20} color={colors.outline} />
              <Text style={styles.actionCabinetBtnText}>Privacy & Data Permissions</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCabinetBtn}>
            <View style={styles.btnCabinetLeft}>
              <MaterialIcons name="history" size={20} color={colors.outline} />
              <Text style={styles.actionCabinetBtnText}>Medication History Export</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCabinetBtn, { borderBottomWidth: 0 }]} onPress={handleLogout}>
            <View style={styles.btnCabinetLeft}>
              <MaterialIcons name="logout" size={20} color={colors.error} />
              <Text style={[styles.actionCabinetBtnText, { color: colors.error, fontWeight: '700' }]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderSettingsTab = () => {
    const preferences = profile?.preferences || { pushEnabled: true, emailEnabled: false, smsEnabled: true };
    
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* App Info Header */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.tabHeading}>Settings</Text>
            <Text style={styles.welcomeSubtitle}>Manage preferences & database synchronizations</Text>
          </View>
        </View>

        {/* Notification Switches */}
        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>Notification Settings</Text>
          <View style={styles.settingsBlock}>
            {/* Push Reminders */}
            <View style={styles.settingsRow}>
              <View style={styles.settingsRowLeft}>
                <View style={styles.settingsIconCircle}>
                  <MaterialIcons name="notifications-active" size={20} color={colors.outline} />
                </View>
                <View>
                  <Text style={styles.settingsLabel}>Push Reminders</Text>
                  <Text style={styles.settingsSubLabel}>Daily dose alerts</Text>
                </View>
              </View>
              <Switch 
                value={preferences.pushEnabled}
                onValueChange={() => handlePreferenceToggle('pushEnabled', preferences.pushEnabled)}
                trackColor={{ false: colors.outlineVariant, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            {/* Email Reports */}
            <View style={styles.settingsRow}>
              <View style={styles.settingsRowLeft}>
                <View style={styles.settingsIconCircle}>
                  <MaterialIcons name="mail" size={20} color={colors.outline} />
                </View>
                <View>
                  <Text style={styles.settingsLabel}>Email Reports</Text>
                  <Text style={styles.settingsSubLabel}>Weekly safety summaries</Text>
                </View>
              </View>
              <Switch 
                value={preferences.emailEnabled}
                onValueChange={() => handlePreferenceToggle('emailEnabled', preferences.emailEnabled)}
                trackColor={{ false: colors.outlineVariant, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            {/* SMS Alerts */}
            <View style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
              <View style={styles.settingsRowLeft}>
                <View style={styles.settingsIconCircle}>
                  <MaterialIcons name="sms" size={20} color={colors.outline} />
                </View>
                <View>
                  <Text style={styles.settingsLabel}>SMS Alerts</Text>
                  <Text style={styles.settingsSubLabel}>Critical emergency warnings</Text>
                </View>
              </View>
              <Switch 
                value={preferences.smsEnabled}
                onValueChange={() => handlePreferenceToggle('smsEnabled', preferences.smsEnabled)}
                trackColor={{ false: colors.outlineVariant, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* General Preferences */}
        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>Preferences</Text>
          <View style={styles.settingsBlock}>
            <TouchableOpacity style={styles.settingsRowBtn}>
              <View style={styles.settingsRowLeft}>
                <View style={styles.settingsIconCircle}>
                  <MaterialIcons name="language" size={20} color={colors.outline} />
                </View>
                <View>
                  <Text style={styles.settingsLabel}>Language</Text>
                  <Text style={styles.settingsSubLabel}>English (US)</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsRowBtn}>
              <View style={styles.settingsRowLeft}>
                <View style={styles.settingsIconCircle}>
                  <MaterialIcons name="dark-mode" size={20} color={colors.outline} />
                </View>
                <View>
                  <Text style={styles.settingsLabel}>Theme</Text>
                  <Text style={styles.settingsSubLabel}>Light mode</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingsRowBtn, { borderBottomWidth: 0 }]}>
              <View style={styles.settingsRowLeft}>
                <View style={styles.settingsIconCircle}>
                  <MaterialIcons name="straighten" size={20} color={colors.outline} />
                </View>
                <View>
                  <Text style={styles.settingsLabel}>Measurement Units</Text>
                  <Text style={styles.settingsSubLabel}>Metric (kg, ml)</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Preferences */}
        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>Security</Text>
          <View style={styles.settingsBlock}>
            <TouchableOpacity style={styles.settingsRowBtn}>
              <View style={styles.settingsRowLeft}>
                <View style={styles.settingsIconCircle}>
                  <MaterialIcons name="lock" size={20} color={colors.outline} />
                </View>
                <View>
                  <Text style={styles.settingsLabel}>Change Password</Text>
                  <Text style={styles.settingsSubLabel}>Last updated 3 months ago</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
            </TouchableOpacity>

            <View style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
              <View style={styles.settingsRowLeft}>
                <View style={styles.settingsIconCircle}>
                  <MaterialIcons name="fingerprint" size={20} color={colors.outline} />
                </View>
                <View>
                  <Text style={styles.settingsLabel}>Biometric Login</Text>
                  <Text style={styles.settingsSubLabel}>Use FaceID or TouchID</Text>
                </View>
              </View>
              <Switch 
                value={true} 
                onValueChange={() => Alert.alert("FaceID Security", "Biometrics locked to local operating systems safety modules.")} 
                trackColor={{ false: colors.outlineVariant, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* Support Block */}
        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>Support</Text>
          <View style={styles.settingsBlock}>
            <TouchableOpacity style={styles.settingsRowBtn}>
              <View style={styles.settingsRowLeft}>
                <View style={styles.settingsIconCircle}>
                  <MaterialIcons name="quiz" size={20} color={colors.outline} />
                </View>
                <Text style={[styles.settingsLabel, { fontSize: 15 }]}>Frequently Asked Questions</Text>
              </View>
              <MaterialIcons name="open-in-new" size={16} color={colors.outline} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingsRowBtn, { borderBottomWidth: 0 }]}>
              <View style={styles.settingsRowLeft}>
                <View style={styles.settingsIconCircle}>
                  <MaterialIcons name="support-agent" size={20} color={colors.outline} />
                </View>
                <Text style={[styles.settingsLabel, { fontSize: 15 }]}>Contact Support Team</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Big Logout Button */}
        <TouchableOpacity style={styles.logoutSettingBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutSettingText}>Sign Out Session</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      
      {/* Dynamic Top App Bar Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <MaterialIcons name="health-and-safety" size={28} color={colors.primary} />
          <Text style={styles.headerText}>MedVigilance</Text>
        </View>
        
        {/* Network Badge Status */}
        <View style={styles.cloudBadge}>
          <View style={[styles.greenActiveDot, { backgroundColor: mockUser ? '#e67e22' : colors.secondary }]} />
          <Text style={styles.cloudBadgeText}>{mockUser ? 'Offline' : 'Firebase Live'}</Text>
        </View>
      </View>

      {/* Main Tab Rendering Pipeline */}
      {activeTab === 'dashboard' && renderDashboardTab()}
      {activeTab === 'alerts' && renderAlertsTab()}
      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'settings' && renderSettingsTab()}

      {/* -------------------------------------------------------------
          MODALS & BOTTOM SHEETS
          ------------------------------------------------------------- */}

      {/* 1. Add Medicine Modal / Sheet */}
      <Modal
        visible={isAddingMed}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddingMed(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add Medication</Text>
              <TouchableOpacity onPress={() => setIsAddingMed(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sheetBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Medication Name</Text>
                <TextInput 
                  style={styles.sheetInput}
                  placeholder="e.g. Lisinopril"
                  value={newMedName}
                  onChangeText={setNewMedName}
                  placeholderTextColor={colors.outline}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dosage Amount</Text>
                <TextInput 
                  style={styles.sheetInput}
                  placeholder="e.g. 10mg / 1 Capsule"
                  value={newMedDosage}
                  onChangeText={setNewMedDosage}
                  placeholderTextColor={colors.outline}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Schedule Time</Text>
                <View style={styles.timeSelectionRow}>
                  {['08:00 AM', '09:00 AM', '02:00 PM', '09:00 PM'].map((t) => (
                    <TouchableOpacity 
                      key={t}
                      style={[styles.timeSelectBtn, newMedTime === t && styles.timeSelectBtnActive]}
                      onPress={() => setNewMedTime(t)}
                    >
                      <Text style={[styles.timeSelectText, newMedTime === t && styles.timeSelectTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Instructions / Notes</Text>
                <TextInput 
                  style={[styles.sheetInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="e.g. Take with food in morning"
                  multiline={true}
                  value={newMedInstructions}
                  onChangeText={setNewMedInstructions}
                  placeholderTextColor={colors.outline}
                />
              </View>

              <TouchableOpacity style={styles.saveMedSubmitBtn} onPress={handleAddMedication}>
                <Text style={styles.saveMedSubmitBtnText}>Register Medication</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. AI Consultant Modal */}
      <Modal
        visible={consultingNotifId !== null}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.aiModalCard}>
            <View style={styles.aiHeaderRow}>
              <View style={styles.aiLogoRow}>
                <Ionicons name="sparkles" size={20} color={colors.primary} />
                <Text style={styles.aiTitle}>MediGuard Clinical AI</Text>
              </View>
              <TouchableOpacity onPress={() => setConsultingNotifId(null)}>
                <MaterialIcons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.aiContentContainer}>
              <View style={styles.aiPromptBubble}>
                <Text style={styles.aiPromptText}>
                  "Analyze safety warning regarding Lisinopril interaction warning."
                </Text>
              </View>

              <View style={styles.aiResponseBubble}>
                <Text style={styles.aiResponseText}>
                  <Text style={{ fontWeight: '700', color: colors.primary }}>Clinical Assessment:</Text>{"\n\n"}
                  The warning is triggered by chemical overlap that may reduce the effectiveness of Lisinopril or cause sudden variations in blood pressure levels.{"\n\n"}
                  <Text style={{ fontWeight: '700', color: colors.error }}>Recommendation:</Text>{"\n"}
                  1. Temporarily hold the new supplement dosage.{"\n"}
                  2. Maintain normal scheduled ingestion of Lisinopril 10mg with food.{"\n"}
                  3. Contact your primary provider. Call button is accessible inside your Profile contacts tab.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={styles.aiCloseSubmitBtn}
              onPress={() => setConsultingNotifId(null)}
            >
              <Text style={styles.aiCloseSubmitBtnText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. Profile Editing Modal */}
      <Modal
        visible={isEditingProfile}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Edit Profile Information</Text>
              <TouchableOpacity onPress={() => setIsEditingProfile(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sheetBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput 
                  style={styles.sheetInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholderTextColor={colors.outline}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TextInput 
                  style={styles.sheetInput}
                  value={editDob}
                  onChangeText={setEditDob}
                  placeholderTextColor={colors.outline}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Blood Type</Text>
                <TextInput 
                  style={styles.sheetInput}
                  value={editBloodType}
                  onChangeText={setEditBloodType}
                  placeholderTextColor={colors.outline}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Allergies (comma separated)</Text>
                <TextInput 
                  style={[styles.sheetInput, { height: 60 }]}
                  multiline={true}
                  value={editAllergies}
                  onChangeText={setEditAllergies}
                  placeholderTextColor={colors.outline}
                />
              </View>

              <TouchableOpacity style={styles.saveMedSubmitBtn} onPress={handleSaveProfile}>
                <Text style={styles.saveMedSubmitBtnText}>Save Profile Details</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* -------------------------------------------------------------
          BOTTOM NAVIGATION BAR
          ------------------------------------------------------------- */}
      <View style={styles.navBar}>
        
        {/* Dashboard Tab Button */}
        <TouchableOpacity 
          style={[styles.navBtn, activeTab === 'dashboard' && styles.navBtnActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <MaterialIcons 
            name="dashboard" 
            size={24} 
            color={activeTab === 'dashboard' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[styles.navLabel, activeTab === 'dashboard' && styles.navLabelActive]}>Dashboard</Text>
        </TouchableOpacity>

        {/* Alerts Tab Button */}
        <TouchableOpacity 
          style={[styles.navBtn, activeTab === 'alerts' && styles.navBtnActive]}
          onPress={() => setActiveTab('alerts')}
        >
          <View style={styles.alertIconBadgeContainer}>
            <MaterialIcons 
              name="notifications-active" 
              size={24} 
              color={activeTab === 'alerts' ? colors.primary : colors.textSecondary} 
            />
            {unreadAlertsCount > 0 && (
              <View style={styles.miniRedDotBadge}>
                <Text style={styles.miniRedDotBadgeText}>{unreadAlertsCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.navLabel, activeTab === 'alerts' && styles.navLabelActive]}>Alerts</Text>
        </TouchableOpacity>

        {/* Profile Tab Button */}
        <TouchableOpacity 
          style={[styles.navBtn, activeTab === 'profile' && styles.navBtnActive]}
          onPress={() => setActiveTab('profile')}
        >
          <MaterialIcons 
            name="person" 
            size={24} 
            color={activeTab === 'profile' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>Profile</Text>
        </TouchableOpacity>

        {/* Settings Tab Button */}
        <TouchableOpacity 
          style={[styles.navBtn, activeTab === 'settings' && styles.navBtnActive]}
          onPress={() => setActiveTab('settings')}
        >
          <MaterialIcons 
            name="settings" 
            size={24} 
            color={activeTab === 'settings' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[styles.navLabel, activeTab === 'settings' && styles.navLabelActive]}>Settings</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  cloudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  greenActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cloudBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
  },
  tabContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 80,
  },
  tabHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeLeft: {
    flex: 1,
    paddingRight: 16,
  },
  welcomeGreeting: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 18,
  },
  avatarMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  avatarMiniText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimaryFixed,
  },
  bentoSection: {
    marginBottom: 24,
  },
  bentoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bentoSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  bentoBadge: {
    backgroundColor: colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bentoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.onSecondaryFixed,
  },
  bentoCardsStack: {
    gap: 10,
  },
  bentoAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  alertIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContentText: {
    flex: 1,
  },
  alertCardHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  alertCardBody: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  alertPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  alertPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickActionBtn: {
    flex: 1,
    height: 72,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  quickActionGhost: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  upcomingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  medsStack: {
    gap: 10,
  },
  emptyMedsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  emptyMedsText: {
    fontSize: 13,
    color: colors.outline,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyAddBtn: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  medCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 14,
  },
  medCardCompleted: {
    opacity: 0.6,
  },
  medCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medTimeCol: {
    alignItems: 'center',
    minWidth: 44,
  },
  medTimeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  medTimeAmPm: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.outline,
  },
  medTextMuted: {
    color: colors.outline,
  },
  indicatorBar: {
    width: 2,
    height: 32,
    marginHorizontal: 12,
    borderRadius: 1,
  },
  medInfoCol: {
    flex: 1,
  },
  medNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  medNameCompleted: {
    textDecorationLine: 'line-through',
  },
  medDosageText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  takenLabelText: {
    fontSize: 10,
    color: colors.secondary,
    fontWeight: '700',
    marginTop: 3,
  },
  checkCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleBtnActive: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  checkCircleBtnSuccess: {
    backgroundColor: colors.secondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridCard: {
    width: '47.5%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 16,
    shadowColor: colors.outline,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
    marginBottom: 12,
    minHeight: 45,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  glassRecallBanner: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  recallBannerImage: {
    width: '100%',
    height: 96,
    resizeMode: 'cover',
  },
  recallBannerOverlay: {
    position: 'absolute',
    top: 68,
    left: 12,
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recallTag: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
    textTransform: 'uppercase',
  },
  recallTextBodyContainer: {
    padding: 14,
  },
  recallTextBody: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
  recallDetailsBtn: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  recallDetailsBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },

  // Tab 2 Styles
  alertsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  markAllReadText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  filterPillContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    padding: 4,
    borderRadius: 10,
    marginBottom: 16,
    gap: 4,
  },
  filterPill: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterPillLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterPillLabelActive: {
    color: colors.primary,
  },
  feedScroll: {
    flex: 1,
  },
  emptyFeedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyFeedText: {
    fontSize: 13,
    color: colors.outline,
    fontWeight: '600',
    marginTop: 12,
  },
  feedCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 14,
    marginBottom: 12,
  },
  feedCardUnread: {
    borderColor: colors.primaryFixed,
    backgroundColor: colors.primaryFixed + '08',
  },
  feedCardTop: {
    flexDirection: 'row',
    gap: 12,
    position: 'relative',
  },
  feedIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedContent: {
    flex: 1,
    paddingRight: 8,
  },
  feedMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  feedCategoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.outline,
    textTransform: 'uppercase',
  },
  feedTimeText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.outline,
  },
  feedTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  feedDescText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
  unreadPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  feedActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  feedActionPrimaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  feedActionPrimaryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  feedActionDismissBtn: {
    borderWidth: 1,
    borderColor: colors.outline,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  feedActionDismissBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  // Tab 3 Styles
  profileHeaderCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  profileHeaderLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    position: 'relative',
    flex: 1,
  },
  avatarBigWrapper: {
    position: 'relative',
  },
  avatarBig: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  avatarBigText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.onPrimaryFixed,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  profileMetaInfo: {
    flex: 1,
  },
  profileNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  healthIdBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant,
  },
  healthIdBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  editBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBentoStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  bentoAdherenceCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  bentoMedsCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  bentoStatPercentage: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    lineHeight: 34,
  },
  bentoStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 6,
  },
  adherenceStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adherenceStatusText: {
    fontSize: 8,
    fontWeight: '800',
  },
  clinicalDataCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
    marginBottom: 24,
  },
  cardSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  cardSectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  personalDataGrid: {
    padding: 16,
  },
  gridDataRow: {
    flexDirection: 'row',
  },
  gridItemHalf: {
    flex: 1,
  },
  gridItemLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.outline,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  gridItemValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  gridDataDivider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginVertical: 12,
  },
  allergiesSection: {
    gap: 6,
  },
  allergiesPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  allergyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  allergyPillCritical: {
    backgroundColor: colors.error + '1A',
  },
  allergyPillNormal: {
    backgroundColor: colors.surfaceContainerLow,
  },
  allergyPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  contactsSection: {
    marginBottom: 24,
  },
  contactsStack: {
    gap: 10,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 14,
    padding: 12,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactInitialsWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onPrimaryFixed,
  },
  contactDetails: {
    gap: 2,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  contactRelation: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  callCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonsCabinet: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 40,
  },
  actionCabinetBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant + '4D',
  },
  btnCabinetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionCabinetBtnText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },

  // Settings Styles
  settingsSection: {
    marginBottom: 20,
  },
  settingsSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
  },
  settingsBlock: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant + '4D',
  },
  settingsRowBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant + '4D',
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  settingsSubLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  logoutSettingBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    height: 48,
    marginBottom: 100,
    backgroundColor: colors.error + '05',
  },
  logoutSettingText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.error,
  },

  // Modals & Sheets Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  sheetBody: {
    padding: 24,
    paddingBottom: 64,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  sheetInput: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    backgroundColor: colors.surfaceContainerLow,
  },
  timeSelectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSelectBtn: {
    flex: 1,
    minWidth: '22%',
    height: 38,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  timeSelectBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFixed,
  },
  timeSelectText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  timeSelectTextActive: {
    color: colors.primary,
  },
  saveMedSubmitBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveMedSubmitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },

  // AI Modal Styles
  aiModalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: width - 48,
    maxHeight: '80%',
    alignSelf: 'center',
    marginVertical: 'auto',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingBottom: 12,
    marginBottom: 16,
  },
  aiLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  aiContentContainer: {
    gap: 12,
  },
  aiPromptPromptText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.outline,
    textTransform: 'uppercase',
  },
  aiPromptBubble: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 10,
    padding: 10,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant,
  },
  aiPromptText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  aiResponseBubble: {
    backgroundColor: colors.primaryFixed + '12',
    borderWidth: 1,
    borderColor: colors.primaryFixed,
    borderRadius: 12,
    padding: 14,
  },
  aiResponseText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    fontWeight: '500',
  },
  aiCloseSubmitBtn: {
    backgroundColor: colors.primary,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  aiCloseSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },

  // Navigation styles
  navBar: {
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
    paddingBottom: 8,
  },
  navBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  navBtnActive: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    paddingTop: -2,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  navLabelActive: {
    color: colors.primary,
  },
  alertIconBadgeContainer: {
    position: 'relative',
  },
  miniRedDotBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  miniRedDotBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.white,
  },
  dashSearchBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  dashSearchIcon: {
    marginRight: 12,
  },
  dashSearchPlaceholder: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.outline,
  },
});

export default DashboardScreen;
