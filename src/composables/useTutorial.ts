/**
 * useTutorial.ts
 *
 * Composable for managing tutorial system with Robby3D mascot
 * Provides tutorial states and messages for different app features
 */
import { computed, ref } from 'vue'

export interface TutorialStep {
  id: string
  message: string
  variant: 'default' | 'celebrating' | 'encouraging' | 'sleeping'
  position?: 'top' | 'bottom' | 'left' | 'right'
  showArrow?: boolean
  action?: string
}

export interface Tutorial {
  id: string
  name: string
  steps: TutorialStep[]
  completed: boolean
}


const tutorials = computed<Tutorial[]>(() => [
  {
    id: 'welcome',
    name: '👋 Olá! Eu sou o Robby, seu assistente virtual!',
    completed: false,
    steps: [
      {
        id: 'welcome-1',
        message: '👋 Olá! Eu sou o Robby, seu assistente virtual!',
        variant: 'encouraging',
        position: 'bottom',
      },
      {
        id: 'welcome-2',
        message: 'Vou te ajudar a entender como usar o app! 🌟',
        variant: 'encouraging',
        position: 'bottom',
      },
    ],
  },
  {
    id: 'add-habit',
    name: '📝 Para adicionar uma nova tarefa, toque no botão "+" abaixo!',
    completed: false,
    steps: [
      {
        id: 'add-habit-1',
        message: '📝 Para adicionar uma nova tarefa, toque no botão "+" abaixo!',
        variant: 'encouraging',
        position: 'top',
        showArrow: true,
        action: 'show-add-button',
      },
      {
        id: 'add-habit-2',
        message: '✍️ Digite o nome da sua tarefa no campo de texto!',
        variant: 'encouraging',
        position: 'top',
        action: 'focus-input',
      },
      {
        id: 'add-habit-3',
        message: '✅ Toque em "Adicionar" para criar sua tarefa!',
        variant: 'encouraging',
        position: 'top',
        action: 'highlight-add-button',
      },
    ],
  },
  {
    id: 'complete-habit',
    name: '🎯 Para completar uma tarefa, toque nela na lista!',
    completed: false,
    steps: [
      {
        id: 'complete-habit-1',
        message: '🎯 Para completar uma tarefa, toque nela na lista!',
        variant: 'encouraging',
        position: 'top',
        showArrow: true,
        action: 'highlight-habit-item',
      },
      {
        id: 'complete-habit-2',
        message: '🎉 Parabéns! Você ganhou pontos e XP!',
        variant: 'celebrating',
        position: 'bottom',
      },
    ],
  },
  {
    id: 'timer',
    name: '⏰ Toque no ícone do timer para focar em uma tarefa!',
    completed: false,
    steps: [
      {
        id: 'timer-1',
        message: '⏰ Toque no ícone do timer para focar em uma tarefa!',
        variant: 'encouraging',
        position: 'top',
        showArrow: true,
        action: 'highlight-timer-button',
      },
      {
        id: 'timer-2',
        message: '🎯 Escolha o modo: Pomodoro (25min), Pausa (5min) ou Personalizado!',
        variant: 'encouraging',
        position: 'top',
      },
      {
        id: 'timer-3',
        message: '▶️ Toque em "Iniciar" para começar a focar!',
        variant: 'encouraging',
        position: 'top',
        action: 'highlight-start-button',
      },
    ],
  },
  {
    id: 'level-up',
    name: '📊 Veja seu nível e XP na barra superior!',
    completed: false,
    steps: [
      {
        id: 'level-up-1',
        message: '📊 Veja seu nível e XP na barra superior!',
        variant: 'encouraging',
        position: 'top',
        showArrow: true,
        action: 'highlight-level-bar',
      },
      {
        id: 'level-up-2',
        message: '🌟 Complete tarefas para ganhar XP e subir de nível!',
        variant: 'encouraging',
        position: 'top',
      },
      {
        id: 'level-up-3',
        message: '🏆 Cada nível desbloqueia novas conquistas!',
        variant: 'celebrating',
        position: 'bottom',
      },
    ],
  },
  {
    id: 'settings',
    name: '⚙️ Toque no ícone de configurações para personalizar o app!',
    completed: false,
    steps: [
      {
        id: 'settings-1',
        message: '⚙️ Toque no ícone de configurações para personalizar o app!',
        variant: 'encouraging',
        position: 'top',
        showArrow: true,
        action: 'highlight-settings-button',
      },
      {
        id: 'settings-2',
        message: '🎨 Você pode mudar cores, temas e muito mais!',
        variant: 'encouraging',
        position: 'top',
      },
    ],
  },
])

const currentTutorial = ref<Tutorial | null>(null)
const currentStepIndex = ref(0)
const isTutorialActive = ref(false)
const showTutorialOverlay = ref(false)

const currentStep = computed(() => {
  if (!currentTutorial.value) return null
  return currentTutorial.value.steps[currentStepIndex.value]
})

const hasNextStep = computed(() => {
  if (!currentTutorial.value) return false
  return currentStepIndex.value < currentTutorial.value.steps.length - 1
})

const hasPreviousStep = computed(() => {
  return currentStepIndex.value > 0
})

const startTutorial = (tutorialId: string) => {
  const tutorial = tutorials.value.find((t) => t.id === tutorialId)
  if (!tutorial) return

  currentTutorial.value = tutorial
  currentStepIndex.value = 0
  isTutorialActive.value = true
  showTutorialOverlay.value = true
}

const nextStep = () => {
  if (!currentTutorial.value) return

  if (hasNextStep.value) {
    currentStepIndex.value++
  } else {
    completeTutorial()
  }
}

const previousStep = () => {
  if (hasPreviousStep.value) {
    currentStepIndex.value--
  }
}

const completeTutorial = () => {
  if (!currentTutorial.value) return

  currentTutorial.value.completed = true
  isTutorialActive.value = false
  showTutorialOverlay.value = false
  currentTutorial.value = null
  currentStepIndex.value = 0
}

const skipTutorial = () => {
  isTutorialActive.value = false
  showTutorialOverlay.value = false
  currentTutorial.value = null
  currentStepIndex.value = 0
}

const resetTutorial = (tutorialId: string) => {
  const tutorial = tutorials.value.find((t) => t.id === tutorialId)
  if (tutorial) {
    tutorial.completed = false
  }
}

const resetAllTutorials = () => {
  tutorials.value.forEach((tutorial) => {
    tutorial.completed = false
  })
}

const getTutorialProgress = () => {
  const completed = tutorials.value.filter((t) => t.completed).length
  const total = tutorials.value.length
  return { completed, total, percentage: (completed / total) * 100 }
}

const getEncouragingMessage = () => {
  const messages = ['Continue assim, pequeno herói! ⚡', 'Cada tarefa te deixa mais forte! 💪']
  return messages[Math.floor(Math.random() * messages.length)]
}

const getCelebrationMessage = () => {
  const messages = ['💫 Incrível! Você está ficando mais forte! 💫']
  return messages[Math.floor(Math.random() * messages.length)]
}

const getSleepingMessage = () => {
  const messages = ['🌙 Hora de descansar para ficar mais forte!']
  return messages[Math.floor(Math.random() * messages.length)]
}

export function useTutorial() {
  return {
    // State
    tutorials,
    currentTutorial,
    currentStep,
    currentStepIndex,
    isTutorialActive,
    showTutorialOverlay,
    hasNextStep,
    hasPreviousStep,

    // Actions
    startTutorial,
    nextStep,
    previousStep,
    completeTutorial,
    skipTutorial,
    resetTutorial,
    resetAllTutorials,
    getTutorialProgress,
    getEncouragingMessage,
    getCelebrationMessage,
    getSleepingMessage,
  }
}
