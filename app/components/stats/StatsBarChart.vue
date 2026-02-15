<script setup lang="ts">
import { BarChart } from '@/components/ui/chart-bar'

const props = defineProps<{
  labels: string[]
  values: number[]
  height?: number
  accent?: 'gold' | 'blue' | 'green'
}>()

const chartHeight = computed(() => props.height ?? 180)

const accentColor = computed(() => {
  switch (props.accent) {
    case 'blue':
      return 'var(--blue)'
    case 'green':
      return 'var(--green)'
    default:
      return 'var(--gold)'
  }
})

const chartData = computed(() => {
  return props.values.map((value, idx) => ({
    label: props.labels[idx] ?? '',
    value,
  }))
})
</script>

<template>
  <div :style="{ height: `${chartHeight}px` }">
    <BarChart
      :data="chartData"
      index="label"
      :categories="['value']"
      :colors="[accentColor]"
      :y-formatter="(v: number) => String(Math.round(v))"
      :show-legend="false"
      :show-grid-line="true"
      :show-x-axis="true"
      :show-y-axis="true"
      :rounded-corners="4"
    />
  </div>
</template>
