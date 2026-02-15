<script setup lang="ts">
import type { ThrowResult } from '~/types/game'
import { throwLabel, throwPoints, threeDartAverage, turnTotal } from '~/types/game'
import { getCheckout } from '~/utils/checkouts'

const {
  state,
  bustFlash,
  gameOverFlash,
  legWonFlash,
  hasGame,
  undoThrow,
  manualScore,
  loadState,
} = useGameState()

const { audioEnabled, toggle: toggleAudio } = useAudio()

const { isBotPlaying } = useBotPlay()
const { isTournamentMatch, tournamentId, clear: clearTournamentContext } = useTournamentContext()
const { ensureLoaded: ensurePlayers, getAvatarProps } = usePlayers()
const { dartboardTheme } = useSettings()
const { enabled: announcerEnabled, toggle: toggleAnnouncer } = useAnnouncer()

// Load game state from localStorage on mount (handles resume + tournament match transitions)
onMounted(() => {
  loadState()
  ensurePlayers()
})

const isMatch = computed(() => state.legs_to_win > 1 || state.sets_to_win > 1)
const hasSets = computed(() => state.sets_to_win > 1)

const legWonPlayerName = computed(() => {
  if (state.players.length === 0) return ''
  const winnerIdx = (state.leg_starting_player - 1 + state.players.length) % state.players.length
  return state.players[winnerIdx]?.name ?? ''
})

const playerNames = computed(() => state.players.map(p => p.name))
const winnerName = computed(() => {
  if (state.winner_index != null) {
    const winner = state.players[state.winner_index]
    if (winner) return winner.name
  }
  return ''
})

const showGameOver = ref(true)
const showDartboard = ref(false)
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
      animFrames = new Array(newScores.length).fill(null)
      return
    }
    newScores.forEach((target, i) => {
      if (target === displayScores.value[i]) return
      if (animFrames[i]) cancelAnimationFrame(animFrames[i]!)
      const start = performance.now()
      const from = displayScores.value[i]!
      const duration = 350
      function step(now: number) {
        const p = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        displayScores.value[i] = Math.round(from + (target - from) * eased)
        if (p < 1) animFrames[i] = requestAnimationFrame(step)
        else { displayScores.value[i] = target; animFrames[i] = null }
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
    if (newLen <= (oldLen ?? 0)) return
    const lastTurn = state.turn_history[newLen - 1]
    if (!lastTurn || lastTurn.busted) return
    if (state.is_finished || legWonFlash.value || gameOverFlash.value) return
    triggerTurnTotalFlash(turnTotal(lastTurn))
  },
  { immediate: true },
)

const currentTurnTotal = computed(() =>
  state.current_turn.throws.reduce((s, t) => s + throwPoints(t), 0),
)

const checkoutHint = computed(() => {
  if (state.is_finished) return null
  const player = state.players[state.current_player_index]
  if (!player) return null
  const dartsRemaining = 3 - state.current_turn.throws.length
  return getCheckout(player.score, dartsRemaining)
})

function playerAvg(idx: number): string {
  const p = state.players[idx]
  return p ? threeDartAverage(p).toFixed(1) : '0.0'
}

function playerDarts(idx: number): number {
  const p = state.players[idx]
  return p ? p.turns.reduce((s, t) => s + t.throws.length, 0) : 0
}

const lastTurn = computed(() => {
  const h = state.turn_history
  return h.length > 0 ? h[h.length - 1] : null
})

function throwColor(t: ThrowResult): string {
  if (t.segment === 0) return 'text-fg-muted'
  if (t.multiplier === 3) return 'text-green'
  if (t.multiplier === 2) return 'text-gold'
  return 'text-fg'
}

const inputDisabled = computed(() => state.is_finished || isBotPlaying.value)

const currentPlayerIsBot = computed(() => {
  const player = state.players[state.current_player_index]
  return player?.isBot ?? false
})

function handleScore(segment: number, multiplier: number) {
  if (inputDisabled.value) return
  manualScore(segment, multiplier)
}

function dismissGameOver() {
  showGameOver.value = false
}

// Redirect to home if no game is active (but not during game over)
watch(hasGame, (active) => {
  if (!active && !gameOverFlash.value) {
    navigateTo('/dashboard')
  }
})
</script>

<template>
  <div class="game-root flex flex-col overflow-hidden w-full px-sm md:px-md">
    <!-- Top bar: player score cards -->
    <div class="flex gap-xs md:gap-sm py-[2px] md:py-sm shrink-0">
      <div
        v-for="(player, i) in state.players"
        :key="i"
        class="player-card flex-1 flex items-center gap-xs md:gap-md px-sm py-xs md:px-xl md:py-md min-w-0 rounded-lg"
        :class="{ active: i === state.current_player_index }"
      >
        <svg v-if="player.isBot" class="hidden md:block w-[28px] h-[28px] text-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="8.5" cy="16" r="1.5" /><circle cx="15.5" cy="16" r="1.5" /><path d="M12 2v5M7 7h10" /></svg>
        <PlayerAvatar v-else v-bind="getAvatarProps(player.name)" :size="28" class="hidden md:block" />
        <span class="pc-name text-xs font-bold text-fg-muted uppercase tracking-wide whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">{{ player.name }}</span>
        <span class="pc-score text-[1.9rem] md:text-[2rem] lg:text-[2.8rem] font-black text-fg tabular-nums leading-none ml-auto md:ml-0">{{ displayScores[i] ?? player.score }}</span>
        <span v-if="isMatch" class="md:hidden text-[0.65rem] font-bold text-fg-muted tabular-nums whitespace-nowrap">
          <template v-if="hasSets">S{{ state.sets_won[i] ?? 0 }} </template>L{{ state.current_set_legs[i] ?? 0 }}
        </span>
        <span class="hidden md:flex flex-col gap-[2px] ml-auto">
          <span v-if="hasSets" class="text-[0.7rem] text-fg-muted whitespace-nowrap text-right">S {{ state.sets_won[i] ?? 0 }}/{{ state.sets_to_win }}</span>
          <span v-if="isMatch" class="text-[0.7rem] text-fg-muted whitespace-nowrap text-right">L {{ state.current_set_legs[i] ?? 0 }}/{{ state.legs_to_win }}</span>
          <span class="text-[0.7rem] text-fg-muted whitespace-nowrap text-right">{{ playerAvg(i) }} avg</span>
          <span class="text-[0.7rem] text-fg-muted whitespace-nowrap text-right">{{ playerDarts(i) }} darts</span>
        </span>
      </div>
    </div>

    <!-- Current turn panel (full width) -->
    <div class="shrink-0 bg-glass border border-border-subtle rounded-md px-sm sm:px-md py-xs sm:py-sm flex flex-col gap-[2px] sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-md">
      <!-- Throw slots (center on desktop, first row on mobile) -->
      <div class="flex justify-center sm:order-2">
        <div class="flex items-center gap-sm">
          <span
            v-for="slot in 3"
            :key="slot"
            class="ct-slot flex items-center gap-[4px] px-sm py-xs sm:px-md sm:py-sm bg-surface-2 border border-border-subtle rounded-sm min-w-[52px] sm:min-w-[72px] justify-center"
            :class="{ filled: state.current_turn.throws[slot - 1] }"
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
              <span v-for="(dart, i) in checkoutHint" :key="i" class="ct-checkout-dart text-[0.85rem] font-bold text-gold px-sm py-[2px] rounded-sm">{{ dart }}</span>
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
      <template v-else>
        <span v-for="(t, i) in lastTurn.throws" :key="i" :class="throwColor(t)" class="font-semibold">{{ throwLabel(t) }}</span>
        <span class="font-extrabold text-fg tabular-nums ml-auto">= {{ turnTotal(lastTurn) }}</span>
      </template>
    </div>

    <!-- Main area: 2-column layout -->
    <div class="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[300px_1fr] gap-md pt-0 pb-xs md:pt-xs md:pb-sm">
      <!-- Left: Context sidebar -->
      <div class="hidden md:flex flex-col gap-sm min-h-0 overflow-hidden">
        <!-- Throw history (scrollable) -->
        <div class="flex-1 min-h-0 overflow-hidden rounded-md bg-glass border border-border-subtle p-sm">
          <ThrowHistory
            :turn-history="state.turn_history"
            :player-names="playerNames"
          />
        </div>
      </div>

      <!-- Right: Input hero + action row -->
      <div class="flex flex-col gap-xs md:gap-sm min-h-0">
        <!-- Bot throwing indicator -->
        <div v-if="currentPlayerIsBot && isBotPlaying" class="bot-throwing-indicator shrink-0">
          <svg class="inline-block w-[18px] h-[18px] mr-xs animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="8.5" cy="16" r="1.5" /><circle cx="15.5" cy="16" r="1.5" /><path d="M12 2v5M7 7h10" /></svg>
          Bot is throwing...
        </div>

        <ManualScoreInput
          :disabled="inputDisabled"
          @score="handleScore"
        />

        <!-- Action row (always visible) -->
        <div class="flex gap-sm shrink-0">
          <button
            class="btn btn-undo flex-1"
            :disabled="inputDisabled"
            @click="undoThrow"
          >
            Undo
          </button>
        </div>
      </div>
    </div>

    <!-- Audio mute toggle FAB -->
    <button
      class="audio-fab"
      :title="audioEnabled ? 'Mute sounds' : 'Unmute sounds'"
      @click="toggleAudio()"
    >
      <svg v-if="audioEnabled" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    </button>

    <!-- Announcer toggle FAB -->
    <button
      class="announcer-fab"
      :class="{ active: announcerEnabled }"
      @click="toggleAnnouncer"
      :title="announcerEnabled ? 'Disable announcer' : 'Enable announcer'"
      :aria-label="announcerEnabled ? 'Disable announcer' : 'Enable announcer'"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
        <line v-if="!announcerEnabled" x1="1" y1="1" x2="23" y2="23" />
      </svg>
    </button>

    <!-- Audio mute toggle FAB -->
    <button
      class="audio-fab"
      :title="audioEnabled ? 'Mute sounds' : 'Unmute sounds'"
      @click="toggleAudio()"
    >
      <svg v-if="audioEnabled" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    </button>

    <!-- Dartboard FAB -->
    <button
      class="dartboard-fab"
      @click="showDartboard = !showDartboard"
      :title="showDartboard ? 'Close dartboard' : 'Open dartboard'"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    </button>

    <!-- Dartboard overlay -->
    <Transition name="fade">
      <div v-if="showDartboard" class="dartboard-overlay" @click.self="showDartboard = false">
        <div class="dartboard-container">
          <DartBoard
            :disabled="inputDisabled"
            :theme="dartboardTheme"
            @score="handleScore"
          />
          <button class="dartboard-close" @click="showDartboard = false">&times;</button>
        </div>
      </div>
    </Transition>

    <!-- Overlays -->
    <Transition name="fade">
      <div v-if="bustFlash" class="overlay bg-black/50">
        <span class="bust-text">BUST!</span>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="turnTotalFlash !== null" class="overlay bg-black/45">
        <div class="total-content text-center">
          <span class="total-label block text-[0.9rem] font-bold tracking-[2px] uppercase text-fg-muted mb-xs">Total</span>
          <span class="total-score block text-[5rem] font-black text-gold tabular-nums">{{ turnTotalFlash }}</span>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="legWonFlash" class="overlay bg-black/50">
        <div class="leg-content text-center">
          <span class="leg-text block text-[4rem] font-black text-gradient-gold">Leg Won!</span>
          <span class="block text-2xl font-bold text-fg mt-xs">{{ legWonPlayerName }}</span>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="gameOverFlash && showGameOver" class="overlay gameover-overlay">
        <div class="text-center">
          <div class="gameover-title text-[2.5rem] font-extrabold text-gradient-gold mb-sm">Game Over</div>
          <div class="gameover-winner flex items-center justify-center gap-md text-2xl text-fg mb-md">
            <PlayerAvatar v-if="winnerName" v-bind="getAvatarProps(winnerName)" :size="48" />
            <span>{{ winnerName }} wins!</span>
          </div>
          <div v-if="isMatch" class="gameover-summary flex gap-xl justify-center mb-xl">
            <div v-for="(player, i) in state.players" :key="i" class="flex flex-col items-center gap-[2px]">
              <span class="text-[0.85rem] font-bold text-fg-muted uppercase tracking-wide">{{ player.name }}</span>
              <span v-if="hasSets" class="text-[1.1rem] font-extrabold text-fg tabular-nums">{{ state.sets_won[i] ?? 0 }} sets</span>
              <span class="text-[1.1rem] font-extrabold text-fg tabular-nums">{{ player.legs_won }} legs</span>
            </div>
          </div>
          <div class="gameover-actions flex gap-md justify-center">
            <NuxtLink
              v-if="isTournamentMatch"
              :to="`/tournaments/${tournamentId}`"
              class="btn btn-gold"
              @click="clearTournamentContext()"
            >
              Back to Tournament
            </NuxtLink>
            <template v-else>
              <button class="btn btn-gold" @click="dismissGameOver">Continue</button>
              <NuxtLink to="/" class="btn btn-secondary">New Game</NuxtLink>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ── Game root: accounts for safe-area insets on notched devices ── */
.game-root {
  height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 44px);
  /* Neutralize body's padding-bottom which is already accounted for in the height calc */
  margin-bottom: calc(-1 * env(safe-area-inset-bottom, 0px));
}

/* ── Player card: glass effect + active glow (multi-property transition) ── */
.player-card {
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-subtle);
  transition: border-color var(--duration-normal), box-shadow var(--duration-normal);
}

.player-card.active {
  border-color: var(--gold);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.12);
}

.active .pc-name,
.active .pc-score {
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── Current turn: filled slot gold border ── */
.ct-slot.filled {
  border-color: var(--border-gold);
  background: rgba(255, 215, 0, 0.06);
}

/* ── Checkout dart pill ── */
.ct-checkout-dart {
  background: rgba(255, 215, 0, 0.08);
  border: 1px solid rgba(255, 215, 0, 0.15);
}

/* ── Undo button: hover/active transitions ── */
.btn-undo {
  min-height: 48px;
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 700;
  font-family: var(--font-sans);
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  transition:
    transform 50ms var(--ease-out),
    background var(--duration-fast),
    box-shadow var(--duration-fast);
}

@media (min-width: 768px) {
  .btn-undo {
    min-height: 52px;
  }
}

.btn-undo:active:not(:disabled) {
  transform: scale(0.97);
}

.btn-undo:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-undo:hover:not(:disabled) {
  background: var(--surface-3);
  border-color: var(--border-default);
}

/* ── Bot throwing indicator ── */
.bot-throwing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(255, 215, 0, 0.08);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: var(--radius-md);
  color: var(--gold);
  font-size: 0.9rem;
  font-weight: 700;
}

/* ── Audio toggle FAB ── */
.audio-fab {
  position: fixed;
  bottom: var(--space-md, 12px);
  right: calc(var(--space-md, 12px) + 56px);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition:
    transform var(--duration-fast),
    box-shadow var(--duration-fast),
    border-color var(--duration-fast);
}

@media (min-width: 768px) {
  .audio-fab {
    bottom: var(--space-xl, 24px);
    right: calc(var(--space-xl, 24px) + 60px);
  }
}

.audio-fab:hover {
  transform: scale(1.1);
  border-color: var(--border-gold);
  box-shadow: var(--shadow-glow-gold);
  color: var(--gold);
}

/* ── Announcer FAB: sits above audio and dartboard FABs ── */
.announcer-fab {
  position: fixed;
  bottom: calc(var(--space-md, 12px) + 56px);
  right: var(--space-md, 12px);
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition:
    transform var(--duration-fast),
    box-shadow var(--duration-fast),
    border-color var(--duration-fast),
    color var(--duration-fast);
}

@media (min-width: 768px) {
  .announcer-fab {
    bottom: calc(var(--space-xl, 24px) + 60px);
    right: var(--space-xl, 24px);
  }
}

.announcer-fab:hover {
  transform: scale(1.1);
  border-color: var(--border-gold);
  box-shadow: var(--shadow-glow-gold);
  color: var(--gold);
}

.announcer-fab.active {
  border-color: var(--gold);
  color: var(--gold);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.15);
}



/* ── Dartboard FAB: fixed position + hover glow ── */
.dartboard-fab {
  position: fixed;
  bottom: var(--space-md, 12px);
  right: var(--space-md, 12px);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition:
    transform var(--duration-fast),
    box-shadow var(--duration-fast),
    border-color var(--duration-fast);
}

@media (min-width: 768px) {
  .dartboard-fab {
    bottom: var(--space-xl, 24px);
    right: var(--space-xl, 24px);
  }
}

.dartboard-fab:hover {
  transform: scale(1.1);
  border-color: var(--border-gold);
  box-shadow: var(--shadow-glow-gold);
  color: var(--gold);
}

/* ── Dartboard overlay ── */
.dartboard-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
}

.dartboard-container {
  position: relative;
  width: min(80vw, 80vh, 600px);
  height: min(80vw, 80vh, 600px);
}

.dartboard-container :deep(.dartboard) {
  width: 100%;
  height: 100%;
}

.dartboard-close {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.dartboard-close:hover {
  background: var(--surface-3);
}

/* ── Overlay base ── */
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  pointer-events: none;
}

/* ── Bust text ── */
.bust-text {
  font-size: 5rem;
  font-weight: 900;
  color: var(--red);
  text-shadow: 0 0 60px var(--red-glow);
  animation: bust-appear 0.4s var(--ease-spring);
}

/* ── Turn total overlay ── */
.total-content {
  animation: bust-appear 0.4s var(--ease-spring);
}

.total-score {
  text-shadow: 0 0 60px var(--gold-glow);
}

/* ── Leg won overlay ── */
.leg-content {
  animation: bust-appear 0.4s var(--ease-spring);
}

@keyframes bust-appear {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* ── Game over overlay ── */
.gameover-overlay {
  background: rgba(0, 0, 0, 0.85);
  pointer-events: all;
  backdrop-filter: blur(8px);
}

.gameover-title {
  animation: scale-in 0.5s var(--ease-spring);
}

.gameover-winner {
  animation: scale-in 0.5s var(--ease-spring) 0.1s both;
}

.gameover-summary {
  animation: scale-in 0.5s var(--ease-spring) 0.15s both;
}

.gameover-actions {
  animation: scale-in 0.5s var(--ease-spring) 0.2s both;
}

@keyframes scale-in {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
