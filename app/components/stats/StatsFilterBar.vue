<script setup lang="ts">
interface FilterState {
  from: string | null
  to: string | null
  mode: string | null
}

const emit = defineEmits<{
  (e: 'update', value: FilterState): void
}>()

const activeDate = ref<'7d' | '30d' | '90d' | 'all'>('all')
const activeMode = ref<'all' | '501' | '301'>('all')

const datePresets = [
  { key: '7d' as const, label: '7d' },
  { key: '30d' as const, label: '30d' },
  { key: '90d' as const, label: '90d' },
  { key: 'all' as const, label: 'All' },
]

const modeOptions = [
  { key: 'all' as const, label: 'All' },
  { key: '501' as const, label: '501' },
  { key: '301' as const, label: '301' },
]

function getDateRange(preset: typeof activeDate.value): { from: string | null; to: string | null } {
  if (preset === 'all') return { from: null, to: null }
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90
  const from = new Date()
  from.setDate(from.getDate() - days)
  return { from: from.toISOString(), to: null }
}

function selectDate(key: typeof activeDate.value) {
  activeDate.value = key
  emitUpdate()
}

function selectMode(key: typeof activeMode.value) {
  activeMode.value = key
  emitUpdate()
}

function emitUpdate() {
  const { from, to } = getDateRange(activeDate.value)
  emit('update', {
    from,
    to,
    mode: activeMode.value === 'all' ? null : activeMode.value,
  })
}

</script>

<template>
  <div class="filter-bar">
    <div class="filter-group">
      <span class="filter-label">Period</span>
      <div class="filter-pills">
        <button
          v-for="preset in datePresets"
          :key="preset.key"
          class="filter-pill"
          :class="{ active: activeDate === preset.key }"
          @click="selectDate(preset.key)"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>
    <div class="filter-group">
      <span class="filter-label">Mode</span>
      <div class="filter-pills">
        <button
          v-for="opt in modeOptions"
          :key="opt.key"
          class="filter-pill"
          :class="{ active: activeMode === opt.key }"
          @click="selectMode(opt.key)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filter-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.filter-pills {
  display: flex;
  gap: var(--spacing-xs);
}

.filter-pill {
  padding: 4px 12px;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background var(--duration-fast),
    border-color var(--duration-fast),
    color var(--duration-fast);
}

.filter-pill:hover {
  background: var(--surface-3);
}

.filter-pill.active {
  background: var(--blue-tint);
  border-color: rgba(59, 130, 246, 0.3);
  color: var(--blue);
  font-weight: 600;
}
</style>
