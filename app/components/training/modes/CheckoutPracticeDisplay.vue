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
  <div class="checkout-display">
    <TrainingProgress
      :current="state.attempts"
      :total="state.totalAttempts"
      label="Attempts"
      color="#ef4444"
    />

    <div class="co-main">
      <div class="co-target">
        <span class="co-target-label">Checkout</span>
        <span class="co-target-value">{{ state.currentTarget }}</span>
      </div>

      <div class="co-darts">
        <span
          v-for="slot in 3"
          :key="slot"
          class="co-dart-slot"
          :class="{ filled: state.currentAttemptThrows >= slot }"
        >
          <template v-if="state.currentAttemptThrows >= slot">
            {{ state.throws[state.throws.length - state.currentAttemptThrows + slot - 1]?.points ?? 0 }}
          </template>
          <template v-else>&middot;</template>
        </span>
      </div>

      <div class="co-stats-row">
        <div class="co-stat">
          <span class="co-stat-value co-success">{{ state.successes }}</span>
          <span class="co-stat-label">Made</span>
        </div>
        <div class="co-stat">
          <span class="co-stat-value">{{ state.attempts - state.successes }}</span>
          <span class="co-stat-label">Missed</span>
        </div>
        <div class="co-stat">
          <span class="co-stat-value co-rate">{{ successRate }}%</span>
          <span class="co-stat-label">Rate</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout-display {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.co-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.co-target {
  text-align: center;
}

.co-target-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.co-target-value {
  display: block;
  font-size: 4rem;
  font-weight: 900;
  color: #ef4444;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.co-darts {
  display: flex;
  gap: var(--spacing-sm);
}

.co-dart-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 44px;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.co-dart-slot.filled {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.06);
  color: #ef4444;
}

.co-stats-row {
  display: flex;
  gap: var(--spacing-xl);
}

.co-stat {
  text-align: center;
}

.co-stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.co-success {
  color: var(--green);
}

.co-rate {
  color: #ef4444;
}

.co-stat-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-top: 2px;
}
</style>
