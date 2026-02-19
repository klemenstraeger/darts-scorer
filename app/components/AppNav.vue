<script setup lang="ts">
const route = useRoute()
const { profile, fetch: fetchProfile, logout } = useProfile()
const { stopGame } = useGameState()

// Fetch profile on mount if not already loaded
onMounted(() => {
  if (!profile.value)
    fetchProfile()
})

const navItems = [
  { path: '/dashboard', label: 'Home', name: 'dashboard', icon: 'home' },
  { path: '/players', label: 'Players', name: 'players', icon: 'users' },
  { path: '/teams', label: 'Teams', name: 'teams', icon: 'users' },
  { path: '/tournaments', label: 'Tourneys', name: 'tournaments', icon: 'trophy' },
  { path: '/training', label: 'Training', name: 'training', icon: 'target' },
  { path: '/stats', label: 'Stats', name: 'stats', icon: 'bar-chart' },
  { path: '/settings', label: 'Settings', name: 'settings', icon: 'settings' },
]

const isGamePage = computed(() => route.name === 'game')
const isFullScreenPage = computed(() => isGamePage.value || route.name === 'training-play')
const { isTournamentMatch } = useTournamentContext()

function isNavItemActive(item: typeof navItems[number]): boolean {
  const name = String(route.name ?? '')
  return item.name === name
    || (item.name === 'tournaments' && name.startsWith('tournaments'))
    || (item.name === 'players' && name.startsWith('players'))
    || (item.name === 'teams' && name.startsWith('teams'))
    || (item.name === 'training' && name.startsWith('training'))
    || (item.name === 'stats' && name.startsWith('stats'))
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
  navigateTo('/dashboard')
}

function handleNewGame() {
  closeGameMenu()
  navigateTo('/dashboard')
}
</script>

<template>
  <nav class="app-nav glass-card sticky top-0 z-50 px-sm sm:px-lg py-sm mb-sm" data-tour="nav">
    <div class="flex items-center justify-between max-w-[1200px] mx-auto">
      <NuxtLink to="/dashboard" class="brand-link">
        <DartsLogo :size="26" />
        <span class="brand-text brand-full">Darts Scorer</span>
        <span class="brand-text brand-short">DS</span>
      </NuxtLink>

      <div v-if="isGamePage && isTournamentMatch" class="flex items-center">
        <span class="text-[0.7rem] font-bold text-gold uppercase tracking-wide">Tournament Match</span>
      </div>

      <!-- Desktop inline nav links (hidden on mobile) -->
      <div v-else-if="!isFullScreenPage" class="nav-links hidden sm:flex">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: isNavItemActive(item) }"
        >
          {{ item.label }}
        </NuxtLink>
      </div>

      <div class="flex items-center gap-xs sm:gap-md shrink-0">
        <span v-if="profile" class="user-name">{{ profile.displayName }}</span>
        <ThemeToggle />

        <!-- Game context menu -->
        <div v-if="isGamePage" class="relative">
          <button class="menu-btn" title="Game menu" @click="toggleGameMenu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
          <Transition name="menu">
            <div v-if="gameMenuOpen" class="menu-dropdown">
              <button class="menu-item" @click="handleNewGame">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Game
              </button>
              <button
                v-if="!confirmStop"
                class="menu-item menu-item-danger"
                @click="confirmStop = true"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
                Stop Game
              </button>
              <button
                v-else
                class="menu-item menu-item-danger active"
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
        <button v-if="profile && !isFullScreenPage" class="logout-btn hidden sm:flex" title="Log out" @click="logout">
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
      class="bottom-nav glass-card sm:hidden"
      aria-label="Main navigation"
    >
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="bottom-nav-item"
        :class="{ active: isNavItemActive(item) }"
        :aria-label="item.label"
        :aria-current="isNavItemActive(item) ? 'page' : undefined"
      >
        <!-- Home -->
        <svg v-if="item.icon === 'home'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <!-- Users -->
        <svg v-else-if="item.icon === 'users'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
        <!-- Target -->
        <svg v-else-if="item.icon === 'target'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
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
        <span class="bottom-nav-label">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </Transition>
</template>

<style scoped>
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

.brand-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
}

.brand-text {
  font-size: 1rem;
  font-weight: 800;
  color: var(--gold);
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.brand-full {
  display: none;
}

.brand-short {
  display: inline;
  font-size: 0.85rem;
  letter-spacing: 1px;
}

@media (min-width: 640px) {
  .brand-full {
    display: inline;
  }
  .brand-short {
    display: none;
  }
}

.nav-links {
  position: relative;
  gap: 0;
}

.nav-link {
  position: relative;
  padding: var(--spacing-sm) var(--spacing-lg);
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: color var(--duration-normal) var(--ease-out);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.nav-link:hover {
  color: var(--text-secondary);
}

.nav-link.active {
  color: var(--gold);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: var(--spacing-lg);
  right: var(--spacing-lg);
  height: 2px;
  background: var(--gold);
  border-radius: var(--radius-full);
  box-shadow: 0 0 8px var(--gold-glow);
}

.user-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xs);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast) var(--ease-out);
}

.logout-btn:hover {
  color: var(--red);
  background: rgba(239, 68, 68, 0.1);
}

/* ── Bottom navigation bar (mobile only) ── */
.bottom-nav {
  --bottom-nav-height: 48px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: var(--bottom-nav-height);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-top: 0;
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-bottom: none;
  border-top: 1px solid var(--surface-glass-border);
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: 1;
  padding: var(--spacing-xs) 0;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  transition: color var(--duration-fast) var(--ease-out);
  -webkit-tap-highlight-color: transparent;
}

.bottom-nav-item.active {
  color: var(--gold);
}

.bottom-nav-item.active svg {
  filter: drop-shadow(0 0 4px var(--gold-glow));
}

.bottom-nav-label {
  line-height: 1;
}

/* Bottom nav transition */
.bottom-nav-enter-active {
  transition: transform var(--duration-normal) var(--ease-out),
              opacity var(--duration-normal) var(--ease-out);
}

.bottom-nav-leave-active {
  transition: transform var(--duration-fast) var(--ease-out),
              opacity var(--duration-fast) var(--ease-out);
}

.bottom-nav-enter-from,
.bottom-nav-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

/* Game context menu */
.menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xs);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast) var(--ease-out);
}

.menu-btn:hover {
  color: var(--text-primary);
  background: var(--surface-2);
}

.menu-dropdown {
  position: absolute;
  top: calc(100% + var(--spacing-xs));
  right: 0;
  min-width: 160px;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs);
  z-index: 52;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  white-space: nowrap;
}

.menu-item:hover {
  background: var(--surface-3);
  color: var(--text-primary);
}

.menu-item-danger:hover {
  color: var(--red);
  background: rgba(239, 68, 68, 0.1);
}

.menu-item-danger.active {
  color: var(--red);
  background: rgba(239, 68, 68, 0.12);
}

.menu-enter-active {
  transition: all var(--duration-fast) var(--ease-out);
}

.menu-leave-active {
  transition: all var(--duration-fast) var(--ease-out);
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-fast);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .user-name {
    display: none;
  }
}
</style>
