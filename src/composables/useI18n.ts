import { ref, computed } from 'vue'
import { translations } from '../i18n/translations'

type SupportedLanguage = 'en' | 'pt'

export function useI18n() {
  const userLanguage = ref<SupportedLanguage>(
    navigator.language.split('-')[0] === 'pt' ? 'pt' : 'en',
  )

  const currentTranslations = computed(() => translations[userLanguage.value] || translations.en)

  const t = (key: string, params: Record<string, string | number> = {}) => {
    const keys = key.split('.')
    let value: any = currentTranslations.value

    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) return key
    }

    return Object.entries(params).reduce(
      (str, [key, value]) => str.replace(`{${key}}`, String(value)),
      value,
    )
  }

  const setLanguage = (lang: SupportedLanguage) => {
    userLanguage.value = lang
  }

  return {
    userLanguage,
    t,
    setLanguage,
  }
}
