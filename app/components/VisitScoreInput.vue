<script setup lang="ts">
import { isAchievableScore, QUICK_SCORES } from '#shared/visit-score-validation'

defineProps<{
  disabled?: boolean
  currentScore?: number
  checkoutMode?: string
}>()

const emit = defineEmits<{
  visitScore: [score: number]
}>()

const display = ref('')

const displayValue = computed(() => {
  if (display.value === '')
    return null
  return Number.parseInt(display.value, 10)
})

const isValid = computed(() => {
  if (displayValue.value === null)
    return true
  return isAchievableScore(displayValue.value)
})

const canSubmit = computed(() => {
  return displayValue.value !== null && isValid.value
})

function appendDigit(d: number) {
  const next = display.value + d
  const val = Number.parseInt(next, 10)
  if (val > 180)
    return
  if (next.length > 3)
    return
  display.value = next
  haptic()
}

function backspace() {
  display.value = display.value.slice(0, -1)
  haptic()
}

function submit() {
  if (!canSubmit.value)
    return
  emit('visitScore', displayValue.value!)
  display.value = ''
  haptic()
}

function submitQuickScore(score: number) {
  emit('visitScore', score)
  display.value = ''
  haptic()
}

function haptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
    return
  if (e.key >= '0' && e.key <= '9') {
    e.preventDefault()
    appendDigit(Number.parseInt(e.key, 10))
  }
  else if (e.key === 'Backspace') {
    e.preventDefault()
    backspace()
  }
  else if (e.key === 'Enter') {
    e.preventDefault()
    submit()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="visit-score-root" :class="{ 'visit-score-disabled': disabled }">
    <!-- Quick scores -->
    <div class="visit-quick-grid">
      <button
        v-for="qs in QUICK_SCORES"
        :key="qs"
        class="visit-quick-btn"
        :disabled="disabled"
        @click="submitQuickScore(qs)"
      >
        {{ qs === 0 ? 'MISS' : qs }}
      </button>
    </div>

    <!-- Score display -->
    <div class="visit-score-display" :class="{ 'visit-score-invalid': displayValue !== null && !isValid }">
      <span v-if="display === ''" class="text-[1.1rem] font-semibold text-fg-muted opacity-50">Enter score</span>
      <span v-else class="visit-score-value" :class="{ 'text-red': displayValue !== null && !isValid }">{{ display }}</span>
    </div>

    <!-- Calculator numpad -->
    <div class="visit-numpad-grid">
      <button v-for="n in [1, 2, 3, 4, 5, 6, 7, 8, 9]" :key="n" class="visit-num-btn" :disabled="disabled" @click="appendDigit(n)">
        {{ n }}
      </button>
      <button class="visit-num-btn visit-num-backspace" :disabled="disabled" @click="backspace">
        &#x232B;
      </button>
      <button class="visit-num-btn" :disabled="disabled" @click="appendDigit(0)">
        0
      </button>
      <button class="visit-num-btn visit-num-ok" :disabled="disabled || !canSubmit" @click="submit">
        OK
      </button>
    </div>
  </div>
</template>

<style>
/* VisitScoreInput — uses non-scoped styles because of complex grid/flex layouts
   with responsive breakpoints and pseudo-element-like disabled states.
   All classes prefixed with visit- to namespace. */

.visit-score-root {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

@media (min-width: 768px) {
  .visit-score-root {
    gap: var(--spacing-sm);
  }
}

.visit-score-root.visit-score-disabled {
  opacity: 0.4;
  pointer-events: none;
}

/* Quick scores */
.visit-quick-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.visit-quick-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  background: var(--surface-1);
  border: 2px solid black;
  border-radius: var(--radius-md);
  color: var(--yellow);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 2px 2px 0 black;
  transition:
    transform 50ms var(--ease-out),
    background var(--duration-fast),
    box-shadow var(--duration-fast);
}

@media (min-width: 768px) {
  .visit-quick-btn {
    padding: var(--spacing-sm) 0;
    font-size: 0.95rem;
  }
}

.visit-quick-btn:hover:not(:disabled) {
  border-color: var(--yellow);
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 black;
}

.visit-quick-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.visit-quick-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Score display */
.visit-score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--surface-1);
  border: 2px solid black;
  border-radius: var(--radius-md);
  min-height: 48px;
  flex-shrink: 0;
  transition: border-color var(--duration-fast);
}

@media (min-width: 768px) {
  .visit-score-display {
    min-height: 56px;
  }
}

.visit-score-display.visit-score-invalid {
  border-color: var(--red);
}

.visit-score-value {
  font-size: 2rem;
  font-weight: 900;
  color: var(--fg);
  font-variant-numeric: tabular-nums;
}

/* Calculator numpad */
.visit-numpad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xs);
  flex: 1;
  min-height: 0;
}

.visit-num-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-1);
  border: 2px solid black;
  border-radius: var(--radius-lg);
  color: var(--fg);
  font-family: var(--font-sans);
  font-size: 1.4rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 2px 2px 0 black;
  transition:
    transform 50ms var(--ease-out),
    background var(--duration-fast),
    box-shadow var(--duration-fast);
}

@media (min-width: 768px) {
  .visit-num-btn {
    min-height: 56px;
    font-size: 1.5rem;
  }
}

.visit-num-btn:hover:not(:disabled) {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 black;
}

.visit-num-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.visit-num-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.visit-num-backspace {
  font-size: 1.5rem;
  color: var(--fg-secondary);
}

.visit-num-ok {
  background: var(--yellow);
  color: var(--fg-inverse);
  border-color: black;
  font-size: 1.1rem;
  letter-spacing: 1px;
}

.visit-num-ok:hover:not(:disabled) {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 black;
}

.visit-num-ok:disabled {
  opacity: 0.3;
  background: var(--surface-3);
  color: var(--fg-muted);
}
</style>
