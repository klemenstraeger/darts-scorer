<script setup lang="ts">
import type { AroundTheClockState } from '~/types/training'

const props = defineProps<{
  state: AroundTheClockState
}>()

const currentTarget = computed(() =>
  props.state.targets[props.state.currentTargetIndex] ?? null,
)

const currentTargetLabel = computed(() => {
  const t = currentTarget.value
  if (t === null)
    return 'Done'
  return t === 25 ? 'Bull' : String(t)
})
</script>

<template>
  <div class="flex flex-col gap-md">
    <TrainingProgress
      :current="state.currentTargetIndex"
      :total="state.targets.length"
      label="Progress"
      color="#3b82f6"
    />

    <div class="text-center flex flex-col items-center gap-xs">
      <span class="text-[0.7rem] font-bold text-fg-muted uppercase tracking-[1px]">{{ state.variant }}</span>
      <div class="text-center">
        <span class="block text-xs font-bold text-fg-muted uppercase">Current Target</span>
        <span class="block text-[3.5rem] font-black text-[#3b82f6] leading-none">{{ currentTargetLabel }}</span>
      </div>
      <span class="text-[0.85rem] font-semibold text-fg-secondary tabular-nums">{{ state.totalDarts }} darts thrown</span>
    </div>

    <div class="flex flex-wrap gap-[4px] justify-center">
      <span
        v-for="(target, i) in state.targets"
        :key="target"
        class="flex items-center justify-center w-[32px] h-[28px] text-xs font-bold border-2 border-black transition-all duration-200"
        :class="{
          'bg-[#dbeafe] text-[#3b82f6]': i < state.currentTargetIndex,
          'bg-[#bfdbfe] text-[#3b82f6] border-[#3b82f6] shadow-sm': i === state.currentTargetIndex,
          'bg-surface-2 text-fg-muted': i > state.currentTargetIndex,
        }"
      >
        {{ target === 25 ? 'B' : target }}
      </span>
    </div>
  </div>
</template>
