// src/firebase/config.ts

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig)

// Export Firebase services
export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)

// Export commonly used references
export const questsRef = collection(db, 'quests')
export const habitsRef = collection(db, 'habits')
export const userProfilesRef = collection(db, 'userProfiles')
