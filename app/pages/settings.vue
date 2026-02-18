<script setup lang="ts">
import { DARTBOARD_THEMES } from '~/utils/dartboard-themes'
import type { DartboardTheme } from '~/utils/dartboard-themes'
import type { InputMode } from '~/types/game'

const { dartboardThemeId, setDartboardThemeId, inputMode, setInputMode } = useSettings()

function selectTheme(theme: DartboardTheme) {
  setDartboardThemeId(theme.id)
}

const inputModes: { id: InputMode; label: string; description: string; icon: string }[] = [
  { id: 'per_dart', label: 'Per Dart', description: 'Enter each dart individually. Full stats and accuracy tracking.', icon: '🎯' },
  { id: 'per_visit', label: 'Per Visit', description: 'Enter your 3-dart total. Faster scoring with quick-score buttons.', icon: '⚡' },
]
</script>

<template>
  <div class="flex flex-col items-center gap-xl px-lg py-2xl max-w-[600px] mx-auto w-full max-sm:px-md max-sm:py-xl">
    <div class="text-center">
      <h2 class="text-2xl font-extrabold text-fg">Settings</h2>
      <p class="text-fg-muted text-[0.85rem] mt-xs">Customize your experience</p>
    </div>

    <!-- Score Input Mode Section -->
    <div class="w-full flex flex-col gap-lg">
      <h3 class="text-[1.1rem] font-bold text-fg">Score Input Mode</h3>

      <div class="grid grid-cols-2 gap-md">
        <button
          v-for="mode in inputModes"
          :key="mode.id"
          class="theme-card"
          :class="{ active: inputMode === mode.id }"
          @click="setInputMode(mode.id)"
        >
          <span class="text-[2rem]">{{ mode.icon }}</span>
          <span class="theme-name">{{ mode.label }}</span>
          <span class="text-fg-muted text-[0.75rem] text-center leading-tight px-xs">{{ mode.description }}</span>
        </button>
      </div>
    </div>

    <!-- Dartboard Theme Section -->
    <div class="w-full flex flex-col gap-lg">
      <h3 class="text-[1.1rem] font-bold text-fg">Dartboard Theme</h3>

      <div class="grid grid-cols-2 gap-md">
        <button
          v-for="theme in DARTBOARD_THEMES"
          :key="theme.id"
          class="theme-card"
          :class="{ active: theme.id === dartboardThemeId }"
          @click="selectTheme(theme)"
        >
          <DartBoard :theme="theme" :disabled="true" class="theme-preview" />
          <span class="theme-name">{{ theme.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) var(--spacing-md);
  background: var(--surface-2);
  border: 2px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out);
}

.theme-card:hover {
  border-color: var(--border-default);
}

.theme-card.active {
  border-color: var(--gold);
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.15);
}

.theme-preview {
  width: 100%;
  max-width: 140px;
  pointer-events: none;
}

.theme-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.theme-card.active .theme-name {
  color: var(--gold);
}
</style>
