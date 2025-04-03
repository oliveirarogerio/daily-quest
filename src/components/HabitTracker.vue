<script setup lang="ts">
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
import type { Habit } from '../types/habit';

const { habits, addHabit, removeHabit, toggleHabitCompletion, refreshHabits } = useHabits();
const { startTimer, pauseTimer} = useTimer();
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
const selectedHabit = ref<Habit | null>(null);



const pullOffset = ref(0);
const refreshThreshold = 100;
const isRefreshing = ref(false);
let touchStartY = 0;

// Touch event handlers
const handleTouchStart = (event: TouchEvent) => {
  touchStartY = event.touches[0].clientY;
};

const handleTouchMove = (event: TouchEvent) => {
  const touchY = event.touches[0].clientY;
  const diff = touchY - touchStartY;

  if (diff > 0 && window.scrollY === 0) {
    pullOffset.value = Math.min(diff * 0.5, refreshThreshold);
    event.preventDefault();
  }
};

const handleTouchEnd = async () => {
  if (pullOffset.value >= refreshThreshold) {
    isRefreshing.value = true;
    await refreshHabits();
    isRefreshing.value = false;
  }
  pullOffset.value = 0;
};

// Modal touch handlers
const modalSwipeOffset = ref(0);
let modalTouchStartY = 0;

const handleModalTouchStart = (event: TouchEvent) => {
  modalTouchStartY = event.touches[0].clientY;
};

const handleModalTouchMove = (event: TouchEvent) => {
  const touchY = event.touches[0].clientY;
  const diff = touchY - modalTouchStartY;

  if (diff > 0) {
    modalSwipeOffset.value = diff;
    event.preventDefault();
  }
};

const handleModalTouchEnd = () => {
  if (modalSwipeOffset.value > 100) {
    closeModals();
  }
  modalSwipeOffset.value = 0;
};

// Modal handlers
const openTimerModal = (habit: Habit) => {
  selectedHabit.value = habit;
  showTimerModal.value = true;
};

const openAddModal = () => {
  showAddModal.value = true;
};

const closeModals = () => {
  showTimerModal.value = false;
  showAddModal.value = false;
  selectedHabit.value = null;
  pauseTimer();
};

const handleAddHabit = (name: string) => {
  addHabit(name);
  closeModals();
};

// Enhanced XP handling with animations
const handleToggleHabit = async (habit: Habit) => {
  if (!habit) return;


  try {
    // Make sure player state is loaded before toggling habits
    await loadPlayerState();

    // Toggle habit completion state
    const xpChange = await toggleHabitCompletion(habit);

    // Handle XP change
    if (xpChange > 0) {

      // Trigger animation first
      triggerXPAnimation(xpChange, 'habit', x, y, habit.difficulty);

      // Need to add a small delay to ensure the animation is properly triggered before the XP is added
      await new Promise(resolve => setTimeout(resolve, 100));






      // Force multiple UI update events to ensure reactivity across components


      // Try another update after a bit more time for good measure
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('xp-updated-complete', {
          detail: { timestamp: Date.now() }
        }));
      }, 200);

      // Show success notification
      displayNotification(`+${xpChange} XP for completing ${habit.name}!`);
    } else if (xpChange < 0) {

      // For uncompleting, trigger the animation first for better feedback
      triggerXPAnimation(Math.abs(xpChange), 'habit', x, y, habit.difficulty);

      // Small delay for animation
      await new Promise(resolve => setTimeout(resolve, 100));

      // Handle uncompleting a habit
      const result = await removeXP(Math.abs(xpChange), `Uncompleted: ${habit.name}`);

      // Force multiple UI update events to ensure reactivity across components
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('xp-updated', {
          detail: { forceUpdate: true, timestamp: Date.now() }
        }));
      }, 50);

      // Try another update after a bit more time for good measure
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('xp-updated-complete', {
          detail: { timestamp: Date.now() }
        }));
      }, 200);

      // Show notification
      displayNotification(`-${Math.abs(xpChange)} XP from uncompleting ${habit.name}`);
    } else {
    }
  } catch (error) {
    console.error('❌ [HabitTracker] Error toggling habit:', error);
    displayNotification('Error updating habit. Please try again.');
  }
};

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
      :is-running="isRunning"
      :mode="mode"
      :formatted-time="formattedTime"
      :custom-minutes="customMinutes"
      :swipe-offset="modalSwipeOffset"
      @close="closeModals"
      @start="startTimer"
      @pause="pauseTimer"
      @stop="pauseTimer"
      @set-mode="setMode"
      @set-custom-time="setCustomTime"
      @touch-start="handleModalTouchStart"
      @touch-move="handleModalTouchMove"
      @touch-end="handleModalTouchEnd"
    />

    <!-- Add Quest Modal -->
    <AddQuestModal
      v-if="showAddModal"
      :swipe-offset="modalSwipeOffset"
      @close="closeModals"
      @add="handleAddHabit"
      @touch-start="handleModalTouchStart"
      @touch-move="handleModalTouchMove"
      @touch-end="handleModalTouchEnd"
    />


    <!-- Add Button -->
    <button class="add-button" @click="openAddModal">
      <span class="add-icon">+</span>
    </button>

    <BottomNavigation />

  </div>
</template>

<style scoped>
.habit-tracker {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
  min-height: 100vh;
  overflow-x: hidden;
}

.add-button {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6a5acd, #9370db);
  border: none;
  color: #fff;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow:
    0 4px 12px rgba(106, 90, 205, 0.3),
    0 0 0 1px rgba(106, 90, 205, 0.2);
  transition: all 0.3s ease;
  z-index: 100;
}

.add-button:hover {
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

@media (max-width: 768px) {
  .habit-tracker {
    padding: 12px;
  }

  .add-button {
    bottom: 72px;
  }
}
</style>
