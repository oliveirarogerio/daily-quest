<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  level: number;
  xp: number;
  xpToNextLevel: number;
}

const props = defineProps<Props>();

const xpPercentage = computed(() => (props.xp / props.xpToNextLevel) * 100);

const rank = computed(() => {
  if (props.level >= 50) return 'S';
  if (props.level >= 40) return 'A';
  if (props.level >= 30) return 'B';
  if (props.level >= 20) return 'C';
  if (props.level >= 10) return 'D';
  return 'E';
});
</script>

<template>
  <div class="player-status">
    <div class="player-rank">
      <div class="rank-label">RANK</div>
      <div class="rank-value">{{ rank }}</div>
    </div>

    <div class="player-icon">
      <img src="../assets/hunter-icon.svg" alt="Hunter Icon" />
      <div class="level-badge">{{ level }}</div>
    </div>

    <div class="player-info">
      <h2>Hunter Level {{ level }}</h2>
      <div class="xp-bar-container">
        <div class="xp-bar" :style="{ width: xpPercentage + '%' }"></div>
        <span class="xp-text">{{ xp }} / {{ xpToNextLevel }} XP</span>
      </div>
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
}
</style>
