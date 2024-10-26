<script setup lang="ts">
import Dashboard from './src/components/Dashboard.vue';
</script>

<template>
 <div>
    <Dashboard/>
  <h1 class="text-lg text-blue">App</h1>
    <NuxtLayout>
      <NuxtPage/>
    </NuxtLayout>
  </div>
</template>
