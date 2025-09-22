<script setup lang="ts">
import { onMounted } from 'vue'
import HabitTracker from './components/HabitTracker.vue'
import Heading from './components/Heading.vue'
import LevelUpAnimation from './components/LevelUpAnimation.vue'
import Notification from './components/Notification.vue'
import { useNotification } from './composables/useNotification'
import { usePlayer } from './composables/usePlayer'
import { useTheme } from './composables/useTheme'

const { showLevelUpAnimation } = usePlayer()
const { state: notificationState } = useNotification()
const { initializeTheme } = useTheme()

onMounted(() => {
  initializeTheme()
})
</script>

<template>
  <div class="min-h-screen bg-bg-calm theme-calm">
    <div class="container mx-auto px-4 py-4">
      <div class="text-center mb-8">
        <div>
          <img
            src="./assets/home-logo.png"
            alt="Daily Quest"
            class="inline-block w-full md:w-1/2"
          />
        </div>
        <p class="text-text-secondary text-lg">Evolua sua vida, uma missão por vez</p>
      </div>

      <div class="max-w-4xl mx-auto">
        <HabitTracker />
      </div>
    </div>

    <Notification
      :show="notificationState.show"
      :message="notificationState.message"
      :type="notificationState.type"
    />
    <LevelUpAnimation :show="showLevelUpAnimation" />
  </div>
</template>

<style>
/* Minimal custom styles for ADHD-friendly design */
</style>
