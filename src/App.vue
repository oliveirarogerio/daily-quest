<script setup lang="ts">
import HabitTracker from './components/HabitTracker.vue'
import BackgroundAnimation from './components/BackgroundAnimation.vue'
import Notification from './components/Notification.vue'
import LevelUpAnimation from './components/LevelUpAnimation.vue'
import { usePlayer } from './composables/usePlayer'
import { useNotification } from './composables/useNotification'
import { useI18n } from './composables/useI18n'

const { showLevelUpAnimation } = usePlayer()
const { state: notificationState } = useNotification()
const { t } = useI18n()
</script>

<template>
  <div class="app-container">
    <div class="background-pattern"></div>

    <div class="content">
      <div class="header rpg-window">
        <div class="rpg-window-header">
          <h1>{{ t('app.title') }}</h1>
        </div>
        <p class="subtitle">{{ t('app.subtitle') }}</p>
      </div>

      <BackgroundAnimation />

      <div class="main-content">
        <div class="habit-tracker-container">
          <HabitTracker />
        </div>
      </div>
    </div>

    <Notification :show="notificationState.show" :message="notificationState.message" :type="notificationState.type" />
    <LevelUpAnimation :show="showLevelUpAnimation" />
  </div>
</template>

<style>
body {
  background-color: #0a0a14;
}

.app-container {
  font-family: 'Roboto', sans-serif;
  justify-content: center;
  align-items: center;
  display: flex;
  flex-direction: column;
  color: #e0e0ff;
  position: relative;
  overflow-x: hidden;
  width: 100%;
  min-height: 100vh;
}

.background-pattern {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.content {
  z-index: 1;
  justify-content: center;
  align-items: center;
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  width: 100%;
  max-width: 100%;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
}

.rpg-window {
  background: rgba(10, 10, 30, 0.7);
  border: 1px solid rgba(106, 90, 205, 0.3);
  border-radius: 5px;
  box-shadow:
    0 0 10px rgba(106, 90, 205, 0.3),
    inset 0 0 15px rgba(0, 0, 0, 0.5);
  padding: 16px;
  position: relative;
  overflow: visible;
  backdrop-filter: blur(5px);
}

.rpg-window::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #6a5acd, transparent);
}

.rpg-window-header {
  position: relative;
}

h1 {
  font-size: 2rem;
  font-weight: 800;
  color: #fff;
  text-shadow:
    0 0 10px rgba(106, 90, 205, 0.8),
    0 0 20px rgba(106, 90, 205, 0.4);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0;
}

h1::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #6a5acd, transparent);
}

.subtitle {
  font-size: 0.9rem;
  color: #9f9fff;
  margin-top: 16px;
  opacity: 0.8;
  font-style: italic;
}

.main-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.habit-tracker-container {
  width: 100%;
  position: relative;
  display: flex;
  justify-content: center;
}

::selection {
  background-color: rgba(106, 90, 205, 0.3);
  color: #ffffff;
}


@media screen and (max-width: 768px) {
  .content {
    margin-top: 60px;
  }
}

@media (min-width: 768px) {
  .content {
    margin-top: 80px;
  }

  h1 {
    font-size: 2.6rem;
  }

  .subtitle {
    font-size: 1.1rem;
  }

  .rpg-window {
    padding: 24px;
  }

  .header {
    max-width: 700px;
  }
}

@media (min-width: 1200px) {
  .header {
    max-width: 800px;
  }

  .content {
    margin-top: 80px;
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 0.8;
  }

  50% {
    opacity: 1;
  }
}

@keyframes glow {

  0%,
  100% {
    filter: drop-shadow(0 0 5px rgba(106, 90, 205, 0.5));
  }

  50% {
    filter: drop-shadow(0 0 15px rgba(106, 90, 205, 0.8));
  }
}
</style>
