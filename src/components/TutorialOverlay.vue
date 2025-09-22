<template>
  <div v-if="showTutorialOverlay" class="tutorial-overlay">
    <!-- Highlighted element overlay -->
    <div
      v-if="currentStep?.action"
      class="highlight-overlay"
      :class="getHighlightClass()"
      :style="getHighlightStyle()"
    >
      <!-- Arrow pointing to element -->
      <div v-if="currentStep?.showArrow" class="tutorial-arrow" :class="getArrowClass()">
        <div class="arrow-content">👆</div>
      </div>
    </div>

    <!-- Robby3D with speech bubble -->
    <div class="tutorial-robby" :class="getRobbyPosition()">
      <Robby3D
        :variant="currentStep?.variant || 'encouraging'"
        :animated="true"
        size="md"
        color-scheme="vibrant"
      />
    </div>

    <!-- Tutorial controls -->
    <div class="tutorial-controls">
      <div class="tutorial-message">
        <div class="message-bubble">
          {{ currentStep?.message }}
        </div>
      </div>

      <div class="tutorial-actions">
        <button v-if="hasPreviousStep" @click="previousStep" class="tutorial-btn secondary">
          ← Anterior
        </button>

        <button @click="nextStep" class="tutorial-btn primary">
          {{ hasNextStep ? 'Próximo →' : 'Finalizar' }}
        </button>

        <button @click="skipTutorial" class="tutorial-btn skip">Pular</button>
      </div>

      <!-- Progress indicator -->
      <div class="tutorial-progress">
        <div class="progress-dots">
          <div
            v-for="(step, index) in currentTutorial?.steps"
            :key="step.id"
            class="progress-dot"
            :class="{ active: index === currentStepIndex }"
          ></div>
        </div>
        <span class="progress-text">
          {{ currentStepIndex + 1 }} de
          {{ currentTutorial?.steps.length }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTutorial } from '../composables/useTutorial'
import Robby3D from './Robby3D.vue'

const {
  currentTutorial,
  currentStep,
  currentStepIndex,
  showTutorialOverlay,
  hasNextStep,
  hasPreviousStep,
  nextStep,
  previousStep,
  skipTutorial,
} = useTutorial()


const getRobbyPosition = () => {
  const position = currentStep.value?.position || 'bottom'
  return `robby-${position}`
}

const getHighlightClass = () => {
  const action = currentStep.value?.action
  if (!action) return ''

  return `highlight-${action}`
}

const getHighlightStyle = () => {
  // This would be dynamically calculated based on the element being highlighted
  // For now, return empty object
  return {}
}

const getArrowClass = () => {
  const position = currentStep.value?.position || 'bottom'
  return `arrow-${position}`
}
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none;
}

.highlight-overlay {
  position: absolute;
  background: rgba(106, 90, 205, 0.2);
  border: 2px solid #6a5acd;
  border-radius: 8px;
  pointer-events: none;
  animation: highlight-pulse 2s infinite;
}

@keyframes highlight-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(106, 90, 205, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(106, 90, 205, 0);
  }
}

.tutorial-arrow {
  position: absolute;
  z-index: 10000;
  pointer-events: none;
}

.arrow-content {
  font-size: 2rem;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.arrow-top {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
}

.arrow-bottom {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
}

.arrow-left {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
}

.arrow-right {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
}

.tutorial-robby {
  position: absolute;
  z-index: 10001;
  pointer-events: none;
}

.robby-top {
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.robby-bottom {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.robby-left {
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.robby-right {
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.tutorial-controls {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  z-index: 10002;
  pointer-events: auto;
}

.tutorial-message {
  margin-bottom: 20px;
}

.message-bubble {
  background: linear-gradient(135deg, #6a5acd, #9370db);
  color: white;
  padding: 16px 20px;
  border-radius: 20px;
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
  box-shadow: 0 8px 32px rgba(106, 90, 205, 0.3);
  animation: message-float 3s ease-in-out infinite;
}

@keyframes message-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.tutorial-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  justify-content: center;
}

.tutorial-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.tutorial-btn.primary {
  background: linear-gradient(135deg, #6a5acd, #9370db);
  color: white;
}

.tutorial-btn.primary:hover {
  background: linear-gradient(135deg, #7b6dd4, #a387e0);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(106, 90, 205, 0.4);
}

.tutorial-btn.secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.tutorial-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.tutorial-btn.skip {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.3);
}

.tutorial-btn.skip:hover {
  background: rgba(255, 107, 107, 0.3);
}

.tutorial-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.progress-dots {
  display: flex;
  gap: 8px;
}

.progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.progress-dot.active {
  background: #6a5acd;
  transform: scale(1.2);
}

.progress-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 500;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .tutorial-controls {
    bottom: 10px;
    left: 10px;
    right: 10px;
  }

  .message-bubble {
    font-size: 1rem;
    padding: 14px 18px;
  }

  .tutorial-btn {
    padding: 10px 16px;
    font-size: 0.9rem;
  }

  .tutorial-actions {
    flex-wrap: wrap;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .tutorial-actions {
    flex-direction: column;
  }

  .tutorial-btn {
    width: 100%;
  }
}
</style>
