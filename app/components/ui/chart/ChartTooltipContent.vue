<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import type { ChartConfig } from "."
import { computed } from "vue"

const props = withDefaults(defineProps<{
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "line" | "dot" | "dashed"
  nameKey?: string
  labelKey?: string
  labelFormatter?: (d: number | Date) => string
  payload?: Record<string, any>
  config?: ChartConfig
  class?: HTMLAttributes["class"]
  color?: string
  x?: number | Date
}>(), {
  payload: () => ({}),
  config: () => ({}),
  indicator: "dot",
})

const payload = computed(() => {
  return Object.entries(props.payload).map(([key, value]) => {
    const itemConfig = props.config[key]
    const indicatorColor = props.config[key]?.color ?? props.payload.fill

    return { key, value, itemConfig, indicatorColor }
  }).filter(i => i.itemConfig)
})

const nestLabel = computed(() => Object.keys(props.payload).length === 1 && props.indicator !== "dot")
const tooltipLabel = computed(() => {
  if (props.hideLabel)
    return null
  if (props.labelFormatter && props.x !== undefined) {
    return props.labelFormatter(props.x)
  }
  return props.labelKey ? props.config[props.labelKey]?.label || props.payload[props.labelKey] : props.x
})
</script>

<template>
  <div class="chart-tooltip">
    <slot>
      <div v-if="!nestLabel && tooltipLabel" class="tooltip-label">
        {{ tooltipLabel }}
      </div>
      <div class="tooltip-items">
        <div
          v-for="{ value, itemConfig, indicatorColor, key } in payload"
          :key="key"
          class="tooltip-row"
        >
          <template v-if="!hideIndicator">
            <div
              class="tooltip-dot"
              :style="{ background: indicatorColor }"
            />
          </template>

          <div class="tooltip-content">
            <span class="tooltip-key">
              {{ itemConfig?.label || key }}
            </span>
            <span v-if="value != null" class="tooltip-value">
              {{ typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value }}
            </span>
          </div>
        </div>
      </div>
    </slot>
  </div>
</template>

<style scoped>
.chart-tooltip {
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--surface-glass-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 8px 12px;
  min-width: 100px;
  font-size: 0.75rem;
  font-family: var(--font-sans);
}

.tooltip-label {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.tooltip-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tooltip-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tooltip-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.tooltip-content {
  display: flex;
  flex: 1;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.tooltip-key {
  color: var(--text-muted);
}

.tooltip-value {
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  font-family: var(--font-sans);
}
</style>
