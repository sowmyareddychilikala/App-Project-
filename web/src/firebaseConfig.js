import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAgfmbiC3r0lYwbejjGqncKxqJmn1iW5QI",
  authDomain: "meditrust-4f425.firebaseapp.com",
  databaseURL: "https://meditrust-4f425-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "meditrust-4f425",
  storageBucket: "meditrust-4f425.firebasestorage.app",
  messagingSenderId: "970851082602",
  appId: "1:970851082602:web:8330dbd4e82d0f1a184513",
  measurementId: "G-HN6130EX4L"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth, Realtime Database, and Firestore for Web
export const auth = getAuth(app);
export const database = getDatabase(app);
export const db = getFirestore(app);

export default app;
