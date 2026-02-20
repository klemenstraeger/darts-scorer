<script setup lang="ts">
import type { CheckoutMode } from '~/types/game'

const gameMode = defineModel<'501' | '301'>('gameMode', { required: true })
const checkout = defineModel<CheckoutMode>('checkout', { required: true })
const legsToWin = defineModel<number>('legsToWin', { required: true })
const setsToWin = defineModel<number>('setsToWin', { required: true })

const legOptions = [1, 3, 5, 7]
const setOptions = [1, 3, 5]
</script>

<template>
  <div class="flex flex-col gap-xl w-full">
    <!-- Game mode -->
    <div class="bg-surface-1 border-2 border-black rounded-lg shadow-md w-full p-lg flex flex-col items-center gap-md">
      <span class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-[0.1em]">Game Mode</span>
      <div class="game-settings__toggle relative flex bg-surface-2 rounded-md overflow-hidden border border-black/10">
        <button
          class="relative z-[1] py-sm px-2xl max-sm:px-xl bg-transparent border-none text-fg-muted text-lg max-sm:text-base font-bold cursor-pointer transition-colors duration-150 ease-out"
          :class="{ 'text-fg-inverse': gameMode === '501' }"
          @click="gameMode = '501'"
        >
          501
        </button>
        <button
          class="relative z-[1] py-sm px-2xl max-sm:px-xl bg-transparent border-none text-fg-muted text-lg max-sm:text-base font-bold cursor-pointer transition-colors duration-150 ease-out"
          :class="{ 'text-fg-inverse': gameMode === '301' }"
          @click="gameMode = '301'"
        >
          301
        </button>
        <div
          class="game-settings__pill absolute top-0.5 left-0.5 w-[calc(50%-2px)] h-[calc(100%-4px)] bg-yellow rounded-[calc(var(--radius-md)-2px)] border-2 border-black transition-transform duration-150"
          :style="{ transform: gameMode === '301' ? 'translateX(100%)' : 'translateX(0)' }"
        />
      </div>
    </div>

    <!-- Checkout mode -->
    <div class="bg-surface-1 border-2 border-black rounded-lg shadow-md w-full p-lg flex flex-col items-center gap-md">
      <span class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-[0.1em]">Checkout</span>
      <div class="game-settings__toggle relative flex bg-surface-2 rounded-md overflow-hidden border border-black/10">
        <button
          class="relative z-[1] py-sm px-2xl max-sm:px-xl bg-transparent border-none text-fg-muted text-lg max-sm:text-base font-bold cursor-pointer transition-colors duration-150 ease-out"
          :class="{ 'text-fg-inverse': checkout === 'double_out' }"
          @click="checkout = 'double_out'"
        >
          Double Out
        </button>
        <button
          class="relative z-[1] py-sm px-2xl max-sm:px-xl bg-transparent border-none text-fg-muted text-lg max-sm:text-base font-bold cursor-pointer transition-colors duration-150 ease-out"
          :class="{ 'text-fg-inverse': checkout === 'single_out' }"
          @click="checkout = 'single_out'"
        >
          Single Out
        </button>
        <div
          class="game-settings__pill absolute top-0.5 left-0.5 w-[calc(50%-2px)] h-[calc(100%-4px)] bg-yellow rounded-[calc(var(--radius-md)-2px)] border-2 border-black transition-transform duration-150"
          :style="{ transform: checkout === 'single_out' ? 'translateX(100%)' : 'translateX(0)' }"
        />
      </div>
    </div>

    <!-- Legs -->
    <div class="bg-surface-1 border-2 border-black rounded-lg shadow-md w-full p-lg flex flex-col items-center gap-md">
      <span class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-[0.1em]">Legs (first to)</span>
      <div class="game-settings__toggle relative flex bg-surface-2 rounded-md overflow-hidden border border-black/10">
        <button
          v-for="opt in legOptions"
          :key="opt"
          class="relative z-[1] py-sm px-lg bg-transparent border-none text-fg-muted text-lg max-sm:text-base font-bold cursor-pointer transition-colors duration-150 ease-out"
          :class="{ 'text-fg-inverse': legsToWin === opt }"
          @click="legsToWin = opt; if (opt === 1) setsToWin = 1"
        >
          {{ opt }}
        </button>
        <div
          class="game-settings__pill absolute top-0.5 left-0.5 h-[calc(100%-4px)] bg-yellow rounded-[calc(var(--radius-md)-2px)] border-2 border-black transition-transform duration-150"
          :style="{
            width: `calc(${100 / legOptions.length}% - 2px)`,
            transform: `translateX(${legOptions.indexOf(legsToWin) * 100}%)`,
          }"
        />
      </div>
    </div>

    <!-- Sets (only when legs > 1) -->
    <div
      v-if="legsToWin > 1"
      class="bg-surface-1 border-2 border-black rounded-lg shadow-md w-full p-lg flex flex-col items-center gap-md"
    >
      <span class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-[0.1em]">Sets (first to)</span>
      <div class="game-settings__toggle relative flex bg-surface-2 rounded-md overflow-hidden border border-black/10">
        <button
          v-for="opt in setOptions"
          :key="opt"
          class="relative z-[1] py-sm px-lg bg-transparent border-none text-fg-muted text-lg max-sm:text-base font-bold cursor-pointer transition-colors duration-150 ease-out"
          :class="{ 'text-fg-inverse': setsToWin === opt }"
          @click="setsToWin = opt"
        >
          {{ opt }}
        </button>
        <div
          class="game-settings__pill absolute top-0.5 left-0.5 h-[calc(100%-4px)] bg-yellow rounded-[calc(var(--radius-md)-2px)] border-2 border-black transition-transform duration-150"
          :style="{
            width: `calc(${100 / setOptions.length}% - 2px)`,
            transform: `translateX(${setOptions.indexOf(setsToWin) * 100}%)`,
          }"
        />
      </div>
    </div>

    <slot />
  </div>
</template>
