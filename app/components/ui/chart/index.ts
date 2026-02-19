import type { Component, Ref } from 'vue'
import { createContext } from 'reka-ui'

export { default as ChartContainer } from './ChartContainer.vue'
export { default as ChartLegendContent } from './ChartLegendContent.vue'
export { default as ChartTooltipContent } from './ChartTooltipContent.vue'
export { componentToString } from './utils'

// Format: { THEME_NAME: CSS_SELECTOR }
export const THEMES = { light: '', dark: '.dark' } as const

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

export const [useChart, provideChartContext] = createContext<ChartContextProps>('Chart')

export { VisCrosshair as ChartCrosshair, VisBulletLegend as ChartLegend, VisTooltip as ChartTooltip } from '@unovis/vue'

export function defaultColors(count: number): string[] {
  const colors = [
    'var(--gold)',
    'var(--blue)',
    'var(--green)',
    'var(--red)',
    'var(--purple)',
  ]
  return colors.slice(0, count)
}
