<script setup lang="ts">
import { useTimer } from '../composables/useTimer';
import { useI18n } from '../composables/useI18n';

const { state: timerState, formattedTime, setTimerMode, startTimer, pauseTimer, stopTimer, closeTimer, formatTimeSpent } = useTimer();
const { t } = useI18n();
</script>

<template>
  <div class="timer-modal" v-if="timerState.showTimer && timerState.selectedHabit">
    <div class="timer-content">
      <div class="timer-header">
        <h3>{{ timerState.selectedHabit.name }}</h3>
        <button class="close-button" @click="closeTimer">×</button>
      </div>

      <div class="timer-display" :class="{ 'timer-running': timerState.isRunning }">
        {{ formattedTime }}
      </div>

      <div class="timer-modes">
        <button
          @click="setTimerMode('pomodoro')"
          :class="{ active: timerState.mode === 'pomodoro' }"
          class="mode-button"
        >
          {{ t('timer.pomodoro') }}
        </button>
        <button
          @click="setTimerMode('shortBreak')"
          :class="{ active: timerState.mode === 'shortBreak' }"
          class="mode-button"
        >
          {{ t('timer.shortBreak') }}
        </button>
        <button
          @click="setTimerMode('longBreak')"
          :class="{ active: timerState.mode === 'longBreak' }"
          class="mode-button"
        >
          {{ t('timer.longBreak') }}
        </button>
      </div>

      <div class="timer-controls">
        <button
          @click="startTimer"
          class="control-button start"
          v-if="!timerState.isRunning"
        >
          {{ t('timer.start') }}
        </button>
        <button
          @click="pauseTimer"
          class="control-button pause"
          v-else
        >
          {{ t('timer.pause') }}
        </button>
        <button
          @click="stopTimer"
          class="control-button stop"
        >
          {{ t('timer.reset') }}
        </button>
      </div>

      <div class="timer-info" v-if="timerState.selectedHabit.timeSpent">
        <div class="time-spent">
          {{ t('timer.timeSpent') }}: {{ formatTimeSpent(timerState.selectedHabit.timeSpent) }}
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
