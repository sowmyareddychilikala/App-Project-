import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Real Firebase Configuration provided by the user
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

// Initialize Firebase App securely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication & Realtime Database
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database };
