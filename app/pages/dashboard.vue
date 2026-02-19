<script setup lang="ts">
const { newGame, hasActiveGame, hasGame, checkActiveGame } = useGameState()
const { lastGameSettings } = useSettings()
const { hasActiveSession: hasActiveTraining, checkActiveSession } = useTrainingState()
const { shouldShowTour, startTour } = useOnboarding()

const showAbandonConfirm = ref(false)

const hasRematch = computed(() => {
  const s = lastGameSettings.value
  return s && s.players.length >= 2
})

const rematchSummary = computed(() => {
  const s = lastGameSettings.value
  if (!s)
    return ''
  const playerNames = s.players.map(p => p.name).join(' vs ')
  const checkout = s.checkout === 'double_out' ? 'Double Out' : 'Single Out'
  return `${s.mode} \u00B7 ${checkout} \u00B7 ${playerNames}`
})

onMounted(() => {
  checkActiveGame()
  checkActiveSession()

  if (shouldShowTour('dashboard')) {
    setTimeout(() => {
      startTour([
        {
          element: '[data-tour="quick-start"]',
          popover: {
            title: 'Quick Start',
            description: 'Start a game instantly with one tap using your last settings, or set up a new game.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '[data-tour="action-grid"]',
          popover: {
            title: 'Quick Access',
            description: 'Jump to any feature \u2014 set up a custom game, practice, run tournaments, or check your stats.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '[data-tour="nav"]',
          popover: {
            title: 'Navigation',
            description: 'Use the bottom bar to switch between sections quickly.',
            side: 'top',
            align: 'center',
          },
        },
      ], 'dashboard')
    }, 800)
  }
})

function quickStart() {
  const s = lastGameSettings.value
  if (!s || s.players.length < 2) {
    navigateTo('/new-game')
    return
  }
  if (hasActiveGame.value || hasGame.value) {
    showAbandonConfirm.value = true
    return
  }
  doQuickStart()
}

function doQuickStart() {
  showAbandonConfirm.value = false
  const s = lastGameSettings.value!
  newGame(s.mode, s.players, {
    checkout: s.checkout,
    legs_to_win: s.legs_to_win,
    sets_to_win: s.sets_to_win,
  })
  navigateTo('/game')
}

const actionCards = [
  {
    path: '/new-game',
    title: 'New Game',
    subtitle: 'Custom game setup',
    icon: 'plus',
  },
  {
    path: '/training',
    title: 'Solo Training',
    subtitle: 'Practice drills',
    icon: 'target',
  },
  {
    path: '/tournaments',
    title: 'Tournaments',
    subtitle: 'Compete & brackets',
    icon: 'trophy',
  },
  {
    path: '/stats',
    title: 'Stats',
    subtitle: 'Track your progress',
    icon: 'chart',
  },
]
</script>

<template>
  <div class="dashboard-page px-lg py-xl max-w-[600px] mx-auto w-full max-sm:px-md max-sm:py-lg">
    <!-- Hero -->
    <div
      v-motion
      class="hero-section text-center mb-lg"
      :initial="{ opacity: 0, y: -20 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 400, ease: 'easeOut' } }"
    >
      <div class="flex items-center justify-center gap-sm mb-sm">
        <DartsLogo :size="28" />
        <h1 class="text-[1.8rem] font-black leading-tight max-sm:text-[1.5rem]">
          <span class="text-fg">Darts </span>
          <span class="text-gradient-gold">Scorer</span>
        </h1>
      </div>
    </div>

    <!-- Quick Start -->
    <div
      v-motion
      :initial="{ opacity: 0, scale: 0.95 }"
      :enter="{ opacity: 1, scale: 1, transition: { duration: 400, ease: 'easeOut', delay: 100 } }"
    >
      <button
        class="quick-start-btn"
        data-tour="quick-start"
        @click="quickStart"
      >
        <span class="quick-start-label">
          <svg class="inline-block w-[18px] h-[18px] mr-[6px]" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {{ hasRematch ? 'Quick Start' : 'New Game' }}
        </span>
        <span v-if="hasRematch" class="quick-start-hint">{{ rematchSummary }}</span>
        <span v-else class="quick-start-hint">Set up players & game mode</span>
      </button>
    </div>

    <!-- Resume game banner -->
    <div
      v-if="hasActiveGame || hasGame"
      v-motion
      class="glass-card w-full px-xl py-lg flex items-center justify-between border border-border-gold mt-lg"
      :initial="{ opacity: 0, scale: 0.95 }"
      :enter="{ opacity: 1, scale: 1, transition: { duration: 300 } }"
    >
      <div class="flex items-center gap-md">
        <span class="pulse-dot" />
        <div class="flex flex-col gap-[2px]">
          <span class="text-[0.9rem] font-bold text-fg">Game in progress</span>
          <span class="text-[0.75rem] text-fg-muted">Pick up where you left off</span>
        </div>
      </div>
      <button class="btn btn-gold" @click="navigateTo('/game')">
        Resume
      </button>
    </div>

    <!-- Resume training banner -->
    <div
      v-if="hasActiveTraining"
      v-motion
      class="glass-card w-full px-xl py-lg flex items-center justify-between border border-border-gold mt-lg"
      :initial="{ opacity: 0, scale: 0.95 }"
      :enter="{ opacity: 1, scale: 1, transition: { duration: 300, delay: 50 } }"
    >
      <div class="flex items-center gap-md">
        <span class="pulse-dot" />
        <div class="flex flex-col gap-[2px]">
          <span class="text-[0.9rem] font-bold text-fg">Training in progress</span>
          <span class="text-[0.75rem] text-fg-muted">Continue your practice session</span>
        </div>
      </div>
      <button class="btn btn-gold" @click="navigateTo('/training/play')">
        Resume
      </button>
    </div>

    <!-- Action Grid -->
    <div class="action-grid mt-xl" data-tour="action-grid">
      <NuxtLink
        v-for="(card, i) in actionCards"
        :key="card.path"
        v-motion
        :to="card.path"
        class="action-card glass-card"
        :initial="{ opacity: 0, y: 16 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: 200 + i * 60 } }"
      >
        <!-- Plus / New Game -->
        <svg v-if="card.icon === 'plus'" class="action-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <!-- Target / Training -->
        <svg v-else-if="card.icon === 'target'" class="action-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
        <!-- Trophy / Tournaments -->
        <svg v-else-if="card.icon === 'trophy'" class="action-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
          <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0012 0V2Z" />
        </svg>
        <!-- Chart / Stats -->
        <svg v-else-if="card.icon === 'chart'" class="action-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>

        <span class="action-title">{{ card.title }}</span>
        <span class="action-subtitle">{{ card.subtitle }}</span>
      </NuxtLink>
    </div>

    <!-- Abandon confirm modal -->
    <Teleport to="body">
      <div v-if="showAbandonConfirm" class="modal-overlay" @click.self="showAbandonConfirm = false">
        <div class="glass-card-heavy w-full max-w-[380px] p-2xl flex flex-col gap-lg">
          <h3 class="text-[1.1rem] font-bold text-fg">
            Abandon Current Game?
          </h3>
          <p class="text-fg-secondary text-[0.9rem] leading-relaxed">
            Starting a new game will end your current game in progress.
          </p>
          <div class="flex gap-md justify-end">
            <button class="btn btn-secondary" @click="showAbandonConfirm = false">
              Cancel
            </button>
            <button class="btn btn-danger" @click="doQuickStart">
              Start New Game
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* -- Quick Start button ------------------------------------------------- */
.quick-start-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: var(--spacing-lg) var(--spacing-xl);
  min-height: 56px;
  background: var(--gold-gradient);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out);
  box-shadow: var(--shadow-glow-gold);
}

.quick-start-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow-gold), 0 8px 30px rgba(255, 215, 0, 0.2);
}

.quick-start-btn:active {
  transform: scale(0.97);
}

.quick-start-label {
  display: flex;
  align-items: center;
  font-size: 1.15rem;
  font-weight: 800;
}

.quick-start-hint {
  font-size: 0.7rem;
  font-weight: 500;
  opacity: 0.8;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* -- Resume pulse ------------------------------------------------------- */
.pulse-dot {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--green);
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

/* -- Action grid -------------------------------------------------------- */
.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl) var(--spacing-md);
  min-height: 120px;
  text-decoration: none;
  text-align: center;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out);
  -webkit-tap-highlight-color: transparent;
}

.action-card:hover {
  border-color: var(--border-gold);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.action-card:active {
  transform: scale(0.97);
}

.action-icon {
  color: var(--gold);
  opacity: 0.9;
}

.action-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}

.action-subtitle {
  font-size: 0.7rem;
  color: var(--text-muted);
  line-height: 1.3;
}

/* -- Modal overlay ------------------------------------------------------ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--spacing-lg);
}
</style>
