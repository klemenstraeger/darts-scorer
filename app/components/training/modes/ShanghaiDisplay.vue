<script setup lang="ts">
import type { ShanghaiState } from '~/types/training'

const props = defineProps<{
  state: ShanghaiState
}>()

const currentRoundScore = computed(() => {
  const ct = props.state.currentRoundThrows
  if (ct === 0)
    return 0
  const start = props.state.throws.length - ct
  let score = 0
  for (let i = Math.max(0, start); i < props.state.throws.length; i++) {
    const t = props.state.throws[i]!
    if (t.segment === props.state.currentRound) {
      score += t.segment * t.multiplier
    }
  }
  return score
})
</script>

<template>
  <div class="flex flex-col gap-md">
    <TrainingProgress
      :current="state.roundScores.length"
      :total="20"
      label="Rounds"
      color="#14b8a6"
    />

    <div class="flex justify-center gap-2xl items-center">
      <div class="text-center">
        <span class="block text-xs font-bold text-fg-muted uppercase">Target</span>
        <span class="block text-[3.5rem] font-black text-[#14b8a6] leading-none">{{ state.currentRound }}</span>
        <span class="block text-xs font-semibold text-fg-muted mt-xs">
          Dart {{ state.currentRoundThrows + 1 }} of 3
        </span>
      </div>

      <div class="flex gap-lg">
        <div class="text-center">
          <span class="block text-[1.8rem] font-extrabold text-[#14b8a6] tabular-nums leading-none">{{ state.totalScore }}</span>
          <span class="block text-[0.7rem] font-bold text-fg-muted uppercase mt-[2px]">Total</span>
        </div>
        <div class="text-center">
          <span class="block text-[1.8rem] font-extrabold text-fg tabular-nums leading-none">{{ currentRoundScore }}</span>
          <span class="block text-[0.7rem] font-bold text-fg-muted uppercase mt-[2px]">Round</span>
        </div>
        <div v-if="state.shanghaiCount > 0" class="text-center">
          <span class="block text-[1.8rem] font-extrabold text-yellow tabular-nums leading-none">{{ state.shanghaiCount }}</span>
          <span class="block text-[0.7rem] font-bold text-fg-muted uppercase mt-[2px]">Shanghai!</span>
        </div>
      </div>
    </div>

    <div v-if="state.currentRoundThrows > 0" class="flex justify-center gap-sm">
      <span
        class="flex items-center justify-center w-[36px] h-[28px] text-[0.85rem] font-extrabold border-2 border-black transition-all duration-200"
        :class="state.currentRoundHits.single ? 'bg-[#ccfbf1] text-[#14b8a6]' : 'bg-surface-2 text-fg-muted'"
      >S</span>
      <span
        class="flex items-center justify-center w-[36px] h-[28px] text-[0.85rem] font-extrabold border-2 border-black transition-all duration-200"
        :class="state.currentRoundHits.double ? 'bg-[#ccfbf1] text-[#14b8a6]' : 'bg-surface-2 text-fg-muted'"
      >D</span>
      <span
        class="flex items-center justify-center w-[36px] h-[28px] text-[0.85rem] font-extrabold border-2 border-black transition-all duration-200"
        :class="state.currentRoundHits.treble ? 'bg-[#ccfbf1] text-[#14b8a6]' : 'bg-surface-2 text-fg-muted'"
      >T</span>
    </div>
  </div>
</template>
