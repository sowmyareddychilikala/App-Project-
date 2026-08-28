import { ref, set, get, onValue, update, remove, push } from 'firebase/database';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { auth, database, db } from '../firebaseConfig';

const canWriteToRtdb = (targetUid) => {
  const currentAuthUid = auth?.currentUser?.uid;
  if (!currentAuthUid) return true; // allow attempts
  if (!targetUid || targetUid === 'guest_user') return false;
  return currentAuthUid === targetUid;
};

// Filter out demo/searched meds
export const filterOutDemoMeds = (medsObj) => {
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
 * Automatically syncs expiry alerts to RTDB users/${uid}/notifications
 */
export const syncExpiryAlerts = async (uid, medicationsObj) => {
  const currentAuthUid = auth?.currentUser?.uid;
  const targetUid = (uid && uid !== 'guest_user') ? uid : (currentAuthUid && currentAuthUid !== 'guest_user') ? currentAuthUid : null;
  if (!targetUid) return;
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

  Object.keys(currentNotifs).forEach(key => {
    if (key.startsWith('expiry_alert_')) {
      const medId = key.replace('expiry_alert_', '');
      if (!activeMedIds.has(medId)) {
        updates[key] = null;
      }
    }
  });

  medsList.forEach(med => {
    if (!med || (!med.expDate && !med.expiryDate)) return;
    const expDateStr = String(med.expDate || med.expiryDate).trim();
    let exp = new Date(expDateStr);
    if (isNaN(exp.getTime())) return;
    exp.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const alertId = `expiry_alert_${med.id}`;
    const medName = med.medicineName || med.name || 'Medication';

    if (diffDays < 0) {
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
    } else if (diffDays <= 7) {
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
    }
  });

  if (Object.keys(updates).length > 0) {
    try {
      await update(notifsRef, updates);
    } catch (e) {}
  }
};

// ----------------------------------------------------
// 1. USER MEDICATIONS (users/${uid}/medications & medications)
// ----------------------------------------------------
export const getLocalMedications = async (uid) => {
  const currentAuthUid = auth?.currentUser?.uid;
  const targetUid = (uid && uid !== 'guest_user') ? uid : (currentAuthUid && currentAuthUid !== 'guest_user') ? currentAuthUid : 'guest_user';
  try {
    const local = localStorage.getItem(`meditrust_meds_${targetUid}`);
    return local ? filterOutDemoMeds(JSON.parse(local)) : {};
  } catch (e) {
    return {};
  }
};

export const listenUserMedications = (uid, callback) => {
  const currentAuthUid = auth?.currentUser?.uid;
  const targetUid = (uid && uid !== 'guest_user') ? uid : (currentAuthUid && currentAuthUid !== 'guest_user') ? currentAuthUid : null;

  if (!targetUid) {
    if (callback) callback({});
    return () => {};
  }

  const unsubscribers = [];
  let latestData = {};
  let hasDeliveredRemote = false;

  const deliverData = (data, source) => {
    const cleaned = filterOutDemoMeds(data);
    latestData = cleaned;
    try {
      localStorage.setItem(`meditrust_meds_${targetUid}`, JSON.stringify(cleaned));
    } catch (e) {}
    if (source !== 'cache') {
      syncExpiryAlerts(targetUid, cleaned);
    }
    if (callback) callback(cleaned);
  };

  // 1. Deliver local cached medications immediately (0ms)
  getLocalMedications(targetUid).then(localMeds => {
    if (localMeds && Object.keys(localMeds).length > 0 && !hasDeliveredRemote) {
      deliverData(localMeds, 'cache');
    }
  }).catch(() => {});

  // 2. Primary: Firestore real-time listener on `users/${targetUid}/medications`
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
  try {
    const medsRef = ref(database, `users/${targetUid}/medications`);
    const unsubRtdb = onValue(medsRef, (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.val() || {};
        const rtdbMeds = {};
        Object.keys(raw).forEach(k => {
          if (raw[k] && typeof raw[k] === 'object' && (raw[k].name || raw[k].medicineName)) {
            rtdbMeds[k] = raw[k];
          }
        });
        if (Object.keys(rtdbMeds).length > 0) {
          hasDeliveredRemote = true;
          const merged = { ...latestData, ...rtdbMeds };
          deliverData(merged, 'rtdb');
        }
      }
    }, (err) => {
      console.warn('[MedSync] RTDB listener error (using Firestore fallback):', err?.message || err);
    });
    unsubscribers.push(unsubRtdb);
  } catch (e) {
    console.warn('[MedSync] RTDB setup error:', e?.message || e);
  }

  return () => {
    unsubscribers.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
  };
};

export const getUserMedications = async (uid) => {
  const targetUid = auth?.currentUser?.uid || uid;
  console.log('[Medication] Fetch started');
  console.log('[Medication] Authenticated UID:', targetUid);

  if (!targetUid || targetUid === 'guest_user') {
    console.log('[Medication] Records returned: 0');
    return {};
  }

  let medsObj = {};

  // 1. Fetch from Firebase RTDB
  try {
    const medsRef = ref(database, `users/${targetUid}/medications`);
    const snapshot = await get(medsRef);
    if (snapshot.exists()) {
      medsObj = snapshot.val() || {};
    }
  } catch (e) {
    console.warn('[Medication] RTDB fetch warning:', e);
  }

  // 2. Fetch from Firestore if RTDB was empty
  if (!medsObj || Object.keys(medsObj).length === 0) {
    try {
      const userMedsCol = collection(db, 'users', targetUid, 'medications');
      const snap = await getDocs(userMedsCol);
      snap.forEach(d => {
        medsObj[d.id] = d.data();
      });
    } catch (e) {
      console.warn('[Medication] Firestore fetch warning:', e);
    }
  }

  // 3. Fallback / Merge with local storage
  const localMeds = await getLocalMedications(targetUid);
  const merged = { ...localMeds, ...filterOutDemoMeds(medsObj) };

  console.log('[Medication] Records returned:', Object.keys(merged).length);
  return merged;
};

export const saveUserMedication = async (uid, medData) => {
  const targetUid = auth?.currentUser?.uid || uid;

  console.log('[Medication] Save started');
  console.log('[Medication] Authenticated UID:', targetUid);

  if (!targetUid || targetUid === 'guest_user') {
    console.error('[Medication] Save failed: No authenticated user UID');
    throw new Error('User not authenticated');
  }

  const medId = medData.id || `med_${Date.now()}`;
  const todayIso = new Date().toISOString().split('T')[0];

  const fullMed = {
    id: medId,
    name: medData.medicineName || medData.name || 'Medication',
    medicineName: medData.medicineName || medData.name || 'Medication',
    dosage: medData.dosage || medData.strength || '1 tablet',
    strength: medData.strength || medData.dosage || '1 tablet',
    type: medData.type || medData.medicineType || 'Tablet',
    medicineType: medData.type || medData.medicineType || 'Tablet',
    time: medData.time || '09:00 AM',
    frequency: medData.frequency || 'Once daily',
    instructions: medData.instructions || medData.notes || 'Take as directed.',
    notes: medData.notes || medData.instructions || 'Take as directed.',
    startDate: medData.startDate || todayIso,
    endDate: medData.endDate || '2099-12-31',
    expDate: medData.expDate || medData.expiryDate || '2026-12-31',
    expiryDate: medData.expDate || medData.expiryDate || '2026-12-31',
    batch: medData.batch || '',
    manufacturer: medData.manufacturer || '',
    createdAt: medData.createdAt || new Date().toISOString(),
    userId: targetUid,
    takenLogs: medData.takenLogs || {},
    takenStatus: medData.takenStatus ?? (medData.taken ?? false),
    taken: medData.taken ?? (medData.takenStatus ?? false),
    takenTime: medData.takenTime || ''
  };

  // 1. Save to local localStorage cache immediately (0ms response)
  try {
    const localKey = `meditrust_meds_${targetUid}`;
    const stored = localStorage.getItem(localKey);
    const meds = stored ? JSON.parse(stored) : {};
    meds[medId] = fullMed;
    localStorage.setItem(localKey, JSON.stringify(meds));
    console.log('[Medication] Saved to localStorage for UID:', targetUid);
  } catch (e) {
    console.error('[Medication] localStorage write failed:', e);
  }

  // 2. Write to Firebase RTDB (PRIMARY - this is what Mobile reads)
  try {
    const rtdbPath = `users/${targetUid}/medications/${medId}`;
    console.log('[Medication] Writing to RTDB path:', rtdbPath);
    await set(ref(database, rtdbPath), fullMed);
    console.log('[Medication] ✓ RTDB write SUCCESS for:', medId);
  } catch (e) {
    console.error('[Medication] ✗ RTDB write FAILED:', e.message || e);
    console.error('[Medication] ✗ RTDB error code:', e.code || 'unknown');
  }

  // 3. Non-blocking Firestore writes (secondary backup)
  Promise.allSettled([
    setDoc(doc(db, 'medications', medId), fullMed, { merge: true }).catch(e => console.warn('[Medication] Firestore global notice:', e)),
    setDoc(doc(db, 'users', targetUid, 'medications', medId), fullMed, { merge: true }).catch(e => console.warn('[Medication] Firestore user notice:', e))
  ]);

  return fullMed;
};

export const toggleMedicationTakenState = async (
  uid, 
  medId, 
  nextTakenState, 
  dateStr = new Date().toISOString().split('T')[0], 
  timeKey = '09:00 AM'
) => {
  const targetUid = auth?.currentUser?.uid || uid || 'guest_user';
  const now = new Date();
  const takenTime = nextTakenState ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const todayIso = now.toISOString().split('T')[0];

  try {
    const localKey = `meditrust_meds_${targetUid}`;
    const stored = localStorage.getItem(localKey);
    const meds = stored ? JSON.parse(stored) : {};
    if (meds[medId]) {
      const existingLogs = meds[medId].takenLogs || {};
      const dayLog = existingLogs[dateStr] || {};
      const updatedDayLog = {
        ...dayLog,
        [timeKey]: { taken: nextTakenState, takenTime }
      };
      meds[medId].takenLogs = {
        ...existingLogs,
        [dateStr]: updatedDayLog
      };
      if (dateStr === todayIso) {
        meds[medId].taken = nextTakenState;
        meds[medId].takenStatus = nextTakenState;
        meds[medId].takenTime = takenTime;
      }
      localStorage.setItem(localKey, JSON.stringify(meds));
    }
  } catch (e) {}

  // Firestore user-scoped update (PRIMARY sync path)
  if (targetUid && targetUid !== 'guest_user') {
    try {
      const fsUpdateData = {
        [`takenLogs.${dateStr}.${timeKey}`]: { taken: nextTakenState, takenTime }
      };
      if (dateStr === todayIso) {
        fsUpdateData.taken = nextTakenState;
        fsUpdateData.takenStatus = nextTakenState;
        fsUpdateData.takenTime = takenTime;
      }
      const userMedDocRef = doc(db, 'users', targetUid, 'medications', medId);
      updateDoc(userMedDocRef, fsUpdateData).catch(() => {});
    } catch (e) {}
  }

  // RTDB update (secondary)
  if (targetUid && targetUid !== 'guest_user') {
    try {
      const medRef = ref(database, `users/${targetUid}/medications/${medId}`);
      const updateData = {
        [`takenLogs/${dateStr}/${timeKey}`]: { taken: nextTakenState, takenTime }
      };
      if (dateStr === todayIso) {
        updateData.taken = nextTakenState;
        updateData.takenStatus = nextTakenState;
        updateData.takenTime = takenTime;
      }
      await update(medRef, updateData);
    } catch (e) {}
  }

  return { taken: nextTakenState, takenTime, dateStr, timeKey };
};

export const updateDoseStatus = toggleMedicationTakenState;

export const deleteUserMedication = async (uid, medId) => {
  const targetUid = auth?.currentUser?.uid || uid || 'guest_user';

  try {
    const localKey = `meditrust_meds_${targetUid}`;
    const stored = localStorage.getItem(localKey);
    const meds = stored ? JSON.parse(stored) : {};
    delete meds[medId];
    localStorage.setItem(localKey, JSON.stringify(meds));
  } catch (e) {}

  if (targetUid && targetUid !== 'guest_user') {
    // Firestore user-scoped delete (PRIMARY sync path)
    try {
      const userMedDocRef = doc(db, 'users', targetUid, 'medications', medId);
      await deleteDoc(userMedDocRef);
    } catch (e) {}

    // RTDB delete (secondary)
    try {
      const medRef = ref(database, `users/${targetUid}/medications/${medId}`);
      await remove(medRef);
    } catch (e) {}

    // Global Firestore delete
    try {
      const medDocRef = doc(db, 'medications', medId);
      await deleteDoc(medDocRef);
    } catch (e) {}

    // Remove expiry alert
    try {
      const notifRef = ref(database, `users/${targetUid}/notifications/expiry_alert_${medId}`);
      await remove(notifRef);
    } catch (e) {}
  }
};

// ----------------------------------------------------
// 2. USER PROFILE (users/${uid})
// ----------------------------------------------------
export const getLocalUserProfile = async (uid) => {
  const targetUid = auth?.currentUser?.uid || uid;
  try {
    const local = localStorage.getItem(`meditrust_profile_${targetUid}`);
    return local ? JSON.parse(local) : null;
  } catch (e) {
    return null;
  }
};

export const saveLocalUserProfile = async (uid, profileData) => {
  const targetUid = auth?.currentUser?.uid || uid;
  try {
    const localKey = `meditrust_profile_${targetUid}`;
    const stored = localStorage.getItem(localKey);
    const existing = stored ? JSON.parse(stored) : {};
    const updated = { ...existing, ...profileData };
    localStorage.setItem(localKey, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return profileData;
  }
};

export const listenUserProfile = (uid, callback, errorCallback) => {
  const targetUid = auth?.currentUser?.uid || uid;
  if (!targetUid) {
    if (callback) callback(null);
    return () => {};
  }

  const userRef = ref(database, `users/${targetUid}`);
  const unsub = onValue(
    userRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.val());
      } else {
        getUserProfile(targetUid).then(prof => {
          callback(prof);
        }).catch(() => {
          callback(null);
        });
      }
    },
    (err) => {
      if (errorCallback) errorCallback(err);
      getUserProfile(targetUid).then(prof => {
        callback(prof);
      }).catch(() => {
        callback(null);
      });
    }
  );

  return unsub;
};

export const getUserProfile = async (uid) => {
  const targetUid = auth?.currentUser?.uid || uid;
  if (!targetUid) return null;
  
  let profileData = null;

  try {
    const userRef = ref(database, `users/${targetUid}`);
    const snap = await get(userRef);
    if (snap.exists()) profileData = snap.val();
  } catch (e) {}

  if (!profileData) {
    try {
      const userDocRef = doc(db, 'users', targetUid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) profileData = docSnap.data();
    } catch (e) {}
  }

  const local = await getLocalUserProfile(targetUid);
  profileData = { ...(local || {}), ...(profileData || {}) };

  return profileData;
};

export const saveUserProfile = async (uid, fullName, email, phone = '', extraData = {}) => {
  const targetUid = auth?.currentUser?.uid || uid || 'guest_user';
  const profileData = {
    uid: targetUid,
    fullName,
    email,
    phone,
    dob: extraData.dob || '',
    bloodType: extraData.bloodType || '',
    allergies: extraData.allergies || [],
    ...extraData
  };

  try {
    localStorage.setItem(`meditrust_profile_${targetUid}`, JSON.stringify(profileData));
  } catch (e) {}

  if (targetUid && targetUid !== 'guest_user') {
    try {
      const userRef = ref(database, `users/${targetUid}`);
      await update(userRef, profileData);
    } catch (e) {}
    try {
      const userDocRef = doc(db, 'users', targetUid);
      await setDoc(userDocRef, profileData, { merge: true });
    } catch (e) {}
  }

  return profileData;
};

export const updateUserProfileFields = async (uid, fields) => {
  const targetUid = auth?.currentUser?.uid || uid;
  if (!targetUid || targetUid === 'guest_user') return fields;

  const updatedPayload = {
    ...fields,
    updatedAt: new Date().toISOString()
  };

  // Instant local storage update (0ms)
  await saveLocalUserProfile(targetUid, updatedPayload);

  // Non-blocking parallel sync to Firebase RTDB and Firestore
  if (targetUid && targetUid !== 'guest_user') {
    Promise.allSettled([
      update(ref(database, `users/${targetUid}`), updatedPayload).catch(() => {}),
      setDoc(doc(db, 'users', targetUid), updatedPayload, { merge: true }).catch(() => {})
    ]).catch(() => {});
  }

  return updatedPayload;
};

export const updateUserPreferences = async (uid, preferences) => {
  const targetUid = auth?.currentUser?.uid || uid || 'guest_user';
  try {
    const prefRef = ref(database, `users/${targetUid}/preferences`);
    await update(prefRef, preferences);
  } catch (e) {}

  try {
    const localProf = (await getLocalUserProfile(targetUid)) || {};
    const updatedPrefs = { ...(localProf.preferences || {}), ...preferences };
    await saveLocalUserProfile(targetUid, { preferences: updatedPrefs });
  } catch (e) {}
};

// ----------------------------------------------------
// 3. USER NOTIFICATIONS (users/${uid}/notifications)
// ----------------------------------------------------
export const listenUserNotifications = (uid, callback) => {
  const targetUid = auth?.currentUser?.uid || uid;
  if (!targetUid) return () => {};

  const notifsRef = ref(database, `users/${targetUid}/notifications`);
  return onValue(notifsRef, (snap) => {
    callback(snap.exists() ? snap.val() : {});
  });
};

export const updateNotificationReadState = async (uid, notifId, unreadState) => {
  const targetUid = auth?.currentUser?.uid || uid;
  const notifRef = ref(database, `users/${targetUid}/notifications/${notifId}`);
  await update(notifRef, { unread: unreadState });
};

export const markAllNotificationsAsRead = async (uid) => {
  const targetUid = auth?.currentUser?.uid || uid;
  const notifsRef = ref(database, `users/${targetUid}/notifications`);
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

export const deleteUserNotification = async (uid, notifId) => {
  const targetUid = auth?.currentUser?.uid || uid;
  const notifRef = ref(database, `users/${targetUid}/notifications/${notifId}`);
  await remove(notifRef);
};

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
  } catch (e) {}

  return notifData;
};

// ----------------------------------------------------
// 4. USER SCAN HISTORY (users/${uid}/scans)
// ----------------------------------------------------
export const listenUserScans = (uid, callback) => {
  const targetUid = auth?.currentUser?.uid || uid;
  if (!targetUid) return () => {};

  const scansRef = ref(database, `users/${targetUid}/scans`);
  return onValue(scansRef, (snap) => {
    callback(snap.exists() ? snap.val() : {});
  });
};

export const saveScanResult = async (uid, scanData) => {
  const targetUid = auth?.currentUser?.uid || uid;
  const scansRef = ref(database, `users/${targetUid}/scans`);
  const newScanRef = push(scansRef);
  const scanObj = {
    id: newScanRef.key,
    timestamp: new Date().toISOString(),
    ...scanData
  };

  if (targetUid && targetUid !== 'guest_user') {
    try {
      await set(newScanRef, scanObj);
    } catch (e) {}
  }
  return scanObj;
};

// ----------------------------------------------------
// 5. USER COMPLAINTS (users/${uid}/complaints & community/complaints)
// ----------------------------------------------------
export const listenUserComplaints = (uid, callback) => {
  const targetUid = auth?.currentUser?.uid || uid;
  if (!targetUid) return () => {};

  const complaintsRef = ref(database, `users/${targetUid}/complaints`);
  return onValue(complaintsRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {});
  });
};

export const saveUserComplaint = async (uid, complaintData) => {
  const targetUid = auth?.currentUser?.uid || uid;
  const complaintsRef = ref(database, `users/${targetUid}/complaints`);
  const newComplaintRef = push(complaintsRef);
  const data = {
    id: newComplaintRef.key,
    uid: targetUid,
    createdAt: new Date().toISOString(),
    status: 'Under Investigation',
    ...complaintData
  };

  if (targetUid && targetUid !== 'guest_user') {
    try {
      await set(newComplaintRef, data);
    } catch (err) {}
    try {
      const globalRef = ref(database, `community/complaints/${data.id}`);
      await set(globalRef, data);
    } catch (err) {}
  }
  return data;
};

// ----------------------------------------------------
// 6. GLOBAL SIDE EFFECTS REPORTS (sideEffectsReports)
// ----------------------------------------------------
export const listenSideEffectsReports = (callback) => {
  const reportsRef = ref(database, `sideEffectsReports`);
  return onValue(reportsRef, (snapshot) => {
    let remoteData = snapshot.exists() ? (snapshot.val() || {}) : {};
    try {
      const cached = localStorage.getItem('meditrust_side_effects');
      if (cached) {
        remoteData = { ...JSON.parse(cached), ...remoteData };
      }
    } catch (e) {}
    callback(remoteData);
  }, () => {
    try {
      const cached = localStorage.getItem('meditrust_side_effects');
      if (cached) {
        callback(JSON.parse(cached));
        return;
      }
    } catch (e) {}
    callback({});
  });
};

export const saveUserSideEffectReport = async (uid, reportData) => {
  const targetUid = auth?.currentUser?.uid || uid || 'guest_user';
  const reportsRef = ref(database, `sideEffectsReports`);
  const newReportRef = push(reportsRef);
  const reportId = reportData.id || newReportRef.key;
  const targetRef = ref(database, `sideEffectsReports/${reportId}`);

  const report = {
    id: reportId,
    uid: targetUid,
    userId: targetUid,
    medicineName: reportData.medicineName || reportData.medName || 'Prescription Medicine',
    medicine: reportData.medicineName || reportData.medName || 'Prescription Medicine',
    sideEffect: reportData.sideEffect || reportData.symptom || 'Observed Symptom',
    effect: reportData.sideEffect || reportData.symptom || 'Observed Symptom',
    symptom: reportData.sideEffect || reportData.symptom || 'Observed Symptom',
    severity: reportData.severity || 'Moderate',
    duration: reportData.duration || 'N/A',
    description: reportData.description || '',
    category: reportData.category || 'General',
    location: reportData.location || 'Local Community',
    createdAt: reportData.createdAt || new Date().toISOString(),
    status: 'VERIFIED_CLINICAL',
    ...reportData
  };

  // 1. Cache to local storage immediately for zero latency
  try {
    const cached = localStorage.getItem('meditrust_side_effects');
    const map = cached ? JSON.parse(cached) : {};
    map[report.id] = report;
    localStorage.setItem('meditrust_side_effects', JSON.stringify(map));
  } catch (e) {}

  // 2. Non-blocking parallel background sync to Firebase RTDB & Firestore
  Promise.allSettled([
    set(targetRef, report).catch((err) => console.warn('[dbService] RTDB sideEffectsReports notice:', err)),
    addDoc(collection(db, 'sideEffectReports'), report).catch((err) => console.warn('[dbService] Firestore sideEffectReports notice:', err))
  ]);

  return report;
};

export const updateSideEffectReport = async (reportId, updatedData) => {
  const targetUid = auth?.currentUser?.uid || 'guest_user';
  try {
    const cached = localStorage.getItem('meditrust_side_effects');
    const map = cached ? JSON.parse(cached) : {};
    if (map[reportId]) {
      map[reportId] = { ...map[reportId], ...updatedData, updatedAt: new Date().toISOString() };
      localStorage.setItem('meditrust_side_effects', JSON.stringify(map));
    }
  } catch (e) {}

  try {
    const reportRef = ref(database, `sideEffectsReports/${reportId}`);
    await update(reportRef, updatedData);
  } catch (err) {
    console.warn('[dbService] RTDB updateSideEffectReport notice:', err);
  }
};

export const deleteSideEffectReport = async (reportId) => {
  try {
    const cached = localStorage.getItem('meditrust_side_effects');
    const map = cached ? JSON.parse(cached) : {};
    delete map[reportId];
    localStorage.setItem('meditrust_side_effects', JSON.stringify(map));
  } catch (e) {}

  try {
    const reportRef = ref(database, `sideEffectsReports/${reportId}`);
    await remove(reportRef);
  } catch (err) {
    console.warn('[dbService] RTDB deleteSideEffectReport notice:', err);
  }
};


// ----------------------------------------------------
// 7. GLOBAL MEDICINE REVIEWS (medicineReviews)
// ----------------------------------------------------
export const listenAllMedicineReviews = (callback) => {
  const reviewsRef = ref(database, `medicineReviews`);
  return onValue(reviewsRef, (snapshot) => {
    let remoteReviews = snapshot.exists() ? (snapshot.val() || {}) : {};
    try {
      const cached = localStorage.getItem('meditrust_medicine_reviews');
      if (cached) {
        const cachedObj = JSON.parse(cached);
        Object.keys(cachedObj).forEach(medId => {
          if (!remoteReviews[medId]) remoteReviews[medId] = {};
          Object.assign(remoteReviews[medId], cachedObj[medId]);
        });
      }
    } catch (e) {}
    callback(remoteReviews);
  }, () => {
    try {
      const cached = localStorage.getItem('meditrust_medicine_reviews');
      if (cached) {
        callback(JSON.parse(cached));
        return;
      }
    } catch (e) {}
    callback({});
  });
};

export const saveMedicineReview = async (uid, medicineId, reviewData) => {
  const targetUid = auth?.currentUser?.uid || uid || 'guest_user';
  const medId = medicineId || reviewData?.medicineId || 'general_med';
  const reviewsRef = ref(database, `medicineReviews/${medId}`);
  const newReviewRef = push(reviewsRef);
  const reviewId = reviewData.id || newReviewRef.key;
  const targetRef = ref(database, `medicineReviews/${medId}/${reviewId}`);

  const review = {
    id: reviewId,
    uid: targetUid,
    medicineId: medId,
    medicineName: reviewData.medicineName || 'Medication',
    userName: reviewData.userName || auth?.currentUser?.displayName || 'Verified Patient',
    title: reviewData.title || 'Product Review',
    comment: reviewData.comment || reviewData.text || '',
    text: reviewData.comment || reviewData.text || '',
    rating: reviewData.rating || reviewData.stars || 5,
    stars: reviewData.rating || reviewData.stars || 5,
    location: reviewData.location || 'Local Community',
    category: reviewData.category || 'General',
    createdAt: reviewData.createdAt || new Date().toISOString(),
    ...reviewData
  };

  // Local storage caching for zero latency and offline persistence
  try {
    const cached = localStorage.getItem('meditrust_medicine_reviews');
    const map = cached ? JSON.parse(cached) : {};
    if (!map[medId]) map[medId] = {};
    map[medId][review.id] = review;
    localStorage.setItem('meditrust_medicine_reviews', JSON.stringify(map));
  } catch (e) {}

  // Background sync to Firebase Realtime Database
  set(targetRef, review).catch((err) => console.warn('[dbService] RTDB saveMedicineReview write notice:', err));

  return review;
};

export const updateMedicineReview = async (medicineId, reviewId, updatedFields) => {
  try {
    const cached = localStorage.getItem('meditrust_medicine_reviews');
    const map = cached ? JSON.parse(cached) : {};
    if (map[medicineId] && map[medicineId][reviewId]) {
      map[medicineId][reviewId] = { ...map[medicineId][reviewId], ...updatedFields, updatedAt: new Date().toISOString() };
      localStorage.setItem('meditrust_medicine_reviews', JSON.stringify(map));
    }
  } catch (e) {}

  try {
    const reviewRef = ref(database, `medicineReviews/${medicineId}/${reviewId}`);
    await update(reviewRef, updatedFields);
  } catch (err) {
    console.warn('[dbService] RTDB updateMedicineReview notice:', err);
  }
};

export const deleteMedicineReview = async (medicineId, reviewId) => {
  try {
    const cached = localStorage.getItem('meditrust_medicine_reviews');
    const map = cached ? JSON.parse(cached) : {};
    if (map[medicineId]) {
      delete map[medicineId][reviewId];
      localStorage.setItem('meditrust_medicine_reviews', JSON.stringify(map));
    }
  } catch (e) {}

  try {
    const reviewRef = ref(database, `medicineReviews/${medicineId}/${reviewId}`);
    await remove(reviewRef);
  } catch (err) {
    console.warn('[dbService] RTDB deleteMedicineReview notice:', err);
  }
};

// ----------------------------------------------------
// 8. COMMUNITY SAFETY ALERTS (communityAlerts)
// ----------------------------------------------------
export const listenCommunityAlerts = (callback) => {
  const alertsRef = ref(database, 'communityAlerts');
  return onValue(alertsRef, (snapshot) => {
    let remoteAlerts = snapshot.exists() ? (snapshot.val() || {}) : {};
    try {
      const cached = localStorage.getItem('meditrust_community_alerts');
      if (cached) {
        remoteAlerts = { ...JSON.parse(cached), ...remoteAlerts };
      }
    } catch (e) {}
    callback(remoteAlerts);
  }, () => {
    try {
      const cached = localStorage.getItem('meditrust_community_alerts');
      if (cached) {
        callback(JSON.parse(cached));
        return;
      }
    } catch (e) {}
    callback({});
  });
};

export const saveCommunityAlert = async (alertData) => {
  const alertsRef = ref(database, 'communityAlerts');
  const newAlertId = alertData.id || push(alertsRef).key;
  const alertRef = ref(database, `communityAlerts/${newAlertId}`);
  const alert = {
    ...alertData,
    id: newAlertId,
    timestamp: alertData.timestamp || new Date().toISOString()
  };

  try {
    const cached = localStorage.getItem('meditrust_community_alerts');
    const alertsMap = cached ? JSON.parse(cached) : {};
    alertsMap[newAlertId] = alert;
    localStorage.setItem('meditrust_community_alerts', JSON.stringify(alertsMap));
  } catch (e) {}

  // Non-blocking background sync to Firebase Realtime Database
  set(alertRef, alert).catch((err) => console.warn('[dbService] saveCommunityAlert RTDB notice:', err));

  return alert;
};

// ----------------------------------------------------
// 9. SUSPICIOUS MEDICINES (suspiciousMedicines)
// ----------------------------------------------------
export const listenSuspiciousMedicines = (callback) => {
  const suspiciousRef = ref(database, 'suspiciousMedicines');
  return onValue(suspiciousRef, (snapshot) => {
    let remoteMeds = snapshot.exists() ? (snapshot.val() || {}) : {};
    try {
      const cached = localStorage.getItem('meditrust_suspicious_meds');
      if (cached) {
        remoteMeds = { ...JSON.parse(cached), ...remoteMeds };
      }
    } catch (e) {}
    callback(remoteMeds);
  }, () => {
    try {
      const cached = localStorage.getItem('meditrust_suspicious_meds');
      if (cached) {
        callback(JSON.parse(cached));
        return;
      }
    } catch (e) {}
    callback({});
  });
};

export const saveSuspiciousMedicine = async (medData) => {
  const suspiciousRef = ref(database, 'suspiciousMedicines');
  const newMedId = medData.id || push(suspiciousRef).key;
  const medRef = ref(database, `suspiciousMedicines/${newMedId}`);
  const med = {
    ...medData,
    id: newMedId
  };

  try {
    const cached = localStorage.getItem('meditrust_suspicious_meds');
    const map = cached ? JSON.parse(cached) : {};
    map[newMedId] = med;
    localStorage.setItem('meditrust_suspicious_meds', JSON.stringify(map));
  } catch (e) {}

  // Non-blocking background sync to Firebase Realtime Database
  set(medRef, med).catch((err) => console.warn('[dbService] saveSuspiciousMedicine RTDB notice:', err));

  return med;
};

// ----------------------------------------------------
// 10. MEDICINE RECALL ALERTS (medicineRecalls)
// ----------------------------------------------------
export const listenMedicineRecalls = (callback) => {
  const recallsRef = ref(database, 'medicineRecalls');
  return onValue(recallsRef, (snapshot) => {
    let remoteRecalls = snapshot.exists() ? (snapshot.val() || {}) : {};
    try {
      const cached = localStorage.getItem('meditrust_medicine_recalls');
      if (cached) {
        remoteRecalls = { ...JSON.parse(cached), ...remoteRecalls };
      }
    } catch (e) {}
    callback(remoteRecalls);
  }, () => {
    try {
      const cached = localStorage.getItem('meditrust_medicine_recalls');
      if (cached) {
        callback(JSON.parse(cached));
        return;
      }
    } catch (e) {}
    callback({});
  });
};

export const saveMedicineRecall = async (recallData) => {
  const recallsRef = ref(database, 'medicineRecalls');
  const newRecallId = recallData.id || push(recallsRef).key;
  const recallRef = ref(database, `medicineRecalls/${newRecallId}`);
  const recall = {
    ...recallData,
    id: newRecallId
  };

  try {
    const cached = localStorage.getItem('meditrust_medicine_recalls');
    const map = cached ? JSON.parse(cached) : {};
    map[newRecallId] = recall;
    localStorage.setItem('meditrust_medicine_recalls', JSON.stringify(map));
  } catch (e) {}

  try {
    await set(recallRef, recall);
  } catch (e) {}
  return recall;
};

// ----------------------------------------------------
// 11. PHARMACIES DIRECTORY (pharmacies)
// ----------------------------------------------------
export const listenPharmacies = (callback) => {
  const pharmaciesRef = ref(database, 'pharmacies');
  return onValue(pharmaciesRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {});
  }, () => {
    callback({});
  });
};
