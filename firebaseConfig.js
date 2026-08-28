import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your web app's Firebase configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage Persistence for React Native, or standard getAuth for Web
export const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

// Initialize Realtime Database
export const database = getDatabase(app);

// Initialize Firestore Database
export const db = getFirestore(app);

export default app;
