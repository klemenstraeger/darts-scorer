<script setup lang="ts">
import type { AroundTheClockState } from '~/types/training'

const props = defineProps<{
  state: AroundTheClockState
}>()

const currentTarget = computed(() =>
  props.state.targets[props.state.currentTargetIndex] ?? null,
)

const currentTargetLabel = computed(() => {
  const t = currentTarget.value
  if (t === null) return 'Done'
  return t === 25 ? 'Bull' : String(t)
})
</script>

<template>
  <div class="atc-display">
    <TrainingProgress
      :current="state.currentTargetIndex"
      :total="state.targets.length"
      label="Progress"
      color="#3b82f6"
    />

    <div class="atc-main">
      <span class="atc-variant">{{ state.variant }}</span>
      <div class="atc-target">
        <span class="atc-target-label">Current Target</span>
        <span class="atc-target-value">{{ currentTargetLabel }}</span>
      </div>
      <span class="atc-darts">{{ state.totalDarts }} darts thrown</span>
    </div>

    <div class="atc-grid">
      <span
        v-for="(target, i) in state.targets"
        :key="target"
        class="atc-num"
        :class="{
          hit: i < state.currentTargetIndex,
          current: i === state.currentTargetIndex,
        }"
      >
        {{ target === 25 ? 'B' : target }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.atc-display {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.atc-main {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.atc-variant {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.atc-target {
  text-align: center;
}

.atc-target-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.atc-target-value {
  display: block;
  font-size: 3.5rem;
  font-weight: 900;
  color: #3b82f6;
  line-height: 1;
}

.atc-darts {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.atc-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.atc-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
  transition: all 0.2s var(--ease-out);
}

.atc-num.hit {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border-color: rgba(59, 130, 246, 0.3);
}

.atc-num.current {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border-color: #3b82f6;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);
}
</style>
