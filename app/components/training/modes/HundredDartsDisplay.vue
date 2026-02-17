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
  <div class="hd-display">
    <TrainingProgress
      :current="state.dartsThrown"
      :total="state.totalDarts"
      label="Darts"
      color="#8b5cf6"
    />

    <div class="hd-main">
      <div class="hd-target">
        <span class="hd-target-label">Target</span>
        <span class="hd-target-value">{{ targetLabel }}</span>
      </div>

      <div class="hd-stats-row">
        <div class="hd-stat">
          <span class="hd-stat-value">{{ state.hits }}</span>
          <span class="hd-stat-label">Hits</span>
        </div>
        <div class="hd-stat">
          <span class="hd-stat-value hd-rate">{{ hitRate }}%</span>
          <span class="hd-stat-label">Hit Rate</span>
        </div>
        <div class="hd-stat">
          <span class="hd-stat-value">{{ state.totalScore }}</span>
          <span class="hd-stat-label">Score</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hd-display {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.hd-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
}

.hd-target {
  text-align: center;
}

.hd-target-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.hd-target-value {
  display: block;
  font-size: 3.5rem;
  font-weight: 900;
  color: #8b5cf6;
  line-height: 1;
}

.hd-stats-row {
  display: flex;
  gap: var(--spacing-xl);
}

.hd-stat {
  text-align: center;
}

.hd-stat-value {
  display: block;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.hd-rate {
  color: #8b5cf6;
}

.hd-stat-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-top: 2px;
}
</style>
