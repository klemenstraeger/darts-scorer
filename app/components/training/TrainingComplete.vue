<script setup lang="ts">
import type { TrainingModeState, TrainingStats } from '~/types/training'
import { TRAINING_MODES } from '~/types/training'

const props = defineProps<{
  state: TrainingModeState
  stats: TrainingStats | null
}>()

const emit = defineEmits<{
  newSession: []
  backToMenu: []
}>()

const modeInfo = computed(() =>
  TRAINING_MODES.find(m => m.mode === props.state.mode),
)

const statEntries = computed(() => {
  if (!props.stats)
    return []
  return Object.entries(props.stats)
    .filter(([key]) => key !== 'mode' && key !== 'totalDarts')
    .map(([key, value]) => ({
      label: formatLabel(key),
      value: formatValue(value),
    }))
})

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim()
}

function formatValue(value: unknown): string {
  if (typeof value === 'number') {
    if (Number.isInteger(value))
      return String(value)
    return (value as number).toFixed(1)
  }
  if (typeof value === 'boolean')
    return value ? 'Yes' : 'No'
  return String(value ?? '-')
}
</script>

<template>
  <div class="fixed inset-0 bg-black/85 flex items-center justify-center z-100 p-lg">
    <div class="flex flex-col items-center gap-lg max-w-[420px] w-full" style="animation: scale-in 0.5s var(--ease-spring);">
      <div class="text-[2.5rem] font-black text-yellow" style="animation: scale-in 0.5s var(--ease-spring);">
        Session Complete!
      </div>
      <div class="text-[1rem] font-semibold text-fg-muted uppercase tracking-[1px]">
        {{ modeInfo?.name ?? state.mode }}
      </div>

      <div class="w-full flex flex-col gap-xs bg-surface-1 border-2 border-black rounded-md p-md shadow-md">
        <div class="flex justify-between items-center py-xs border-b-2 border-black pb-sm mb-xs">
          <span class="text-[0.85rem] font-semibold text-fg-muted">Total Darts</span>
          <span class="text-[1.2rem] font-bold text-yellow tabular-nums">{{ stats?.totalDarts ?? state.throws.length }}</span>
        </div>
        <div
          v-for="entry in statEntries"
          :key="entry.label"
          class="flex justify-between items-center py-xs"
        >
          <span class="text-[0.85rem] font-semibold text-fg-muted">{{ entry.label }}</span>
          <span class="text-[1rem] font-bold text-fg tabular-nums">{{ entry.value }}</span>
        </div>
      </div>

      <div class="flex flex-col gap-sm w-full">
        <Button variant="default" @click="emit('newSession')">
          Play Again
        </Button>
        <NuxtLink
          to="/training"
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all h-9 px-4 py-2 text-sm rounded-lg bg-surface-2 border-2 border-black shadow-md font-bold hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
          @click="emit('backToMenu')"
        >
          Back to Training
        </NuxtLink>
        <NuxtLink
          to="/training/stats"
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all h-9 px-4 py-2 text-sm rounded-lg bg-surface-2 border-2 border-black shadow-md font-bold hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
        >
          View Stats
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
