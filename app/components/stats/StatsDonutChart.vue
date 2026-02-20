<script setup lang="ts">
import { VisDonut, VisSingleContainer, VisTooltip } from '@unovis/vue'
import { computed } from 'vue'

export interface DonutDatum {
  label: string
  value: number
  color?: string
}

const props = withDefaults(defineProps<{
  data: DonutDatum[]
  size?: number
  centralLabel?: string
  centralSubLabel?: string
}>(), {
  size: 180,
})

const total = computed(() => props.data.reduce((sum, d) => sum + d.value, 0))

const colors = computed(() => props.data.map(d => d.color ?? 'var(--text-muted)'))

const legendItems = computed(() =>
  props.data.map(d => ({
    label: d.label,
    value: d.value,
    pct: total.value > 0 ? ((d.value / total.value) * 100).toFixed(1) : '0',
    color: d.color ?? 'var(--text-muted)',
  })),
)

function tooltipTemplate(d: any) {
  const datum = d?.data ?? d
  const label = datum?.label ?? ''
  const value = datum?.value ?? 0
  const pct = total.value > 0 ? ((value / total.value) * 100).toFixed(1) : '0'
  return `
    <div style="
      background: white;
      border: 2px solid black;
      border-radius: 8px;
      box-shadow: 4px 4px 0px black;
      padding: 8px 12px;
      font-size: 0.75rem;
      font-family: var(--font-sans);
    ">
      <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">${label}</div>
      <div style="color: var(--text-muted);">${value.toLocaleString()} throws (${pct}%)</div>
    </div>
  `
}
</script>

<template>
  <div class="donut-chart flex flex-col items-center gap-md">
    <div :style="{ width: `${size}px`, height: `${size}px`, margin: '0 auto' }">
      <VisSingleContainer :data="data" :style="{ width: '100%', height: '100%' }">
        <VisDonut
          :value="(d: DonutDatum) => d.value"
          :color="colors"
          :arc-width="size * 0.2"
          :central-label="centralLabel"
          :central-sub-label="centralSubLabel"
          :pad-angle="0.02"
          :corner-radius="3"
        />
        <VisTooltip :template="tooltipTemplate" />
      </VisSingleContainer>
    </div>

    <div class="flex flex-wrap justify-center gap-y-sm gap-x-md">
      <div
        v-for="item in legendItems"
        :key="item.label"
        class="flex items-center gap-1.5 text-[0.7rem]"
      >
        <span class="w-2 h-2 rounded-sm shrink-0" :style="{ background: item.color }" />
        <span class="text-fg-muted">{{ item.label }}</span>
        <span class="font-semibold text-fg tabular-nums">{{ item.pct }}%</span>
      </div>
    </div>
  </div>
</template>

<style>
.donut-chart .unovis-single-container {
  --vis-tooltip-padding: 0px;
  --vis-tooltip-background-color: transparent;
  --vis-tooltip-border-color: transparent;
  --vis-tooltip-text-color: none;
  --vis-tooltip-shadow-color: none;
  --vis-tooltip-backdrop-filter: none;
  --vis-font-family: var(--font-sans);
}
</style>
