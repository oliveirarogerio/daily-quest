<script setup lang="ts">
/**
 * Notification.vue
 *
 * Toast notification system for user feedback.
 * Displays temporary notifications with different status types (success, error, info, warning).
 * Features animated appearance/dismissal and Solo Leveling-inspired styling.
 */

/**
 * Component Props
 * @property {boolean} show - Controls notification visibility
 * @property {string} message - The notification message text to display
 * @property {string} type - Optional notification type: 'success', 'error', 'info', or 'warning'
 */
defineProps<{
  show: boolean;
  message: string;
  type?: string;
}>();
</script>

<template>
  <div class="notification-container" v-if="show">
    <div class="notification" :class="type">
      <span class="icon">
        <template v-if="type === 'success'">✓</template>
        <template v-else-if="type === 'error'">✕</template>
        <template v-else-if="type === 'warning'">⚠</template>
        <template v-else>ℹ</template>
      </span>
      <div class="content">{{ message }}</div>
    </div>
  </div>
</template>

<style scoped>
.notification-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  padding-top: max(16px, env(safe-area-inset-top, 16px));
}

.notification {
  margin: 8px;
  max-width: 90%;
  width: 400px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(20, 20, 40, 0.95), rgba(10, 10, 25, 0.98));
  color: rgba(255, 255, 255, 0.9);
  border-left: 3px solid;
  backdrop-filter: blur(10px);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.5),
    0 0 15px rgba(106, 90, 205, 0.3);
  display: flex;
  align-items: center;
  pointer-events: auto;
  animation: slideIn 0.3s ease forwards;
  position: relative;
  font-weight: 500;
  overflow: hidden;
  /* Solo Leveling style geometric shape */
  clip-path: polygon(
    0% 0%,
    98% 0%,
    100% 10%,
    100% 100%,
    2% 100%,
    0% 90%
  );
}

/* Solo Leveling style energy line */
.notification::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(159, 255, 253, 0.7), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.notification.success {
  border-color: #4caf50;
}

.notification.success::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at left center, rgba(76, 175, 80, 0.2), transparent 70%);
  z-index: -1;
}

.notification.error {
  border-color: #f44336;
}

.notification.error::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at left center, rgba(244, 67, 54, 0.2), transparent 70%);
  z-index: -1;
}

.notification.info {
  border-color: #a4ffff;
}

.notification.info::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at left center, rgba(159, 255, 253, 0.2), transparent 70%);
  z-index: -1;
}

.notification.warning {
  border-color: #ff9800;
}

.notification.warning::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at left center, rgba(255, 152, 0, 0.2), transparent 70%);
  z-index: -1;
}

.icon {
  margin-right: 12px;
  font-size: 1.2rem;
  /* Solo Leveling style glow effect */
  filter: drop-shadow(0 0 3px currentColor);
}

.notification.success .icon {
  color: #4caf50;
  animation: iconPulse 2s infinite;
}

.notification.error .icon {
  color: #f44336;
  animation: iconPulse 2s infinite;
}

.notification.info .icon {
  color: #a4ffff;
  animation: iconPulse 2s infinite;
}

.notification.warning .icon {
  color: #ff9800;
  animation: iconPulse 2s infinite;
}

@keyframes iconPulse {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

.content {
  flex: 1;
  font-size: 0.95rem;
  letter-spacing: 0.3px;
}

.close-button {
  margin-left: 8px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  padding: 0;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

/* Solo Leveling style close button */
.close-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(159, 255, 253, 0.1);
  opacity: 0;
  transition: opacity 0.2s ease;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  transform: scale(0.9);
}

.close-button:hover::before,
.close-button:focus::before {
  opacity: 1;
}

.close-button:hover,
.close-button:focus {
  color: rgba(255, 255, 255, 0.9);
  outline: none;
}

.notification.exiting {
  animation: slideOut 0.3s ease forwards;
}

@keyframes slideIn {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .notification {
    width: 85%;
    padding: 10px 14px;
    margin: 6px;
  }

  .icon {
    margin-right: 10px;
    font-size: 1.1rem;
  }

  .content {
    font-size: 0.9rem;
  }
}

/* High contrast and reduced motion */
@media (prefers-contrast: high) {
  .notification {
    background: #101020;
    border-width: 2px;
    box-shadow: 0 0 0 1px white;
  }

  .notification.success { border-color: #4caf50; background-color: #0a200a; }
  .notification.error { border-color: #f44336; background-color: #200a0a; }
  .notification.info { border-color: #a4ffff; background-color: #0a2020; }
  .notification.warning { border-color: #ff9800; background-color: #201a0a; }
}

@media (prefers-reduced-motion: reduce) {
  .notification {
    animation: none;
  }

  .notification.exiting {
    animation: none;
    opacity: 0;
  }

  .notification::after {
    animation: none;
  }

  .icon {
    animation: none !important;
  }
}
</style>

