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
import { onMounted, ref } from 'vue'
import { useHabits } from '../composables/useHabits'
import { useNotification } from '../composables/useNotification'
import { usePlayer } from '../composables/usePlayer'
import { useTimer } from '../composables/useTimer'
import { useTutorial } from '../composables/useTutorial'
import type { Habit } from '../types/habit'
import AddQuestModal from './AddQuestModal.vue'
import Auth from './Auth.vue'
import BottomNavigation from './BottomNavigation.vue'
import GameStatusBar from './GameStatusBar.vue'
import Missions from './Missions.vue'
import PullToRefresh from './PullToRefresh.vue'
import QuestList from './QuestList.vue'
import Robby3D from './Robby3D.vue'
import ThemeSettings from './ThemeSettings.vue'
import TimerModal from './TimerModal.vue'
import TutorialOverlay from './TutorialOverlay.vue'

// Import composable methods with destructuring
const { habits, addHabit, removeHabit, toggleHabitCompletion, refreshHabits } = useHabits()
const {
  timerState,
  startTimer,
  pauseTimer,
  formattedTime,
  setTimerMode,
  setTimer,
  resetTimer,
  selectHabit,
} = useTimer()
const { loadPlayerState, addXP, removeXP, triggerXPAnimation } = usePlayer()
const { displayNotification } = useNotification()
const { startTutorial, isTutorialActive } = useTutorial()

// Modal states
const showTimerModal = ref(false)
const showAddModal = ref(false)
const showLoginModal = ref(false)
const showSettingsModal = ref(false)
const showMissions = ref(false)
const selectedHabit = ref<Habit | null>(null)

// Robby mascot states
const robbyVariant = ref<'default' | 'celebrating' | 'encouraging' | 'sleeping'>('encouraging')
const showCelebration = ref(false)

// Tutorial states
const showTutorialButton = ref(true)

// Pull-to-refresh state management
const pullOffset = ref(0)
const refreshThreshold = 100
const isRefreshing = ref(false)
let touchStartY = 0

/**
 * Handles the start of a touch event for pull-to-refresh functionality.
 * Records the starting Y position of the touch for calculating pull distance.
 *
 * @param {TouchEvent} event - The touch event
 */
const handleTouchStart = (event: TouchEvent) => {
  touchStartY = event.touches[0].clientY
}

/**
 * Handles touch movement for pull-to-refresh functionality.
 * Calculates the pull distance and updates the pull offset state
 * which drives the visual pull indicator.
 *
 * @param {TouchEvent} event - The touch move event
 */
const handleTouchMove = (event: TouchEvent) => {
  const touchY = event.touches[0].clientY
  const diff = touchY - touchStartY

  if (diff > 0 && window.scrollY === 0) {
    pullOffset.value = Math.min(diff * 0.5, refreshThreshold)
    event.preventDefault()
  }
}

/**
 * Handles the end of a touch event for pull-to-refresh.
 * Triggers habit refresh if pull distance exceeds threshold,
 * then resets the pull offset.
 */
const handleTouchEnd = async () => {
  if (pullOffset.value >= refreshThreshold) {
    isRefreshing.value = true
    await refreshHabits()
    isRefreshing.value = false
  }
  pullOffset.value = 0
}

// Modal touch gesture management
const modalSwipeOffset = ref(0)
let modalTouchStartY = 0

/**
 * Handles touch start events on modals for swipe-to-dismiss gesture.
 * Records starting Y position of the touch.
 *
 * @param {TouchEvent} event - The touch start event
 */
const handleModalTouchStart = (event: TouchEvent) => {
  modalTouchStartY = event.touches[0].clientY
}

/**
 * Handles touch move events on modals for swipe-to-dismiss gesture.
 * Updates the modal's position based on swipe distance.
 *
 * @param {TouchEvent} event - The touch move event
 */
const handleModalTouchMove = (event: TouchEvent) => {
  const touchY = event.touches[0].clientY
  const diff = touchY - modalTouchStartY

  if (diff > 0) {
    modalSwipeOffset.value = diff
    event.preventDefault()
  }
}

const handleModalTouchEnd = () => {
  if (modalSwipeOffset.value > 100) {
    closeModals()
  }
  modalSwipeOffset.value = 0
}

/**
 * Opens the timer modal for a specific habit.
 * Sets the selected habit and shows the modal.
 *
 * @param {Habit} habit - The habit to associate with the timer
 */
const openTimerModal = (habit: Habit) => {
  selectedHabit.value = habit
  selectHabit(habit)
  showTimerModal.value = true
}

/**
 * Opens the modal for adding a new quest/habit.
 */
const openAddModal = () => {
  showAddModal.value = true
}

/**
 * Opens the login/authentication modal.
 */
const openLoginModal = () => {
  showLoginModal.value = true
}

/**
 * Opens the settings modal.
 */
const openSettingsModal = () => {
  showSettingsModal.value = true
}

/**
 * Closes all modals and resets related state.
 * Pauses any active timer and clears selected habit.
 */
const closeModals = () => {
  showTimerModal.value = false
  showAddModal.value = false
  showLoginModal.value = false
  showSettingsModal.value = false
  showMissions.value = false
  selectedHabit.value = null
  pauseTimer()
  selectHabit(null)
}

/**
 * Handles the addition of a new habit from the AddQuestModal.
 * Adds the habit and closes the modal.
 *
 * @param {string} name - The name of the new habit to add
 */
const handleAddHabit = (name: string) => {
  addHabit(name)
  closeModals()
}

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
  if (!habit) return

  try {
    // Make sure player state is loaded before toggling habits
    await loadPlayerState()

    // Toggle habit completion state
    const xpChange = await toggleHabitCompletion(habit)

    // Handle XP change
    if (xpChange > 0) {
      // Get event coordinates for animation
      let x = window.innerWidth / 2
      let y = window.innerHeight / 2

      // Extract coordinates based on event type
      if (event) {
        if (event instanceof MouseEvent) {
          x = event.clientX
          y = event.clientY
        } else if (event instanceof TouchEvent && event.touches.length > 0) {
          x = event.touches[0].clientX
          y = event.touches[0].clientY
        }
      }

      // Trigger animation first
      triggerXPAnimation(xpChange, 'habit', x, y)

      // Add XP after a small delay to ensure animation is visible
      await new Promise((resolve) => setTimeout(resolve, 100))
      await addXP(xpChange, 'habit', habit.streak)

      // Force UI updates
      window.dispatchEvent(
        new CustomEvent('xp-updated', {
          detail: { forceUpdate: true, timestamp: Date.now() },
        }),
      )

      // Trigger Robby celebration
      robbyVariant.value = 'celebrating'
      showCelebration.value = true
      setTimeout(() => {
        robbyVariant.value = 'encouraging'
        showCelebration.value = false
      }, 3000)

      // Show success notification
      displayNotification(`+${xpChange} XP for completing ${habit.name}!`)
    } else if (xpChange < 0) {
      // For uncompleting, trigger the animation first for better feedback
      let x = window.innerWidth / 2
      let y = window.innerHeight / 2

      // Extract coordinates based on event type
      if (event) {
        if (event instanceof MouseEvent) {
          x = event.clientX
          y = event.clientY
        } else if (event instanceof TouchEvent && event.touches.length > 0) {
          x = event.touches[0].clientX
          y = event.touches[0].clientY
        }
      }

      triggerXPAnimation(Math.abs(xpChange), 'habit', x, y)

      // Small delay for animation
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Handle uncompleting a habit
      await removeXP(Math.abs(xpChange), `Uncompleted: ${habit.name}`)

      // Force multiple UI update events to ensure reactivity across components
      window.dispatchEvent(
        new CustomEvent('xp-updated', {
          detail: { forceUpdate: true, timestamp: Date.now() },
        }),
      )

      // Try another update after a bit more time for good measure
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('xp-updated-complete', {
            detail: { timestamp: Date.now() },
          }),
        )
      }, 200)

      // Show notification
      displayNotification(`-${Math.abs(xpChange)} XP from uncompleting ${habit.name}`)
    }
  } catch (error) {
    console.error('❌ [HabitTracker] Error toggling habit:', error)
    displayNotification('Erro ao atualizar missão. Tente novamente.')
  }
}

// Tutorial functions
const startWelcomeTutorial = () => {
  startTutorial('welcome')
}

const startAddHabitTutorial = () => {
  startTutorial('add-habit')
}

const startCompleteHabitTutorial = () => {
  startTutorial('complete-habit')
}

const startTimerTutorial = () => {
  startTutorial('timer')
}

const startLevelUpTutorial = () => {
  startTutorial('level-up')
}

const startSettingsTutorial = () => {
  startTutorial('settings')
}

// Bottom navigation event handlers

/**
 * Handles the add habit button click from the BottomNavigation.
 * Opens the add quest modal.
 */
const handleAddHabitFromNav = () => {
  openAddModal()
}

/**
 * Handles the show timer button click from the BottomNavigation.
 * If habits exist, opens the timer modal with the first habit.
 * Otherwise, shows a notification.
 */
const handleShowTimer = () => {
  // If there are habits, select the first one for the timer
  if (habits.value.length > 0) {
    openTimerModal(habits.value[0])
  } else {
    displayNotification('Crie uma missão primeiro para usar o timer')
  }
}

/**
 * Handles the show home button click from the BottomNavigation.
 * Returns to the main habits view.
 */
const handleShowHome = () => {
  showMissions.value = false
}

/**
 * Handles the show missions button click from the BottomNavigation.
 * Shows the Missions component.
 */
const handleShowMissions = () => {
  showMissions.value = true
}

/**
 * Handles the show stats button click from the BottomNavigation.
 * Currently shows a placeholder notification.
 */
const handleShowStats = () => {
  displayNotification('Recursos de estatísticas em breve!')
}

/**
 * Handles the show login button click from the BottomNavigation.
 * Opens the login modal.
 */
const handleShowLogin = () => {
  openLoginModal()
}

/**
 * Handles the show settings button click from the BottomNavigation.
 * Opens the settings modal.
 */
const handleShowSettings = () => {
  openSettingsModal()
}

/**
 * Component initialization on mount.
 * Loads player state and refreshes habits.
 */

onMounted(async () => {
  try {
    await loadPlayerState()
    await refreshHabits()
  } catch (error) {
    console.error('❌ [HabitTracker] Error during initialization:', error)
    displayNotification('Erro ao carregar dados. Atualize a página.')
  }
})
</script>

<template>
  <div
    class="space-y-6"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <PullToRefresh
      :is-refreshing="isRefreshing"
      :pull-offset="pullOffset"
      :threshold="refreshThreshold"
    />

    <GameStatusBar />

    <!-- Robby Mascot fixed at bottom right -->
    <div class="fixed bottom-20 right-4 z-30">
      <Robby3D :variant="robbyVariant" :animated="true" size="md" color-scheme="vibrant" />
    </div>

    <!-- Tutorial Button -->
    <div v-if="showTutorialButton && !isTutorialActive" class="fixed top-4 right-4 z-30">
      <button @click="startWelcomeTutorial" class="tutorial-start-btn" title="Iniciar tutorial">
        🎓 Tutorial
      </button>
    </div>

    <!-- Tutorial Overlay -->
    <TutorialOverlay />

    <QuestList
      v-if="!showMissions"
      :habits="habits"
      @toggle="handleToggleHabit"
      @remove="removeHabit"
      @timer="openTimerModal"
    />

    <Missions v-if="showMissions" />

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

    <div
      v-if="showLoginModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="rounded-lg p-6 max-w-md w-full relative">
        <Auth />
        <button
          class="absolute top-4 right-4 text-text-secondary hover:text-text-main text-2xl font-bold"
          @click="closeModals"
        >
          ×
        </button>
      </div>
    </div>

    <div
      v-if="showSettingsModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-surface-light rounded-lg p-6 max-w-md w-full relative">
        <ThemeSettings />
        <button
          class="absolute top-4 right-4 text-text-secondary hover:text-text-main text-2xl font-bold"
          @click="closeModals"
        >
          ×
        </button>
      </div>
    </div>

    <BottomNavigation
      @add-habit="handleAddHabitFromNav"
      @show-home="handleShowHome"
      @show-missions="handleShowMissions"
      @show-settings="handleShowSettings"
      @show-login="handleShowLogin"
    />
  </div>
</template>

<style scoped>
/* Minimal custom styles - most styling handled by Tailwind */

.tutorial-start-btn {
  background: linear-gradient(135deg, #6a5acd, #9370db);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 12px 20px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(106, 90, 205, 0.3);
  transition: all 0.3s ease;
  font-size: 0.9rem;
  animation: tutorial-pulse 2s infinite;
}

.tutorial-start-btn:hover {
  background: linear-gradient(135deg, #7b6dd4, #a387e0);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(106, 90, 205, 0.4);
}

@keyframes tutorial-pulse {
  0%,
  100% {
    box-shadow: 0 4px 12px rgba(106, 90, 205, 0.3);
  }
  50% {
    box-shadow: 0 4px 12px rgba(106, 90, 205, 0.6);
  }
}

@media (max-width: 768px) {
  .tutorial-start-btn {
    padding: 10px 16px;
    font-size: 0.85rem;
  }
}
</style>
