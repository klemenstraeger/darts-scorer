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
  <div class="visit-input" :class="{ disabled }">
    <!-- Quick scores -->
    <div class="quick-grid">
      <button
        v-for="qs in QUICK_SCORES"
        :key="qs"
        class="quick-btn"
        :disabled="disabled"
        @click="submitQuickScore(qs)"
      >
        {{ qs === 0 ? 'MISS' : qs }}
      </button>
    </div>

    <!-- Score display -->
    <div class="score-display" :class="{ invalid: displayValue !== null && !isValid }">
      <span v-if="display === ''" class="placeholder">Enter score</span>
      <span v-else class="score-value">{{ display }}</span>
    </div>

    <!-- Calculator numpad -->
    <div class="numpad-grid">
      <button v-for="n in [1, 2, 3, 4, 5, 6, 7, 8, 9]" :key="n" class="num-btn" :disabled="disabled" @click="appendDigit(n)">
        {{ n }}
      </button>
      <button class="num-btn backspace" :disabled="disabled" @click="backspace">
        &#x232B;
      </button>
      <button class="num-btn" :disabled="disabled" @click="appendDigit(0)">
        0
      </button>
      <button class="num-btn ok" :disabled="disabled || !canSubmit" @click="submit">
        OK
      </button>
    </div>
  </div>
</template>

<style scoped>
.visit-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

@media (min-width: 768px) {
  .visit-input {
    gap: var(--spacing-sm);
  }
}

.visit-input.disabled {
  opacity: 0.4;
  pointer-events: none;
}

/* ── Quick scores ─────────────────────────────────────────────── */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.quick-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--surface-glass-border);
  border-radius: var(--radius-md);
  color: var(--gold);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 50ms var(--ease-out),
    background var(--duration-fast),
    border-color var(--duration-fast),
    box-shadow var(--duration-fast);
}

@media (min-width: 768px) {
  .quick-btn {
    padding: var(--spacing-sm) 0;
    font-size: 0.95rem;
  }
}

.quick-btn:hover:not(:disabled) {
  border-color: var(--border-gold);
  box-shadow: 0 0 12px var(--gold-glow);
  transform: translateY(-1px);
}

.quick-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.quick-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ── Score display ────────────────────────────────────────────── */
.score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--surface-2);
  border: 2px solid var(--border-subtle);
  border-radius: var(--radius-md);
  min-height: 48px;
  flex-shrink: 0;
  transition: border-color var(--duration-fast);
}

@media (min-width: 768px) {
  .score-display {
    min-height: 56px;
  }
}

.score-display.invalid {
  border-color: var(--red);
  box-shadow: 0 0 12px var(--red-glow);
}

.placeholder {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-muted);
  opacity: 0.5;
}

.score-value {
  font-size: 2rem;
  font-weight: 900;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.score-display.invalid .score-value {
  color: var(--red);
}

/* ── Calculator numpad ────────────────────────────────────────── */
.numpad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xs);
  flex: 1;
  min-height: 0;
}

.num-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--surface-glass-border);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 1.4rem;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 50ms var(--ease-out),
    background var(--duration-fast),
    border-color var(--duration-fast),
    box-shadow var(--duration-fast);
}

@media (min-width: 768px) {
  .num-btn {
    min-height: 56px;
    font-size: 1.5rem;
  }
}

.num-btn:hover:not(:disabled) {
  background: var(--surface-glass-hover);
  border-color: var(--border-default);
  transform: translateY(-1px);
  box-shadow: 0 0 16px rgba(255, 255, 255, 0.06);
}

.num-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.num-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.num-btn.backspace {
  font-size: 1.5rem;
  color: var(--text-secondary);
}

.num-btn.ok {
  background: var(--gold-gradient);
  color: var(--text-inverse);
  border-color: transparent;
  font-size: 1.1rem;
  letter-spacing: 1px;
}

.num-btn.ok:hover:not(:disabled) {
  box-shadow: 0 0 20px var(--gold-glow);
  border-color: transparent;
  transform: translateY(-1px);
}

.num-btn.ok:disabled {
  opacity: 0.3;
  background: var(--surface-3);
  color: var(--text-muted);
}
</style>
