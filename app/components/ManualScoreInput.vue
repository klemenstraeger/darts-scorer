<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  score: [segment: number, multiplier: number]
}>()

type Modifier = 1 | 2 | 3
const modifier = ref<Modifier>(1)

const modifiers: { label: string; shortcut: string; value: Modifier; color: string }[] = [
  { label: 'Single', shortcut: '', value: 1, color: 'neutral' },
  { label: 'Double', shortcut: 'D', value: 2, color: 'gold' },
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
  if (modifier.value !== 1) modifier.value = 1
}

function haptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  if (e.key === 'd' || e.key === 'D') {
    e.preventDefault()
    modifier.value = modifier.value === 2 ? 1 : 2
  } else if (e.key === 't' || e.key === 'T') {
    e.preventDefault()
    modifier.value = modifier.value === 3 ? 1 : 3
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="manual-input" :class="{ disabled }">
    <div class="flex shrink-0">
      <div class="modifier-toggle" :class="`mod-${modifier}`">
        <button
          v-for="mod in modifiers"
          :key="mod.value"
          class="mod-btn"
          :class="{ active: modifier === mod.value }"
          @click="modifier = mod.value"
        >
          {{ mod.label }}<kbd v-if="mod.shortcut" class="mod-kbd">{{ mod.shortcut }}</kbd>
        </button>
        <div
          class="mod-pill"
          :style="{ transform: `translateX(${(modifier - 1) * 100}%)` }"
          :class="`pill-${modifier}`"
        ></div>
      </div>
    </div>

    <div class="number-grid" :class="`mod-${modifier}`">
      <template v-for="row in numbers" :key="row[0]">
        <button
          v-for="n in row"
          :key="n"
          class="num-btn"
          :disabled="disabled"
          @click="emitScore(n); haptic()"
        >
          {{ n }}<span v-if="modifier > 1" class="mult-badge" :class="`mult-${modifier}`">x{{ modifier }}</span>
        </button>
      </template>
    </div>

    <div class="special-row">
      <button
        class="special-btn miss"
        :disabled="disabled"
        @click="emitScore(0, 1); haptic()"
      >
        MISS
      </button>
      <button
        class="special-btn bull-single"
        :disabled="disabled"
        @click="emitScore(25, 1); haptic()"
      >
        25 / SB
      </button>
      <button
        class="special-btn bull-double"
        :disabled="disabled"
        @click="emitScore(25, 2); haptic()"
      >
        50 / DB
      </button>
    </div>
  </div>
</template>

<style scoped>
.manual-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

@media (min-width: 768px) {
  .manual-input {
    gap: var(--spacing-sm);
  }
}

.manual-input.disabled {
  opacity: 0.4;
  pointer-events: none;
}

/* ── Modifier toggle ─────────────────────────────────────────── */
.modifier-toggle {
  position: relative;
  display: flex;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  width: 100%;
}

.mod-btn {
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
  .mod-btn {
    padding: var(--spacing-md) var(--spacing-lg);
  }
}

.mod-btn.active {
  color: var(--text-inverse);
}

.mod-kbd {
  display: none;
  font-family: var(--font-sans);
  font-size: 0.6rem;
  font-weight: 700;
  margin-left: 4px;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: inherit;
  opacity: 0.6;
  vertical-align: middle;
}

@media (min-width: 768px) {
  .mod-kbd {
    display: inline;
  }
}

.mod-pill {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(100% / 3 - 2px);
  height: calc(100% - 4px);
  border-radius: calc(var(--radius-md) - 2px);
  transition: transform var(--duration-normal) var(--ease-spring);
}

.pill-1 { background: var(--surface-3); }
.pill-1 + .mod-btn.active,
.mod-1 .mod-btn.active { color: var(--text-primary); }
.pill-2 { background: var(--gold-gradient); }
.pill-3 { background: var(--blue); }

/* ── Number grid ─────────────────────────────────────────────── */
.number-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(5, 1fr);
  gap: var(--spacing-xs);
  flex: 1;
  min-height: 0;
}

.num-btn {
  position: relative;
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
  font-size: 1.25rem;
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
    font-size: 1.4rem;
  }
}

.num-btn:hover:not(:disabled) {
  background: var(--surface-glass-hover);
  border-color: var(--border-default);
  transform: translateY(-1px);
}

.num-btn:active:not(:disabled) {
  transform: scale(0.95);
  transition: transform 50ms var(--ease-out);
}

.mod-1 .num-btn:hover:not(:disabled) { box-shadow: 0 0 16px rgba(255, 255, 255, 0.06); }
.mod-2 .num-btn:hover:not(:disabled) { border-color: var(--border-gold); box-shadow: 0 0 16px var(--gold-glow); }
.mod-3 .num-btn:hover:not(:disabled) { border-color: rgba(59, 130, 246, 0.4); box-shadow: 0 0 16px var(--blue-glow); }

.num-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.mult-badge {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 0.55rem;
  font-weight: 700;
  line-height: 1;
  opacity: 0.7;
}

.mult-2 { color: var(--gold); }
.mult-3 { color: var(--blue); }

/* ── Special row ─────────────────────────────────────────────── */
.special-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-xs);
  flex: 0.2;
  min-height: 0;
}

@media (min-width: 768px) {
  .special-row {
    flex: none;
  }
}

.special-btn {
  padding: 10px 0;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 50ms var(--ease-out),
    background var(--duration-fast),
    box-shadow var(--duration-fast);
  text-transform: uppercase;
}

@media (min-width: 768px) {
  .special-btn {
    min-height: 48px;
  }
}

.special-btn:active:not(:disabled) { transform: scale(0.95); }
.special-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.special-btn.miss { background: var(--surface-2); color: var(--red); }
.special-btn.miss:hover:not(:disabled) { background: rgba(239, 68, 68, 0.1); box-shadow: 0 0 16px var(--red-glow); }

.special-btn.bull-single { background: var(--surface-2); color: var(--green); }
.special-btn.bull-single:hover:not(:disabled) { background: rgba(34, 197, 94, 0.1); box-shadow: 0 0 16px var(--green-glow); }

.special-btn.bull-double { background: var(--surface-2); color: var(--red); }
.special-btn.bull-double:hover:not(:disabled) { background: rgba(239, 68, 68, 0.1); box-shadow: 0 0 16px var(--red-glow); }
</style>
