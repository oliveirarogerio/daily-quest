<script setup lang="ts">
import { computed, ref } from 'vue'

interface Mission {
  id: number
  title: string
  description: string
  reward: string
  completed: boolean
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
}

const missions = ref<Mission[]>([
  {
    id: 1,
    title: 'Chegue ao Nível 2',
    description: 'Alcance o nível 2 para desbloquear novas funcionalidades',
    reward: '+200 XP',
    completed: false,
    difficulty: 'easy',
    category: 'Progressão',
  },
  {
    id: 2,
    title: 'Chegue ao Nível 5',
    description: 'Alcance o nível 5 e desbloqueie recompensas especiais',
    reward: '+500 XP',
    completed: false,
    difficulty: 'medium',
    category: 'Progressão',
  },
  {
    id: 3,
    title: 'Chegue ao Nível 10',
    description: 'Alcance o nível 10 e torne-se um mestre dos hábitos',
    reward: '+1000 XP',
    completed: false,
    difficulty: 'hard',
    category: 'Progressão',
  },
  {
    id: 4,
    title: 'Complete 5 Hábitos',
    description: 'Complete 5 hábitos diferentes em um único dia',
    reward: '+300 XP',
    completed: false,
    difficulty: 'medium',
    category: 'Conquistas',
  },
  {
    id: 5,
    title: 'Sequência de 7 Dias',
    description: 'Complete pelo menos 1 hábito por 7 dias seguidos',
    reward: '+400 XP',
    completed: false,
    difficulty: 'hard',
    category: 'Conquistas',
  },
  {
    id: 6,
    title: 'Primeiro Hábito',
    description: 'Complete seu primeiro hábito no aplicativo',
    reward: '+100 XP',
    completed: true,
    difficulty: 'easy',
    category: 'Iniciante',
  },
  {
    id: 7,
    title: 'Acumule 1000 XP',
    description: 'Ganhe um total de 1000 pontos de experiência',
    reward: '+250 XP',
    completed: false,
    difficulty: 'medium',
    category: 'Progressão',
  },
  {
    id: 8,
    title: 'Use o Timer 10 Vezes',
    description: 'Use a funcionalidade de timer 10 vezes diferentes',
    reward: '+150 XP',
    completed: false,
    difficulty: 'easy',
    category: 'Funcionalidades',
  },
  {
    id: 9,
    title: 'Crie 10 Hábitos',
    description: 'Crie um total de 10 hábitos diferentes',
    reward: '+200 XP',
    completed: false,
    difficulty: 'medium',
    category: 'Criação',
  },
  {
    id: 10,
    title: 'Chegue ao Nível 20',
    description: 'Alcance o nível 20 e desbloqueie todos os recursos',
    reward: '+2000 XP',
    completed: false,
    difficulty: 'hard',
    category: 'Progressão',
  },
])

const selectedCategory = ref<string>('all')

const categories = computed(() => {
  const cats = ['all', ...new Set(missions.value.map((m) => m.category))]
  return cats
})

const filteredMissions = computed(() => {
  if (selectedCategory.value === 'all') {
    return missions.value
  }
  return missions.value.filter((mission) => mission.category === selectedCategory.value)
})

const completedMissions = computed(() => {
  return missions.value.filter((mission) => mission.completed).length
})

const totalMissions = computed(() => {
  return missions.value.length
})

const toggleMission = (missionId: number) => {
  const mission = missions.value.find((m) => m.id === missionId)
  if (mission) {
    mission.completed = !mission.completed
  }
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'hard':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getDifficultyText = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'Fácil'
    case 'medium':
      return 'Médio'
    case 'hard':
      return 'Difícil'
    default:
      return 'Desconhecido'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Missões</h1>
        <p class="text-gray-600">Complete suas missões diárias e ganhe recompensas!</p>

        <!-- Progress Bar -->
        <div class="mt-6 bg-white rounded-lg p-4 shadow-sm">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium text-gray-700">Progresso</span>
            <span class="text-sm text-gray-500">{{ completedMissions }}/{{ totalMissions }}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${(completedMissions / totalMissions) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Category Filter -->
      <div class="mb-6">
        <div class="flex flex-wrap gap-2 justify-center">
          <button
            v-for="category in categories"
            :key="category"
            @click="selectedCategory = category"
            class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
            :class="{
              'bg-blue-500 text-white shadow-md': selectedCategory === category,
              'bg-white text-gray-600 hover:bg-gray-50': selectedCategory !== category,
            }"
          >
            {{ category === 'all' ? 'Todas' : category }}
          </button>
        </div>
      </div>

      <!-- Missions List -->
      <div class="space-y-4">
        <div
          v-for="mission in filteredMissions"
          :key="mission.id"
          class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-800">{{ mission.title }}</h3>
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="getDifficultyColor(mission.difficulty)"
                >
                  {{ getDifficultyText(mission.difficulty) }}
                </span>
              </div>

              <p class="text-gray-600 mb-3">{{ mission.description }}</p>

              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-green-600">{{ mission.reward }}</span>
                <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {{ mission.category }}
                </span>
              </div>
            </div>

            <button
              @click="toggleMission(mission.id)"
              class="ml-4 flex-shrink-0 w-8 h-8 rounded-full border-2 transition-all duration-200 flex items-center justify-center"
              :class="{
                'bg-green-500 border-green-500 text-white': mission.completed,
                'border-gray-300 hover:border-green-400 hover:bg-green-50': !mission.completed,
              }"
            >
              <svg
                v-if="mission.completed"
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredMissions.length === 0" class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1"
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-600 mb-2">Nenhuma missão encontrada</h3>
        <p class="text-gray-500">Tente selecionar uma categoria diferente.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom styles if needed */
</style>
