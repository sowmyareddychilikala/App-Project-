import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

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
const db = getFirestore(app);

async function testFirestoreStorage() {
  const testEmail = `testuser_${Date.now()}@meditrust.test`;
  const testPass = 'Password123!';

  console.log(`Testing Firestore Registration with ${testEmail}...`);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPass);
    const user = userCredential.user;
    console.log(`✅ Authentication Successful! User UID: ${user.uid}`);

    // Test writing medication to Firestore
    const medId = `med_test_${Date.now()}`;
    const testMed = {
      id: medId,
      medicineName: 'Amoxicillin 500mg',
      dosage: '1 capsule',
      frequency: 'Three Times Daily',
      time: '09:00 AM',
      expiryDate: '2027-05-15',
      taken: false,
      createdAt: new Date().toISOString()
    };

    console.log(`Writing test medication ${medId} to Firestore path: users/${user.uid}/medications/${medId}...`);
    const docRef = doc(db, 'users', user.uid, 'medications', medId);
    await setDoc(docRef, testMed);
    console.log(`✅ Firestore Write operation completed!`);

    // Verify Read back from Firestore
    console.log(`Reading back medication from Firestore...`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log(`🎉 DATA SUCCESSFULLY STORED AND VERIFIED IN FIRESTORE DATABASE!`);
      console.log(`Retrieved Data:`, JSON.stringify(docSnap.data(), null, 2));
    } else {
      console.log(`❌ Data not found in Firestore.`);
    }

  } catch (err) {
    console.error(`Storage Test Exception:`, err.message);
  }
  process.exit(0);
}

testFirestoreStorage();
