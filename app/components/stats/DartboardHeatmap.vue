<script setup lang="ts">
import { generateSegmentPaths, R, CX, CY, COLORS } from '~/utils/dartboard-geometry'

const props = defineProps<{
  hits: Record<string, number>
  size?: number
}>()

const segments = computed(() => generateSegmentPaths())

function segmentKey(segment: number, ring: string): string {
  return `${segment}-${ring}`
}

const maxHit = computed(() => {
  const values = Object.values(props.hits)
  return values.length > 0 ? Math.max(...values) : 1
})

function heatOpacity(segment: number, ring: string): number {
  const directKey = segmentKey(segment, ring)
  let value = props.hits[directKey] ?? 0
  if (!value && (ring === 'outerSingle' || ring === 'innerSingle')) {
    value = props.hits[segmentKey(segment, 'single')] ?? 0
  }
  if (!value) return 0.05
  return Math.min(0.15 + (value / maxHit.value) * 0.75, 0.9)
}
</script>

<template>
  <div class="dartboard-heatmap flex items-center justify-center rounded-full border border-border-subtle" :style="{ width: `${size ?? 220}px`, height: `${size ?? 220}px` }">
    <svg viewBox="0 0 400 400" class="w-[90%] h-[90%]">
      <circle :cx="CX" :cy="CY" :r="R.doubleOuter + 6" fill="var(--surface-0)" />

      <path
        v-for="seg in segments"
        :key="`${seg.segment}-${seg.ring}`"
        :d="seg.path"
        :fill="seg.color"
        stroke="rgba(255,255,255,0.08)"
        stroke-width="0.4"
        :opacity="heatOpacity(seg.segment, seg.ring)"
      />

      <circle
        :cx="CX" :cy="CY" :r="R.singleBull"
        :fill="COLORS.bullGreen"
        :opacity="heatOpacity(25, 'single')"
      />
      <circle
        :cx="CX" :cy="CY" :r="R.doubleBull"
        :fill="COLORS.bullRed"
        :opacity="heatOpacity(25, 'double')"
      />
    </svg>
  </div>
</template>

<style scoped>
.dartboard-heatmap {
  background: radial-gradient(circle at 30% 20%, rgba(255, 215, 0, 0.08), transparent 55%),
    radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.12), transparent 60%),
    var(--surface-0);
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.6);
}
</style>
