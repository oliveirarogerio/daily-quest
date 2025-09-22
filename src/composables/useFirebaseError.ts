/**
 * FirebaseError Management Composable
 *
 * This composable provides standardized error handling for Firebase-related operations.
 * It processes both Firebase-specific errors and generic errors, provides user-friendly notifications,
 * logs detailed error information, and offers a wrapper for Firebase operations with built-in
 * error handling and loading state management.
 */
import { ref } from 'vue'
import { FirebaseError } from 'firebase/app'
import { useNotification } from './useNotification'

/**
 * Interface defining the structure of error state information
 * @property {string} code - Error code (e.g. 'auth/user-not-found', 'permission-denied')
 * @property {string} message - Human-readable error message
 * @property {Date} timestamp - When the error occurred
 * @property {boolean} handled - Whether this error has been handled by application logic
 */
interface ErrorState {
  code: string
  message: string
  timestamp: Date
  handled: boolean
}

export function useFirebaseError() {
  const { displayNotification } = useNotification()
  const lastError = ref<ErrorState | null>(null)
  const isLoading = ref(false)

  /**
   * Handles errors from Firebase operations or general errors
   *
   * This function:
   * 1. Identifies if the error is a Firebase-specific error
   * 2. Records error details in the lastError reactive reference
   * 3. Maps error codes to user-friendly messages using i18n translations
   * 4. Displays a notification to the user
   * 5. Logs detailed error information to the console
   * 6. Returns the error code for additional handling by the caller
   *
   * @param {unknown} error - The error object to handle (may be FirebaseError or any other error)
   * @param {string} context - Optional description of where the error occurred for better logging
   * @returns {string} The error code that can be used for conditional handling
   */
  const handleFirebaseError = (error: unknown, context: string = '') => {
    if (error instanceof FirebaseError) {
      lastError.value = {
        code: error.code,
        message: error.message,
        timestamp: new Date(),
        handled: false,
      }

      // Map Firebase error codes to user-friendly messages
      const errorMessage = getErrorMessage(error.code, context)
      displayNotification(errorMessage, 'error')

      // Log error for debugging
      console.error(`Firebase Error [${context}]:`, {
        code: error.code,
        message: error.message,
        stack: error.stack,
      })

      return error.code
    }

    // Handle non-Firebase errors
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    lastError.value = {
      code: 'unknown',
      message: errorMessage,
      timestamp: new Date(),
      handled: false,
    }
    displayNotification(errorMessage, 'error')
    console.error(`Non-Firebase Error [${context}]:`, error)
    return 'unknown_error'
  }

  /**
   * Maps Firebase error codes to user-friendly messages using i18n translations
   *
   * This function contains a comprehensive mapping of Firebase error codes to
   * translation keys, providing consistent and localized error messages across
   * the application.
   *
   * @param {string} code - Firebase error code (e.g. 'auth/user-not-found')
   * @param {string} context - Context where the error occurred, used as fallback info
   * @returns {string} Translated user-friendly error message
   */
  const getErrorMessage = (code: string, context: string): string => {
    // Common Firebase error codes
    const errorMessages: Record<string, string> = {
      'auth/invalid-email': 'Email inválido',
      'auth/user-disabled': 'Usuário desabilitado',
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/email-already-in-use': 'Email já está em uso',
      'auth/weak-password': 'Senha muito fraca',
      'auth/operation-not-allowed': 'Operação não permitida',
      'auth/popup-closed-by-user': 'Popup fechado pelo usuário',
      'permission-denied': 'Permissão negada',
      'not-found': 'Não encontrado',
      'already-exists': 'Já existe',
      cancelled: 'Cancelado',
      'data-loss': 'Perda de dados',
      'deadline-exceeded': 'Prazo excedido',
      'failed-precondition': 'Pré-condição falhou',
      internal: 'Erro interno',
      'invalid-argument': 'Argumento inválido',
      'out-of-range': 'Fora do intervalo',
      'resource-exhausted': 'Recurso esgotado',
      unauthenticated: 'Não autenticado',
      unavailable: 'Indisponível',
      unimplemented: 'Não implementado',
      unknown: 'Erro desconhecido',
    }

    return errorMessages[code] || t('errors.unknown', { context })
  }

  /**
   * Wraps a Firebase operation with standardized error handling and loading state management
   *
   * This utility function:
   * 1. Sets a loading state flag before executing the operation
   * 2. Executes the provided operation
   * 3. Handles any errors that occur using handleFirebaseError
   * 4. Resets the loading state flag when complete
   * 5. Returns the operation result or null if an error occurred
   *
   * @template T - The return type of the operation
   * @param {() => Promise<T>} operation - The Firebase operation to execute
   * @param {string} context - Description of the operation for error handling
   * @param {boolean} loadingState - Whether to update the loading state (defaults to true)
   * @returns {Promise<T | null>} The operation result or null if an error occurred
   */
  const wrapFirebaseOperation = async <T>(
    operation: () => Promise<T>,
    context: string,
    loadingState: boolean = true,
  ): Promise<T | null> => {
    try {
      if (loadingState) {
        isLoading.value = true
      }
      return await operation()
    } catch (error) {
      handleFirebaseError(error, context)
      return null
    } finally {
      if (loadingState) {
        isLoading.value = false
      }
    }
  }

  /**
   * Clears the last error state
   *
   * This function resets the lastError reference to null, typically used after
   * an error has been handled or when transitioning between operations where
   * previous errors should be cleared.
   */
  const clearError = () => {
    lastError.value = null
  }

  return {
    handleFirebaseError,
    wrapFirebaseOperation,
    lastError,
    isLoading,
    clearError,
  }
}
