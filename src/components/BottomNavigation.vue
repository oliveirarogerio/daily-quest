<script setup lang="ts">
/**
 * BottomNavigation.vue
 *
 * App navigation bar with primary action buttons.
 * Provides navigation and quick access to main app features with
 * modern, animated navigation elements, active state indication,
 * and haptic feedback for interactions.
 */
import { ref, computed } from 'vue';
import { useI18n } from '../composables/useI18n';

const { t } = useI18n();

/**
 * Component Events
 * @event add-habit - When add button is clicked
 * @event show-timer - When timer button is clicked
 * @event show-stats - When stats button is clicked
 * @event show-login - When login button is clicked
 */
const emit = defineEmits(['add-habit', 'show-timer', 'show-stats', 'show-login']);

// Track which tab is currently active
const activeTab = ref('');

/**
 * Triggers haptic feedback if the device supports it.
 * Provides light touch feedback for better mobile UX.
 */
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10); // Light touch feedback
  }
};

/**
 * Handles click on the add habit button.
 * Triggers haptic feedback and emits add-habit event.
 */
const handleAddClick = () => {
  triggerHaptic();
  emit('add-habit');
};

/**
 * Handles click on the timer button.
 * Sets timer as active tab, triggers haptic feedback,
 * and emits show-timer event.
 */
const handleTimerClick = () => {
  triggerHaptic();
  activeTab.value = 'timer';
  emit('show-timer');
};

/**
 * Handles click on the stats button.
 * Sets stats as active tab, triggers haptic feedback,
 * and emits show-stats event.
 */
const handleStatsClick = () => {
  triggerHaptic();
  activeTab.value = 'stats';
  emit('show-stats');
};

/**
 * Handles click on the login button.
 * Sets login as active tab, triggers haptic feedback,
 * and emits show-login event.
 */
const handleLoginClick = () => {
  triggerHaptic();
  activeTab.value = 'login';
  emit('show-login');
};

/**
 * Computed function to determine if a tab is active.
 * @param {string} tab - The tab name to check
 * @returns {boolean} - Whether the tab is active
 */
const isActive = computed(() => (tab: string) => activeTab.value === tab);
</script>

<template>
  <nav class="bottom-nav">
    <div class="nav-content">
      <button
        class="nav-item"
        :class="{ 'active': isActive('login') }"
        @click="handleLoginClick"
      >
        <div class="nav-icon-container">
          <span class="nav-icon">👤</span>
          <div class="pixel-dot-border"></div>
        </div>
        <span class="nav-label">{{ t('nav.login') || 'Login' }}</span>
      </button>

      <button class="add-button" @click="handleAddClick">
        <div class="pixel-border"></div>
        <span class="add-icon">+</span>
        <div class="button-glow"></div>
      </button>

      <button
        class="nav-item"
        :class="{ 'active': isActive('timer') }"
        @click="handleTimerClick"
      >
        <div class="nav-icon-container">
          <span class="nav-icon">⏱️</span>
          <div class="pixel-dot-border"></div>
        </div>
        <span class="nav-label">{{ t('nav.timer') }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(180deg, rgba(10, 10, 25, 0.95), rgba(5, 5, 15, 0.98));
  height: auto;
}

.bottom-nav::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(106, 90, 205, 0.7), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

.nav-content {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 8px;
  position: relative;
  height: 100%;
}

.nav-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  min-width: 60px;
  min-height: 48px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(106, 90, 205, 0.15), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 0;
  z-index: -1;
}

.nav-item:hover::before,
.nav-item:active::before {
  opacity: 1;
}

.nav-item.active {
  color: #a4ffff;
  text-shadow: 0 0 10px rgba(159, 255, 253, 0.7);
  transform: scale(1.05);
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #a4ffff, transparent);
  border-radius: 0;
  animation: glow 2s infinite;
}

.nav-icon-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
}

.pixel-dot-border {
  position: absolute;
  top: -6px;
  left: -6px;
  right: -6px;
  bottom: -6px;
  border: 1px solid rgba(106, 90, 205, 0.4);
  opacity: 0;
  transition: opacity 0.3s ease;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

.nav-item:hover .pixel-dot-border,
.nav-item.active .pixel-dot-border,
.nav-item:active .pixel-dot-border {
  opacity: 1;
}

.nav-item.active .pixel-dot-border {
  border-color: rgba(159, 255, 253, 0.6);
  animation: borderPulse 2s infinite;
}

@keyframes borderPulse {
  0%, 100% { border-color: rgba(159, 255, 253, 0.3); box-shadow: 0 0 5px rgba(159, 255, 253, 0.1); }
  50% { border-color: rgba(159, 255, 253, 0.7); box-shadow: 0 0 15px rgba(159, 255, 253, 0.3); }
}

@keyframes glow {
  0%, 100% { opacity: 0.5; box-shadow: 0 0 5px rgba(159, 255, 253, 0.3); }
  50% { opacity: 1; box-shadow: 0 0 10px rgba(159, 255, 253, 0.7); }
}

.nav-icon {
  font-size: 1.3rem;
  margin-bottom: 2px;
  transition: transform 0.3s ease, filter 0.3s ease;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 0 2px rgba(106, 90, 205, 0.2));
}

.nav-item:hover .nav-icon,
.nav-item:active .nav-icon {
  transform: translateY(-2px);
  filter: drop-shadow(0 0 8px rgba(106, 90, 205, 0.5));
}

.nav-item.active .nav-icon {
  filter: drop-shadow(0 0 5px rgba(159, 255, 253, 0.5));
}

.nav-label {
  font-family: 'Roboto', 'Courier New', monospace;
  font-size: 0.72rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.add-button {
  position: relative;
  background: linear-gradient(135deg, #231359, #341c8c);
  border: none;
  width: 75px;
  height: 75px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.6rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(106, 90, 205, 0.3);
  margin-top: -26px;
  z-index: 2;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.pixel-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid #9370db;
  clip-path: polygon(50% 5%, 95% 25%, 95% 75%, 50% 95%, 5% 75%, 5% 25%);
  opacity: 0.5;
}

.button-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(147, 112, 219, 0.3), transparent 70%);
  animation: buttonPulse 2s infinite;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

@keyframes buttonPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.95); }
  50% { opacity: 0.6; transform: scale(1); }
}

.add-button:hover,
.add-button:active {
  transform: translateY(-2px);
  box-shadow:
    0 8px 25px rgba(0, 0, 0, 0.5),
    0 0 30px rgba(106, 90, 205, 0.5);
}

.add-button:hover .button-glow,
.add-button:active .button-glow {
  animation: buttonPulseHover 1s infinite;
}

@keyframes buttonPulseHover {
  0%, 100% { opacity: 0.5; transform: scale(0.95); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

.add-button:active {
  transform: translateY(1px) scale(0.95);
}

.add-icon {
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
}

@media (min-width: 768px) {
  .bottom-nav {
    padding: 12px 0;
    padding-bottom: max(12px, env(safe-area-inset-bottom, 0));
  }

  .nav-item {
    padding: 8px 10px;
    gap: 6px;
    min-width: 56px;
  }

  .nav-icon {
    font-size: 1.4rem;
  }

  .nav-item.active::after {
    bottom: -12px;
  }

  .add-button {
    width: 58px;
    height: 58px;
    margin-top: -40px;
    font-size: 1.8rem;
  }
}



</style>
