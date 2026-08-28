import { ref, set, get, onValue, update, remove, push } from 'firebase/database';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import { auth, database, db } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper to check if client has an active authenticated session matching targetUid
const canWriteToRtdb = (targetUid) => {
  const currentAuthUid = auth?.currentUser?.uid;
  if (!currentAuthUid) return false;
  if (!targetUid || targetUid === 'guest_user') return false;
  return currentAuthUid === targetUid;
};

// Helper to save full medication object locally in AsyncStorage
export const saveLocalMedicationObject = async (uid, medObject) => {
  try {
    const key = `@meditrust_meds_${uid}`;
    const stored = await AsyncStorage.getItem(key);
    const meds = stored ? JSON.parse(stored) : {};
    const medId = medObject.id;
    meds[medId] = {
      ...(meds[medId] || {}),
      ...medObject
    };
    await AsyncStorage.setItem(key, JSON.stringify(meds));
    return meds;
  } catch (e) {
    console.warn("AsyncStorage save error:", e.message);
    return null;
  }
};

// Helper to update medication taken state locally
const saveLocalMedicationState = async (uid, medId, takenState, takenTime) => {
  try {
    const key = `@meditrust_meds_${uid}`;
    const stored = await AsyncStorage.getItem(key);
    const meds = stored ? JSON.parse(stored) : {};
    if (meds[medId]) {
      meds[medId] = {
        ...meds[medId],
        taken: takenState,
        takenTime
      };
      await AsyncStorage.setItem(key, JSON.stringify(meds));
    }
    return meds;
  } catch (e) {
    return null;
  }
};

const filterOutDemoMeds = (medsObj) => {
  if (!medsObj || typeof medsObj !== 'object') return {};
  const cleaned = {};
  Object.keys(medsObj).forEach((key) => {
    const med = medsObj[key];
    if (!med || typeof med !== 'object') return;
    const name = (med?.medicineName || med?.name || '').trim();
    const isSearched = key.startsWith('med_c2') || key.startsWith('med_gen_') || key.startsWith('med_fda_') || key.startsWith('med_alias_') || med?.isSearched || med?.source === 'search';
    if (name.length > 0 && !isSearched) {
      cleaned[key] = med;
    }
  });
  return cleaned;
};

/**
 * Automatically syncs expiry alerts for approaching (<=7 days) and expired medications to Firebase RTDB notifications
 */
export const syncExpiryAlerts = async (uid, medicationsObj) => {
  const currentAuthUid = auth?.currentUser?.uid;
  if (!currentAuthUid) return;
  if (uid && uid !== currentAuthUid) return;
  const targetUid = currentAuthUid;
  if (!canWriteToRtdb(targetUid)) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const notifsRef = ref(database, `users/${targetUid}/notifications`);
  let currentNotifs = {};
  try {
    const snap = await get(notifsRef);
    if (snap.exists()) {
      currentNotifs = snap.val() || {};
    }
  } catch (e) {}

  const updates = {};
  const medsList = Object.values(medicationsObj || {}).filter(m => m && (m.name || m.medicineName));
  const activeMedIds = new Set(medsList.map(m => m.id));

  // 1. Remove hardcoded sample notifications (notif_1..notif_5) & orphaned expiry alerts
  Object.keys(currentNotifs).forEach(key => {
    if (key.startsWith('notif_')) {
      updates[key] = null;
    } else if (key.startsWith('expiry_alert_')) {
      const medId = key.replace('expiry_alert_', '');
      if (!activeMedIds.has(medId)) {
        updates[key] = null;
      }
    }
  });

  // 2. Check each medicine's expiry date dynamically
  medsList.forEach(med => {
    if (!med || !med.expDate) return;
    
    let exp;
    const expDateStr = String(med.expDate).trim();
    const parts = expDateStr.split('-');
    if (parts.length === 3) {
      exp = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      exp = new Date(expDateStr);
    }

    if (isNaN(exp.getTime())) return;
    exp.setHours(0, 0, 0, 0);

    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const alertId = `expiry_alert_${med.id}`;
    const medName = med.medicineName || med.name || 'Medication';

    if (diffDays < 0) {
      // High-priority alert: Expired
      updates[alertId] = {
        id: alertId,
        medId: med.id,
        type: 'critical',
        category: 'Expiry Alert',
        timestamp: 'Just now',
        title: `Expired: ${medName}`,
        description: `❌ Your medicine '${medName}' has expired.`,
        unread: true,
        actionLabel: 'View Expiry Details'
      };
    } else if (diffDays === 0) {
      // High-priority alert: Expires Today
      updates[alertId] = {
        id: alertId,
        medId: med.id,
        type: 'critical',
        category: 'Expiry Alert',
        timestamp: 'Just now',
        title: `Expires Today: ${medName}`,
        description: `⚠️ Your medicine '${medName}' expires today.`,
        unread: true,
        actionLabel: 'View Expiry Details'
      };
    } else if (diffDays <= 7) {
      // Near expiry alert (within 7 days)
      updates[alertId] = {
        id: alertId,
        medId: med.id,
        type: 'expiry',
        category: 'Expiry Warning',
        timestamp: 'Just now',
        title: `Expiring Soon: ${medName}`,
        description: `⚠️ Your medicine '${medName}' will expire in ${diffDays} day${diffDays > 1 ? 's' : ''}.`,
        unread: true,
        actionLabel: 'View Expiry Details'
      };
    } else {
      // Safe > 7 days -> remove alert if it previously existed
      if (currentNotifs[alertId]) {
        updates[alertId] = null;
      }
    }
  });

  if (Object.keys(updates).length > 0) {
    try {
      await update(notifsRef, updates);
    } catch (e) {
      // Suppress permission denied warnings when unauthenticated or offline
    }
  }
};

export const getLocalMedications = async (uid) => {
  try {
    const key = `@meditrust_meds_${uid}`;
    const stored = await AsyncStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : {};
    return filterOutDemoMeds(parsed);
  } catch (e) {
    return {};
  }
};

// Helper for local profile storage in AsyncStorage
export const saveLocalUserProfile = async (uid, profileData) => {
  try {
    const key = `@meditrust_profile_${uid}`;
    const stored = await AsyncStorage.getItem(key);
    const existing = stored ? JSON.parse(stored) : {};
    const updated = { ...existing, ...profileData };
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn("AsyncStorage save profile error:", e.message);
    return profileData;
  }
};

export const getLocalUserProfile = async (uid) => {
  try {
    const key = `@meditrust_profile_${uid}`;
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

const withTimeout = (promise, ms = 3500) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms))
  ]);
};

/**
 * Saves or updates a user profile in Firebase (Firestore + RTDB) and local storage cache
 */
export const saveUserProfile = async (uid, fullName, email, phone = '', extraFields = {}) => {
  const currentAuthUid = auth?.currentUser?.uid;
  const targetUid = currentAuthUid || uid;

  const profileData = {
    uid: targetUid,
    fullName: fullName || '',
    email: email || '',
    phone: phone || extraFields.phone || '',
    createdAt: new Date().toISOString(),
    preferences: extraFields.preferences || {
      pushEnabled: true,
      emailEnabled: false,
      smsEnabled: true
    },
    dob: extraFields.dob || '',
    bloodType: extraFields.bloodType || '',
    allergies: extraFields.allergies || []
  };

  // 1. Local AsyncStorage cache
  try {
    await saveLocalUserProfile(targetUid, profileData);
    if (targetUid !== uid) {
      await saveLocalUserProfile(uid, profileData);
    }
  } catch (cacheErr) {
    console.warn("saveUserProfile local cache error:", cacheErr.message);
  }

  // 2. Write to Firestore `users/${targetUid}` with 2.5s timeout
  try {
    const userDocRef = doc(db, 'users', targetUid);
    withTimeout(setDoc(userDocRef, profileData, { merge: true }), 2500).catch(err => {
      console.warn("saveUserProfile Firestore write notice:", err.message);
    });
  } catch (err) {}

  // 3. Write to RTDB `users/${targetUid}` with 2.5s timeout
  try {
    const userRef = ref(database, `users/${targetUid}`);
    withTimeout(update(userRef, {
      uid: profileData.uid,
      fullName: profileData.fullName,
      email: profileData.email,
      phone: profileData.phone,
      createdAt: profileData.createdAt,
      preferences: profileData.preferences,
      dob: profileData.dob,
      bloodType: profileData.bloodType,
      allergies: profileData.allergies
    }), 2500).catch(err => {
      console.warn("saveUserProfile RTDB write notice:", err.message);
    });
  } catch (err) {}

  return profileData;
};

/**
 * Seeds default clinical data for high-fidelity Module 2 flows
 */
export const seedDefaultClinicalData = async (uid) => {
  // 3. Seed Default Complaints for Module 7
  const complaintsRef = ref(database, `users/${uid}/complaints`);
  const complaintsSnapshot = await get(complaintsRef);
  if (!complaintsSnapshot.exists()) {
    const defaultComplaints = {
      'comp_1': {
        id: 'comp_1',
        pharmacyName: 'Central Metro Pharmacy',
        issueType: 'Overpricing',
        severity: 'Critical',
        date: 'Oct 14, 2023',
        description: 'Patient reported markup of 400% on insulin analogues compared to MSRP.',
        status: 'Under Investigation'
      },
      'comp_2': {
        id: 'comp_2',
        pharmacyName: 'Central Metro Pharmacy',
        issueType: 'Expired Medication',
        severity: 'Moderate',
        date: 'Sep 02, 2023',
        description: 'Shelf audit revealed 3 units of Amoxicillin past expiry date. Pharmacy complied with removal.',
        status: 'Resolved'
      },
      'comp_3': {
        id: 'comp_3',
        pharmacyName: 'Central Metro Pharmacy',
        issueType: 'Suspected Counterfeit',
        severity: 'High Risk',
        date: 'Jul 22, 2023',
        description: 'Packaging inconsistencies detected during spot check. Material sent for lab verification.',
        status: 'Flagged'
      },
      'comp_4': {
        id: 'comp_4',
        pharmacyName: 'Central Metro Pharmacy',
        issueType: 'Unprofessional Conduct',
        severity: 'Low',
        date: 'May 15, 2023',
        description: 'Staff behavior complaint. Management issued formal apology and retraining initiated.',
        status: 'Resolved'
      }
    };
    await set(complaintsRef, defaultComplaints);
  }
};

/**
 * Fetches a user profile from Firestore / RTDB / local cache
 */
export const getUserProfile = async (uid) => {
  const currentAuthUid = auth?.currentUser?.uid;
  const targetUid = currentAuthUid || uid;

  let profileData = null;

  try {
    const userDocRef = doc(db, 'users', targetUid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      profileData = docSnap.data();
    }
  } catch (e) {}

  if (!profileData) {
    try {
      const userRef = ref(database, `users/${targetUid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        profileData = snapshot.val();
      }
    } catch (e) {}
  }

  const localProfile = await getLocalUserProfile(targetUid);
  profileData = { ...(profileData || {}), ...(localProfile || {}) };

  if (Object.keys(profileData).length === 0) return null;
  return profileData;
};

/**
 * Sets up a real-time listener for the user profile
 * @returns {Function} unsubscribe function
 */
export const listenUserProfile = (uid, callback, errorCallback) => {
  const currentAuthUid = auth?.currentUser?.uid;
  const targetUid = currentAuthUid || uid;

  if (!targetUid) {
    if (errorCallback) errorCallback(new Error("No valid UID for profile listener"));
    return () => {};
  }

  let isActive = true;

  // 1. Instantly deliver cached profile from AsyncStorage (0ms latency)
  getLocalUserProfile(targetUid).then(localData => {
    if (isActive && localData && Object.keys(localData).length > 0) {
      callback(localData);
    }
  }).catch(() => {});

  // 2. Instantly fetch RTDB user profile node `users/${targetUid}`
  try {
    const userRtdbRef = ref(database, `users/${targetUid}`);
    get(userRtdbRef).then(snapshot => {
      if (isActive && snapshot.exists()) {
        const rtdbData = snapshot.val();
        if (rtdbData && typeof rtdbData === 'object' && Object.keys(rtdbData).length > 0) {
          saveLocalUserProfile(targetUid, rtdbData).catch(() => {});
          callback(rtdbData);
        }
      }
    }).catch(() => {});
  } catch (e) {}

  // 3. Listen to Firestore `users/${targetUid}` for live updates
  const userDocRef = doc(db, 'users', targetUid);
  const unsubFirestore = onSnapshot(userDocRef, async (docSnap) => {
    if (!isActive) return;
    let remoteData = docSnap.exists() ? docSnap.data() : null;
    const localData = await getLocalUserProfile(targetUid);
    const merged = { ...(remoteData || {}), ...(localData || {}) };
    if (Object.keys(merged).length > 0) {
      callback(merged);
    }
  }, async (err) => {
    if (!isActive) return;
    console.warn("listenUserProfile Firestore fallback to local storage:", err.message || err);
    const localData = await getLocalUserProfile(targetUid);
    if (localData && Object.keys(localData).length > 0) {
      callback(localData);
    } else {
      if (errorCallback) errorCallback(err);
    }
  });

  return () => {
    isActive = false;
    if (typeof unsubFirestore === 'function') unsubFirestore();
  };
};

/**
 * Sets up a real-time listener for user medications.
 * Primary source: Firebase RTDB (rules allow auth.uid === $uid, always reliable).
 * Secondary: Firestore collection (supplements RTDB data).
 * AsyncStorage is only updated when non-empty data is retrieved.
 */
export const listenUserMedications = (uid, callback, errorCallback) => {
  const currentAuthUid = auth?.currentUser?.uid;
  const targetUid = (uid && uid !== 'guest_user') ? uid : (currentAuthUid && currentAuthUid !== 'guest_user') ? currentAuthUid : null;

  if (!targetUid) {
    getLocalMedications('guest_user').then(localMeds => {
      if (callback) callback(filterOutDemoMeds(localMeds || {}));
    }).catch(() => { if (callback) callback({}); });
    return () => {};
  }

  const unsubscribers = [];
  let latestData = {};
  let hasDeliveredRemote = false;

  const deliverData = (data, source) => {
    const cleaned = filterOutDemoMeds(data);
    latestData = cleaned;
    const key = `@meditrust_meds_${targetUid}`;
    AsyncStorage.setItem(key, JSON.stringify(cleaned)).catch(() => {});
    if (source !== 'cache') {
      syncExpiryAlerts(targetUid, cleaned).catch(() => {});
    }
    if (callback) callback(cleaned);
  };

  // 1. Immediately load local cached medications so UI populates in 0ms
  getLocalMedications(targetUid).then(localMeds => {
    if (localMeds && Object.keys(localMeds).length > 0 && !hasDeliveredRemote) {
      deliverData(localMeds, 'cache');
    }
  }).catch(() => {});

  // 2. Primary: Firestore real-time listener on `users/${targetUid}/medications`
  //    (Firestore writes succeed from Web, so this is the reliable sync path)
  try {
    const userMedsCol = collection(db, 'users', targetUid, 'medications');
    const unsubFirestore = onSnapshot(userMedsCol, (querySnapshot) => {
      const fsMeds = {};
      querySnapshot.forEach(docSnap => {
        if (docSnap.exists()) {
          fsMeds[docSnap.id] = docSnap.data();
        }
      });
      if (Object.keys(fsMeds).length > 0 || hasDeliveredRemote) {
        hasDeliveredRemote = true;
        deliverData(fsMeds, 'firestore');
      }
    }, (fsErr) => {
      console.warn('[MedSync] Firestore listener error:', fsErr?.message || fsErr);
    });
    unsubscribers.push(unsubFirestore);
  } catch (e) {
    console.warn('[MedSync] Firestore setup error:', e?.message || e);
  }

  // 3. Secondary: RTDB real-time listener on `users/${targetUid}/medications`
  //    (Works when RTDB rules are properly deployed; supplements Firestore)
  try {
    const rtdbMedsRef = ref(database, `users/${targetUid}/medications`);
    const unsubRtdb = onValue(rtdbMedsRef, async (snapshot) => {
      let rtdbMeds = {};
      if (snapshot.exists()) {
        const raw = snapshot.val() || {};
        Object.keys(raw).forEach(k => {
          if (raw[k] && typeof raw[k] === 'object' && (raw[k].name || raw[k].medicineName)) {
            rtdbMeds[k] = raw[k];
          }
        });
        if (Object.keys(rtdbMeds).length > 0) {
          hasDeliveredRemote = true;
          // Merge RTDB data with Firestore data (RTDB may have items not yet in Firestore)
          const merged = { ...latestData, ...rtdbMeds };
          deliverData(merged, 'rtdb');
        }
      }
    }, (rtdbErr) => {
      // RTDB permission denied — this is expected when rules aren't deployed
      // Firestore listener above handles sync in this case
      console.warn('[MedSync] RTDB listener error (using Firestore fallback):', rtdbErr?.message || rtdbErr);
      if (errorCallback) errorCallback(rtdbErr);
    });
    unsubscribers.push(unsubRtdb);
  } catch (e) {
    console.warn('[MedSync] RTDB setup error:', e?.message || e);
  }

  // Return cleanup function that unsubscribes all listeners
  return () => {
    unsubscribers.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
  };
};

/**
 * Sets up a real-time listener for user notifications
 */
export const listenUserNotifications = (uid, callback, errorCallback) => {
  const currentAuthUid = auth?.currentUser?.uid;
  const targetUid = currentAuthUid || uid || 'guest_user';

  if (!canWriteToRtdb(targetUid)) {
    if (callback) callback({});
    return () => {};
  }

  const notifsRef = ref(database, `users/${targetUid}/notifications`);
  return onValue(notifsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  }, errorCallback);
};

/**
 * Add or update medication in Firebase RTDB (primary) and Firestore (secondary) & local cache.
 * RTDB is primary because security rules are correctly configured for auth.uid === $uid.
 */
export const saveUserMedication = async (uid, medData) => {
  const currentAuthUid = auth?.currentUser?.uid;
  const targetUid = currentAuthUid || uid || 'guest_user';
  const medId = medData.id || `med_${Date.now()}`;
  const todayIso = new Date().toISOString().split('T')[0];

  const updatedMed = {
    id: medId,
    name: medData.medicineName || medData.name || 'New Medication',
    medicineName: medData.medicineName || medData.name || 'New Medication',
    dosage: medData.dosage || medData.strength || '500mg',
    strength: medData.strength || medData.dosage || '500mg',
    type: medData.type || medData.medicineType || 'Tablet',
    medicineType: medData.type || medData.medicineType || 'Tablet',
    time: medData.time || '09:00 AM',
    frequency: medData.frequency || 'Once daily',
    instructions: medData.instructions || medData.notes || '',
    notes: medData.notes || medData.instructions || '',
    startDate: medData.startDate || todayIso,
    endDate: medData.endDate || '2099-12-31',
    takenLogs: medData.takenLogs || {},
    expDate: medData.expDate || '',
    mfgDate: medData.mfgDate || '',
    batch: medData.batch || '',
    manufacturer: medData.manufacturer || '',
    createdAt: medData.createdAt || new Date().toISOString(),
    userId: targetUid,
    takenStatus: medData.takenStatus ?? (medData.taken ?? false),
    taken: medData.taken ?? (medData.takenStatus ?? false),
    takenTime: medData.takenTime || ''
  };

  // 1. Save to local AsyncStorage cache first (0ms instant response)
  await saveLocalMedicationObject(targetUid, updatedMed);
  if (uid && uid !== targetUid) {
    await saveLocalMedicationObject(uid, updatedMed);
  }

  // 2. Write to Firestore user-scoped collection (PRIMARY sync path for cross-platform)
  if (targetUid && targetUid !== 'guest_user') {
    try {
      const userMedDocRef = doc(db, 'users', targetUid, 'medications', medId);
      setDoc(userMedDocRef, updatedMed, { merge: true }).catch(e => {
        console.warn('[Medication] Firestore user-scoped write error:', e?.message || e);
      });
    } catch (err) {}
  }

  // 3. Non-blocking RTDB write (secondary — may fail if rules not deployed)
  if (currentAuthUid) {
    try {
      const medRef = ref(database, `users/${currentAuthUid}/medications/${medId}`);
      withTimeout(set(medRef, updatedMed), 2500).catch(() => {});
    } catch (err) {}
  }

  // 4. Non-blocking global Firestore write
  try {
    const medDocRef = doc(db, 'medications', medId);
    withTimeout(setDoc(medDocRef, updatedMed, { merge: true }), 2500).catch(() => {});
  } catch (err) {}

  // 5. Non-blocking Expiry Alerts Sync
  try {
    getLocalMedications(targetUid).then(localMeds => {
      syncExpiryAlerts(targetUid, { ...localMeds, [medId]: updatedMed }).catch(() => {});
    }).catch(() => {});
  } catch (err) {}

  return updatedMed;
};

/**
 * Toggle the taken state of a medication in RTDB (primary) & local storage
 */
export const toggleMedicationTakenState = async (
  uid, 
  medId, 
  takenState, 
  dateStr = new Date().toISOString().split('T')[0], 
  timeKey = '09:00 AM'
) => {
  const now = new Date();
  const takenTime = takenState 
    ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : '';

  const currentAuthUid = auth?.currentUser?.uid;
  const targetUid = currentAuthUid || uid || 'guest_user';
  const todayIso = now.toISOString().split('T')[0];

  // 1. Local AsyncStorage cache update (0ms)
  try {
    const localMeds = (await getLocalMedications(targetUid)) || {};
    if (localMeds[medId]) {
      const existingLogs = localMeds[medId].takenLogs || {};
      const dayLog = existingLogs[dateStr] || {};
      const updatedDayLog = {
        ...dayLog,
        [timeKey]: { taken: takenState, takenTime }
      };
      const updatedLogs = {
        ...existingLogs,
        [dateStr]: updatedDayLog
      };
      localMeds[medId].takenLogs = updatedLogs;
      if (dateStr === todayIso) {
        localMeds[medId].taken = takenState;
        localMeds[medId].takenStatus = takenState;
        localMeds[medId].takenTime = takenTime;
      }
      const key = `@meditrust_meds_${targetUid}`;
      await AsyncStorage.setItem(key, JSON.stringify(localMeds));
    }
  } catch (e) {}

  // 2. Update Firestore user-scoped collection (PRIMARY sync path)
  if (targetUid && targetUid !== 'guest_user') {
    try {
      const fsUpdateData = {
        [`takenLogs.${dateStr}.${timeKey}`]: { taken: takenState, takenTime }
      };
      if (dateStr === todayIso) {
        fsUpdateData.taken = takenState;
        fsUpdateData.takenStatus = takenState;
        fsUpdateData.takenTime = takenTime;
      }
      const userMedDocRef = doc(db, 'users', targetUid, 'medications', medId);
      updateDoc(userMedDocRef, fsUpdateData).catch(() => {});
    } catch (err) {}
  }

  // 3. Update RTDB if authenticated (secondary)
  if (currentAuthUid) {
    try {
      const medRef = ref(database, `users/${currentAuthUid}/medications/${medId}`);
      const updateData = {
        [`takenLogs/${dateStr}/${timeKey}`]: { taken: takenState, takenTime }
      };
      if (dateStr === todayIso) {
        updateData.taken = takenState;
        updateData.takenStatus = takenState;
        updateData.takenTime = takenTime;
      }
      await update(medRef, updateData);
    } catch (err) {}
  }

  return { taken: takenState, takenTime, dateStr, timeKey };
};

/**
 * Delete a medication permanently from RTDB (primary), Firestore (secondary), and local storage cache
 */
export const deleteUserMedication = async (uid, medId) => {
  const currentAuthUid = auth?.currentUser?.uid;
  const targetUid = currentAuthUid || uid || 'guest_user';

  // 1. Purge from AsyncStorage local storage keys immediately (0ms)
  const keysToClean = [
    `@meditrust_meds_${targetUid}`,
    `@meditrust_meds_${uid}`
  ];
  for (const k of keysToClean) {
    if (!k) continue;
    try {
      const stored = await AsyncStorage.getItem(k);
      if (stored) {
        const meds = JSON.parse(stored);
        if (meds[medId]) {
          delete meds[medId];
          await AsyncStorage.setItem(k, JSON.stringify(meds));
        }
      }
    } catch (e) {}
  }

  // 2. Delete from RTDB if authenticated
  if (currentAuthUid) {
    try {
      const medRef = ref(database, `users/${currentAuthUid}/medications/${medId}`);
      await remove(medRef);
    } catch (err) {}
  }

  // 3. Delete from Firestore user-scoped collection (PRIMARY sync path)
  if (targetUid && targetUid !== 'guest_user') {
    try {
      const userMedDocRef = doc(db, 'users', targetUid, 'medications', medId);
      await deleteDoc(userMedDocRef);
    } catch (err) {}
  }

  // 4. Delete from Firestore global collection
  try {
    const medDocRef = doc(db, 'medications', medId);
    await deleteDoc(medDocRef);
  } catch (err) {}

  // 5. Remove corresponding expiry alert notification from RTDB
  if (currentAuthUid) {
    try {
      const notifRef = ref(database, `users/${currentAuthUid}/notifications/expiry_alert_${medId}`);
      await remove(notifRef);
    } catch (err) {}
  }

  return true;
};



/**
 * Update unread read status of a notification
 */
export const updateNotificationReadState = async (uid, notifId, unreadState) => {
  const notifRef = ref(database, `users/${uid}/notifications/${notifId}`);
  await update(notifRef, { unread: unreadState });
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (uid) => {
  const notifsRef = ref(database, `users/${uid}/notifications`);
  const snapshot = await get(notifsRef);
  if (snapshot.exists()) {
    const notifs = snapshot.val();
    const updates = {};
    Object.keys(notifs).forEach(key => {
      updates[`${key}/unread`] = false;
    });
    await update(notifsRef, updates);
  }
};

/**
 * Delete a notification/alert
 */
export const deleteUserNotification = async (uid, notifId) => {
  const notifRef = ref(database, `users/${uid}/notifications/${notifId}`);
  await remove(notifRef);
};

/**
 * Save dose reminder notification without adding medicine to daily medications / upcoming doses / expiry management
 */
export const saveUserReminderNotification = async (uid, medName, timeStr = '09:00 AM', customNote = '') => {
  const targetUid = auth?.currentUser?.uid || uid || 'guest_user';
  const notifId = `reminder_${Date.now()}`;
  const notifData = {
    id: notifId,
    title: `Dose Reminder: ${medName}`,
    description: customNote || `Scheduled dose alert set for ${timeStr}. Take medication as directed.`,
    time: timeStr,
    type: 'reminder',
    unread: true,
    createdAt: new Date().toISOString()
  };

  try {
    const notifRef = ref(database, `users/${targetUid}/notifications/${notifId}`);
    await set(notifRef, notifData);
  } catch (e) {
    console.warn("saveUserReminderNotification RTDB error:", e.message);
  }

  return notifData;
};

/**
 * Update user notification preferences
 */
export const updateUserPreferences = async (uid, preferences) => {
  const targetUid = auth?.currentUser?.uid || uid || 'guest_user';
  try {
    const prefRef = ref(database, `users/${targetUid}/preferences`);
    await update(prefRef, preferences);
  } catch (e) {
    console.warn("RTDB updateUserPreferences error:", e.message);
  }
  
  try {
    const localProf = (await getLocalUserProfile(targetUid)) || {};
    const updatedPrefs = { ...(localProf.preferences || {}), ...preferences };
    await saveLocalUserProfile(targetUid, { preferences: updatedPrefs });
  } catch (e) {}
};

/**
 * Update patient profile details in Firestore, RTDB, and local storage cache
 */
export const updateUserProfileFields = async (uid, fields) => {
  const currentAuthUid = auth?.currentUser?.uid;
  const targetUid = currentAuthUid || uid;

  // 1. Always update local storage first so state persists instantly and reliably
  const updatedLocal = await saveLocalUserProfile(targetUid, fields);
  if (targetUid !== uid) {
    await saveLocalUserProfile(uid, fields);
  }

  // 2. Write to Firestore `users/${targetUid}`
  try {
    const userDocRef = doc(db, 'users', targetUid);
    await setDoc(userDocRef, fields, { merge: true });
  } catch (err) {
    console.warn(`updateUserProfileFields Firestore error for ${targetUid}:`, err.message || err);
  }

  // 3. Write to RTDB `users/${targetUid}`
  try {
    const userRef = ref(database, `users/${targetUid}`);
    await update(userRef, fields);
  } catch (err) {
    console.warn(`updateUserProfileFields RTDB error for ${targetUid}:`, err.message || err);
  }

  return updatedLocal || fields;
};

/**
 * Save a verified medication scan event in RTDB history
 */
export const saveUserScanEvent = async (uid, scanData) => {
  const scansRef = ref(database, `users/${uid}/scans`);
  const newScanId = push(scansRef).key;
  const scanEventRef = ref(database, `users/${uid}/scans/${newScanId}`);
  const event = {
    ...scanData,
    id: newScanId,
    timestamp: new Date().toISOString()
  };
  await set(scanEventRef, event);
  return event;
};

/**
 * Listen to verification scan events in real-time
 */
export const listenUserScans = (uid, callback) => {
  const scansRef = ref(database, `users/${uid}/scans`);
  return onValue(scansRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });
};

/**
/**
 * Get local bookmarked medicines from AsyncStorage
 */
export const getLocalBookmarks = async (uid) => {
  const targetUid = auth?.currentUser?.uid || uid || 'guest_user';
  try {
    const key = `@meditrust_bookmarks_${targetUid}`;
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
};

/**
 * Bookmark/Save a medicine to user profile in Firebase RTDB & local storage
 */
export const saveUserBookmarkedMedicine = async (uid, medicineId, medicineData) => {
  const targetUid = auth?.currentUser?.uid || uid || 'guest_user';
  const bookmark = {
    ...medicineData,
    id: medicineId,
    bookmarkedAt: new Date().toISOString()
  };

  // 1. Save locally
  try {
    const key = `@meditrust_bookmarks_${targetUid}`;
    const stored = await AsyncStorage.getItem(key);
    const bookmarks = stored ? JSON.parse(stored) : {};
    bookmarks[medicineId] = bookmark;
    await AsyncStorage.setItem(key, JSON.stringify(bookmarks));
  } catch (e) {}

  // 2. Write to RTDB (secondary)
  try {
    const bookmarkRef = ref(database, `users/${targetUid}/savedMedicines/${medicineId}`);
    await set(bookmarkRef, bookmark);
  } catch (e) {
    console.warn("saveUserBookmarkedMedicine RTDB warning:", e.message);
  }

  return bookmark;
};

/**
 * Remove a bookmarked medicine from user profile
 */
export const deleteUserBookmarkedMedicine = async (uid, medicineId) => {
  const targetUid = auth?.currentUser?.uid || uid || 'guest_user';

  // 1. Delete locally
  try {
    const key = `@meditrust_bookmarks_${targetUid}`;
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      const bookmarks = JSON.parse(stored);
      delete bookmarks[medicineId];
      await AsyncStorage.setItem(key, JSON.stringify(bookmarks));
    }
  } catch (e) {}

  // 2. Delete from RTDB
  try {
    const bookmarkRef = ref(database, `users/${targetUid}/savedMedicines/${medicineId}`);
    await remove(bookmarkRef);
  } catch (e) {}

  return true;
};

/**
 * Listen to bookmarked medicines in real-time
 */
export const listenUserBookmarkedMedicines = (uid, callback) => {
  const targetUid = auth?.currentUser?.uid || uid || 'guest_user';
  
  // Deliver local cached bookmarks immediately
  getLocalBookmarks(targetUid).then(localBms => {
    callback(localBms || {});
  }).catch(() => {});

  try {
    const bookmarksRef = ref(database, `users/${targetUid}/savedMedicines`);
    return onValue(bookmarksRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val() || {};
        callback(val);
      } else {
        getLocalBookmarks(targetUid).then(localBms => {
          callback(localBms || {});
        });
      }
    }, (err) => {
      getLocalBookmarks(targetUid).then(localBms => callback(localBms || {}));
    });
  } catch (e) {
    getLocalBookmarks(targetUid).then(localBms => callback(localBms || {}));
    return () => {};
  }
};

/**
 * Save user health conditions checklist to Firebase RTDB
 */
export const saveUserConditions = async (uid, conditions) => {
  const condRef = ref(database, `users/${uid}/conditions`);
  await set(condRef, conditions);
  return conditions;
};

/**
 * Listen to user health conditions checklist in real-time
 */
export const listenUserConditions = (uid, callback) => {
  const condRef = ref(database, `users/${uid}/conditions`);
  return onValue(condRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback([]);
    }
  });
};

/**
 * Save a patient reported side effect globally in Firebase RTDB & local cache
 */
export const saveUserSideEffectReport = async (uid, reportData) => {
  const reportsRef = ref(database, `sideEffectsReports`);
  const newReportId = push(reportsRef).key;
  const report = {
    ...reportData,
    id: newReportId,
    uid,
    createdAt: new Date().toISOString()
  };

  try {
    const cached = await AsyncStorage.getItem('@meditrust_side_effects');
    const map = cached ? JSON.parse(cached) : {};
    map[newReportId] = report;
    await AsyncStorage.setItem('@meditrust_side_effects', JSON.stringify(map));
  } catch (e) {}

  try {
    const reportRef = ref(database, `sideEffectsReports/${newReportId}`);
    await set(reportRef, report);
  } catch (err) {
    console.warn("saveUserSideEffectReport RTDB write error:", err.message || err);
  }
  return report;
};

/**
 * Listen to global side effects reports in real-time
 */
export const listenSideEffectsReports = (callback) => {
  const reportsRef = ref(database, `sideEffectsReports`);
  return onValue(reportsRef, async (snapshot) => {
    let remoteData = snapshot.exists() ? snapshot.val() : {};
    try {
      const cached = await AsyncStorage.getItem('@meditrust_side_effects');
      if (cached) {
        remoteData = { ...JSON.parse(cached), ...remoteData };
      }
    } catch (e) {}
    callback(remoteData);
  }, async () => {
    try {
      const cached = await AsyncStorage.getItem('@meditrust_side_effects');
      if (cached) {
        callback(JSON.parse(cached));
        return;
      }
    } catch (e) {}
    callback({});
  });
};

/**
 * Save a medicine product review globally in Firebase RTDB & local cache
 */
export const saveMedicineReview = async (uid, medicineId, reviewData) => {
  const currentAuthUid = auth?.currentUser?.uid;
  const targetUid = currentAuthUid || uid || 'guest_user';

  const reviewsRef = ref(database, `medicineReviews/${medicineId}`);
  const newReviewId = push(reviewsRef).key;
  const review = {
    ...reviewData,
    id: newReviewId,
    uid: targetUid,
    medicineId,
    createdAt: new Date().toISOString()
  };

  // 1. Cache under specific medicineId
  try {
    const cached = await AsyncStorage.getItem(`@meditrust_reviews_${medicineId}`);
    const map = cached ? JSON.parse(cached) : {};
    map[newReviewId] = review;
    await AsyncStorage.setItem(`@meditrust_reviews_${medicineId}`, JSON.stringify(map));
  } catch (e) {}

  // 2. Cache under global all_reviews so listenAllMedicineReviews sees it immediately
  try {
    const cachedAll = await AsyncStorage.getItem('@meditrust_all_reviews');
    const allMap = cachedAll ? JSON.parse(cachedAll) : {};
    if (!allMap[medicineId] || typeof allMap[medicineId] !== 'object') {
      allMap[medicineId] = {};
    }
    allMap[medicineId][newReviewId] = review;
    await AsyncStorage.setItem('@meditrust_all_reviews', JSON.stringify(allMap));
  } catch (e) {}

  // 3. Write to RTDB
  try {
    const reviewRef = ref(database, `medicineReviews/${medicineId}/${newReviewId}`);
    await set(reviewRef, review);
  } catch (err) {
    console.warn("saveMedicineReview RTDB write error (saved to local cache):", err.message || err);
  }
  return review;
};

/**
 * Listen to reviews of a specific medicine in real-time
 */
export const listenMedicineReviews = (medicineId, callback) => {
  const reviewsRef = ref(database, `medicineReviews/${medicineId}`);
  return onValue(reviewsRef, async (snapshot) => {
    let remoteData = snapshot.exists() ? snapshot.val() : {};
    try {
      const cached = await AsyncStorage.getItem(`@meditrust_reviews_${medicineId}`);
      if (cached) {
        remoteData = { ...JSON.parse(cached), ...remoteData };
      }
    } catch (e) {}
    callback(remoteData);
  }, async () => {
    try {
      const cached = await AsyncStorage.getItem(`@meditrust_reviews_${medicineId}`);
      if (cached) {
        callback(JSON.parse(cached));
        return;
      }
    } catch (e) {}
    callback({});
  });
};

/**
 * Listen to all medicine reviews globally in real-time for Community Feed
 */
export const listenAllMedicineReviews = (callback, errorCallback) => {
  const reviewsRef = ref(database, `medicineReviews`);
  return onValue(reviewsRef, async (snapshot) => {
    let remoteData = snapshot.exists() ? (snapshot.val() || {}) : {};
    try {
      const cached = await AsyncStorage.getItem('@meditrust_all_reviews');
      if (cached) {
        remoteData = { ...JSON.parse(cached), ...remoteData };
      }
    } catch (e) {}
    callback(remoteData);
  }, async (err) => {
    try {
      const cached = await AsyncStorage.getItem('@meditrust_all_reviews');
      if (cached) {
        callback(JSON.parse(cached));
        return;
      }
    } catch (e) {}
    if (errorCallback) errorCallback(err);
    else callback({});
  });
};

/**
 * Update a medicine review in RTDB and local cache
 */
export const updateMedicineReview = async (medicineId, reviewId, updatedData) => {
  const currentAuthUid = auth?.currentUser?.uid;

  try {
    const cachedAll = await AsyncStorage.getItem('@meditrust_all_reviews');
    if (cachedAll) {
      const allMap = JSON.parse(cachedAll);
      if (allMap[medicineId] && allMap[medicineId][reviewId]) {
        allMap[medicineId][reviewId] = { ...allMap[medicineId][reviewId], ...updatedData };
        await AsyncStorage.setItem('@meditrust_all_reviews', JSON.stringify(allMap));
      }
    }

    const cachedMed = await AsyncStorage.getItem(`@meditrust_reviews_${medicineId}`);
    if (cachedMed) {
      const medMap = JSON.parse(cachedMed);
      if (medMap[reviewId]) {
        medMap[reviewId] = { ...medMap[reviewId], ...updatedData };
        await AsyncStorage.setItem(`@meditrust_reviews_${medicineId}`, JSON.stringify(medMap));
      }
    }
  } catch (e) {}

  if (currentAuthUid) {
    try {
      const reviewRef = ref(database, `medicineReviews/${medicineId}/${reviewId}`);
      await update(reviewRef, updatedData);
    } catch (err) {}
  }
};

/**
 * Delete a medicine review permanently from RTDB and local cache
 */
export const deleteMedicineReview = async (medicineId, reviewId) => {
  const currentAuthUid = auth?.currentUser?.uid;

  try {
    const cachedAll = await AsyncStorage.getItem('@meditrust_all_reviews');
    if (cachedAll) {
      const allMap = JSON.parse(cachedAll);
      if (allMap[medicineId] && allMap[medicineId][reviewId]) {
        delete allMap[medicineId][reviewId];
        await AsyncStorage.setItem('@meditrust_all_reviews', JSON.stringify(allMap));
      }
    }

    const cachedMed = await AsyncStorage.getItem(`@meditrust_reviews_${medicineId}`);
    if (cachedMed) {
      const medMap = JSON.parse(cachedMed);
      if (medMap[reviewId]) {
        delete medMap[reviewId];
        await AsyncStorage.setItem(`@meditrust_reviews_${medicineId}`, JSON.stringify(medMap));
      }
    }
  } catch (e) {}

  if (currentAuthUid) {
    try {
      const reviewRef = ref(database, `medicineReviews/${medicineId}/${reviewId}`);
      await remove(reviewRef);
    } catch (err) {}
  }
};

/**
 * Update a side effect report in RTDB and local cache
 */
export const updateSideEffectReport = async (reportId, updatedData) => {
  const currentAuthUid = auth?.currentUser?.uid;

  try {
    const cached = await AsyncStorage.getItem('@meditrust_side_effects');
    if (cached) {
      const map = JSON.parse(cached);
      if (map[reportId]) {
        map[reportId] = { ...map[reportId], ...updatedData };
        await AsyncStorage.setItem('@meditrust_side_effects', JSON.stringify(map));
      }
    }
  } catch (e) {}

  if (currentAuthUid) {
    try {
      const reportRef = ref(database, `sideEffectsReports/${reportId}`);
      await update(reportRef, updatedData);
    } catch (err) {}
  }
};

/**
 * Delete a side effect report permanently from RTDB and local cache
 */
export const deleteSideEffectReport = async (reportId) => {
  const currentAuthUid = auth?.currentUser?.uid;

  try {
    const cached = await AsyncStorage.getItem('@meditrust_side_effects');
    if (cached) {
      const map = JSON.parse(cached);
      if (map[reportId]) {
        delete map[reportId];
        await AsyncStorage.setItem('@meditrust_side_effects', JSON.stringify(map));
      }
    }
  } catch (e) {}

  if (currentAuthUid) {
    try {
      const reportRef = ref(database, `sideEffectsReports/${reportId}`);
      await remove(reportRef);
    } catch (err) {}
  }
};

/**
 * Update a community safety alert in RTDB and local cache
 */
export const updateCommunityAlert = async (alertId, updatedData) => {
  const currentAuthUid = auth?.currentUser?.uid;

  try {
    const cached = await AsyncStorage.getItem('@meditrust_community_alerts');
    if (cached) {
      const map = JSON.parse(cached);
      if (map[alertId]) {
        map[alertId] = { ...map[alertId], ...updatedData };
        await AsyncStorage.setItem('@meditrust_community_alerts', JSON.stringify(map));
      }
    }
  } catch (e) {}

  if (currentAuthUid) {
    try {
      const alertRef = ref(database, `communityAlerts/${alertId}`);
      await update(alertRef, updatedData);
    } catch (e) {}
  }
};

/**
 * Delete a community safety alert permanently from RTDB and local cache
 */
export const deleteCommunityAlert = async (alertId) => {
  const currentAuthUid = auth?.currentUser?.uid;

  try {
    const cached = await AsyncStorage.getItem('@meditrust_community_alerts');
    if (cached) {
      const map = JSON.parse(cached);
      if (map[alertId]) {
        delete map[alertId];
        await AsyncStorage.setItem('@meditrust_community_alerts', JSON.stringify(map));
      }
    }
  } catch (e) {}

  if (currentAuthUid) {
    try {
      const alertRef = ref(database, `communityAlerts/${alertId}`);
      await remove(alertRef);
    } catch (e) {}
  }
};

/**
 * Saves a user complaint report to the database & local cache
 */
export const saveUserComplaint = async (uid, complaintData) => {
  const targetUid = auth?.currentUser?.uid || uid || 'guest_user';
  const complaintsRef = ref(database, `users/${targetUid}/complaints`);
  const newComplaintRef = push(complaintsRef);
  const data = {
    id: newComplaintRef.key,
    uid: targetUid,
    createdAt: new Date().toISOString(),
    status: complaintData?.status || 'Under Investigation',
    ...complaintData
  };

  try {
    const cached = await AsyncStorage.getItem(`@meditrust_complaints_${targetUid}`);
    const map = cached ? JSON.parse(cached) : {};
    map[data.id] = data;
    await AsyncStorage.setItem(`@meditrust_complaints_${targetUid}`, JSON.stringify(map));
  } catch (e) {}

  if (targetUid && targetUid !== 'guest_user') {
    try {
      await set(newComplaintRef, data);
    } catch (err) {
      console.warn("saveUserComplaint RTDB write error:", err.message || err);
    }
    try {
      const globalRef = ref(database, `community/complaints/${data.id}`);
      await set(globalRef, data);
    } catch (err) {}
  }
  return data;
};

/**
 * Listens to user complaints in real-time
 */
export const listenUserComplaints = (uid, callback) => {
  const targetUid = auth?.currentUser?.uid || uid || 'guest_user';
  if (!targetUid || targetUid === 'guest_user') {
    if (callback) callback({});
    return () => {};
  }

  // 1. Deliver local cached complaints immediately
  AsyncStorage.getItem(`@meditrust_complaints_${targetUid}`).then(cached => {
    if (cached && callback) callback(JSON.parse(cached));
  }).catch(() => {});

  // 2. Real-time listener on user complaints
  const complaintsRef = ref(database, `users/${targetUid}/complaints`);
  return onValue(complaintsRef, async (snapshot) => {
    let remoteData = snapshot.exists() ? (snapshot.val() || {}) : {};
    try {
      await AsyncStorage.setItem(`@meditrust_complaints_${targetUid}`, JSON.stringify(remoteData));
    } catch (e) {}
    if (callback) callback(remoteData);
  }, async (err) => {
    try {
      const cached = await AsyncStorage.getItem(`@meditrust_complaints_${targetUid}`);
      if (callback) callback(cached ? JSON.parse(cached) : {});
    } catch (e) {
      if (callback) callback({});
    }
  });
};

/**
 * Listen to global community alerts in real-time
 */
export const listenCommunityAlerts = (callback, errorCallback) => {
  const alertsRef = ref(database, 'communityAlerts');
  return onValue(alertsRef, async (snapshot) => {
    let remoteAlerts = snapshot.exists() ? (snapshot.val() || {}) : {};
    try {
      const cached = await AsyncStorage.getItem('@meditrust_community_alerts');
      if (cached) {
        const localMap = JSON.parse(cached);
        remoteAlerts = { ...localMap, ...remoteAlerts };
      }
    } catch (e) {}
    callback(remoteAlerts);
  }, async (err) => {
    try {
      const cached = await AsyncStorage.getItem('@meditrust_community_alerts');
      if (cached) {
        callback(JSON.parse(cached));
        return;
      }
    } catch (e) {}
    if (errorCallback) errorCallback(err);
  });
};

/**
 * Save/report a new community alert
 */
export const saveCommunityAlert = async (alertData) => {
  const alertsRef = ref(database, 'communityAlerts');
  const newAlertId = alertData.id || push(alertsRef).key;
  const alert = {
    ...alertData,
    id: newAlertId,
    timestamp: alertData.timestamp || new Date().toISOString()
  };

  try {
    const cached = await AsyncStorage.getItem('@meditrust_community_alerts');
    const alertsMap = cached ? JSON.parse(cached) : {};
    alertsMap[newAlertId] = alert;
    await AsyncStorage.setItem('@meditrust_community_alerts', JSON.stringify(alertsMap));
  } catch (e) {}

  try {
    const alertRef = ref(database, `communityAlerts/${newAlertId}`);
    await set(alertRef, alert);
  } catch (err) {
    console.warn("saveCommunityAlert RTDB write error (saved to local cache):", err.message || err);
  }
  return alert;
};

/**
 * Listen to suspicious medicines list in real-time
 */
export const listenSuspiciousMedicines = (callback, errorCallback) => {
  const suspiciousRef = ref(database, 'suspiciousMedicines');
  return onValue(suspiciousRef, async (snapshot) => {
    let remoteMeds = snapshot.exists() ? (snapshot.val() || {}) : {};
    try {
      const cached = await AsyncStorage.getItem('@meditrust_suspicious_meds');
      if (cached) {
        const localMap = JSON.parse(cached);
        remoteMeds = { ...localMap, ...remoteMeds };
      }
    } catch (e) {}
    callback(remoteMeds);
  }, async (err) => {
    try {
      const cached = await AsyncStorage.getItem('@meditrust_suspicious_meds');
      if (cached) {
        callback(JSON.parse(cached));
        return;
      }
    } catch (e) {}
    if (errorCallback) errorCallback(err);
  });
};

/**
 * Save/report a suspicious medicine
 */
export const saveSuspiciousMedicine = async (medData) => {
  const suspiciousRef = ref(database, 'suspiciousMedicines');
  const newMedId = medData.id || push(suspiciousRef).key;
  const med = {
    ...medData,
    id: newMedId
  };

  try {
    const cached = await AsyncStorage.getItem('@meditrust_suspicious_meds');
    const medsMap = cached ? JSON.parse(cached) : {};
    medsMap[newMedId] = med;
    await AsyncStorage.setItem('@meditrust_suspicious_meds', JSON.stringify(medsMap));
  } catch (e) {}

  try {
    const medRef = ref(database, `suspiciousMedicines/${newMedId}`);
    await set(medRef, med);
  } catch (err) {
    console.warn("saveSuspiciousMedicine RTDB write error (saved to local cache):", err.message || err);
  }
  return med;
};

/**
 * Listen to official medicine recall alerts in real-time
 */
export const listenMedicineRecalls = (callback, errorCallback) => {
  const recallsRef = ref(database, 'medicineRecalls');
  return onValue(recallsRef, (snapshot) => {
    callback(snapshot.val() || {});
  }, errorCallback);
};

/**
 * Save/report a medicine recall alert
 */
export const saveMedicineRecall = async (recallData) => {
  const recallsRef = ref(database, 'medicineRecalls');
  const newRecallId = recallData.id || push(recallsRef).key;
  const recallRef = ref(database, `medicineRecalls/${newRecallId}`);
  const recall = {
    ...recallData,
    id: newRecallId
  };
  await set(recallRef, recall);
  return recall;
};

/**
 * Seeds default safety data for Module 9 if the nodes are empty
 */
export const seedDefaultSafetyData = async () => {
  try {
    const currentAuthUid = auth?.currentUser?.uid;
    if (!currentAuthUid) return;

    // 1. Seed Alerts
    const alertsRef = ref(database, 'communityAlerts');
    const alertsSnapshot = await get(alertsRef);
    if (!alertsSnapshot.exists()) {
      const defaultAlerts = {
        'alert_1': {
          id: 'alert_1',
          title: "Inconsistent Packaging",
          riskLevel: "High",
          medicineName: "Amoxicillin 500mg",
          description: "Reported batch numbers #AX-2024 showing compromised seals and inconsistent typography in North District pharmacies.",
          location: "North District",
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
        },
        'alert_2': {
          id: 'alert_2',
          title: "Storage Violation",
          riskLevel: "Elevated",
          medicineName: "Insulin Glargine",
          description: "Temperature control failure detected during transport to Central Hospital. Potential potency loss suspected.",
          location: "Central District",
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
        },
        'alert_3': {
          id: 'alert_3',
          title: "Labeling Update",
          riskLevel: "Low",
          medicineName: "Common Pain Relief",
          description: "Manufacturer issuing minor labeling correction regarding shelf-life extension from 24 to 36 months.",
          location: "East District",
          timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString()
        }
      };
      await set(alertsRef, defaultAlerts);
    }

    // 2. Seed Suspicious Medicines
    const suspiciousRef = ref(database, 'suspiciousMedicines');
    const suspiciousSnapshot = await get(suspiciousRef);
    if (!suspiciousSnapshot.exists()) {
      const defaultSuspicious = {
        'susp_1': {
          id: 'susp_1',
          name: "Amoxycillin 500mg",
          manufacturer: "GlobalPharma Solutions",
          reportsCount: 14,
          suspicion: "Mismatched pill color in Batch #2901-X",
          status: "Urgent",
          imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDp7hi7FdWJyAAGRF6T9s5Xux2ti8Kvjd4Xs6mDIejYa7iwYhLAseHV7ylSSpHOmIOIw9sT6DHzS9IjCMR5Qz2_YOpST2Ozqk-QUoglY0K7vzwco9vyZlsSohJ4PMjob9OqAaTKCvdiIWAcWULSNT53uVIQxuvmkw-d8GLQM99VStP4fH4UbnvBZ06DYh6T-xwbjUwaltJHIRHE-sYdkI3tB2IYnXzwJ1d_nDMeJ4OLc9fiOneQXmNqKKKKKVi2EnybKUEq-SIdtQh-"
        },
        'susp_2': {
          id: 'susp_2',
          name: "CardioPress XL",
          manufacturer: "HealthCore Labs",
          reportsCount: 8,
          suspicion: "Label typo 'Expiry' spelled 'Expirry'",
          status: "Active",
          imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuABKYt0-XK9_MHqLFeHJWOgfPxMB6NURZUq0Ici1ORCtwz3BiKB_KK7171Udno1i2imJoSAU2cyVDGTJpYYJVfwBKPXt9mmP4zQ4KHRQWoEjFntiFwjbul5teA5LxkfLWQEFUSTTrcVVf9i4UTORhPDXrD3DJScKzucSfqYz6xxe1t-eXSpo8hilOpE7dLW-Pns9HIjSLEPCR5DO_XBTZoZMRvhD8H8zQAgmM-5xwoaYLH62MPiup-LieBSuZE-k0XcwbWsaOtJ8OiH"
        },
        'susp_3': {
          id: 'susp_3',
          name: "Insulin Gen-A",
          manufacturer: "BioGenerics Inc.",
          reportsCount: 5,
          suspicion: "Box seal appears tampered or reglued",
          status: "Active",
          imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDZpr57q3Aq2Gdp7XYCzgC4vBvp-cr7FIVDR1x7jKt0wqBYPjtNwJyNv5RdPYAfh-0QklBDybuMxyyHwkkdTBqFxbUy_wZogjMShEzMS-FVQiBskLEBr0jB79FnTJJsOrRPA-JgXyZyGSijGQpZjxonuVw0j9CMXAFWMoM0vTZAq7RJlsO-y35LHkmB4E-8eLKURbteUtVuanARjeecjhmzFJZYzxEAA8IMJCPzzrZgsyFD9KdZZ2osZW77LKBXoPtvpZf4zRyMgAfP"
        },
        'susp_4': {
          id: 'susp_4',
          name: "NeuroZenic 10",
          manufacturer: "MindPath Medical",
          reportsCount: 22,
          suspicion: "Cloudy Liquid",
          status: "Investigation",
          imageUrl: ""
        }
      };
      await set(suspiciousRef, defaultSuspicious);
    }

    // 3. Seed Recalls
    const recallsRef = ref(database, 'medicineRecalls');
    const recallsSnapshot = await get(recallsRef);
    if (!recallsSnapshot.exists()) {
      const defaultRecalls = {
        'recall_1': {
          id: 'recall_1',
          title: "Valsartan 80mg Tablets",
          manufacturer: "GenMed Pharmaceuticals",
          batchNumbers: "GN-2023-X9, GN-2023-Y1",
          reason: "Contamination Found",
          severity: "Critical",
          actionRequired: "Stop use immediately and return to any pharmacy for a full refund and replacement. Contact your physician if symptoms occur.",
          date: "12:45 PM"
        },
        'recall_2': {
          id: 'recall_2',
          title: "Junior Relief Syrup",
          manufacturer: "BrightCure Labs",
          batchNumbers: "BC-552, BC-553",
          reason: "Packaging Defect",
          severity: "Elevated",
          actionRequired: "Check child-resistant cap. If seal is broken or loose, dispose of immediately at a designated medical waste center.",
          date: "Yesterday"
        },
        'recall_3': {
          id: 'recall_3',
          title: "Ibuprofen Max-G",
          manufacturer: "GlobalPharma Solutions",
          batchNumbers: "IB-9901",
          reason: "Labeling error regarding dosage frequency.",
          severity: "Resolved",
          actionRequired: "New batches available. Safe to use.",
          date: "2 days ago"
        },
        'recall_4': {
          id: 'recall_4',
          title: "Omega Vit-D3",
          manufacturer: "Omega Labs",
          batchNumbers: "OM-7721",
          reason: "Potential potency variance reported. FDA investigating samples.",
          severity: "Monitoring",
          actionRequired: "FDA investigating samples. Caution advised.",
          date: "3 days ago"
        }
      };
      await set(recallsRef, defaultRecalls);
    }
  } catch (err) {
    // Silent fail if permissions restricted - mock data is loaded by caller
  }
};


