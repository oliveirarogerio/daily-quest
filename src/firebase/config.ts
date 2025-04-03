import { getFirestore, collection } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { app } from './app'

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)

// Export commonly used references
export const habitsRef = collection(db, 'habits')
export const playerRef = collection(db, 'players')

// Export app for VueFire initialization
export { app }
