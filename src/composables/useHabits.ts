/**
 * Habits Management Composable
 *
 * This composable provides comprehensive functionality for managing habits, including:
 * - Creating, reading, updating, and deleting habits (CRUD operations)
 * - Syncing habits between local storage and Firebase
 * - Tracking habit completion and streaks
 * - Managing habit time tracking
 * - Calculating XP rewards for habit completion
 * - Integrating with player progression system
 */
import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { ref, watch } from 'vue'
import { useCurrentUser } from 'vuefire'
import { db, habitsRef } from '../firebase/config'
import type { Habit } from '../types/habit'
import { useFirebaseError } from './useFirebaseError'
import { useNotification } from './useNotification'
import { usePlayer } from './usePlayer'

export function useHabits() {
  const habits = ref<Habit[]>([])
  const newHabitName = ref('')
  const user = useCurrentUser()
  const { wrapFirebaseOperation, isLoading } = useFirebaseError()
  const { displayNotification } = useNotification()
  const { trackHabitCompletion, trackTimeSpent } = usePlayer()

  /**
   * Loads habits data from localStorage
   *
   * This function retrieves saved habits from the browser's localStorage
   * and initializes the habits reactive reference with this data.
   * If no data is found or an error occurs, an empty array is used.
   */
  const loadFromStorage = () => {
    try {
      const savedHabits = localStorage.getItem('habits')
      if (savedHabits) {
        habits.value = JSON.parse(savedHabits)
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      habits.value = []
    }
  }

  /**
   * Saves current habits data to localStorage
   *
   * This function persists the current habits array to the browser's
   * localStorage, enabling data persistence between sessions even when
   * the user is not logged in.
   */
  const saveToStorage = () => {
    try {
      localStorage.setItem('habits', JSON.stringify(habits.value))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  /**
   * Synchronizes habits between Firebase and local storage
   *
   * This function:
   * 1. Fetches the user's habits from Firebase
   * 2. Merges local and Firebase habits with conflict resolution
   * 3. Automatically creates Firebase documents for local habits
   * 4. Updates the local state with merged data
   * 5. Persists the merged data to localStorage
   *
   * @returns {Promise<void>}
   */
  const refreshHabits = async (): Promise<void> => {
    if (!user.value) return

    await wrapFirebaseOperation(async () => {
      const userId = user.value!.uid // Safe assertion since we checked above
      const q = query(habitsRef, where('userId', '==', userId))
      const querySnapshot = await getDocs(q)
      const firebaseHabits: Habit[] = []

      querySnapshot.forEach((doc) => {
        firebaseHabits.push({ ...doc.data(), id: doc.id } as Habit)
      })

      // Merge local and Firebase habits
      const mergedHabits = new Map()

      // Add Firebase habits
      firebaseHabits.forEach((habit) => {
        mergedHabits.set(habit.id, habit)
      })

      // Sync local habits to Firebase if they don't exist there
      for (const habit of habits.value) {
        if (!mergedHabits.has(habit.id) && habit.id.includes('-')) {
          // This is likely a local UUID, create in Firebase
          try {
            // Create a new object without the id field
            const { id, ...habitWithoutId } = habit
            const newDocRef = await addDoc(habitsRef, {
              ...habitWithoutId,
              userId,
            })

            // Update with Firebase ID
            const updatedHabit = { ...habit, id: newDocRef.id, userId }
            mergedHabits.set(newDocRef.id, updatedHabit)
            displayNotification('Missão local sincronizada com a nuvem')
          } catch (error) {
            console.error('Error syncing local habit:', error)
            mergedHabits.set(habit.id, habit)
          }
        } else if (!mergedHabits.has(habit.id)) {
          mergedHabits.set(habit.id, habit)
        }
      }

      habits.value = Array.from(mergedHabits.values())
      saveToStorage()
    }, 'refreshHabits')
  }

  // Watch for changes and save to localStorage
  watch(habits, saveToStorage, { deep: true })

  // Load initial data
  loadFromStorage()
  refreshHabits()

  // Watch for user changes
  watch(user, (newUser) => {
    if (newUser) {
      refreshHabits()
    }
  })

  /**
   * Creates a new habit
   *
   * This function:
   * 1. Creates a habit object with default values and the provided name
   * 2. Attempts to create the habit in Firebase if the user is logged in
   * 3. Falls back to local storage with a UUID if Firebase creation fails
   * 4. Updates the local state and persists to storage
   *
   * @param {string} name - The name of the habit to create
   * @returns {Promise<void>}
   */
  const addHabit = async (name: string): Promise<void> => {
    if (!name.trim()) return

    await wrapFirebaseOperation(async () => {
      const habit: Omit<Habit, 'id'> = {
        name: name.trim(),
        completed: false,
        streak: 0,
        timeSpent: 0,
        userId: user.value?.uid || 'local',
        createdAt: new Date(),
        lastEarnedXP: 0,
        description: '',
        tags: [],
      }

      let habitId: string

      // If user is logged in, create in Firebase first
      if (user.value) {
        try {
          const docRef = await addDoc(habitsRef, {
            ...habit,
            userId: user.value.uid, // Ensure correct user ID
          })
          habitId = docRef.id
          displayNotification('Missão criada com sucesso')
        } catch (error) {
          console.error('Error creating habit in Firebase:', error)
          // Use local ID as fallback
          habitId = crypto.randomUUID()
        }
      } else {
        // For offline mode, use crypto.randomUUID
        habitId = crypto.randomUUID()
      }

      // Add to local state
      habits.value.push({ ...habit, id: habitId })
      newHabitName.value = ''
      saveToStorage() // Ensure immediate save to storage
    }, 'addHabit')
  }

  /**
   * Deletes a habit by ID
   *
   * This function:
   * 1. Removes the habit from local state
   * 2. Deletes the habit from Firebase if the user is logged in
   *
   * @param {string} habitId - The ID of the habit to delete
   * @returns {Promise<void>}
   */
  const deleteHabit = async (habitId: string): Promise<void> => {
    await wrapFirebaseOperation(async () => {
      // Remove from local state
      habits.value = habits.value.filter((h) => h.id !== habitId)

      // If user is logged in, delete from Firebase
      if (user.value) {
        await deleteDoc(doc(db, 'habits', habitId))
      }
    }, 'deleteHabit')
  }

  /**
   * Updates a habit with partial data
   *
   * This function:
   * 1. Updates the habit in local state
   * 2. Syncs the update to Firebase if the user is logged in
   * 3. Creates the document in Firebase if it doesn't already exist
   *
   * @param {string} habitId - The ID of the habit to update
   * @param {Partial<Habit>} updates - The properties to update
   * @returns {Promise<void>}
   */
  const updateHabit = async (habitId: string, updates: Partial<Habit>): Promise<void> => {
    await wrapFirebaseOperation(async () => {
      // Update local state first
      const index = habits.value.findIndex((h) => h.id === habitId)
      if (index === -1) {
        console.error(`Habit with ID ${habitId} not found`)
        return // Exit early if habit not found
      }

      // If user is logged in, verify document exists in Firebase
      if (user.value) {
        try {
          const habitRef = doc(db, 'habits', habitId)
          const habitDoc = await getDoc(habitRef)

          if (!habitDoc.exists()) {
            // Document doesn't exist in Firebase, create it
            const habit = habits.value[index]

            // Create a new object without the id field
            const { id, ...habitWithoutId } = habit
            const newDocRef = await addDoc(habitsRef, {
              ...habitWithoutId,
              ...updates,
              userId: user.value.uid, // Ensure correct user ID
            })

            // Update local state with new Firebase ID
            const updatedHabit = {
              ...habit,
              ...updates,
              id: newDocRef.id,
              userId: user.value.uid,
            }

            // Replace old habit with updated one
            habits.value.splice(index, 1)
            habits.value.push(updatedHabit)
            saveToStorage() // Ensure immediate save to storage

            displayNotification('Missão sincronizada com a nuvem')
            return
          }

          // Update Firebase
          await updateDoc(habitRef, {
            ...updates,
            userId: user.value.uid, // Ensure correct user ID
          })
        } catch (error) {
          console.error('Error updating habit in Firebase:', error)
          // Continue with local update only
        }
      }

      // Update local state if we haven't already
      if (habits.value[index]) {
        habits.value[index] = { ...habits.value[index], ...updates }
        saveToStorage() // Ensure immediate save to storage
      }
    }, 'updateHabit')
  }

  /**
   * Calculates the base XP reward for completing a habit based on streak
   *
   * This function implements a progressive XP reward system that:
   * 1. Provides a base XP amount for all completions
   * 2. Adds additional XP bonuses for maintaining streaks
   * 3. Uses tiered progression to reward longer streaks with higher bonuses
   *
   * The XP scaling is designed to encourage daily habit completion and
   * provide increasing rewards for consistency.
   *
   * @param streak The current streak count for the habit
   * @returns The base XP amount (before multipliers in usePlayer)
   */
  const calculateXP = (streak: number): number => {
    // Base XP for completing a habit
    const baseXP = 10

    // Enhanced streak bonus calculation
    // Streak multiplier grows faster at certain thresholds
    let streakBonus = 0

    if (streak <= 5) {
      // First 5 days: +1 XP per day
      streakBonus = streak
    } else if (streak <= 10) {
      // Days 6-10: +2 XP per day
      streakBonus = 5 + (streak - 5) * 2
    } else if (streak <= 20) {
      // Days 11-20: +3 XP per day
      streakBonus = 5 + 10 + (streak - 10) * 3
    } else if (streak <= 50) {
      // Days 21-50: +4 XP per day
      streakBonus = 5 + 10 + 30 + (streak - 20) * 4
    } else {
      // Days 51+: +5 XP per day
      streakBonus = 5 + 10 + 30 + 120 + (streak - 50) * 5
    }

    // Return base XP plus streak bonus
    return baseXP + streakBonus
  }

  // New function to check if streak protection should be used
  const checkStreakProtection = async (habitId: string): Promise<boolean> => {
    // Get streak protection count from localStorage
    const streakProtectionCount = parseInt(localStorage.getItem('streakProtection') || '0')

    if (streakProtectionCount > 0) {
      // Ask user if they want to use streak protection
      const confirmed = window.confirm(
        'You missed this habit yesterday. Use streak protection to preserve your streak?',
      )

      if (confirmed) {
        // Reduce streak protection count
        localStorage.setItem('streakProtection', (streakProtectionCount - 1).toString())

        // Notify user
        displayNotification(
          `Streak protected! ${streakProtectionCount - 1} protection(s) remaining.`,
        )
        return true
      }
    }

    return false
  }

  /**
   * Toggles a habit's completion status and manages XP rewards
   *
   * This function handles the complete flow of completing/uncompleting a habit:
   * 1. Calculates appropriate XP changes based on completion state
   * 2. Tracks and updates streak information
   * 3. Manages streak continuation, breakage, or protection
   * 4. Updates the habit state in both local storage and Firebase
   * 5. Awards bonus XP for milestone streaks
   * 6. Tracks habit completion for achievement/statistics purposes
   *
   * The function returns the XP change value (positive for completing, negative
   * for uncompleting) which is then used by the HabitTracker component to
   * trigger animations and update player state.
   *
   * @param habit The habit to toggle completion status for
   * @returns The XP change amount (positive or negative)
   */
  const toggleHabitCompletion = async (habit: Habit): Promise<number> => {
    const result = await wrapFirebaseOperation(async () => {
      try {
        // Store whether the habit was previously completed
        const wasCompleted = habit.completed

        // Calculate potential XP based on current streak
        const earnedXP = calculateXP(habit.streak || 0)

        // Streak calculation variables
        const lastCompleted = localStorage.getItem(`lastCompleted_${habit.id}`)
        const today = new Date().toDateString()
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayString = yesterday.toDateString()

        let newStreak = habit.streak

        // Handle completing a habit
        if (!wasCompleted) {
          // Record completion date (for streak calculation later)
          localStorage.setItem(`lastCompleted_${habit.id}`, today)

          // Different cases for streak calculation
          if (lastCompleted === yesterdayString) {
            // Case 1: Completed yesterday - streak continues
            newStreak = habit.streak + 1
          } else if (
            lastCompleted &&
            lastCompleted !== today &&
            lastCompleted !== yesterdayString
          ) {
            // Case 2: Last completed before yesterday - streak is broken
            // Check if streak protection should be used
            const useProtection = await checkStreakProtection(habit.id)

            if (useProtection) {
              // Streak protection used - preserve and increment streak
              newStreak = habit.streak + 1
            } else {
              // No protection - reset streak to 1
              newStreak = 1
              displayNotification(`Your streak for "${habit.name}" has been reset.`)
            }
          } else {
            // Case 3: First completion ever OR completed today already
            // For both cases, increment streak
            newStreak = habit.streak + 1
          }
        } else {
          // Handle uncompleting a habit (reducing streak)
          newStreak = Math.max(0, habit.streak - 1)
        }

        // Update habit with new completion status and streak
        await updateHabit(habit.id, {
          completed: !wasCompleted,
          streak: newStreak,
          lastEarnedXP: wasCompleted ? 0 : earnedXP,
        })

        // Check for milestone streaks that earn bonus XP
        let bonusXP = 0
        const milestones = [5, 10, 25, 50, 100, 150, 200, 365]

        if (!wasCompleted && milestones.includes(newStreak)) {
          // Award bonus XP for reaching milestone streaks
          bonusXP = newStreak * 2 // 2 XP per day of streak as milestone bonus
          displayNotification(
            `🔥 ${newStreak} day streak achieved for "${habit.name}"! +${bonusXP} bonus XP!`,
          )
        }

        // Track habit completion for achievements system
        if (!wasCompleted) {
          await trackHabitCompletion({
            streak: newStreak,
            id: habit.id,
          })
        }

        // Return XP change: negative if uncompleting, positive if completing
        return wasCompleted ? -habit.lastEarnedXP! : earnedXP + bonusXP
      } catch (error) {
        console.error('Error toggling habit completion:', error)
        displayNotification('Falha ao atualizar status da missão')
        return 0 // Return 0 XP on error
      }
    }, 'toggleHabitCompletion')

    // If wrapFirebaseOperation failed or returned undefined, return 0
    return result ?? 0
  }

  const resetDailyHabits = async (): Promise<void> => {
    await wrapFirebaseOperation(async () => {
      const today = new Date().toDateString()
      const lastResetDate = localStorage.getItem('lastResetDate')

      if (lastResetDate !== today) {
        for (const habit of habits.value) {
          const updates: Partial<Habit> = {
            completed: false,
          }

          if (!habit.completed) {
            updates.streak = 0
          }

          await updateHabit(habit.id, updates)
        }

        localStorage.setItem('lastResetDate', today)
      }
    }, 'resetDailyHabits')
  }

  const formatTimeSpent = (minutes: number): string => {
    if (!minutes) return '0m'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  // Add toggleHabit as an alias for toggleHabitCompletion
  const toggleHabit = toggleHabitCompletion

  // Add removeHabit as an alias for deleteHabit
  const removeHabit = deleteHabit

  // Update trackTimer to record time for achievements
  const trackTimer = async (habitId: string, minutes: number): Promise<void> => {
    await wrapFirebaseOperation(async () => {
      const index = habits.value.findIndex((h) => h.id === habitId)
      if (index === -1) return

      const habit = habits.value[index]
      const newTimeSpent = habit.timeSpent + minutes

      await updateHabit(habitId, {
        timeSpent: newTimeSpent,
      })

      // Track time for achievements
      trackTimeSpent(minutes, habitId)

      displayNotification(`Added ${minutes} minutes to "${habit.name}"`)
    }, 'trackTimer')
  }

  return {
    habits,
    newHabitName,
    isLoading,
    addHabit,
    deleteHabit,
    updateHabit,
    toggleHabitCompletion,
    resetDailyHabits,
    calculateXP,
    formatTimeSpent,
    refreshHabits,
    // Add new exports
    toggleHabit,
    removeHabit,
    trackTimer,
  }
}
