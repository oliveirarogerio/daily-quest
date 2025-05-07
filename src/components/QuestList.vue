<script setup lang="ts">
/**
 * QuestList.vue
 *
 * Displays and manages the list of user habits/quests.
 * This component shows the list of habits, enables completion toggling,
 * and provides swipe gestures for completing or removing habits.
 */
import { ref } from 'vue';
import { useI18n } from '../composables/useI18n';
import type { Habit } from '../types/habit';


const props = defineProps<{
  habits: Habit[];
}>();

/**
 * Component Events
 * @event toggle - When a habit's completion status is toggled
 * @event remove - When a habit is removed
 * @event timer - When the timer is requested for a habit
 */
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

/**
 * Handles toggling habit completion status.
 * Passes the event to the parent component through the toggle event.
 *
 * @param {Habit} habit - The habit to toggle
 * @param {Event} e - Optional DOM event that triggered the toggle
 */
const handleToggle = (habit: Habit, e?: Event) => {
  const mouseEvent = e instanceof MouseEvent ? e : undefined;
  emit('toggle', habit, mouseEvent);
};

/**
 * Handles the start of touch gesture for swipe actions.
 * Records initial touch position and the habit being interacted with.
 *
 * @param {TouchEvent} event - The touch start event
 * @param {Habit} habit - The habit being interacted with
 */
const handleTouchStart = (event: TouchEvent, habit: Habit) => {
  touchStart.value = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY
  };
  swipeItem.value = habit;
};

/**
 * Handles touch movement for swipe actions.
 * Determines swipe direction and updates UI accordingly.
 * Cancels swipe if vertical movement is greater than horizontal.
 *
 * @param {TouchEvent} event - The touch move event
 */
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

/**
 * Handles the end of a touch gesture for swipe actions.
 * Determines if swipe threshold was met and triggers appropriate action:
 * - Right swipe: Toggle habit completion
 * - Left swipe: Delete habit
 * Also provides haptic feedback when available.
 *
 * @param {TouchEvent} event - The touch end event
 */
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
              @change="(e) => handleToggle(habit, e)"
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
  background: linear-gradient(135deg, rgba(18, 18, 35, 0.95), rgba(10, 10, 25, 0.95));
  border-radius: 8px;
  padding: 24px;
  margin: 20px 0;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(106, 90, 205, 0.2);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(106, 90, 205, 0.2);
}

.quest-list::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50,5 L95,50 L50,95 L5,50 Z' fill='none' stroke='%236a5acd' stroke-width='1' opacity='0.3'/%3E%3Cpath d='M50,15 L85,50 L50,85 L15,50 Z' fill='none' stroke='%236a5acd' stroke-width='1' opacity='0.3'/%3E%3Cpath d='M50,25 L75,50 L50,75 L25,50 Z' fill='none' stroke='%239370db' stroke-width='1' opacity='0.3'/%3E%3C/svg%3E") no-repeat center center;
  opacity: 0.3;
  pointer-events: none;
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
  font-weight: 700;
  letter-spacing: 2px;
  text-shadow: 0 0 15px rgba(106, 90, 205, 0.7);
  margin: 0;
  padding: 0 30px;
  position: relative;
  text-transform: uppercase;
}

/* Solo Leveling styled runes */
.rune-symbol {
  width: 24px;
  height: 24px;
  position: relative;
}

.rune-symbol.left::before,
.rune-symbol.right::before {
  content: '';
  position: absolute;
  width: 24px;
  height: 24px;
  background-color: #6a5acd;
  opacity: 0.8;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  animation: glowPulse 2s infinite alternate;
}

@keyframes glowPulse {
  from { box-shadow: 0 0 5px rgba(106, 90, 205, 0.5); opacity: 0.5; }
  to { box-shadow: 0 0 15px rgba(106, 90, 205, 0.8); opacity: 0.8; }
}

.habit-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.habit-item {
  background: rgba(15, 15, 30, 0.7);
  border-radius: 0;
  padding: 16px;
  margin-bottom: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(106, 90, 205, 0.2);
  position: relative;
  overflow: hidden;
  /* Solo Leveling clip-path for quest items */
  clip-path: polygon(
    0% 0%,
    95% 0%,
    100% 30%,
    100% 100%,
    5% 100%,
    0% 70%,
    0% 0%
  );
}

.habit-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(to bottom, #6a5acd, #9370db);
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.habit-item:hover {
  transform: translateY(-2px);
  background: rgba(25, 25, 45, 0.7);
  border-color: rgba(106, 90, 205, 0.4);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(106, 90, 205, 0.3);
}

.habit-item::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background-color: #6a5acd;
  clip-path: polygon(0 0, 100% 0, 100% 100%);
  opacity: 0.8;
}

.habit-item:hover::before {
  opacity: 1;
  width: 5px;
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

/* Solo Leveling checkbox style */
.habit-checkbox {
  appearance: none;
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  background: rgba(10, 10, 25, 0.7);
  border: 2px solid rgba(106, 90, 205, 0.5);
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

.habit-checkbox:hover {
  background: rgba(106, 90, 205, 0.15);
  border-color: #6a5acd;
  box-shadow: 0 0 15px rgba(106, 90, 205, 0.5);
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
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

@keyframes checkmark {
  0% { transform: scale(0.8); opacity: 0; box-shadow: 0 0 0 rgba(106, 90, 205, 0); }
  50% { transform: scale(1.2); box-shadow: 0 0 20px rgba(106, 90, 205, 0.7); }
  100% { transform: scale(1); opacity: 1; box-shadow: 0 0 10px rgba(106, 90, 205, 0.5); }
}

.habit-name {
  font-size: 1rem;
  color: #e0e0ff;
  flex: 1;
  font-weight: 400;
  transition: all 0.3s ease;
}

.completed {
  text-decoration: line-through;
  color: rgba(147, 112, 219, 0.7);
}

/* Solo Leveling style badges */
.streak-badge {
  background: rgba(255, 69, 0, 0.15);
  color: #ff9370;
  padding: 4px 10px;
  border-radius: 0;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid rgba(255, 69, 0, 0.3);
  box-shadow: 0 0 10px rgba(255, 69, 0, 0.2);
  clip-path: polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%);
  padding-left: 14px;
  padding-right: 14px;
}

.time-badge {
  background: rgba(106, 90, 205, 0.15);
  color: #a990ff;
  padding: 4px 10px;
  border-radius: 0;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid rgba(106, 90, 205, 0.3);
  box-shadow: 0 0 10px rgba(106, 90, 205, 0.2);
  clip-path: polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%);
  padding-left: 14px;
  padding-right: 14px;
}

.timer-button,
.delete-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(15, 15, 30, 0.7);
  border: 1px solid rgba(106, 90, 205, 0.3);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

.timer-button {
  color: #a990ff;
}

.timer-button:hover {
  background: rgba(106, 90, 205, 0.25);
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(106, 90, 205, 0.5);
}

.delete-button {
  color: #ff9370;
  border-color: rgba(255, 69, 0, 0.3);
}

.delete-button:hover {
  background: rgba(255, 69, 0, 0.15);
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(255, 69, 0, 0.4);
}

@media (max-width: 768px) {
  .quest-list {
    margin: 16px 0;
    padding: 20px 16px;
    border-radius: 6px;
  }

  .quest-header h3 {
    font-size: 1.2rem;
    letter-spacing: 1px;
  }

  .habit-item {
    margin-bottom: 12px;
    padding: 14px 12px;
  }

  .habit-checkbox {
    width: 26px;
    height: 26px;
  }

  .habit-name {
    font-size: 0.95rem;
  }

  .habit-right {
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .quest-list {
    padding: 16px 12px;
    margin: 12px 0;
  }

  .quest-header h3 {
    font-size: 1.1rem;
    padding: 0 20px;
  }

  .habit-left {
    gap: 12px;
  }

  .habit-item {
    padding: 12px 10px;
  }

  .habit-checkbox {
    width: 24px;
    height: 24px;
  }

  .habit-name {
    font-size: 0.9rem;
  }

  .streak-badge, .time-badge {
    font-size: 0.75rem;
    padding: 3px 8px;
  }

  .timer-button,
  .delete-button {
    width: 28px;
    height: 28px;
  }
}

@media (prefers-contrast: high) {
  .quest-list {
    border: 2px solid #6a5acd;
    background: #101020;
  }

  .habit-item {
    border: 2px solid #6a5acd;
    background: #151525;
  }
}

@media (prefers-reduced-motion: reduce) {
  .habit-item:hover {
    transform: none;
  }

  .habit-checkbox:hover {
    transform: none;
  }

  .rune-symbol.left::before,
  .rune-symbol.right::before {
    animation: none;
  }
}
</style>
