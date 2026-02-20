<script setup lang="ts">
import type { CheckoutPracticeState } from '~/types/training'

const props = defineProps<{
  state: CheckoutPracticeState
}>()

const successRate = computed(() =>
  props.state.attempts > 0
    ? Math.round((props.state.successes / props.state.attempts) * 100)
    : 0,
)
</script>

<template>
  <div class="flex flex-col gap-md">
    <TrainingProgress
      :current="state.attempts"
      :total="state.totalAttempts"
      label="Attempts"
      color="#ef4444"
    />

    <div class="flex flex-col items-center gap-md">
      <div class="text-center">
        <span class="block text-xs font-bold text-fg-muted uppercase">Checkout</span>
        <span class="block text-[4rem] font-black text-[#ef4444] tabular-nums leading-none">{{ state.currentTarget }}</span>
      </div>

      <div class="flex gap-sm">
        <span
          v-for="slot in 3"
          :key="slot"
          class="flex items-center justify-center w-[52px] h-[44px] border-2 border-black text-base font-bold tabular-nums"
          :class="state.currentAttemptThrows >= slot
            ? 'bg-[#fee2e2] text-[#ef4444]'
            : 'bg-surface-2 text-fg-muted'"
        >
          <template v-if="state.currentAttemptThrows >= slot">
            {{ state.throws[state.throws.length - state.currentAttemptThrows + slot - 1]?.points ?? 0 }}
          </template>
          <template v-else>&middot;</template>
        </span>
      </div>

      <div class="flex gap-xl">
        <div class="text-center">
          <span class="block text-2xl font-extrabold text-green tabular-nums leading-none">{{ state.successes }}</span>
          <span class="block text-[0.7rem] font-bold text-fg-muted uppercase mt-[2px]">Made</span>
        </div>
        <div class="text-center">
          <span class="block text-2xl font-extrabold text-fg tabular-nums leading-none">{{ state.attempts - state.successes }}</span>
          <span class="block text-[0.7rem] font-bold text-fg-muted uppercase mt-[2px]">Missed</span>
        </div>
        <div class="text-center">
          <span class="block text-2xl font-extrabold text-[#ef4444] tabular-nums leading-none">{{ successRate }}%</span>
          <span class="block text-[0.7rem] font-bold text-fg-muted uppercase mt-[2px]">Rate</span>
        </div>
      </div>
    </div>
  </div>
</template>
