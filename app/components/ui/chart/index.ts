import type { Component, InjectionKey, Ref } from 'vue'
import { inject, provide } from 'vue'

export { default as ChartContainer } from './ChartContainer.vue'
export { default as ChartLegendContent } from './ChartLegendContent.vue'
export { default as ChartTooltipContent } from './ChartTooltipContent.vue'
export { componentToString } from './utils'

// Format: { THEME_NAME: CSS_SELECTOR }
export const THEMES = { light: '' } as const

export type ChartConfig = {
  [k in string]: {
    label?: string | Component
    icon?: string | Component
  } & (
    | { color?: string, theme?: never }
    | { color?: never, theme: Record<keyof typeof THEMES, string> }
  )
}

interface ChartContextProps {
  id: string
  config: Ref<ChartConfig>
}

const CHART_KEY = Symbol('Chart') as InjectionKey<ChartContextProps>

export function useChart(): ChartContextProps {
  const ctx = inject(CHART_KEY)
  if (!ctx)
    throw new Error('useChart must be used within a ChartContainer')
  return ctx
}

export function provideChartContext(props: ChartContextProps) {
  provide(CHART_KEY, props)
}

export { VisCrosshair as ChartCrosshair, VisBulletLegend as ChartLegend, VisTooltip as ChartTooltip } from '@unovis/vue'

export function defaultColors(count: number): string[] {
  const colors = [
    'var(--yellow)',
    'var(--cyan)',
    'var(--lime)',
    'var(--magenta)',
    'var(--purple)',
  ]
  return colors.slice(0, count)
}
