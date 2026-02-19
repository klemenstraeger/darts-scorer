<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 28 })
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 100 100"
    class="darts-logo"
  >
    <!-- Outer ring -->
    <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="4" opacity="0.25" />
    <!-- Middle ring -->
    <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="3.5" opacity="0.4" />
    <!-- Inner ring -->
    <circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" stroke-width="3" opacity="0.6" />
    <!-- Bullseye -->
    <circle cx="50" cy="50" r="6" fill="currentColor" />

    <!-- Dart (angled, hitting bullseye) -->
    <g transform="rotate(-45, 50, 50)">
      <!-- Dart shaft -->
      <line x1="50" y1="50" x2="50" y2="-4" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      <!-- Dart tip (embedded in bullseye) -->
      <line x1="50" y1="54" x2="50" y2="50" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
      <!-- Dart flights (tail feathers) -->
      <path d="M50,-4 L42,-16 L50,-8 Z" fill="currentColor" opacity="0.8" />
      <path d="M50,-4 L58,-16 L50,-8 Z" fill="currentColor" opacity="0.8" />
    </g>
  </svg>
</template>

<style scoped>
.darts-logo {
  color: var(--gold);
  flex-shrink: 0;
}
</style>
