import { ref, computed } from 'vue'
import type { TimerState, TimerMode, Habit } from '../types/habit'

export function useTimer() {
  const state = ref<TimerState>({
    selectedHabit: null,
    showTimer: false,
    isRunning: false,
    seconds: 0,
    minutes: 25,
    mode: 'pomodoro',
    customMinutes: 25,
  } as TimerState)

  const timerInterval = ref<number | null>(null)

  // Format time as MM:SS
  const formattedTime = computed(() => {
    const minutes = Math.max(0, state.value.minutes).toString().padStart(2, '0')
    const seconds = Math.max(0, state.value.seconds).toString().padStart(2, '0')
    return `${minutes}:${seconds}`
  })

  // Reset timer values without triggering mode change
  const resetTimer = () => {
    switch (state.value.mode) {
      case 'pomodoro':
        state.value.minutes = 25
        break
      case 'shortBreak':
        state.value.minutes = 5
        break
      case 'longBreak':
        state.value.minutes = 15
        break
      case 'custom':
        state.value.minutes = state.value.customMinutes
        break
    }
    state.value.seconds = 0
  }

  // Set timer mode
  const setTimerMode = (mode: TimerMode) => {
    pauseTimer()
    state.value.mode = mode
    resetTimer()
  }

  // Set custom time
  const setCustomTime = (minutes: number) => {
    if (minutes < 1) minutes = 1
    if (minutes > 180) minutes = 180 // Max 3 hours
    state.value.customMinutes = minutes
    state.value.mode = 'custom'
    state.value.minutes = minutes
    state.value.seconds = 0
  }

  // Start timer
  const startTimer = () => {
    if (state.value.isRunning) return

    state.value.isRunning = true
    timerInterval.value = window.setInterval(() => {
      if (state.value.seconds > 0) {
        state.value.seconds--
      } else if (state.value.minutes > 0) {
        state.value.minutes--
        state.value.seconds = 59
      } else {
        timerCompleted()
      }
    }, 1000)
  }

  // Pause timer
  const pauseTimer = () => {
    if (!state.value.isRunning) return

    state.value.isRunning = false
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
  }

  // Stop timer
  const stopTimer = () => {
    pauseTimer()
    resetTimer()
  }

  // Timer completed callback
  let onTimerCompleted: (() => void) | null = null
  const setOnTimerCompleted = (callback: () => void) => {
    onTimerCompleted = callback
  }

  // Timer completed
  const timerCompleted = () => {
    pauseTimer()
    if (onTimerCompleted) {
      onTimerCompleted()
    }
  }

  // Select habit for timer
  const selectHabit = (habit: Habit) => {
    if (state.value.isRunning && state.value.selectedHabit?.id !== habit.id) {
      if (!confirm('Timer is running for another task. Switch tasks?')) {
        return
      }
      stopTimer()
    }

    state.value.selectedHabit = habit
    state.value.showTimer = true
    state.value.minutes = 25 // Ensure minutes is set
    state.value.seconds = 0 // Ensure seconds is set
    setTimerMode('pomodoro')
  }

  // Close timer
  const closeTimer = () => {
    stopTimer()
    state.value.showTimer = false
    state.value.selectedHabit = null
  }

  // Format time spent
  const formatTimeSpent = (seconds: number): string => {
    if (!seconds) return '0m'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Cleanup on unmount
  const cleanup = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
    }
  }

  return {
    state,
    formattedTime,
    setTimerMode,
    setCustomTime,
    startTimer,
    pauseTimer,
    stopTimer,
    selectHabit,
    closeTimer,
    formatTimeSpent,
    setOnTimerCompleted,
    cleanup,
  }
}
