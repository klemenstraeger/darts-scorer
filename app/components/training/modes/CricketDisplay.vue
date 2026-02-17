<script setup lang="ts">
import type { CricketState } from '~/types/training'

const props = defineProps<{
  state: CricketState
}>()

const closedCount = computed(() =>
  props.state.targets.filter(t => (props.state.marks[t] ?? 0) >= 3).length,
)

function targetLabel(t: number): string {
  return t === 25 ? 'Bull' : String(t)
}

function marksDisplay(t: number): string[] {
  const marks = props.state.marks[t] ?? 0
  const result: string[] = []
  for (let i = 0; i < 3; i++) {
    result.push(i < marks ? '/' : '')
  }
  return result
}
</script>

<template>
  <div class="cricket-display">
    <TrainingProgress
      :current="closedCount"
      :total="state.targets.length"
      label="Closed"
      color="#ec4899"
    />

    <div class="cricket-main">
      <span class="cricket-darts">{{ state.totalDarts }} darts</span>

      <div class="cricket-grid">
        <div
          v-for="target in state.targets"
          :key="target"
          class="cricket-row"
          :class="{ closed: (state.marks[target] ?? 0) >= 3 }"
        >
          <span class="cricket-target">{{ targetLabel(target) }}</span>
          <div class="cricket-marks">
            <span
              v-for="(mark, i) in marksDisplay(target)"
              :key="i"
              class="cricket-mark"
              :class="{ filled: mark === '/' }"
            >
              {{ mark || '·' }}
            </span>
          </div>
          <span
            v-if="(state.marks[target] ?? 0) >= 3"
            class="cricket-closed-badge"
          >CLOSED</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cricket-display {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.cricket-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.cricket-darts {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.cricket-grid {
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.cricket-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.cricket-row.closed {
  background: rgba(236, 72, 153, 0.08);
  border-color: rgba(236, 72, 153, 0.2);
}

.cricket-target {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  min-width: 40px;
}

.cricket-row.closed .cricket-target {
  color: #ec4899;
}

.cricket-marks {
  display: flex;
  gap: var(--spacing-sm);
}

.cricket-mark {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-muted);
  width: 20px;
  text-align: center;
}

.cricket-mark.filled {
  color: #ec4899;
}

.cricket-closed-badge {
  margin-left: auto;
  font-size: 0.6rem;
  font-weight: 800;
  color: #ec4899;
  text-transform: uppercase;
  letter-spacing: 1px;
}
</style>
