<script setup lang="ts">
import { computed } from 'vue';

interface Habit {
  id: number;
  name: string;
  completed: boolean;
  streak: number;
  timeSpent?: number;
}

interface Props {
  show: boolean;
  selectedHabit: Habit | null;
  timerRunning: boolean;
  timerMode: 'pomodoro' | 'shortBreak' | 'longBreak';
  timerMinutes: number;
  timerSeconds: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'start'): void;
  (e: 'pause'): void;
  (e: 'stop'): void;
  (e: 'setMode', mode: 'pomodoro' | 'shortBreak' | 'longBreak'): void;
}>();

const formattedTime = computed(() => {
  const minutes = props.timerMinutes.toString().padStart(2, '0');
  const seconds = props.timerSeconds.toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
});

const formatTimeSpent = (seconds: number) => {
  if (!seconds) return '0m';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};
</script>

<template>
  <div class="timer-modal" v-if="show && selectedHabit">
    <div class="timer-content">
      <div class="timer-header">
        <h3>{{ selectedHabit.name }}</h3>
        <button class="close-button" @click="emit('close')">×</button>
      </div>

      <div class="timer-display" :class="{ 'timer-running': timerRunning }">
        {{ formattedTime }}
      </div>

      <div class="timer-modes">
        <button
          @click="emit('setMode', 'pomodoro')"
          :class="{ active: timerMode === 'pomodoro' }"
          class="mode-button"
        >
          Pomodoro
        </button>
        <button
          @click="emit('setMode', 'shortBreak')"
          :class="{ active: timerMode === 'shortBreak' }"
          class="mode-button"
        >
          Short Break
        </button>
        <button
          @click="emit('setMode', 'longBreak')"
          :class="{ active: timerMode === 'longBreak' }"
          class="mode-button"
        >
          Long Break
        </button>
      </div>

      <div class="timer-controls">
        <button
          @click="emit('start')"
          class="control-button start"
          v-if="!timerRunning"
        >
          Start
        </button>
        <button
          @click="emit('pause')"
          class="control-button pause"
          v-else
        >
          Pause
        </button>
        <button
          @click="emit('stop')"
          class="control-button stop"
        >
          Reset
        </button>
      </div>

      <div class="timer-info" v-if="selectedHabit.timeSpent">
        <div class="time-spent">
          Time spent: {{ formatTimeSpent(selectedHabit.timeSpent) }}
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
  background-color: rgba(10, 10, 20, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.timer-content {
  background: linear-gradient(135deg, #2a2a3a 0%, #1a1a2a 100%);
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 0 30px rgba(106, 90, 205, 0.5);
  border: 1px solid rgba(106, 90, 205, 0.5);
  position: relative;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.timer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(106, 90, 205, 0.3);
  padding-bottom: 10px;
}

.timer-header h3 {
  margin: 0;
  color: #fff;
  font-size: 1.2rem;
  text-shadow: 0 0 5px rgba(106, 90, 205, 0.7);
}

.close-button {
  background: none;
  border: none;
  color: #9370db;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: all 0.3s ease;
}

.close-button:hover {
  color: #fff;
  transform: scale(1.1);
}

.timer-display {
  font-size: 3.5rem;
  font-weight: bold;
  text-align: center;
  color: #fff;
  margin: 20px 0;
  text-shadow: 0 0 10px rgba(106, 90, 205, 0.7);
  font-family: 'Courier New', monospace;
  transition: all 0.3s ease;
}

.timer-running {
  color: #6a5acd;
  animation: pulse 1s infinite alternate;
}

.timer-modes {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.mode-button {
  background-color: rgba(106, 90, 205, 0.2);
  border: 1px solid rgba(106, 90, 205, 0.3);
  color: #9370db;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.mode-button:hover {
  background-color: rgba(106, 90, 205, 0.3);
  transform: translateY(-2px);
}

.mode-button.active {
  background-color: rgba(106, 90, 205, 0.5);
  color: white;
  box-shadow: 0 0 10px rgba(106, 90, 205, 0.5);
}

.timer-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

.control-button {
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-size: 1rem;
  min-width: 100px;
}

.control-button.start {
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  color: white;
}

.control-button.pause {
  background: linear-gradient(90deg, #FFC107, #FF9800);
  color: white;
}

.control-button.stop {
  background: rgba(255, 255, 255, 0.1);
  color: #9370db;
  border: 1px solid rgba(106, 90, 205, 0.3);
}

.control-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.timer-info {
  text-align: center;
  color: #9370db;
  font-size: 0.9rem;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .timer-content {
    width: 95%;
    padding: 15px;
  }

  .timer-display {
    font-size: 2.5rem;
    margin: 15px 0;
  }

  .timer-modes {
    flex-wrap: wrap;
  }

  .mode-button {
    font-size: 0.8rem;
    padding: 6px 10px;
  }

  .control-button {
    padding: 8px 15px;
    font-size: 0.9rem;
    min-width: 80px;
  }
}
</style>
