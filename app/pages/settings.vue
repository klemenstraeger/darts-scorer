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
  <div class="flex flex-col items-center gap-xl px-lg py-xl max-w-[600px] mx-auto w-full max-sm:px-md">
    <!-- Back link -->
    <div class="w-full">
      <BackLink to="/dashboard" label="Back" />
    </div>

    <!-- Hero -->
    <PageHero title="Settings" subtitle="Customize your experience" color="yellow">
      <template #action>
        <span class="text-[2.5rem] select-none">⚙️</span>
      </template>
    </PageHero>

    <!-- Score Input Mode Section -->
    <section class="w-full flex flex-col gap-md">
      <h3 class="text-[0.8rem] font-bold text-fg-muted uppercase tracking-wide">
        Score Input Mode
      </h3>

      <div class="grid grid-cols-2 gap-md">
        <button
          v-for="mode in inputModes"
          :key="mode.id"
          class="flex flex-col items-center gap-sm py-lg px-md border-2 border-black rounded-lg cursor-pointer transition-all duration-100"
          :class="inputMode === mode.id
            ? 'bg-yellow-light border-yellow shadow-md -translate-x-0.5 -translate-y-0.5'
            : 'bg-surface-1 shadow-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'"
          @click="setInputMode(mode.id)"
        >
          <span class="text-[2rem]">{{ mode.icon }}</span>
          <span class="text-[0.9rem] font-extrabold" :class="inputMode === mode.id ? 'text-fg' : 'text-fg-secondary'">{{ mode.label }}</span>
          <span class="text-fg-muted text-[0.75rem] text-center leading-tight px-xs">{{ mode.description }}</span>
        </button>
      </div>
    </section>

    <!-- Audio & Announcer Section -->
    <section class="w-full flex flex-col gap-md">
      <h3 class="text-[0.8rem] font-bold text-fg-muted uppercase tracking-wide">
        Audio
      </h3>

      <button
        class="flex items-center justify-between gap-md py-md px-lg bg-surface-1 border-2 border-black rounded-lg cursor-pointer text-left shadow-sm transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        @click="toggleAudio()"
      >
        <div class="flex flex-col gap-[2px]">
          <span class="text-[0.9rem] font-bold text-fg">Sound Effects</span>
          <span class="text-fg-muted text-[0.75rem]">Play sounds for throws, busts, and game events</span>
        </div>
        <span
          class="relative shrink-0 w-[44px] h-[24px] rounded-full border-2 border-black transition-colors duration-150"
          :class="audioEnabled ? 'bg-yellow' : 'bg-surface-3'"
        >
          <span
            class="absolute top-[2px] left-[2px] size-[16px] rounded-full border border-black transition-all duration-150"
            :class="audioEnabled ? 'translate-x-[20px] bg-white' : 'bg-white'"
          />
        </span>
      </button>

      <button
        class="flex items-center justify-between gap-md py-md px-lg bg-surface-1 border-2 border-black rounded-lg cursor-pointer text-left shadow-sm transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        @click="toggleAnnouncer()"
      >
        <div class="flex flex-col gap-[2px]">
          <span class="text-[0.9rem] font-bold text-fg">Voice Announcer</span>
          <span class="text-fg-muted text-[0.75rem]">Announce scores with classic darts caller voice</span>
        </div>
        <span
          class="relative shrink-0 w-[44px] h-[24px] rounded-full border-2 border-black transition-colors duration-150"
          :class="announcerEnabled ? 'bg-yellow' : 'bg-surface-3'"
        >
          <span
            class="absolute top-[2px] left-[2px] size-[16px] rounded-full border border-black transition-all duration-150"
            :class="announcerEnabled ? 'translate-x-[20px] bg-white' : 'bg-white'"
          />
        </span>
      </button>
    </section>

    <!-- Manage Section -->
    <section class="w-full flex flex-col gap-md">
      <h3 class="text-[0.8rem] font-bold text-fg-muted uppercase tracking-wide">
        Manage
      </h3>

      <NuxtLink
        to="/players"
        class="flex items-center justify-between gap-md py-md px-lg bg-surface-1 border-2 border-black rounded-lg no-underline shadow-sm transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        <div class="flex items-center gap-md">
          <div class="size-10 rounded-lg bg-yellow-light border-2 border-black flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div class="flex flex-col gap-[2px]">
            <span class="text-[0.9rem] font-bold text-fg">Players</span>
            <span class="text-fg-muted text-[0.75rem]">Manage players and avatars</span>
          </div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-fg-muted">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </NuxtLink>

      <NuxtLink
        to="/teams"
        class="flex items-center justify-between gap-md py-md px-lg bg-surface-1 border-2 border-black rounded-lg no-underline shadow-sm transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        <div class="flex items-center gap-md">
          <div class="size-10 rounded-lg bg-blue-light border-2 border-black flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div class="flex flex-col gap-[2px]">
            <span class="text-[0.9rem] font-bold text-fg">Teams</span>
            <span class="text-fg-muted text-[0.75rem]">Create and manage teams for doubles</span>
          </div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-fg-muted">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </NuxtLink>
    </section>

    <!-- Dartboard Theme Section -->
    <section class="w-full flex flex-col gap-md">
      <h3 class="text-[0.8rem] font-bold text-fg-muted uppercase tracking-wide">
        Dartboard Theme
      </h3>

      <div class="grid grid-cols-2 gap-md">
        <button
          v-for="theme in DARTBOARD_THEMES"
          :key="theme.id"
          class="flex flex-col items-center gap-sm py-lg px-md border-2 border-black rounded-lg cursor-pointer transition-all duration-100"
          :class="theme.id === dartboardThemeId
            ? 'bg-yellow-light border-yellow shadow-md -translate-x-0.5 -translate-y-0.5'
            : 'bg-surface-1 shadow-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'"
          @click="selectTheme(theme)"
        >
          <DartBoard :theme="theme" :disabled="true" class="w-full max-w-[140px] pointer-events-none" />
          <span class="text-[0.85rem] font-extrabold" :class="theme.id === dartboardThemeId ? 'text-fg' : 'text-fg-secondary'">{{ theme.name }}</span>
        </button>
      </div>
    </section>

    <!-- Account Section -->
    <section class="w-full flex flex-col gap-md">
      <h3 class="text-[0.8rem] font-bold text-fg-muted uppercase tracking-wide">
        Account
      </h3>

      <div v-if="profile" class="flex items-center justify-between p-lg bg-surface-1 border-2 border-black rounded-lg shadow-sm">
        <div class="flex items-center gap-md">
          <div class="size-10 rounded-lg bg-green-light border-2 border-black flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div class="flex flex-col gap-[2px]">
            <span class="text-[0.9rem] font-bold text-fg">{{ profile.displayName }}</span>
            <span class="text-[0.75rem] text-fg-muted">Logged in</span>
          </div>
        </div>
        <Button variant="destructive" size="sm" @click="logout">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
        </Button>
      </div>
      <div v-else class="flex items-center justify-between p-lg bg-surface-1 border-2 border-black rounded-lg shadow-sm">
        <div class="flex items-center gap-md">
          <div class="size-10 rounded-lg bg-surface-3 border-2 border-black flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div class="flex flex-col gap-[2px]">
            <span class="text-[0.9rem] font-bold text-fg">Not signed in</span>
            <span class="text-[0.75rem] text-fg-muted">Sign in to save across devices</span>
          </div>
        </div>
        <Button as-child>
          <NuxtLink to="/login" class="no-underline">
            Sign In
          </NuxtLink>
        </Button>
      </div>
    </section>
  </div>
</template>
