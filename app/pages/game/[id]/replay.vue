<script setup lang="ts">
import type { DartMarker } from '~/components/DartBoard.vue'
import { GameEngine } from '#shared/game-engine'
import { throwLabel } from '#shared/game-models'

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
  if (!replayData.value)
    return []
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
  if (!replayData.value)
    return 501
  return Number.parseInt(replayData.value.game.mode, 10)
})

// All darts up to (but not including) currentPosition are "already thrown"
// The dart AT currentPosition (1-indexed) is the last one shown
const visibleDarts = computed(() => {
  return allPositions.value.slice(0, currentPosition.value)
})

// Current turn index (the turn that the last visible dart belongs to)
const currentTurnIndex = computed(() => {
  if (visibleDarts.value.length === 0)
    return -1
  return visibleDarts.value[visibleDarts.value.length - 1]!.turnIndex
})

// Compute scores for each player at current position using GameEngine
const playerScores = computed(() => {
  if (!replayData.value)
    return new Map<string, number>()
  const scores = new Map<string, number>()
  const starting = startingScore.value

  // Initialize scores
  for (const p of replayData.value.players) {
    scores.set(p.playerName, starting)
  }

  const darts = visibleDarts.value
  if (darts.length === 0)
    return scores

  // Use GameEngine to reconstruct scores
  const engine = new GameEngine()
  const playerNames = replayData.value.players.map(p => p.playerName)
  engine.newGame(
    replayData.value.game.mode as '501' | '301',
    playerNames,
    'double_out',
    1, // legsToWin
    1, // setsToWin
  )

  // Replay all visible darts through the engine
  for (const dart of darts) {
    const turn = replayData.value.turns[dart.turnIndex]!
    const throwData = turn.throws[dart.dartIndex]!

    // Make sure we're on the correct player
    const currentPlayerName = engine.state.players[engine.state.current_player_index]!.name
    if (currentPlayerName !== turn.playerName) {
      // This shouldn't happen if data is correct, but skip if misaligned
      console.warn(`Player mismatch in replay: expected ${currentPlayerName}, got ${turn.playerName}`)
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
  if (!replayData.value || currentTurnIndex.value < 0)
    return null
  const turn = replayData.value.turns[currentTurnIndex.value]!
  if (!turn)
    return null

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
  if (!currentTurnInfo.value)
    return []
  return currentTurnInfo.value.throws.map(t => ({
    segment: t.segment,
    multiplier: t.multiplier as 1 | 2 | 3,
    label: throwLabel({ segment: t.segment, multiplier: t.multiplier as 1 | 2 | 3 }),
  }))
})

// Who is throwing at current position
const activePlayerName = computed(() => {
  if (!replayData.value)
    return null
  if (currentPosition.value === 0) {
    return replayData.value.players[0]?.playerName ?? null
  }
  return currentTurnInfo.value?.playerName ?? null
})

// Playback controls
function togglePlay() {
  if (isPlaying.value) {
    pause()
  }
  else {
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
    target.tagName === 'INPUT'
    || target.tagName === 'TEXTAREA'
    || target.tagName === 'SELECT'
    || target.tagName === 'BUTTON'
    || target.isContentEditable
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
  if (!replayData.value || currentTurnIndex.value < 0)
    return ''
  const turn = replayData.value.turns[currentTurnIndex.value]!
  if (!turn)
    return ''
  const dartsInTurn = visibleDarts.value.filter(d => d.turnIndex === currentTurnIndex.value).length
  return `${dartsInTurn} / ${turn.throws.length}`
})
</script>

<template>
  <AuthGate feature="Game Replay" description="Sign in to watch replays of your past games throw by throw.">
    <div class="px-lg py-xl max-w-[900px] mx-auto w-full">
      <!-- Loading state -->
      <div v-if="status === 'pending'" class="text-center text-fg-muted p-2xl">
        Loading replay...
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center p-2xl">
        <p class="text-red text-[1rem] mb-md">
          {{ error.data?.message || 'Failed to load replay' }}
        </p>
        <NuxtLink
          to="/stats"
          class="inline-flex items-center justify-center gap-2 rounded-md border-2 border-black bg-surface-1 px-lg py-sm text-[0.85rem] font-semibold text-fg shadow-sm transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          Back to Stats
        </NuxtLink>
      </div>

      <!-- Replay content -->
      <template v-else-if="replayData">
        <!-- Header -->
        <div class="relative mb-xl">
          <div class="flex items-center gap-md mb-sm">
            <BackLink to="/stats" label="Stats" />
            <span class="text-[0.75rem] font-bold text-yellow bg-yellow-light border border-black px-[8px] py-[2px] rounded-sm">
              {{ replayData.game.mode }}
            </span>
          </div>
          <h2 class="text-[1.5rem] font-extrabold text-fg mb-xs">
            Game Replay
          </h2>
          <p class="text-[0.85rem] text-fg-muted">
            {{ replayData.players.map(p => p.playerName).join(' vs ') }}
            <template v-if="replayData.game.winnerName">
              &mdash; Winner: <span class="text-yellow font-semibold">{{ replayData.game.winnerName }}</span>
            </template>
            &nbsp;&bull;&nbsp;
            {{ formatDate(replayData.game.createdAt) }}
          </p>
        </div>

        <div class="grid grid-cols-[1fr_280px] gap-xl items-start max-[700px]:grid-cols-1">
          <!-- Left column: Dartboard -->
          <div class="flex flex-col items-center gap-md">
            <DartBoard
              :disabled="true"
              :highlight-segments="dartMarkers"
            />

            <!-- Current throw labels under the board -->
            <div v-if="currentTurnInfo" class="flex gap-sm justify-center flex-wrap">
              <div
                v-for="(t, i) in currentTurnInfo.throws"
                :key="i"
                class="flex items-center gap-xs px-md py-xs bg-surface-1 border-2 border-black rounded-sm text-[0.8rem] font-semibold text-fg"
                :class="{ 'text-fg-muted opacity-70': t.segment === 0 }"
              >
                {{ formatThrowLabel(t) }}
                <span class="text-[0.7rem] text-fg-muted font-normal">{{ t.points }}</span>
              </div>
              <div
                v-if="currentTurnInfo.busted"
                class="flex items-center gap-xs px-md py-xs bg-red-light border-2 border-black rounded-sm text-[0.8rem] font-semibold text-red"
              >
                BUST
              </div>
            </div>
          </div>

          <!-- Right column: Scores + Turn info -->
          <div class="flex flex-col gap-md">
            <!-- Player scores -->
            <div class="bg-surface-1 border-2 border-black rounded-lg shadow-md p-lg">
              <h3 class="text-[0.7rem] text-fg-muted uppercase tracking-wide mb-md">
                Scores
              </h3>
              <div class="flex flex-col gap-sm">
                <div
                  v-for="player in replayData.players"
                  :key="player.playerName"
                  class="flex justify-between items-center px-md py-sm rounded-md border-2 transition-all duration-150"
                  :class="[
                    player.playerName === activePlayerName
                      ? 'bg-yellow-light border-black'
                      : replayData.game.winnerName === player.playerName && currentPosition >= totalPositions
                        ? 'bg-yellow-light border-black'
                        : 'border-transparent',
                  ]"
                >
                  <span
                    class="text-[0.85rem] font-semibold"
                    :class="player.playerName === activePlayerName ? 'text-yellow' : 'text-fg'"
                  >{{ player.playerName }}</span>
                  <span class="text-[1.4rem] font-extrabold text-fg tabular-nums">
                    {{ playerScores.get(player.playerName) ?? startingScore }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Current turn info -->
            <div class="bg-surface-1 border-2 border-black rounded-lg shadow-md p-lg">
              <h3 class="text-[0.7rem] text-fg-muted uppercase tracking-wide mb-md">
                Current Turn
              </h3>
              <div v-if="currentTurnInfo" class="flex flex-col gap-sm">
                <div class="flex justify-between items-center">
                  <span class="text-[0.85rem] font-semibold text-yellow">{{ currentTurnInfo.playerName }}</span>
                  <span class="text-[0.7rem] text-fg-muted uppercase tracking-[0.5px]">Turn {{ currentTurnInfo.turnNumber }}</span>
                </div>
                <div class="flex justify-between items-baseline">
                  <span class="text-[1.8rem] font-extrabold text-fg tabular-nums">{{ currentTurnInfo.totalVisiblePoints }}</span>
                  <span class="text-[0.75rem] text-fg-muted">{{ turnProgress }} darts</span>
                </div>
                <div
                  v-if="currentTurnInfo.busted"
                  class="inline-block px-md py-xs bg-red-light border-2 border-black rounded-sm text-red text-[0.75rem] font-bold uppercase tracking-wide text-center"
                >
                  BUST
                </div>
              </div>
              <div v-else class="text-fg-muted text-[0.85rem]">
                {{ currentPosition === 0 ? 'Press play to start' : 'Game complete' }}
              </div>
            </div>

            <!-- Game summary (shown at end) -->
            <div
              v-if="currentPosition >= totalPositions && replayData.game.winnerName"
              class="bg-yellow-light border-2 border-black rounded-lg shadow-md p-lg"
            >
              <h3 class="text-[0.7rem] text-fg-muted uppercase tracking-wide mb-md">
                Result
              </h3>
              <div class="text-center">
                <div class="text-[1.2rem] font-extrabold text-yellow mb-xs">
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
        <div class="text-center text-[0.7rem] text-fg-muted mt-md opacity-70">
          Space: play/pause &bull; Arrow keys: step &bull; Home/End: jump
        </div>
      </template>
    </div>
  </AuthGate>
</template>
