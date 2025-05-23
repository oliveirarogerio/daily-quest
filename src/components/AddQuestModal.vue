<script setup lang="ts">
/**
 * AddQuestModal.vue
 *
 * Modal for adding new habits/quests.
 * Provides a form interface for creating new habits with validation
 * and swipe-to-dismiss functionality.
 */
import { ref } from 'vue';
import { useI18n } from '../composables/useI18n';

/**
 * Component Events
 * @event close - When modal is closed
 * @event add - When a new habit is submitted, provides the habit name
 * @event touchStart - Touch event for swipe gesture handling
 * @event touchMove - Touch event for swipe gesture handling
 * @event touchEnd - Touch event for swipe gesture handling
 */
const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'add', name: string): void;
  (event: 'touchStart', evt: TouchEvent): void;
  (event: 'touchMove', evt: TouchEvent): void;
  (event: 'touchEnd', evt: TouchEvent): void;
}>();

/**
 * Component Props
 * @property {number} swipeOffset - Current swipe offset for dismiss gesture
 */
const props = defineProps<{
  swipeOffset: number;
}>();

const { t } = useI18n();
const questName = ref('');

/**
 * Handles form submission when adding a new quest/habit.
 * Validates that the quest name is not empty before emitting
 * the add event, then resets the form.
 */
const handleSubmit = () => {
  if (questName.value.trim()) {
    emit('add', questName.value.trim());
    questName.value = '';
  }
};
</script>

<template>
  <div class="add-quest-modal">
    <div class="modal-content"
         :style="{ transform: `translateY(${swipeOffset}px)` }"
         @touchstart="emit('touchStart', $event)"
         @touchmove="emit('touchMove', $event)"
         @touchend="emit('touchEnd', $event)">
      <div class="modal-header">
        <h3>{{ t('quests.addTitle') }}</h3>
        <button class="close-button" @click="emit('close')">×</button>
      </div>

      <form @submit.prevent="handleSubmit" class="add-quest-form">
        <div class="input-group">
          <input
            type="text"
            v-model="questName"
            :placeholder="t('quests.addPlaceholder')"
            class="quest-input"
            autofocus
          />
        </div>

        <button type="submit" class="add-button" :disabled="!questName.trim()">
          {{ t('quests.addButton') }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.add-quest-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 20, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.modal-content {
  background: linear-gradient(135deg, rgba(28, 28, 45, 0.95), rgba(20, 20, 35, 0.95));
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(106, 90, 205, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-header h3 {
  margin: 0;
  color: #fff;
  font-size: 1.4rem;
  text-shadow: 0 0 10px rgba(106, 90, 205, 0.5);
  font-weight: 500;
}

.close-button {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.add-quest-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  position: relative;
}

.quest-input {
  width: 100%;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(106, 90, 205, 0.3);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.quest-input:focus {
  outline: none;
  border-color: #6a5acd;
  box-shadow: 0 0 0 2px rgba(106, 90, 205, 0.2);
}

.quest-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.add-button {
  padding: 12px;
  background: linear-gradient(135deg, #6a5acd, #9370db);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(106, 90, 205, 0.3);
}

@media (max-width: 768px) {
  .modal-content {
    width: 90%;
    max-height: 80%;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    padding: 20px;
  }

  .modal-header h3 {
    font-size: 1.3rem;
  }

  .add-quest-form {
    flex: 1;
    justify-content: center;
  }

  .quest-input,
  .add-button {
    padding: 14px;
  }
}

@media (max-width: 480px) {
  .modal-content {
    width: 95%;
    padding: 16px;
  }

  .modal-header h3 {
    font-size: 1.2rem;
  }

  .quest-input,
  .add-button {
    padding: 12px;
    font-size: 0.95rem;
  }

  .close-button {
    width: 28px;
    height: 28px;
    font-size: 20px;
  }
}
</style>
