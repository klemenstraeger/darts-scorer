<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  badge?: string
}>()
</script>

<template>
  <div class="glass-card p-lg">
    <div class="flex items-baseline justify-between gap-md mb-md">
      <div class="flex items-baseline gap-sm">
        <h3 class="section-title !mb-0">
          {{ title }}
        </h3>
        <span v-if="badge" class="text-[0.7rem] text-fg-muted uppercase tracking-widest">{{ badge }}</span>
      </div>
    </div>
    <p v-if="description" class="chart-description">
      {{ description }}
    </p>
    <slot />
  </div>
</template>

<style scoped>
.chart-description {
  font-size: 0.72rem;
  color: var(--text-muted);
  max-width: 420px;
  line-height: 1.5;
  margin-bottom: var(--spacing-md);
}
</style>
