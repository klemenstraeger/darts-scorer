<script setup lang="ts">
import type { InputMode } from '~/types/game'
import type { DartboardTheme } from '~/utils/dartboard-themes'
import { DARTBOARD_THEMES } from '~/utils/dartboard-themes'

const { dartboardThemeId, setDartboardThemeId, inputMode, setInputMode } = useSettings()
const { audioEnabled, toggle: toggleAudio } = useAudio()
const { enabled: announcerEnabled, toggle: toggleAnnouncer } = useAnnouncer()
const { profile, logout } = useProfile()

function selectTheme(theme: DartboardTheme) {
  setDartboardThemeId(theme.id)
}

const inputModes: { id: InputMode, label: string, description: string, icon: string }[] = [
  { id: 'per_dart', label: 'Per Dart', description: 'Enter each dart individually. Full stats and accuracy tracking.', icon: '🎯' },
  { id: 'per_visit', label: 'Per Visit', description: 'Enter your 3-dart total. Faster scoring with quick-score buttons.', icon: '⚡' },
]
</script>

<template>
  <div class="flex flex-col items-center gap-xl px-lg py-2xl max-w-[600px] mx-auto w-full max-sm:px-md max-sm:py-xl">
    <div class="text-center">
      <h2 class="text-2xl font-extrabold text-fg">
        Settings
      </h2>
      <p class="text-fg-muted text-[0.85rem] mt-xs">
        Customize your experience
      </p>
    </div>

    <!-- Score Input Mode Section -->
    <div class="w-full flex flex-col gap-lg">
      <h3 class="text-[1.1rem] font-bold text-fg">
        Score Input Mode
      </h3>

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

    <!-- Audio & Announcer Section -->
    <div class="w-full flex flex-col gap-md">
      <h3 class="text-[1.1rem] font-bold text-fg">Audio</h3>

      <button class="toggle-row" @click="toggleAudio()">
        <div class="flex flex-col gap-[2px]">
          <span class="text-[0.9rem] font-bold text-fg">Sound Effects</span>
          <span class="text-fg-muted text-[0.75rem]">Play sounds for throws, busts, and game events</span>
        </div>
        <span class="toggle-switch" :class="{ active: audioEnabled }" />
      </button>

      <button class="toggle-row" @click="toggleAnnouncer()">
        <div class="flex flex-col gap-[2px]">
          <span class="text-[0.9rem] font-bold text-fg">Voice Announcer</span>
          <span class="text-fg-muted text-[0.75rem]">Announce scores with classic darts caller voice</span>
        </div>
        <span class="toggle-switch" :class="{ active: announcerEnabled }" />
      </button>
    </div>

    <!-- Dartboard Theme Section -->
    <div class="w-full flex flex-col gap-lg">
      <h3 class="text-[1.1rem] font-bold text-fg">
        Dartboard Theme
      </h3>

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

    <!-- Account Section -->
    <div v-if="profile" class="w-full flex flex-col gap-lg">
      <h3 class="text-[1.1rem] font-bold text-fg">Account</h3>

      <div class="flex items-center justify-between p-md bg-surface-2 border border-border-subtle rounded-md">
        <div class="flex flex-col gap-[2px]">
          <span class="text-[0.85rem] font-semibold text-fg">{{ profile.displayName }}</span>
          <span class="text-[0.75rem] text-fg-muted">Logged in</span>
        </div>
        <button class="logout-btn" @click="logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
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

/* ── Toggle row ── */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: border-color var(--duration-normal) var(--ease-out);
}

.toggle-row:hover {
  border-color: var(--border-default);
}

/* ── Toggle switch ── */
.toggle-switch {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--surface-3);
  border: 1px solid var(--border-subtle);
  transition: background var(--duration-normal), border-color var(--duration-normal);
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--text-secondary);
  transition: transform var(--duration-normal) var(--ease-out), background var(--duration-normal);
}

.toggle-switch.active {
  background: rgba(255, 215, 0, 0.15);
  border-color: var(--gold);
}

.toggle-switch.active::after {
  transform: translateX(20px);
  background: var(--gold);
}

/* ── Logout button ── */
.logout-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.logout-btn:hover {
  color: var(--red);
  border-color: var(--red);
  background: rgba(239, 68, 68, 0.1);
}
</style>
