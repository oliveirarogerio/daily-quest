import { ref, watch } from 'vue'
import { useCurrentUser } from 'vuefire'
import {
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  getDoc,
} from 'firebase/firestore'
import { db, habitsRef } from '../firebase/config'
import { useFirebaseError } from './useFirebaseError'
import { useNotification } from './useNotification'
import type { Habit, Difficulty } from '../types/habit'
import { usePlayer } from './usePlayer'

export function useHabits() {
  const habits = ref<Habit[]>([])
  const newHabitName = ref('')
  const user = useCurrentUser()
  const { wrapFirebaseOperation, isLoading } = useFirebaseError()
  const { displayNotification } = useNotification()
  const { trackHabitCompletion, trackTimeSpent } = usePlayer()

  // Load initial data from localStorage
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

  // Save habits to localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem('habits', JSON.stringify(habits.value))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  // Sync with Firebase
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
            displayNotification('Local habit synced to cloud')
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
        difficulty: 'normal',
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
          displayNotification('Habit created successfully')
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

            displayNotification('Habit synced to cloud')
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

  const calculateXP = (streak: number, difficulty: string = 'normal'): number => {
    // Base XP values by difficulty
    const baseXP =
      {
        easy: 5,
        normal: 10,
        hard: 20,
        epic: 40,
      }[difficulty] || 10

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
    } else {
      // Days 21+: +5 XP per day
      streakBonus = 5 + 10 + 30 + (streak - 20) * 5
    }

    // Streak multiplier calculation (percentage-based)
    const streakMultiplier = 1 + Math.min(streak * 0.05, 1.0) // Cap at 100% bonus

    return Math.floor((baseXP + streakBonus) * streakMultiplier)
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

  const toggleHabitCompletion = async (habit: Habit): Promise<number> => {
    const result = await wrapFirebaseOperation(async () => {
      try {
        const wasCompleted = habit.completed
        const earnedXP = calculateXP(habit.streak, habit.difficulty || 'normal')

        // Check last completion date to see if streak was broken
        const lastCompleted = localStorage.getItem(`lastCompleted_${habit.id}`)
        const today = new Date().toDateString()
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayString = yesterday.toDateString()

        let newStreak = habit.streak

        if (!wasCompleted) {
          // Completing a habit

          // First time completing this habit today
          localStorage.setItem(`lastCompleted_${habit.id}`, today)

          if (lastCompleted === yesterdayString) {
            // Completed yesterday - streak continues
            newStreak = habit.streak + 1
          } else if (
            lastCompleted &&
            lastCompleted !== today &&
            lastCompleted !== yesterdayString
          ) {
            // Streak was broken - check if we should use streak protection
            const useProtection = await checkStreakProtection(habit.id)

            if (useProtection) {
              // Preserve streak and increment
              newStreak = habit.streak + 1
            } else {
              // Reset streak
              newStreak = 1
              displayNotification(`Your streak for "${habit.name}" has been reset.`)
            }
          } else {
            // First completion or same-day completion
            newStreak = habit.streak + 1
          }
        } else {
          // Uncompleting a habit (reducing streak)
          newStreak = Math.max(0, habit.streak - 1)
        }

        await updateHabit(habit.id, {
          completed: !wasCompleted,
          streak: newStreak,
          lastEarnedXP: wasCompleted ? 0 : earnedXP,
        })

        // Bonus XP for milestone streaks (5, 10, 25, 50, 100, etc.)
        let bonusXP = 0
        if (!wasCompleted && [5, 10, 25, 50, 100, 150, 200, 365].includes(newStreak)) {
          bonusXP = newStreak * 2 // 2 XP per day of streak as a milestone bonus
          displayNotification(
            `🔥 ${newStreak} day streak achieved for "${habit.name}"! +${bonusXP} bonus XP!`,
          )
        }

        // Track habit completion for achievements
        if (!wasCompleted) {
          trackHabitCompletion({
            streak: newStreak,
            id: habit.id,
          })
        }

        return wasCompleted ? -habit.lastEarnedXP! : earnedXP + bonusXP
      } catch (error) {
        console.error('Error toggling habit completion:', error)
        return 0 // Return 0 XP if there was an error
      }
    }, 'toggleHabitCompletion')

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
