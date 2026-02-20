<script setup lang="ts">
import type { ScoringPracticeState } from '~/types/training'

const props = defineProps<{
  state: ScoringPracticeState
}>()

const average = computed(() => {
  const rounds = props.state.roundScores
  if (rounds.length === 0)
    return '0.0'
  const total = rounds.reduce((s, r) => s + r, 0)
  return (total / rounds.length).toFixed(1)
})

const currentRoundScore = computed(() => {
  const throwCount = props.state.currentRoundThrows
  if (throwCount === 0)
    return 0
  const start = props.state.throws.length - throwCount
  let score = 0
  for (let i = Math.max(0, start); i < props.state.throws.length; i++) {
    score += props.state.throws[i]!.points
  }
  return score
})
</script>

<template>
  <div class="flex flex-col gap-md">
    <div>
      <TrainingProgress
        :current="state.roundScores.length"
        :total="state.totalRounds"
        label="Rounds"
        color="#22c55e"
      />
    </div>

    <div class="flex flex-col items-center gap-md">
      <div class="text-center">
        <span class="block text-xs font-bold text-fg-muted uppercase tracking-wide">3-Dart Average</span>
        <span class="block text-5xl font-black text-fg tabular-nums leading-none">{{ average }}</span>
      </div>

      <div class="text-center">
        <span class="block text-sm font-bold text-fg-muted uppercase mb-xs">Round {{ state.currentRound }}</span>
        <div class="flex items-center gap-sm">
          <span
            v-for="slot in 3"
            :key="slot"
            class="flex items-center justify-center w-[52px] h-[44px] border-2 border-black text-base font-bold tabular-nums"
            :class="state.throws[state.throws.length - state.currentRoundThrows + slot - 1]
              ? 'bg-yellow-light text-yellow'
              : 'bg-surface-2 text-fg-muted'"
          >
            <template v-if="state.currentRoundThrows >= slot">
              {{ state.throws[state.throws.length - state.currentRoundThrows + slot - 1]?.points ?? 0 }}
            </template>
            <template v-else>&middot;</template>
          </span>
          <span v-if="state.currentRoundThrows > 0" class="text-xl font-extrabold text-fg tabular-nums">
            = {{ currentRoundScore }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="state.threshold > 0" class="flex justify-between items-center px-sm py-xs bg-surface-2 rounded-sm">
      <span class="text-sm font-semibold text-fg-muted">Target: {{ state.threshold }}+</span>
      <span class="text-sm font-bold text-yellow tabular-nums">
        {{ state.roundScores.filter(s => s >= state.threshold).length }}/{{ state.roundScores.length }} above
      </span>
    </div>
  </div>
</template>
