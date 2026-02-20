<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  score: [segment: number, multiplier: number]
}>()

type Modifier = 1 | 2 | 3
const modifier = ref<Modifier>(1)

const modifiers: { label: string, shortcut: string, value: Modifier, color: string }[] = [
  { label: 'Single', shortcut: '', value: 1, color: 'neutral' },
  { label: 'Double', shortcut: 'D', value: 2, color: 'yellow' },
  { label: 'Triple', shortcut: 'T', value: 3, color: 'blue' },
]

const numbers = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
]

function emitScore(segment: number, mult?: number) {
  emit('score', segment, mult ?? modifier.value)
  if (modifier.value !== 1)
    modifier.value = 1
}

function haptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
    return
  if (e.key === 'd' || e.key === 'D') {
    e.preventDefault()
    modifier.value = modifier.value === 2 ? 1 : 2
  }
  else if (e.key === 't' || e.key === 'T') {
    e.preventDefault()
    modifier.value = modifier.value === 3 ? 1 : 3
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="manual-input" :class="[`mod-${modifier}`, { disabled }]">
    <div class="flex shrink-0">
      <div class="manual-modifier-toggle">
        <button
          v-for="mod in modifiers"
          :key="mod.value"
          class="manual-mod-btn"
          :class="{ active: modifier === mod.value }"
          @click="modifier = mod.value"
        >
          {{ mod.label }}<kbd v-if="mod.shortcut" class="manual-mod-kbd">{{ mod.shortcut }}</kbd>
        </button>
        <div
          class="manual-mod-pill"
          :style="{ transform: `translateX(${(modifier - 1) * 100}%)` }"
          :class="`pill-${modifier}`"
        />
      </div>
    </div>

    <div class="manual-number-grid">
      <template v-for="row in numbers" :key="row[0]">
        <button
          v-for="n in row"
          :key="n"
          class="manual-num-btn"
          :disabled="disabled"
          @click="emitScore(n); haptic()"
        >
          {{ n }}<span v-if="modifier > 1" class="manual-mult-badge" :class="`mult-${modifier}`">x{{ modifier }}</span>
        </button>
      </template>
    </div>

    <div class="manual-special-row">
      <button
        class="manual-special-btn miss"
        :disabled="disabled"
        @click="emitScore(0, 1); haptic()"
      >
        MISS
      </button>
      <button
        class="manual-special-btn bull-single"
        :disabled="disabled"
        @click="emitScore(25, 1); haptic()"
      >
        25 / SB
      </button>
      <button
        class="manual-special-btn bull-double"
        :disabled="disabled"
        @click="emitScore(25, 2); haptic()"
      >
        50 / DB
      </button>
    </div>
  </div>
</template>

<style>
/* ManualScoreInput — complex interactive grid with parent-class-dependent
   hover colors and sliding pill. Cannot be pure Tailwind. */
.manual-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

@media (min-width: 768px) {
  .manual-input { gap: var(--spacing-sm); }
}

.manual-input.disabled {
  opacity: 0.4;
  pointer-events: none;
}

/* Modifier toggle */
.manual-modifier-toggle {
  position: relative;
  display: flex;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid var(--border-color);
  width: 100%;
}

.manual-mod-btn {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 8px var(--spacing-lg);
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: color var(--duration-fast);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@media (min-width: 768px) {
  .manual-mod-btn { padding: var(--spacing-md) var(--spacing-lg); }
}

.manual-mod-btn.active { color: var(--text-inverse); }
.mod-1 .manual-mod-btn.active { color: var(--text-primary); }

.manual-mod-kbd {
  display: none;
  font-family: var(--font-sans);
  font-size: 0.6rem;
  font-weight: 700;
  margin-left: 4px;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color);
  color: inherit;
  opacity: 0.6;
  vertical-align: middle;
}

@media (min-width: 768px) {
  .manual-mod-kbd { display: inline; }
}

.manual-mod-pill {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(100% / 3 - 2px);
  height: calc(100% - 4px);
  border-radius: calc(var(--radius-md) - 2px);
  transition: transform var(--duration-normal) var(--ease-spring);
}

.manual-mod-pill.pill-1 { background: var(--surface-3); }
.manual-mod-pill.pill-2 { background: var(--yellow); }
.manual-mod-pill.pill-3 { background: var(--blue); }

/* Number grid */
.manual-number-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(5, 1fr);
  gap: var(--spacing-xs);
  flex: 1;
  min-height: 0;
}

.manual-num-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-1);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 1.25rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 50ms var(--ease-out), background var(--duration-fast), box-shadow var(--duration-fast);
}

@media (min-width: 768px) {
  .manual-num-btn { min-height: 56px; font-size: 1.4rem; }
}

.manual-num-btn:hover:not(:disabled) {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-md);
}

.manual-num-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.mod-2 .manual-num-btn:hover:not(:disabled) { border-color: var(--yellow); }
.mod-3 .manual-num-btn:hover:not(:disabled) { border-color: var(--blue); }

.manual-num-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.manual-mult-badge {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 0.55rem;
  font-weight: 700;
  line-height: 1;
  opacity: 0.7;
}

.manual-mult-badge.mult-2 { color: var(--yellow); }
.manual-mult-badge.mult-3 { color: var(--blue); }

/* Special row */
.manual-special-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-xs);
  flex: 0.2;
  min-height: 0;
}

@media (min-width: 768px) {
  .manual-special-row { flex: none; }
}

.manual-special-btn {
  padding: 10px 0;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 50ms var(--ease-out), background var(--duration-fast), box-shadow var(--duration-fast);
  text-transform: uppercase;
}

@media (min-width: 768px) {
  .manual-special-btn { min-height: 48px; }
}

.manual-special-btn:hover:not(:disabled) { transform: translate(-2px, -2px); box-shadow: var(--shadow-md); }
.manual-special-btn:active:not(:disabled) { transform: translate(2px, 2px); box-shadow: none; }
.manual-special-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.manual-special-btn.miss { background: var(--surface-1); color: var(--red); }
.manual-special-btn.miss:hover:not(:disabled) { background: var(--red-light, #fee2e2); }

.manual-special-btn.bull-single { background: var(--surface-1); color: var(--green); }
.manual-special-btn.bull-single:hover:not(:disabled) { background: var(--green-light, #dcfce7); }

.manual-special-btn.bull-double { background: var(--surface-1); color: var(--red); }
.manual-special-btn.bull-double:hover:not(:disabled) { background: var(--red-light, #fee2e2); }
</style>
