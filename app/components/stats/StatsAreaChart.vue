<script setup lang="ts">
import { AreaChart } from '@/components/ui/chart-area'

const props = defineProps<{
  values: number[]
  rolling?: number
  height?: number
  label?: string
  xLabels?: string[]
  referenceLine?: number
}>()

const chartHeight = computed(() => props.height ?? 180)

const chartData = computed(() => {
  if (props.values.length === 0) return []

  const windowSize = props.rolling ?? 0

  return props.values.map((value, idx) => {
    const entry: Record<string, any> = {
      index: props.xLabels?.[idx] ?? String(idx + 1),
      value,
    }

    if (windowSize > 0) {
      const start = Math.max(0, idx - windowSize + 1)
      const slice = props.values.slice(start, idx + 1)
      entry.rolling = Math.round((slice.reduce((a, v) => a + v, 0) / slice.length) * 10) / 10
    }

    return entry
  })
})

const categories = computed(() => {
  const cats: string[] = ['value']
  if (props.rolling && props.rolling > 0) cats.push('rolling')
  return cats
})

const colors = computed(() => {
  const c = ['var(--gold)']
  if (props.rolling && props.rolling > 0) c.push('var(--blue)')
  return c
})
</script>

<template>
  <div class="flex flex-col gap-sm">
    <div v-if="label" class="text-[0.7rem] text-fg-muted uppercase tracking-[1px]">{{ label }}</div>
    <div :style="{ height: `${chartHeight}px` }">
      <AreaChart
        :data="chartData"
        index="index"
        :categories="categories"
        :colors="colors"
        :y-formatter="(v: number) => v.toFixed(1)"
        :show-legend="false"
        :show-grid-line="true"
        :show-x-axis="!!xLabels"
        :show-y-axis="true"
      />
    </div>
    <div v-if="rolling" class="flex gap-md text-[0.7rem] text-fg-muted">
      <span class="inline-flex items-center gap-[6px]"><span class="dot-gold w-2 h-2 rounded-full inline-block"></span>Turn total</span>
      <span class="inline-flex items-center gap-[6px]"><span class="dot-blue w-2 h-2 rounded-full inline-block"></span>{{ rolling }}-turn avg</span>
    </div>
  </div>
</template>

<style scoped>
.dot-gold {
  background: var(--gold);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
}

.dot-blue {
  background: var(--blue);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
}
</style>
