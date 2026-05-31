import { ref, set, get, onValue, update, remove, push } from 'firebase/database';
import { database } from '../../firebaseConfig';

/**
 * Saves or updates a user profile in the Firebase Realtime Database
 */
export const saveUserProfile = async (uid, fullName, email, phone = '') => {
  const userRef = ref(database, `users/${uid}`);
  const profileData = {
    uid,
    fullName,
    email,
    phone,
    createdAt: new Date().toISOString(),
    preferences: {
      pushEnabled: true,
      emailEnabled: false,
      smsEnabled: true
    },
    dob: 'May 14, 1978',
    bloodType: 'O Positive (O+)',
    allergies: ['Penicillin', 'Shellfish', 'Lactose'],
    contacts: [
      { id: '1', name: 'Sarah Wilson', relation: 'Spouse', type: 'Primary', phone: '555-0123' },
      { id: '2', name: 'Dr. Aris', relation: 'Cardiologist', type: 'Specialist', phone: '555-0987' }
    ]
  };
  await set(userRef, profileData);
  await seedDefaultClinicalData(uid);
  return profileData;
};

/**
 * Seeds default clinical data (Medications, Notifications, etc.) for high-fidelity Module 2 flows
 */
export const seedDefaultClinicalData = async (uid) => {
  // 1. Seed Medications
  const medsRef = ref(database, `users/${uid}/medications`);
  const medsSnapshot = await get(medsRef);
  if (!medsSnapshot.exists()) {
    const defaultMeds = {
      'med_1': {
        id: 'med_1',
        name: 'Lisinopril',
        dosage: '10mg',
        time: '09:00 AM',
        instructions: 'Take with food',
        taken: false,
        takenTime: ''
      },
      'med_2': {
        id: 'med_2',
        name: 'Metformin',
        dosage: '500mg',
        time: '08:00 AM',
        instructions: 'Taken 8:05 AM',
        taken: true,
        takenTime: '08:05 AM'
      },
      'med_3': {
        id: 'med_3',
        name: 'Vitamin D3',
        dosage: '2000 IU',
        time: '02:00 PM',
        instructions: '1 Capsule',
        taken: false,
        takenTime: ''
      }
    };
    await set(medsRef, defaultMeds);
  }

  // 2. Seed Notifications
  const notifsRef = ref(database, `users/${uid}/notifications`);
  const notifsSnapshot = await get(notifsRef);
  if (!notifsSnapshot.exists()) {
    const defaultNotifs = {
      'notif_1': {
        id: 'notif_1',
        type: 'critical',
        category: 'Safety Alert',
        timestamp: '2m ago',
        title: 'Drug Interaction Warning',
        description: 'System detected a potential moderate interaction between Lisinopril and your new supplement. Please consult your physician before the next dose.',
        unread: true,
        actionLabel: 'Consult AI Assistant'
      },
      'notif_2': {
        id: 'notif_2',
        type: 'expiry',
        category: 'Expiry Warning',
        timestamp: '1h ago',
        title: 'Medication Expiring Soon',
        description: 'Your prescription for Amoxicillin (500mg) expires in 3 days (Oct 24, 2023). Disposal is recommended after this date.',
        unread: true,
        actionLabel: 'Find Disposal Location'
      },
      'notif_3': {
        id: 'notif_3',
        type: 'system',
        category: 'System',
        timestamp: '5h ago',
        title: 'Privacy Policy Update',
        description: 'We\'ve updated our data encryption protocols to enhance your patient record security. Review the changes in your settings.',
        unread: false
      },
      'notif_4': {
        id: 'notif_4',
        type: 'critical',
        category: 'FDA Recall Notice',
        timestamp: 'Yesterday',
        title: 'Batch Recall: Valsartan',
        description: 'Specific batches of Valsartan (Lot #44921) have been voluntarily recalled. Check your bottle immediately.',
        unread: false,
        actionLabel: 'Report Batch Match'
      },
      'notif_5': {
        id: 'notif_5',
        type: 'system',
        category: 'Account',
        timestamp: '2 days ago',
        title: 'Biometric Login Enabled',
        description: 'FaceID has been successfully linked to your MedVigilance profile for faster access.',
        unread: false
      }
    };
    await set(notifsRef, defaultNotifs);
  }
};

/**
 * Fetches a user profile from the database once
 */
export const getUserProfile = async (uid) => {
  const userRef = ref(database, `users/${uid}`);
  const snapshot = await get(userRef);
  if (snapshot.exists()) {
    return snapshot.val();
  }
  return null;
};

/**
 * Sets up a real-time listener for the user profile
 * @returns {Function} unsubscribe function
 */
export const listenUserProfile = (uid, callback) => {
  const userRef = ref(database, `users/${uid}`);
  return onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
};

/**
 * Sets up a real-time listener for user medications
 */
export const listenUserMedications = (uid, callback) => {
  const medsRef = ref(database, `users/${uid}/medications`);
  return onValue(medsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });
};

/**
 * Sets up a real-time listener for user notifications
 */
export const listenUserNotifications = (uid, callback) => {
  const notifsRef = ref(database, `users/${uid}/notifications`);
  return onValue(notifsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });
};

/**
 * Add or update medication in RTDB
 */
export const saveUserMedication = async (uid, medData) => {
  const medId = medData.id || push(ref(database, `users/${uid}/medications`)).key;
  const medRef = ref(database, `users/${uid}/medications/${medId}`);
  const updatedMed = {
    ...medData,
    id: medId,
    taken: medData.taken || false,
    takenTime: medData.takenTime || ''
  };
  await set(medRef, updatedMed);
  return updatedMed;
};

/**
 * Toggle the taken state of a medication
 */
export const toggleMedicationTakenState = async (uid, medId, takenState) => {
  const medRef = ref(database, `users/${uid}/medications/${medId}`);
  const now = new Date();
  const takenTime = takenState 
    ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : '';
  await update(medRef, {
    taken: takenState,
    takenTime
  });
};

/**
 * Delete a medication from user cabinet
 */
export const deleteUserMedication = async (uid, medId) => {
  const medRef = ref(database, `users/${uid}/medications/${medId}`);
  await remove(medRef);
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
 * Update user notification preferences
 */
export const updateUserPreferences = async (uid, preferences) => {
  const prefRef = ref(database, `users/${uid}/preferences`);
  await update(prefRef, preferences);
};

/**
 * Update patient profile details in RTDB
 */
export const updateUserProfileFields = async (uid, fields) => {
  const userRef = ref(database, `users/${uid}`);
  await update(userRef, fields);
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
 * Bookmark/Save a medicine to user profile in Firebase RTDB
 */
export const saveUserBookmarkedMedicine = async (uid, medicineId, medicineData) => {
  const bookmarkRef = ref(database, `users/${uid}/savedMedicines/${medicineId}`);
  const bookmark = {
    ...medicineData,
    id: medicineId,
    bookmarkedAt: new Date().toISOString()
  };
  await set(bookmarkRef, bookmark);
  return bookmark;
};

/**
 * Remove a bookmarked medicine from user profile
 */
export const deleteUserBookmarkedMedicine = async (uid, medicineId) => {
  const bookmarkRef = ref(database, `users/${uid}/savedMedicines/${medicineId}`);
  await remove(bookmarkRef);
};

/**
 * Listen to bookmarked medicines in real-time
 */
export const listenUserBookmarkedMedicines = (uid, callback) => {
  const bookmarksRef = ref(database, `users/${uid}/savedMedicines`);
  return onValue(bookmarksRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });
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
 * Save a patient reported side effect globally in Firebase RTDB
 */
export const saveUserSideEffectReport = async (uid, reportData) => {
  const reportsRef = ref(database, `sideEffectsReports`);
  const newReportId = push(reportsRef).key;
  const reportRef = ref(database, `sideEffectsReports/${newReportId}`);
  const report = {
    ...reportData,
    id: newReportId,
    uid,
    createdAt: new Date().toISOString()
  };
  await set(reportRef, report);
  return report;
};

/**
 * Listen to global side effects reports in real-time
 */
export const listenSideEffectsReports = (callback) => {
  const reportsRef = ref(database, `sideEffectsReports`);
  return onValue(reportsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });
};

/**
 * Save a medicine product review globally in Firebase RTDB
 */
export const saveMedicineReview = async (uid, medicineId, reviewData) => {
  const reviewsRef = ref(database, `medicineReviews/${medicineId}`);
  const newReviewId = push(reviewsRef).key;
  const reviewRef = ref(database, `medicineReviews/${medicineId}/${newReviewId}`);
  const review = {
    ...reviewData,
    id: newReviewId,
    uid,
    medicineId,
    createdAt: new Date().toISOString()
  };
  await set(reviewRef, review);
  return review;
};

/**
 * Listen to reviews of a specific medicine in real-time
 */
export const listenMedicineReviews = (medicineId, callback) => {
  const reviewsRef = ref(database, `medicineReviews/${medicineId}`);
  return onValue(reviewsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });
};

/**
 * Listen to all medicine reviews globally in real-time for Community Feed
 */
export const listenAllMedicineReviews = (callback) => {
  const reviewsRef = ref(database, `medicineReviews`);
  return onValue(reviewsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });
};


