export type Difficulty = 'easy' | 'normal' | 'hard' | 'epic'
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS'

export interface Habit {
  id: string
  name: string
  description?: string
  completed: boolean
  streak: number
  timeSpent: number
  userId: string
  createdAt: Date
  lastEarnedXP: number
  difficulty: Difficulty
  tags: string[]
}

export interface HabitDoc {
  id: string
  name?: string
  completed?: boolean
  streak?: number
  timeSpent?: number
  userId?: string
  createdAt: Date
  lastEarnedXP?: number
}

export interface PlayerState {
  level: number
  xp: number
  rank: Rank
  lastUpdated?: Date
  totalXPEarned: number
  recentXPGain: number
  hasUnreadLevelUp: boolean
  hasUnreadRankUp: boolean
  streakMultiplier: number
  longestStreak: number
  streakProtection?: number
  titles?: string[]
  selectedTitle?: string
  badges?: string[]
  selectedBadge?: string
}

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak' | 'custom'

export interface TimerState {
  selectedHabit: Habit | null
  showTimer: boolean
  isRunning: boolean
  seconds: number
  minutes: number
  mode: TimerMode
  customMinutes: number
  completedSessions?: number
  pomodoroGoal?: number
  longBreakInterval?: number
  autoStartBreaks?: boolean
  autoStartPomodoros?: boolean
  soundEnabled?: boolean
  soundVolume?: number
}

export interface NotificationState {
  show: boolean
  message: string
  type?: 'success' | 'error' | 'info'
}
