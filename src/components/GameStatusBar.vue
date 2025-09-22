<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { usePlayer } from '../composables/usePlayer'
import Heading from './Heading.vue'

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
  loadPlayerState,
} = usePlayer()

// Animation states
const showXPGain = ref(false)
const xpGainAmount = ref(0)
const xpBarRef = ref<HTMLElement | null>(null)
const xpBarGlowing = ref(false)
const currentXpWidth = ref(xpPercentage.value)
const forceUpdateTrigger = ref(0) // Add a trigger for forcing updates

// XP history display
const showXPHistory = ref(false)

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
    currentWidth: currentXpWidth.value,
  })

  // Update the currentXpWidth first to trigger Vue's reactivity
  currentXpWidth.value = xpPercentage.value

  // Force DOM update by manipulating DOM directly after a small delay
  nextTick(() => {
    if (xpBarRef.value) {
      const barElement = xpBarRef.value.querySelector('.xp-bar') as HTMLElement
      if (barElement) {
        const calculatedWidth = Math.min((xp.value / xpToNextLevel.value) * 100, 100)
        console.log('🔥 [GameStatusBar] Setting bar width to:', calculatedWidth + '%')

        // Add transition class for smooth animation
        barElement.style.transition = 'width 0.3s ease-out'
        barElement.style.width = calculatedWidth + '%'

        // Also update the text
        const textElement = xpBarRef.value.querySelector('.xp-text') as HTMLElement
        if (textElement) {
          textElement.textContent = `${formatXP(xp.value)} / ${formatXP(xpToNextLevel.value)} XP`
        }
      }
    }
  })
}

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
watch(
  [() => xp.value, () => xpToNextLevel.value],
  ([newXP, newXPToNext], [oldXP, oldXPToNext]) => {
    console.log('🔥 [GameStatusBar] XP or XPToNext CHANGED:', {
      newXP,
      oldXP,
      newXPToNext,
      oldXPToNext,
    })

    // Force immediate update
    nextTick(() => {
      updateXPBar()
    })
  },
  { immediate: true },
)

// Track recent XP changes for animations
watch(
  () => recentXPGain.value,
  (newValue, oldValue) => {
    console.log('🔍 [GameStatusBar] recentXPGain changed:', { newValue, oldValue })

    if (newValue !== 0) {
      // Update XP gain display
      xpGainAmount.value = newValue
      showXPGain.value = true
      xpBarGlowing.value = true

      // Force immediate XP bar update
      nextTick(() => {
        updateXPBar()
      })

      // Hide XP gain number after animation
      setTimeout(() => {
        showXPGain.value = false
        nextTick(() => {
          updateXPBar()
        })
      }, 2000)

      // Remove glow effect
      setTimeout(() => {
        xpBarGlowing.value = false
        nextTick(() => {
          updateXPBar()
        })
      }, 3000)
    }
  },
)

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
  ;('🔍 [GameStatusBar] Component mounted')

  // Get reference to XP bar container
  xpBarRef.value = document.querySelector('.xp-bar-container')

  // Ensure player state is loaded
  await loadPlayerState()
  console.log('🔍 [GameStatusBar] Player state loaded')

  // Force immediate update after player state is loaded
  updateXPBar()

  // Set up event listeners for XP updates
  window.addEventListener('xp-updated', (event) => {
    console.log('🔥 [GameStatusBar] Received xp-updated event', event)
    const customEvent = event as CustomEvent

    if (customEvent.detail) {
      // Update XP bar with new values if provided
      if (customEvent.detail.xp !== undefined) {
        xp.value = customEvent.detail.xp
      }

      // Force update if requested
      if (customEvent.detail.forceUpdate) {
        forceUpdateTrigger.value++
        nextTick(() => {
          updateXPBar()
        })
      }
    }

    // Always update the bar to ensure synchronization
    updateXPBar()
  })

  // Handle completion events
  window.addEventListener('xp-updated-complete', () => {
    console.log('🔥 [GameStatusBar] Received xp-updated-complete event')

    // Ensure final values are displayed correctly
    setTimeout(() => {
      console.log('🔥 [GameStatusBar] Applying final XP update')
      forceUpdateTrigger.value++
      updateXPBar()

      // Double-check update after a brief delay
      setTimeout(() => {
        updateXPBar()
      }, 100)
    }, 50)
  })
})

const toggleXPHistory = () => {
  showXPHistory.value = !showXPHistory.value
  console.log('🔍 [GameStatusBar] XP history visibility toggled:', showXPHistory.value)
}

// Format XP values for display
const formatXP = (value: number): string => {
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'k'
  }
  return value.toString()
}
</script>

<template>
  <div
    class="bg-surface-light shadow-sm rounded-lg p-6 border border-gray-200"
    :class="{ 'ring-2 ring-primary': hasUnreadLevelUp || hasUnreadRankUp }"
  >
    <div class="flex items-center space-x-6">
      <div
        class="text-center cursor-pointer"
        @click="acknowledgeRank"
        :class="{ 'animate-pulse': hasUnreadRankUp }"
      >
        <div class="text-sm text-text-secondary mb-1">RANK</div>
        <div
          class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg"
        >
          {{ rank }}
        </div>
      </div>

      <div
        class="text-center cursor-pointer"
        @click="acknowledgeLevel"
        :class="{ 'animate-pulse': hasUnreadLevelUp }"
      >
        <div class="relative">
          <img src="../assets/hunter-icon.svg" alt="Hunter Icon" class="w-16 h-16" />
          <div
            class="absolute -bottom-2 -right-2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          >
            {{ level }}
          </div>
        </div>
      </div>

      <div class="flex-1">
        <div class="flex items-center justify-between mb-3">
          <Heading size="md">Player Level {{ level }}</Heading>
          <transition name="fade-in-scale">
            <div
              v-if="showXPGain"
              class="text-lg font-bold px-3 py-1 rounded"
              :class="xpGainAmount > 0 ? 'text-success bg-green-100' : 'text-danger bg-red-100'"
            >
              {{ xpGainAmount > 0 ? '+' : '' }}{{ xpGainAmount }}
            </div>
          </transition>
        </div>

        <div
          class="w-full bg-gray-200 rounded-full h-6 cursor-pointer"
          ref="xpBarRef"
          @click="toggleXPHistory"
          :class="{ 'ring-2 ring-primary': xpBarGlowing }"
        >
          <div
            class="bg-primary h-6 rounded-full transition-all duration-300 ease-out"
            :style="{
              width: currentXpWidth + '%',
            }"
          ></div>
          <div
            class="relative -mt-6 h-6 flex items-center justify-center text-sm font-medium text-white"
          >
            {{ formatXP(xp) }} / {{ formatXP(xpToNextLevel) }} XP
          </div>
        </div>

        <!-- Hidden element to force reactivity updates -->
        <div class="hidden">
          {{ forceUpdateTrigger }}
          {{ xp }}
          {{ xpToNextLevel }}
          {{ currentXpWidth }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Minimal custom styles - most styling handled by Tailwind */
.fade-in-scale-enter-active,
.fade-in-scale-leave-active {
  transition: all 0.3s ease;
}

.fade-in-scale-enter-from,
.fade-in-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
