import { ref, computed, watch } from 'vue';
import { useCurrentUser } from 'vuefire';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useFirebaseError } from './useFirebaseError';
import type { PlayerState, Rank } from '../types/habit';

export function usePlayer() {
  const user = useCurrentUser();
  const { wrapFirebaseOperation, isLoading } = useFirebaseError();

  // Initialize state from localStorage or defaults
  const loadInitialState = () => {
    try {
      const savedLevel = localStorage.getItem('level');
      const savedXp = localStorage.getItem('xp');
      const savedRank = localStorage.getItem('rank');
      return {
        level: savedLevel ? parseInt(savedLevel) : 1,
        xp: savedXp ? parseInt(savedXp) : 0,
        rank: (savedRank || 'E') as Rank
      };
    } catch (error) {
      console.error('Error loading initial state:', error);
      return {
        level: 1,
        xp: 0,
        rank: 'E' as Rank
      };
    }
  };

  const { level: initialLevel, xp: initialXp, rank: initialRank } = loadInitialState();
  const level = ref(initialLevel);
  const xp = ref(initialXp);
  const currentRank = ref(initialRank);
  const showLevelUpAnimation = ref(false);
  const showRankUpAnimation = ref(false);

  const xpToNextLevel = computed(() => Math.floor(level.value * 150 * (1 + level.value * 0.1)));

  const xpPercentage = computed(() => {
    return Math.min((xp.value / xpToNextLevel.value) * 100, 100);
  });

  // Solo Leveling inspired ranks
  const ranks = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'] as const;
  const rankThresholds: Record<Rank, number> = {
    'E': 1,    // Starting rank
    'D': 10,   // Level 10
    'C': 20,   // Level 20
    'B': 35,   // Level 35
    'A': 50,   // Level 50
    'S': 70,   // Level 70
    'SS': 85,  // Level 85
    'SSS': 100 // Level 100
  };

  const rank = computed(() => {
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (level.value >= rankThresholds[ranks[i]]) {
        return ranks[i] as Rank;
      }
    }
    return 'E' as Rank;
  });

  const addXP = async (amount: number) => {
    return await wrapFirebaseOperation(async () => {
      const oldRank = rank.value;
      xp.value += amount;
      await checkLevelUp();

      // Check for rank up
      if (rank.value !== oldRank) {
        showRankUpAnimation.value = true;
        setTimeout(() => {
          showRankUpAnimation.value = false;
        }, 3000);
      }
    }, 'addXP');
  };

  const removeXP = async (amount: number) => {
    return await wrapFirebaseOperation(async () => {
      xp.value = Math.max(0, xp.value - amount);
      await savePlayerState();
    }, 'removeXP');
  };

  const checkLevelUp = async () => {
    return await wrapFirebaseOperation(async () => {
      while (xp.value >= xpToNextLevel.value) {
        xp.value -= xpToNextLevel.value;
        level.value++;
        showLevelUpAnimation.value = true;
        setTimeout(() => {
          showLevelUpAnimation.value = false;
        }, 3000);
      }
      await savePlayerState();
    }, 'checkLevelUp');
  };

  // Sync with Firebase
  const syncWithFirebase = async () => {
    if (!user.value) return;

    return await wrapFirebaseOperation(async () => {
      const playerRef = doc(db, 'players', user.value!.uid);
      const playerDoc = await getDoc(playerRef);

      if (playerDoc.exists()) {
        const data = playerDoc.data() as PlayerState;
        // Only update if Firebase data is higher level
        if (data.level > level.value) {
          level.value = data.level;
          xp.value = data.xp;
          currentRank.value = data.rank;
        }
      } else {
        // If no Firebase data, save current state
        await savePlayerState();
      }
    }, 'syncWithFirebase');
  };

  // Save state to localStorage and Firebase
  const savePlayerState = async () => {
    return await wrapFirebaseOperation(async () => {
      // Save to localStorage
      localStorage.setItem('level', level.value.toString());
      localStorage.setItem('xp', xp.value.toString());
      localStorage.setItem('rank', rank.value);

      // Save to Firebase if logged in
      if (user.value) {
        const playerRef = doc(db, 'players', user.value.uid);
        await setDoc(playerRef, {
          level: level.value,
          xp: xp.value,
          rank: rank.value,
          lastUpdated: new Date()
        });
      }
    }, 'savePlayerState');
  };

  // Watch for changes and save state
  watch([level, xp], async () => {
    await savePlayerState();
  }, { deep: true });

  const loadPlayerState = async () => {
    return await wrapFirebaseOperation(async () => {
      const { level: savedLevel, xp: savedXp } = loadInitialState();
      level.value = savedLevel;
      xp.value = savedXp;

      if (user.value) {
        await syncWithFirebase();
      }
    }, 'loadPlayerState');
  };

  return {
    level,
    xp,
    xpToNextLevel,
    xpPercentage,
    rank,
    addXP,
    removeXP,
    loadPlayerState,
    showLevelUpAnimation,
    showRankUpAnimation,
    ranks,
    rankThresholds,
    isLoading
  };
}
