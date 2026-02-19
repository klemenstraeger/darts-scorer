<script setup lang="ts">
const props = defineProps<{
  label: string
  leftValue: number
  rightValue: number
  leftLabel?: string
  rightLabel?: string
  format?: 'number' | 'decimal' | 'percent'
}>()

const leftDisplay = computed(() => formatValue(props.leftValue))
const rightDisplay = computed(() => formatValue(props.rightValue))

function formatValue(v: number): string {
  if (props.format === 'percent')
    return `${v.toFixed(1)}%`
  if (props.format === 'decimal')
    return v.toFixed(1)
  return String(v)
}

const total = computed(() => props.leftValue + props.rightValue)

const leftPct = computed(() => {
  if (total.value === 0)
    return 50
  return (props.leftValue / total.value) * 100
})

const rightPct = computed(() => {
  if (total.value === 0)
    return 50
  return (props.rightValue / total.value) * 100
})

const leftWins = computed(() => props.leftValue > props.rightValue)
const rightWins = computed(() => props.rightValue > props.leftValue)
</script>

<template>
  <div class="comparison-row">
    <div class="comparison-value left" :class="{ winner: leftWins }">
      {{ leftDisplay }}
    </div>
    <div class="comparison-center">
      <div class="comparison-label">
        {{ label }}
      </div>
      <div class="comparison-track">
        <div
          class="comparison-fill left-fill"
          :class="{ winner: leftWins }"
          :style="{ width: `${leftPct}%` }"
        />
        <div
          class="comparison-fill right-fill"
          :class="{ winner: rightWins }"
          :style="{ width: `${rightPct}%` }"
        />
      </div>
    </div>
    <div class="comparison-value right" :class="{ winner: rightWins }">
      {{ rightDisplay }}
    </div>
  </div>
</template>

<style scoped>
.comparison-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
}

.comparison-value {
  min-width: 48px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  transition: color var(--duration-fast);
}

.comparison-value.left {
  text-align: right;
}

.comparison-value.right {
  text-align: left;
}

.comparison-value.winner {
  color: var(--gold);
}

.comparison-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.comparison-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
}

.comparison-track {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  overflow: hidden;
  gap: 2px;
}

.comparison-fill {
  height: 100%;
  transition: width 0.5s var(--ease-out);
  border-radius: 4px;
}

.left-fill {
  background: rgba(59, 130, 246, 0.35);
}

.left-fill.winner {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.5), rgba(255, 215, 0, 0.6));
}

.right-fill {
  background: rgba(239, 68, 68, 0.35);
}

.right-fill.winner {
  background: linear-gradient(270deg, rgba(239, 68, 68, 0.5), rgba(255, 215, 0, 0.6));
}
</style>
