<script setup lang="ts">
import type { HundredDartsState } from '~/types/training'

const props = defineProps<{
  state: HundredDartsState
}>()

const hitRate = computed(() =>
  props.state.dartsThrown > 0
    ? Math.round((props.state.hits / props.state.dartsThrown) * 100)
    : 0,
)

const targetLabel = computed(() => {
  const s = props.state.targetSegment
  return s === 25 ? 'Bull' : String(s)
})
</script>

<template>
  <div class="flex flex-col gap-md">
    <TrainingProgress
      :current="state.dartsThrown"
      :total="state.totalDarts"
      label="Darts"
      color="#8b5cf6"
    />

    <div class="flex flex-col items-center gap-lg">
      <div class="text-center">
        <span class="block text-xs font-bold text-fg-muted uppercase">Target</span>
        <span class="block text-[3.5rem] font-black text-[#8b5cf6] leading-none">{{ targetLabel }}</span>
      </div>

      <div class="flex gap-xl">
        <div class="text-center">
          <span class="block text-[1.8rem] font-extrabold text-fg tabular-nums leading-none">{{ state.hits }}</span>
          <span class="block text-[0.7rem] font-bold text-fg-muted uppercase mt-[2px]">Hits</span>
        </div>
        <div class="text-center">
          <span class="block text-[1.8rem] font-extrabold text-[#8b5cf6] tabular-nums leading-none">{{ hitRate }}%</span>
          <span class="block text-[0.7rem] font-bold text-fg-muted uppercase mt-[2px]">Hit Rate</span>
        </div>
        <div class="text-center">
          <span class="block text-[1.8rem] font-extrabold text-fg tabular-nums leading-none">{{ state.totalScore }}</span>
          <span class="block text-[0.7rem] font-bold text-fg-muted uppercase mt-[2px]">Score</span>
        </div>
      </div>
    </div>
  </div>
</template>
