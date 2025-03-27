import { ref, watch } from 'vue';
import { useCurrentUser } from 'vuefire';
import { collection, addDoc, deleteDoc, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { db, habitsRef } from '../firebase/config';
import { useFirebaseError } from './useFirebaseError';
import type { Habit } from '../types/habit';

export function useHabits() {
  const habits = ref<Habit[]>([]);
  const newHabitName = ref('');
  const user = useCurrentUser();
  const { wrapFirebaseOperation, isLoading } = useFirebaseError();

  // Load initial data from localStorage
  const loadFromStorage = () => {
    try {
      const savedHabits = localStorage.getItem('habits');
      if (savedHabits) {
        habits.value = JSON.parse(savedHabits);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      habits.value = [];
    }
  };

  // Save habits to localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem('habits', JSON.stringify(habits.value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Sync with Firebase
  const syncWithFirebase = async () => {
    if (!user.value) return;

    return await wrapFirebaseOperation(async () => {
      const q = query(habitsRef, where('userId', '==', user.value!.uid));
      const querySnapshot = await getDocs(q);
      const firebaseHabits: Habit[] = [];

      querySnapshot.forEach((doc) => {
        firebaseHabits.push({ ...doc.data(), id: doc.id } as Habit);
      });

      // Merge local and Firebase habits
      const mergedHabits = new Map();

      // Add Firebase habits
      firebaseHabits.forEach(habit => {
        mergedHabits.set(habit.id, habit);
      });

      // Add local habits that don't exist in Firebase
      habits.value.forEach(habit => {
        if (!mergedHabits.has(habit.id)) {
          mergedHabits.set(habit.id, habit);
        }
      });

      habits.value = Array.from(mergedHabits.values());
      saveToStorage();
    }, 'syncWithFirebase');
  };

  // Watch for changes and save to localStorage
  watch(habits, saveToStorage, { deep: true });

  const addHabit = async (name: string): Promise<void> => {
    if (!name.trim()) return;

    return await wrapFirebaseOperation(async () => {
      const habit: Habit = {
        id: crypto.randomUUID(),
        name: name.trim(),
        completed: false,
        streak: 0,
        timeSpent: 0,
        userId: user.value?.uid || 'local',
        createdAt: new Date(),
        lastEarnedXP: 0,
        description: '',
        difficulty: 'normal',
        tags: []
      };

      console.log('habit', habit)

      // Add to local state first
      habits.value.push(habit);

      // If user is logged in, save to Firebase
      if (user.value) {
        const docRef = await addDoc(habitsRef, {
          ...habit,
          id:  crypto.randomUUID()
        });
        // Update the habit's ID with Firestore ID
        const index = habits.value.findIndex(h => h.id === habit.id);
        if (index !== -1) {
          habits.value[index].id = docRef.id;
        }
      }

      newHabitName.value = '';
    }, 'addHabit');
  };

  const deleteHabit = async (habitId: string): Promise<void> => {
    return await wrapFirebaseOperation(async () => {
      // Remove from local state
      habits.value = habits.value.filter(h => h.id !== habitId);

      // If user is logged in, delete from Firebase
      if (user.value) {
        await deleteDoc(doc(db, 'habits', habitId));
      }
    }, 'deleteHabit');
  };

  const updateHabit = async (habitId: string, updates: Partial<Habit>): Promise<void> => {
    return await wrapFirebaseOperation(async () => {
      // Update local state
      const index = habits.value.findIndex(h => h.id === habitId);
      if (index !== -1) {
        habits.value[index] = { ...habits.value[index], ...updates };
      }

      // If user is logged in, update Firebase
      if (user.value) {
        await updateDoc(doc(db, 'habits', habitId), updates);
      }
    }, 'updateHabit');
  };

  const toggleHabitCompletion = async (habit: Habit): Promise<number> => {
    return await wrapFirebaseOperation(async () => {
      const wasCompleted = habit.completed;
      const earnedXP = calculateXP(habit.streak, habit.difficulty || 'normal');

      await updateHabit(habit.id, {
        completed: !wasCompleted,
        streak: wasCompleted ? Math.max(0, habit.streak - 1) : habit.streak + 1,
        lastEarnedXP: wasCompleted ? 0 : earnedXP
      });

      return wasCompleted ? -habit.lastEarnedXP! : earnedXP;
    }, 'toggleHabitCompletion') ?? 0;
  };

  const resetDailyHabits = async (): Promise<void> => {
    return await wrapFirebaseOperation(async () => {
      const today = new Date().toDateString();
      const lastResetDate = localStorage.getItem('lastResetDate');

      if (lastResetDate !== today) {
        for (const habit of habits.value) {
          const updates: Partial<Habit> = {
            completed: false
          };

          if (!habit.completed) {
            updates.streak = 0;
          }

          await updateHabit(habit.id, updates);
        }

        localStorage.setItem('lastResetDate', today);
      }
    }, 'resetDailyHabits');
  };

  const calculateXP = (streak: number, difficulty: string = 'normal'): number => {
    const baseXP = {
      'easy': 5,
      'normal': 10,
      'hard': 20,
      'epic': 40
    }[difficulty] || 10;

    const streakBonus = Math.floor(streak / 3) * 5;
    const streakMultiplier = 1 + (streak * 0.1); // 10% increase per streak day

    return Math.floor((baseXP + streakBonus) * streakMultiplier);
  };

  const formatTimeSpent = (minutes: number): string => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Initialize
  loadFromStorage();
  if (user.value) {
    syncWithFirebase();
  }

  // Watch for user changes
  watch(user, (newUser) => {
    if (newUser) {
      syncWithFirebase();
    }
  });

  return {
    habits,
    newHabitName,
    addHabit,
    deleteHabit,
    updateHabit,
    toggleHabitCompletion,
    resetDailyHabits,
    formatTimeSpent,
    syncWithFirebase,
    isLoading
  };
}
