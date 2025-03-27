import { ref } from 'vue';
import type { NotificationState } from '../types/habit';

export function useNotification() {
  const state = ref<NotificationState>({
    show: false,
    message: ''
  });

  const displayNotification = (message: string, duration = 3000) => {
    state.value.message = message;
    state.value.show = true;

    setTimeout(() => {
      state.value.show = false;
    }, duration);
  };

  return {
    state,
    displayNotification
  };
}
