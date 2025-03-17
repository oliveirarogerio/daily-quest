<script setup lang="ts">
import { ref, onMounted } from 'vue';

const show = ref(false);

const startAnimation = () => {
  show.value = true;
  setTimeout(() => {
    show.value = false;
  }, 3000);
};

defineExpose({
  startAnimation
});
</script>

<template>
  <div class="level-up-animation" v-if="show">
    <img src="../assets/level-up-effect.svg" alt="Level Up" />
  </div>
</template>

<style scoped>
.level-up-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  background-color: rgba(10, 10, 20, 0.7);
  animation: fadeInOut 3s ease-in-out;
}

.level-up-animation img {
  width: 300px;
  height: 300px;
  animation: pulse 1s infinite alternate;
}

@keyframes fadeInOut {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes pulse {
  from { transform: scale(0.95); }
  to { transform: scale(1.05); }
}

@media (max-width: 768px) {
  .level-up-animation img {
    width: 200px;
    height: 200px;
  }
}
</style>
