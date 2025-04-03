<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '../composables/useI18n';
import type { Habit } from '../types/habit';

const props = defineProps<{
  habits: Habit[];
}>();

const emit = defineEmits<{
  (e: 'toggle', habit: Habit, mouseEvent?: MouseEvent): void;
  (e: 'remove', habitId: string): void;
  (e: 'timer', habit: Habit): void;
}>();

const { t } = useI18n();

// Touch gesture state
const touchStart = ref({ x: 0, y: 0 });
const swipeItem = ref<Habit | null>(null);
const swipeThreshold = 50;

// This function just passes the event to the parent component
const handleToggle = (habit: Habit, e?: Event) => {
  const mouseEvent = e instanceof MouseEvent ? e : undefined;
  emit('toggle', habit, mouseEvent);
};

const handleTouchStart = (event: TouchEvent, habit: Habit) => {
  touchStart.value = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY
  };
  swipeItem.value = habit;
};

const handleTouchMove = (event: TouchEvent) => {
  if (!swipeItem.value) return;

  const xDiff = event.touches[0].clientX - touchStart.value.x;
  const yDiff = event.touches[0].clientY - touchStart.value.y;

  // If vertical scroll is more prominent, cancel swipe
  if (Math.abs(yDiff) > Math.abs(xDiff)) {
    swipeItem.value = null;
    return;
  }

  // Prevent scrolling while swiping
  event.preventDefault();

  const element = event.currentTarget as HTMLElement;
  element.style.transform = `translateX(${xDiff}px)`;
  element.style.transition = 'none';
};

const handleTouchEnd = async (event: TouchEvent) => {
  if (!swipeItem.value) return;

  const element = event.currentTarget as HTMLElement;
  element.style.transition = 'transform 0.3s ease';

  const xDiff = event.changedTouches[0].clientX - touchStart.value.x;

  // Reset position
  element.style.transform = 'translateX(0)';

  // Check if swipe distance meets threshold
  if (Math.abs(xDiff) >= swipeThreshold) {
    if (xDiff > 0) {
      // Swipe right - toggle habit
      handleToggle(swipeItem.value);
      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } else {
      // Swipe left - delete habit
      emit('remove', swipeItem.value.id);
      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate([50, 50]);
      }
    }
  }

  swipeItem.value = null;
};
</script>

<template>
  <div class="quest-list">
    <div class="quest-header">
      <div class="rune-symbol left"></div>
      <h3>{{ t('quests.title') }}</h3>
      <div class="rune-symbol right"></div>
    </div>

    <ul class="habit-list">
      <li v-for="habit in habits"
          :key="habit.id"
          class="habit-item"
          @touchstart="(e) => handleTouchStart(e, habit)"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd">
        <div class="habit-content">
          <div class="habit-left">
            <input
              type="checkbox"
              :checked="habit.completed"
              @change="($event) => handleToggle(habit, $event)"
              class="habit-checkbox"
            />
            <span class="habit-name" :class="{ completed: habit.completed }">
              {{ habit.name }}
            </span>
          </div>
          <div class="habit-right">
            <span class="time-badge" v-if="habit.timeSpent" :title="t('quests.timeSpent')">
              {{ habit.timeSpent }}h
            </span>
            <span class="streak-badge" v-if="habit.streak > 0">
              {{ habit.streak }} X🔥
            </span>
            <button class="timer-button" @click="emit('timer', habit)" :title="t('quests.startTimer')">
              <span class="timer-icon">⏱️</span>
            </button>
            <button class="delete-button" @click="emit('remove', habit.id)" :title="t('quests.removeQuest')">
              <span class="delete-icon">×</span>
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.quest-list {
  background: linear-gradient(135deg, rgba(28, 28, 45, 0.95), rgba(20, 20, 35, 0.95));
  border-radius: 16px;
  padding: 24px;
  margin: 20px 0;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(106, 90, 205, 0.2);
  position: relative;
  overflow: hidden;
}

.quest-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  position: relative;
}

.quest-header h3 {
  color: #fff;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 3px;
  text-shadow: 0 0 15px rgba(106, 90, 205, 0.7);
  margin: 0;
  padding: 0 30px;
  position: relative;
}

.quest-header h3::before,
.quest-header h3::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #6a5acd, transparent);
}

.quest-header h3::before {
  left: -20px;
  transform: translateX(-100%);
}

.quest-header h3::after {
  right: -20px;
  transform: translateX(100%);
}

.habit-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.habit-item {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(106, 90, 205, 0.2);
  position: relative;
  overflow: hidden;
}

.habit-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(to bottom, #6a5acd, #9370db);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.habit-item:hover {
  transform: translateY(-2px) scale(1.01);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(106, 90, 205, 0.4);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.2),
    0 0 20px rgba(106, 90, 205, 0.2);
}

.habit-item:hover::before {
  opacity: 1;
}

.habit-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.habit-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.habit-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.habit-checkbox {
  appearance: none;
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(106, 90, 205, 0.5);
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.habit-checkbox:hover {
  background: rgba(106, 90, 205, 0.1);
  border-color: #6a5acd;
  box-shadow: 0 0 15px rgba(106, 90, 205, 0.3);
  transform: scale(1.1);
}

.habit-checkbox:checked {
  background: linear-gradient(135deg, #6a5acd, #9370db);
  border-color: transparent;
  animation: checkmark 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.habit-checkbox:checked::after {
  content: "✓";
  position: absolute;
  color: white;
  font-size: 16px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

@keyframes checkmark {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.habit-name {
  color: #fff;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  text-shadow: 0 0 10px rgba(106, 90, 205, 0.3);
}

.completed {
  text-decoration: line-through;
  color: rgba(147, 112, 219, 0.7);
}

.streak-badge {
  background: rgba(255, 69, 0, 0.1);
  color: #ff6347;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid rgba(255, 69, 0, 0.3);
  box-shadow: 0 0 10px rgba(255, 69, 0, 0.2);
}

.time-badge {
  background: rgba(106, 90, 205, 0.1);
  color: #9370db;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid rgba(106, 90, 205, 0.3);
  box-shadow: 0 0 10px rgba(106, 90, 205, 0.2);
}

.timer-button,
.delete-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(106, 90, 205, 0.3);
}

.timer-button {
  color: #9370db;
}

.timer-button:hover {
  background: rgba(106, 90, 205, 0.1);
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(106, 90, 205, 0.3);
}

.delete-button {
  color: #ff6347;
  border-color: rgba(255, 69, 0, 0.3);
}

.delete-button:hover {
  background: rgba(255, 69, 0, 0.1);
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(255, 69, 0, 0.3);
}

@media (max-width: 768px) {
  .quest-list {
    margin: 16px 0;
    padding: 20px;
  }

  .quest-header h3 {
    font-size: 1.2rem;
  }

  .habit-item {
    margin-bottom: 12px;
  }

  .habit-checkbox {
    width: 28px;
    height: 28px;
  }

  .habit-name {
    font-size: 0.95rem;
  }

  .timer-button,
  .delete-button {
    width: 36px;
    height: 36px;
  }
}

@media (prefers-contrast: high) {
  .quest-list {
    border: 2px solid #6a5acd;
  }

  .habit-item {
    border: 2px solid #6a5acd;
  }
}

@media (prefers-reduced-motion: reduce) {
  .habit-item:hover {
    transform: none;
  }

  .habit-checkbox:hover {
    transform: none;
  }
}
</style>
