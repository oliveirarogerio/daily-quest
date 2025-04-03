<script setup lang="ts">
defineProps<{
  show: boolean;
  message: string;
}>();
</script>

<template>
  <div class="notification" v-if="show">
    <img src="../assets/notification-icon.svg" alt="Notification" class="notification-icon" />
    <div class="notification-message">{{ message }}</div>
  </div>
</template>

<style scoped>
.notification {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(26, 26, 42, 0.98), rgba(26, 26, 42, 0.95));
  border: 1px solid rgba(106, 90, 205, 0.5);
  border-radius: 12px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 30px rgba(106, 90, 205, 0.2);
  z-index: 1000;
  animation: slideUpFade 0.3s ease-out;
  backdrop-filter: blur(10px);
  max-width: 90%;
  width: auto;
  margin: 0 20px;
}

.notification-icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  animation: pulseIcon 2s infinite;
  filter: drop-shadow(0 0 5px rgba(106, 90, 205, 0.5));
}

.notification-message {
  color: #ffffff;
  font-weight: 500;
  font-size: 0.95rem;
  line-height: 1.4;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  flex: 1;
  word-break: break-word;
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes pulseIcon {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Mobile optimization */
@media (max-width: 768px) {
  .notification {
    bottom: max(20px, env(safe-area-inset-bottom));
    padding: 14px 20px;
    border-radius: 16px;
  }

  .notification-message {
    font-size: 0.9rem;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .notification {
    background: #1a1a2a;
    border: 2px solid #6a5acd;
  }

  .notification-message {
    color: #ffffff;
    text-shadow: none;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .notification {
    animation: none;
  }

  .notification-icon {
    animation: none;
  }
}
</style>
