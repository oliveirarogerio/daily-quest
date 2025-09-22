<script setup lang="ts">
/**
 * QuestList.vue
 *
 * Displays and manages the list of user habits/quests.
 * This component shows the list of habits, enables completion toggling,
 * and provides swipe gestures for completing or removing habits.
 */
import { ref } from 'vue'
import type { Habit } from '../types/habit'

defineProps<{
  habits: Habit[]
}>()

/**
 * Component Events
 * @event toggle - When a habit's completion status is toggled
 * @event remove - When a habit is removed
 * @event timer - When the timer is requested for a habit
 */
const emit = defineEmits<{
  (e: 'toggle', habit: Habit, mouseEvent?: MouseEvent): void
  (e: 'remove', habitId: string): void
  (e: 'timer', habit: Habit): void
}>()

// Touch gesture state
const touchStart = ref({ x: 0, y: 0 })
const swipeItem = ref<Habit | null>(null)
const swipeThreshold = 50

/**
 * Handles toggling habit completion status.
 * Passes the event to the parent component through the toggle event.
 *
 * @param {Habit} habit - The habit to toggle
 * @param {Event} e - Optional DOM event that triggered the toggle
 */
const handleToggle = (habit: Habit, e?: Event) => {
  const mouseEvent = e instanceof MouseEvent ? e : undefined
  emit('toggle', habit, mouseEvent)
}

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
    y: event.touches[0].clientY,
  }
  swipeItem.value = habit
}

/**
 * Handles touch movement for swipe actions.
 * Determines swipe direction and updates UI accordingly.
 * Cancels swipe if vertical movement is greater than horizontal.
 *
 * @param {TouchEvent} event - The touch move event
 */
const handleTouchMove = (event: TouchEvent) => {
  if (!swipeItem.value) return

  const xDiff = event.touches[0].clientX - touchStart.value.x
  const yDiff = event.touches[0].clientY - touchStart.value.y

  // If vertical scroll is more prominent, cancel swipe
  if (Math.abs(yDiff) > Math.abs(xDiff)) {
    swipeItem.value = null
    return
  }

  // Prevent scrolling while swiping
  event.preventDefault()

  const element = event.currentTarget as HTMLElement
  element.style.transform = `translateX(${xDiff}px)`
  element.style.transition = 'none'
}

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
  if (!swipeItem.value) return

  const element = event.currentTarget as HTMLElement
  element.style.transition = 'transform 0.3s ease'

  const xDiff = event.changedTouches[0].clientX - touchStart.value.x

  // Reset position
  element.style.transform = 'translateX(0)'

  // Check if swipe distance meets threshold
  if (Math.abs(xDiff) >= swipeThreshold) {
    if (xDiff > 0) {
      // Swipe right - toggle habit
      handleToggle(swipeItem.value)
      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    } else {
      // Swipe left - delete habit
      emit('remove', swipeItem.value.id)
      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate([50, 50])
      }
    }
  }

  swipeItem.value = null
}
</script>

<template>
  <div class="min-h-screen p-4">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-2xl font-light text-slate-700 mb-2">Missões Diárias</h1>
      </div>

      <!-- Task List -->
      <div class="space-y-3">
        <div
          v-for="habit in habits"
          :key="habit.id"
          class="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:scale-[1.02] transition-all duration-300 ease-out"
          @touchstart="(e) => handleTouchStart(e, habit)"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <div class="flex items-center justify-between">
            <!-- Task Content -->
            <div class="flex items-center space-x-4 flex-1">
              <!-- Custom Checkbox -->
              <div class="relative">
                <input
                  type="checkbox"
                  :checked="habit.completed"
                  @change="(e) => handleToggle(habit, e)"
                  class="sr-only"
                />
                <div
                  :class="[
                    'w-6 h-6 rounded-full border-2 transition-all duration-300 ease-out cursor-pointer flex items-center justify-center',
                    habit.completed
                      ? 'bg-emerald-400 border-emerald-400 shadow-sm'
                      : 'border-slate-300 hover:border-emerald-300 hover:bg-emerald-50',
                  ]"
                  @click="(e) => handleToggle(habit, e)"
                >
                  <svg
                    v-if="habit.completed"
                    class="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <!-- Task Name -->
              <div class="flex-1">
                <span
                  :class="[
                    'text-slate-700 font-medium transition-all duration-300',
                    habit.completed ? 'line-through text-slate-400' : '',
                  ]"
                >
                  {{ habit.name }}
                </span>

                <!-- Time Spent Badge -->
                <div
                  v-if="habit.timeSpent"
                  class="mt-1 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                >
                  <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  {{ habit.timeSpent }}h
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div
              class="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <!-- Timer Button -->
              <button
                @click="emit('timer', habit)"
                class="p-2 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 transition-colors duration-200"
                title="Start Timer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>

              <!-- Delete Button -->
              <button
                @click="emit('remove', habit.id)"
                class="p-2 rounded-full bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 transition-colors duration-200"
                title="Remove Task"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="habits.length === 0" class="text-center py-12">
          <div
            class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center"
          >
            <svg
              class="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-slate-600 mb-2">Nenhuma missão encontrada</h3>
          <p class="text-slate-500 text-sm">Adicione sua primeira missão para começar</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Minimal custom styles - most styling handled by Tailwind */
</style>
