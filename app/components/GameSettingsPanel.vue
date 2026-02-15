<script setup lang="ts">
import type { CheckoutMode, GameMode } from '~/types/game'

const gameMode = defineModel<GameMode>('gameMode', { required: true })
const checkout = defineModel<CheckoutMode>('checkout', { required: true })
const legsToWin = defineModel<number>('legsToWin', { required: true })
const setsToWin = defineModel<number>('setsToWin', { required: true })

const legOptions = [1, 3, 5, 7]
const setOptions = [1, 3, 5]

const isCricket = computed(() => gameMode.value === 'cricket')
</script>

<template>
  <div class="flex flex-col gap-xl w-full">
    <!-- Game mode -->
    <div class="glass-card w-full p-lg flex flex-col items-center gap-md">
      <span class="settings-label">Game Mode</span>
      <div class="mode-toggle multi">
        <button
          class="mode-option"
          :class="{ active: gameMode === '501' }"
          @click="gameMode = '501'"
        >
          501
        </button>
        <button
          class="mode-option"
          :class="{ active: gameMode === '301' }"
          @click="gameMode = '301'"
        >
          301
        </button>
        <button
          class="mode-option"
          :class="{ active: gameMode === 'cricket' }"
          @click="gameMode = 'cricket'"
        >
          Cricket
        </button>
        <div
          class="mode-pill"
          :style="{
            width: 'calc(33.333% - 2px)',
            transform: `translateX(${gameMode === '301' ? '100%' : gameMode === 'cricket' ? '200%' : '0'})`
          }"
        />
      </div>
    </div>

    <!-- Checkout mode (not applicable for Cricket) -->
    <div v-if="!isCricket" class="glass-card w-full p-lg flex flex-col items-center gap-md">
      <span class="settings-label">Checkout</span>
      <div class="mode-toggle">
        <button
          class="mode-option"
          :class="{ active: checkout === 'double_out' }"
          @click="checkout = 'double_out'"
        >
          Double Out
        </button>
        <button
          class="mode-option"
          :class="{ active: checkout === 'single_out' }"
          @click="checkout = 'single_out'"
        >
          Single Out
        </button>
        <div
          class="mode-pill"
          :style="{ transform: checkout === 'single_out' ? 'translateX(100%)' : 'translateX(0)' }"
        />
      </div>
    </div>

    <!-- Legs -->
    <div class="glass-card w-full p-lg flex flex-col items-center gap-md">
      <span class="settings-label">Legs (first to)</span>
      <div class="mode-toggle multi">
        <button
          v-for="opt in legOptions"
          :key="opt"
          class="mode-option"
          :class="{ active: legsToWin === opt }"
          @click="legsToWin = opt; if (opt === 1) setsToWin = 1"
        >
          {{ opt }}
        </button>
        <div
          class="mode-pill"
          :style="{
            width: `calc(${100 / legOptions.length}% - 2px)`,
            transform: `translateX(${legOptions.indexOf(legsToWin) * 100}%)`
          }"
        />
      </div>
    </div>

    <!-- Sets (only when legs > 1) -->
    <div
      v-if="legsToWin > 1"
      class="glass-card w-full p-lg flex flex-col items-center gap-md"
    >
      <span class="settings-label">Sets (first to)</span>
      <div class="mode-toggle multi">
        <button
          v-for="opt in setOptions"
          :key="opt"
          class="mode-option"
          :class="{ active: setsToWin === opt }"
          @click="setsToWin = opt"
        >
          {{ opt }}
        </button>
        <div
          class="mode-pill"
          :style="{
            width: `calc(${100 / setOptions.length}% - 2px)`,
            transform: `translateX(${setOptions.indexOf(setsToWin) * 100}%)`
          }"
        />
      </div>
    </div>

    <slot />
  </div>
</template>

<style scoped>
.settings-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* ── Mode toggle (pill animation) ────────────────────────────── */
.mode-toggle {
  position: relative;
  display: flex;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.mode-option {
  position: relative;
  z-index: 1;
  padding: var(--spacing-sm) var(--spacing-2xl);
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: color var(--duration-normal) var(--ease-out);
}

.mode-option.active {
  color: var(--text-inverse);
}

.mode-pill {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(50% - 2px);
  height: calc(100% - 4px);
  background: var(--gold-gradient);
  border-radius: calc(var(--radius-md) - 2px);
  transition: transform var(--duration-normal) var(--ease-spring);
}

.mode-toggle.multi .mode-option {
  padding: var(--spacing-sm) var(--spacing-lg);
}

@media (max-width: 600px) {
  .mode-option {
    padding: var(--spacing-sm) var(--spacing-xl);
    font-size: 1rem;
  }
}
</style>
