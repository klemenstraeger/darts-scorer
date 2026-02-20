<script setup lang="ts">
const props = defineProps<{
  label: string
  leftValue: number
  rightValue: number
  leftLabel?: string
  rightLabel?: string
  format?: 'number' | 'decimal' | 'percent'
}>()

const leftDisplay = computed(() => formatValue(props.leftValue))
const rightDisplay = computed(() => formatValue(props.rightValue))

function formatValue(v: number): string {
  if (props.format === 'percent')
    return `${v.toFixed(1)}%`
  if (props.format === 'decimal')
    return v.toFixed(1)
  return String(v)
}

const total = computed(() => props.leftValue + props.rightValue)

const leftPct = computed(() => {
  if (total.value === 0)
    return 50
  return (props.leftValue / total.value) * 100
})

const rightPct = computed(() => {
  if (total.value === 0)
    return 50
  return (props.rightValue / total.value) * 100
})

const leftWins = computed(() => props.leftValue > props.rightValue)
const rightWins = computed(() => props.rightValue > props.leftValue)
</script>

<template>
  <div class="flex items-center gap-md py-sm">
    <div
      class="min-w-[48px] text-base font-bold text-fg-muted tabular-nums text-right transition-colors duration-100"
      :class="{ 'text-yellow': leftWins }"
    >
      {{ leftDisplay }}
    </div>
    <div class="flex-1 flex flex-col items-center gap-1">
      <div class="text-[0.7rem] font-semibold uppercase tracking-[1px] text-fg-muted">
        {{ label }}
      </div>
      <div class="w-full h-2 rounded bg-surface-2 border border-black flex overflow-hidden gap-0.5">
        <div
          class="h-full rounded transition-[width] duration-500 ease-out"
          :class="leftWins ? 'bg-yellow' : 'bg-blue'"
          :style="{ width: `${leftPct}%` }"
        />
        <div
          class="h-full rounded transition-[width] duration-500 ease-out"
          :class="rightWins ? 'bg-yellow' : 'bg-red'"
          :style="{ width: `${rightPct}%` }"
        />
      </div>
    </div>
    <div
      class="min-w-[48px] text-base font-bold text-fg-muted tabular-nums text-left transition-colors duration-100"
      :class="{ 'text-yellow': rightWins }"
    >
      {{ rightDisplay }}
    </div>
  </div>
</template>
