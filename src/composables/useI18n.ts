/**
 * Internationalization (i18n) Composable
 *
 * This composable provides translation functionality for the application,
 * allowing for easy switching between supported languages and retrieving
 * translated text with optional parameter interpolation.
 */
import { ref, computed } from 'vue'
import { translations } from '../i18n/translations'

/**
 * Type definition for supported application languages
 * Currently supports English (en) and Portuguese (pt)
 */
type SupportedLanguage = 'en' | 'pt'

export function useI18n() {
  /**
   * Reactive reference to the current user language
   * Defaults to Portuguese if browser language starts with 'pt', otherwise English
   */
  const userLanguage = ref<SupportedLanguage>(
    navigator.language.split('-')[0] === 'pt' ? 'pt' : 'en',
  )

  /**
   * Computed property that returns the translation object for the current language
   * Falls back to English translations if the current language is not available
   */
  const currentTranslations = computed(() => translations[userLanguage.value] || translations.en)

  /**
   * Retrieves a translated string based on a dotted path key
   *
   * This function:
   * 1. Splits the key by dots to navigate the nested translation structure
   * 2. Traverses the translation object to find the requested string
   * 3. Replaces any parameters in the string with provided values
   * 4. Falls back to the key itself if translation is not found
   *
   * @param {string} key - Dotted path key (e.g., 'errors.notFound')
   * @param {Record<string, string | number>} params - Optional parameters for interpolation
   * @returns {string} The translated string with parameters replaced
   *
   * @example
   * // Returns "File not found" with "file.txt" replacing {filename}
   * t('errors.fileNotFound', { filename: 'file.txt' })
   */
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

  /**
   * Sets the active language for translations
   *
   * @param {SupportedLanguage} lang - The language code to set ('en' or 'pt')
   */
  const setLanguage = (lang: SupportedLanguage) => {
    userLanguage.value = lang
  }

  return {
    userLanguage,
    t,
    setLanguage,
  }
}
