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
  <span class="inline-flex items-center gap-1 px-sm py-[2px] rounded-sm text-xs font-semibold border border-transparent" :class="colorClass">
    <span class="font-bold">{{ label }}</span>
    <span class="opacity-60 text-[0.7rem]">{{ points }}</span>
  </span>
</template>

<style scoped>
.single { background: var(--surface-2); color: var(--text-secondary); border-color: var(--border-subtle); }
.double { background: rgba(255, 215, 0, 0.1); color: var(--gold); border-color: rgba(255, 215, 0, 0.2); }
.treble { background: rgba(59, 130, 246, 0.1); color: var(--blue); border-color: rgba(59, 130, 246, 0.2); }
.miss { background: rgba(239, 68, 68, 0.1); color: var(--red); border-color: rgba(239, 68, 68, 0.2); }
.bull { background: rgba(34, 197, 94, 0.1); color: var(--green); border-color: rgba(34, 197, 94, 0.2); }
</style>
