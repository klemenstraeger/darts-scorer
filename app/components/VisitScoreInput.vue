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
  <div class="visit-root" :class="{ 'visit-disabled': disabled }">
    <!-- Score display -->
    <div class="visit-display" :class="{ 'visit-display-invalid': displayValue !== null && !isValid }">
      <span v-if="display === ''" class="visit-display-placeholder">Enter score</span>
      <span v-else class="visit-display-value" :class="{ invalid: displayValue !== null && !isValid }">{{ display }}</span>
    </div>

    <!-- Quick scores (compact row) -->
    <div class="visit-quick-row">
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

    <!-- Numpad -->
    <div class="visit-numpad">
      <button v-for="n in [1, 2, 3, 4, 5, 6, 7, 8, 9]" :key="n" class="visit-num-btn" :disabled="disabled" @click="appendDigit(n)">
        {{ n }}
      </button>
      <button class="visit-num-btn visit-fn-btn" :disabled="disabled" @click="backspace">
        &#x232B;
      </button>
      <button class="visit-num-btn" :disabled="disabled" @click="appendDigit(0)">
        0
      </button>
      <button class="visit-num-btn visit-ok-btn" :disabled="disabled || !canSubmit" @click="submit">
        OK
      </button>
    </div>
  </div>
</template>

<style>
.visit-root {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

@media (min-width: 768px) {
  .visit-root { gap: 8px; }
}

.visit-root.visit-disabled {
  opacity: 0.35;
  pointer-events: none;
}

/* ── Score display ──────────────────────────────────────────────────── */
.visit-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px var(--spacing-md);
  background: var(--surface-1);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  min-height: 52px;
  flex-shrink: 0;
  transition: border-color var(--duration-fast);
}

@media (min-width: 768px) {
  .visit-display { min-height: 60px; padding: 12px var(--spacing-lg); }
}

.visit-display.visit-display-invalid {
  border-color: var(--red);
  background: var(--red-light);
}

.visit-display-placeholder {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-muted);
  opacity: 0.45;
}

.visit-display-value {
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
}

.visit-display-value.invalid {
  color: var(--red);
}

/* ── Quick scores ───────────────────────────────────────────────────── */
.visit-quick-row {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.visit-quick-row::-webkit-scrollbar {
  display: none;
}

.visit-quick-btn {
  flex: 1 0 auto;
  min-width: 0;
  padding: 6px 0;
  background: var(--surface-2);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--yellow);
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 60ms var(--ease-out),
              box-shadow 60ms var(--ease-out),
              background var(--duration-fast);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

@media (min-width: 768px) {
  .visit-quick-btn { padding: 8px 0; font-size: 0.8rem; }
}

.visit-quick-btn:active:not(:disabled) {
  transform: translate(1px, 1px);
}

.visit-quick-btn:hover:not(:disabled) {
  background: var(--yellow-light);
}

.visit-quick-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

/* ── Numpad ─────────────────────────────────────────────────────────── */
.visit-numpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  flex: 1;
  min-height: 0;
}

@media (min-width: 768px) {
  .visit-numpad { gap: 6px; }
}

.visit-num-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-1);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 1.3rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 60ms var(--ease-out),
              box-shadow 60ms var(--ease-out),
              background var(--duration-fast);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

@media (min-width: 768px) {
  .visit-num-btn { font-size: 1.4rem; min-height: 56px; }
}

.visit-num-btn:hover:not(:disabled) {
  background: var(--surface-2);
}

.visit-num-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.visit-num-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

/* Backspace */
.visit-fn-btn {
  font-size: 1.4rem;
  color: var(--text-muted);
  background: var(--surface-2);
  box-shadow: none;
  border-color: var(--surface-3);
}

.visit-fn-btn:hover:not(:disabled) {
  background: var(--surface-3);
  color: var(--text-primary);
}

/* OK button */
.visit-ok-btn {
  background: var(--yellow);
  color: var(--text-primary);
  border-color: var(--border-color);
  font-size: 1rem;
  letter-spacing: 1.5px;
}

.visit-ok-btn:hover:not(:disabled) {
  background: var(--yellow);
  filter: brightness(1.05);
}

.visit-ok-btn:disabled {
  opacity: 0.25;
  background: var(--surface-3);
  color: var(--text-muted);
}
</style>
