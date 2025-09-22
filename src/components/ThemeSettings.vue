<template>
  <div class="bg-surface-light rounded-lg p-6 shadow-sm border border-gray-200">
    <Heading size="md" class="mb-4">Configurações</Heading>

    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-text-main font-medium">Tema</h3>
          <p class="text-sm text-text-secondary">Escolha entre tema claro ou escuro</p>
        </div>
        <div class="flex space-x-2">
          <BaseButton
            :variant="isCalmTheme ? 'primary' : 'secondary'"
            size="sm"
            @click="setTheme('calm')"
          >
            Claro
          </BaseButton>
          <BaseButton
            :variant="isDarkTheme ? 'primary' : 'secondary'"
            size="sm"
            @click="setTheme('dark')"
          >
            Escuro
          </BaseButton>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-text-main font-medium">Animações</h3>
          <p class="text-sm text-text-secondary">Desativar animações para melhor foco</p>
        </div>
        <BaseButton
          :variant="disableAnimations ? 'danger' : 'success'"
          size="sm"
          @click="toggleAnimations"
        >
          {{ disableAnimations ? 'Desativadas' : 'Ativadas' }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useTheme } from '../composables/useTheme'
import BaseButton from './BaseButton.vue'
import Heading from './Heading.vue'

const { isCalmTheme, isDarkTheme, disableAnimations, setTheme, toggleAnimations, initializeTheme } =
  useTheme()

onMounted(() => {
  initializeTheme()
})
</script>
