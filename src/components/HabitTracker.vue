<script setup lang="ts">
/**
 * HabitTracker.vue
 *
 * Core container component that orchestrates the application's main functionality.
 * Acts as the main application container that coordinates all sub-components and
 * handles the core habit tracking functionality including:
 * - Pull-to-refresh gesture for refreshing habits
 * - Modal management for Timer, AddQuest, and Auth components
 * - XP animation and habit completion handling
 * - Integration with player progression system
 * - Event handling for touch gestures
 */
import { ref, onMounted, reactive } from 'vue';
import { useHabits } from '../composables/useHabits';
import { useTimer } from '../composables/useTimer';
import { usePlayer } from '../composables/usePlayer';
import { useNotification } from '../composables/useNotification';
import GameStatusBar from './GameStatusBar.vue';
import QuestList from './QuestList.vue';
import TimerModal from './TimerModal.vue';
import AddQuestModal from './AddQuestModal.vue';
import PullToRefresh from './PullToRefresh.vue';
import BottomNavigation from './BottomNavigation.vue';
import Auth from './Auth.vue';
import type { Habit } from '../types/habit';

// Import composable methods with destructuring
const { habits, addHabit, removeHabit, toggleHabitCompletion, refreshHabits } = useHabits();
const {
  timerState,
  startTimer,
  pauseTimer,
  formattedTime,
  setTimerMode,
  setTimer,
  resetTimer,
  selectHabit
} = useTimer();
const {
  loadPlayerState,
  addXP,
  removeXP,
  triggerXPAnimation,
  isLoading: playerLoading
} = usePlayer();
const { displayNotification } = useNotification();

// Modal states
const showTimerModal = ref(false);
const showAddModal = ref(false);
const showLoginModal = ref(false);
const selectedHabit = ref<Habit | null>(null);

// Pull-to-refresh state management
const pullOffset = ref(0);
const refreshThreshold = 100;
const isRefreshing = ref(false);
let touchStartY = 0;

/**
 * Handles the start of a touch event for pull-to-refresh functionality.
 * Records the starting Y position of the touch for calculating pull distance.
 *
 * @param {TouchEvent} event - The touch event
 */
const handleTouchStart = (event: TouchEvent) => {
  touchStartY = event.touches[0].clientY;
};

/**
 * Handles touch movement for pull-to-refresh functionality.
 * Calculates the pull distance and updates the pull offset state
 * which drives the visual pull indicator.
 *
 * @param {TouchEvent} event - The touch move event
 */
const handleTouchMove = (event: TouchEvent) => {
  const touchY = event.touches[0].clientY;
  const diff = touchY - touchStartY;

  if (diff > 0 && window.scrollY === 0) {
    pullOffset.value = Math.min(diff * 0.5, refreshThreshold);
    event.preventDefault();
  }
};

/**
 * Handles the end of a touch event for pull-to-refresh.
 * Triggers habit refresh if pull distance exceeds threshold,
 * then resets the pull offset.
 */
const handleTouchEnd = async () => {
  if (pullOffset.value >= refreshThreshold) {
    isRefreshing.value = true;
    await refreshHabits();
    isRefreshing.value = false;
  }
  pullOffset.value = 0;
};

// Modal touch gesture management
const modalSwipeOffset = ref(0);
let modalTouchStartY = 0;

/**
 * Handles touch start events on modals for swipe-to-dismiss gesture.
 * Records starting Y position of the touch.
 *
 * @param {TouchEvent} event - The touch start event
 */
const handleModalTouchStart = (event: TouchEvent) => {
  modalTouchStartY = event.touches[0].clientY;
};

/**
 * Handles touch move events on modals for swipe-to-dismiss gesture.
 * Updates the modal's position based on swipe distance.
 *
 * @param {TouchEvent} event - The touch move event
 */
const handleModalTouchMove = (event: TouchEvent) => {
  const touchY = event.touches[0].clientY;
  const diff = touchY - modalTouchStartY;

  if (diff > 0) {
    modalSwipeOffset.value = diff;
    event.preventDefault();
  }
};

/**
 * Handles touch end events on modals for swipe-to-dismiss gesture.
 * Closes the modal if swipe distance exceeds threshold.
 */
const handleModalTouchEnd = () => {
  if (modalSwipeOffset.value > 100) {
    closeModals();
  }
  modalSwipeOffset.value = 0;
};

/**
 * Opens the timer modal for a specific habit.
 * Sets the selected habit and shows the modal.
 *
 * @param {Habit} habit - The habit to associate with the timer
 */
const openTimerModal = (habit: Habit) => {
  selectedHabit.value = habit;
  selectHabit(habit);
  showTimerModal.value = true;
};

/**
 * Opens the modal for adding a new quest/habit.
 */
const openAddModal = () => {
  showAddModal.value = true;
};

/**
 * Opens the login/authentication modal.
 */
const openLoginModal = () => {
  showLoginModal.value = true;
};

/**
 * Closes all modals and resets related state.
 * Pauses any active timer and clears selected habit.
 */
const closeModals = () => {
  showTimerModal.value = false;
  showAddModal.value = false;
  showLoginModal.value = false;
  selectedHabit.value = null;
  pauseTimer();
  selectHabit(null);
};

/**
 * Handles the addition of a new habit from the AddQuestModal.
 * Adds the habit and closes the modal.
 *
 * @param {string} name - The name of the new habit to add
 */
const handleAddHabit = (name: string) => {
  addHabit(name);
  closeModals();
};

/**
 * Handles toggling the completion state of a habit.
 *
 * This function manages the complex flow of toggling a habit's completion state:
 * 1. Loads player state to ensure XP operations can be performed
 * 2. Toggles the habit completion state through the useHabits composable
 * 3. Handles different XP change scenarios (positive for completing, negative for uncompleting)
 * 4. Manages the coordination between animation and actual XP addition/removal
 * 5. Properly extracts event coordinates regardless of event type (mouse or touch)
 * 6. Forces UI updates across components using custom events
 *
 * The sequence timing is critical:
 * - First trigger the animation at the click/touch location
 * - Wait a small delay (100ms) to ensure animation is visible
 * - Then add/remove the XP which updates the state
 * - Force UI updates to ensure all components reflect the new state
 * - Display a notification with feedback about the XP change
 *
 * The function also includes robust error handling for both mouse and touch events.
 *
 * @param {Habit} habit - The habit to toggle
 * @param {MouseEvent|TouchEvent} event - The event that triggered the toggle (for animation positioning)
 */
const handleToggleHabit = async (habit: Habit, event?: MouseEvent | TouchEvent) => {
  if (!habit) return;

  try {
    // Make sure player state is loaded before toggling habits
    await loadPlayerState();

    // Toggle habit completion state
    const xpChange = await toggleHabitCompletion(habit);

    // Handle XP change
    if (xpChange > 0) {
      // Get event coordinates for animation
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;

      // Extract coordinates based on event type
      if (event) {
        if (event instanceof MouseEvent) {
          x = event.clientX;
          y = event.clientY;
        } else if (event instanceof TouchEvent && event.touches.length > 0) {
          x = event.touches[0].clientX;
          y = event.touches[0].clientY;
        }
      }

      // Trigger animation first
      triggerXPAnimation(xpChange, 'habit', x, y);

      // Add XP after a small delay to ensure animation is visible
      await new Promise(resolve => setTimeout(resolve, 100));
      await addXP(xpChange, 'habit', habit.streak);

      // Force UI updates
      window.dispatchEvent(new CustomEvent('xp-updated', {
        detail: { forceUpdate: true, timestamp: Date.now() }
      }));

      // Show success notification
      displayNotification(`+${xpChange} XP for completing ${habit.name}!`);
    } else if (xpChange < 0) {
      // For uncompleting, trigger the animation first for better feedback
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;

      // Extract coordinates based on event type
      if (event) {
        if (event instanceof MouseEvent) {
          x = event.clientX;
          y = event.clientY;
        } else if (event instanceof TouchEvent && event.touches.length > 0) {
          x = event.touches[0].clientX;
          y = event.touches[0].clientY;
        }
      }

      triggerXPAnimation(Math.abs(xpChange), 'habit', x, y);

      // Small delay for animation
      await new Promise(resolve => setTimeout(resolve, 100));

      // Handle uncompleting a habit
      await removeXP(Math.abs(xpChange), `Uncompleted: ${habit.name}`);

      // Force multiple UI update events to ensure reactivity across components
      window.dispatchEvent(new CustomEvent('xp-updated', {
        detail: { forceUpdate: true, timestamp: Date.now() }
      }));

      // Try another update after a bit more time for good measure
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('xp-updated-complete', {
          detail: { timestamp: Date.now() }
        }));
      }, 200);

      // Show notification
      displayNotification(`-${Math.abs(xpChange)} XP from uncompleting ${habit.name}`);
    }
  } catch (error) {
    console.error('❌ [HabitTracker] Error toggling habit:', error);
    displayNotification('Error updating habit. Please try again.');
  }
};

// Bottom navigation event handlers

/**
 * Handles the add habit button click from the BottomNavigation.
 * Opens the add quest modal.
 */
const handleAddHabitFromNav = () => {
  openAddModal();
};

/**
 * Handles the show timer button click from the BottomNavigation.
 * If habits exist, opens the timer modal with the first habit.
 * Otherwise, shows a notification.
 */
const handleShowTimer = () => {
  // If there are habits, select the first one for the timer
  if (habits.value.length > 0) {
    openTimerModal(habits.value[0]);
  } else {
    displayNotification('Create a habit first to use the timer');
  }
};

/**
 * Handles the show stats button click from the BottomNavigation.
 * Currently shows a placeholder notification.
 */
const handleShowStats = () => {
  displayNotification('Stats feature coming soon!');
};

/**
 * Handles the show login button click from the BottomNavigation.
 * Opens the login modal.
 */
const handleShowLogin = () => {
  openLoginModal();
};

/**
 * Component initialization on mount.
 * Loads player state and refreshes habits.
 */
onMounted(async () => {
  try {
    await loadPlayerState();
    await refreshHabits();
  } catch (error) {
    console.error('❌ [HabitTracker] Error during initialization:', error);
    displayNotification('Error loading data. Please refresh the page.');
  }
});
</script>

<template>
  <div class="habit-tracker"
       @touchstart="handleTouchStart"
       @touchmove="handleTouchMove"
       @touchend="handleTouchEnd">

    <PullToRefresh
      :is-refreshing="isRefreshing"
      :pull-offset="pullOffset"
      :threshold="refreshThreshold"
    />

    <GameStatusBar />

    <QuestList
      :habits="habits"
      @toggle="handleToggleHabit"
      @remove="removeHabit"
      @timer="openTimerModal"
    />

    <TimerModal
      v-if="showTimerModal && selectedHabit"
      :habit="selectedHabit"
      :is-running="timerState.isRunning"
      :mode="timerState.mode"
      :formatted-time="formattedTime"
      :custom-minutes="timerState.customMinutes"
      :swipe-offset="modalSwipeOffset"
      @close="closeModals"
      @start="startTimer"
      @pause="pauseTimer"
      @stop="resetTimer"
      @set-mode="setTimerMode"
      @set-custom-time="setTimer"
      @touch-start="handleModalTouchStart"
      @touch-move="handleModalTouchMove"
      @touch-end="handleModalTouchEnd"
    />

    <AddQuestModal
      v-if="showAddModal"
      :swipe-offset="modalSwipeOffset"
      @close="closeModals"
      @add="handleAddHabit"
      @touch-start="handleModalTouchStart"
      @touch-move="handleModalTouchMove"
      @touch-end="handleModalTouchEnd"
    />

    <div v-if="showLoginModal" class="auth-modal">
      <Auth />
      <button class="close-auth-btn" @click="closeModals">×</button>
    </div>

    <BottomNavigation
      @add-habit="handleAddHabitFromNav"
      @show-timer="handleShowTimer"
      @show-stats="handleShowStats"
      @show-login="handleShowLogin"
    />

  </div>
</template>

<style scoped>
.habit-tracker {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  padding: 10px 8px;
  min-height: 100vh;
  overflow-x: hidden;
  font-family: 'Roboto', sans-serif;
  touch-action: manipulation;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0));
}

.add-button {
  position: fixed;
  bottom: 80px;
  right: 16px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6a5acd, #9370db);
  border: none;
  color: #fff;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow:
    0 4px 12px rgba(106, 90, 205, 0.3),
    0 0 0 1px rgba(106, 90, 205, 0.2);
  transition: all 0.3s ease;
  z-index: 100;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.add-button:hover,
.add-button:active {
  transform: translateY(-2px);
  box-shadow:
    0 6px 16px rgba(106, 90, 205, 0.4),
    0 0 0 1px rgba(106, 90, 205, 0.3);
}

.add-button:active {
  transform: translateY(0);
}

.add-icon {
  line-height: 1;
}

.habit-tracker > *:not(:first-child):not(.auth-modal) {
  margin-bottom: 14px;
}

.auth-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 20, 0.95);
  backdrop-filter: blur(10px);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
  padding-top: max(16px, env(safe-area-inset-top, 0));
  padding-bottom: max(16px, env(safe-area-inset-bottom, 0));
}

.close-auth-btn {
  position: absolute;
  top: max(16px, env(safe-area-inset-top, 10px));
  right: 16px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 24px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2001;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.close-auth-btn:hover,
.close-auth-btn:active {
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
}

@media (min-width: 768px) {
  .habit-tracker {
    padding: 16px;
    padding-bottom: 100px;
    width: 90%;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .habit-tracker > * {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .add-button {
    bottom: 80px;
    right: 20px;
    width: 56px;
    height: 56px;
    font-size: 24px;
  }

  .auth-modal {
    padding: 20px;
  }

  .close-auth-btn {
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
  }

  .habit-tracker > *:not(:first-child):not(.auth-modal) {
    margin-bottom: 20px;
  }
}

@media (min-width: 1200px) {
  .habit-tracker {
    max-width: 700px;
  }
}

/* Apply Roboto font to all elements */
:root {
  font-family: 'Roboto', 'Courier New', monospace;
}
</style>
