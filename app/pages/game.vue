<script setup lang="ts">
import type { ThrowResult } from '~/types/game'
import { isVisitScoreTurn, threeDartAverage, throwLabel, throwPoints, turnTotal } from '~/types/game'
import { getCheckout } from '~/utils/checkouts'

const {
  state,
  bustFlash,
  gameOverFlash,
  legWonFlash,
  hasGame,
  undoThrow,
  manualScore,
  visitScore,
  loadState,
  stopGame,
  recentAchievements,
  clearAchievements,
  pendingGameOver,
  canCancelGameOver,
  confirmGameOver,
  cancelGameOver,
} = useGameState()

const { isBotPlaying } = useBotPlay()
const { isTournamentMatch, tournamentId, clear: clearTournamentContext } = useTournamentContext()
const { ensureLoaded: ensurePlayers, getAvatarProps } = usePlayers()
const { inputMode } = useSettings()
const { shouldShowTour, startTour } = useOnboarding()
const { isAuthenticated } = useAuth()

// Load game state from localStorage on mount (handles resume + tournament match transitions)
onMounted(() => {
  loadState()
  if (isAuthenticated.value)
    ensurePlayers()

  if (shouldShowTour('game')) {
    setTimeout(() => {
      startTour([
        {
          element: '[data-tour="score-display"]',
          popover: {
            title: 'Player Scores',
            description: 'Each player\'s remaining score is shown here. The active player has a gold border.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '[data-tour="throw-slots"]',
          popover: {
            title: 'Current Turn',
            description: 'Your three darts for this turn appear here, along with the running total.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '[data-tour="numpad"]',
          popover: {
            title: 'Score Input',
            description: 'Tap a number to score. Use Single/Double/Triple to set the multiplier before tapping.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '[data-tour="undo-btn"]',
          popover: {
            title: 'Undo',
            description: 'Made a mistake? Tap Undo to remove the last throw.',
            side: 'top',
            align: 'center',
          },
        },
      ], 'game')
    }, 600)
  }
})

// Mobile game menu (three-dot overlay)
const mobileMenuOpen = ref(false)
const confirmStopGame = ref(false)

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
  confirmStopGame.value = false
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
  confirmStopGame.value = false
}

function handleMobileStop() {
  closeMobileMenu()
  stopGame()
  navigateTo(isAuthenticated.value ? '/dashboard' : '/play')
}

function handleMobileNewGame() {
  closeMobileMenu()
  navigateTo(isAuthenticated.value ? '/dashboard' : '/play')
}

const isMatch = computed(() => state.legs_to_win > 1 || state.sets_to_win > 1)
const hasSets = computed(() => state.sets_to_win > 1)

const legWonPlayerName = computed(() => {
  if (state.players.length === 0)
    return ''
  const winnerIdx = (state.leg_starting_player - 1 + state.players.length) % state.players.length
  return state.players[winnerIdx]?.name ?? ''
})

const playerNames = computed(() => state.players.map(p => p.name))

const showGameOver = ref(true)
const turnTotalFlash = ref<number | null>(null)

// Animated score display per player
const displayScores = ref<number[]>([])
let animFrames: (number | null)[] = []
let turnTotalTimer: number | null = null
let turnHistorySynced = false

watch(
  () => state.players.map(p => p.score),
  (newScores, oldScores) => {
    if (!oldScores || displayScores.value.length !== newScores.length) {
      displayScores.value = [...newScores]
      animFrames = Array.from({ length: newScores.length }).fill(null) as (number | null)[]
      return
    }
    newScores.forEach((target, i) => {
      if (target === displayScores.value[i])
        return
      if (animFrames[i])
        cancelAnimationFrame(animFrames[i]!)
      const start = performance.now()
      const from = displayScores.value[i]!
      const duration = 350
      function step(now: number) {
        const p = Math.min((now - start) / duration, 1)
        const eased = 1 - (1 - p) ** 3
        displayScores.value[i] = Math.round(from + (target - from) * eased)
        if (p < 1) {
          animFrames[i] = requestAnimationFrame(step)
        }
        else {
          displayScores.value[i] = target
          animFrames[i] = null
        }
      }
      animFrames[i] = requestAnimationFrame(step)
    })
  },
  { deep: true },
)

function triggerTurnTotalFlash(total: number) {
  if (turnTotalTimer !== null) {
    window.clearTimeout(turnTotalTimer)
  }
  turnTotalFlash.value = total
  turnTotalTimer = window.setTimeout(() => {
    turnTotalFlash.value = null
    turnTotalTimer = null
  }, 2000)
}

watch(
  () => state.turn_history.length,
  (newLen, oldLen) => {
    if (!turnHistorySynced) {
      turnHistorySynced = true
      return
    }
    if (newLen <= (oldLen ?? 0))
      return
    const lastTurn = state.turn_history[newLen - 1]
    if (!lastTurn || lastTurn.busted)
      return
    if (state.is_finished || legWonFlash.value || gameOverFlash.value)
      return
    triggerTurnTotalFlash(turnTotal(lastTurn))
  },
  { immediate: true },
)

const currentTurnTotal = computed(() =>
  state.current_turn.throws.reduce((s, t) => s + throwPoints(t), 0),
)

const isPerVisit = computed(() => inputMode.value === 'per_visit')

const checkoutHint = computed(() => {
  if (state.is_finished)
    return null
  const player = state.players[state.current_player_index]
  if (!player)
    return null
  // In per-visit mode, always show checkout for full 3 darts
  const dartsRemaining = isPerVisit.value ? 3 : 3 - state.current_turn.throws.length
  return getCheckout(player.score, dartsRemaining)
})

function playerAvg(idx: number): string {
  const p = state.players[idx]
  return p ? threeDartAverage(p).toFixed(1) : '0.0'
}

function playerDarts(idx: number): number {
  const p = state.players[idx]
  if (!p)
    return 0
  return p.turns.reduce((s, t) => s + (isVisitScoreTurn(t) ? 3 : t.throws.length), 0)
}

const lastTurn = computed(() => {
  const h = state.turn_history
  return h.length > 0 ? h[h.length - 1] : null
})

function throwColor(t: ThrowResult): string {
  if (t.segment === 0)
    return 'text-fg-muted'
  if (t.multiplier === 3)
    return 'text-green'
  if (t.multiplier === 2)
    return 'text-gold'
  return 'text-fg'
}

const inputDisabled = computed(() => state.is_finished || isBotPlaying.value || pendingGameOver.value)

const currentPlayerIsBot = computed(() => {
  const player = state.players[state.current_player_index]
  return player?.isBot ?? false
})

function handleScore(segment: number, multiplier: number) {
  if (inputDisabled.value)
    return
  manualScore(segment, multiplier)
}

function handleVisitScore(score: number) {
  if (inputDisabled.value)
    return
  visitScore(score)
}

function dismissGameOver() {
  showGameOver.value = false
}

// Redirect to home if no game is active (but not during game over)
watch(hasGame, (active) => {
  if (!active && !gameOverFlash.value) {
    navigateTo(isAuthenticated.value ? '/dashboard' : '/play')
  }
})
</script>

<template>
  <div class="h-full flex flex-col gap-xs overflow-hidden w-full px-sm md:px-md" role="main">
    <!-- Game header (mobile only) -->
    <div class="sm:hidden flex items-center justify-between shrink-0 py-xs">
      <div class="flex items-center gap-sm">
        <span class="inline-flex items-center justify-center w-7 h-7 bg-yellow border-2 border-black rounded-md shadow-sm">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </span>
        <span class="text-sm font-black uppercase tracking-[1px]">Game</span>
        <span v-if="isTournamentMatch" class="inline-flex items-center px-[8px] py-[2px] bg-orange border border-black rounded-full text-[0.6rem] font-extrabold uppercase tracking-wide shadow-sm">Tournament</span>
      </div>
      <div class="relative">
        <button
          class="flex items-center justify-center w-8 h-8 rounded-md border-2 border-black bg-surface-1 shadow-sm transition-all duration-150 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          title="Game menu"
          @click="toggleMobileMenu"
        >
          <svg class="w-[18px] h-[18px] text-fg-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
        <Transition name="menu">
          <div v-if="mobileMenuOpen" class="absolute top-[calc(100%+6px)] right-0 min-w-[180px] z-[52] bg-surface-1 border-2 border-black rounded-md shadow-md p-xs">
            <button
              class="game-menu-item"
              @click="handleMobileNewGame"
            >
              <svg class="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Game
            </button>
            <button
              v-if="!confirmStopGame"
              class="game-menu-item game-menu-item-danger"
              @click="confirmStopGame = true"
            >
              <svg class="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              Stop Game
            </button>
            <button
              v-else
              class="game-menu-item game-menu-item-danger game-menu-item-confirm"
              @click="handleMobileStop"
            >
              <svg class="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              Stop Game?
            </button>
          </div>
        </Transition>
        <Transition name="fade">
          <div v-if="mobileMenuOpen" class="fixed inset-0 z-[51]" @click="closeMobileMenu" />
        </Transition>
      </div>
    </div>

    <!-- Top bar: player score cards -->
    <div class="flex gap-xs md:gap-sm shrink-0" data-tour="score-display">
      <div
        v-for="(player, i) in state.players"
        :key="i"
        class="flex-1 flex flex-col min-w-0 rounded-lg border-2 border-black transition-all duration-200 overflow-hidden"
        :class="i === state.current_player_index ? 'bg-yellow-light shadow-sm' : 'bg-surface-1'"
      >
        <!-- Main row: name + score -->
        <div class="flex items-center gap-xs md:gap-md px-sm py-xs md:px-xl md:py-md">
          <svg v-if="player.isBot" class="hidden md:block w-[28px] h-[28px] text-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="8.5" cy="16" r="1.5" /><circle cx="15.5" cy="16" r="1.5" /><path d="M12 2v5M7 7h10" /></svg>
          <PlayerAvatar v-else v-bind="getAvatarProps(player.name)" :size="28" class="hidden md:block" />
          <span class="text-xs font-bold uppercase tracking-wide whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]" :class="i === state.current_player_index ? 'text-fg' : 'text-fg-muted'">{{ player.name }}</span>
          <span class="text-[1.9rem] md:text-[2rem] lg:text-[2.8rem] font-black tabular-nums leading-none ml-auto md:ml-0 text-fg">{{ displayScores[i] ?? player.score }}</span>
          <span class="hidden md:flex flex-col gap-[2px] ml-auto">
            <span v-if="hasSets" class="text-[0.7rem] text-fg-muted whitespace-nowrap text-right">S {{ state.sets_won[i] ?? 0 }}/{{ state.sets_to_win }}</span>
            <span v-if="isMatch" class="text-[0.7rem] text-fg-muted whitespace-nowrap text-right">L {{ state.current_set_legs[i] ?? 0 }}/{{ state.legs_to_win }}</span>
            <span class="text-[0.7rem] text-fg-muted whitespace-nowrap text-right">{{ playerAvg(i) }} avg</span>
            <span class="text-[0.7rem] text-fg-muted whitespace-nowrap text-right">{{ playerDarts(i) }} darts</span>
          </span>
        </div>
        <!-- Mobile stats row -->
        <div
          class="md:hidden flex items-center justify-center gap-[6px] px-sm pb-[5px] text-[0.68rem] font-extrabold tabular-nums"
          :class="i === state.current_player_index ? 'text-fg/60' : 'text-fg/50'"
        >
          <span>{{ playerAvg(i) }} avg</span>
          <span class="text-fg/25">·</span>
          <span>{{ playerDarts(i) }}d</span>
          <template v-if="isMatch">
            <span class="text-fg/25">·</span>
            <span v-if="hasSets">S{{ state.sets_won[i] ?? 0 }}/{{ state.sets_to_win }}</span>
            <span>L{{ state.current_set_legs[i] ?? 0 }}/{{ state.legs_to_win }}</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Current turn panel (full width) -->
    <div class="shrink-0 bg-surface-1 border-2 border-black rounded-md px-sm sm:px-md py-xs sm:py-sm flex flex-col gap-[2px] sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-md">
      <!-- Throw slots (center on desktop, first row on mobile) -->
      <div class="flex justify-center sm:order-2" data-tour="throw-slots">
        <!-- Per-visit mode: simple label -->
        <div v-if="isPerVisit" class="flex items-center gap-sm px-md py-xs">
          <span class="text-[0.85rem] font-bold text-fg-muted uppercase tracking-wide">Enter 3-dart total</span>
        </div>
        <!-- Per-dart mode: 3 throw slots -->
        <div v-else class="flex items-center gap-sm">
          <span
            v-for="slot in 3"
            :key="slot"
            class="flex items-center gap-[4px] px-sm py-xs sm:px-md sm:py-sm border rounded-sm min-w-[52px] sm:min-w-[72px] justify-center"
            :class="state.current_turn.throws[slot - 1] ? 'bg-yellow-light border-black' : 'bg-surface-2 border-border-subtle'"
          >
            <template v-if="state.current_turn.throws[slot - 1]">
              <span class="text-base font-bold text-gold">{{ throwLabel(state.current_turn.throws[slot - 1]!) }}</span>
              <span class="text-[0.8rem] text-fg-muted">{{ throwPoints(state.current_turn.throws[slot - 1]!) }}</span>
            </template>
            <template v-else>
              <span class="text-fg-muted text-[1.2rem]">&middot;</span>
            </template>
          </span>
          <span v-if="state.current_turn.throws.length > 0" class="text-[1.1rem] font-extrabold text-fg tabular-nums ml-xs">
            = {{ currentTurnTotal }}
          </span>
        </div>
      </div>
      <!-- Metadata row: Set/Leg badges (left) + Checkout hint (right) — second row on mobile, split across grid on desktop -->
      <div class="flex items-center justify-between sm:contents">
        <div class="flex items-center sm:order-1">
          <div v-if="isMatch" class="flex gap-xs">
            <span v-if="hasSets" class="text-xs font-bold text-fg-muted uppercase tracking-wide px-sm py-xs bg-surface-2 border border-border-subtle rounded-sm">Set {{ (state.sets_won[state.current_player_index] ?? 0) + 1 }}</span>
            <span class="text-xs font-bold text-fg-muted uppercase tracking-wide px-sm py-xs bg-surface-2 border border-border-subtle rounded-sm">Leg {{ (state.current_set_legs[state.current_player_index] ?? 0) + 1 }}</span>
          </div>
        </div>
        <div class="flex justify-end sm:order-3">
          <div v-if="checkoutHint" class="flex items-center gap-sm">
            <span class="text-[0.65rem] font-bold text-fg-muted uppercase tracking-wide shrink-0">Checkout</span>
            <span class="flex gap-[4px]">
              <span v-for="(dart, i) in checkoutHint" :key="i" class="text-[0.85rem] font-bold text-gold px-sm py-[2px] rounded-sm bg-yellow-light border-2 border-black">{{ dart }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Last turn strip (mobile only) -->
    <div v-if="lastTurn" class="md:hidden shrink-0 flex items-center gap-sm px-sm py-[3px] text-[0.75rem]">
      <span class="font-bold text-fg-muted uppercase tracking-wide truncate max-w-[80px]">{{ state.players[lastTurn.player_index]?.name }}</span>
      <template v-if="lastTurn.busted">
        <span class="font-bold text-red">BUST</span>
      </template>
      <template v-else-if="isVisitScoreTurn(lastTurn)">
        <span class="font-extrabold text-fg tabular-nums ml-auto">= {{ turnTotal(lastTurn) }}</span>
      </template>
      <template v-else>
        <span v-for="(t, i) in lastTurn.throws" :key="i" :class="throwColor(t)" class="font-semibold">{{ throwLabel(t) }}</span>
        <span class="font-extrabold text-fg tabular-nums ml-auto">= {{ turnTotal(lastTurn) }}</span>
      </template>
    </div>

    <!-- Main area: 2-column layout -->
    <div class="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[300px_1fr] gap-md pt-0 pb-0 md:pt-xs md:pb-sm">
      <!-- Left: Context sidebar -->
      <div class="hidden md:flex flex-col gap-sm min-h-0 overflow-hidden">
        <!-- Throw history (scrollable) -->
        <div class="flex-1 min-h-0 overflow-hidden rounded-md bg-surface-1 border-2 border-black p-sm">
          <ThrowHistory
            :turn-history="state.turn_history"
            :player-names="playerNames"
          />
        </div>
      </div>

      <!-- Right: Input hero + action row -->
      <div class="flex flex-col gap-xs md:gap-sm min-h-0">
        <!-- Bot throwing indicator -->
        <div v-if="currentPlayerIsBot && isBotPlaying" class="shrink-0 flex items-center justify-center px-md py-sm bg-yellow-light border-2 border-black rounded-md text-yellow text-[0.9rem] font-bold">
          <svg class="inline-block w-[18px] h-[18px] mr-xs animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="8.5" cy="16" r="1.5" /><circle cx="15.5" cy="16" r="1.5" /><path d="M12 2v5M7 7h10" /></svg>
          Bot is throwing...
        </div>

        <VisitScoreInput
          v-if="isPerVisit"
          class="flex-1 min-h-0"
          :disabled="inputDisabled"
          :current-score="state.players[state.current_player_index]?.score"
          :checkout-mode="state.checkout"
          data-tour="numpad"
          @visit-score="handleVisitScore"
        />
        <ManualScoreInput
          v-else
          class="flex-1 min-h-0"
          :disabled="inputDisabled"
          data-tour="numpad"
          @score="handleScore"
        />

        <!-- Action row (always visible) -->
        <div class="flex gap-sm shrink-0">
          <button
            class="flex-1 min-h-[40px] md:min-h-[52px] rounded-lg text-base font-bold uppercase tracking-wide bg-surface-1 border-2 border-black text-fg-secondary shadow-sm cursor-pointer transition-all duration-150 hover:enabled:-translate-x-0.5 hover:enabled:-translate-y-0.5 hover:enabled:shadow-md active:enabled:translate-x-0.5 active:enabled:translate-y-0.5 active:enabled:shadow-none disabled:opacity-40 disabled:cursor-not-allowed"
            data-tour="undo-btn"
            :disabled="inputDisabled"
            @click="undoThrow"
          >
            Undo
          </button>
        </div>
      </div>
    </div>

    <!-- Overlays -->
    <Transition name="fade">
      <div v-if="bustFlash" class="fixed inset-0 flex items-center justify-center z-100 pointer-events-none bg-black/50">
        <span class="text-[5rem] font-black text-red" style="animation: bust-appear 0.4s var(--ease-spring);">BUST!</span>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="turnTotalFlash !== null" class="fixed inset-0 flex items-center justify-center z-100 pointer-events-none bg-black/45">
        <div class="text-center" style="animation: bust-appear 0.4s var(--ease-spring);">
          <span class="block text-[0.9rem] font-bold tracking-[2px] uppercase text-fg-muted mb-xs">Total</span>
          <span class="block text-[5rem] font-black text-gold tabular-nums">{{ turnTotalFlash }}</span>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="legWonFlash" class="fixed inset-0 flex items-center justify-center z-100 pointer-events-none bg-black/50">
        <div class="text-center" style="animation: bust-appear 0.4s var(--ease-spring);">
          <span class="block text-[4rem] font-black text-yellow">Leg Won!</span>
          <span class="block text-2xl font-bold text-fg mt-xs">{{ legWonPlayerName }}</span>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <GameOverConfirmDialog
        v-if="pendingGameOver"
        :state="state"
        :can-undo="canCancelGameOver"
        @confirm="confirmGameOver"
        @cancel="cancelGameOver"
      />
    </Transition>

    <Transition name="fade">
      <GameOverOverlay
        v-if="gameOverFlash && showGameOver"
        :state="state"
        :is-tournament-match="isTournamentMatch"
        :tournament-id="tournamentId"
        @dismiss="dismissGameOver"
        @clear-tournament="clearTournamentContext()"
      />
    </Transition>

    <!-- Achievement toast notifications -->
    <AchievementToast
      v-if="recentAchievements.length > 0"
      :achievements="recentAchievements"
      @dismiss="clearAchievements()"
    />
  </div>
</template>

<style>
.game-menu-item {
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
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
  -webkit-tap-highlight-color: transparent;
}

.game-menu-item:active {
  background: var(--surface-2);
  border-color: var(--border-color);
}

.game-menu-item-danger {
  color: var(--red);
}

.game-menu-item-danger:active {
  background: var(--red-light);
}

.game-menu-item-confirm {
  background: var(--red-light);
  border-color: var(--border-color);
}
</style>
