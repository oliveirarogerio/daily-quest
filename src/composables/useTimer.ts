/**
 * Timer Management Composable
 *
 * This composable provides comprehensive timer functionality for the Pomodoro technique
 * and time tracking. It manages timer state, statistics, settings, and integrates with
 * habit tracking and XP rewards systems.
 */
import { ref, computed, onUnmounted, reactive } from 'vue'
import { useNotification } from './useNotification'
import type { Habit, TimerState, TimerMode } from '../types/habit'
import { useHabits } from './useHabits'
import { usePlayer } from './usePlayer'

export function useTimer() {
  const { displayNotification } = useNotification()
  const { trackTimer } = useHabits()
  const { addXP } = usePlayer()

  /**
   * Reactive reference to the current timer state
   * Contains all properties needed to manage the timer, its display, and behavior
   */
  const timerState = ref<TimerState>({
    selectedHabit: null,
    showTimer: false,
    isRunning: false,
    seconds: 0,
    minutes: 25, // Default Pomodoro time
    mode: 'pomodoro',
    customMinutes: 25,
    completedSessions: 0,
    pomodoroGoal: 4, // Default goal of 4 pomodoros
    longBreakInterval: 4, // Take a long break every 4 pomodoros
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true,
    soundVolume: 0.5,
  })

  /**
   * Reactive object for tracking and persisting timer usage statistics
   * Used for tracking user progress, streaks, and calculating XP rewards
   */
  const timerStats = reactive({
    totalSessionsCompleted: parseInt(localStorage.getItem('totalSessionsCompleted') || '0'),
    totalMinutesTracked: parseInt(localStorage.getItem('totalMinutesTracked') || '0'),
    longestSession: parseInt(localStorage.getItem('longestSession') || '0'),
    currentStreak: parseInt(localStorage.getItem('timerStreak') || '0'),
    lastSessionDate: localStorage.getItem('lastSessionDate') || '',
    sessionsToday: parseInt(localStorage.getItem('sessionsToday') || '0'),
    lastSessionDay: localStorage.getItem('lastSessionDay') || '',
  })

  /**
   * Saves timer statistics to local storage for persistence
   * Called whenever timer statistics are updated
   */
  const saveTimerStats = () => {
    localStorage.setItem('totalSessionsCompleted', timerStats.totalSessionsCompleted.toString())
    localStorage.setItem('totalMinutesTracked', timerStats.totalMinutesTracked.toString())
    localStorage.setItem('longestSession', timerStats.longestSession.toString())
    localStorage.setItem('timerStreak', timerStats.currentStreak.toString())
    localStorage.setItem('lastSessionDate', timerStats.lastSessionDate)
    localStorage.setItem('sessionsToday', timerStats.sessionsToday.toString())
    localStorage.setItem('lastSessionDay', timerStats.lastSessionDay)
  }

  /**
   * Returns the appropriate number of minutes for a given timer mode
   *
   * @param {TimerMode} mode - The timer mode ('pomodoro', 'shortBreak', 'longBreak', 'custom')
   * @returns {number} The number of minutes for the specified mode
   */
  const getModeMinutes = (mode: TimerMode): number => {
    switch (mode) {
      case 'pomodoro':
        return 25
      case 'shortBreak':
        return 5
      case 'longBreak':
        return 15
      case 'custom':
        return timerState.value.customMinutes
      default:
        return 25
    }
  }

  /**
   * Updates timer statistics after completing a session
   *
   * This function:
   * 1. Increments total sessions completed
   * 2. Adds minutes to total time tracked
   * 3. Updates longest session if needed
   * 4. Manages daily streak tracking
   * 5. Tracks sessions completed today
   * 6. Persists stats to localStorage
   *
   * @param {number} sessionMinutes - The duration of the completed session in minutes
   */
  const updateTimerStats = (sessionMinutes: number) => {
    // Update total sessions completed
    timerStats.totalSessionsCompleted++

    // Update total minutes tracked
    timerStats.totalMinutesTracked += sessionMinutes

    // Update longest session if applicable
    if (sessionMinutes > timerStats.longestSession) {
      timerStats.longestSession = sessionMinutes
    }

    // Update streak
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayString = yesterday.toISOString().split('T')[0]

    if (timerStats.lastSessionDate === yesterdayString) {
      // Continued streak
      timerStats.currentStreak++
    } else if (timerStats.lastSessionDate !== today) {
      // Reset streak if not yesterday and not today
      timerStats.currentStreak = 1
    }

    // Update last session date
    timerStats.lastSessionDate = today

    // Update sessions today
    const todayDay = new Date().toDateString()
    if (timerStats.lastSessionDay === todayDay) {
      timerStats.sessionsToday++
    } else {
      timerStats.sessionsToday = 1
      timerStats.lastSessionDay = todayDay
    }

    // Save to localStorage
    saveTimerStats()
  }

  /**
   * Calculates XP reward for completing a timer session
   *
   * The XP calculation includes:
   * 1. Base XP equal to minutes spent (for focus sessions only)
   * 2. Bonus for longer sessions (20% for 25+ min, 50% for 45+ min)
   * 3. Streak multiplier based on consecutive days
   * 4. Bonus for multiple sessions in a day
   *
   * @param {number} minutes - The duration of the session in minutes
   * @param {boolean} isPomodoro - Whether this was a focus session (not a break)
   * @returns {number} The calculated XP reward amount
   */
  const calculateTimerXP = (minutes: number, isPomodoro: boolean): number => {
    // Base XP: 1 XP per minute for focus sessions, 0 for breaks
    if (!isPomodoro) return 0

    // Base reward
    let xp = minutes

    // Bonus for longer sessions
    if (minutes >= 45) {
      xp = Math.floor(xp * 1.5)
    } else if (minutes >= 25) {
      xp = Math.floor(xp * 1.2)
    }

    // Streak bonus: 5% per day of streak, up to 50%
    const streakMultiplier = 1 + Math.min(timerStats.currentStreak * 0.05, 0.5)
    xp = Math.floor(xp * streakMultiplier)

    // Bonus for completing multiple sessions in a day
    if (timerStats.sessionsToday >= 4) {
      xp = Math.floor(xp * 1.3) // 30% bonus for 4+ sessions in a day
    } else if (timerStats.sessionsToday >= 2) {
      xp = Math.floor(xp * 1.1) // 10% bonus for 2-3 sessions in a day
    }

    return xp
  }

  /**
   * Handles all actions that should occur when a timer completes
   *
   * This function:
   * 1. Updates statistics for completed sessions
   * 2. Tracks time for the selected habit if present
   * 3. Awards XP for completed pomodoro sessions
   * 4. Plays completion sound if enabled
   * 5. Manages automatic transitions between session types
   * 6. Displays notifications for completion and XP earned
   */
  const handleTimerCompletion = async () => {
    const completedMode = timerState.value.mode
    const isPomodoro = completedMode === 'pomodoro' || completedMode === 'custom'
    const sessionMinutes = isPomodoro
      ? completedMode === 'custom'
        ? timerState.value.customMinutes
        : 25
      : 0

    // Only track stats and award XP for focus sessions, not breaks
    if (isPomodoro) {
      // Track focus session stats
      updateTimerStats(sessionMinutes)

      // Track time for selected habit if exists
      if (timerState.value.selectedHabit) {
        await trackTimer(timerState.value.selectedHabit.id, sessionMinutes)
      }

      // Award XP for completing a focus session
      const xpAmount = calculateTimerXP(sessionMinutes, true)
      if (xpAmount > 0) {
        await addXP(
          xpAmount,
          `Completed ${sessionMinutes} minute focus session`,
          timerStats.currentStreak,
          'normal',
        )
        // Display completion message with XP
        displayNotification(`Session complete! Earned ${xpAmount} XP`)
      }

      // Increment completed sessions counter
      timerState.value.completedSessions++

      // Play completion sound if enabled
      if (timerState.value.soundEnabled) {
        try {
          const audio = new Audio('/sounds/timer-complete.mp3')
          audio.volume = timerState.value.soundVolume
          audio.play()
        } catch (e) {
          console.error('Could not play timer sound:', e)
        }
      }
    }

    // Handle automatic transitions
    if (completedMode === 'pomodoro' || completedMode === 'custom') {
      // Pomodoro completed, check if we should take a long break
      if (timerState.value.completedSessions % timerState.value.longBreakInterval === 0) {
        // Time for a long break
        setTimerMode('longBreak')
        if (timerState.value.autoStartBreaks) {
          startTimer()
        }
      } else {
        // Time for a short break
        setTimerMode('shortBreak')
        if (timerState.value.autoStartBreaks) {
          startTimer()
        }
      }
    } else {
      // Break completed, start next pomodoro if enabled
      setTimerMode('pomodoro')
      if (timerState.value.autoStartPomodoros) {
        startTimer()
      }
    }
  }

  /**
   * Computed property returning a formatted time string in mm:ss format
   * Used for displaying the timer in the UI
   */
  const formattedTime = computed(() => {
    const minutes = timerState.value.minutes.toString().padStart(2, '0')
    const seconds = timerState.value.seconds.toString().padStart(2, '0')
    return `${minutes}:${seconds}`
  })

  // Timer interval reference
  let timerInterval: number | null = null

  /**
   * Starts the timer countdown
   *
   * This function:
   * 1. Sets the timer to running state
   * 2. Creates an interval that decrements the time every second
   * 3. Handles the countdown logic between minutes and seconds
   * 4. Triggers completion actions when the timer reaches zero
   */
  const startTimer = () => {
    if (!timerState.value.isRunning) {
      timerState.value.isRunning = true
      timerInterval = window.setInterval(() => {
        if (timerState.value.seconds > 0) {
          timerState.value.seconds--
        } else if (timerState.value.minutes > 0) {
          timerState.value.minutes--
          timerState.value.seconds = 59
        } else {
          // Timer completed
          pauseTimer()
          handleTimerCompletion()
        }
      }, 1000)
    }
  }

  /**
   * Pauses the running timer
   *
   * This function:
   * 1. Clears the timer interval
   * 2. Sets the timer to paused state
   */
  const pauseTimer = () => {
    if (timerState.value.isRunning && timerInterval !== null) {
      clearInterval(timerInterval)
      timerInterval = null
      timerState.value.isRunning = false
    }
  }

  /**
   * Resets the timer to the default time for the current mode
   *
   * This function:
   * 1. Pauses the timer if running
   * 2. Resets minutes to the default for the current mode
   * 3. Resets seconds to zero
   */
  const resetTimer = () => {
    pauseTimer() // Stop timer if running

    // Reset to default time for current mode
    timerState.value.minutes = getModeMinutes(timerState.value.mode)
    timerState.value.seconds = 0
  }

  // Clean up interval on component unmount
  onUnmounted(() => {
    if (timerInterval !== null) {
      clearInterval(timerInterval)
    }
  })

  /**
   * Associates a habit with the current timer session
   *
   * When a habit is selected, completed timer sessions will track time
   * against that habit, allowing for accurate time tracking.
   *
   * @param {Habit | null} habit - The habit to associate with the timer, or null to clear selection
   */
  const selectHabit = (habit: Habit | null) => {
    timerState.value.selectedHabit = habit
  }

  /**
   * Manually sets the timer to a specific number of minutes
   *
   * @param {number} minutes - The number of minutes to set the timer to
   */
  const setTimer = (minutes: number) => {
    timerState.value.minutes = minutes
    timerState.value.seconds = 0
  }

  /**
   * Changes the timer mode and resets the timer accordingly
   *
   * @param {TimerMode} mode - The timer mode to switch to
   */
  const setTimerMode = (mode: TimerMode) => {
    timerState.value.mode = mode
    timerState.value.minutes = getModeMinutes(mode)
    timerState.value.seconds = 0
  }

  /**
   * Toggles the visibility of the timer UI component
   */
  const toggleTimer = () => {
    timerState.value.showTimer = !timerState.value.showTimer
  }

  /**
   * Toggles whether breaks should automatically start after a pomodoro completes
   */
  const toggleAutoStartBreaks = () => {
    timerState.value.autoStartBreaks = !timerState.value.autoStartBreaks
    localStorage.setItem('autoStartBreaks', timerState.value.autoStartBreaks?.toString() || 'false')
  }

  /**
   * Toggles whether pomodoros should automatically start after a break completes
   */
  const toggleAutoStartPomodoros = () => {
    timerState.value.autoStartPomodoros = !timerState.value.autoStartPomodoros
    localStorage.setItem(
      'autoStartPomodoros',
      timerState.value.autoStartPomodoros?.toString() || 'false',
    )
  }

  /**
   * Toggles whether sound notifications are enabled for timer completion
   */
  const toggleSound = () => {
    timerState.value.soundEnabled = !timerState.value.soundEnabled
    localStorage.setItem('soundEnabled', timerState.value.soundEnabled?.toString() || 'false')
  }

  /**
   * Sets the volume for timer sound notifications
   *
   * @param {number} volume - Volume level between 0 (muted) and 1 (max)
   */
  const setSoundVolume = (volume: number) => {
    timerState.value.soundVolume = Math.max(0, Math.min(1, volume))
    localStorage.setItem('soundVolume', timerState.value.soundVolume?.toString() || '0.5')
  }

  /**
   * Resets the completed sessions counter back to zero
   */
  const resetPomodoroCount = () => {
    timerState.value.completedSessions = 0
  }

  /**
   * Loads saved timer settings from localStorage
   *
   * This function retrieves and applies:
   * - Auto-start preferences for breaks and pomodoros
   * - Sound settings (enabled status and volume)
   * - Pomodoro goal and long break interval
   */
  const loadTimerSettings = () => {
    const autoStartBreaks = localStorage.getItem('autoStartBreaks')
    const autoStartPomodoros = localStorage.getItem('autoStartPomodoros')
    const soundEnabled = localStorage.getItem('soundEnabled')
    const soundVolume = localStorage.getItem('soundVolume')
    const pomodoroGoal = localStorage.getItem('pomodoroGoal')
    const longBreakInterval = localStorage.getItem('longBreakInterval')

    if (autoStartBreaks !== null) timerState.value.autoStartBreaks = autoStartBreaks === 'true'
    if (autoStartPomodoros !== null)
      timerState.value.autoStartPomodoros = autoStartPomodoros === 'true'
    if (soundEnabled !== null) timerState.value.soundEnabled = soundEnabled === 'true'
    if (soundVolume !== null) timerState.value.soundVolume = parseFloat(soundVolume)
    if (pomodoroGoal !== null) timerState.value.pomodoroGoal = parseInt(pomodoroGoal)
    if (longBreakInterval !== null) timerState.value.longBreakInterval = parseInt(longBreakInterval)
  }

  /**
   * Saves current timer settings to localStorage for persistence
   */
  const saveTimerSettings = () => {
    localStorage.setItem('autoStartBreaks', timerState.value.autoStartBreaks?.toString() || 'false')
    localStorage.setItem(
      'autoStartPomodoros',
      timerState.value.autoStartPomodoros?.toString() || 'false',
    )
    localStorage.setItem('soundEnabled', timerState.value.soundEnabled?.toString() || 'false')
    localStorage.setItem('soundVolume', timerState.value.soundVolume?.toString() || '0.5')
    localStorage.setItem('pomodoroGoal', timerState.value.pomodoroGoal?.toString() || '4')
    localStorage.setItem('longBreakInterval', timerState.value.longBreakInterval?.toString() || '4')
  }

  // Initialize settings on load
  loadTimerSettings()

  return {
    timerState,
    timerStats,
    formattedTime,
    startTimer,
    pauseTimer,
    resetTimer,
    selectHabit,
    setTimer,
    setTimerMode,
    toggleTimer,
    toggleAutoStartBreaks,
    toggleAutoStartPomodoros,
    toggleSound,
    setSoundVolume,
    resetPomodoroCount,
    saveTimerSettings,
    getModeMinutes,
  }
}
