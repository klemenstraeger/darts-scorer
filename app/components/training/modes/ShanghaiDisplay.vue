<script setup lang="ts">
import type { ShanghaiState } from '~/types/training'

const props = defineProps<{
  state: ShanghaiState
}>()

const currentRoundScore = computed(() => {
  const ct = props.state.currentRoundThrows
  if (ct === 0) return 0
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
  <div class="shanghai-display">
    <TrainingProgress
      :current="state.roundScores.length"
      :total="20"
      label="Rounds"
      color="#14b8a6"
    />

    <div class="sh-main">
      <div class="sh-target">
        <span class="sh-target-label">Target</span>
        <span class="sh-target-value">{{ state.currentRound }}</span>
        <span class="sh-dart-count">
          Dart {{ state.currentRoundThrows + 1 }} of 3
        </span>
      </div>

      <div class="sh-scores">
        <div class="sh-stat">
          <span class="sh-stat-value sh-total">{{ state.totalScore }}</span>
          <span class="sh-stat-label">Total</span>
        </div>
        <div class="sh-stat">
          <span class="sh-stat-value">{{ currentRoundScore }}</span>
          <span class="sh-stat-label">Round</span>
        </div>
        <div v-if="state.shanghaiCount > 0" class="sh-stat">
          <span class="sh-stat-value sh-shanghai">{{ state.shanghaiCount }}</span>
          <span class="sh-stat-label">Shanghai!</span>
        </div>
      </div>
    </div>

    <div class="sh-hits" v-if="state.currentRoundThrows > 0">
      <span class="sh-hit-badge" :class="{ active: state.currentRoundHits.single }">S</span>
      <span class="sh-hit-badge" :class="{ active: state.currentRoundHits.double }">D</span>
      <span class="sh-hit-badge" :class="{ active: state.currentRoundHits.treble }">T</span>
    </div>
  </div>
</template>

<style scoped>
.shanghai-display {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.sh-main {
  display: flex;
  justify-content: center;
  gap: var(--spacing-2xl);
  align-items: center;
}

.sh-target {
  text-align: center;
}

.sh-target-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.sh-target-value {
  display: block;
  font-size: 3.5rem;
  font-weight: 900;
  color: #14b8a6;
  line-height: 1;
}

.sh-dart-count {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
}

.sh-scores {
  display: flex;
  gap: var(--spacing-lg);
}

.sh-stat {
  text-align: center;
}

.sh-stat-value {
  display: block;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.sh-total {
  color: #14b8a6;
}

.sh-shanghai {
  color: var(--gold);
}

.sh-stat-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-top: 2px;
}

.sh-hits {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
}

.sh-hit-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 28px;
  font-size: 0.85rem;
  font-weight: 800;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  transition: all 0.2s var(--ease-out);
}

.sh-hit-badge.active {
  background: rgba(20, 184, 166, 0.15);
  color: #14b8a6;
  border-color: rgba(20, 184, 166, 0.3);
}
</style>
