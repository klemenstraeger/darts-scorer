<script setup lang="ts" generic="T extends Record<string, any>">
import type { BulletLegendItemInterface } from '@unovis/ts'
import type { BaseChartProps } from '.'
import type { ChartConfig } from '@/components/ui/chart'
import { Area, Axis, CurveType, Line } from '@unovis/ts'

import { VisArea, VisAxis, VisLine, VisXYContainer } from '@unovis/vue'
import { useMounted } from '@vueuse/core'
import { computed, ref } from 'vue'
import { ChartCrosshair, ChartTooltipContent, componentToString, defaultColors } from '@/components/ui/chart'

const props = withDefaults(defineProps<BaseChartProps<T> & {
  chartConfig?: ChartConfig
  curveType?: CurveType
  showGradient?: boolean
}>(), {
  curveType: CurveType.MonotoneX,
  filterOpacity: 0.2,
  margin: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  showXAxis: true,
  showYAxis: true,
  showTooltip: true,
  showLegend: false,
  showGridLine: true,
  showGradient: true,
})

const _emits = defineEmits<{
  legendItemClick: [d: BulletLegendItemInterface, i: number]
}>()

let _areaChartId = 0

type KeyOfT = Extract<keyof T, string>
type Data = typeof props.data[number]

const chartRef = `area-chart-${++_areaChartId}`

const index = computed(() => props.index as KeyOfT)
const colors = computed(() => props.colors?.length ? props.colors : defaultColors(props.categories.length))

const legendItems = ref<BulletLegendItemInterface[]>(props.categories.map((category, i) => ({
  name: category,
  color: colors.value[i],
  inactive: false,
})))

const isMounted = useMounted()

const tooltipTemplate = computed(() => {
  if (!props.chartConfig)
    return undefined
  return componentToString(props.chartConfig, ChartTooltipContent)
})
</script>

<template>
  <div class="area-chart-root w-full h-full" :style="{ '--vis-tooltip-padding': '0px', '--vis-tooltip-background-color': 'transparent', '--vis-tooltip-border-color': 'transparent' }">
    <VisXYContainer :style="{ height: isMounted ? '100%' : 'auto' }" :margin="{ left: 20, right: 10, top: 5, bottom: 0 }" :data="data">
      <svg width="0" height="0">
        <defs>
          <linearGradient v-for="(color, i) in colors" :id="`${chartRef}-color-${i}`" :key="i" x1="0" y1="0" x2="0" y2="1">
            <template v-if="showGradient">
              <stop offset="5%" :stop-color="color" stop-opacity="0.35" />
              <stop offset="95%" :stop-color="color" stop-opacity="0.02" />
            </template>
            <template v-else>
              <stop offset="0%" :stop-color="color" />
            </template>
          </linearGradient>
        </defs>
      </svg>

      <ChartCrosshair v-if="showTooltip" :colors="colors" :items="legendItems" :index="index" :template="tooltipTemplate" />

      <template v-for="(category, i) in categories" :key="category">
        <VisArea
          :x="(d: Data, i: number) => i"
          :y="(d: Data) => d[category]"
          color="auto"
          :curve-type="curveType"
          :attributes="{
            [Area.selectors.area]: {
              fill: `url(#${chartRef}-color-${i})`,
            },
          }"
          :opacity="legendItems.find(item => item.name === category)?.inactive ? filterOpacity : 1"
        />
      </template>

      <template v-for="(category, i) in categories" :key="category">
        <VisLine
          :x="(d: Data, i: number) => i"
          :y="(d: Data) => d[category]"
          :color="colors[i]"
          :curve-type="curveType"
          :attributes="{
            [Line.selectors.line]: {
              'opacity': legendItems.find(item => item.name === category)?.inactive ? filterOpacity : 1,
              'stroke-width': i === 0 ? '2' : '1.5',
              'stroke-dasharray': i > 0 ? '6 4' : 'none',
            },
          }"
        />
      </template>

      <VisAxis
        v-if="showXAxis"
        type="x"
        :tick-format="xFormatter ?? ((v: number) => data[v]?.[index])"
        :grid-line="false"
        :tick-line="false"
        :num-ticks="6"
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
            'stroke': '#D1D5DB',
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
.area-chart-root :deep(.unovis-xy-container) {
  --vis-crosshair-line-stroke-color: var(--text-muted);
  --vis-crosshair-line-stroke-width: 1px;
  --vis-crosshair-circle-stroke-color: transparent;
  --vis-font-family: var(--font-sans);
}

.area-chart-root :deep(.unovis-xy-container text) {
  font-size: 10px;
}
</style>
