import { ref, computed, onUnmounted, reactive } from 'vue'
import { useNotification } from './useNotification'
import type { Habit, TimerState, TimerMode } from '../types/habit'
import { useHabits } from './useHabits'
import { usePlayer } from './usePlayer'

export function useTimer() {
  const { displayNotification } = useNotification()
  const { trackTimer } = useHabits()
  const { addXP } = usePlayer()

  // Enhanced timer state with more features
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

  // Timer statistics for gamification
  const timerStats = reactive({
    totalSessionsCompleted: parseInt(localStorage.getItem('totalSessionsCompleted') || '0'),
    totalMinutesTracked: parseInt(localStorage.getItem('totalMinutesTracked') || '0'),
    longestSession: parseInt(localStorage.getItem('longestSession') || '0'),
    currentStreak: parseInt(localStorage.getItem('timerStreak') || '0'),
    lastSessionDate: localStorage.getItem('lastSessionDate') || '',
    sessionsToday: parseInt(localStorage.getItem('sessionsToday') || '0'),
    lastSessionDay: localStorage.getItem('lastSessionDay') || '',
  })

  // Save timer statistics
  const saveTimerStats = () => {
    localStorage.setItem('totalSessionsCompleted', timerStats.totalSessionsCompleted.toString())
    localStorage.setItem('totalMinutesTracked', timerStats.totalMinutesTracked.toString())
    localStorage.setItem('longestSession', timerStats.longestSession.toString())
    localStorage.setItem('timerStreak', timerStats.currentStreak.toString())
    localStorage.setItem('lastSessionDate', timerStats.lastSessionDate)
    localStorage.setItem('sessionsToday', timerStats.sessionsToday.toString())
    localStorage.setItem('lastSessionDay', timerStats.lastSessionDay)
  }

  // Get pomodoro length based on mode
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

  // Update timer stats when a session completes
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

  // Calculate XP reward for completing a timer session
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

  // Handle automatic timer transitions
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

  // Formatted time string (mm:ss)
  const formattedTime = computed(() => {
    const minutes = timerState.value.minutes.toString().padStart(2, '0')
    const seconds = timerState.value.seconds.toString().padStart(2, '0')
    return `${minutes}:${seconds}`
  })

  // Timer interval reference
  let timerInterval: number | null = null

  // Start timer
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

  // Pause timer
  const pauseTimer = () => {
    if (timerState.value.isRunning && timerInterval !== null) {
      clearInterval(timerInterval)
      timerInterval = null
      timerState.value.isRunning = false
    }
  }

  // Reset timer
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

  // Select a habit for the timer
  const selectHabit = (habit: Habit | null) => {
    timerState.value.selectedHabit = habit
  }

  // Set timer duration manually
  const setTimer = (minutes: number) => {
    timerState.value.minutes = minutes
    timerState.value.seconds = 0
  }

  // Set timer mode
  const setTimerMode = (mode: TimerMode) => {
    timerState.value.mode = mode
    timerState.value.minutes = getModeMinutes(mode)
    timerState.value.seconds = 0
  }

  // Toggle timer visibility
  const toggleTimer = () => {
    timerState.value.showTimer = !timerState.value.showTimer
  }

  // Toggle auto-start settings
  const toggleAutoStartBreaks = () => {
    timerState.value.autoStartBreaks = !timerState.value.autoStartBreaks
    localStorage.setItem('autoStartBreaks', timerState.value.autoStartBreaks.toString())
  }

  const toggleAutoStartPomodoros = () => {
    timerState.value.autoStartPomodoros = !timerState.value.autoStartPomodoros
    localStorage.setItem('autoStartPomodoros', timerState.value.autoStartPomodoros.toString())
  }

  // Toggle sound settings
  const toggleSound = () => {
    timerState.value.soundEnabled = !timerState.value.soundEnabled
    localStorage.setItem('soundEnabled', timerState.value.soundEnabled.toString())
  }

  // Set sound volume
  const setSoundVolume = (volume: number) => {
    timerState.value.soundVolume = Math.max(0, Math.min(1, volume))
    localStorage.setItem('soundVolume', timerState.value.soundVolume.toString())
  }

  // Reset pomodoro counter
  const resetPomodoroCount = () => {
    timerState.value.completedSessions = 0
  }

  // Load timer settings from localStorage
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

  // Save timer settings to localStorage
  const saveTimerSettings = () => {
    localStorage.setItem('autoStartBreaks', timerState.value.autoStartBreaks.toString())
    localStorage.setItem('autoStartPomodoros', timerState.value.autoStartPomodoros.toString())
    localStorage.setItem('soundEnabled', timerState.value.soundEnabled.toString())
    localStorage.setItem('soundVolume', timerState.value.soundVolume.toString())
    localStorage.setItem('pomodoroGoal', timerState.value.pomodoroGoal.toString())
    localStorage.setItem('longBreakInterval', timerState.value.longBreakInterval.toString())
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
