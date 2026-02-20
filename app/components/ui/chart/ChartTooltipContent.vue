<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ChartConfig } from '.'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: 'line' | 'dot' | 'dashed'
  nameKey?: string
  labelKey?: string
  labelFormatter?: (d: number | Date) => string
  payload?: Record<string, any>
  config?: ChartConfig
  class?: HTMLAttributes['class']
  color?: string
  x?: number | Date
}>(), {
  payload: () => ({}),
  config: () => ({}),
  indicator: 'dot',
})

const payload = computed(() => {
  return Object.entries(props.payload).map(([key, value]) => {
    const itemConfig = props.config[key]
    const indicatorColor = props.config[key]?.color ?? props.payload.fill

    return { key, value, itemConfig, indicatorColor }
  }).filter(i => i.itemConfig)
})

const nestLabel = computed(() => Object.keys(props.payload).length === 1 && props.indicator !== 'dot')
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
  <div class="bg-surface-1 border-2 border-black rounded-md shadow-md px-3 py-2 min-w-[100px] text-[0.75rem]">
    <slot>
      <div v-if="!nestLabel && tooltipLabel" class="font-semibold text-fg mb-1">
        {{ tooltipLabel }}
      </div>
      <div class="flex flex-col gap-1">
        <div
          v-for="{ value, itemConfig, indicatorColor, key } in payload"
          :key="key"
          class="flex items-center gap-2"
        >
          <template v-if="!hideIndicator">
            <div
              class="w-2 h-2 rounded-sm shrink-0"
              :style="{ background: indicatorColor }"
            />
          </template>

          <div class="flex flex-1 justify-between items-center gap-3">
            <span class="text-fg-muted">
              {{ itemConfig?.label || key }}
            </span>
            <span v-if="value != null" class="font-semibold text-fg tabular-nums">
              {{ typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value }}
            </span>
          </div>
        </div>
      </div>
    </slot>
  </div>
</template>
