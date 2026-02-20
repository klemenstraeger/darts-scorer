<script setup lang="ts">
import type { Bobs27State } from '~/types/training'

const props = defineProps<{
  state: Bobs27State
}>()

const targetLabel = computed(() => {
  const round = props.state.currentRound
  return round <= 20 ? `D${round}` : 'D-Bull'
})

const scoreColor = computed(() => {
  if (props.state.isFailed)
    return 'var(--red)'
  if (props.state.score >= 100)
    return 'var(--green)'
  if (props.state.score >= 27)
    return 'var(--text-primary)'
  return '#f59e0b'
})
</script>

<template>
  <div class="flex flex-col gap-md">
    <TrainingProgress
      :current="state.roundResults.filter(r => r !== null).length"
      :total="21"
      label="Rounds"
      color="#f59e0b"
    />

    <div class="flex justify-center gap-2xl items-center">
      <div class="text-center">
        <span class="block text-xs font-bold text-fg-muted uppercase">Score</span>
        <span
          class="block text-[3.5rem] font-black tabular-nums leading-none transition-colors duration-300"
          :style="{ color: scoreColor }"
        >{{ state.score }}</span>
      </div>

      <div class="text-center">
        <span class="block text-xs font-bold text-fg-muted uppercase">Target</span>
        <span class="block text-[2.5rem] font-black text-[#f59e0b] leading-none">{{ targetLabel }}</span>
        <span class="block text-xs font-semibold text-fg-muted mt-xs">
          Dart {{ state.currentRoundThrows + 1 }} of 3
        </span>
      </div>
    </div>

    <div class="flex flex-wrap gap-[3px] justify-center">
      <span
        v-for="(result, i) in state.roundResults"
        :key="i"
        class="flex items-center justify-center w-[36px] h-[24px] text-[0.65rem] font-bold border-2 border-black transition-all duration-200"
        :class="{
          'bg-[#dcfce7] text-green': result === 'hit',
          'bg-[#fee2e2] text-red': result === 'miss',
          'border-[#f59e0b] bg-[#fef3c7] text-[#f59e0b] shadow-sm': i === state.currentRound - 1 && result === null,
          'bg-surface-2 text-fg-muted': result !== 'hit' && result !== 'miss' && !(i === state.currentRound - 1 && result === null),
        }"
      >
        {{ i < 20 ? `D${i + 1}` : 'DB' }}
      </span>
    </div>
  </div>
</template>
