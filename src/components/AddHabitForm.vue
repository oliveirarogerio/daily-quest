<script setup lang="ts">
import { useHabits } from '../composables/useHabits';
import { useI18n } from '../composables/useI18n';

const { newHabitName, addHabit } = useHabits();
const { t } = useI18n();

const handleAddHabit = () => {
  if (newHabitName.value.trim()) {
    addHabit(newHabitName.value.trim());
  }
};
</script>

<template>
  <div class="add-habit">
    <input
      type="text"
      v-model="newHabitName"
      :placeholder="t('quests.addPlaceholder')"
      @keyup.enter="handleAddHabit"
    />
    <button @click="handleAddHabit">
      <span class="button-text">{{ t('quests.addButton') }}</span>
    </button>
  </div>
</template>

<style scoped>
.add-habit {
  display: flex;
  margin-top: 15px;
  position: relative;
  z-index: 1;
}

.add-habit input {
  flex: 1;
  padding: 10px 12px;
  border: none;
  border-radius: 8px 0 0 8px;
  background-color: #2a2a3a;
  color: white;
  outline: none;
  border: 1px solid rgba(106, 90, 205, 0.3);
  border-right: none;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.add-habit input:focus {
  box-shadow: 0 0 0 2px rgba(106, 90, 205, 0.3);
}

.add-habit button {
  padding: 10px 15px;
  background: linear-gradient(90deg, #6a5acd, #9370db);
  border: none;
  border-radius: 0 8px 8px 0;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  font-size: 0.95rem;
}

.add-habit button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent);
  transition: all 0.5s ease;
}

.add-habit button:hover {
  background: linear-gradient(90deg, #5a4abf, #8360cb);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.add-habit button:hover::before {
  left: 100%;
}

.button-text {
  position: relative;
  z-index: 1;
}

@media (max-height: 600px) {
  .add-habit {
    margin-top: 10px;
  }
}
</style>
