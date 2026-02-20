<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  score: [segment: number, multiplier: number]
}>()

type Modifier = 1 | 2 | 3
const modifier = ref<Modifier>(1)

const modifiers: { label: string, shortcut: string, value: Modifier }[] = [
  { label: 'Single', shortcut: '', value: 1 },
  { label: 'Double', shortcut: 'D', value: 2 },
  { label: 'Triple', shortcut: 'T', value: 3 },
]

const numbers = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20],
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
    <!-- Modifier toggle -->
    <div class="manual-modifier-bar">
      <button
        v-for="mod in modifiers"
        :key="mod.value"
        class="manual-mod-btn"
        :class="[`mod-opt-${mod.value}`, { active: modifier === mod.value }]"
        @click="modifier = mod.value"
      >
        {{ mod.label }}<kbd v-if="mod.shortcut" class="manual-mod-kbd">{{ mod.shortcut }}</kbd>
      </button>
      <div
        class="manual-mod-indicator"
        :style="{ transform: `translateX(${(modifier - 1) * 100}%)` }"
        :class="`indicator-${modifier}`"
      />
    </div>

    <!-- Number grid: 5 columns x 4 rows -->
    <div class="manual-number-grid">
      <template v-for="row in numbers" :key="row[0]">
        <button
          v-for="n in row"
          :key="n"
          class="manual-num-btn"
          :disabled="disabled"
          @click="emitScore(n); haptic()"
        >
          {{ n }}
        </button>
      </template>
    </div>

    <!-- Special row: MISS / Bull -->
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
        <span class="manual-special-label">25</span>
        <span class="manual-special-sub">SB</span>
      </button>
      <button
        class="manual-special-btn bull-double"
        :disabled="disabled"
        @click="emitScore(25, 2); haptic()"
      >
        <span class="manual-special-label">50</span>
        <span class="manual-special-sub">DB</span>
      </button>
    </div>
  </div>
</template>

<style>
.manual-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

@media (min-width: 768px) {
  .manual-input { gap: 8px; }
}

.manual-input.disabled {
  opacity: 0.35;
  pointer-events: none;
}

/* ── Modifier toggle ────────────────────────────────────────────────── */
.manual-modifier-bar {
  position: relative;
  display: flex;
  background: var(--surface-2);
  border-radius: var(--radius-lg);
  border: 2px solid var(--border-color);
  overflow: hidden;
  flex-shrink: 0;
}

.manual-mod-btn {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 10px 0;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: color var(--duration-fast);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

@media (min-width: 768px) {
  .manual-mod-btn { padding: 12px 0; font-size: 0.85rem; }
}

.manual-mod-btn.active { color: var(--text-inverse); }
.manual-mod-btn.mod-opt-1.active { color: var(--text-primary); }

.manual-mod-kbd {
  display: none;
  font-family: var(--font-sans);
  font-size: 0.55rem;
  font-weight: 700;
  margin-left: 4px;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: inherit;
  opacity: 0.5;
  vertical-align: middle;
}

@media (min-width: 768px) {
  .manual-mod-kbd { display: inline; }
}

.manual-mod-indicator {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(100% / 3 - 3px);
  height: calc(100% - 6px);
  border-radius: calc(var(--radius-lg) - 3px);
  transition: transform var(--duration-normal) var(--ease-spring);
}

.manual-mod-indicator.indicator-1 { background: var(--surface-3); }
.manual-mod-indicator.indicator-2 { background: var(--yellow); }
.manual-mod-indicator.indicator-3 { background: var(--blue); }

/* ── Number grid ────────────────────────────────────────────────────── */
.manual-number-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 4px;
  flex: 1;
  min-height: 0;
}

@media (min-width: 768px) {
  .manual-number-grid { gap: 6px; }
}

.manual-num-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-1);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 1.15rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 60ms var(--ease-out),
              box-shadow 60ms var(--ease-out),
              border-color var(--duration-fast),
              background var(--duration-fast);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

@media (min-width: 768px) {
  .manual-num-btn { font-size: 1.3rem; min-height: 52px; }
}

.manual-num-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.manual-num-btn:disabled { opacity: 0.25; cursor: not-allowed; }

/* Modifier-dependent button accent on hover / focus */
.mod-1 .manual-num-btn:hover:not(:disabled) {
  background: var(--surface-2);
}

.mod-2 .manual-num-btn {
  border-color: color-mix(in srgb, var(--border-color) 60%, var(--yellow));
}
.mod-2 .manual-num-btn:hover:not(:disabled) {
  border-color: var(--yellow);
  background: var(--yellow-light);
}

.mod-3 .manual-num-btn {
  border-color: color-mix(in srgb, var(--border-color) 60%, var(--blue));
}
.mod-3 .manual-num-btn:hover:not(:disabled) {
  border-color: var(--blue);
  background: var(--blue-light);
}

/* ── Special row ────────────────────────────────────────────────────── */
.manual-special-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 4px;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .manual-special-row { gap: 6px; }
}

.manual-special-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 0;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 60ms var(--ease-out),
              box-shadow 60ms var(--ease-out),
              background var(--duration-fast);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

@media (min-width: 768px) {
  .manual-special-btn { padding: 14px 0; min-height: 48px; }
}

.manual-special-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.manual-special-btn:disabled { opacity: 0.25; cursor: not-allowed; }

.manual-special-label {
  font-size: 1rem;
  font-weight: 800;
}

.manual-special-sub {
  font-size: 0.65rem;
  font-weight: 700;
  opacity: 0.5;
  text-transform: uppercase;
}

.manual-special-btn.miss {
  background: var(--surface-2);
  color: var(--text-muted);
  font-size: 0.85rem;
  letter-spacing: 1px;
}
.manual-special-btn.miss:hover:not(:disabled) {
  background: var(--red-light);
  color: var(--red);
}

.manual-special-btn.bull-single {
  background: var(--surface-1);
  color: var(--green);
}
.manual-special-btn.bull-single:hover:not(:disabled) {
  background: var(--green-light);
}

.manual-special-btn.bull-double {
  background: var(--surface-1);
  color: var(--red);
}
.manual-special-btn.bull-double:hover:not(:disabled) {
  background: var(--red-light);
}
</style>
