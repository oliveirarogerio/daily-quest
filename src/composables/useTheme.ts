import { computed, ref } from 'vue'

const theme = ref<'calm' | 'dark'>('calm')
const disableAnimations = ref(false)

export function useTheme() {
  const setTheme = (newTheme: 'calm' | 'dark') => {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    document.documentElement.className = `theme-${newTheme}`
  }

  const toggleTheme = () => {
    setTheme(theme.value === 'calm' ? 'dark' : 'calm')
  }

  const setAnimationsDisabled = (disabled: boolean) => {
    disableAnimations.value = disabled
    localStorage.setItem('disableAnimations', disabled.toString())
    if (disabled) {
      document.documentElement.classList.add('no-animations')
    } else {
      document.documentElement.classList.remove('no-animations')
    }
  }

  const toggleAnimations = () => {
    setAnimationsDisabled(!disableAnimations.value)
  }

  // Initialize theme from localStorage
  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme') as 'calm' | 'dark' | null
    const savedAnimations = localStorage.getItem('disableAnimations')

    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      setTheme('calm')
    }

    if (savedAnimations === 'true') {
      setAnimationsDisabled(true)
    }
  }

  const isCalmTheme = computed(() => theme.value === 'calm')
  const isDarkTheme = computed(() => theme.value === 'dark')

  return {
    theme: computed(() => theme.value),
    disableAnimations: computed(() => disableAnimations.value),
    isCalmTheme,
    isDarkTheme,
    setTheme,
    toggleTheme,
    setAnimationsDisabled,
    toggleAnimations,
    initializeTheme,
  }
}
