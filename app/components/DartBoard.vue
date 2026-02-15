<script setup lang="ts">
import {
  generateSegmentPaths,
  generateNumberPositions,
  R,
  CX,
  CY,
  COLORS,
  svgToScore,
} from '~/utils/dartboard-geometry'

const props = defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  score: [segment: number, multiplier: number]
}>()

const segments = computed(() => generateSegmentPaths())
const numbers = computed(() => generateNumberPositions())

function handleClick(event: MouseEvent) {
  if (props.disabled) return
  const svg = (event.currentTarget as SVGSVGElement)
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
    @click="handleClick"
    :class="{ 'cursor-default opacity-70': disabled }"
  >
    <circle :cx="CX" :cy="CY" :r="R.doubleOuter + 5" :fill="COLORS.bg" />

    <path
      v-for="seg in segments"
      :key="`${seg.segment}-${seg.ring}`"
      :d="seg.path"
      :fill="seg.color"
      :stroke="COLORS.wire"
      stroke-width="0.5"
      class="segment"
    />

    <circle
      :cx="CX"
      :cy="CY"
      :r="R.singleBull"
      :fill="COLORS.bullGreen"
      :stroke="COLORS.wire"
      stroke-width="0.5"
      class="segment"
    />

    <circle
      :cx="CX"
      :cy="CY"
      :r="R.doubleBull"
      :fill="COLORS.bullRed"
      :stroke="COLORS.wire"
      stroke-width="0.5"
      class="segment"
    />

    <text
      v-for="num in numbers"
      :key="`num-${num.segment}`"
      :x="num.x"
      :y="num.y"
      text-anchor="middle"
      dominant-baseline="central"
      :fill="COLORS.numberText"
      font-size="12"
      font-weight="bold"
      font-family="Arial, sans-serif"
      class="number-label"
    >
      {{ num.segment }}
    </text>
  </svg>
</template>

<style scoped>
.segment:hover {
  filter: brightness(1.2);
  transition: filter 0.1s;
}

.number-label {
  pointer-events: none;
}
</style>
