<script setup lang="ts" generic="T extends Record<string, any>">
import type { BulletLegendItemInterface } from "@unovis/ts"
import type { BaseChartProps } from "."
import type { ChartConfig } from '@/components/ui/chart'
import { Axis, GroupedBar, StackedBar } from "@unovis/ts"
import { VisAxis, VisGroupedBar, VisStackedBar, VisXYContainer } from "@unovis/vue"
import { useMounted } from "@vueuse/core"
import { computed, ref } from "vue"
import { ChartCrosshair, ChartTooltipContent, componentToString, defaultColors } from '@/components/ui/chart'

const props = withDefaults(defineProps<BaseChartProps<T> & {
  chartConfig?: ChartConfig
  type?: "stacked" | "grouped"
  roundedCorners?: number
}>(), {
  type: "grouped",
  margin: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  filterOpacity: 0.2,
  roundedCorners: 0,
  showXAxis: true,
  showYAxis: true,
  showTooltip: true,
  showLegend: false,
  showGridLine: true,
})

const emits = defineEmits<{
  legendItemClick: [d: BulletLegendItemInterface, i: number]
}>()

type KeyOfT = Extract<keyof T, string>
type Data = typeof props.data[number]

const index = computed(() => props.index as KeyOfT)
const colors = computed(() => props.colors?.length ? props.colors : defaultColors(props.categories.length))
const legendItems = ref<BulletLegendItemInterface[]>(props.categories.map((category, i) => ({
  name: category,
  color: colors.value[i],
  inactive: false,
})))

const isMounted = useMounted()

const tooltipTemplate = computed(() => {
  if (!props.chartConfig) return undefined
  return componentToString(props.chartConfig, ChartTooltipContent)
})

const VisBarComponent = computed(() => props.type === "grouped" ? VisGroupedBar : VisStackedBar)
const selectorsBar = computed(() => props.type === "grouped" ? GroupedBar.selectors.bar : StackedBar.selectors.bar)
</script>

<template>
  <div class="bar-chart-root w-full h-full" :style="{ '--vis-tooltip-padding': '0px', '--vis-tooltip-background-color': 'transparent', '--vis-tooltip-border-color': 'transparent' }">
    <VisXYContainer
      :data="data"
      :style="{ height: isMounted ? '100%' : 'auto' }"
      :margin="{ left: 20, right: 10, top: 5, bottom: 0 }"
    >
      <ChartCrosshair v-if="showTooltip" :colors="colors" :items="legendItems" :template="tooltipTemplate" :index="index" />

      <VisBarComponent
        :x="(d: Data, i: number) => i"
        :y="categories.map(category => (d: Data) => d[category]) "
        :color="colors"
        :rounded-corners="roundedCorners"
        :bar-padding="0.15"
        :attributes="{
          [selectorsBar]: {
            opacity: (d: Data, i:number) => {
              const pos = i % categories.length
              return legendItems[pos]?.inactive ? filterOpacity : 1
            },
          },
        }"
      />

      <VisAxis
        v-if="showXAxis"
        type="x"
        :tick-format="xFormatter ?? ((v: number) => data[v]?.[index])"
        :grid-line="false"
        :tick-line="false"
        tick-text-color="var(--text-muted)"
      />
      <VisAxis
        v-if="showYAxis"
        type="y"
        :tick-line="false"
        :tick-format="yFormatter"
        :domain-line="false"
        :grid-line="showGridLine"
        :attributes="{
          [Axis.selectors.grid]: {
            stroke: 'var(--border-subtle)',
            'stroke-dasharray': '3 3',
          },
        }"
        tick-text-color="var(--text-muted)"
      />

      <slot />
    </VisXYContainer>
  </div>
</template>

<style scoped>
.bar-chart-root :deep(.unovis-xy-container) {
  --vis-crosshair-line-stroke-color: var(--text-muted);
  --vis-crosshair-line-stroke-width: 1px;
  --vis-crosshair-circle-stroke-color: transparent;
  --vis-font-family: var(--font-sans);
}

.bar-chart-root :deep(.unovis-xy-container text) {
  font-size: 10px;
}
</style>
