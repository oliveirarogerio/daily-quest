<script setup lang="ts">
defineProps<{
  msg: string;
}>();
</script>

<template>
  <h1>{{ msg }}</h1>
</template>

<style scoped>
h1 {
  color: #6a5acd;
  text-shadow: 0 0 5px rgba(106, 90, 205, 0.7);
}
</style>
