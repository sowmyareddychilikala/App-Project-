import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
   
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
  StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { signOutUser, resetUserPassword } from '../../services/authService';
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
  seedDefaultClinicalData,
  getLocalMedications,
  getLocalUserProfile 
} from '../../services/dbService';
import { seedMedicinesCollection, getLiveSuggestions, saveRecentSearch } from '../../services/medicineService';
import { sessionManager } from '../../services/sessionManager';
import { auth } from '../../../firebaseConfig';

const { width } = Dimensions.get('window');

const convertTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const str = timeStr.trim().toUpperCase();
  const isPM = str.includes('PM');
  const isAM = str.includes('AM');

  const match = str.match(/(\d+):(\d+)/);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
};

const getTodayIso = () => new Date().toISOString().split('T')[0];

const getFutureIso = (daysAhead = 30) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

const normalizeDateStr = (input) => {
  if (!input) return '';
  if (input instanceof Date) {
    return input.toISOString().split('T')[0];
  }
  const str = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return str;
};

const isMedActiveToday = (med, targetDateIso = getTodayIso()) => {
  if (!med) return false;
  const start = normalizeDateStr(med.startDate || med.createdAt) || '1970-01-01';
  const end = normalizeDateStr(med.endDate) || '2099-12-31';
  return targetDateIso >= start && targetDateIso <= end;
};

const isMedTakenOnDate = (med, targetDateIso = getTodayIso(), timeKey) => {
  if (!med) return false;
  const key = timeKey || med.time || '09:00 AM';
  const dayLog = med.takenLogs?.[targetDateIso]?.[key];
  if (dayLog && typeof dayLog.taken === 'boolean') {
    return dayLog.taken;
  }
  if (targetDateIso === getTodayIso()) {
    return med.takenStatus ?? (med.taken ?? false);
  }
  return false;
};

const getMedTakenTimeOnDate = (med, targetDateIso = getTodayIso(), timeKey) => {
  if (!med) return '';
  const key = timeKey || med.time || '09:00 AM';
  const dayLog = med.takenLogs?.[targetDateIso]?.[key];
  if (dayLog && dayLog.takenTime) {
    return dayLog.takenTime;
  }
  if (targetDateIso === getTodayIso()) {
    return med.takenTime || '';
  }
  return '';
};

export const DashboardScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;
  
  // Navigation active tab: 'dashboard', 'alerts', 'profile', 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Check if active session already exists in memory
  const userSessionId = uid || (mockUser ? 'mock_user' : null);
  const hasSession = sessionManager.hasValidSession(userSessionId);
  const activeSessionObj = sessionManager.getActiveSession();

  // Shared Real-time Database state
  const [profile, setProfile] = useState(activeSessionObj?.profile || null);
  const [medications, setMedications] = useState({});
  const [notifications, setNotifications] = useState({});
  const [loading, setLoading] = useState(!hasSession && !activeSessionObj?.profile && !uid);

  // Tab 1: Dashboard states
  const [dashSearchQuery, setDashSearchQuery] = useState('');
  const [dashSuggestions, setDashSuggestions] = useState([]);

  const handleDashQueryChange = (text) => {
    setDashSearchQuery(text);
    setDashSuggestions(getLiveSuggestions(text));
  };

  const handleDashSearchSubmit = (queryToRun) => {
    const q = (queryToRun || dashSearchQuery).trim();
    if (q) {
      saveRecentSearch(q);
      navigation.navigate('SearchResults', { uid, mockUser, query: q });
    } else {
      navigation.navigate('MedicineSearch', { uid, mockUser });
    }
  };
  const [editingMedId, setEditingMedId] = useState(null);
  const [isAddingMed, setIsAddingMed] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedType, setNewMedType] = useState('Tablet');
  const [newMedTime, setNewMedTime] = useState('09:00 AM');
  const [newMedFrequency, setNewMedFrequency] = useState('Once daily');
  const [newMedInstructions, setNewMedInstructions] = useState('');
  const [newMedStartDate, setNewMedStartDate] = useState(getTodayIso());
  const [newMedEndDate, setNewMedEndDate] = useState(getFutureIso(30));

  // Tab 2: Alerts states
  const [alertFilter, setAlertFilter] = useState('all');
  const [consultingNotifId, setConsultingNotifId] = useState(null);

  // Tab 3: Profile edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editBloodType, setEditBloodType] = useState('');
  const [editAllergies, setEditAllergies] = useState('');

  // Tab 4: Simplified Settings states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

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
        notificationsEnabled: true,
        darkMode: false
      }
    },
    medications: {},
    notifications: {}
  });

  // Seed default data & setup real-time DB listeners
  useEffect(() => {
    // Log & check session status
    sessionManager.fetchSecureClinicalSession(
      userSessionId || 'guest_user',
      'DashboardScreen',
      hasSession ? 'Existing Active Session Reused' : 'Initial App Session Initialization'
    );

    AsyncStorage.getItem('@meditrust_dark_mode').then(val => {
      if (val !== null) setIsDarkMode(JSON.parse(val));
    }).catch(() => {});

    const loadFallbackMockData = async () => {
      setProfile(mockState.profile);
      sessionManager.updateSessionProfile(mockState.profile);
      const localMeds = await getLocalMedications(uid);
      if (localMeds && Object.keys(localMeds).length > 0) {
        setMedications(localMeds);
      }
      setNotifications(mockState.notifications);
      
      setEditName(mockState.profile.fullName);
      setEditDob(mockState.profile.dob);
      setEditBloodType(mockState.profile.bloodType);
      setEditAllergies(mockState.profile.allergies.join(', '));
      
      setLoading(false);
    };

    // Immediately load local profile/meds from cache so screen opens in 0ms
    const activeUid = auth?.currentUser?.uid || uid;

    // Reset local state per active UID to prevent state leakage between user sessions
    setProfile(null);
    setMedications({});
    setNotifications({});

    if (activeUid) {
      getLocalUserProfile(activeUid).then(cachedProf => {
        if (cachedProf && Object.keys(cachedProf).length > 0 && cachedProf.uid === activeUid) {
          setProfile(cachedProf);
          setEditName(cachedProf.fullName || '');
          setEditDob(cachedProf.dob || '');
          setEditBloodType(cachedProf.bloodType || '');
          setEditAllergies(Array.isArray(cachedProf.allergies) ? cachedProf.allergies.join(', ') : (cachedProf.allergies || ''));
          if (cachedProf.preferences) {
            if (typeof cachedProf.preferences.notificationsEnabled === 'boolean') {
              setNotificationsEnabled(cachedProf.preferences.notificationsEnabled);
            }
            if (typeof cachedProf.preferences.darkMode === 'boolean') {
              setIsDarkMode(cachedProf.preferences.darkMode);
            }
          }
          setLoading(false);
        }
      });

      getLocalMedications(activeUid).then(cachedMeds => {
        if (cachedMeds && Object.keys(cachedMeds).length > 0) {
          setMedications(cachedMeds);
        }
      });
    } else {
      setLoading(false);
    }

    if (mockUser && !activeUid) {
      loadFallbackMockData();
      return;
    }

    if (activeUid) {
      // Non-blocking background seed
      seedDefaultClinicalData(activeUid).catch(() => {});
      seedMedicinesCollection().catch(() => {});

      // Set up real-time Firebase listeners (update UI seamlessly in background)
      const unsubProfile = listenUserProfile(
        activeUid, 
        (data) => {
          if (data && Object.keys(data).length > 0) {
            setProfile(data);
            sessionManager.updateSessionProfile(data);
            setEditName(data.fullName || '');
            setEditDob(data.dob || '');
            setEditBloodType(data.bloodType || '');
            setEditAllergies(Array.isArray(data.allergies) ? data.allergies.join(', ') : (data.allergies || ''));
            if (data.preferences) {
              if (typeof data.preferences.notificationsEnabled === 'boolean') {
                setNotificationsEnabled(data.preferences.notificationsEnabled);
              }
              if (typeof data.preferences.darkMode === 'boolean') {
                setIsDarkMode(data.preferences.darkMode);
              }
            }
          } else {
            const rawDefaultName = auth?.currentUser?.displayName || (auth?.currentUser?.email ? auth.currentUser.email.split('@')[0] : '');
            const formattedDefaultName = rawDefaultName ? (rawDefaultName.charAt(0).toUpperCase() + rawDefaultName.slice(1)) : 'User';
            const cleanProf = {
              uid: activeUid,
              fullName: formattedDefaultName,
              email: auth?.currentUser?.email || '',
              dob: '',
              bloodType: '',
              allergies: [],
              contacts: []
            };
            setProfile(prev => prev || cleanProf);
            sessionManager.updateSessionProfile(cleanProf);
          }
          setLoading(false);
        },
        (err) => {
          setLoading(false);
        }
      );

      const unsubMeds = listenUserMedications(
        activeUid, 
        (data) => {
          setMedications(data || {});
        },
        (err) => {}
      );

      const unsubNotifs = listenUserNotifications(
        activeUid, 
        (data) => {
          setNotifications(data || {});
        },
        (err) => {}
      );

      return () => {
        if (typeof unsubProfile === 'function') unsubProfile();
        if (typeof unsubMeds === 'function') unsubMeds();
        if (typeof unsubNotifs === 'function') unsubNotifs();
      };
    } else {
      setLoading(false);
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
              sessionManager.clearSession();
              setProfile(null);
              setMedications({});
              setNotifications({});
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
  const handleToggleTaken = async (medId, currentState, scheduledTime) => {
    const medItem = medications[medId] || {};
    const medName = medItem.name || medItem.medicineName || 'Medication';
    const nextTakenState = !currentState;
    const now = new Date();
    const todayIso = getTodayIso();
    const timeKey = scheduledTime || medItem.time || '09:00 AM';
    const formattedTime = nextTakenState 
      ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : '';

    // 1. Immediate optimistic React state update for instant UI feedback
    setMedications(prev => {
      const item = prev[medId] || {};
      const existingLogs = item.takenLogs || {};
      const dayLog = existingLogs[todayIso] || {};
      const updatedDayLog = {
        ...dayLog,
        [timeKey]: { taken: nextTakenState, takenTime: formattedTime }
      };
      return {
        ...prev,
        [medId]: {
          ...item,
          taken: nextTakenState,
          takenStatus: nextTakenState,
          takenTime: formattedTime,
          takenLogs: {
            ...existingLogs,
            [todayIso]: updatedDayLog
          }
        }
      };
    });

    if (mockUser) {
      setMockState(prev => {
        const nextMeds = { ...prev.medications };
        if (nextMeds[medId]) {
          const existingLogs = nextMeds[medId].takenLogs || {};
          const dayLog = existingLogs[todayIso] || {};
          nextMeds[medId] = {
            ...nextMeds[medId],
            taken: nextTakenState,
            takenStatus: nextTakenState,
            takenTime: formattedTime,
            takenLogs: {
              ...existingLogs,
              [todayIso]: {
                ...dayLog,
                [timeKey]: { taken: nextTakenState, takenTime: formattedTime }
              }
            }
          };
        }
        return { ...prev, medications: nextMeds };
      });
      Alert.alert(
        "Medication Tracker",
        nextTakenState 
          ? `✓ Marked ${medName} as taken at ${formattedTime}.` 
          : `Marked ${medName} as pending.`
      );
      return;
    }

    try {
      // 2. Write update to Firebase database with dateStr and timeKey
      const res = await toggleMedicationTakenState(uid, medId, nextTakenState, todayIso, timeKey);
      const actualTime = res?.takenTime || formattedTime;

      setMedications(prev => {
        const item = prev[medId] || {};
        const existingLogs = item.takenLogs || {};
        const dayLog = existingLogs[todayIso] || {};
        return {
          ...prev,
          [medId]: {
            ...item,
            taken: nextTakenState,
            takenStatus: nextTakenState,
            takenTime: actualTime,
            takenLogs: {
              ...existingLogs,
              [todayIso]: {
                ...dayLog,
                [timeKey]: { taken: nextTakenState, takenTime: actualTime }
              }
            }
          }
        };
      });

      // 3. Show clear success confirmation
      Alert.alert(
        "Dose Recorded",
        nextTakenState 
          ? `✓ Marked ${medName} as taken at ${actualTime}. Recorded successfully.` 
          : `Marked ${medName} as pending.`
      );
    } catch (err) {
      console.error("Failed to update medication taken state:", err);

      let errorMessage = "Unable to connect to database. Please check your internet connection.";
      if (err?.code === 'PERMISSION_DENIED' || err?.message?.includes('permission_denied')) {
        errorMessage = "Permission denied: Firebase database write was refused. Please sign out and sign in again to refresh your session.";
      } else if (err?.message) {
        errorMessage = `Database update failed: ${err.message}`;
      }

      Alert.alert("Medication Tracker Error", errorMessage);
    }
  };

  // Helper: edit existing medication
  const handleEditMedication = (med) => {
    if (!med) return;
    setEditingMedId(med.id);
    setNewMedName(med.medicineName || med.name || '');
    setNewMedDosage(med.dosage || '');
    setNewMedType(med.medicineType || med.type || 'Tablet');
    setNewMedTime(med.time || '09:00 AM');
    setNewMedFrequency(med.frequency || 'Once daily');
    setNewMedInstructions(med.instructions || '');
    setNewMedStartDate(normalizeDateStr(med.startDate) || getTodayIso());
    setNewMedEndDate(normalizeDateStr(med.endDate) || getFutureIso(30));
    setIsAddingMed(true);
  };

  // Helper: delete medication
  const handleDeleteMedication = (medId, medName) => {
    Alert.alert(
      "Delete Medication",
      `Are you sure you want to delete ${medName || 'this medication'}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Optimistically remove from state for immediate UI update
            setMedications(prev => {
              const nextMeds = { ...prev };
              delete nextMeds[medId];
              return nextMeds;
            });

            if (mockUser) {
              setMockState(prev => {
                const nextMeds = { ...prev.medications };
                delete nextMeds[medId];
                return { ...prev, medications: nextMeds };
              });
              return;
            }

            try {
              await deleteUserMedication(uid, medId);
            } catch (err) {
              console.error("Failed to delete medication from Firebase:", err);
              Alert.alert("Delete Error", "Failed to delete medication. Please try again.");
            }
          }
        }
      ]
    );
  };

  // Helper: add or update custom medication
  const handleAddMedication = async () => {
    if (!newMedName.trim() || !newMedDosage.trim()) {
      Alert.alert("Input Needed", "Please enter the medication name and dosage.");
      return;
    }

    const existingMed = editingMedId ? (medications[editingMedId] || {}) : {};
    const medData = {
      ...(editingMedId ? { id: editingMedId } : {}),
      medicineName: newMedName.trim(),
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      medicineType: newMedType,
      type: newMedType,
      time: newMedTime,
      frequency: newMedFrequency,
      instructions: newMedInstructions.trim() || 'No special instructions',
      startDate: newMedStartDate.trim() || getTodayIso(),
      endDate: newMedEndDate.trim() || getFutureIso(30),
      takenLogs: existingMed.takenLogs || {},
      createdAt: existingMed.createdAt || new Date().toISOString(),
      userId: uid || 'guest_user',
      takenStatus: existingMed.takenStatus || false,
      taken: existingMed.taken || false,
      takenTime: existingMed.takenTime || ''
    };

    if (mockUser) {
      const medIdToUse = editingMedId || `med_${Date.now()}`;
      const fullMed = { ...medData, id: medIdToUse };
      setMockState(prev => {
        const nextMeds = { ...prev.medications, [medIdToUse]: fullMed };
        setMedications(nextMeds);
        return { ...prev, medications: nextMeds };
      });
      setIsAddingMed(false);
      resetAddMedForm();
      Alert.alert(
        editingMedId ? "Medication Updated" : "Medication Registered", 
        `✓ ${fullMed.medicineName} (${fullMed.dosage}) ${editingMedId ? 'updated' : 'added to your cabinet'}.`
      );
    } else {
      try {
        const activeUid = auth?.currentUser?.uid || uid || 'guest_user';
        setIsAddingMed(false);
        resetAddMedForm();
        const savedMed = await saveUserMedication(activeUid, medData);
        setMedications(prev => ({
          ...prev,
          [savedMed.id]: savedMed
        }));
        Alert.alert(
          editingMedId ? "Medication Updated" : "Medication Registered", 
          `✓ ${savedMed.medicineName || savedMed.name} (${savedMed.dosage}) ${editingMedId ? 'updated successfully.' : `registered successfully for ${savedMed.time}.`}`
        );
      } catch (err) {
        Alert.alert("Save Error", err.message || "Failed to save medication to your cabinet.");
      }
    }
  };

  const resetAddMedForm = () => {
    setEditingMedId(null);
    setNewMedName('');
    setNewMedDosage('');
    setNewMedType('Tablet');
    setNewMedTime('09:00 AM');
    setNewMedFrequency('Once daily');
    setNewMedInstructions('');
    setNewMedStartDate(getTodayIso());
    setNewMedEndDate(getFutureIso(30));
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

  // Helper: Open edit profile modal pre-populated
  const handleOpenEditProfile = () => {
    setEditName(profile?.fullName || '');
    setEditDob(profile?.dob || '');
    setEditBloodType(profile?.bloodType || '');
    const allergiesVal = Array.isArray(profile?.allergies) 
      ? profile.allergies.join(', ') 
      : (profile?.allergies || '');
    setEditAllergies(allergiesVal);
    setIsEditingProfile(true);
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
      Alert.alert("Success", "Profile updated successfully!");
    } else {
      // Optimistically update profile state immediately
      setProfile(prev => ({
        ...prev,
        ...updatedFields
      }));
      setIsEditingProfile(false);

      try {
        const activeUid = auth?.currentUser?.uid || uid || 'guest_user';
        const res = await updateUserProfileFields(activeUid, updatedFields);
        if (res && Object.keys(res).length > 0) {
          setProfile(prev => ({
            ...prev,
            ...res
          }));
        }
        Alert.alert("Success", "Profile updated successfully!");
      } catch (err) {
        Alert.alert("Success", "Profile updated locally.");
      }
    }
  };

  // Settings Handler: Toggle Notifications
  const handleToggleNotifications = async () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    const activeUid = auth?.currentUser?.uid || uid || 'guest_user';
    setProfile(prev => ({
      ...(prev || {}),
      preferences: { ...(prev?.preferences || {}), notificationsEnabled: nextVal }
    }));
    try {
      await updateUserPreferences(activeUid, { notificationsEnabled: nextVal });
    } catch (e) {}
  };

  // Settings Handler: Toggle Dark Mode
  const handleToggleDarkMode = async () => {
    const nextVal = !isDarkMode;
    setIsDarkMode(nextVal);
    const activeUid = auth?.currentUser?.uid || uid || 'guest_user';
    setProfile(prev => ({
      ...(prev || {}),
      preferences: { ...(prev?.preferences || {}), darkMode: nextVal }
    }));
    try {
      await AsyncStorage.setItem('@meditrust_dark_mode', JSON.stringify(nextVal));
      await updateUserPreferences(activeUid, { darkMode: nextVal });
    } catch (e) {}
  };

  // Dynamic calculations for user medications
  const todayIso = getTodayIso();
  const medicationsList = Object.values(medications || {}).filter(med => {
    if (!med) return false;
    const name = (med.medicineName || med.name || '').trim().toLowerCase();
    const isValidName = name && name !== 'medication' && name !== 'new medication';
    return isValidName && isMedActiveToday(med, todayIso);
  });
  const remainingDoses = medicationsList.filter(m => !isMedTakenOnDate(m, todayIso, m.time)).length;
  const totalDoses = medicationsList.length;
  
  // Calculate dynamic adherence score
  const takenDosesCount = medicationsList.filter(m => isMedTakenOnDate(m, todayIso, m.time)).length;
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

  // Immediately resolve user's greeting name without delay
  const getGreetingName = () => {
    if (profile?.fullName && profile.fullName.trim() !== '') {
      const first = profile.fullName.trim().split(' ')[0];
      if (first) return first.charAt(0).toUpperCase() + first.slice(1);
    }
    const currentAuthUser = auth?.currentUser;
    if (currentAuthUser?.displayName && currentAuthUser.displayName.trim() !== '') {
      const first = currentAuthUser.displayName.trim().split(' ')[0];
      if (first) return first.charAt(0).toUpperCase() + first.slice(1);
    }
    if (currentAuthUser?.email && currentAuthUser.email.includes('@')) {
      const prefix = currentAuthUser.email.split('@')[0].trim();
      if (prefix) return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'User';
  };

  const renderDashboardTab = () => {
    const greetingName = getGreetingName();
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeLeft}>
            <Text style={styles.welcomeGreeting}>Hello, {greetingName}</Text>
            <Text style={styles.welcomeSubtitle}>
              {remainingDoses === 0 
                ? "All caught up for today! Outstanding work."
                : `You have ${remainingDoses} dose${remainingDoses > 1 ? 's' : ''} remaining for today.`
              }
            </Text>
          </View>
          <TouchableOpacity style={styles.avatarMini} onPress={() => setActiveTab('profile')}>
            <Text style={styles.avatarMiniText}>
              {(greetingName.charAt(0) || 'U').toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Prominent Search Bar Entry Point (Module 5) */}
        <View style={styles.dashSearchBlock}>
          <TouchableOpacity onPress={() => handleDashSearchSubmit()}>
            <MaterialIcons name="search" size={22} color={colors.primary} style={styles.dashSearchIcon} />
          </TouchableOpacity>
          <TextInput 
            style={styles.dashSearchInput}
            placeholder="Search medicine, usage, precautions..."
            placeholderTextColor={colors.outline}
            value={dashSearchQuery}
            onChangeText={handleDashQueryChange}
            onSubmitEditing={() => handleDashSearchSubmit()}
            returnKeyType="search"
            numberOfLines={1}
            multiline={false}
          />
          {dashSearchQuery.trim().length > 0 && (
            <TouchableOpacity onPress={() => handleDashQueryChange('')}>
              <MaterialIcons name="close" size={20} color={colors.outline} />
            </TouchableOpacity>
          )}
        </View>

        {/* Live Search Suggestions Dropdown as User Types */}
        {dashSuggestions.length > 0 && (
          <View style={styles.dashSuggestionsCard}>
            <Text style={styles.dashSuggestionsHeader}>Suggestions</Text>
            {dashSuggestions.map((sug, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={styles.dashSuggestionRowItem}
                onPress={() => handleDashSearchSubmit(sug)}
              >
                <MaterialIcons name="search" size={18} color={colors.primary} />
                <Text style={styles.dashSuggestionRowText}>{sug}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={[styles.quickActionBtn, { backgroundColor: colors.primary }]}
            onPress={() => { resetAddMedForm(); setIsAddingMed(true); }}
          >
            <Ionicons name="add-circle" size={24} color={colors.white} />
            <Text style={[styles.quickActionLabel, { color: colors.white }]}>Add Med</Text>
          </TouchableOpacity>
        </View>

        {/* Verified Pharmacy network Bento Card (Module 7) */}
        <TouchableOpacity 
          style={styles.pharmacyBentoBanner}
          onPress={() => navigation.navigate('ClinicalTrustFramework', { uid, mockUser })}
          activeOpacity={0.9}
        >
          <View style={styles.pharmacyBentoLeft}>
            <Text style={styles.pharmacyBentoBadge}>Verified Networks</Text>
            <Text style={styles.pharmacyBentoTitle}>Verify Local Pharmacies</Text>
            <Text style={styles.pharmacyBentoDesc}>
              Search certified distributors, inspect AI trust ratings, and audit safety logs.
            </Text>
            <View style={styles.pharmacyBentoBtn}>
              <MaterialIcons name="local-pharmacy" size={16} color={colors.primary} />
              <Text style={styles.pharmacyBentoBtnText}>Launch Portal</Text>
            </View>
          </View>
          <View style={styles.pharmacyBentoRight}>
            <MaterialIcons name="verified-user" size={96} color="rgba(255,255,255,0.12)" />
          </View>
        </TouchableOpacity>

        {/* Upcoming Doses */}
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>Upcoming Doses</Text>
          <View style={styles.medsStack}>
            {medicationsList.length === 0 ? (
              <View style={styles.emptyMedsContainer}>
                <Ionicons name="medical-outline" size={40} color={colors.outlineVariant} />
                <Text style={styles.emptyMedsText}>No medications added yet.</Text>
                <TouchableOpacity style={styles.emptyAddBtn} onPress={() => { resetAddMedForm(); setIsAddingMed(true); }}>
                  <Text style={styles.emptyAddBtnText}>Add Medication Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              medicationsList
                .sort((a, b) => convertTimeToMinutes(a?.time) - convertTimeToMinutes(b?.time))
                .map((med) => {
                  const isTaken = isMedTakenOnDate(med, todayIso, med.time);
                  const takenTime = getMedTakenTimeOnDate(med, todayIso, med.time);
                  const medName = med.medicineName || med.name || 'Medication';
                  const medType = med.medicineType || med.type || '';
                  const medFreq = med.frequency || '';
                  const displayTime = med?.time || '09:00 AM';
                  const timeParts = displayTime.split(' ');
                  const timeMain = timeParts[0] || '09:00';
                  const timeAmPm = timeParts[1] || 'AM';
                  return (
                    <View 
                      key={med.id || Math.random().toString()} 
                      style={[styles.medCard, isTaken && styles.medCardCompleted]}
                    >
                      <View style={isTaken ? styles.medCardCompleted : styles.medCardActive} />
                      <View style={styles.medCardLeft}>
                        <View style={styles.medTimeCol}>
                          <Text style={[styles.medTimeText, isTaken && styles.medTextMuted]}>
                            {timeMain}
                          </Text>
                          <Text style={[styles.medTimeAmPm, isTaken && styles.medTextMuted]}>
                            {timeAmPm}
                          </Text>
                        </View>
                        
                        {/* Fluid indicator bar */}
                        <View style={[
                          styles.indicatorBar, 
                          { backgroundColor: isTaken ? colors.secondary : colors.primaryFixed }
                        ]} />

                        <View style={styles.medInfoCol}>
                          <Text style={[styles.medNameText, isTaken && styles.medNameCompleted]}>
                            {medName} {medType ? `(${medType})` : ''}
                          </Text>
                          <Text style={styles.medDosageText}>
                            {med.dosage || 'Standard Dose'} {medFreq ? `• ${medFreq} ` : ''}• {med.instructions || 'No special instructions'}
                          </Text>
                          {med.startDate && med.endDate && (
                            <Text style={{ fontSize: 11, color: colors.outline, marginTop: 2 }}>
                              📅 {med.startDate} to {med.endDate}
                            </Text>
                          )}
                          {isTaken && (
                            <Text style={styles.takenLabelText}>
                              Taken at {takenTime || '08:05 AM'}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.medActionsRow}>
                        <TouchableOpacity 
                          style={styles.actionIconButton} 
                          onPress={() => handleEditMedication(med)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialIcons name="edit" size={18} color={colors.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.actionIconButton} 
                          onPress={() => handleDeleteMedication(med.id, medName)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[
                            styles.checkCircleBtn, 
                            isTaken ? styles.checkCircleBtnSuccess : styles.checkCircleBtnActive
                          ]}
                          onPress={() => handleToggleTaken(med.id, isTaken, med.time)}
                        >
                          <MaterialIcons 
                            name={isTaken ? "done-all" : "check"} 
                            size={20} 
                            color={isTaken ? colors.white : colors.primary} 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
            )}
          </View>
        </View>

        {/* Community Safety Bento Grid & Recall Box */}
        <Text style={styles.sectionTitle}>MediGuard AI Community Services</Text>
        <View style={styles.grid}>
          <TouchableOpacity 
            style={[styles.gridCard, { width: '100%', flex: 1 }]}
            onPress={() => navigation.navigate('MyMedicines', { uid, mockUser })}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name="inventory" size={24} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Expiry Management</Text>
            <Text style={styles.cardDesc}>Register and trace clinical expiration alerts automatically.</Text>
            <View style={styles.cardAction}>
              <MaterialIcons name="arrow-forward" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Community Experiences & Analytics Bento card */}
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
              <MaterialIcons name="arrow-forward" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Community Safety Network Card */}
        <View style={[styles.grid, { marginTop: 16 }]}>
          <TouchableOpacity 
            style={[styles.gridCard, { width: '100%', flex: 1 }]}
            onPress={() => navigation.navigate('SafetyMap', { uid, mockUser })}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name="shield" size={24} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Community Safety Network</Text>
            <Text style={styles.cardDesc}>Inspect live safety maps, active community alerts, and recent medicine recall notices in real time.</Text>
            <View style={styles.cardAction}>
              <MaterialIcons name="arrow-forward" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>
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
              <Text style={styles.emptyFeedText}>No Notifications</Text>
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
    const allergiesList = Array.isArray(profile?.allergies) 
      ? profile.allergies 
      : (typeof profile?.allergies === 'string' && profile.allergies ? profile.allergies.split(',') : []);

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
              <TouchableOpacity style={styles.editAvatarBadge} onPress={handleOpenEditProfile}>
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
            <TouchableOpacity style={styles.editBtnCircle} onPress={handleOpenEditProfile}>
              <MaterialIcons name="edit" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Clinical Profile Details */}
        <View style={styles.clinicalDataCard}>
          <View style={styles.cardSectionHeaderRow}>
            <Text style={styles.cardSectionHeaderTitle}>Personal Information</Text>
            <MaterialIcons name="info" size={20} color={colors.outline} />
          </View>

          <View style={styles.personalDataGrid}>
            <View style={styles.gridDataRow}>
              <View style={styles.gridItemHalf}>
                <Text style={styles.gridItemLabel}>Full Name</Text>
                <Text style={styles.gridItemValue}>{profile?.fullName || 'Clinical User'}</Text>
              </View>
              <View style={styles.gridItemHalf}>
                <Text style={styles.gridItemLabel}>Date of Birth</Text>
                <Text style={styles.gridItemValue}>{profile?.dob || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.gridDataDivider} />

            <View style={styles.gridDataRow}>
              <View style={styles.gridItemHalf}>
                <Text style={styles.gridItemLabel}>Blood Type</Text>
                <Text style={[styles.gridItemValue, { color: profile?.bloodType ? colors.error : colors.textSecondary, fontWeight: '700' }]}>
                  {profile?.bloodType || 'Not provided'}
                </Text>
              </View>
              <View style={styles.gridItemHalf}>
                <Text style={styles.gridItemLabel}>Account Status</Text>
                <Text style={[styles.gridItemValue, { color: colors.secondary, fontWeight: '600' }]}>
                  Verified Patient
                </Text>
              </View>
            </View>

            <View style={styles.gridDataDivider} />

            <View style={styles.allergiesSection}>
              <Text style={styles.gridItemLabel}>Allergies & Sensitivities</Text>
              <View style={styles.allergiesPillsContainer}>
                {allergiesList.filter(a => typeof a === 'string' ? a.trim() : a).length === 0 ? (
                  <Text style={{ fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', marginTop: 4 }}>
                    Not provided
                  </Text>
                ) : (
                  allergiesList.map((allergy, index) => {
                    const allergyTrimmed = typeof allergy === 'string' ? allergy.trim() : String(allergy);
                    if (!allergyTrimmed) return null;
                    const isCritical = allergyTrimmed.toLowerCase().includes('penicillin') || allergyTrimmed.toLowerCase().includes('shellfish');
                    return (
                      <View 
                        key={allergyTrimmed + index} 
                        style={[
                          styles.allergyPill, 
                          isCritical ? styles.allergyPillCritical : styles.allergyPillNormal
                        ]}
                      >
                        {isCritical && (
                          <MaterialIcons name="warning" size={12} color={colors.error} style={{ marginRight: 4 }} />
                        )}
                        <Text style={[
                          styles.allergyPillText,
                          isCritical ? { color: colors.error } : { color: colors.textSecondary }
                        ]}>
                          {allergyTrimmed}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons Cabinet (Sign Out) */}
        <View style={[styles.actionButtonsCabinet, { marginTop: 16 }]}>
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
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* App Info Header */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={[styles.tabHeading, isDarkMode && { color: '#e2e2e6' }]}>Settings</Text>
            <Text style={[styles.welcomeSubtitle, isDarkMode && { color: '#a0a4b0' }]}>App preferences & configuration</Text>
          </View>
        </View>

        {/* Simplified Settings Block */}
        <View style={styles.settingsSection}>
          <View style={[styles.settingsBlock, isDarkMode && { backgroundColor: '#1e1f23', borderColor: '#343640' }]}>
            {/* 1. Edit Profile */}
            <TouchableOpacity 
              style={[styles.settingsRowBtn, isDarkMode && { borderBottomColor: '#343640' }]} 
              onPress={() => setActiveTab('profile')}
            >
              <View style={styles.settingsRowLeft}>
                <View style={[styles.settingsIconCircle, isDarkMode && { backgroundColor: '#1a1b1f' }]}>
                  <MaterialIcons name="person-outline" size={20} color={isDarkMode ? '#80b3ff' : colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingsLabel, isDarkMode && { color: '#e2e2e6' }]}>Edit Profile</Text>
                  <Text style={[styles.settingsSubLabel, isDarkMode && { color: '#a0a4b0' }]}>Manage personal health & contact details</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={isDarkMode ? '#a0a4b0' : colors.outline} />
            </TouchableOpacity>

            {/* 2. Notifications Toggle */}
            <View style={[styles.settingsRow, isDarkMode && { borderBottomColor: '#343640' }]}>
              <View style={styles.settingsRowLeft}>
                <View style={[styles.settingsIconCircle, isDarkMode && { backgroundColor: '#1a1b1f' }]}>
                  <MaterialIcons name="notifications-none" size={20} color={isDarkMode ? '#80b3ff' : colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingsLabel, isDarkMode && { color: '#e2e2e6' }]}>Notifications</Text>
                  <Text style={[styles.settingsSubLabel, isDarkMode && { color: '#a0a4b0' }]}>{notificationsEnabled ? 'Enabled' : 'Disabled'}</Text>
                </View>
              </View>
              <Switch 
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: colors.outlineVariant, true: isDarkMode ? '#80b3ff' : colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            {/* 3. Dark Mode Toggle */}
            <View style={[styles.settingsRow, isDarkMode && { borderBottomColor: '#343640' }]}>
              <View style={styles.settingsRowLeft}>
                <View style={[styles.settingsIconCircle, isDarkMode && { backgroundColor: '#1a1b1f' }]}>
                  <MaterialIcons name="dark-mode" size={20} color={isDarkMode ? '#80b3ff' : colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingsLabel, isDarkMode && { color: '#e2e2e6' }]}>Dark Mode</Text>
                  <Text style={[styles.settingsSubLabel, isDarkMode && { color: '#a0a4b0' }]}>{isDarkMode ? 'Dark Mode ON' : 'Light Mode ON'}</Text>
                </View>
              </View>
              <Switch 
                value={isDarkMode}
                onValueChange={handleToggleDarkMode}
                trackColor={{ false: colors.outlineVariant, true: isDarkMode ? '#80b3ff' : colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            {/* 4. Privacy Policy */}
            <TouchableOpacity 
              style={[styles.settingsRowBtn, isDarkMode && { borderBottomColor: '#343640' }]} 
              onPress={() => setIsPrivacyModalOpen(true)}
            >
              <View style={styles.settingsRowLeft}>
                <View style={[styles.settingsIconCircle, isDarkMode && { backgroundColor: '#1a1b1f' }]}>
                  <MaterialIcons name="security" size={20} color={isDarkMode ? '#80b3ff' : colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingsLabel, isDarkMode && { color: '#e2e2e6' }]}>Privacy Policy</Text>
                  <Text style={[styles.settingsSubLabel, isDarkMode && { color: '#a0a4b0' }]}>Data protection & privacy rights</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={isDarkMode ? '#a0a4b0' : colors.outline} />
            </TouchableOpacity>

            {/* 5. About MediGod AI */}
            <TouchableOpacity 
              style={[styles.settingsRowBtn, { borderBottomWidth: 0 }]} 
              onPress={() => setIsAboutModalOpen(true)}
            >
              <View style={styles.settingsRowLeft}>
                <View style={[styles.settingsIconCircle, isDarkMode && { backgroundColor: '#1a1b1f' }]}>
                  <MaterialIcons name="info-outline" size={20} color={isDarkMode ? '#80b3ff' : colors.primary} />
                </View>
                <View>
                  <Text style={[styles.settingsLabel, isDarkMode && { color: '#e2e2e6' }]}>About MediGod AI</Text>
                  <Text style={[styles.settingsSubLabel, isDarkMode && { color: '#a0a4b0' }]}>App info, version & purpose</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={isDarkMode ? '#a0a4b0' : colors.outline} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. Sign Out Button */}
        <TouchableOpacity style={[styles.logoutSettingBtn, isDarkMode && { backgroundColor: '#2a1a1a', borderColor: '#4a2222' }]} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutSettingText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.safeContainer, isDarkMode && { backgroundColor: '#121316' }]}>
      
      {/* Dynamic Top App Bar Header */}
      <View style={[styles.header, isDarkMode && { backgroundColor: '#1e1f23', borderBottomColor: '#343640' }]}>
        <View style={styles.headerTitleRow}>
          <MaterialIcons name="health-and-safety" size={28} color={isDarkMode ? '#80b3ff' : colors.primary} />
          <Text style={[styles.headerText, isDarkMode && { color: '#80b3ff' }]}>MedVigilance</Text>
        </View>
        
        {/* Network Badge Status */}
        {mockUser && (
          <View style={[styles.cloudBadge, isDarkMode && { backgroundColor: '#1a1b1f', borderColor: '#343640' }]}>
            <View style={[styles.greenActiveDot, { backgroundColor: '#e67e22' }]} />
            <Text style={[styles.cloudBadgeText, isDarkMode && { color: '#a0a4b0' }]}>Offline</Text>
          </View>
        )}
      </View>

      {/* Main Tab Rendering Pipeline */}
      {activeTab === 'dashboard' && renderDashboardTab()}

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
              <Text style={styles.sheetTitle}>{editingMedId ? 'Edit Medication' : 'Add Medication'}</Text>
              <TouchableOpacity onPress={() => { resetAddMedForm(); setIsAddingMed(false); }}>
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
                <Text style={styles.inputLabel}>Medicine Type</Text>
                <View style={styles.timeSelectionRow}>
                  {['Tablet', 'Capsule', 'Syrup', 'Injection'].map((type) => (
                    <TouchableOpacity 
                      key={type}
                      style={[styles.timeSelectBtn, newMedType === type && styles.timeSelectBtnActive]}
                      onPress={() => setNewMedType(type)}
                    >
                      <Text style={[styles.timeSelectText, newMedType === type && styles.timeSelectTextActive]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
                <Text style={styles.inputLabel}>Frequency</Text>
                <View style={styles.timeSelectionRow}>
                  {['Once daily', 'Twice daily', '3x daily', 'As needed'].map((freq) => (
                    <TouchableOpacity 
                      key={freq}
                      style={[styles.timeSelectBtn, newMedFrequency === freq && styles.timeSelectBtnActive]}
                      onPress={() => setNewMedFrequency(freq)}
                    >
                      <Text style={[styles.timeSelectText, newMedFrequency === freq && styles.timeSelectTextActive]}>{freq}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Instructions / Notes</Text>
                <TextInput 
                  style={[styles.sheetInput, { height: 70, textAlignVertical: 'top' }]}
                  placeholder="e.g. Take with food in morning"
                  multiline={true}
                  value={newMedInstructions}
                  onChangeText={setNewMedInstructions}
                  placeholderTextColor={colors.outline}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <TextInput 
                    style={styles.sheetInput}
                    placeholder="YYYY-MM-DD"
                    value={newMedStartDate}
                    onChangeText={setNewMedStartDate}
                    placeholderTextColor={colors.outline}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>End Date</Text>
                  <TextInput 
                    style={styles.sheetInput}
                    placeholder="YYYY-MM-DD"
                    value={newMedEndDate}
                    onChangeText={setNewMedEndDate}
                    placeholderTextColor={colors.outline}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.saveMedSubmitBtn} onPress={handleAddMedication}>
                <Text style={styles.saveMedSubmitBtnText}>{editingMedId ? 'Save Changes' : 'Register Medication'}</Text>
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

      {/* Privacy Policy Full-Screen Page */}
      <Modal
        visible={isPrivacyModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsPrivacyModalOpen(false)}
      >
        <SafeAreaView style={[styles.fullScreenPage, isDarkMode && { backgroundColor: '#121316' }]}>
          {/* Header */}
          <View style={[styles.fullScreenHeader, isDarkMode && { backgroundColor: '#1e1f23', borderBottomColor: '#343640' }]}>
            <TouchableOpacity 
              style={styles.fullScreenBackBtn} 
              onPress={() => setIsPrivacyModalOpen(false)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={24} color={isDarkMode ? '#80b3ff' : colors.primary} />
              <Text style={[styles.fullScreenBackText, isDarkMode && { color: '#80b3ff' }]}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.fullScreenHeaderTitle, isDarkMode && { color: '#e2e2e6' }]}>Privacy Policy</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            contentContainerStyle={styles.fullScreenScrollContent} 
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Card */}
            <View style={[styles.fullScreenHeroCard, isDarkMode && { backgroundColor: '#1e1f23', borderColor: '#343640' }]}>
              <View style={[styles.fullScreenIconCircle, isDarkMode && { backgroundColor: '#1c2d5a' }]}>
                <MaterialIcons name="security" size={32} color={isDarkMode ? '#80b3ff' : colors.primary} />
              </View>
              <Text style={[styles.fullScreenHeroTitle, isDarkMode && { color: '#e2e2e6' }]}>Patient Privacy Protocol</Text>
              <Text style={[styles.fullScreenHeroSubtitle, isDarkMode && { color: '#a0a4b0' }]}>End-to-End Encryption & GDPR/HIPAA Compliance</Text>
            </View>

            {/* Section 1 */}
            <View style={[styles.fullScreenSectionCard, isDarkMode && { backgroundColor: '#1e1f23', borderColor: '#343640' }]}>
              <View style={styles.sectionHeaderRow}>
                <MaterialIcons name="lock-outline" size={22} color={isDarkMode ? '#80b3ff' : colors.primary} />
                <Text style={[styles.fullScreenSectionTitle, isDarkMode && { color: '#80b3ff' }]}>MediGod AI Patient Data Privacy</Text>
              </View>
              <Text style={[styles.fullScreenBodyText, isDarkMode && { color: '#a0a4b0' }]}>
                Your health records, prescription schedules, medication histories, and personal profile metrics are encrypted using military-grade AES-256 protocols adhering to HIPAA & GDPR international clinical standards.
              </Text>
            </View>

            {/* Section 2 */}
            <View style={[styles.fullScreenSectionCard, isDarkMode && { backgroundColor: '#1e1f23', borderColor: '#343640' }]}>
              <View style={styles.sectionHeaderRow}>
                <MaterialIcons name="verified-user" size={22} color={isDarkMode ? '#80b3ff' : colors.primary} />
                <Text style={[styles.fullScreenSectionTitle, isDarkMode && { color: '#80b3ff' }]}>Data Rights & Usage Policy</Text>
              </View>
              
              <View style={styles.bulletItem}>
                <Text style={[styles.bulletPointIcon, isDarkMode && { color: '#80b3ff' }]}>•</Text>
                <Text style={[styles.bulletItemText, isDarkMode && { color: '#a0a4b0' }]}>
                  <Text style={{ fontWeight: '700', color: isDarkMode ? '#e2e2e6' : colors.text }}>Zero Data Brokerage:</Text> We never sell, share, or monetize patient records with third-party data brokers or advertisers.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <Text style={[styles.bulletPointIcon, isDarkMode && { color: '#80b3ff' }]}>•</Text>
                <Text style={[styles.bulletItemText, isDarkMode && { color: '#a0a4b0' }]}>
                  <Text style={{ fontWeight: '700', color: isDarkMode ? '#e2e2e6' : colors.text }}>Scoped Cloud Access:</Text> Real-time database syncs are strictly authenticated and restricted to your logged-in account UID.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <Text style={[styles.bulletPointIcon, isDarkMode && { color: '#80b3ff' }]}>•</Text>
                <Text style={[styles.bulletItemText, isDarkMode && { color: '#a0a4b0' }]}>
                  <Text style={{ fontWeight: '700', color: isDarkMode ? '#e2e2e6' : colors.text }}>Complete Sovereignty:</Text> You retain total authority to export, edit, or permanently wipe your stored clinical data at any time.
                </Text>
              </View>
            </View>

            {/* Section 3 */}
            <View style={[styles.fullScreenSectionCard, isDarkMode && { backgroundColor: '#1e1f23', borderColor: '#343640' }]}>
              <View style={styles.sectionHeaderRow}>
                <MaterialIcons name="gavel" size={22} color={isDarkMode ? '#80b3ff' : colors.primary} />
                <Text style={[styles.fullScreenSectionTitle, isDarkMode && { color: '#80b3ff' }]}>Clinical Governance</Text>
              </View>
              <Text style={[styles.fullScreenBodyText, isDarkMode && { color: '#a0a4b0' }]}>
                Data processing is governed by strict automated Firebase Security Rules. Continuous automated vulnerability scanning guarantees maximum integrity of patient records.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* About MediGod AI Full-Screen Page */}
      <Modal
        visible={isAboutModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsAboutModalOpen(false)}
      >
        <SafeAreaView style={[styles.fullScreenPage, isDarkMode && { backgroundColor: '#121316' }]}>
          {/* Header */}
          <View style={[styles.fullScreenHeader, isDarkMode && { backgroundColor: '#1e1f23', borderBottomColor: '#343640' }]}>
            <TouchableOpacity 
              style={styles.fullScreenBackBtn} 
              onPress={() => setIsAboutModalOpen(false)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={24} color={isDarkMode ? '#80b3ff' : colors.primary} />
              <Text style={[styles.fullScreenBackText, isDarkMode && { color: '#80b3ff' }]}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.fullScreenHeaderTitle, isDarkMode && { color: '#e2e2e6' }]}>About MediGod AI</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            contentContainerStyle={styles.fullScreenScrollContent} 
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Brand Card */}
            <View style={[styles.fullScreenHeroCard, isDarkMode && { backgroundColor: '#1e1f23', borderColor: '#343640' }]}>
              <View style={[styles.fullScreenIconCircle, { width: 72, height: 72, borderRadius: 36 }, isDarkMode && { backgroundColor: '#1c2d5a' }]}>
                <MaterialIcons name="health-and-safety" size={40} color={isDarkMode ? '#80b3ff' : colors.primary} />
              </View>
              <Text style={[styles.fullScreenHeroTitle, { fontSize: 24, marginTop: 12 }, isDarkMode && { color: '#e2e2e6' }]}>MediGod AI</Text>
              <View style={[styles.versionBadge, isDarkMode && { backgroundColor: '#1a382b' }]}>
                <Text style={[styles.versionBadgeText, isDarkMode && { color: '#38e078' }]}>Version 1.0</Text>
              </View>
            </View>

            {/* Purpose */}
            <View style={[styles.fullScreenSectionCard, isDarkMode && { backgroundColor: '#1e1f23', borderColor: '#343640' }]}>
              <View style={styles.sectionHeaderRow}>
                <MaterialIcons name="track-changes" size={22} color={isDarkMode ? '#80b3ff' : colors.primary} />
                <Text style={[styles.fullScreenSectionTitle, isDarkMode && { color: '#80b3ff' }]}>Purpose</Text>
              </View>
              <Text style={[styles.fullScreenBodyText, isDarkMode && { color: '#a0a4b0' }]}>
                MediGod AI is an AI-powered medicine safety and awareness application designed to prevent harmful drug interactions, track expirations, and safeguard patient health across all clinical environments.
              </Text>
            </View>

            {/* Developer Info */}
            <View style={[styles.fullScreenSectionCard, isDarkMode && { backgroundColor: '#1e1f23', borderColor: '#343640' }]}>
              <View style={styles.sectionHeaderRow}>
                <MaterialIcons name="code" size={22} color={isDarkMode ? '#80b3ff' : colors.primary} />
                <Text style={[styles.fullScreenSectionTitle, isDarkMode && { color: '#80b3ff' }]}>Developer Information</Text>
              </View>
              <Text style={[styles.fullScreenBodyText, isDarkMode && { color: '#a0a4b0' }]}>
                Architected and developed by the MediGuard AI Health Systems Engineering Team. Powered by Google DeepMind Advanced Clinical Intelligence Architecture.
              </Text>
            </View>

            {/* Key Capabilities */}
            <View style={[styles.fullScreenSectionCard, isDarkMode && { backgroundColor: '#1e1f23', borderColor: '#343640' }]}>
              <View style={styles.sectionHeaderRow}>
                <MaterialIcons name="star-outline" size={22} color={isDarkMode ? '#80b3ff' : colors.primary} />
                <Text style={[styles.fullScreenSectionTitle, isDarkMode && { color: '#80b3ff' }]}>Key Features</Text>
              </View>

              <View style={styles.bulletItem}>
                <MaterialIcons name="access-time" size={18} color={colors.secondary} style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={[styles.bulletItemText, isDarkMode && { color: '#a0a4b0' }]}>
                  <Text style={{ fontWeight: '700', color: isDarkMode ? '#e2e2e6' : colors.text }}>Expiry Management:</Text> Real-time monitoring and 7-day automatic warning push notifications.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <MaterialIcons name="search" size={18} color={colors.secondary} style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={[styles.bulletItemText, isDarkMode && { color: '#a0a4b0' }]}>
                  <Text style={{ fontWeight: '700', color: isDarkMode ? '#e2e2e6' : colors.text }}>AI Safety Verification:</Text> Instant lookup for dosage guidelines, warnings, and drug interactions.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <MaterialIcons name="warning" size={18} color={colors.secondary} style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={[styles.bulletItemText, isDarkMode && { color: '#a0a4b0' }]}>
                  <Text style={{ fontWeight: '700', color: isDarkMode ? '#e2e2e6' : colors.text }}>Recall Protection:</Text> Community network safety sync checking batches for counterfeit recalls.
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
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
  medActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  actionIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceContainerLow || '#f5f5f5',
    borderWidth: 1,
    borderColor: colors.outlineVariant || '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
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
  dashSearchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlignVertical: 'center',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  dashSearchPlaceholder: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.outline,
  },
  dashSuggestionsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary + '4D',
    borderRadius: 14,
    padding: 12,
    marginTop: -16,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  dashSuggestionsHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  dashSuggestionRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4D',
  },
  dashSuggestionRowText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
  },
  pharmacyBentoBanner: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pharmacyBentoLeft: {
    flex: 1.5,
    zIndex: 10,
  },
  pharmacyBentoBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: '#d6e3ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pharmacyBentoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 6,
  },
  pharmacyBentoDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 16,
    marginBottom: 16,
    fontWeight: '500',
  },
  pharmacyBentoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    height: 36,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  pharmacyBentoBtnText: {
    fontSize: 12,
    fontWeight: '850',
    color: colors.primary,
  },
  pharmacyBentoRight: {
    position: 'absolute',
    right: -10,
    bottom: -15,
  },
  faqBlock: {
    backgroundColor: colors.surfaceContainerLow,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
  privacyHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 6,
  },
  privacyBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },

  // Full-Screen Separate Pages Styling (Privacy Policy & About MediGod AI)
  fullScreenPage: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullScreenHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  fullScreenBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 12,
  },
  fullScreenBackText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  fullScreenHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  fullScreenScrollContent: {
    padding: 20,
    paddingBottom: 48,
    gap: 16,
  },
  fullScreenHeroCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  fullScreenIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  fullScreenHeroTitle: {
    fontSize: 20,
    fontWeight: '850',
    color: colors.text,
    textAlign: 'center',
  },
  fullScreenHeroSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  fullScreenSectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  fullScreenSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  fullScreenBodyText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    fontWeight: '500',
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  bulletPointIcon: {
    fontSize: 18,
    color: colors.primary,
    marginRight: 8,
    lineHeight: 20,
  },
  bulletItemText: {
    flex: 1,
    fontSize: 13.5,
    color: colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  versionBadge: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  versionBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
});

export default DashboardScreen;
