<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import type { Difficulty } from '../types/habit';

const props = defineProps<{
  show: boolean;
  amount: number;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  difficulty?: Difficulty;
}>();

console.log('🔍 [XPAnimation] Animation props received:', props);

// Calculate animation properties
const color = computed(() => {
  if (!props.difficulty) return '#6a5acd'; // Default purple

  return {
    'easy': '#4caf50',    // Green
    'normal': '#6a5acd',  // Purple
    'hard': '#ff9800',    // Orange
    'epic': '#f44336'     // Red
  }[props.difficulty] || '#6a5acd';
});

const animationClass = computed(() => {
  return {
    'epic': props.difficulty === 'epic',
    'hard': props.difficulty === 'hard',
    'easy': props.difficulty === 'easy',
    'normal': props.difficulty === 'normal' || !props.difficulty
  };
});

// Generate multiple particles for more visual appeal
const particles = ref<{id: number, delay: number, x: number, y: number}[]>([]);

// Create particles function for reuse
const createParticles = (sourceX: number, sourceY: number) => {
  console.log('🔍 [XPAnimation] Creating particles at position:', { x: sourceX, y: sourceY });
  return Array.from({ length: 6 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.5,
    x: sourceX + (Math.random() * 40 - 20),
    y: sourceY + (Math.random() * 40 - 20)
  }));
};

// Create multiple particles with different characteristics
onMounted(() => {
  particles.value = createParticles(props.sourceX, props.sourceY);
});

// Watch for show property changes
watch(() => props.show, (newValue) => {
  console.log('🔍 [XPAnimation] Show property changed:', newValue);
  if (newValue) {
    particles.value = createParticles(props.sourceX, props.sourceY);
  }
});

// Reposition particles when source changes
watch(() => [props.sourceX, props.sourceY], ([newX, newY]) => {
  console.log('🔍 [XPAnimation] Source position changed:', { x: newX, y: newY });
  particles.value = createParticles(newX, newY);
});

// Watch for amount changes
watch(() => props.amount, (newAmount) => {
  console.log('🔍 [XPAnimation] Amount changed:', newAmount);
  // Refresh particles to ensure animation restarts
  if (props.show) {
    particles.value = createParticles(props.sourceX, props.sourceY);
  }
});
</script>

<template>
  <div v-if="show" class="xp-animation-container">
    <!-- Multiple floating XP numbers -->
    <div
      v-for="particle in particles"
      :key="particle.id"
      class="xp-particle"
      :class="animationClass"
      :style="{
        left: `${particle.x}px`,
        top: `${particle.y}px`,
        animationDelay: `${particle.delay}s`,
        color: color
      }"
    >
      +{{ amount }}
    </div>

    <!-- Optional glow effect at source -->
    <div
      class="xp-source-glow"
      :class="animationClass"
      :style="{
        left: `${sourceX}px`,
        top: `${sourceY}px`,
        background: `radial-gradient(circle, ${color}80 0%, transparent 70%)`
      }"
    ></div>

    <!-- Optional target highlight -->
    <div
      class="xp-target-highlight"
      :style="{
        left: `${targetX - 50}px`,
        top: `${targetY - 5}px`,
        borderColor: color
      }"
    ></div>
  </div>
</template>

<style scoped>
.xp-animation-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
  overflow: hidden;
}

.xp-particle {
  position: absolute;
  font-weight: bold;
  font-size: 1.5rem;
  z-index: 1001;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  animation: floatUpAndFade 1.5s forwards;
  white-space: nowrap;
}

.xp-particle.epic {
  font-size: 2rem;
  text-shadow:
    0 0 5px rgba(0, 0, 0, 0.5),
    0 0 10px currentColor;
  animation: epicFloat 2s forwards;
}

.xp-particle.hard {
  font-size: 1.8rem;
  text-shadow: 0 0 7px rgba(0, 0, 0, 0.5);
  animation: hardFloat 1.8s forwards;
}

.xp-particle.easy {
  font-size: 1.3rem;
  animation: easyFloat 1.3s forwards;
}

.xp-source-glow {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: fadeOut 1s forwards;
}

.xp-source-glow.epic {
  width: 120px;
  height: 120px;
  animation: epicGlow 1.5s forwards;
}

.xp-target-highlight {
  position: absolute;
  width: 100px;
  height: 10px;
  border-radius: 5px;
  border: 2px solid;
  transform: translate(0, 0);
  opacity: 0;
  animation: targetPulse 1s 0.5s forwards;
}

/* Animation keyframes */
@keyframes floatUpAndFade {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
  }
  10% {
    transform: translate(-50%, -60%) scale(1.2);
    opacity: 1;
  }
  80% {
    transform: translate(-50%, -120px) scale(0.9);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -150px) scale(0.7);
    opacity: 0;
  }
}

@keyframes epicFloat {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
  10% {
    transform: translate(-50%, -60%) scale(1.5);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -100px) scale(1.2) rotate(5deg);
    opacity: 0.9;
  }
  100% {
    transform: translate(-50%, -200px) scale(0.8) rotate(-5deg);
    opacity: 0;
  }
}

@keyframes hardFloat {
  0% {
    transform: translate(-50%, -50%) scale(0.9);
    opacity: 0;
  }
  10% {
    transform: translate(-50%, -60%) scale(1.3);
    opacity: 1;
  }
  90% {
    transform: translate(-50%, -140px) scale(1) rotate(3deg);
    opacity: 0.7;
  }
  100% {
    transform: translate(-50%, -160px) scale(0.8) rotate(-3deg);
    opacity: 0;
  }
}

@keyframes easyFloat {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
  }
  10% {
    transform: translate(-50%, -60%) scale(1);
    opacity: 0.9;
  }
  100% {
    transform: translate(-50%, -120px) scale(0.7);
    opacity: 0;
  }
}

@keyframes fadeOut {
  0% { opacity: 0.7; transform: translate(-50%, -50%) scale(0.8); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
}

@keyframes epicGlow {
  0% { opacity: 0.9; transform: translate(-50%, -50%) scale(0.8); }
  50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.2); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
}

@keyframes targetPulse {
  0% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 0.7; transform: scale(1.1); }
  100% { opacity: 0; transform: scale(1.3); }
}
</style>
