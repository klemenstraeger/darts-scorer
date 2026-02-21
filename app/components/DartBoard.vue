<script setup lang="ts">
import type { DartboardTheme } from '~/utils/dartboard-themes'
import {
  COLORS,
  colorsFromTheme,
  CX,
  CY,
  generateNumberPositions,
  generateSegmentPaths,
  R,
  SEGMENT_ORDER,
  svgToScore,
} from '~/utils/dartboard-geometry'

export interface DartMarker {
  segment: number
  multiplier: number
  label?: string
}

const props = defineProps<{
  disabled?: boolean
  theme?: DartboardTheme
  highlightSegments?: DartMarker[]
}>()

const emit = defineEmits<{
  score: [segment: number, multiplier: number]
}>()

const boardColors = computed(() =>
  props.theme ? colorsFromTheme(props.theme.colors) : COLORS,
)

const segments = computed(() => generateSegmentPaths(boardColors.value))
const numbers = computed(() => generateNumberPositions())

const SEGMENT_ANGLE = 360 / 20

/**
 * Compute (x, y) position for a dart marker on the board.
 * Places the marker at the center of the correct ring and segment.
 */
function markerPosition(marker: DartMarker): { x: number, y: number } {
  // Bull
  if (marker.segment === 25) {
    const r
      = marker.multiplier === 2
        ? R.doubleBull * 0.5
        : (R.doubleBull + R.singleBull) / 2
    // Place bull markers at distance r from the center along a fixed angle
    const bullAngleDeg = -90
    const bullRad = bullAngleDeg * (Math.PI / 180)
    return {
      x: CX + r * Math.cos(bullRad),
      y: CY + r * Math.sin(bullRad),
    }
  }

  // Miss
  if (marker.segment === 0) {
    return { x: CX, y: CY }
  }

  // Find the segment index in SEGMENT_ORDER
  const segIndex = SEGMENT_ORDER.indexOf(marker.segment as typeof SEGMENT_ORDER[number])
  if (segIndex === -1)
    return { x: CX, y: CY }

  const angle = segIndex * SEGMENT_ANGLE

  // Calculate radius based on multiplier/ring
  let r: number
  if (marker.multiplier === 3) {
    r = (R.innerSingleOuter + R.trebleOuter) / 2
  }
  else if (marker.multiplier === 2) {
    r = (R.outerSingleOuter + R.doubleOuter) / 2
  }
  else {
    // Single - place in outer single area
    r = (R.trebleOuter + R.outerSingleOuter) / 2
  }

  const rad = (angle - 90) * (Math.PI / 180)
  return {
    x: CX + r * Math.cos(rad),
    y: CY + r * Math.sin(rad),
  }
}

const dartMarkers = computed(() => {
  if (!props.highlightSegments || props.highlightSegments.length === 0)
    return []
  return props.highlightSegments.map((marker, index) => ({
    ...marker,
    index,
    position: markerPosition(marker),
  }))
})

function handleClick(event: MouseEvent) {
  if (props.disabled)
    return
  const svg = event.currentTarget as SVGSVGElement
  const pt = svg.createSVGPoint()
  pt.x = event.clientX
  pt.y = event.clientY
  const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse())
  const { segment, multiplier } = svgToScore(svgPt.x, svgPt.y)
  if (segment > 0) {
    emit('score', segment, multiplier)
  }
}
</script>

<template>
  <svg
    viewBox="-16 -16 432 432"
    class="w-full max-w-[500px] cursor-pointer select-none"
    :class="{ 'cursor-default opacity-70': disabled }"
    @click="handleClick"
  >
    <circle :cx="CX" :cy="CY" :r="R.doubleOuter + 5" :fill="boardColors.bg" />

    <path
      v-for="seg in segments"
      :key="`${seg.segment}-${seg.ring}`"
      :d="seg.path"
      :fill="seg.color"
      :stroke="boardColors.wire"
      stroke-width="0.5"
      class="dartboard__segment hover:brightness-120 transition-[filter] duration-100"
    />

    <circle
      :cx="CX"
      :cy="CY"
      :r="R.singleBull"
      :fill="boardColors.bullGreen"
      :stroke="boardColors.wire"
      stroke-width="0.5"
      class="dartboard__segment hover:brightness-120 transition-[filter] duration-100"
    />

    <circle
      :cx="CX"
      :cy="CY"
      :r="R.doubleBull"
      :fill="boardColors.bullRed"
      :stroke="boardColors.wire"
      stroke-width="0.5"
      class="dartboard__segment hover:brightness-120 transition-[filter] duration-100"
    />

    <text
      v-for="num in numbers"
      :key="`num-${num.segment}`"
      :x="num.x"
      :y="num.y"
      text-anchor="middle"
      dominant-baseline="central"
      :fill="boardColors.numberText"
      font-size="12"
      font-weight="bold"
      font-family="Arial, sans-serif"
      class="pointer-events-none"
    >
      {{ num.segment }}
    </text>

    <!-- Dart markers for replay highlighting -->
      <g v-if="dartMarkers.length > 0">
        <g
          v-for="marker in dartMarkers"
          :key="`marker-${marker.index}`"
          class="pointer-events-none dartboard__marker"
          :style="{ '--marker-delay': `${marker.index * 90}ms` }"
        >
        <!-- Outer ring -->
        <circle
          :cx="marker.position.x"
          :cy="marker.position.y"
          r="7"
          fill="none"
          stroke="#000"
          stroke-width="1.5"
        />
        <!-- Inner filled circle -->
        <circle
          :cx="marker.position.x"
          :cy="marker.position.y"
          r="4"
          fill="var(--yellow, #FFD700)"
          stroke="#000"
          stroke-width="1"
        />
        <!-- Dart number label -->
        <text
          :x="marker.position.x"
          :y="marker.position.y + 0.5"
          text-anchor="middle"
          dominant-baseline="central"
          fill="#000"
          font-size="5"
          font-weight="bold"
          font-family="Arial, sans-serif"
          class="pointer-events-none"
        >
          {{ marker.index + 1 }}
        </text>
      </g>
    </g>
  </svg>
</template>
