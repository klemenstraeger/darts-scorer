<script setup lang="ts">
const props = defineProps<{
  current: number
  total: number
  label?: string
  color?: string
}>()

const percentage = computed(() =>
  props.total > 0 ? Math.round((props.current / props.total) * 100) : 0,
)
</script>

<template>
  <div class="w-full flex flex-col gap-[4px]">
    <div class="flex justify-between items-center">
      <span v-if="label" class="text-[0.75rem] font-bold text-fg-muted uppercase tracking-[0.5px]">{{ label }}</span>
      <span class="text-[0.8rem] font-bold text-fg-secondary tabular-nums">{{ current }}/{{ total }}</span>
    </div>
    <div class="w-full h-[8px] bg-surface-2 border-2 border-black overflow-hidden">
      <div
        class="h-full transition-[width] duration-300 ease-out"
        :style="{ width: `${percentage}%`, background: color ?? 'var(--yellow)' }"
      />
    </div>
  </div>
</template>
