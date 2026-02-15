<script setup lang="ts">
defineProps<{
  count: number
}>()
</script>

<template>
  <div class="marks-container">
    <template v-if="count === 0">
      <span class="mark-empty">&nbsp;</span>
    </template>
    <template v-else-if="count === 1">
      <!-- Single slash / -->
      <svg class="mark-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
        <line x1="6" y1="18" x2="18" y2="6" />
      </svg>
    </template>
    <template v-else-if="count === 2">
      <!-- X mark -->
      <svg class="mark-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
        <line x1="6" y1="18" x2="18" y2="6" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </template>
    <template v-else>
      <!-- Circled X (closed) -->
      <svg class="mark-svg mark-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <circle cx="12" cy="12" r="10" stroke-width="2" />
        <line x1="7" y1="17" x2="17" y2="7" />
        <line x1="7" y1="7" x2="17" y2="17" />
      </svg>
    </template>
  </div>
</template>

<style scoped>
.marks-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.mark-empty {
  width: 24px;
  height: 24px;
}

.mark-svg {
  width: 24px;
  height: 24px;
  color: var(--text-secondary);
}

.mark-closed {
  color: var(--green);
}
</style>
