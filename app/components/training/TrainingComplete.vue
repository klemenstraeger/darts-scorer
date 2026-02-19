<script setup lang="ts">
import type { TrainingModeState, TrainingStats } from '~/types/training'
import { TRAINING_MODES } from '~/types/training'

const props = defineProps<{
  state: TrainingModeState
  stats: TrainingStats | null
}>()

const emit = defineEmits<{
  newSession: []
  backToMenu: []
}>()

const modeInfo = computed(() =>
  TRAINING_MODES.find(m => m.mode === props.state.mode),
)

const statEntries = computed(() => {
  if (!props.stats)
    return []
  return Object.entries(props.stats)
    .filter(([key]) => key !== 'mode' && key !== 'totalDarts')
    .map(([key, value]) => ({
      label: formatLabel(key),
      value: formatValue(value),
    }))
})

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim()
}

function formatValue(value: unknown): string {
  if (typeof value === 'number') {
    if (Number.isInteger(value))
      return String(value)
    return (value as number).toFixed(1)
  }
  if (typeof value === 'boolean')
    return value ? 'Yes' : 'No'
  return String(value ?? '-')
}
</script>

<template>
  <div class="training-complete-overlay">
    <div class="complete-card">
      <div class="complete-title">
        Session Complete!
      </div>
      <div class="complete-mode">
        {{ modeInfo?.name ?? state.mode }}
      </div>

      <div class="complete-stats">
        <div class="stat-row highlight">
          <span class="stat-label">Total Darts</span>
          <span class="stat-value">{{ stats?.totalDarts ?? state.throws.length }}</span>
        </div>
        <div
          v-for="entry in statEntries"
          :key="entry.label"
          class="stat-row"
        >
          <span class="stat-label">{{ entry.label }}</span>
          <span class="stat-value">{{ entry.value }}</span>
        </div>
      </div>

      <div class="complete-actions">
        <button class="btn btn-gold" @click="emit('newSession')">
          Play Again
        </button>
        <NuxtLink to="/training" class="btn btn-secondary" @click="emit('backToMenu')">
          Back to Training
        </NuxtLink>
        <NuxtLink to="/training/stats" class="btn btn-secondary">
          View Stats
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.training-complete-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--spacing-lg);
}

.complete-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  max-width: 420px;
  width: 100%;
  animation: scale-in 0.5s var(--ease-spring);
}

.complete-title {
  font-size: 2.5rem;
  font-weight: 900;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: scale-in 0.5s var(--ease-spring);
}

.complete-mode {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.complete-stats {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) 0;
}

.stat-row.highlight {
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.stat-row.highlight .stat-value {
  color: var(--gold);
  font-size: 1.2rem;
}

.complete-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: 100%;
}

@keyframes scale-in {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
