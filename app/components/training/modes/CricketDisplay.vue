<script setup lang="ts">
import type { CricketState } from '~/types/training'

const props = defineProps<{
  state: CricketState
}>()

const closedCount = computed(() =>
  props.state.targets.filter(t => (props.state.marks[t] ?? 0) >= 3).length,
)

function targetLabel(t: number): string {
  return t === 25 ? 'Bull' : String(t)
}

function marksDisplay(t: number): string[] {
  const marks = props.state.marks[t] ?? 0
  const result: string[] = []
  for (let i = 0; i < 3; i++) {
    result.push(i < marks ? '/' : '')
  }
  return result
}
</script>

<template>
  <div class="flex flex-col gap-md">
    <TrainingProgress
      :current="closedCount"
      :total="state.targets.length"
      label="Closed"
      color="#ec4899"
    />

    <div class="flex flex-col items-center gap-md">
      <span class="text-[0.85rem] font-semibold text-fg-secondary tabular-nums">{{ state.totalDarts }} darts</span>

      <div class="w-full max-w-[320px] flex flex-col gap-xs">
        <div
          v-for="target in state.targets"
          :key="target"
          class="flex items-center gap-md px-sm py-xs border-2 border-black transition-all duration-200"
          :class="(state.marks[target] ?? 0) >= 3 ? 'bg-[#fce7f3]' : 'bg-surface-2'"
        >
          <span
            class="text-[1.1rem] font-extrabold min-w-[40px]"
            :class="(state.marks[target] ?? 0) >= 3 ? 'text-[#ec4899]' : 'text-fg'"
          >{{ targetLabel(target) }}</span>
          <div class="flex gap-sm">
            <span
              v-for="(mark, i) in marksDisplay(target)"
              :key="i"
              class="text-xl font-extrabold w-[20px] text-center"
              :class="mark === '/' ? 'text-[#ec4899]' : 'text-fg-muted'"
            >
              {{ mark || '·' }}
            </span>
          </div>
          <span
            v-if="(state.marks[target] ?? 0) >= 3"
            class="ml-auto text-[0.6rem] font-extrabold text-[#ec4899] uppercase tracking-[1px]"
          >CLOSED</span>
        </div>
      </div>
    </div>
  </div>
</template>
