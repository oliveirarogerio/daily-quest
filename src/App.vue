<script setup lang="ts">
import HabitTracker from './components/HabitTracker.vue'
import Auth from './components/Auth.vue'


</script>

<template>
  <div class="app-container">
    <div class="background-pattern"></div>
    <div class="content">
      <div class="header">
        <h1>DAILY QUEST</h1>
        <p class="subtitle">Level up your life, one quest at a time</p>
      </div>

      <div class="main-content">
        <div class="habit-tracker-container">
          <HabitTracker />
        </div>

        <div class="auth-section">
          <Auth />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import './assets/base.css';

html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  font-family: 'Arial', sans-serif;
}

body {
  display: flex;
  justify-content: center;
  align-items: center;
}

.header {
  margin-top: 100px;
  margin-bottom: 25px;
}

#app {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.app-container {
  position: relative;
  width: 500px;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 0;
  margin: 0;
}

.background-pattern {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('./assets/background-pattern.svg') repeat;
  background-color: #0a0a14;
  opacity: 0.8;
  z-index: -1;
}

.content {
  position: relative;
  z-index: 1;
  max-width: 1280px;
  width: 100%;
  margin: 0;
  padding: 0 1rem;
  font-weight: normal;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .content {
    padding-top: 100px;
    padding-bottom: 100px;
    margin-top: 100px;
    margin-bottom: 100px;
  }
}

header {
  width: 100%;
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

header::before,
header::after {
  content: '';
  position: absolute;
  width: 100px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #6a5acd, transparent);
  left: 50%;
  transform: translateX(-50%);
}

header::before {
  top: 0;
}

header::after {
  bottom: -10px;
}

h1 {
  font-size: 2.5rem;
  color: #6a5acd;
  margin-bottom: 0.5rem;
  margin-left: auto;
  margin-right: auto;
  text-shadow: 0 0 10px rgba(106, 90, 205, 0.6);
  letter-spacing: 4px;
  font-weight: bold;
  position: relative;
  display: inline-block;
  text-align: center;
}

h1::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #6a5acd, transparent);
}

.subtitle {
  font-size: 1.2rem;
  color: #9370db;
  opacity: 0.8;
  margin-top: 15px;
  letter-spacing: 1px;
  text-align: center;
  width: 100%;
}

main {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
  align-self: center;
}

/* Force centering for all children of main */
main > * {
  margin-left: auto !important;
  margin-right: auto !important;
  max-width: 100% !important;
  align-self: center !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Glowing cursor effect */
::selection {
  background-color: rgba(106, 90, 205, 0.3);
  color: #ffffff;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: #1a1a2a;
}

::-webkit-scrollbar-thumb {
  background: #6a5acd;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9370db;
}

.main-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.auth-section {
  width: 100%;
  max-width: 300px;
}

.auth-prompt {
  color: #9370db;
  font-size: 1rem;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.auth-button {
  background: #6a5acd;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.auth-button:hover {
  background: #9370db;
}

.loading {
  color: #6a5acd;
  font-size: 1.2rem;
  text-align: center;
  padding: 2rem;
  background: rgba(106, 90, 205, 0.1);
  border-radius: 8px;
  margin: 1rem 0;
  animation: pulse 1.5s infinite;
}

.error {
  color: #ff6b6b;
  font-size: 1rem;
  text-align: center;
  padding: 1rem;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  margin: 1rem 0;
}

.habit-tracker-container {
  width: 100%;
}



.debug-info {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  color: #6a5acd;
  padding: 0.5rem;
  font-size: 0.8rem;
  text-align: center;
  z-index: 1000;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}

@media (max-width: 768px) {
  .content {
    padding: 1rem;
  }

  h1 {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .main-content {
    gap: 1rem;
  }

  .auth-section {
    margin-top: 1rem;
    padding-top: 1rem;
  }
}
</style>
