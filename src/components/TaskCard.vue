<template>
  <div
    class="bg-surface-light shadow-sm rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-300"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <input
          type="checkbox"
          :checked="task.completed"
          @change="$emit('complete', task.id)"
          class="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
        />
        <span
          :class="[
            'text-text-main font-medium',
            task.completed ? 'line-through text-text-secondary' : '',
          ]"
        >
          {{ task.name }}
        </span>
      </div>

      <div class="flex items-center space-x-2">
        <span v-if="task.points" class="text-sm text-text-secondary"> {{ task.points }} pts </span>
        <BaseButton
          v-if="!task.completed"
          variant="primary"
          size="sm"
          @click="$emit('complete', task.id)"
        >
          Completar
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseButton from './BaseButton.vue'

interface Task {
  id: string
  name: string
  completed: boolean
  points?: number
}

interface Props {
  task: Task
}

defineProps<Props>()

defineEmits<{
  complete: [taskId: string]
}>()
</script>
