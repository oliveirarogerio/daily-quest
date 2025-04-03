<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '../composables/useI18n';
import type { Habit } from '../types/habit';

const props = defineProps<{
  habit: Habit;
  isRunning: boolean;
  mode: string;
  formattedTime: string;
  customMinutes: number;
  swipeOffset: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'start'): void;
  (e: 'pause'): void;
  (e: 'stop'): void;
  (e: 'setMode', mode: string): void;
  (e: 'setCustomTime', minutes: number): void;
  (e: 'touchStart', e: TouchEvent): void;
  (e: 'touchMove', e: TouchEvent): void;
  (e: 'touchEnd', e: TouchEvent): void;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="timer-modal">
    <div class="timer-content"
         :style="{ transform: `translateY(${swipeOffset}px)` }"
         @touchstart="emit('touchStart', $event)"
         @touchmove="emit('touchMove', $event)"
         @touchend="emit('touchEnd', $event)">
      <div class="timer-header">
        <h3>{{ habit.name }}</h3>
        <button class="close-button" @click="emit('close')">×</button>
      </div>

      <div class="timer-display" :class="{ 'timer-running': isRunning }">
        {{ formattedTime }}
      </div>

      <div class="timer-modes">
        <button
          @click="emit('setMode', 'pomodoro')"
          :class="{ active: mode === 'pomodoro' }"
          class="mode-button"
        >
          {{ t('timer.pomodoro') }}
        </button>
        <button
          @click="emit('setMode', 'shortBreak')"
          :class="{ active: mode === 'shortBreak' }"
          class="mode-button"
        >
          {{ t('timer.shortBreak') }}
        </button>
        <button
          @click="emit('setMode', 'longBreak')"
          :class="{ active: mode === 'longBreak' }"
          class="mode-button"
        >
          {{ t('timer.longBreak') }}
        </button>
      </div>

      <!-- Custom Time Input -->
      <div class="custom-time">
        <label for="customTime">{{ t('timer.customTime') }}</label>
        <div class="custom-time-input">
          <input
            type="number"
            id="customTime"
            :value="customMinutes"
            min="1"
            max="180"
            @change="(e: Event) => emit('setCustomTime', parseInt((e.target as HTMLInputElement).value))"
            :disabled="isRunning"
          />
          <span class="minutes-label">{{ t('timer.minutes') }}</span>
        </div>
      </div>

      <div class="timer-controls">
        <button
          @click="emit('start')"
          class="control-button start"
          v-if="!isRunning"
        >
          {{ t('timer.start') }}
        </button>
        <button
          @click="emit('pause')"
          class="control-button pause"
          v-else
        >
          {{ t('timer.pause') }}
        </button>
        <button
          @click="emit('stop')"
          class="control-button stop"
        >
          {{ t('timer.reset') }}
        </button>
      </div>

      <div class="timer-info" v-if="habit.timeSpent">
        <div class="time-spent">
          {{ t('timer.timeSpent') }}: {{ habit.timeSpent }}h
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
}

.timer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.timer-header h3 {
  margin: 0;
  color: #fff;
  font-size: 1.4rem;
  text-shadow: 0 0 10px rgba(106, 90, 205, 0.5);
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
  font-size: 4rem;
  font-weight: bold;
  color: #fff;
  text-align: center;
  margin: 24px 0;
  text-shadow: 0 0 20px rgba(106, 90, 205, 0.7);
  font-family: monospace;
}

.timer-running {
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  from { opacity: 1; }
  to { opacity: 0.7; }
}

.timer-modes {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.mode-button {
  flex: 1;
  padding: 12px;
  border: 1px solid rgba(106, 90, 205, 0.3);
  background: rgba(106, 90, 205, 0.1);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-button.active {
  background: linear-gradient(135deg, #6a5acd, #9370db);
  border-color: transparent;
}

.custom-time {
  margin-bottom: 24px;
}

.custom-time label {
  display: block;
  color: #fff;
  margin-bottom: 8px;
}

.custom-time-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-time-input input {
  width: 80px;
  padding: 8px;
  border: 1px solid rgba(106, 90, 205, 0.3);
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  border-radius: 4px;
}

.minutes-label {
  color: #fff;
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
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-button.start {
  background: linear-gradient(135deg, #6a5acd, #9370db);
  color: #fff;
}

.control-button.pause {
  background: linear-gradient(135deg, #ff6b6b, #ff4d4d);
  color: #fff;
}

.control-button.stop {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.timer-info {
  margin-top: 24px;
  text-align: center;
  color: #fff;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .timer-content {
    width: 100%;
    height: 100%;
    border-radius: 0;
    display: flex;
    flex-direction: column;
  }

  .timer-display {
    font-size: 3rem;
    margin: auto 0;
  }

  .mode-button,
  .control-button {
    padding: 16px;
  }
}
</style>
