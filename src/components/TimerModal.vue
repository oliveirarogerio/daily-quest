<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Habit, TimerMode } from '../types/habit'
import Robby3D from './Robby3D.vue'

const props = defineProps<{
  habit: Habit
  isRunning: boolean
  mode: TimerMode
  formattedTime: string
  customMinutes: number
  swipeOffset: number
  completedSessions?: number
  pomodoroGoal?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'start'): void
  (e: 'pause'): void
  (e: 'stop'): void
  (e: 'setMode', mode: TimerMode): void
  (e: 'setCustomTime', minutes: number): void
  (e: 'touchStart', event: TouchEvent): void
  (e: 'touchMove', event: TouchEvent): void
  (e: 'touchEnd', event: TouchEvent): void
  (e: 'toggleAutoStart'): void
}>()


const progress = ref(0)
const robbyVariant = ref<'default' | 'celebrating' | 'encouraging' | 'sleeping'>('encouraging')
const showRobby = ref(false)
const totalDuration = ref(0) // Total duration in seconds
const initialTime = ref(0) // Initial time in seconds
const elapsedTime = ref(0) // Elapsed time in seconds

// Timekeeper for progress calculation
let progressInterval: number | null = null

// Pomodoro session indicators
const sessions = computed(() => {
  const total = props.pomodoroGoal || 4
  const completed = props.completedSessions || 0
  return Array(total)
    .fill(0)
    .map((_, index) => index < completed)
})

// Format time for accessibility - "25 minutes" instead of "25:00"
const accessibleTime = computed(() => {
  const [mins, secs] = props.formattedTime.split(':')
  const minutes = parseInt(mins)
  const seconds = parseInt(secs)

  if (minutes === 0) {
    return `${seconds} segundos`
  } else if (seconds === 0) {
    return `${minutes} minutos`
  } else {
    return `${minutes} minutos ${seconds} segundos`
  }
})

// Mode descriptions for better UX
const modeDescription = computed(() => {
  switch (props.mode) {
    case 'pomodoro':
      return 'Foque na sua tarefa por 25 minutos'
    case 'shortBreak':
      return 'Faça uma pausa de 5 minutos'
    case 'longBreak':
      return 'Faça uma pausa de 15 minutos'
    case 'custom':
      return 'Defina sua própria duração'
    default:
      return ''
  }
})

// Set up duration when timer starts or mode changes
watch(
  () => props.mode,
  () => {
    setDuration()
  },
)

watch(
  () => props.customMinutes,
  () => {
    if (props.mode === 'custom') {
      setDuration()
    }
  },
)

// Watch for timer state changes
watch(
  () => props.isRunning,
  (newVal) => {
    if (newVal) {
      startProgressTracking()
    } else {
      stopProgressTracking()
    }
  },
)

// Calculate duration based on mode
const setDuration = () => {
  let minutes = 25 // Default

  if (props.mode === 'pomodoro') {
    minutes = 25
  } else if (props.mode === 'shortBreak') {
    minutes = 5
  } else if (props.mode === 'longBreak') {
    minutes = 15
  } else if (props.mode === 'custom') {
    minutes = props.customMinutes
  }

  totalDuration.value = minutes * 60 // Convert to seconds
  initialTime.value = minutes * 60

  // Reset elapsed time when changing modes
  if (!props.isRunning) {
    elapsedTime.value = 0
    calculateProgress()
  }
}

// Start tracking progress
const startProgressTracking = () => {
  // Clear any existing interval
  stopProgressTracking()

  // Create new interval
  progressInterval = window.setInterval(() => {
    // Calculate elapsed time based on difference between total and current time
    const [mins, secs] = props.formattedTime.split(':')
    const currentTimeInSeconds = parseInt(mins) * 60 + parseInt(secs)
    elapsedTime.value = initialTime.value - currentTimeInSeconds

    calculateProgress()
  }, 1000)
}

// Stop tracking progress
const stopProgressTracking = () => {
  if (progressInterval !== null) {
    clearInterval(progressInterval)
    progressInterval = null
  }
}

// Calculate progress percentage
const calculateProgress = () => {
  if (totalDuration.value > 0) {
    progress.value = (elapsedTime.value / totalDuration.value) * 100
  } else {
    progress.value = 0
  }
}

// Set up initial duration
onMounted(() => {
  setDuration()
  // Show Robby after a short delay
  setTimeout(() => {
    showRobby.value = true
  }, 500)
})

// Clean up when component unmounts
onUnmounted(() => {
  stopProgressTracking()
})

// Handle close with keyboard
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

// Add keyboard listener
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

// Clean up keyboard listener
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="timer-modal">
    <div
      class="timer-content"
      :style="{ transform: `translateY(${swipeOffset}px)` }"
      @touchstart="emit('touchStart', $event)"
      @touchmove="emit('touchMove', $event)"
      @touchend="emit('touchEnd', $event)"
    >
      <div class="timer-header">
        <h3>{{ habit.name }}</h3>
        <button class="close-button" @click="emit('close')" aria-label="Close timer">×</button>
      </div>

      <!-- Robby Mascot with speech bubble -->
      <div v-if="showRobby" class="robby-container">
        <Robby3D :variant="robbyVariant" :animated="true" size="sm" color-scheme="vibrant" />
        <div class="speech-bubble">
          <p v-if="!isRunning">⏰ Escolha um modo e inicie o timer!</p>
          <p v-else>🎯 Foco total! Você consegue!</p>
        </div>
      </div>

      <div class="timer-display" :class="{ 'timer-running': isRunning }">
        <div class="progress-ring">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <!-- Background circle -->
            <circle cx="100" cy="100" r="85" class="progress-ring-circle-bg" />
            <!-- Progress circle -->
            <circle
              cx="100"
              cy="100"
              r="85"
              class="progress-ring-circle"
              :style="{
                strokeDashoffset: `${(100 - progress) * 5.34}`,
                strokeDasharray: '534',
                stroke:
                  mode === 'pomodoro'
                    ? '#ff6b6b'
                    : mode === 'shortBreak'
                      ? '#6a5acd'
                      : mode === 'longBreak'
                        ? '#3498db'
                        : mode === 'custom'
                          ? '#f9a826'
                          : '#6a5acd',
              }"
            />
          </svg>
          <div class="time" :class="`time-${mode}`">{{ formattedTime }}</div>
          <div class="mode-label" aria-live="polite">{{ mode === 'pomodoro' ? 'Pomodoro' : mode === 'shortBreak' ? 'Pausa Curta' : mode === 'longBreak' ? 'Pausa Longa' : 'Tempo Personalizado' }}</div>
        </div>
      </div>

      <!-- Session indicators -->
      <div class="session-indicators" aria-label="Pomodoro sessions">
        <div
          v-for="(completed, index) in sessions"
          :key="index"
          class="session-dot"
          :class="{ completed: completed }"
          :title="`Sessão ${index + 1}${completed ? ' - Concluída' : ''}`"
        ></div>
      </div>

      <div class="timer-description" aria-live="polite">
        <p>{{ modeDescription }}</p>
      </div>

      <div class="timer-modes">
        <button
          @click="emit('setMode', 'pomodoro')"
          :class="{ active: mode === 'pomodoro' }"
          class="mode-button pomodoro"
          :aria-pressed="mode === 'pomodoro'"
        >
          Pomodoro
        </button>
        <button
          @click="emit('setMode', 'shortBreak')"
          :class="{ active: mode === 'shortBreak' }"
          class="mode-button short-break"
          :aria-pressed="mode === 'shortBreak'"
        >
          Pausa Curta
        </button>
        <button
          @click="emit('setMode', 'longBreak')"
          :class="{ active: mode === 'longBreak' }"
          class="mode-button long-break"
          :aria-pressed="mode === 'longBreak'"
        >
          Pausa Longa
        </button>
        <button
          @click="emit('setMode', 'custom')"
          :class="{ active: mode === 'custom' }"
          class="mode-button custom"
          :aria-pressed="mode === 'custom'"
        >
          Tempo Personalizado
        </button>
      </div>

      <!-- Custom Time Input -->
      <div class="custom-time" v-if="mode === 'custom'">
        <label for="customTime">Tempo Personalizado</label>
        <div class="custom-time-input">
          <button
            class="time-adjust-btn"
            @click="emit('setCustomTime', customMinutes - 1)"
            :disabled="customMinutes <= 1 || isRunning"
            aria-label="Decrease time"
          >
            -
          </button>
          <input
            type="number"
            id="customTime"
            :value="customMinutes"
            min="1"
            max="180"
            @change="
              (e: Event) => emit('setCustomTime', parseInt((e.target as HTMLInputElement).value))
            "
            :disabled="isRunning"
            aria-label="Custom time in minutes"
          />
          <button
            class="time-adjust-btn"
            @click="emit('setCustomTime', customMinutes + 1)"
            :disabled="customMinutes >= 180 || isRunning"
            aria-label="Increase time"
          >
            +
          </button>
          <span class="minutes-label">minutos</span>
        </div>
      </div>

      <div class="timer-controls">
        <button
          @click="emit('start')"
          class="control-button start"
          v-if="!isRunning"
          aria-label="Start timer"
        >
          <span class="control-icon">▶</span>
          Iniciar
        </button>
        <button @click="emit('pause')" class="control-button pause" v-else aria-label="Pause timer">
          <span class="control-icon">⏸</span>
          Pausar
        </button>
        <button @click="emit('stop')" class="control-button stop" aria-label="Reset timer">
          <span class="control-icon">⟲</span>
          Reiniciar
        </button>
      </div>

      <div class="timer-info" v-if="habit.timeSpent">
        <div class="time-spent">
          <span class="info-icon">⏱</span> Tempo gasto: {{ habit.timeSpent }}h
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timer-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 20, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.timer-content {
  background: linear-gradient(135deg, rgba(28, 28, 45, 0.95), rgba(20, 20, 35, 0.95));
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(106, 90, 205, 0.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timer-header h3 {
  margin: 0;
  color: #fff;
  font-size: 1.4rem;
  text-shadow: 0 0 10px rgba(106, 90, 205, 0.5);
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.timer-display {
  text-align: center;
  margin: 20px 0;
  position: relative;
}

.progress-ring {
  position: relative;
  display: inline-block;
}

.progress-ring svg {
  transform: rotate(-90deg);
}

.progress-ring-circle-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 8;
}

.progress-ring-circle {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s;
}

.time {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 10px rgba(106, 90, 205, 0.7);
  font-family: 'Roboto Mono', monospace;
}

.time-pomodoro {
  color: #ff6b6b;
}

.time-shortBreak {
  color: #6a5acd;
}

.time-longBreak {
  color: #3498db;
}

.time-custom {
  color: #f9a826;
}

.mode-label {
  position: absolute;
  top: 65%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.timer-running .time {
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.7;
  }
}

.session-indicators {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.session-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.session-dot.completed {
  background: #6a5acd;
  box-shadow: 0 0 8px rgba(106, 90, 205, 0.7);
}

.timer-description {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.timer-modes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.mode-button {
  flex: 1;
  min-width: calc(50% - 8px);
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.mode-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.mode-button.active {
  border-color: transparent;
  font-weight: 600;
}

.mode-button.pomodoro.active {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.7), rgba(255, 77, 77, 0.7));
}

.mode-button.short-break.active {
  background: linear-gradient(135deg, rgba(106, 90, 205, 0.7), rgba(147, 112, 219, 0.7));
}

.mode-button.long-break.active {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.7), rgba(41, 128, 185, 0.7));
}

.mode-button.custom.active {
  background: linear-gradient(135deg, rgba(249, 168, 38, 0.7), rgba(230, 126, 34, 0.7));
}

.custom-time {
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 8px;
}

.custom-time label {
  display: block;
  color: #fff;
  margin-bottom: 8px;
  font-weight: 500;
}

.custom-time-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-adjust-btn {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: rgba(106, 90, 205, 0.3);
  color: #fff;
  border: none;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-adjust-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.time-adjust-btn:hover:not(:disabled) {
  background: rgba(106, 90, 205, 0.5);
}

.custom-time-input input {
  width: 60px;
  padding: 8px;
  border: 1px solid rgba(106, 90, 205, 0.3);
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  border-radius: 4px;
  text-align: center;
  font-size: 16px;
}

.minutes-label {
  color: rgba(255, 255, 255, 0.8);
}

.timer-controls {
  display: flex;
  gap: 12px;
}

.control-button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.control-icon {
  font-size: 1.2rem;
}

.control-button.start {
  background: linear-gradient(135deg, #6a5acd, #9370db);
  color: #fff;
}

.control-button.start:hover {
  background: linear-gradient(135deg, #7b6dd4, #a387e0);
  box-shadow: 0 4px 12px rgba(106, 90, 205, 0.4);
}

.control-button.pause {
  background: linear-gradient(135deg, #ff6b6b, #ff4d4d);
  color: #fff;
}

.control-button.pause:hover {
  background: linear-gradient(135deg, #ff8282, #ff6464);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

.control-button.stop {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.control-button.stop:hover {
  background: rgba(255, 255, 255, 0.2);
}

.timer-info {
  margin-top: 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-spent {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-icon {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .timer-content {
    width: 100%;
    height: 100%;
    border-radius: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .time {
    font-size: 2.5rem;
  }

  .mode-button {
    padding: 14px;
  }

  .control-button {
    padding: 16px;
  }
}

/* Robby Mascot Styles */
.robby-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(106, 90, 205, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(106, 90, 205, 0.2);
  animation: slide-in 0.5s ease-out;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.speech-bubble {
  flex: 1;
  background: linear-gradient(135deg, #6a5acd, #9370db);
  color: white;
  padding: 10px 14px;
  border-radius: 14px;
  position: relative;
  box-shadow: 0 4px 12px rgba(106, 90, 205, 0.3);
}

.speech-bubble::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 8px solid #6a5acd;
}

.speech-bubble p {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.3;
}

@media (max-width: 768px) {
  .robby-container {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .speech-bubble::before {
    left: 50%;
    top: -8px;
    transform: translateX(-50%);
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid #6a5acd;
    border-bottom: none;
  }
}
</style>
