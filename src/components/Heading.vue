<template>
  <h1 :class="headingClasses">
    <slot></slot>
  </h1>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  font?: 'default' | 'minecraft'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'lg',
  font: 'default',
})

const headingClasses = computed(() => {
  const baseClasses = 'font-semibold text-text-main'

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    '2xl': 'text-4xl',
    '3xl': 'text-5xl',
  }

  const fontClasses = {
    default: '',
    minecraft: 'font-minecraft',
  }

  return `${baseClasses} ${sizeClasses[props.size]} ${fontClasses[props.font]}`
})
</script>
