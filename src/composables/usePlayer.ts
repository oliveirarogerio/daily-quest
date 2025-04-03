import { ref, computed, watch, reactive, nextTick } from 'vue'
import { useCurrentUser } from 'vuefire'
import { doc, setDoc, getDoc, updateDoc, Timestamp, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useFirebaseError } from './useFirebaseError'
import { useNotification } from './useNotification'
import type { PlayerState, Rank, Difficulty } from '../types/habit'

export function usePlayer() {
  const user = useCurrentUser()
  const { wrapFirebaseOperation, isLoading } = useFirebaseError()
  const { displayNotification } = useNotification()

  // Initialize state from localStorage or defaults
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

  const xpToNextLevel = computed(() => {
    const scalingFactor = level.value > 50 ? 1.5 : level.value > 25 ? 1.2 : 1.0
    return Math.floor(150 * (1 + level.value * 0.1) * scalingFactor)
  })

  const xpPercentage = computed(() => {
    return Math.min((xp.value / xpToNextLevel.value) * 100, 100)
  })

  const ranks = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'] as const
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

  const rank = computed(() => {
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (level.value >= rankThresholds[ranks[i]]) {
        return ranks[i] as Rank
      }
    }
    return 'E' as Rank
  })

  const calculateXPMultiplier = (streak: number, difficulty: Difficulty): number => {
    const difficultyMultiplier =
      {
        easy: 0.8,
        normal: 1.0,
        hard: 1.5,
        epic: 2.5,
      }[difficulty] || 1.0

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

  const addXP = async (
    amount: number,
    source: string = 'habit',
    streak: number = 0,
    difficulty: Difficulty = 'normal',
    x: number = 0,
    y: number = 0,
  ) => {
    return await wrapFirebaseOperation(async () => {
      console.log('🔍 [usePlayer] addXP called with:', { amount, source, streak, difficulty, x, y })

      // Apply multipliers
      const multiplier = calculateXPMultiplier(streak, difficulty)
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

      // Check for milestone achievements

      // Update XP and check for level up
      const oldRank = rank.value
      console.log('🔍 [usePlayer] Before XP update:', { currentXP: xp.value, toAdd: finalAmount })

      // Ensure reactivity by using explicit assignment
      xp.value = Number(xp.value) + Number(finalAmount)

      console.log('🔍 [usePlayer] After XP update:', { newXP: xp.value })

      // Force update computed properties by touching the ref
      nextTick(() => {
        // Recalculate and update xpPercentage as it's a computed property
        const newPercentage = Math.min((xp.value / xpToNextLevel.value) * 100, 100)
        console.log('🔍 [usePlayer] Forcing xpPercentage update:', newPercentage)
      })

      // Dispatch a custom DOM event to force UI updates
      try {
        console.log('🔥 [usePlayer] Dispatching xp-updated event')
        window.dispatchEvent(
          new CustomEvent('xp-updated', {
            detail: { xp: xp.value, xpPercentage: xpPercentage.value },
          }),
        )
      } catch (error) {
        console.error('Error dispatching event:', error)
      }

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

      // Dispatch another event after all async operations
      try {
        setTimeout(() => {
          console.log('🔥 [usePlayer] Dispatching xp-updated-complete event')
          window.dispatchEvent(new CustomEvent('xp-updated-complete', { detail: null }))
        }, 100)
      } catch (error) {
        console.error('Error dispatching event:', error)
      }

      // Return the amount for UI updates
      return finalAmount
    }, 'addXP')
  }

  const removeXP = async (amount: number, source: string = 'penalty') => {
    return await wrapFirebaseOperation(async () => {
      console.log('🔍 [usePlayer] removeXP called with:', { amount, source })

      // Record history with negative amount

      recentXPGain.value = -amount
      console.log('🔍 [usePlayer] Updated recentXPGain to:', recentXPGain.value)

      // Update XP (cannot go below 0)
      console.log('🔍 [usePlayer] Before XP reduction:', { currentXP: xp.value, toRemove: amount })
      xp.value = Math.max(0, xp.value - amount)
      console.log('🔍 [usePlayer] After XP reduction:', { newXP: xp.value })

      // Dispatch a custom DOM event to force UI updates
      try {
        console.log('🔥 [usePlayer] Dispatching xp-updated event (removal)')
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
          console.log('🔥 [usePlayer] Dispatching xp-updated-complete event (removal)')
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
      let levelsGained = 0

      console.log('🔍 [usePlayer] Checking level up:', {
        currentXP: xp.value,
        neededXP: xpToNextLevel.value,
        currentLevel: level.value,
      })

      while (xp.value >= xpToNextLevel.value) {
        xp.value -= xpToNextLevel.value
        level.value++
        leveledUp = true
        levelsGained++

        console.log('🔍 [usePlayer] Level up!', {
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
  }
}
