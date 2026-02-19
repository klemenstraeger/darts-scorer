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
  <div class="bobs27-display">
    <TrainingProgress
      :current="state.roundResults.filter(r => r !== null).length"
      :total="21"
      label="Rounds"
      color="#f59e0b"
    />

    <div class="b27-main">
      <div class="b27-score-block">
        <span class="b27-score-label">Score</span>
        <span class="b27-score" :style="{ color: scoreColor }">{{ state.score }}</span>
      </div>

      <div class="b27-target">
        <span class="b27-target-label">Target</span>
        <span class="b27-target-value">{{ targetLabel }}</span>
        <span class="b27-dart-count">
          Dart {{ state.currentRoundThrows + 1 }} of 3
        </span>
      </div>
    </div>

    <div class="b27-rounds">
      <span
        v-for="(result, i) in state.roundResults"
        :key="i"
        class="b27-round"
        :class="{
          hit: result === 'hit',
          miss: result === 'miss',
          current: i === state.currentRound - 1 && result === null,
        }"
      >
        {{ i < 20 ? `D${i + 1}` : 'DB' }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.bobs27-display {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.b27-main {
  display: flex;
  justify-content: center;
  gap: var(--spacing-2xl);
  align-items: center;
}

.b27-score-block {
  text-align: center;
}

.b27-score-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.b27-score {
  display: block;
  font-size: 3.5rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  transition: color 0.3s;
}

.b27-target {
  text-align: center;
}

.b27-target-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.b27-target-value {
  display: block;
  font-size: 2.5rem;
  font-weight: 900;
  color: #f59e0b;
  line-height: 1;
}

.b27-dart-count {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
}

.b27-rounds {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  justify-content: center;
}

.b27-round {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 24px;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
  transition: all 0.2s var(--ease-out);
}

.b27-round.hit {
  background: rgba(34, 197, 94, 0.15);
  color: var(--green);
  border-color: rgba(34, 197, 94, 0.3);
}

.b27-round.miss {
  background: rgba(239, 68, 68, 0.12);
  color: var(--red);
  border-color: rgba(239, 68, 68, 0.25);
}

.b27-round.current {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.15);
}
</style>
