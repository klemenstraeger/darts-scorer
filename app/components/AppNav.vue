<script setup lang="ts">
const route = useRoute()
const { profile, fetch: fetchProfile, logout } = useProfile()
const { stopGame } = useGameState()
const { isAuthenticated } = useAuth()

// Fetch profile on mount if not already loaded (only for authenticated users)
onMounted(() => {
  if (isAuthenticated.value && !profile.value)
    fetchProfile()
})

const navItems = computed(() => [
  isAuthenticated.value
    ? { path: '/dashboard', label: 'Home', name: 'dashboard', icon: 'home' }
    : { path: '/play', label: 'Play', name: 'play', icon: 'home' },
  { path: '/tournaments', label: 'Tourneys', name: 'tournaments', icon: 'trophy' },
  { path: '/stats', label: 'Stats', name: 'stats', icon: 'bar-chart' },
  { path: '/settings', label: 'Settings', name: 'settings', icon: 'settings' },
])

const isGamePage = computed(() => route.name === 'game')
const isFullScreenPage = computed(() => isGamePage.value || route.name === 'training-play')
const { isTournamentMatch } = useTournamentContext()

function isNavItemActive(item: { path: string, label: string, name: string, icon: string }): boolean {
  const name = String(route.name ?? '')
  return item.name === name
    || (item.name === 'tournaments' && name.startsWith('tournaments'))
    || (item.name === 'stats' && name.startsWith('stats'))
    || (item.name === 'settings' && (name === 'players' || name === 'teams'))
    || (item.name === 'dashboard' && name.startsWith('training'))
    || (item.name === 'play' && name === 'play')
}

// Game page dots menu
const gameMenuOpen = ref(false)
const confirmStop = ref(false)

function toggleGameMenu() {
  gameMenuOpen.value = !gameMenuOpen.value
  confirmStop.value = false
}

function closeGameMenu() {
  gameMenuOpen.value = false
  confirmStop.value = false
}

async function handleStop() {
  await stopGame()
  closeGameMenu()
  navigateTo(isAuthenticated.value ? '/dashboard' : '/play')
}

function handleNewGame() {
  closeGameMenu()
  navigateTo(isAuthenticated.value ? '/dashboard' : '/play')
}
</script>

<template>
  <nav class="app-nav bg-surface-1 border-2 border-black rounded-lg shadow-md sticky top-0 z-50 px-sm sm:px-lg py-sm mb-sm" data-tour="nav">
    <div class="flex items-center justify-between max-w-[1200px] mx-auto">
      <NuxtLink :to="isAuthenticated ? '/dashboard' : '/play'" class="flex items-center gap-sm no-underline">
        <DartsLogo :size="26" />
        <span class="hidden sm:inline text-[1rem] font-extrabold text-yellow tracking-[1.5px] uppercase">Darts Scorer</span>
        <span class="inline sm:hidden text-[0.85rem] font-extrabold text-yellow tracking-[1px] uppercase">DS</span>
      </NuxtLink>

      <div v-if="isGamePage && isTournamentMatch" class="flex items-center">
        <span class="text-[0.7rem] font-bold text-yellow uppercase tracking-wide">Tournament Match</span>
      </div>

      <!-- Desktop inline nav links (hidden on mobile) -->
      <div v-else-if="!isFullScreenPage" class="hidden sm:flex relative gap-0">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="app-nav-link relative flex items-center gap-xs px-lg py-sm text-fg-muted no-underline text-[0.85rem] font-semibold uppercase tracking-[0.5px] transition-colors duration-200 hover:text-fg-secondary"
          :class="{ 'app-nav-link-active': isNavItemActive(item) }"
        >
          {{ item.label }}
        </NuxtLink>
      </div>

      <div class="flex items-center gap-xs sm:gap-md shrink-0">
        <span v-if="profile" class="text-[0.8rem] font-semibold text-fg-secondary max-w-[120px] truncate max-[480px]:hidden">{{ profile.displayName }}</span>
        <NuxtLink v-else-if="!isAuthenticated" to="/login" class="hidden sm:flex items-center text-[0.8rem] font-semibold text-fg-muted no-underline transition-colors duration-150 hover:text-yellow">
          Sign In
        </NuxtLink>
        <!-- Game context menu -->
        <div v-if="isGamePage" class="relative">
          <button
            class="flex items-center justify-center p-xs bg-transparent border-none text-fg-muted cursor-pointer rounded-sm transition-all duration-150 hover:text-fg hover:bg-surface-2"
            title="Game menu"
            @click="toggleGameMenu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
          <Transition name="menu">
            <div v-if="gameMenuOpen" class="absolute top-[calc(100%+var(--spacing-xs))] right-0 min-w-[160px] bg-surface-1 border-2 border-black rounded-md p-xs z-[52] shadow-md">
              <button
                class="flex items-center gap-sm w-full px-md py-sm bg-transparent border-none rounded-sm text-fg-secondary font-sans text-[0.8rem] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap hover:bg-surface-3 hover:text-fg"
                @click="handleNewGame"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Game
              </button>
              <button
                v-if="!confirmStop"
                class="flex items-center gap-sm w-full px-md py-sm bg-transparent border-none rounded-sm text-fg-secondary font-sans text-[0.8rem] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap hover:text-red hover:bg-red-light"
                @click="confirmStop = true"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
                Stop Game
              </button>
              <button
                v-else
                class="flex items-center gap-sm w-full px-md py-sm border-none rounded-sm font-sans text-[0.8rem] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap text-red bg-red-light"
                @click="handleStop"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
                Stop Game?
              </button>
            </div>
          </Transition>
          <Transition name="fade">
            <div v-if="gameMenuOpen" class="fixed inset-0 z-[51]" @click="closeGameMenu" />
          </Transition>
        </div>

        <!-- Desktop logout button -->
        <button
          v-if="profile && !isFullScreenPage"
          class="hidden sm:flex items-center justify-center p-xs bg-transparent border-none text-fg-muted cursor-pointer rounded-sm transition-all duration-150 hover:text-red hover:bg-red-light"
          title="Log out"
          @click="logout"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  </nav>

  <!-- Bottom navigation bar (mobile only) -->
  <Transition name="bottom-nav">
    <nav
      v-if="!isFullScreenPage"
      class="app-bottom-nav bg-surface-1 border-t-2 border-black fixed bottom-0 left-0 right-0 z-50 flex sm:hidden justify-around items-center h-[48px]"
      aria-label="Main navigation"
    >
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center justify-center gap-[2px] flex-1 py-xs no-underline text-[0.6rem] font-semibold uppercase tracking-[0.3px] transition-colors duration-150"
        :class="isNavItemActive(item) ? 'text-yellow' : 'text-fg-muted'"
        :aria-label="item.label"
        :aria-current="isNavItemActive(item) ? 'page' : undefined"
        style="-webkit-tap-highlight-color: transparent;"
      >
        <!-- Home -->
        <svg v-if="item.icon === 'home'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <!-- Trophy -->
        <svg v-else-if="item.icon === 'trophy'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
        <!-- Bar Chart -->
        <svg v-else-if="item.icon === 'bar-chart'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="20" x2="12" y2="10" />
          <line x1="18" y1="20" x2="18" y2="4" />
          <line x1="6" y1="20" x2="6" y2="16" />
        </svg>
        <!-- Settings -->
        <svg v-else-if="item.icon === 'settings'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <!-- Fallback icon for unknown values -->
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
        </svg>
        <span class="leading-none">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </Transition>
</template>

<style>
/* env() safe-area calculations cannot be expressed in Tailwind */
.app-nav {
  padding-top: calc(env(safe-area-inset-top, 0px) + var(--spacing-sm));
  padding-left: calc(env(safe-area-inset-left, 0px) + var(--spacing-sm));
  padding-right: calc(env(safe-area-inset-right, 0px) + var(--spacing-sm));
}

@media (min-width: 640px) {
  .app-nav {
    padding-left: calc(env(safe-area-inset-left, 0px) + var(--spacing-lg));
    padding-right: calc(env(safe-area-inset-right, 0px) + var(--spacing-lg));
  }
}

/* Active nav link underline — ::after pseudo-element cannot be Tailwind */
.app-nav-link-active {
  color: var(--yellow) !important;
}

.app-nav-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: var(--spacing-lg);
  right: var(--spacing-lg);
  height: 2px;
  background: var(--yellow);
}

/* Bottom nav safe-area padding */
.app-bottom-nav {
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}
</style>
