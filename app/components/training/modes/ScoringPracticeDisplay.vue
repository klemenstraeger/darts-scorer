<script setup lang="ts">
import type { ScoringPracticeState } from '~/types/training'
import { throwPoints } from '~/types/game'

const props = defineProps<{
  state: ScoringPracticeState
}>()

const average = computed(() => {
  const rounds = props.state.roundScores
  if (rounds.length === 0) return '0.0'
  const total = rounds.reduce((s, r) => s + r, 0)
  return (total / rounds.length).toFixed(1)
})

const currentRoundScore = computed(() => {
  const throwCount = props.state.currentRoundThrows
  if (throwCount === 0) return 0
  const start = props.state.throws.length - throwCount
  let score = 0
  for (let i = Math.max(0, start); i < props.state.throws.length; i++) {
    score += props.state.throws[i]!.points
  }
  return score
})
</script>

<template>
  <div class="scoring-practice">
    <div class="sp-top">
      <TrainingProgress
        :current="state.roundScores.length"
        :total="state.totalRounds"
        label="Rounds"
        color="#22c55e"
      />
    </div>

    <div class="sp-main">
      <div class="sp-avg">
        <span class="sp-avg-label">3-Dart Average</span>
        <span class="sp-avg-value">{{ average }}</span>
      </div>

      <div class="sp-round">
        <span class="sp-round-label">Round {{ state.currentRound }}</span>
        <div class="sp-darts">
          <span
            v-for="slot in 3"
            :key="slot"
            class="sp-dart-slot"
            :class="{ filled: state.throws[state.throws.length - state.currentRoundThrows + slot - 1] }"
          >
            <template v-if="state.currentRoundThrows >= slot">
              {{ state.throws[state.throws.length - state.currentRoundThrows + slot - 1]?.points ?? 0 }}
            </template>
            <template v-else>&middot;</template>
          </span>
          <span v-if="state.currentRoundThrows > 0" class="sp-round-total">
            = {{ currentRoundScore }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="state.threshold > 0" class="sp-threshold">
      <span class="sp-threshold-label">Target: {{ state.threshold }}+</span>
      <span class="sp-threshold-count">
        {{ state.roundScores.filter(s => s >= state.threshold).length }}/{{ state.roundScores.length }} above
      </span>
    </div>
  </div>
</template>

<style scoped>
.scoring-practice {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.sp-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.sp-avg {
  text-align: center;
}

.sp-avg-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sp-avg-value {
  display: block;
  font-size: 3rem;
  font-weight: 900;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.sp-round {
  text-align: center;
}

.sp-round-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: var(--spacing-xs);
}

.sp-darts {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.sp-dart-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 44px;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.sp-dart-slot.filled {
  border-color: var(--border-gold);
  background: rgba(255, 215, 0, 0.06);
  color: var(--gold);
}

.sp-round-total {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.sp-threshold {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--surface-2);
  border-radius: var(--radius-sm);
}

.sp-threshold-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
}

.sp-threshold-count {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--gold);
  font-variant-numeric: tabular-nums;
}
</style>
