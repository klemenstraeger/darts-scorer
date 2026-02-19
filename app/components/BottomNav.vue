<script setup lang="ts">
const route = useRoute()

const hidden = computed(() => {
  const name = String(route.name ?? '')
  return name === 'game' || name === 'training-play'
})

const items = [
  { path: '/dashboard', label: 'Home', match: 'dashboard' },
  { path: '/new-game', label: 'Play', match: 'new-game' },
  { path: '/training', label: 'Train', match: 'training' },
  { path: '/tournaments', label: 'Tourneys', match: 'tournaments' },
  { path: '/stats', label: 'Stats', match: 'stats' },
]

function isActive(match: string): boolean {
  const name = String(route.name ?? '')
  if (name === match)
    return true
  if (match === 'training' && name.startsWith('training'))
    return true
  if (match === 'tournaments' && name.startsWith('tournaments'))
    return true
  if (match === 'stats' && name.startsWith('stats'))
    return true
  return false
}
</script>

<template>
  <nav v-if="!hidden" class="bottom-nav sm:hidden">
    <NuxtLink
      v-for="item in items"
      :key="item.path"
      :to="item.path"
      class="bottom-nav-item"
      :class="{ active: isActive(item.match) }"
    >
      <!-- Home -->
      <svg v-if="item.match === 'dashboard'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
      </svg>
      <!-- Play -->
      <svg v-else-if="item.match === 'new-game'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
      </svg>
      <!-- Train -->
      <svg v-else-if="item.match === 'training'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
      <!-- Tourneys -->
      <svg v-else-if="item.match === 'tournaments'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
        <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0012 0V2Z" />
      </svg>
      <!-- Stats -->
      <svg v-else-if="item.match === 'stats'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>

      <span class="bottom-nav-label">{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 56px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass-heavy));
  -webkit-backdrop-filter: blur(var(--blur-glass-heavy));
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
  transition: color var(--duration-fast) var(--ease-out);
  -webkit-tap-highlight-color: transparent;
  position: relative;
}

.bottom-nav-item.active {
  color: var(--gold);
}

.bottom-nav-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: var(--gold);
  border-radius: var(--radius-full);
  box-shadow: 0 0 6px var(--gold-glow);
}

.bottom-nav-label {
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
</style>
