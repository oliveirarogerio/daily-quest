<script setup lang="ts">
import HabitTracker from './components/HabitTracker.vue'
</script>

<template>
  <div class="app-container">
    <div class="background-pattern"></div>
    <div class="content">
      <header>
        <h1>DAILY QUEST</h1>
        <p class="subtitle">Level up your life, one quest at a time</p>
      </header>

      <main>
        <HabitTracker />
      </main>


    </div>
  </div>
</template>

<style>
@import './assets/base.css';

html, body, #app {
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

header::before, header::after {
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

footer {
  text-align: center;
  padding: 1rem 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.footer-line {
  height: 1px;
  width: 50px;
  background: linear-gradient(90deg, transparent, #6a5acd, transparent);
  margin: 0 10px;
}

footer p {
  font-size: 0.9rem;
  color: #9370db;
  opacity: 0.6;
  letter-spacing: 1px;
  margin: 0;
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
</style>
