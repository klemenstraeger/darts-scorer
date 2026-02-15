<script setup lang="ts">
import {
  generateSegmentPaths,
  R,
  CX,
  CY,
  COLORS,
} from '~/utils/dartboard-geometry'
import type { ThrowResult } from '~/types/game'

const props = defineProps<{
  throws: ThrowResult[]
}>()

const segments = computed(() => generateSegmentPaths())

// Build set of hit segments with their rings for highlighting
const hitSegments = computed(() => {
  const hits = new Set<string>()
  for (const t of props.throws) {
    if (t.segment === 0) continue
    if (t.segment === 25) {
      hits.add(`bull-${t.multiplier}`)
    } else {
      const ringMap = { 1: 'single', 2: 'double', 3: 'treble' } as const
      const ring = ringMap[t.multiplier as 1 | 2 | 3]
      hits.add(`${t.segment}-${ring}`)
    }
  }
  return hits
})

function isHit(segment: number, ring: string): boolean {
  const ringMap: Record<string, string> = {
    double: 'double',
    outerSingle: 'single',
    treble: 'treble',
    innerSingle: 'single',
  }
  return hitSegments.value.has(`${segment}-${ringMap[ring]}`)
}
</script>

<template>
  <svg viewBox="0 0 400 400" class="w-[60px] h-[60px] shrink-0">
    <!-- Background -->
    <circle :cx="CX" :cy="CY" :r="R.doubleOuter + 5" fill="var(--surface-0)" />

    <!-- Segments (dimmed, highlighted on hit) -->
    <path
      v-for="seg in segments"
      :key="`${seg.segment}-${seg.ring}`"
      :d="seg.path"
      :fill="seg.color"
      stroke="rgba(100,100,120,0.2)"
      stroke-width="0.5"
      :opacity="isHit(seg.segment, seg.ring) ? 0.9 : 0.15"
      :class="{ hit: isHit(seg.segment, seg.ring) }"
    />

    <!-- Bull -->
    <circle
      :cx="CX" :cy="CY" :r="R.singleBull"
      :fill="COLORS.bullGreen"
      :opacity="hitSegments.has('bull-1') ? 0.9 : 0.15"
    />
    <circle
      :cx="CX" :cy="CY" :r="R.doubleBull"
      :fill="COLORS.bullRed"
      :opacity="hitSegments.has('bull-2') ? 0.9 : 0.15"
    />
  </svg>
</template>

<style scoped>
.hit {
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.3));
}
</style>
