/**
 * Player Progression System Composable
 *
 * This composable manages the player's progression system, including:
 * - XP and level management
 * - Rank progression
 * - Streak tracking and multipliers
 * - Achievement tracking
 * - Persistence to localStorage and Firebase
 * - Visual feedback (animations, notifications)
 */
import { Timestamp, arrayUnion, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { computed, nextTick, ref, watch } from 'vue'
import { useCurrentUser } from 'vuefire'
import { db } from '../firebase/config'
import type { PlayerState, Rank } from '../types/habit'
import { useFirebaseError } from './useFirebaseError'
import { useNotification } from './useNotification'

export function usePlayer() {
  const user = useCurrentUser()
  const { wrapFirebaseOperation, isLoading } = useFirebaseError()
  const { displayNotification } = useNotification()

  /**
   * Initializes player state from localStorage or defaults
   *
   * This function:
   * 1. Attempts to load saved player state from localStorage
   * 2. Falls back to default values if no saved state exists or if an error occurs
   * 3. Returns a complete player state object with all necessary properties
   *
   * @returns {Object} Initial player state with all required properties
   */
  const loadInitialState = () => {
    try {
      const savedLevel = localStorage.getItem('level')
      const savedXp = localStorage.getItem('xp')
      const savedRank = localStorage.getItem('rank')
      const savedTotalXP = localStorage.getItem('totalXPEarned')
      const savedXPHistory = localStorage.getItem('xpHistory')
      const savedLongestStreak = localStorage.getItem('longestStreak')

      return {
        level: savedLevel ? parseInt(savedLevel) : 1,
        xp: savedXp ? parseInt(savedXp) : 0,
        rank: (savedRank || 'E') as Rank,
        totalXPEarned: savedTotalXP ? parseInt(savedTotalXP) : 0,
        xpHistory: savedXPHistory ? JSON.parse(savedXPHistory) : [],
        longestStreak: savedLongestStreak ? parseInt(savedLongestStreak) : 0,
        streakMultiplier: 1,
        recentXPGain: 0,
        hasUnreadLevelUp: false,
        hasUnreadRankUp: false,
      }
    } catch (error) {
      console.error('Error loading initial state:', error)
      return {
        level: 1,
        xp: 0,
        rank: 'E' as Rank,
        totalXPEarned: 0,
        xpHistory: [],
        longestStreak: 0,
        streakMultiplier: 1,
        recentXPGain: 0,
        hasUnreadLevelUp: false,
        hasUnreadRankUp: false,
      }
    }
  }

  const initialState = loadInitialState()
  const level = ref(initialState.level)
  const xp = ref(initialState.xp)
  const currentRank = ref(initialState.rank)
  const totalXPEarned = ref(initialState.totalXPEarned)
  const longestStreak = ref(initialState.longestStreak)
  const streakMultiplier = ref(initialState.streakMultiplier)
  const recentXPGain = ref(initialState.recentXPGain)
  const hasUnreadLevelUp = ref(initialState.hasUnreadLevelUp)
  const hasUnreadRankUp = ref(initialState.hasUnreadRankUp)

  const showLevelUpAnimation = ref(false)
  const showRankUpAnimation = ref(false)

  /**
   * Computed property that calculates XP required for the next level
   *
   * The XP requirement increases with each level and scales more aggressively
   * at higher levels to maintain progression challenge.
   */
  const xpToNextLevel = computed(() => {
    const scalingFactor = level.value > 50 ? 1.5 : level.value > 25 ? 1.2 : 1.0
    return Math.floor(150 * (1 + level.value * 0.1) * scalingFactor)
  })

  /**
   * Computed property that calculates progress percentage toward next level
   *
   * @returns {number} Percentage of progress toward next level (0-100)
   */
  const xpPercentage = computed(() => {
    return Math.min((xp.value / xpToNextLevel.value) * 100, 100)
  })

  /**
   * Array of all possible ranks in ascending order
   */
  const ranks = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'] as const

  /**
   * Level thresholds required to achieve each rank
   */
  const rankThresholds: Record<Rank, number> = {
    E: 1, // Starting rank
    D: 10, // Level 10
    C: 20, // Level 20
    B: 35, // Level 35
    A: 50, // Level 50
    S: 70, // Level 70
    SS: 85, // Level 85
    SSS: 100, // Level 100
  }

  /**
   * Computed property that determines current rank based on level
   *
   * @returns {Rank} The player's current rank
   */
  const rank = computed(() => {
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (level.value >= rankThresholds[ranks[i]]) {
        return ranks[i] as Rank
      }
    }
    return 'E' as Rank
  })

  /**
   * Calculates XP multiplier based on streak and rank
   *
   * This function determines how much bonus XP a player receives based on:
   * 1. Streak length - longer streaks give progressively higher bonuses
   * 2. Current rank - higher ranks receive small percentage boosts
   *
   * The multiplier is applied to the base XP amount in the addXP function.
   * The streak bonus has three tiers with increasing returns.
   *
   * @param {number} streak - The current streak count for the habit
   * @returns {number} A multiplier to apply to the base XP amount
   */
  const calculateXPMultiplier = (streak: number): number => {
    const difficultyMultiplier = 1.0

    // Enhanced streak bonus with progressive scaling:
    // - First 5 days: 5% bonus per day
    // - Days 6-10: 7% bonus per day
    // - Days 11+: 10% bonus per day
    // Capped at 200% (tripling the base XP)
    let streakBonus = 0

    if (streak <= 5) {
      streakBonus = streak * 0.05 // 5% per day for first 5 days
    } else if (streak <= 10) {
      streakBonus = 5 * 0.05 + (streak - 5) * 0.07 // 7% per day for days 6-10
    } else {
      streakBonus = 5 * 0.05 + 5 * 0.07 + (streak - 10) * 0.1 // 10% per day for days 11+
    }

    // Cap the bonus at 200%
    streakBonus = Math.min(streakBonus, 2.0)

    // Apply rank boost - higher ranks get slightly more XP
    const rankIndex = ranks.indexOf(currentRank.value)
    const rankBoost = 1 + rankIndex * 0.03 // 3% boost per rank level

    return difficultyMultiplier * (1 + streakBonus) * rankBoost
  }

  /**
   * Adds XP to the player with multipliers and updates state
   *
   * This function handles the complete process of awarding XP to the player:
   * 1. Applies multipliers based on streak and rank
   * 2. Updates the XP total and related stats
   * 3. Checks for level ups and rank changes
   * 4. Triggers appropriate animations and notifications
   * 5. Saves the updated state to localStorage and Firebase
   * 6. Dispatches events to update UI components
   *
   * The function ensures proper reactivity by using Vue refs and nextTick,
   * and includes additional event dispatching to coordinate with the GameStatusBar.
   *
   * @param {number} amount - Base XP amount to add
   * @param {string} source - Source of the XP (for tracking)
   * @param {number} streak - Current streak to calculate multipliers
   * @param {number} x - X coordinate for animation
   * @param {number} y - Y coordinate for animation
   * @returns {Promise<number>} The final XP amount added after multipliers
   */
  const addXP = async (
    amount: number,
    source: string = 'habit',
    streak: number = 0,
    x: number = 0,
    y: number = 0,
  ) => {
    return await wrapFirebaseOperation(async () => {
      ;('🔍 [usePlayer] addXP called with:', { amount, source, streak, x, y })

      // Apply multipliers
      const multiplier = calculateXPMultiplier(streak)
      const finalAmount = Math.floor(amount * multiplier)
      console.log(
        '🔍 [usePlayer] Calculated finalAmount:',
        finalAmount,
        'with multiplier:',
        multiplier,
      )

      // Record history
      totalXPEarned.value += finalAmount
      recentXPGain.value = finalAmount
      console.log('🔍 [usePlayer] Updated recentXPGain to:', recentXPGain.value)

      // Update streak tracking
      if (streak > longestStreak.value) {
        longestStreak.value = streak
      }

      // Calculate new streak multiplier (used for future calculations)
      streakMultiplier.value = 1 + streak * 0.05

      // Update XP and check for level up
      const oldRank = rank.value
      console.log('🔍 [usePlayer] Before XP update:', {
        currentXP: xp.value,
        toAdd: finalAmount,
      })

      // Ensure reactivity by using explicit assignment
      xp.value = Number(xp.value) + Number(finalAmount)
      console.log('🔍 [usePlayer] After XP update:', { newXP: xp.value })

      // Force update computed properties
      nextTick(() => {
        // Recalculate and update xpPercentage
        const newPercentage = Math.min((xp.value / xpToNextLevel.value) * 100, 100)
        console.log('🔍 [usePlayer] Forcing xpPercentage update:', newPercentage)

        // Dispatch events for UI updates
        window.dispatchEvent(
          new CustomEvent('xp-updated', {
            detail: {
              xp: xp.value,
              xpPercentage: newPercentage,
              forceUpdate: true,
              timestamp: Date.now(),
            },
          }),
        )
      })

      await checkLevelUp()

      // Check for rank up
      if (rank.value !== oldRank) {
        showRankUpAnimation.value = true
        hasUnreadRankUp.value = true

        // Notify player
        displayNotification(`Rank up! You've reached rank ${rank.value}!`)

        setTimeout(() => {
          showRankUpAnimation.value = false
        }, 3000)
      }

      // Force immediate state save
      await savePlayerState()
      console.log('🔍 [usePlayer] Player state saved after XP addition')

      // Dispatch completion event
      nextTick(() => {
        window.dispatchEvent(
          new CustomEvent('xp-updated-complete', {
            detail: {
              timestamp: Date.now(),
              finalXP: xp.value,
            },
          }),
        )
      })

      // Return the amount for UI updates
      return finalAmount
    }, 'addXP')
  }

  const removeXP = async (amount: number, source: string = 'penalty') => {
    return await wrapFirebaseOperation(async () => {
      ;('🔍 [usePlayer] removeXP called with:', { amount, source })

      // Record history with negative amount
      recentXPGain.value = -amount
      console.log('🔍 [usePlayer] Updated recentXPGain to:', recentXPGain.value)

      // Update XP (cannot go below 0)
      console.log('🔍 [usePlayer] Before XP reduction:', {
        currentXP: xp.value,
        toRemove: amount,
      })
      xp.value = Math.max(0, xp.value - amount)
      console.log('🔍 [usePlayer] After XP reduction:', {
        newXP: xp.value,
      })

      // Dispatch a custom DOM event to force UI updates
      try {
        ;('🔥 [usePlayer] Dispatching xp-updated event (removal)')
        window.dispatchEvent(
          new CustomEvent('xp-updated', {
            detail: { xp: xp.value, xpPercentage: xpPercentage.value },
          }),
        )
      } catch (error) {
        console.error('Error dispatching event:', error)
      }

      // Force immediate state save
      await savePlayerState()
      console.log('🔍 [usePlayer] Player state saved after XP removal')

      // Dispatch another event after all async operations
      try {
        setTimeout(() => {
          ;('🔥 [usePlayer] Dispatching xp-updated-complete event (removal)')
          window.dispatchEvent(new CustomEvent('xp-updated-complete', { detail: null }))
        }, 100)
      } catch (error) {
        console.error('Error dispatching event:', error)
      }

      return amount
    }, 'removeXP')
  }

  const checkLevelUp = async () => {
    return await wrapFirebaseOperation(async () => {
      let leveledUp = false
      let levelsGained = 0('🔍 [usePlayer] Checking level up:', {
        currentXP: xp.value,
        neededXP: xpToNextLevel.value,
        currentLevel: level.value,
      })

      while (xp.value >= xpToNextLevel.value) {
        xp.value -= xpToNextLevel.value
        level.value++
        leveledUp = true
        levelsGained++
        ;('🔍 [usePlayer] Level up!',
          {
            newLevel: level.value,
            remainingXP: xp.value,
            nextLevelXP: xpToNextLevel.value,
          })
      }

      if (leveledUp) {
        showLevelUpAnimation.value = true
        hasUnreadLevelUp.value = true

        // Play level up sound with volume based on levels gained
        try {
          const audio = new Audio('/sounds/level-up.mp3')
          audio.volume = Math.min(0.3 + levelsGained * 0.1, 0.9) // Increase volume for multiple levels
          audio.play()
        } catch (e) {
          console.error('Could not play level up sound:', e)
        }

        // Notify player - special message for multiple level ups
        if (levelsGained > 1) {
          displayNotification(
            `Amazing! You've gained ${levelsGained} levels and reached level ${level.value}!`,
          )
        } else {
          displayNotification(`Level up! You've reached level ${level.value}!`)
        }

        setTimeout(() => {
          showLevelUpAnimation.value = false
        }, 3000)
      }

      await savePlayerState()
    }, 'checkLevelUp')
  }

  const acknowledgeLevel = () => {
    hasUnreadLevelUp.value = false
  }

  const acknowledgeRank = () => {
    hasUnreadRankUp.value = false
  }

  const syncWithFirebase = async () => {
    if (!user.value) return

    return await wrapFirebaseOperation(async () => {
      const playerRef = doc(db, 'players', user.value!.uid)
      const playerDoc = await getDoc(playerRef)

      if (playerDoc.exists()) {
        const data = playerDoc.data() as PlayerState

        // Merge local and Firebase data - take highest values
        level.value = Math.max(data.level || 1, level.value)
        xp.value = Math.max(data.xp || 0, xp.value)
        totalXPEarned.value = Math.max(data.totalXPEarned || 0, totalXPEarned.value)
        longestStreak.value = Math.max(data.longestStreak || 0, longestStreak.value)

        currentRank.value = rank.value
      } else {
        // If no Firebase data, save current state
        await savePlayerState()
      }
    }, 'syncWithFirebase')
  }

  // Save state to localStorage and Firebase
  const savePlayerState = async () => {
    return await wrapFirebaseOperation(async () => {
      // Update currentRank from computed rank
      currentRank.value = rank.value

      // Save to localStorage
      localStorage.setItem('level', level.value.toString())
      localStorage.setItem('xp', xp.value.toString())
      localStorage.setItem('rank', currentRank.value)
      localStorage.setItem('totalXPEarned', totalXPEarned.value.toString())
      localStorage.setItem('longestStreak', longestStreak.value.toString())

      // Save to Firebase if logged in
      if (user.value) {
        const playerRef = doc(db, 'players', user.value.uid)
        const playerDoc = await getDoc(playerRef)

        if (playerDoc.exists()) {
          // Update existing document
          await updateDoc(playerRef, {
            level: level.value,
            xp: xp.value,
            rank: currentRank.value,
            totalXPEarned: totalXPEarned.value,
            longestStreak: longestStreak.value,
            lastUpdated: new Date(),
            // Add new XP history items atomically
          })
        } else {
          // Create new document
          await setDoc(playerRef, {
            level: level.value,
            xp: xp.value,
            rank: currentRank.value,
            totalXPEarned: totalXPEarned.value,
            longestStreak: longestStreak.value,
            streakMultiplier: streakMultiplier.value,
            lastUpdated: new Date(),
            hasUnreadLevelUp: hasUnreadLevelUp.value,
            hasUnreadRankUp: hasUnreadRankUp.value,
          })
        }
      }
    }, 'savePlayerState')
  }

  // Watch for changes and save state
  watch(
    [level, xp, totalXPEarned],
    async () => {
      await savePlayerState()
    },
    { deep: true },
  )

  const loadPlayerState = async () => {
    return await wrapFirebaseOperation(async () => {
      const initialState = loadInitialState()
      level.value = initialState.level
      xp.value = initialState.xp
      totalXPEarned.value = initialState.totalXPEarned
      longestStreak.value = initialState.longestStreak

      if (user.value) {
        await syncWithFirebase()
      }
    }, 'loadPlayerState')
  }

  /**
   * Track habit completion for achievement system
   * @param habitData Information about the completed habit
   */
  const trackHabitCompletion = async (habitData: { streak: number; id: string }) => {
    return await wrapFirebaseOperation(async () => {
      ;('🔍 [usePlayer] trackHabitCompletion called with:', habitData)

      // Update longest streak if needed
      if (habitData.streak > longestStreak.value) {
        longestStreak.value = habitData.streak
        await savePlayerState()
      }

      // If user is logged in, record this completion in their player document
      if (user.value) {
        const playerRef = doc(db, 'players', user.value.uid)
        const playerDoc = await getDoc(playerRef)

        if (playerDoc.exists()) {
          // Update stats in player document
          await updateDoc(playerRef, {
            completions: arrayUnion({
              habitId: habitData.id,
              timestamp: Timestamp.now(),
              streak: habitData.streak,
            }),
            // Update habit-specific stats
            [`habitStats.${habitData.id}.completions`]: playerDoc.data().habitStats?.[habitData.id]
              ?.completions
              ? playerDoc.data().habitStats[habitData.id].completions + 1
              : 1,
            [`habitStats.${habitData.id}.lastCompleted`]: Timestamp.now(),
            [`habitStats.${habitData.id}.currentStreak`]: habitData.streak,
            lastUpdated: new Date(),
          })
        } else {
          // Create new document with initial stats
          await setDoc(playerRef, {
            level: level.value,
            xp: xp.value,
            rank: currentRank.value,
            completions: [
              {
                habitId: habitData.id,
                timestamp: Timestamp.now(),
                streak: habitData.streak,
              },
            ],
            habitStats: {
              [habitData.id]: {
                completions: 1,
                lastCompleted: Timestamp.now(),
                currentStreak: habitData.streak,
              },
            },
            lastUpdated: new Date(),
          })
        }
      }

      // Check for achievement milestones based on completion
      // This is where additional achievement logic can be implemented

      return true
    }, 'trackHabitCompletion')
  }

  /**
   * Track time spent on habits for achievements and stats
   * @param minutes Minutes spent on the habit
   * @param habitId ID of the habit being tracked
   */
  const trackTimeSpent = async (minutes: number, habitId: string) => {
    return await wrapFirebaseOperation(async () => {
      ;('🔍 [usePlayer] trackTimeSpent called with:', { minutes, habitId })

      // If user is logged in, update their time tracking stats
      if (user.value) {
        const playerRef = doc(db, 'players', user.value.uid)
        const playerDoc = await getDoc(playerRef)

        if (playerDoc.exists()) {
          // Update time stats in player document
          const currentData = playerDoc.data()
          const totalTimeForHabit = currentData.habitStats?.[habitId]?.timeSpent || 0
          const newTotalTime = totalTimeForHabit + minutes

          await updateDoc(playerRef, {
            [`habitStats.${habitId}.timeSpent`]: newTotalTime,
            totalTimeSpent: (currentData.totalTimeSpent || 0) + minutes,
            lastUpdated: new Date(),
          })

          // Check for time-based achievements
          // Logic for time-based achievements could be implemented here
        } else {
          // Create new document with initial time stats
          await setDoc(playerRef, {
            level: level.value,
            xp: xp.value,
            rank: currentRank.value,
            habitStats: {
              [habitId]: {
                timeSpent: minutes,
              },
            },
            totalTimeSpent: minutes,
            lastUpdated: new Date(),
          })
        }
      }

      return true
    }, 'trackTimeSpent')
  }

  /**
   * Triggers XP gain/loss animation at specified coordinates
   *
   * This function handles the visual feedback of XP changes by:
   * 1. Updating the recentXPGain value to show in GameStatusBar
   * 2. Dispatching a custom event for the XP Animation component
   * 3. Providing coordinates for the animation's start and end points
   *
   * The animation events are picked up by the XPAnimation component which
   * creates the floating number effect and animates it toward the XP bar.
   *
   * Note: This function does NOT actually add/remove XP - it only triggers
   * the visual animation. The actual XP changes are handled by addXP/removeXP.
   *
   * @param amount The amount of XP to show in the animation
   * @param source The source of the XP (for analytics)
   * @param x The x-coordinate where the animation should start
   * @param y The y-coordinate where the animation should start
   * @returns The amount displayed in the animation
   */
  const triggerXPAnimation = (
    amount: number,
    source: string = 'habit',
    x: number = window.innerWidth / 2,
    y: number = window.innerHeight / 2,
  ) => {
    ;('🔍 [usePlayer] Triggering XP animation:', { amount, source, x, y })

    // Set recentXPGain to trigger animation in GameStatusBar
    recentXPGain.value = amount

    // Dispatch custom event for XP Animation component
    try {
      window.dispatchEvent(
        new CustomEvent('xp-animation', {
          detail: {
            show: true,
            amount,
            sourceX: x,
            sourceY: y,
            targetX: window.innerWidth - 80, // Target the XP bar in GameStatusBar
            targetY: 40, // Approximate position of XP bar
            timestamp: Date.now(), // Ensure each event is unique
          },
        }),
      )
    } catch (error) {
      console.error('Error dispatching XP animation event:', error)
    }

    return amount
  }

  return {
    level,
    xp,
    xpToNextLevel,
    xpPercentage,
    rank,
    addXP,
    removeXP,
    loadPlayerState,
    showLevelUpAnimation,
    showRankUpAnimation,
    ranks,
    rankThresholds,
    isLoading,
    recentXPGain,
    hasUnreadLevelUp,
    hasUnreadRankUp,
    acknowledgeLevel,
    acknowledgeRank,
    longestStreak,
    streakMultiplier,
    trackHabitCompletion,
    trackTimeSpent,
    triggerXPAnimation,
  }
}
