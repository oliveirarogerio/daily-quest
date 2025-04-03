<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from '../composables/useI18n';

const props = defineProps<{
  isRefreshing: boolean;
  pullOffset: number;
  threshold: number;
}>();

const emit = defineEmits<{
  (event: 'refresh'): void;
}>();

const { t } = useI18n();

const progress = computed(() => Math.min(1, props.pullOffset / props.threshold));
const indicatorStyle = computed(() => ({
  transform: `translateY(${props.pullOffset}px) rotate(${progress.value * 360}deg)`,
  opacity: progress.value
}));
</script>

<template>
  <div class="pull-to-refresh" :class="{ refreshing: isRefreshing }">
    <div class="pull-indicator" :style="indicatorStyle">
      <div class="indicator-content">
        <div class="refresh-icon">↻</div>
        <span class="refresh-text">
          {{ isRefreshing ? t('actions.refreshing') : t('actions.pullToRefresh') }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pull-to-refresh {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  z-index: 10;
}

.pull-indicator {
  background: linear-gradient(135deg, rgba(28, 28, 45, 0.95), rgba(20, 20, 35, 0.95));
  border-radius: 12px;
  padding: 8px 16px;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(106, 90, 205, 0.2);
  transition: transform 0.2s ease;
}

.indicator-content {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
}

.refresh-icon {
  font-size: 1.2rem;
  transition: transform 0.2s ease;
}

.refreshing .refresh-icon {
  animation: spin 1s linear infinite;
}

.refresh-text {
  font-size: 0.9rem;
  white-space: nowrap;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
