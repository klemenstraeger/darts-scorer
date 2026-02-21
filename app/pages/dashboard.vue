<script setup lang="ts">
const route = useRoute()
const { newGame, hasActiveGame, hasGame, checkActiveGame } = useGameState()
const { lastGameSettings } = useSettings()
const { hasActiveSession: hasActiveTraining, checkActiveSession } = useTrainingState()
const { shouldShowTour, startTour } = useOnboarding()

const dashboardTab = ref<'home' | 'training'>('home')
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

  if (route.query.tab === 'training')
    dashboardTab.value = 'training'

  if (shouldShowTour('dashboard')) {
    setTimeout(() => {
      const navSelector = window.matchMedia('(min-width: 640px)').matches
        ? '[data-tour="nav-desktop"]'
        : '[data-tour="nav-mobile"]'
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
          element: navSelector,
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
  <AuthGate feature="Dashboard" description="Sign in to see your dashboard with recent games, active tournaments, and quick stats.">
    <div class="px-lg py-xl max-w-[600px] mx-auto w-full max-sm:px-md max-sm:py-lg">
      <!-- Hero -->
      <div
        v-motion
        class="text-center mb-lg"
        :initial="{ opacity: 0, y: -20 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 400, ease: 'easeOut' } }"
      >
        <div class="flex items-center justify-center gap-sm mb-sm">
          <DartsLogo :size="28" />
          <h1 class="text-[1.8rem] font-black leading-tight max-sm:text-[1.5rem]">
            <span class="text-fg">Darts </span>
            <span class="text-yellow font-black">Scorer</span>
          </h1>
        </div>
      </div>

      <!-- Tab bar -->
      <div
        v-motion
        role="tablist"
        class="flex justify-center gap-sm mb-lg"
        :initial="{ opacity: 0 }"
        :enter="{ opacity: 1, transition: { duration: 300, delay: 50 } }"
      >
        <button
          role="tab"
          :aria-selected="dashboardTab === 'home'"
          aria-controls="home-panel"
          class="inline-flex items-center px-xl py-xs bg-surface-1 border-2 border-black rounded-full text-fg-secondary text-[0.85rem] font-medium cursor-pointer shadow-sm transition-all duration-100 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-md"
          :class="{ 'bg-yellow text-fg-inverse font-semibold': dashboardTab === 'home' }"
          @click="dashboardTab = 'home'"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block mr-xs -mt-[1px]">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Home
        </button>
        <button
          role="tab"
          :aria-selected="dashboardTab === 'training'"
          aria-controls="training-panel"
          class="inline-flex items-center px-xl py-xs bg-surface-1 border-2 border-black rounded-full text-fg-secondary text-[0.85rem] font-medium cursor-pointer shadow-sm transition-all duration-100 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-md"
          :class="{ 'bg-yellow text-fg-inverse font-semibold': dashboardTab === 'training' }"
          @click="dashboardTab = 'training'"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block mr-xs -mt-[1px]">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          Training
        </button>
      </div>

      <!-- Home tab -->
      <div v-if="dashboardTab === 'home'" id="home-panel" role="tabpanel">
        <!-- Quick Start -->
        <div
          v-motion
          :initial="{ opacity: 0, scale: 0.95 }"
          :enter="{ opacity: 1, scale: 1, transition: { duration: 400, ease: 'easeOut', delay: 100 } }"
        >
          <button
            class="flex flex-col items-center gap-[4px] w-full py-lg px-xl min-h-[56px] bg-yellow text-fg-inverse border-[3px] border-black rounded-lg cursor-pointer shadow-lg transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-xl active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            data-tour="quick-start"
            @click="quickStart"
          >
            <span class="flex items-center text-[1.15rem] font-extrabold">
              <svg class="inline-block w-[18px] h-[18px] mr-[6px]" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {{ hasRematch ? 'Quick Start' : 'New Game' }}
            </span>
            <span class="text-[0.7rem] font-medium opacity-80 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {{ hasRematch ? rematchSummary : 'Set up players & game mode' }}
            </span>
          </button>
        </div>

        <!-- Resume game banner -->
        <div
          v-if="hasActiveGame || hasGame"
          v-motion
          class="w-full px-xl py-lg flex items-center justify-between border-2 border-black bg-surface-1 rounded-lg shadow-md mt-lg"
          :initial="{ opacity: 0, scale: 0.95 }"
          :enter="{ opacity: 1, scale: 1, transition: { duration: 300 } }"
        >
          <div class="flex items-center gap-md">
            <span class="block size-[10px] rounded-full bg-green shrink-0" style="animation: pulse-scale 2s ease-in-out infinite;" />
            <div class="flex flex-col gap-[2px]">
              <span class="text-[0.9rem] font-bold text-fg">Game in progress</span>
              <span class="text-[0.75rem] text-fg-muted">Pick up where you left off</span>
            </div>
          </div>
          <Button @click="navigateTo('/game')">
            Resume
          </Button>
        </div>

        <!-- Resume training banner -->
        <div
          v-if="hasActiveTraining"
          v-motion
          class="w-full px-xl py-lg flex items-center justify-between border-2 border-black bg-surface-1 rounded-lg shadow-md mt-lg"
          :initial="{ opacity: 0, scale: 0.95 }"
          :enter="{ opacity: 1, scale: 1, transition: { duration: 300, delay: 50 } }"
        >
          <div class="flex items-center gap-md">
            <span class="block size-[10px] rounded-full bg-green shrink-0" style="animation: pulse-scale 2s ease-in-out infinite;" />
            <div class="flex flex-col gap-[2px]">
              <span class="text-[0.9rem] font-bold text-fg">Training in progress</span>
              <span class="text-[0.75rem] text-fg-muted">Continue your practice session</span>
            </div>
          </div>
          <Button @click="navigateTo('/training/play')">
            Resume
          </Button>
        </div>

        <!-- Action Grid -->
        <div class="grid grid-cols-2 gap-md mt-xl" data-tour="action-grid">
          <NuxtLink
            v-for="(card, i) in actionCards"
            :key="card.path"
            v-motion
            :to="card.path"
            class="flex flex-col items-center justify-center gap-sm py-xl px-md min-h-[120px] no-underline text-center bg-surface-1 border-2 border-black rounded-lg shadow-md transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            :initial="{ opacity: 0, y: 16 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: 200 + i * 60 } }"
          >
            <!-- Plus / New Game -->
            <svg v-if="card.icon === 'plus'" class="text-yellow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <!-- Target / Training -->
            <svg v-else-if="card.icon === 'target'" class="text-yellow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <!-- Trophy / Tournaments -->
            <svg v-else-if="card.icon === 'trophy'" class="text-yellow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
              <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0012 0V2Z" />
            </svg>
            <!-- Chart / Stats -->
            <svg v-else-if="card.icon === 'chart'" class="text-yellow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>

            <span class="text-[0.9rem] font-bold text-fg">{{ card.title }}</span>
            <span class="text-[0.7rem] text-fg-muted leading-snug">{{ card.subtitle }}</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Training tab -->
      <div v-if="dashboardTab === 'training'" id="training-panel" role="tabpanel">
        <TrainingPicker :show-header="false" />
      </div>

      <!-- Abandon confirm modal -->
      <Teleport to="body">
        <div v-if="showAbandonConfirm" class="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-lg" @click.self="showAbandonConfirm = false">
          <div class="bg-surface-1 border-[3px] border-black rounded-lg shadow-lg w-full max-w-[380px] p-2xl flex flex-col gap-lg">
            <h3 class="text-[1.1rem] font-bold text-fg">
              Abandon Current Game?
            </h3>
            <p class="text-fg-secondary text-[0.9rem] leading-relaxed">
              Starting a new game will end your current game in progress.
            </p>
            <div class="flex gap-md justify-end">
              <Button variant="secondary" @click="showAbandonConfirm = false">
                Cancel
              </Button>
              <Button variant="destructive" @click="doQuickStart">
                Start New Game
              </Button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </AuthGate>
</template>
