<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick, onUpdated } from 'vue';
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

// Force reactivity for the XP bar
const updateXPBar = () => {
  console.log('🔥 [GameStatusBar] FORCE UPDATE - Current XP values:', {
    xp: xp.value,
    xpToNextLevel: xpToNextLevel.value,
    xpPercentage: xpPercentage.value
  });

  // Force DOM update by manipulating DOM directly as a last resort
  if (xpBarRef.value) {
    const barElement = xpBarRef.value.querySelector('.xp-bar') as HTMLElement;
    if (barElement) {
      const calculatedWidth = Math.min((xp.value / xpToNextLevel.value) * 100, 100);
      console.log('🔥 [GameStatusBar] Directly setting width to:', calculatedWidth + '%');
      barElement.style.width = calculatedWidth + '%';

      // Also update the text
      const textElement = xpBarRef.value.querySelector('.xp-text') as HTMLElement;
      if (textElement) {
        textElement.textContent = `${formatXP(xp.value)} / ${formatXP(xpToNextLevel.value)} XP`;
      }
    }
  }

  // Update the currentXpWidth as well (for when Vue decides to re-render)
  currentXpWidth.value = xpPercentage.value;
};

// Watch XP with an immediate callback that forces updates
watch(() => xp.value, (newValue) => {
  console.log('🔥 [GameStatusBar] XP CHANGED:', newValue);
  setTimeout(updateXPBar, 50);
}, { immediate: true });

// Also watch computations to detect changes
watch(() => xpPercentage.value, (newValue) => {
  console.log('🔥 [GameStatusBar] XP PERCENTAGE CHANGED:', newValue);
  setTimeout(updateXPBar, 50);
});

// Track recent XP changes for animations
watch(() => recentXPGain.value, (newValue) => {
  console.log('🔍 [GameStatusBar] recentXPGain changed:', newValue);

  if (newValue !== 0) {
    xpGainAmount.value = newValue;
    showXPGain.value = true;
    xpBarGlowing.value = true;

    console.log('🔍 [GameStatusBar] Showing XP gain animation:', newValue);

    // Force XP bar update
    updateXPBar();

    setTimeout(() => {
      showXPGain.value = false;
      // Update again after animation
      updateXPBar();
    }, 2000);

    setTimeout(() => {
      xpBarGlowing.value = false;
      // Update again after glow effect
      updateXPBar();
    }, 3000);
  }
});

// Get XP bar position for animations
onMounted(async () => {
  console.log('🔍 [GameStatusBar] Component mounted');
  xpBarRef.value = document.querySelector('.xp-bar-container');

  // Ensure player state is loaded
  await loadPlayerState();
  console.log('🔍 [GameStatusBar] Player state loaded');

  // Force immediate update after player state is loaded
  updateXPBar();

  // Set up a global event for XP updates
  window.addEventListener('xp-updated', (event) => {
    console.log('🔥 [GameStatusBar] Received xp-updated event', event);

    // Check if we got a CustomEvent with detail
    const customEvent = event as CustomEvent;
    if (customEvent.detail && customEvent.detail.forceUpdate) {
      console.log('🔥 [GameStatusBar] Received force update flag in xp-updated event');

      // Force the forceUpdateTrigger to increment, causing Vue to re-render
      forceUpdateTrigger.value++;

      // Force an immediate DOM update
      nextTick(() => {
        updateXPBar();
      });
    } else {
      // Still update even without the force flag
      updateXPBar();
    }
  });

  // Also listen for the complete event, which happens after all processing is done
  window.addEventListener('xp-updated-complete', () => {
    console.log('🔥 [GameStatusBar] Received xp-updated-complete event');

    // Update after a small delay to ensure all other operations are complete
    setTimeout(() => {
      console.log('🔥 [GameStatusBar] Running delayed updateXPBar after complete event');
      forceUpdateTrigger.value++;
      updateXPBar();
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
        <div
          v-if="showXPGain"
          class="xp-gain"
          :class="{ 'positive': xpGainAmount > 0, 'negative': xpGainAmount < 0 }"
        >
          {{ xpGainAmount > 0 ? '+' : '' }}{{ xpGainAmount }}
        </div>
      </div>

      <div class="xp-bar-container" ref="xpBarRef" @click="toggleXPHistory" :class="{ 'glowing': xpBarGlowing }">
        <div class="xp-bar" :style="{ width: currentXpWidth + '%' }"></div>
        <span class="xp-text">{{ formatXP(xp) }} / {{ formatXP(xpToNextLevel) }} {{ t('player.xp') }}</span>
      </div>

      <!-- Element that forces reactivity update when key changes -->
      <div style="display: none;">{{ forceUpdateTrigger }}</div>

      <!-- XP Animation Container -->


      <!-- XP History Panel -->
      <transition name="slide-down">
        <div v-if="showXPHistory" class="xp-history-panel">
          <div class="history-header">
            <h3>{{ t('player.recentXP') }}</h3>
            <div class="total-xp">{{ t('player.totalXP') }}: {{ formatXP(totalXPEarned) }}</div>
          </div>
          <ul class="history-list">
            <li v-for="(item, index) in recentHistory" :key="index"
                :class="{ 'positive': item.amount > 0, 'negative': item.amount < 0 }">
              <div class="history-amount">{{ item.amount > 0 ? '+' : '' }}{{ item.amount }}</div>
              <div class="history-source">{{ item.source }}</div>
              <div class="history-time">{{ new Date(item.timestamp).toLocaleTimeString() }}</div>
            </li>
            <li v-if="recentHistory.length === 0" class="empty-history">
              {{ t('player.noHistory') }}
            </li>
          </ul>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
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

.player-status.has-unread {
  border: 1px solid rgba(255, 215, 0, 0.5);
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.2);
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
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
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
  transition: all 0.3s ease;
}

.level-up .level-badge {
  background: gold;
  border-color: white;
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
  color: #fff;
  font-size: 1.3rem;
  text-shadow: 0 0 5px rgba(106, 90, 205, 0.7);
}

.xp-gain {
  font-weight: bold;
  font-size: 1.2rem;
  animation: fadeInOut 2s;
  padding: 2px 8px;
  border-radius: 4px;
  min-width: 60px;
  text-align: center;
}

.xp-gain.positive {
  color: #4caf50;
  background: rgba(76, 175, 80, 0.2);
}

.xp-gain.negative {
  color: #f44336;
  background: rgba(244, 67, 54, 0.2);
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(-10px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; }
  100% { opacity: 0; }
}

.xp-bar-container {
  height: 18px;
  background-color: #2a2a3a;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  border: 1px solid #6a5acd;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
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
  background: linear-gradient(90deg, #6a5acd, #9370db);
  /* Change transition to be faster */
  transition: width 0.2s ease-out;
  position: relative;
  overflow: hidden;
  min-width: 1px; /* Ensure empty bars still show a minimum amount */
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

/* XP Animation */
.floating-xp {
  position: fixed;
  font-weight: bold;
  font-size: 1.5rem;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  animation: floatToXPBar 1.5s forwards;
  z-index: 1000;
  pointer-events: none;
}

@keyframes floatToXPBar {
  0% { transform: scale(1) translateY(0); opacity: 1; }
  70% { transform: scale(1.2) translateY(-20px); opacity: 1; }
  100% { transform: scale(0.5) translateY(-50px); opacity: 0; }
}

/* XP History Panel */
.xp-history-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(20, 20, 35, 0.95);
  border-radius: 0 0 10px 10px;
  margin-top: 5px;
  padding: 12px;
  z-index: 10;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(106, 90, 205, 0.3);
  max-height: 200px;
  overflow-y: auto;
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
  color: #fff;
}

.total-xp {
  font-size: 0.9rem;
  color: #9370db;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.history-list li:last-child {
  border-bottom: none;
}

.history-amount {
  font-weight: bold;
  width: 60px;
}

.history-amount.positive {
  color: #4caf50;
}

.history-amount.negative {
  color: #f44336;
}

.history-source {
  flex: 1;
  margin: 0 10px;
  font-size: 0.9rem;
  color: #ddd;
}

.history-time {
  font-size: 0.8rem;
  color: #999;
}

.empty-history {
  text-align: center;
  color: #999;
  padding: 10px 0;
}

/* Transitions */
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
  transition: all 0.5s ease;
}

.float-enter-from,
.float-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .player-status {
    flex-direction: column;
    text-align: center;
    padding: 12px;
  }

  .player-rank {
    margin-right: 0;
    margin-bottom: 10px;
  }

  .player-icon {
    margin-right: 0;
    margin-bottom: 10px;
  }

  .level-row {
    justify-content: center;
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
</style>
