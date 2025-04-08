/**
 * Notification System Composable
 *
 * This composable provides a simple notification system for displaying temporary messages to users.
 * It manages a notification state with show/hide functionality and automatic timeout.
 */
import { ref } from 'vue'
import type { NotificationState } from '../types/habit'

export function useNotification() {
  /**
   * Reactive reference to the current notification state
   * Contains show status and message content
   */
  const state = ref<NotificationState>({
    show: false,
    message: '',
  })

  /**
   * Displays a notification with the specified message and duration
   *
   * This function:
   * 1. Sets the notification message
   * 2. Shows the notification by setting state.show to true
   * 3. Automatically hides the notification after the specified duration
   * 4. Handles optional notification type for styling ('success', 'error', 'info')
   *
   * Can be called in two ways:
   * - displayNotification(message, type, duration) - with type and duration
   * - displayNotification(message, duration) - with just duration (legacy support)
   *
   * @param {string} message - The notification message to display
   * @param {string | number} typeOrDuration - Either notification type ('success', 'error', 'info') or duration in ms
   * @param {number} duration - Duration in milliseconds to show the notification (default: 3000ms)
   */
  const displayNotification = (
    message: string,
    typeOrDuration?: 'success' | 'error' | 'info' | number,
    duration = 3000,
  ) => {
    state.value.message = message
    state.value.show = true

    // Handle overloaded parameters
    if (typeof typeOrDuration === 'string') {
      state.value.type = typeOrDuration
    } else if (typeof typeOrDuration === 'number') {
      duration = typeOrDuration
    }

    setTimeout(() => {
      state.value.show = false
    }, duration)
  }

  return {
    state,
    displayNotification,
  }
}
