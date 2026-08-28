import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAgfmbiC3r0lYwbejjGqncKxqJmn1iW5QI",
  authDomain: "meditrust-4f425.firebaseapp.com",
  databaseURL: "https://meditrust-4f425-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "meditrust-4f425",
  storageBucket: "meditrust-4f425.firebasestorage.app",
  messagingSenderId: "970851082602",
  appId: "1:970851082602:web:8330dbd4e82d0f1a184513",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

async function inspectAndStore() {
  console.log("=== FIREBASE REALTIME DATABASE INSPECTION & DATA STORE ===");
  const email = `patient_${Date.now()}@meditrust.com`;
  const pass = "MediTrustPass123!";

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const user = cred.user;
    console.log(`✅ Authenticated User Created!`);
    console.log(`• Email: ${user.email}`);
    console.log(`• UID: ${user.uid}`);

    const medId = `med_exp_${Date.now()}`;
    const newMedData = {
      id: medId,
      medicineName: "Amoxicillin 500mg Capsule",
      dosage: "1 capsule every 8 hours",
      frequency: "Three Times Daily",
      time: "08:00 AM",
      expiryDate: "2027-11-20",
      instructions: "Finish complete course as prescribed by physician.",
      taken: false,
      createdAt: new Date().toISOString()
    };

    console.log(`\nWriting record to path: users/${user.uid}/medications/${medId}...`);
    const medRef = ref(database, `users/${user.uid}/medications/${medId}`);
    await set(medRef, newMedData);
    console.log(`✅ Write Success!`);

    console.log(`\nReading back stored node from Firebase Realtime Database...`);
    const snap = await get(ref(database, `users/${user.uid}/medications`));
    if (snap.exists()) {
      console.log(`🎉 LIVE STORED FIREBASE DATA:`);
      console.log(JSON.stringify(snap.val(), null, 2));
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
  process.exit(0);
}

inspectAndStore();
