<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { usePlayer } from '../composables/usePlayer';
import { useI18n } from '../composables/useI18n';

const {
  level,
  xp,
  xpToNextLevel,
  xpPercentage,
  rank,
  recentXPGain,
  hasUnreadLevelUp,
  hasUnreadRankUp,
  acknowledgeLevel,
  acknowledgeRank,
  loadPlayerState
} = usePlayer();

const { t } = useI18n();

// Animation states
const showXPGain = ref(false);
const xpGainAmount = ref(0);
const xpBarRef = ref<HTMLElement | null>(null);
const xpBarGlowing = ref(false);
const currentXpWidth = ref(xpPercentage.value);
const forceUpdateTrigger = ref(0); // Add a trigger for forcing updates

// XP history display
const showXPHistory = ref(false);

/**
 * updateXPBar - Core function for updating the XP bar display in the UI
 *
 * This function ensures the XP bar visual state matches the actual data state by:
 * 1. First updating the reactive Vue ref (currentXpWidth) to trigger template updates
 * 2. Then directly manipulating the DOM for immediate visual feedback
 * 3. Using nextTick to ensure DOM changes happen after Vue's rendering cycle
 * 4. Using hardware acceleration (transform: translateZ(0)) for smooth animations
 *
 * The function works in tandem with various event listeners and watchers to ensure
 * consistent UI state across asynchrounous operations.
 */
const updateXPBar = () => {
  console.log('🔥 [GameStatusBar] FORCE UPDATE - Current XP values:', {
    xp: xp.value,
    xpToNextLevel: xpToNextLevel.value,
    xpPercentage: xpPercentage.value,
    currentWidth: currentXpWidth.value
  });

  // Update the currentXpWidth first to trigger Vue's reactivity
  currentXpWidth.value = xpPercentage.value;

  // Force DOM update by manipulating DOM directly after a small delay
  nextTick(() => {
    if (xpBarRef.value) {
      const barElement = xpBarRef.value.querySelector('.xp-bar') as HTMLElement;
      if (barElement) {
        const calculatedWidth = Math.min((xp.value / xpToNextLevel.value) * 100, 100);
        console.log('🔥 [GameStatusBar] Setting bar width to:', calculatedWidth + '%');

        // Add transition class for smooth animation
        barElement.style.transition = 'width 0.3s ease-out';
        barElement.style.width = calculatedWidth + '%';

        // Also update the text
        const textElement = xpBarRef.value.querySelector('.xp-text') as HTMLElement;
        if (textElement) {
          textElement.textContent = `${formatXP(xp.value)} / ${formatXP(xpToNextLevel.value)} XP`;
        }
      }
    }
  });
};

/**
 * XP and Level Watchers and Event Handlers
 *
 * The system uses multiple coordination mechanisms to ensure reliable updates:
 * 1. Vue watchers - Track reactive state changes (xp, xpToNextLevel)
 * 2. Custom events - Allow cross-component communication for XP updates
 * 3. DOM manipulation - For immediate visual feedback
 * 4. Multiple update checks - To handle edge cases and race conditions
 *
 * This multi-layered approach ensures the XP bar updates correctly even during
 * rapid changes, animations, and when multiple components modify the XP state.
 */

// Watch XP with an immediate callback that forces updates
watch([() => xp.value, () => xpToNextLevel.value], ([newXP, newXPToNext], [oldXP, oldXPToNext]) => {
  console.log('🔥 [GameStatusBar] XP or XPToNext CHANGED:', {
    newXP,
    oldXP,
    newXPToNext,
    oldXPToNext
  });

  // Force immediate update
  nextTick(() => {
    updateXPBar();
  });
}, { immediate: true });

// Track recent XP changes for animations
watch(() => recentXPGain.value, (newValue, oldValue) => {
  console.log('🔍 [GameStatusBar] recentXPGain changed:', { newValue, oldValue });

  if (newValue !== 0) {
    // Update XP gain display
    xpGainAmount.value = newValue;
    showXPGain.value = true;
    xpBarGlowing.value = true;

    // Force immediate XP bar update
    nextTick(() => {
      updateXPBar();
    });

    // Hide XP gain number after animation
    setTimeout(() => {
      showXPGain.value = false;
      nextTick(() => {
        updateXPBar();
      });
    }, 2000);

    // Remove glow effect
    setTimeout(() => {
      xpBarGlowing.value = false;
      nextTick(() => {
        updateXPBar();
      });
    }, 3000);
  }
});

/**
 * Component Initialization and Event Setup
 *
 * On mount, the component:
 * 1. Gets a reference to the XP bar DOM element for direct manipulation
 * 2. Loads the initial player state (level, XP, etc.)
 * 3. Sets up global event listeners for XP updates from other components
 * 4. Forces an initial update to ensure the XP bar is in the correct state
 *
 * The event listeners handle both immediate updates and delayed/completion updates,
 * with multiple safeguards to ensure visual consistency.
 */

// Get XP bar position for animations and set up event listeners
onMounted(async () => {
  console.log('🔍 [GameStatusBar] Component mounted');

  // Get reference to XP bar container
  xpBarRef.value = document.querySelector('.xp-bar-container');

  // Ensure player state is loaded
  await loadPlayerState();
  console.log('🔍 [GameStatusBar] Player state loaded');

  // Force immediate update after player state is loaded
  updateXPBar();

  // Set up event listeners for XP updates
  window.addEventListener('xp-updated', (event) => {
    console.log('🔥 [GameStatusBar] Received xp-updated event', event);
    const customEvent = event as CustomEvent;

    if (customEvent.detail) {
      // Update XP bar with new values if provided
      if (customEvent.detail.xp !== undefined) {
        xp.value = customEvent.detail.xp;
      }

      // Force update if requested
      if (customEvent.detail.forceUpdate) {
        forceUpdateTrigger.value++;
        nextTick(() => {
          updateXPBar();
        });
      }
    }

    // Always update the bar to ensure synchronization
    updateXPBar();
  });

  // Handle completion events
  window.addEventListener('xp-updated-complete', (event) => {
    console.log('🔥 [GameStatusBar] Received xp-updated-complete event');
    const customEvent = event as CustomEvent;

    // Ensure final values are displayed correctly
    setTimeout(() => {
      console.log('🔥 [GameStatusBar] Applying final XP update');
      forceUpdateTrigger.value++;
      updateXPBar();

      // Double-check update after a brief delay
      setTimeout(() => {
        updateXPBar();
      }, 100);
    }, 50);
  });
});

const toggleXPHistory = () => {
  showXPHistory.value = !showXPHistory.value;
  console.log('🔍 [GameStatusBar] XP history visibility toggled:', showXPHistory.value);
};

// Format XP values for display
const formatXP = (value: number): string => {
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'k';
  }
  return value.toString();
};
</script>

<template>
  <div class="player-status" :class="{ 'has-unread': hasUnreadLevelUp || hasUnreadRankUp }">
    <div class="player-rank" @click="acknowledgeRank" :class="{ 'rank-up': hasUnreadRankUp }">
      <div class="rank-label">{{ t('player.rank') }}</div>
      <div class="rank-value">{{ rank }}</div>
    </div>

    <div class="player-icon" @click="acknowledgeLevel" :class="{ 'level-up': hasUnreadLevelUp }">
      <img src="../assets/hunter-icon.svg" alt="Hunter Icon" />
      <div class="level-badge">{{ level }}</div>
    </div>

    <div class="player-info">
      <div class="level-row">
        <h2>{{ t('player.level') }} {{ level }}</h2>
        <transition name="float">
          <div
            v-if="showXPGain"
            class="xp-gain"
            :class="{ 'positive': xpGainAmount > 0, 'negative': xpGainAmount < 0 }"
          >
            {{ xpGainAmount > 0 ? '+' : '' }}{{ xpGainAmount }}
          </div>
        </transition>
      </div>

      <div
        class="xp-bar-container"
        ref="xpBarRef"
        @click="toggleXPHistory"
        :class="{ 'glowing': xpBarGlowing }"
      >
        <div
          class="xp-bar"
          :style="{
            width: currentXpWidth + '%',
            transition: 'width 0.3s ease-out'
          }"
        ></div>
        <span class="xp-text">
          {{ formatXP(xp) }} / {{ formatXP(xpToNextLevel) }} {{ t('player.xp') }}
        </span>
      </div>

      <!-- Hidden element to force reactivity updates -->
      <div style="display: none;">
        {{ forceUpdateTrigger }}
        {{ xp }}
        {{ xpToNextLevel }}
        {{ currentXpWidth }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-status {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  background: linear-gradient(135deg, rgba(12, 12, 30, 0.9), rgba(15, 15, 35, 0.95));
  border-radius: 0;
  padding: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(106, 90, 205, 0.3);
  position: relative;
  overflow: hidden;
}

.player-status.has-unread {
  border: 1px solid rgba(255, 215, 0, 0.5);
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.2);
}

/* Solo Leveling style blue pattern */
.player-status::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%236a5acd' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.2;
  z-index: 0;
}

.player-rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 15px;
  z-index: 1;
  cursor: pointer;
  transition: all 0.3s ease;
}

.player-rank:hover {
  transform: scale(1.05);
}

.player-rank.rank-up {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); filter: drop-shadow(0 0 3px rgba(106, 90, 205, 0.5)); }
  50% { transform: scale(1.1); filter: drop-shadow(0 0 10px rgba(106, 90, 205, 0.8)); }
  100% { transform: scale(1); filter: drop-shadow(0 0 3px rgba(106, 90, 205, 0.5)); }
}

.rank-label {
  font-size: 0.8rem;
  color: #a990ff;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.rank-value {
  width: 38px;
  height: 38px;
  background-color: rgba(10, 10, 25, 0.8);
  border: 2px solid #6a5acd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.3rem;
  color: #a990ff;
  box-shadow: 0 0 10px rgba(106, 90, 205, 0.5);
  position: relative;
  /* Solo Leveling hexagonal shape */
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  transition: all 0.3s ease;
}

.rank-value::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  right: 3px;
  bottom: 3px;
  background-color: transparent;
  border: 1px solid rgba(169, 144, 255, 0.3);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  z-index: 1;
  pointer-events: none;
}

.rank-up .rank-value {
  border-color: gold;
  color: gold;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
}

.player-icon {
  width: 70px;
  height: 70px;
  position: relative;
  margin-right: 15px;
  z-index: 1;
  cursor: pointer;
  transition: all 0.3s ease;
}

.player-icon::before {
  content: '';
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  z-index: -1;

}

.player-icon:hover {
  transform: scale(1.05);
}

.player-icon.level-up {
  animation: glow 2s infinite;
}

@keyframes glow {
  0% { filter: drop-shadow(0 0 5px rgba(106, 90, 205, 0.5)); }
  50% { filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.7)); }
  100% { filter: drop-shadow(0 0 5px rgba(106, 90, 205, 0.5)); }
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
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border: 2px solid rgba(10, 10, 25, 0.8);
  box-shadow: 0 0 10px rgba(106, 90, 205, 0.7);
  font-size: 0.9rem;
  transition: all 0.3s ease;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

.level-up .level-badge {
  background: gold;
  border-color: rgba(10, 10, 25, 0.8);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
}

.player-info {
  flex: 1;
  z-index: 1;
  position: relative;
}

.level-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.player-info h2 {
  margin: 0 0 8px;
  color: #e0e0ff;
  font-size: 1.3rem;
  text-shadow: 0 0 5px rgba(106, 90, 205, 0.7);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.xp-gain {
  font-weight: bold;
  font-size: 1.2rem;
  animation: fadeInOut 2s;
  padding: 2px 8px;
  border-radius: 0;
  min-width: 60px;
  text-align: center;
  /* Solo Leveling angular shape */
  clip-path: polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%);
}

.xp-gain.positive {
  color: #50ef9f;
  background: rgba(80, 239, 159, 0.15);
  border: 1px solid rgba(80, 239, 159, 0.3);
}

.xp-gain.negative {
  color: #ff6060;
  background: rgba(255, 96, 96, 0.15);
  border: 1px solid rgba(255, 96, 96, 0.3);
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(-10px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; }
  100% { opacity: 0; }
}

.xp-bar-container {
  height: 18px;
  background-color: rgba(20, 20, 40, 0.8);
  border-radius: 0;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(106, 90, 205, 0.4);
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0% 0%, 100% 0%, 98% 100%, 2% 100%);
}

.xp-bar-container:hover {
  border-color: rgba(106, 90, 205, 0.8);
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5), 0 0 5px rgba(106, 90, 205, 0.3);
}

.xp-bar-container.glowing {
  border-color: #f0c420;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5), 0 0 15px rgba(240, 196, 32, 0.5);
  animation: borderPulse 2s ease-in-out;
}

@keyframes borderPulse {
  0% { border-color: #6a5acd; box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5); }
  50% { border-color: #f0c420; box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5), 0 0 15px rgba(240, 196, 32, 0.5); }
  100% { border-color: #6a5acd; box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5); }
}

.xp-bar {
  height: 100%;
  background: linear-gradient(90deg, #341c8c, #6a5acd);
  position: relative;
  overflow: hidden;
  min-width: 1px;
  will-change: width;
  transform: translateZ(0);
}

.xp-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.2) 20%,
    rgba(255, 255, 255, 0.1) 40%,
    rgba(255, 255, 255, 0.2) 60%,
    rgba(255, 255, 255, 0.05) 100%);
  transform: skewX(-20deg);
  animation: shimmer 1.5s infinite;
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
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  font-size: 0.9rem;
  letter-spacing: 0.5px;
}

.xp-history-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(10, 10, 25, 0.95);
  border-radius: 0;
  margin-top: 5px;
  padding: 12px;
  z-index: 10;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(106, 90, 205, 0.3);
  max-height: 200px;
  overflow-y: auto;
  clip-path: polygon(
    0% 0%,
    97% 0%,
    100% 10%,
    100% 100%,
    3% 100%,
    0% 90%,
    0% 0%
  );
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(106, 90, 205, 0.3);
  padding-bottom: 5px;
}

.history-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #e0e0ff;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.total-xp {
  font-size: 0.9rem;
  color: #a990ff;
  font-weight: 500;
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.history-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid rgba(106, 90, 205, 0.2);
}

.history-list li:last-child {
  border-bottom: none;
}

.history-amount {
  font-weight: bold;
  width: 60px;
}

.history-amount.positive {
  color: #50ef9f;
}

.history-amount.negative {
  color: #ff6060;
}

.history-source {
  flex: 1;
  margin: 0 10px;
  font-size: 0.9rem;
  color: #c0c0f0;
}

.history-time {
  font-size: 0.8rem;
  color: #8080c0;
}

.empty-history {
  text-align: center;
  color: #8080c0;
  padding: 10px 0;
  font-style: italic;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.float-enter-active,
.float-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.float-enter-from,
.float-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.float-enter-to,
.float-leave-from {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 768px) {
  .player-status {
    flex-direction: row;
    align-items: center;
    padding: 12px 10px;
    text-align: left;
  }

  .player-rank {
    margin-right: 12px;
    margin-bottom: 0;
  }

  .player-icon {
    width: 60px;
    height: 60px;
    margin-right: 12px;
    margin-bottom: 0;
  }

  .player-info {
    flex: 1;
  }

  .level-row {
    justify-content: space-between;
  }

  .player-info h2 {
    font-size: 1.1rem;
    margin-bottom: 6px;
  }

  .xp-text {
    font-size: 0.8rem;
  }

  .xp-bar-container {
    height: 16px;
  }

  .xp-gain {
    position: absolute;
    top: 0;
    right: 0;
  }

  .xp-history-panel {
    position: fixed;
    top: 50%;
    left: 5%;
    right: 5%;
    transform: translateY(-50%);
    max-height: 80vh;
    z-index: 1001;
  }
}

@media (max-width: 480px) {
  .player-status {
    padding: 10px 8px;
  }

  .player-rank {
    margin-right: 8px;
  }

  .rank-value {
    width: 34px;
    height: 34px;
    font-size: 1.1rem;
  }

  .player-icon {
    width: 50px;
    height: 50px;
    margin-right: 10px;
  }

  .level-badge {
    width: 22px;
    height: 22px;
    font-size: 0.8rem;
  }

  .player-info h2 {
    font-size: 1rem;
    margin-bottom: 4px;
  }

  .xp-bar-container {
    height: 14px;
  }

  .xp-text {
    font-size: 0.75rem;
  }
}
</style>
