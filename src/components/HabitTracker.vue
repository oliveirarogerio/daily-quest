<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import BackgroundAnimation from './BackgroundAnimation.vue';
import { useHabits } from '../composables/useHabits';
import { usePlayer } from '../composables/usePlayer';
import { useTimer } from '../composables/useTimer';
import { useNotification } from '../composables/useNotification';
import { useI18n } from '../composables/useI18n';
import type { Habit } from '../types/habit';

// Core functionality
const {
  habits,
  newHabitName,
  addHabit,
  deleteHabit,
  toggleHabitCompletion,
  formatTimeSpent,
  resetDailyHabits,
  updateHabit
} = useHabits();

const {
  level,
  xp,
  xpToNextLevel,
  xpPercentage,
  rank,
  addXP,
  removeXP,
  loadPlayerState,
  showLevelUpAnimation
} = usePlayer();

const { state: notificationState, displayNotification } = useNotification();
const { userLanguage, t } = useI18n();

// Timer state
const {
  state: timerState,
  setTimerMode,
  startTimer,
  pauseTimer,
  stopTimer,
  selectHabit: selectHabitForTimer,
  closeTimer,
  setOnTimerCompleted
} = useTimer();

// Wrapper function to handle adding a habit
const handleAddHabit = async () => {
  if (!newHabitName.value.trim()) return;

  await addHabit(newHabitName.value);
  const earnedXP = 5; // XP for adding a new habit
  addXP(earnedXP);
  displayNotification(t('notifications.habitAdded', { amount: earnedXP }));
};

// Handle deleting a habit
const handleDeleteHabit = async (habitId: string) => {
  await deleteHabit(habitId);
  displayNotification(t('notifications.questRemoved'));
};

// Complete habit and gain XP
const handleToggleHabit = async (habit: Habit) => {
  const xpChange = await toggleHabitCompletion(habit);

  if (xpChange > 0) {
    addXP(xpChange);
    displayNotification(t('notifications.xpGained', { amount: xpChange }));
  } else if (xpChange < 0) {
    removeXP(Math.abs(xpChange));
    displayNotification(t('notifications.xpLost', { amount: Math.abs(xpChange) }));
  }
};

// Level up function
const levelUp = () => {
  const remainingXP = xp.value - xpToNextLevel.value;
  level.value++;
  xp.value = remainingXP;

  // Show level up animation
  showLevelUpAnimation.value = true;
  setTimeout(() => {
    showLevelUpAnimation.value = false;
  }, 3000);
};

// Initialize and setup
onMounted(async () => {
  loadPlayerState();
  await resetDailyHabits();

  // Check for day change when app is focused
  window.addEventListener('focus', resetDailyHabits);

  return () => {
    window.removeEventListener('focus', resetDailyHabits);
  };
});

// Save data to localStorage when it changes
watch([level, xp], () => {
  localStorage.setItem('level', level.value.toString());
  localStorage.setItem('xp', xp.value.toString());
}, { deep: true });

// Setup timer completion callback
setOnTimerCompleted(() => {
  if (timerState.value.mode === 'pomodoro' && timerState.value.selectedHabit) {
    const earnedXP = 15; // XP for completing a Pomodoro
    addXP(earnedXP);

    const habit = timerState.value.selectedHabit;
    updateHabit(habit.id, {
      timeSpent: (habit.timeSpent || 0) + 1,
      completed: true
    });

    displayNotification(t('notifications.pomodoroCompleted', { amount: earnedXP }));
  } else {
    displayNotification(t('notifications.breakCompleted', {
      type: timerState.value.mode === 'shortBreak' ? t('timer.shortBreak') : t('timer.longBreak')
    }));
  }

  // Play completion sound
  const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
  audio.play();
});
</script>

<template>
  <div class="habit-tracker">
    <BackgroundAnimation />
    <!-- System window frame -->
    <div class="system-window">
      <div class="system-header">
        <div class="system-title">{{ t('system.title') }}</div>
        <div class="system-date">{{ new Date().toLocaleDateString(userLanguage) }}</div>
      </div>

      <div class="system-content">
        <!-- Level up animation -->
        <div class="level-up-animation" v-if="showLevelUpAnimation">
          <img src="../assets/level-up-effect.svg" alt="Level Up" />
        </div>

        <!-- Notification -->
        <div class="notification" v-if="notificationState.show">
          <img src="../assets/notification-icon.svg" alt="Notification" class="notification-icon" />
          <div class="notification-message">{{ notificationState.message }}</div>
        </div>

        <!-- Timer Modal -->
        <div class="timer-modal" v-if="timerState.showTimer && timerState.selectedHabit">
          <div class="timer-content">
            <div class="timer-header">
              <h3>{{ timerState.selectedHabit.name }}</h3>
              <button class="close-button" @click="closeTimer">×</button>
            </div>

            <div class="timer-display" :class="{ 'timer-running': timerState.isRunning }">
              {{ timerState.formattedTime }}
            </div>

            <div class="timer-modes">
              <button
                @click="setTimerMode('pomodoro')"
                :class="{ active: timerState.mode === 'pomodoro' }"
                class="mode-button"
              >
                {{ t('timer.pomodoro') }}
              </button>
              <button
                @click="setTimerMode('shortBreak')"
                :class="{ active: timerState.mode === 'shortBreak' }"
                class="mode-button"
              >
                {{ t('timer.shortBreak') }}
              </button>
              <button
                @click="setTimerMode('longBreak')"
                :class="{ active: timerState.mode === 'longBreak' }"
                class="mode-button"
              >
                {{ t('timer.longBreak') }}
              </button>
            </div>

            <div class="timer-controls">
              <button
                @click="startTimer"
                class="control-button start"
                v-if="!timerState.isRunning"
              >
                {{ t('timer.start') }}
              </button>
              <button
                @click="pauseTimer"
                class="control-button pause"
                v-else
              >
                {{ t('timer.pause') }}
              </button>
              <button
                @click="stopTimer"
                class="control-button stop"
              >
                {{ t('timer.reset') }}
              </button>
            </div>

            <div class="timer-info" v-if="timerState.selectedHabit.timeSpent">
              <div class="time-spent">
                {{ t('timer.timeSpent') }}: {{ formatTimeSpent(timerState.selectedHabit.timeSpent) }}
              </div>
            </div>
          </div>
        </div>

        <div class="player-status">
          <div class="player-rank">
            <div class="rank-label">{{ t('player.rank') }}</div>
            <div class="rank-value">{{ rank }}</div>
          </div>

          <div class="player-icon">
            <img src="../assets/hunter-icon.svg" alt="Hunter Icon" />
            <div class="level-badge">{{ level }}</div>
          </div>

          <div class="player-info">
            <h2>{{ t('player.level') }} {{ level }}</h2>
            <div class="xp-bar-container">
              <div class="xp-bar" :style="{ width: xpPercentage + '%' }"></div>
              <span class="xp-text">{{ xp }} / {{ xpToNextLevel }} {{ t('player.xp') }}</span>
            </div>
          </div>
        </div>

        <div class="daily-quests">
          <div class="quest-header">
            <div class="rune-symbol left"></div>
            <h3>{{ t('quests.title') }}</h3>
            <div class="rune-symbol right"></div>
          </div>

          <ul class="habit-list">
            <li v-for="habit in habits" :key="habit.id" class="habit-item">
              <div class="habit-content">
                <div class="habit-left">
                  <input
                    type="checkbox"
                    :checked="habit.completed"
                    @change="handleToggleHabit(habit)"
                    class="habit-checkbox"
                  />
                  <span class="habit-name" :class="{ completed: habit.completed }">
                    {{ habit.name }}
                  </span>
                </div>
                <div class="habit-right">
                  <span class="time-badge" v-if="habit.timeSpent" :title="t('quests.timeSpent')">
                    {{ formatTimeSpent(habit.timeSpent) }}
                  </span>
                  <span class="streak-badge" v-if="habit.streak > 0">
                    {{ habit.streak }} 🔥 {{ t('quests.streak') }}
                  </span>
                  <button class="timer-button" @click="selectHabitForTimer(habit)" :title="t('quests.startTimer')">
                    <span class="timer-icon">⏱️</span>
                  </button>
                  <button class="delete-button" @click="handleDeleteHabit(habit.id)" :title="t('quests.removeQuest')">
                    <span class="delete-icon">×</span>
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>

        <div class="add-habit">
          <input
            type="text"
            v-model="newHabitName"
            :placeholder="t('quests.addPlaceholder')"
            @keyup.enter="handleAddHabit"
          />
          <button @click="handleAddHabit">
            <span class="button-text">{{ t('quests.addButton') }}</span>
          </button>
        </div>

        <!-- Footer -->
        <div class="footer">
          <a href="https://github.com/oliveirarogerio" target="_blank" rel="noopener noreferrer" class="footer-link">
            {{ t('footer.madeBy') }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.habit-tracker {
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  padding: 0;
  font-family: 'Arial', sans-serif;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Add margin on mobile screens */
@media (max-width: 768px) {
  .habit-tracker {
    margin-left: 20px;
    margin-right: 20px;
  }
}

/* System window styling */
.system-window {
  background-color: rgba(26, 26, 42, 0.95);
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5), 0 0 40px rgba(106, 90, 205, 0.2);
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(106, 90, 205, 0.5);
  width: 100%;
}

@media (max-width: 768px) {
  .system-window  {
    padding: 30px;
  }
}
.system-window::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><path d="M15 5 L25 10 L25 20 L15 25 L5 20 L5 10 Z" fill="none" stroke="%236a5acd" stroke-width="0.5" opacity="0.1" /></svg>');
  background-repeat: repeat;
  opacity: 0.1;
  z-index: 0;
}

.system-header {
  background-color: #0a0a14;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(106, 90, 205, 0.5);
  position: relative;
  z-index: 1;
}

.system-title {
  color: #ffffff;
  font-weight: bold;
  font-size: 1.2rem;
  letter-spacing: 2px;
  position: relative;
}

.system-title::before, .system-title::after {
  content: '';
  position: absolute;
  height: 1px;
  background-color: #6a5acd;
  top: 50%;
  width: 30px;
}

.system-title::before {
  right: 100%;
  margin-right: 10px;
}

.system-title::after {
  left: 100%;
  margin-left: 10px;
}

.system-date {
  color: #9370db;
  font-size: 0.9rem;
}

.system-content {
  padding: 20px;
  position: relative;
  z-index: 1;
  max-height: 70vh;
  overflow-y: auto;
}


/* Notification styling */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: rgba(26, 26, 42, 0.95);
  border: 1px solid #6a5acd;
  border-radius: 8px;
  padding: 10px 15px;
  display: flex;
  align-items: center;
  box-shadow: 0 0 15px rgba(106, 90, 205, 0.5);
  z-index: 1000;
  animation: slideIn 0.3s ease-out, fadeOut 0.5s ease-in 2.5s;
}

.notification-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}

.notification-message {
  color: #ffffff;
  font-weight: bold;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Level up animation */
.level-up-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  background-color: rgba(10, 10, 20, 0.7);
  animation: fadeInOut 3s ease-in-out;
}

.level-up-animation img {
  width: 300px;
  height: 300px;
  animation: pulse 1s infinite alternate;
}

@keyframes fadeInOut {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes pulse {
  from { transform: scale(0.95); }
  to { transform: scale(1.05); }
}

/* Player status styling */
.player-status {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #2a2a3a 0%, #1a1a2a 100%);
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(106, 90, 205, 0.3);
  position: relative;
  overflow: hidden;
}

/* Add margin on mobile screens */
@media (max-width: 768px) {
  .player-status {
    margin-left: 20px;
    margin-right: 20px;
  }
}

.player-status::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(106, 90, 205, 0.1) 0%, transparent 70%);
  animation: rotate 10s linear infinite;
  z-index: 0;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.player-rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 15px;
  z-index: 1;
}

.rank-label {
  font-size: 0.8rem;
  color: #9370db;
  margin-bottom: 5px;
}

.rank-value {
  width: 35px;
  height: 35px;
  background-color: #1a1a2a;
  border: 2px solid #6a5acd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.3rem;
  color: #6a5acd;
  box-shadow: 0 0 10px rgba(106, 90, 205, 0.5);
}

.player-icon {
  width: 70px;
  height: 70px;
  position: relative;
  margin-right: 15px;
  z-index: 1;
}

.player-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 5px rgba(106, 90, 205, 0.5));
}

.level-badge {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: #6a5acd;
  color: white;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border: 2px solid white;
  box-shadow: 0 0 10px rgba(106, 90, 205, 0.7);
  font-size: 0.9rem;
}

.player-info {
  flex: 1;
  z-index: 1;
}

.player-info h2 {
  margin: 0 0 8px;
  color: #fff;
  font-size: 1.3rem;
  text-shadow: 0 0 5px rgba(106, 90, 205, 0.7);
}

.xp-bar-container {
  height: 18px;
  background-color: #2a2a3a;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  border: 1px solid #6a5acd;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.xp-bar {
  height: 100%;
  background: linear-gradient(90deg, #6a5acd, #9370db);
  transition: width 0.5s ease-in-out;
  position: relative;
  overflow: hidden;
}

.xp-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.1) 100%);
  transform: skewX(-20deg);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  from { transform: translateX(-100%) skewX(-20deg); }
  to { transform: translateX(100%) skewX(-20deg); }
}

.xp-text {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  font-size: 0.9rem;
}

/* Daily quests styling */
.daily-quests {
  background: linear-gradient(135deg, #2a2a3a 0%, #1a1a2a 100%);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(106, 90, 205, 0.3);
  position: relative;
}

@media (max-width: 768px) {
  .daily-quests {
    margin-left: 20px;
    margin-right: 20px;
  }
}

.daily-quests::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><path d="M15 5 L25 10 L25 20 L15 25 L5 20 L5 10 Z" fill="none" stroke="%236a5acd" stroke-width="0.5" opacity="0.1" /></svg>');
  background-repeat: repeat;
  opacity: 0.1;
  z-index: 0;
  border-radius: 10px;
}

.quest-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.quest-header h3 {
  margin: 0;
  color: #fff;
  padding-bottom: 8px;
  text-align: center;
  position: relative;
  text-shadow: 0 0 5px rgba(106, 90, 205, 0.7);
  letter-spacing: 2px;
  font-size: 1.1rem;
}

.quest-header h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #6a5acd, transparent);
}

.rune-symbol {
  width: 18px;
  height: 18px;
  position: relative;
}

.rune-symbol.left {
  margin-right: 12px;
}

.rune-symbol.right {
  margin-left: 12px;
}

.rune-symbol::before, .rune-symbol::after {
  content: '';
  position: absolute;
  background-color: #6a5acd;
}

.rune-symbol.left::before {
  width: 18px;
  height: 3px;
  top: 7.5px;
  left: 0;
}

.rune-symbol.left::after {
  width: 3px;
  height: 18px;
  top: 0;
  left: 7.5px;
}

.rune-symbol.right::before {
  width: 18px;
  height: 3px;
  top: 7.5px;
  left: 0;
}

.rune-symbol.right::after {
  width: 18px;
  height: 3px;
  top: 0;
  left: 0;
  transform: rotate(90deg);
  transform-origin: 9px 9px;
}

.habit-list {
  list-style: none;
  padding: 0;
  margin: 0;
  position: relative;
  z-index: 1;
  max-height: 30vh;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .habit-list {
    margin-left: 20px;
    margin-right: 20px;
  }
}

.habit-item {
  margin-bottom: 8px;
  padding: 10px 12px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  position: relative;
}

.habit-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  border-left: 3px solid #6a5acd;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.habit-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 8px;
  box-shadow: 0 0 5px rgba(106, 90, 205, 0.3);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.habit-item:hover::before {
  opacity: 1;
}

.habit-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.habit-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.habit-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.habit-checkbox {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 2px solid #6a5acd;
  position: relative;
  cursor: pointer;
  vertical-align: middle;
  margin-right: 10px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.habit-checkbox:hover {
  background-color: rgba(106, 90, 205, 0.2);
  box-shadow: 0 0 5px rgba(106, 90, 205, 0.5);
}

.habit-checkbox:checked {
  background-color: #6a5acd;
}

.habit-checkbox:checked::after {
  content: "✓";
  position: absolute;
  color: white;
  font-size: 12px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.habit-name {
  color: #fff;
  flex: 1;
  word-break: break-word;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.completed {
  text-decoration: line-through;
  color: #9370db;
}

.streak-badge {
  background-color: rgba(255, 69, 0, 0.2);
  color: #ff6347;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: bold;
  margin-left: 10px;
  white-space: nowrap;
  border: 1px solid rgba(255, 69, 0, 0.3);
  box-shadow: 0 0 5px rgba(255, 69, 0, 0.3);
  flex-shrink: 0;
}

/* Add habit form styling */
.add-habit {
  display: flex;
  margin-top: 15px;
  position: relative;
  z-index: 1;
}

@media (max-width: 768px) {
  .add-habit {
    margin-left: 20px;
    margin-right: 20px;
  }
}

.add-habit input {
  flex: 1;
  padding: 10px 12px;
  border: none;
  border-radius: 8px 0 0 8px;
  background-color: #2a2a3a;
  color: white;
  outline: none;
  border: 1px solid rgba(106, 90, 205, 0.3);
  border-right: none;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.add-habit input:focus {
  box-shadow: 0 0 0 2px rgba(106, 90, 205, 0.3);
}

.add-habit button {
  padding: 10px 15px;
  background: linear-gradient(90deg, #6a5acd, #9370db);
  border: none;
  border-radius: 0 8px 8px 0;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  font-size: 0.95rem;
}

.add-habit button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent);
  transition: all 0.5s ease;
}

.add-habit button:hover {
  background: linear-gradient(90deg, #5a4abf, #8360cb);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.add-habit button:hover::before {
  left: 100%;
}

.button-text {
  position: relative;
  z-index: 1;
}

/* Footer styling */
.footer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid rgba(106, 90, 205, 0.3);
  text-align: center;
  position: relative;
  z-index: 1;
}

.footer-link {
  color: #9370db;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.footer-link:hover {
  color: #6a5acd;
  transform: translateY(-2px);
  text-shadow: 0 0 5px rgba(106, 90, 205, 0.7);
}

.footer-link::before {
  font-size: 1rem;
}

/* Responsive styles for footer */
@media (max-width: 768px) {
  .footer {
    margin-top: 15px;
    padding-top: 12px;
  }

  .footer-link {
    font-size: 0.85rem;
  }
}

/* Responsive styles */
@media (max-width: 768px) {
  .system-window {
    background: none;
    box-shadow: none;
    border: none;
    border-radius: 0;
  }

  .system-header {
    display: none;
  }

  .system-content {
    padding: 10px;
    max-height: 100vh;
  }

  .habit-tracker {
    margin-left: 0;
    margin-right: 0;
  }

  .player-status {
    margin-left: 20px;
    margin-right: 20px;
  }

  .daily-quests {
    margin-left: 20px;
    margin-right: 20px;
  }

  .habit-list {
    margin-left: 20px;
    margin-right: 20px;
  }

  .add-habit {
    margin-left: 20px;
    margin-right: 20px;
  }
}

/* For very small screens */
@media (max-height: 600px) {
  .system-content {
    padding: 10px;
    max-height: 80vh;
  }

  .player-status {
    margin-bottom: 10px;
    padding: 10px;
  }

  .daily-quests {
    padding: 10px;
    margin-bottom: 10px;
  }

  .habit-list {
    max-height: 25vh;
  }

  .add-habit {
    margin-top: 10px;
  }
}

.delete-button {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: rgba(255, 69, 0, 0.2);
  border: 1px solid rgba(255, 69, 0, 0.3);
  color: #ff6347;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
  opacity: 0.7;
  flex-shrink: 0;
}

.delete-button:hover {
  background-color: rgba(255, 69, 0, 0.4);
  transform: scale(1.1);
  opacity: 1;
  box-shadow: 0 0 5px rgba(255, 69, 0, 0.5);
}

.delete-icon {
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
}

/* Timer Modal */
.timer-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(10, 10, 20, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.timer-content {
  background: linear-gradient(135deg, #2a2a3a 0%, #1a1a2a 100%);
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 0 30px rgba(106, 90, 205, 0.5);
  border: 1px solid rgba(106, 90, 205, 0.5);
  position: relative;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.timer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(106, 90, 205, 0.3);
  padding-bottom: 10px;
}

.timer-header h3 {
  margin: 0;
  color: #fff;
  font-size: 1.2rem;
  text-shadow: 0 0 5px rgba(106, 90, 205, 0.7);
}

.close-button {
  background: none;
  border: none;
  color: #9370db;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: all 0.3s ease;
}

.close-button:hover {
  color: #fff;
  transform: scale(1.1);
}

.timer-display {
  font-size: 3.5rem;
  font-weight: bold;
  text-align: center;
  color: #fff;
  margin: 20px 0;
  text-shadow: 0 0 10px rgba(106, 90, 205, 0.7);
  font-family: 'Courier New', monospace;
  transition: all 0.3s ease;
}

.timer-running {
  color: #6a5acd;
  animation: pulse 1s infinite alternate;
}

.timer-modes {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.mode-button {
  background-color: rgba(106, 90, 205, 0.2);
  border: 1px solid rgba(106, 90, 205, 0.3);
  color: #9370db;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.mode-button:hover {
  background-color: rgba(106, 90, 205, 0.3);
  transform: translateY(-2px);
}

.mode-button.active {
  background-color: rgba(106, 90, 205, 0.5);
  color: white;
  box-shadow: 0 0 10px rgba(106, 90, 205, 0.5);
}

.timer-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

.control-button {
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-size: 1rem;
  min-width: 100px;
}

.control-button.start {
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  color: white;
}

.control-button.pause {
  background: linear-gradient(90deg, #FFC107, #FF9800);
  color: white;
}

.control-button.stop {
  background: rgba(255, 255, 255, 0.1);
  color: #9370db;
  border: 1px solid rgba(106, 90, 205, 0.3);
}

.control-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.timer-info {
  text-align: center;
  color: #9370db;
  font-size: 0.9rem;
  margin-top: 10px;
}

/* Timer button in habit list */
.timer-button {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: rgba(106, 90, 205, 0.2);
  border: 1px solid rgba(106, 90, 205, 0.3);
  color: #6a5acd;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
  opacity: 0.7;
  flex-shrink: 0;
}

.timer-button:hover {
  background-color: rgba(106, 90, 205, 0.4);
  transform: scale(1.1);
  opacity: 1;
  box-shadow: 0 0 5px rgba(106, 90, 205, 0.5);
}

.timer-icon {
  font-size: 12px;
  line-height: 1;
}

.time-badge {
  background-color: rgba(106, 90, 205, 0.2);
  color: #9370db;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: bold;
  white-space: nowrap;
  border: 1px solid rgba(106, 90, 205, 0.3);
  box-shadow: 0 0 5px rgba(106, 90, 205, 0.3);
  flex-shrink: 0;
}

/* Responsive styles for timer */
@media (max-width: 768px) {
  .timer-content {
    width: 95%;
    padding: 15px;
  }

  .timer-display {
    font-size: 2.5rem;
    margin: 15px 0;
  }

  .timer-modes {
    flex-wrap: wrap;
  }

  .mode-button {
    font-size: 0.8rem;
    padding: 6px 10px;
  }

  .control-button {
    padding: 8px 15px;
    font-size: 0.9rem;
    min-width: 80px;
  }
}
</style>
