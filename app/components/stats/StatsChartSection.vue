<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  badge?: string
}>()
</script>

<template>
  <div class="bg-surface-1 border-2 border-black rounded-md shadow-md p-lg">
    <div class="flex items-baseline justify-between gap-md mb-md">
      <div class="flex items-baseline gap-sm">
        <h3 class="section-title !mb-0">
          {{ title }}
        </h3>
        <span v-if="badge" class="text-[0.7rem] text-fg-muted uppercase tracking-widest">{{ badge }}</span>
      </div>
    </div>
    <p v-if="description" class="text-[0.72rem] text-fg-muted max-w-[420px] leading-relaxed mb-md">
      {{ description }}
    </p>
    <slot />
  </div>
</template>
