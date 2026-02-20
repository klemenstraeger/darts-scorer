<script setup lang="ts">
import type { ThrowResult } from '~/types/game'
import { throwLabel, throwPoints } from '~/types/game'

const props = defineProps<{
  throw: ThrowResult
}>()

const label = computed(() => throwLabel(props.throw))
const points = computed(() => throwPoints(props.throw))

const colorClass = computed(() => {
  if (props.throw.segment === 0)
    return 'miss'
  if (props.throw.segment === 25)
    return 'bull'
  if (props.throw.multiplier === 3)
    return 'treble'
  if (props.throw.multiplier === 2)
    return 'double'
  return 'single'
})
</script>

<template>
  <span class="throw-badge inline-flex items-center gap-1 px-sm py-[2px] rounded-sm text-xs font-semibold border-2 border-black" :class="colorClass">
    <span class="font-bold">{{ label }}</span>
    <span class="badge-points opacity-60 text-[0.7rem]">{{ points }}</span>
  </span>
</template>

<style>
.throw-badge.single { background: var(--surface-2); color: var(--text-secondary); }
.throw-badge.double { background: var(--yellow-light); color: var(--yellow); }
.throw-badge.treble { background: var(--blue-light); color: var(--blue); }
.throw-badge.miss { background: var(--red-light); color: var(--red); }
.throw-badge.bull { background: var(--green-light); color: var(--green); }
</style>
