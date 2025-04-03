<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '../composables/useI18n';

const { t } = useI18n();
const emit = defineEmits(['add-habit', 'show-timer', 'show-stats']);


const handleAddClick = () => {
  emit('add-habit');
};

const handleTimerClick = () => {
  emit('show-timer');
};

const handleStatsClick = () => {
  emit('show-stats');
};
</script>

<template>
  <nav class="bottom-nav">
    <div class="nav-content">
      <button class="nav-item" @click="handleStatsClick">
        <span class="nav-icon">📊</span>
        <span class="nav-label">{{ t('nav.stats') }}</span>
      </button>

      <button class="add-button" @click="handleAddClick">
        <span class="add-icon">+</span>
      </button>

      <button class="nav-item" @click="handleTimerClick">
        <span class="nav-icon">⏱️</span>
        <span class="nav-label">{{ t('nav.timer') }}</span>
      </button>
    </div>

    <div class="safe-area-spacer"></div>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(20, 20, 35, 0.95), rgba(10, 10, 20, 0.98));
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(106, 90, 205, 0.3);
  padding: 12px 0;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  z-index: 100;
  box-shadow:
    0 -8px 24px rgba(0, 0, 0, 0.4),
    0 -4px 8px rgba(106, 90, 205, 0.1);
}

.bottom-nav::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(106, 90, 205, 0.5), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.nav-content {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 16px;
  position: relative;
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
  border-radius: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  min-width: 64px;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(106, 90, 205, 0.2), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 12px;
  z-index: -1;
}

.nav-item:hover::before {
  opacity: 1;
}

.nav-item.active {
  color: #6a5acd;
  text-shadow: 0 0 10px rgba(106, 90, 205, 0.5);
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #6a5acd, transparent);
  border-radius: 2px;
  animation: glow 2s infinite;
}

@keyframes glow {
  0%, 100% { opacity: 0.5; box-shadow: 0 0 5px rgba(106, 90, 205, 0.3); }
  50% { opacity: 1; box-shadow: 0 0 10px rgba(106, 90, 205, 0.5); }
}

.nav-icon {
  font-size: 1.4rem;
  margin-bottom: 2px;
  transition: transform 0.3s ease;
}

.nav-item:hover .nav-icon {
  transform: translateY(-2px);
}

.nav-text {
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.add-button {
  position: relative;
  background: linear-gradient(135deg, #6a5acd, #9370db);
  border: none;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.8rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(106, 90, 205, 0.3);
  margin-top: -40px;
  z-index: 2;
}

.add-button::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, #6a5acd, #9370db);
  border-radius: 50%;
  z-index: -1;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.add-button:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow:
    0 8px 25px rgba(0, 0, 0, 0.4),
    0 0 30px rgba(106, 90, 205, 0.4);
}

.add-button:hover::before {
  opacity: 0.8;
  transform: scale(1.1);
}

.add-button:active {
  transform: translateY(1px) scale(0.95);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .bottom-nav {
    padding: 8px 0;
    padding-bottom: max(8px, env(safe-area-inset-bottom));
  }

  .nav-item {
    padding: 6px 12px;
    min-width: 56px;
  }

  .nav-icon {
    font-size: 1.3rem;
  }

  .nav-text {
    font-size: 0.75rem;
  }

  .add-button {
    width: 48px;
    height: 48px;
    margin-top: -32px;
    font-size: 1.6rem;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .bottom-nav {
    background: #1a1a2a;
    border-top: 2px solid #6a5acd;
  }

  .nav-item.active {
    color: #fff;
    background: #6a5acd;
  }

  .add-button {
    background: #6a5acd;
    border: 2px solid #fff;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .bottom-nav::before {
    animation: none;
  }

  .nav-item.active::after {
    animation: none;
  }

  .nav-item:hover .nav-icon {
    transform: none;
  }

  .add-button:hover {
    transform: none;
  }
}

.safe-area-spacer {
  height: env(safe-area-inset-bottom);
  background: rgba(26, 26, 42, 0.98);
}
</style>
