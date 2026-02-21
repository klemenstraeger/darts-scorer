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
  <nav class="app-nav sticky top-0 z-50 hidden sm:block" data-tour="nav-desktop">
    <div class="app-nav-inner max-w-[1200px] mx-auto">
      <div class="app-nav-brand">
        <NuxtLink :to="isAuthenticated ? '/dashboard' : '/play'" class="app-brand-link">
          <span class="app-brand-mark">
            <DartsLogo :size="24" />
          </span>
          <span class="app-brand-text hidden sm:inline">Darts Scorer</span>
          <span class="app-brand-text sm:hidden">DS</span>
        </NuxtLink>
        <span v-if="isGamePage && isTournamentMatch" class="app-nav-badge">Tournament Match</span>
      </div>

      <!-- Desktop inline nav links (hidden on mobile) -->
      <div v-if="!isFullScreenPage" class="app-nav-primary hidden sm:flex">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="app-nav-link"
          :class="{ 'app-nav-link-active': isNavItemActive(item) }"
          :aria-current="isNavItemActive(item) ? 'page' : undefined"
        >
          {{ item.label }}
        </NuxtLink>
      </div>

      <div class="app-nav-actions">
        <span v-if="profile" class="app-nav-profile" :title="profile.displayName">{{ profile.displayName }}</span>
        <NuxtLink v-else-if="!isAuthenticated" to="/login" class="app-nav-signin">
          Sign In
        </NuxtLink>
        <!-- Game context menu -->
        <div v-if="isGamePage" class="relative">
          <button
            class="app-nav-icon-button"
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
            <div v-if="gameMenuOpen" class="app-nav-menu absolute top-[calc(100%+var(--spacing-xs))] right-0 min-w-[180px] z-[52]">
              <button
                class="app-nav-menu-item"
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
                class="app-nav-menu-item app-nav-menu-item-danger"
                @click="confirmStop = true"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
                Stop Game
              </button>
              <button
                v-else
                class="app-nav-menu-item app-nav-menu-item-danger is-confirm"
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
          class="app-nav-icon-button hidden sm:flex"
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
      class="app-bottom-nav fixed bottom-0 left-0 right-0 z-50 sm:hidden"
      aria-label="Main navigation"
    >
      <div class="app-bottom-nav-inner" data-tour="nav-mobile">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="app-bottom-link"
          :class="{ 'app-bottom-link-active': isNavItemActive(item) }"
          :aria-label="item.label"
          :aria-current="isNavItemActive(item) ? 'page' : undefined"
          style="-webkit-tap-highlight-color: transparent;"
        >
          <!-- Home -->
          <svg v-if="item.icon === 'home'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <!-- Trophy -->
          <svg v-else-if="item.icon === 'trophy'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
          <!-- Bar Chart -->
          <svg v-else-if="item.icon === 'bar-chart'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="20" x2="12" y2="10" />
            <line x1="18" y1="20" x2="18" y2="4" />
            <line x1="6" y1="20" x2="6" y2="16" />
          </svg>
          <!-- Settings -->
          <svg v-else-if="item.icon === 'settings'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <!-- Fallback icon for unknown values -->
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
          </svg>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </Transition>
</template>

<style>
/* env() safe-area calculations cannot be expressed in Tailwind */
.app-nav {
  background: var(--surface-0);
  padding-top: calc(env(safe-area-inset-top, 0px) + var(--spacing-sm));
  padding-left: calc(env(safe-area-inset-left, 0px) + var(--spacing-sm));
  padding-right: calc(env(safe-area-inset-right, 0px) + var(--spacing-sm));
  margin-bottom: var(--spacing-sm);
}

.app-nav-inner {
  background: var(--surface-1);
  border: var(--border-width-bold) solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
}

.app-nav-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

.app-brand-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
}

.app-brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--yellow);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.app-brand-text {
  font-size: 0.95rem;
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-primary);
}

.app-nav-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: var(--orange);
  color: var(--text-primary);
  border: var(--border-width) solid var(--border-color);
  border-radius: 999px;
  box-shadow: var(--shadow-sm);
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  white-space: nowrap;
}

.app-nav-primary {
  align-items: center;
  gap: var(--spacing-xs);
  background: var(--surface-2);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 2px;
}

.app-nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-secondary);
  border: var(--border-width) solid transparent;
  border-radius: calc(var(--radius-md) - 2px);
  transition:
    transform var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.app-nav-link:hover {
  color: var(--text-primary);
  background: var(--surface-1);
  border-color: var(--border-color);
  box-shadow: var(--shadow-sm);
  transform: translate(-1px, -1px);
}

.app-nav-link-active {
  color: var(--text-primary) !important;
  background: var(--yellow);
  border-color: var(--border-color);
  box-shadow: var(--shadow-sm);
}

.app-nav-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  min-width: 0;
}

.app-nav-profile {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--surface-2);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 4px 10px;
  box-shadow: var(--shadow-sm);
}

.app-nav-signin {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  background: var(--surface-2);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition:
    transform var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.app-nav-signin:hover {
  background: var(--yellow);
  transform: translate(-1px, -1px);
  box-shadow: var(--shadow-md);
}

.app-nav-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: var(--surface-1);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition:
    transform var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.app-nav-icon-button:hover {
  color: var(--text-primary);
  background: var(--surface-2);
  transform: translate(-1px, -1px);
  box-shadow: var(--shadow-md);
}

.app-nav-menu {
  background: var(--surface-1);
  border: var(--border-width-bold) solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-xs);
}

.app-nav-menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: 8px 10px;
  border: var(--border-width) solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.app-nav-menu-item:hover {
  color: var(--text-primary);
  background: var(--surface-2);
  border-color: var(--border-color);
  box-shadow: var(--shadow-sm);
  transform: translate(-1px, -1px);
}

.app-nav-menu-item-danger {
  color: var(--red);
}

.app-nav-menu-item-danger:hover {
  background: var(--red-light);
}

.app-nav-menu-item.is-confirm {
  background: var(--red-light);
  border-color: var(--border-color);
  box-shadow: var(--shadow-sm);
}

@media (min-width: 640px) {
  .app-nav {
    padding-left: calc(env(safe-area-inset-left, 0px) + var(--spacing-lg));
    padding-right: calc(env(safe-area-inset-right, 0px) + var(--spacing-lg));
  }
}

@media (max-width: 420px) {
  .app-nav-profile {
    display: none;
  }
}

/* Bottom nav safe-area padding */
.app-bottom-nav {
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}

.app-bottom-nav-inner {
  margin: 0 var(--spacing-sm) var(--spacing-sm);
  background: var(--surface-1);
  border: var(--border-width-bold) solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
}

.app-bottom-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 54px;
  border: var(--border-width) solid transparent;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  text-decoration: none;
  transition:
    transform var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.app-bottom-link svg {
  width: 22px;
  height: 22px;
  stroke-width: 2.3;
}

.app-bottom-link:hover {
  color: var(--text-primary);
  background: var(--surface-2);
  border-color: var(--border-color);
  box-shadow: var(--shadow-sm);
  transform: translate(-1px, -1px);
}

.app-bottom-link-active {
  color: var(--text-primary);
  background: var(--yellow);
  border-color: var(--border-color);
  box-shadow: var(--shadow-sm);
}
</style>
