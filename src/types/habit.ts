export type Difficulty = 'easy' | 'normal' | 'hard' | 'epic';
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  streak: number;
  timeSpent: number;
  userId: string;
  createdAt: Date;
  lastEarnedXP: number;
  difficulty: Difficulty;
  tags: string[];
}

export interface HabitDoc {
  id: string;
  name?: string;
  completed?: boolean;
  streak?: number;
  timeSpent?: number;
  userId?: string;
  createdAt: Date;
  lastEarnedXP?: number;
}

export interface PlayerState {
  level: number;
  xp: number;
  rank: Rank;
  lastUpdated?: Date;
}

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export interface TimerState {
  showTimer: boolean;
  selectedHabit: Habit | null;
  mode: 'pomodoro' | 'shortBreak' | 'longBreak';
  time: number;
  isRunning: boolean;
  formattedTime: string;
}

export interface NotificationState {
  show: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
}
