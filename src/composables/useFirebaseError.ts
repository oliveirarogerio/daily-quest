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
import { useI18n } from './useI18n'

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
  const { t } = useI18n()
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
      'auth/invalid-email': t('errors.invalidEmail'),
      'auth/user-disabled': t('errors.userDisabled'),
      'auth/user-not-found': t('errors.userNotFound'),
      'auth/wrong-password': t('errors.wrongPassword'),
      'auth/email-already-in-use': t('errors.emailInUse'),
      'auth/weak-password': t('errors.weakPassword'),
      'auth/operation-not-allowed': t('errors.operationNotAllowed'),
      'auth/popup-closed-by-user': t('errors.popupClosed'),
      'permission-denied': t('errors.permissionDenied'),
      'not-found': t('errors.notFound'),
      'already-exists': t('errors.alreadyExists'),
      cancelled: t('errors.cancelled'),
      'data-loss': t('errors.dataLoss'),
      'deadline-exceeded': t('errors.deadlineExceeded'),
      'failed-precondition': t('errors.failedPrecondition'),
      internal: t('errors.internal'),
      'invalid-argument': t('errors.invalidArgument'),
      'out-of-range': t('errors.outOfRange'),
      'resource-exhausted': t('errors.resourceExhausted'),
      unauthenticated: t('errors.unauthenticated'),
      unavailable: t('errors.unavailable'),
      unimplemented: t('errors.unimplemented'),
      unknown: t('errors.unknown'),
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
