<script setup lang="ts">
import { throwLabel } from '#shared/game-models'
import { GameEngine } from '#shared/game-engine'
import type { DartMarker } from '~/components/DartBoard.vue'

interface ReplayThrow {
  throwNumber: number
  segment: number
  multiplier: number
  points: number
}

interface ReplayTurn {
  turnNumber: number
  playerName: string
  totalPoints: number
  busted: boolean
  throws: ReplayThrow[]
}

interface ReplayPlayer {
  playerName: string
  position: number
  finalScore: number
}

interface ReplayGame {
  id: number
  mode: string
  winnerName: string | null
  totalTurns: number
  createdAt: string
}

interface ReplayData {
  game: ReplayGame
  players: ReplayPlayer[]
  turns: ReplayTurn[]
}

const route = useRoute()
const gameId = Number(route.params.id)

const { data: replayData, error, status } = await useFetch<ReplayData>(
  `/api/game/${gameId}/replay`,
)

// Build a flat list of all dart positions for stepping through
// Each position is { turnIndex, dartIndex } where dartIndex is 0-based within the turn
// Position 0 = start of game (no darts thrown yet)
// Each subsequent position adds one dart
interface DartPosition {
  turnIndex: number
  dartIndex: number // 0, 1, or 2 within the turn
}

const allPositions = computed((): DartPosition[] => {
  if (!replayData.value) return []
  const positions: DartPosition[] = []
  for (let ti = 0; ti < replayData.value.turns.length; ti++) {
    const turn = replayData.value.turns[ti]!
    for (let di = 0; di < turn.throws.length; di++) {
      positions.push({ turnIndex: ti, dartIndex: di })
    }
  }
  return positions
})

const totalPositions = computed(() => allPositions.value.length)

// Replay state
const currentPosition = ref(0) // 0 = no darts shown, 1 = first dart, etc.
const isPlaying = ref(false)
const speed = ref(1)
let playInterval: ReturnType<typeof setInterval> | null = null

// Compute game state at current position
const startingScore = computed(() => {
  if (!replayData.value) return 501
  return parseInt(replayData.value.game.mode, 10)
})

// All darts up to (but not including) currentPosition are "already thrown"
// The dart AT currentPosition (1-indexed) is the last one shown
const visibleDarts = computed(() => {
  return allPositions.value.slice(0, currentPosition.value)
})

// Current turn index (the turn that the last visible dart belongs to)
const currentTurnIndex = computed(() => {
  if (visibleDarts.value.length === 0) return -1
  return visibleDarts.value[visibleDarts.value.length - 1]!.turnIndex
})

// Compute scores for each player at current position using GameEngine
const playerScores = computed(() => {
  if (!replayData.value) return new Map<string, number>()
  const scores = new Map<string, number>()
  const starting = startingScore.value
  
  // Initialize scores
  for (const p of replayData.value.players) {
    scores.set(p.playerName, starting)
  }

  const darts = visibleDarts.value
  if (darts.length === 0) return scores

  // Use GameEngine to reconstruct scores
  const engine = new GameEngine()
  const playerNames = replayData.value.players.map(p => p.playerName)
  engine.newGame(
    replayData.value.game.mode as '501' | '301',
    playerNames,
    'double_out',
    1,
    1,
  )

  // Replay all visible darts through the engine
  for (const dart of darts) {
    const turn = replayData.value.turns[dart.turnIndex]!
    const throwData = turn.throws[dart.dartIndex]!
    
    // Make sure we're on the correct player
    const currentPlayerName = engine.state.players[engine.state.current_player_index]!.name
    if (currentPlayerName !== turn.playerName) {
      // This shouldn't happen if data is correct, but skip if misaligned
      continue
    }
    
    engine.throw({
      segment: throwData.segment,
      multiplier: throwData.multiplier as 1 | 2 | 3,
    })
  }

  // Extract scores from engine state
  for (const player of engine.state.players) {
    scores.set(player.name, player.score)
  }

  return scores
})

// Current turn info for display
const currentTurnInfo = computed(() => {
  if (!replayData.value || currentTurnIndex.value < 0) return null
  const turn = replayData.value.turns[currentTurnIndex.value]!
  if (!turn) return null

  // Show darts up to the current position within this turn
  const dartsInThisTurn = visibleDarts.value.filter(
    d => d.turnIndex === currentTurnIndex.value,
  )

  const visibleThrows = dartsInThisTurn.map(d => turn.throws[d.dartIndex]!)

  return {
    playerName: turn.playerName,
    turnNumber: turn.turnNumber + 1,
    busted: turn.busted && dartsInThisTurn.length === turn.throws.length,
    throws: visibleThrows,
    totalVisiblePoints: visibleThrows.reduce((s, t) => s + t.points, 0),
  }
})

// Dart markers for the board
const dartMarkers = computed((): DartMarker[] => {
  if (!currentTurnInfo.value) return []
  return currentTurnInfo.value.throws.map(t => ({
    segment: t.segment,
    multiplier: t.multiplier as 1 | 2 | 3,
    label: throwLabel({ segment: t.segment, multiplier: t.multiplier as 1 | 2 | 3 }),
  }))
})

// Who is throwing at current position
const activePlayerName = computed(() => {
  if (!replayData.value) return null
  if (currentPosition.value === 0) {
    return replayData.value.players[0]?.playerName ?? null
  }
  return currentTurnInfo.value?.playerName ?? null
})

// Playback controls
function togglePlay() {
  if (isPlaying.value) {
    pause()
  } else {
    play()
  }
}

function play() {
  if (currentPosition.value >= totalPositions.value) {
    currentPosition.value = 0
  }
  isPlaying.value = true
  startPlayback()
}

function pause() {
  isPlaying.value = false
  stopPlayback()
}

function startPlayback() {
  stopPlayback()
  const interval = Math.max(200, 1000 / speed.value)
  playInterval = setInterval(() => {
    if (currentPosition.value >= totalPositions.value) {
      pause()
      return
    }
    currentPosition.value++
  }, interval)
}

function stopPlayback() {
  if (playInterval) {
    clearInterval(playInterval)
    playInterval = null
  }
}

function stepForward() {
  pause()
  if (currentPosition.value < totalPositions.value) {
    currentPosition.value++
  }
}

function stepBack() {
  pause()
  if (currentPosition.value > 0) {
    currentPosition.value--
  }
}

function goToStart() {
  pause()
  currentPosition.value = 0
}

function goToEnd() {
  pause()
  currentPosition.value = totalPositions.value
}

function setSpeed(s: number) {
  speed.value = s
  if (isPlaying.value) {
    startPlayback()
  }
}

function seek(position: number) {
  currentPosition.value = position
}

// Keyboard shortcuts
function onKeydown(e: KeyboardEvent) {
  // Ignore shortcuts when focus is on an input/textarea/select/button
  const target = e.target as HTMLElement
  if (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.tagName === 'BUTTON' ||
    target.isContentEditable
  ) {
    return
  }

  // Ignore shortcuts when modifiers are pressed (except for built-in shortcuts)
  if (e.ctrlKey || e.metaKey || e.altKey) {
    return
  }

  switch (e.key) {
    case ' ':
      e.preventDefault()
      togglePlay()
      break
    case 'ArrowRight':
      e.preventDefault()
      stepForward()
      break
    case 'ArrowLeft':
      e.preventDefault()
      stepBack()
      break
    case 'Home':
      e.preventDefault()
      goToStart()
      break
    case 'End':
      e.preventDefault()
      goToEnd()
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  stopPlayback()
  window.removeEventListener('keydown', onKeydown)
})

// Watch speed changes to restart playback interval
watch(speed, () => {
  if (isPlaying.value) {
    startPlayback()
  }
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatThrowLabel(t: ReplayThrow): string {
  return throwLabel({ segment: t.segment, multiplier: t.multiplier as 1 | 2 | 3 })
}

// Progress percentage for the turn
const turnProgress = computed(() => {
  if (!replayData.value || currentTurnIndex.value < 0) return ''
  const turn = replayData.value.turns[currentTurnIndex.value]!
  if (!turn) return ''
  const dartsInTurn = visibleDarts.value.filter(d => d.turnIndex === currentTurnIndex.value).length
  return `${dartsInTurn} / ${turn.throws.length}`
})
</script>

<template>
  <div class="px-lg py-xl max-w-[900px] mx-auto w-full">
    <!-- Loading state -->
    <div v-if="status === 'pending'" class="text-center text-fg-muted p-2xl">
      Loading replay...
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center p-2xl">
      <p class="text-red text-[1rem] mb-md">{{ error.data?.message || 'Failed to load replay' }}</p>
      <NuxtLink to="/stats" class="btn btn-secondary">Back to Stats</NuxtLink>
    </div>

    <!-- Replay content -->
    <template v-else-if="replayData">
      <!-- Header -->
      <div class="replay-header mb-xl">
        <div class="flex items-center gap-md mb-sm">
          <NuxtLink to="/stats" class="back-link">&larr; Stats</NuxtLink>
          <span class="text-[0.75rem] font-bold text-gold bg-gold-tint px-[8px] py-[2px] rounded-sm">
            {{ replayData.game.mode }}
          </span>
        </div>
        <h2 class="text-[1.5rem] font-extrabold text-fg mb-xs">Game Replay</h2>
        <p class="text-[0.85rem] text-fg-muted">
          {{ replayData.players.map(p => p.playerName).join(' vs ') }}
          <template v-if="replayData.game.winnerName">
            &mdash; Winner: <span class="text-gold font-semibold">{{ replayData.game.winnerName }}</span>
          </template>
          &nbsp;&bull;&nbsp;
          {{ formatDate(replayData.game.createdAt) }}
        </p>
      </div>

      <div class="replay-layout">
        <!-- Left column: Dartboard -->
        <div class="board-column">
          <DartBoard
            :disabled="true"
            :highlight-segments="dartMarkers"
          />

          <!-- Current throw labels under the board -->
          <div v-if="currentTurnInfo" class="dart-labels">
            <div
              v-for="(t, i) in currentTurnInfo.throws"
              :key="i"
              class="dart-label"
              :class="{ 'dart-miss': t.segment === 0 }"
            >
              {{ formatThrowLabel(t) }}
              <span class="dart-points">{{ t.points }}</span>
            </div>
            <div
              v-if="currentTurnInfo.busted"
              class="dart-label dart-bust"
            >
              BUST
            </div>
          </div>
        </div>

        <!-- Right column: Scores + Turn info -->
        <div class="info-column">
          <!-- Player scores -->
          <div class="scores-panel glass-card p-lg">
            <h3 class="panel-title">Scores</h3>
            <div class="player-scores">
              <div
                v-for="player in replayData.players"
                :key="player.playerName"
                class="player-score-row"
                :class="{
                  'active-player': player.playerName === activePlayerName,
                  'is-winner': replayData.game.winnerName === player.playerName && currentPosition >= totalPositions,
                }"
              >
                <span class="player-name">{{ player.playerName }}</span>
                <span class="player-score tabular-nums">
                  {{ playerScores.get(player.playerName) ?? startingScore }}
                </span>
              </div>
            </div>
          </div>

          <!-- Current turn info -->
          <div class="turn-panel glass-card p-lg">
            <h3 class="panel-title">Current Turn</h3>
            <div v-if="currentTurnInfo" class="turn-info">
              <div class="turn-meta">
                <span class="turn-player">{{ currentTurnInfo.playerName }}</span>
                <span class="turn-number">Turn {{ currentTurnInfo.turnNumber }}</span>
              </div>
              <div class="turn-score-row">
                <span class="turn-points tabular-nums">{{ currentTurnInfo.totalVisiblePoints }}</span>
                <span class="turn-darts-count">{{ turnProgress }} darts</span>
              </div>
              <div v-if="currentTurnInfo.busted" class="bust-badge">BUST</div>
            </div>
            <div v-else class="text-fg-muted text-[0.85rem]">
              {{ currentPosition === 0 ? 'Press play to start' : 'Game complete' }}
            </div>
          </div>

          <!-- Game summary (shown at end) -->
          <div
            v-if="currentPosition >= totalPositions && replayData.game.winnerName"
            class="summary-panel glass-card p-lg"
          >
            <h3 class="panel-title">Result</h3>
            <div class="text-center">
              <div class="text-[1.2rem] font-extrabold text-gold mb-xs">
                {{ replayData.game.winnerName }} wins!
              </div>
              <div class="text-[0.8rem] text-fg-muted">
                {{ replayData.game.totalTurns }} turns played
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="mt-lg">
        <ReplayControls
          :is-playing="isPlaying"
          :speed="speed"
          :current-position="currentPosition"
          :total-positions="totalPositions"
          :can-step-back="currentPosition > 0"
          :can-step-forward="currentPosition < totalPositions"
          @toggle-play="togglePlay"
          @step-forward="stepForward"
          @step-back="stepBack"
          @go-to-start="goToStart"
          @go-to-end="goToEnd"
          @set-speed="setSpeed"
          @seek="seek"
        />
      </div>

      <!-- Keyboard hint -->
      <div class="keyboard-hint">
        Space: play/pause &bull; Arrow keys: step &bull; Home/End: jump
      </div>
    </template>
  </div>
</template>

<style scoped>
.replay-header {
  position: relative;
}

.back-link {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-decoration: none;
  transition: color var(--duration-fast);
}

.back-link:hover {
  color: var(--text-primary);
}

.replay-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: var(--spacing-xl);
  align-items: start;
}

@media (max-width: 700px) {
  .replay-layout {
    grid-template-columns: 1fr;
  }
}

.board-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.info-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.panel-title {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: var(--spacing-md);
}

/* Player scores */
.player-scores {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.player-score-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition:
    background var(--duration-fast),
    border-color var(--duration-fast);
}

.player-score-row.active-player {
  background: rgba(255, 215, 0, 0.08);
  border-color: var(--border-gold);
}

.player-score-row.is-winner {
  background: rgba(255, 215, 0, 0.12);
  border-color: var(--border-gold);
}

.player-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.active-player .player-name {
  color: var(--gold);
}

.player-score {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
}

/* Turn info */
.turn-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.turn-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.turn-player {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gold);
}

.turn-number {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.turn-score-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.turn-points {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-primary);
}

.turn-darts-count {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.bust-badge {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--red-tint);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  color: var(--red);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
}

/* Dart labels under board */
.dart-labels {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
  flex-wrap: wrap;
}

.dart-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
}

.dart-label.dart-miss {
  color: var(--text-muted);
  opacity: 0.7;
}

.dart-label.dart-bust {
  background: var(--red-tint);
  border-color: rgba(239, 68, 68, 0.3);
  color: var(--red);
}

.dart-points {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 400;
}

/* Summary panel */
.summary-panel {
  border-color: var(--border-gold);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.06), transparent);
}

/* Keyboard hint */
.keyboard-hint {
  text-align: center;
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: var(--spacing-md);
  opacity: 0.7;
}

/* Color utilities */
.text-red {
  color: var(--red);
}
</style>
