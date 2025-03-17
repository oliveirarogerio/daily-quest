<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

interface Habit {
  id: number;
  name: string;
  completed: boolean;
  streak: number;
  timeSpent?: number;
}

interface Props {
  habits: Habit[];
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'complete', habit: Habit): void;
  (e: 'remove', habitId: number): void;
  (e: 'selectForTimer', habit: Habit): void;
}>();

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
  <div class="daily-quests">
    <div class="quest-header">
      <div class="rune-symbol left"></div>
      <h3>DAILY QUESTS</h3>
      <div class="rune-symbol right"></div>
    </div>

    <ul class="habit-list">
      <li v-for="habit in habits" :key="habit.id" class="habit-item">
        <div class="habit-content">
          <div class="habit-left">
            <input
              type="checkbox"
              :checked="habit.completed"
              @click="emit('complete', habit)"
              class="habit-checkbox"
            />
            <span class="habit-name" :class="{ completed: habit.completed }">
              {{ habit.name }}
            </span>
          </div>
          <div class="habit-right">
            <span class="time-badge" v-if="habit.timeSpent" title="Time spent on this quest">
              {{ formatTimeSpent(habit.timeSpent) }}
            </span>
            <span class="streak-badge" v-if="habit.streak > 0">{{ habit.streak }} 🔥</span>
            <button class="timer-button" @click="emit('selectForTimer', habit)" title="Start Timer">
              <span class="timer-icon">⏱️</span>
            </button>
            <button class="delete-button" @click="emit('remove', habit.id)" title="Remove Quest">
              <span class="delete-icon">×</span>
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.daily-quests {
  background: linear-gradient(135deg, #2a2a3a 0%, #1a1a2a 100%);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(106, 90, 205, 0.3);
  position: relative;
}

.daily-quests::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><path d="M15 5 L25 10 L25 20 L15 25 L5 20 L5 10 Z" fill="none" stroke="%236a5acd" stroke-width="0.5" opacity="0.1" /></svg>');
  background-repeat: repeat;
  opacity: 0.1;
  z-index: 0;
  border-radius: 10px;
}

.quest-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.quest-header h3 {
  margin: 0;
  color: #fff;
  padding-bottom: 8px;
  text-align: center;
  position: relative;
  text-shadow: 0 0 5px rgba(106, 90, 205, 0.7);
  letter-spacing: 2px;
  font-size: 1.1rem;
}

.quest-header h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #6a5acd, transparent);
}

.rune-symbol {
  width: 18px;
  height: 18px;
  position: relative;
}

.rune-symbol.left {
  margin-right: 12px;
}

.rune-symbol.right {
  margin-left: 12px;
}

.rune-symbol::before, .rune-symbol::after {
  content: '';
  position: absolute;
  background-color: #6a5acd;
}

.rune-symbol.left::before {
  width: 18px;
  height: 3px;
  top: 7.5px;
  left: 0;
}

.rune-symbol.left::after {
  width: 3px;
  height: 18px;
  top: 0;
  left: 7.5px;
}

.rune-symbol.right::before {
  width: 18px;
  height: 3px;
  top: 7.5px;
  left: 0;
}

.rune-symbol.right::after {
  width: 18px;
  height: 3px;
  top: 0;
  left: 0;
  transform: rotate(90deg);
  transform-origin: 9px 9px;
}

.habit-list {
  list-style: none;
  padding: 0;
  margin: 0;
  position: relative;
  z-index: 1;
  max-height: 30vh;
  overflow-y: auto;
}

.habit-item {
  margin-bottom: 8px;
  padding: 10px 12px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  position: relative;
}

.habit-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  border-left: 3px solid #6a5acd;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.habit-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 8px;
  box-shadow: 0 0 5px rgba(106, 90, 205, 0.3);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.habit-item:hover::before {
  opacity: 1;
}

.habit-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.habit-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.habit-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.habit-checkbox {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 2px solid #6a5acd;
  position: relative;
  cursor: pointer;
  vertical-align: middle;
  margin-right: 10px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.habit-checkbox:hover {
  background-color: rgba(106, 90, 205, 0.2);
  box-shadow: 0 0 5px rgba(106, 90, 205, 0.5);
}

.habit-checkbox:checked {
  background-color: #6a5acd;
}

.habit-checkbox:checked::after {
  content: "✓";
  position: absolute;
  color: white;
  font-size: 12px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.habit-name {
  color: #fff;
  flex: 1;
  word-break: break-word;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.completed {
  text-decoration: line-through;
  color: #9370db;
}

.streak-badge {
  background-color: rgba(255, 69, 0, 0.2);
  color: #ff6347;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: bold;
  margin-left: 10px;
  white-space: nowrap;
  border: 1px solid rgba(255, 69, 0, 0.3);
  box-shadow: 0 0 5px rgba(255, 69, 0, 0.3);
  flex-shrink: 0;
}

.timer-button {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: rgba(106, 90, 205, 0.2);
  border: 1px solid rgba(106, 90, 205, 0.3);
  color: #6a5acd;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
  opacity: 0.7;
  flex-shrink: 0;
}

.timer-button:hover {
  background-color: rgba(106, 90, 205, 0.4);
  transform: scale(1.1);
  opacity: 1;
  box-shadow: 0 0 5px rgba(106, 90, 205, 0.5);
}

.timer-icon {
  font-size: 12px;
  line-height: 1;
}

.time-badge {
  background-color: rgba(106, 90, 205, 0.2);
  color: #9370db;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: bold;
  white-space: nowrap;
  border: 1px solid rgba(106, 90, 205, 0.3);
  box-shadow: 0 0 5px rgba(106, 90, 205, 0.3);
  flex-shrink: 0;
}

.delete-button {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: rgba(255, 69, 0, 0.2);
  border: 1px solid rgba(255, 69, 0, 0.3);
  color: #ff6347;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
  opacity: 0.7;
  flex-shrink: 0;
}

.delete-button:hover {
  background-color: rgba(255, 69, 0, 0.4);
  transform: scale(1.1);
  opacity: 1;
  box-shadow: 0 0 5px rgba(255, 69, 0, 0.5);
}

.delete-icon {
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
}

@media (max-width: 768px) {
  .daily-quests {
    padding: 12px;
  }

  .habit-content {
    flex-direction: row;
    align-items: center;
  }

  .habit-right {
    display: flex;
    align-items: center;
  }

  .streak-badge {
    margin-left: 0;
    margin-top: 0;
  }
}

@media (max-height: 600px) {
  .daily-quests {
    padding: 10px;
    margin-bottom: 10px;
  }

  .habit-list {
    max-height: 25vh;
  }
}
</style>
