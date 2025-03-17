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
  top: 20px;
  right: 20px;
  background-color: rgba(26, 26, 42, 0.95);
  border: 1px solid #6a5acd;
  border-radius: 8px;
  padding: 10px 15px;
  display: flex;
  align-items: center;
  box-shadow: 0 0 15px rgba(106, 90, 205, 0.5);
  z-index: 1000;
  animation: slideIn 0.3s ease-out, fadeOut 0.5s ease-in 2.5s;
}

.notification-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}

.notification-message {
  color: #ffffff;
  font-weight: bold;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@media (max-width: 768px) {
  .notification {
    width: 80%;
    left: 10%;
    right: 10%;
    top: 10px;
  }
}
</style>
