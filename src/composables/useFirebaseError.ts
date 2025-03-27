import { ref } from 'vue'
import { FirebaseError } from 'firebase/app'
import { useNotification } from './useNotification'
import { useI18n } from './useI18n'

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

  const handleFirebaseError = (error: unknown, context: string = '') => {
    if (error instanceof FirebaseError) {
      lastError.value = {
        code: error.code,
        message: error.message,
        timestamp: new Date(),
        handled: false
      }

      // Map Firebase error codes to user-friendly messages
      const errorMessage = getErrorMessage(error.code, context)
      displayNotification(errorMessage, 'error')

      // Log error for debugging
      console.error(`Firebase Error [${context}]:`, {
        code: error.code,
        message: error.message,
        stack: error.stack
      })

      return error.code
    }

    // Handle non-Firebase errors
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    lastError.value = {
      code: 'unknown',
      message: errorMessage,
      timestamp: new Date(),
      handled: false
    }
    displayNotification(errorMessage, 'error')
    console.error(`Non-Firebase Error [${context}]:`, error)
    return 'unknown_error'
  }

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
      'cancelled': t('errors.cancelled'),
      'data-loss': t('errors.dataLoss'),
      'deadline-exceeded': t('errors.deadlineExceeded'),
      'failed-precondition': t('errors.failedPrecondition'),
      'internal': t('errors.internal'),
      'invalid-argument': t('errors.invalidArgument'),
      'out-of-range': t('errors.outOfRange'),
      'resource-exhausted': t('errors.resourceExhausted'),
      'unauthenticated': t('errors.unauthenticated'),
      'unavailable': t('errors.unavailable'),
      'unimplemented': t('errors.unimplemented'),
      'unknown': t('errors.unknown')
    }

    return errorMessages[code] || t('errors.unknown', { context })
  }

  const wrapFirebaseOperation = async <T>(
    operation: () => Promise<T>,
    context: string,
    loadingState: boolean = true
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

  const clearError = () => {
    lastError.value = null
  }

  return {
    handleFirebaseError,
    wrapFirebaseOperation,
    lastError,
    isLoading,
    clearError
  }
}
