<script setup lang="ts">
const props = defineProps<{
  current: number
  total: number
  label?: string
  color?: string
}>()

const percentage = computed(() =>
  props.total > 0 ? Math.round((props.current / props.total) * 100) : 0,
)
</script>

<template>
  <div class="training-progress">
    <div class="progress-header">
      <span v-if="label" class="progress-label">{{ label }}</span>
      <span class="progress-count">{{ current }}/{{ total }}</span>
    </div>
    <div class="progress-track">
      <div
        class="progress-fill"
        :style="{ width: `${percentage}%`, background: color ?? 'var(--gold)' }"
      />
    </div>
  </div>
</template>

<style scoped>
.training-progress {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.progress-count {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.progress-track {
  width: 100%;
  height: 6px;
  background: var(--surface-2);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s var(--ease-out);
}
</style>
