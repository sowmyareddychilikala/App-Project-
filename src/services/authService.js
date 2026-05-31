import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut 
} from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { saveUserProfile } from './dbService';

/**
 * Registers a new user with Firebase Authentication and creates a profile in RTDB
 */
export const signUpUser = async (email, password, fullName) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Create profile node in Firebase Realtime Database
  await saveUserProfile(user.uid, fullName, email);
  return user;
};

/**
 * Logs in an existing user with Firebase Authentication
 */
export const signInUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Sends a password reset email for password recovery
 */
export const resetUserPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Signs out the currently authenticated user
 */
export const signOutUser = async () => {
  await signOut(auth);
};
