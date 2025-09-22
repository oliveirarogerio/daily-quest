<script setup lang="ts">
/**
 * BottomNavigation.vue
 *
 * App navigation bar with primary action buttons.
 * Provides navigation and quick access to main app features with
 * modern, animated navigation elements, active state indication,
 * and haptic feedback for interactions.
 */
import { computed, ref } from 'vue'

/**
 * Component Events
 * @event add-habit - When add button is clicked
 * @event show-home - When home button is clicked
 * @event show-missions - When missions button is clicked
 * @event show-settings - When settings button is clicked
 * @event show-login - When login button is clicked
 */
const emit = defineEmits(['add-habit', 'show-home', 'show-missions', 'show-settings', 'show-login'])

// Track which tab is currently active
const activeTab = ref('')

/**
 * Triggers haptic feedback if the device supports it.
 * Provides light touch feedback for better mobile UX.
 */
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10) // Light touch feedback
  }
}

/**
 * Handles click on the add habit button.
 * Triggers haptic feedback and emits add-habit event.
 */
const handleAddClick = () => {
  triggerHaptic()
  emit('add-habit')
}

/**
 * Handles click on the home button.
 * Sets home as active tab, triggers haptic feedback,
 * and emits show-home event.
 */
const handleHomeClick = () => {
  triggerHaptic()
  activeTab.value = 'home'
  emit('show-home')
}

/**
 * Handles click on the missions button.
 * Sets missions as active tab, triggers haptic feedback,
 * and emits show-missions event.
 */
const handleMissionsClick = () => {
  triggerHaptic()
  activeTab.value = 'missions'
  emit('show-missions')
}

/**
 * Handles click on the settings button.
 * Sets settings as active tab, triggers haptic feedback,
 * and emits show-settings event.
 */
const handleSettingsClick = () => {
  triggerHaptic()
  activeTab.value = 'settings'
  emit('show-settings')
}

/**
 * Handles click on the login button.
 * Sets login as active tab, triggers haptic feedback,
 * and emits show-login event.
 */
const handleLoginClick = () => {
  triggerHaptic()
  activeTab.value = 'profile'
  emit('show-login')
}

/**
 * Computed function to determine if a tab is active.
 * @param {string} tab - The tab name to check
 * @returns {boolean} - Whether the tab is active
 */
const isActive = computed(() => (tab: string) => activeTab.value === tab)
</script>

<template>
  <nav class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
    <div
      class="bg-white/90 backdrop-blur-md rounded-2xl px-6 py-4 shadow-xl border border-slate-100"
    >
      <div class="flex items-center space-x-6">
        <button
          class="p-3 rounded-xl transition-all duration-300 ease-out"
          :class="{
            'bg-blue-100 text-blue-600 shadow-sm': isActive('home'),
            'text-slate-500 hover:text-slate-700 hover:bg-slate-50': !isActive('home'),
          }"
          @click="handleHomeClick"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </button>

        <button
          class="p-3 rounded-xl transition-all duration-300 ease-out"
          :class="{
            'bg-green-100 text-green-600 shadow-sm': isActive('missions'),
            'text-slate-500 hover:text-slate-700 hover:bg-slate-50': !isActive('missions'),
          }"
          @click="handleMissionsClick"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        </button>

        <button
          class="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          @click="handleAddClick"
        >
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>

        <button
          class="p-3 rounded-xl transition-all duration-300 ease-out"
          :class="{
            'bg-purple-100 text-purple-600 shadow-sm': isActive('settings'),
            'text-slate-500 hover:text-slate-700 hover:bg-slate-50': !isActive('settings'),
          }"
          @click="handleSettingsClick"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        <button
          class="p-3 rounded-xl transition-all duration-300 ease-out"
          :class="{
            'bg-orange-100 text-orange-600 shadow-sm': isActive('profile'),
            'text-slate-500 hover:text-slate-700 hover:bg-slate-50': !isActive('profile'),
          }"
          @click="handleLoginClick"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Minimal custom styles - most styling handled by Tailwind */
</style>
