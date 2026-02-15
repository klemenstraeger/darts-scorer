import { GameEngine } from '#shared/game-engine'
import { GameEvent, detectThrowEvent } from '#shared/game-events'
import { throwPoints } from '#shared/game-models'
import type { CheckoutMode, GameMode, Multiplier, PlayerDescriptor } from '#shared/game-models'
import { getCheckout } from '#shared/checkouts'

const STORAGE_KEY = 'darts-scorer:active-game'
const DB_SYNC_INTERVAL = 2000 // Throttled sync: at most every 2 seconds

interface PersistedGame {
  state: ReturnType<GameEngine['newGame']>
  tournamentMatchId: number | null
  tournamentId: number | null
}

// Module-level state shared across all consumers
let engine: GameEngine | null = null
const hasActiveGame = ref(false)
let dbSyncTimer: ReturnType<typeof setTimeout> | null = null
let dbSyncDirty = false
let lastCheckoutAnnouncement: { playerIndex: number; score: number } | null = null

function persistToStorage(tournamentMatchId: number | null = null, tournamentId: number | null = null) {
  if (!engine || !import.meta.client) return
  const data: PersistedGame = {
    state: JSON.parse(JSON.stringify(engine.state)),
    tournamentMatchId,
    tournamentId,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function clearStorage() {
  if (!import.meta.client) return
  localStorage.removeItem(STORAGE_KEY)
}

function readStorage(): PersistedGame | null {
  if (!import.meta.client) return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** Throttled sync: fires at most every DB_SYNC_INTERVAL ms. */
function scheduleDatabaseSync() {
  dbSyncDirty = true
  if (dbSyncTimer) return // already scheduled — will pick up dirty flag
  dbSyncTimer = setTimeout(flushDatabaseSync, DB_SYNC_INTERVAL)
}

function flushDatabaseSync() {
  dbSyncTimer = null
  if (!dbSyncDirty) return
  dbSyncDirty = false
  const persisted = readStorage()
  if (!persisted) return
  $fetch('/api/game/sync', {
    method: 'POST',
    body: {
      state: persisted.state,
      tournamentMatchId: persisted.tournamentMatchId,
    },
  }).catch((err) => {
    console.warn('Failed to sync game to database:', err)
  })
}

function cancelDatabaseSync() {
  if (dbSyncTimer) {
    clearTimeout(dbSyncTimer)
    dbSyncTimer = null
  }
  dbSyncDirty = false
}

/** Clear game state from the database. */
function clearDatabaseState() {
  cancelDatabaseSync()
  $fetch('/api/game/sync', {
    method: 'POST',
    body: { state: null },
  }).catch((err) => {
    console.warn('Failed to clear game from database:', err)
  })
}

export function useGameState() {
  const store = useGameStore()
  const {
    setContext,
    clear: clearTournamentContext,
    tournamentMatchId: ctxMatchId,
    tournamentId: ctxTournamentId,
  } = useTournamentContext()
  const announcer = useAnnouncer()

  function syncToStore() {
    if (!engine) return
    store.updateState(JSON.parse(JSON.stringify(engine.state)))
  }

  function getTournamentContext(): { matchId: number | null; tournamentId: number | null } {
    // Read from composable refs (set by setContext) — not localStorage,
    // because newGame() persists before setContext() is called.
    return {
      matchId: ctxMatchId.value,
      tournamentId: ctxTournamentId.value,
    }
  }

  function newGame(
    mode: string = '501',
    players?: PlayerDescriptor[] | string[],
    options?: {
      checkout?: string
      legs_to_win?: number
      sets_to_win?: number
    },
  ) {
    store.resetFlashes()
    engine = new GameEngine()
    engine.newGame(
      mode as GameMode,
      players,
      (options?.checkout ?? 'double_out') as CheckoutMode,
      options?.legs_to_win ?? 1,
      options?.sets_to_win ?? 1,
    )
    syncToStore()
    persistToStorage()
    scheduleDatabaseSync()
    hasActiveGame.value = true
    lastCheckoutAnnouncement = null
    announcer.announceGameStart()
  }

  function manualScore(segment: number, multiplier: number) {
    if (!engine) return

    // Snapshot pre-throw state for event detection
    const prevTurnCount = engine.state.turn_history.length
    const prevLegs = engine.state.players.map(p => p.legs_won)
    const prevSets = [...engine.state.sets_won]

    engine.manualScore(segment, multiplier as Multiplier)

    const event = detectThrowEvent(prevTurnCount, prevLegs, prevSets, engine.state)

    syncToStore()

    switch (event) {
      case GameEvent.BUST:
        store.triggerBust()
        announcer.announceBust()
        break
      case GameEvent.LEG_WON: {
        store.triggerLegWon()
        const lastTurn = engine.state.turn_history[engine.state.turn_history.length - 1]
        const winnerIdx = lastTurn?.player_index ?? engine.state.current_player_index
        const winnerName = engine.state.players[winnerIdx]?.name ?? ''
        announcer.announceGameShot(winnerName)
        break
      }
      case GameEvent.GAME_OVER: {
        store.triggerGameOver()
        hasActiveGame.value = false
        const matchWinner = engine.state.winner_index != null
          ? engine.state.players[engine.state.winner_index]?.name ?? ''
          : ''
        announcer.announceMatchWon(matchWinner)
        break
      }
      case GameEvent.DART_SCORED: {
        // Announce turn total when a turn completes (new entry in turn_history)
        const newTurnCompleted = engine.state.turn_history.length > prevTurnCount
        if (newTurnCompleted) {
          const lastTurn = engine.state.turn_history[engine.state.turn_history.length - 1]
          if (lastTurn && !lastTurn.busted) {
            const total = lastTurn.throws.reduce((s, t) => s + throwPoints(t), 0)
            announcer.announceScore(total)
          }
        }
        break
      }
    }

    // Announce checkout when a new turn begins and the current player is in checkout range
    if (!engine.state.is_finished) {
      const turnJustStarted = engine.state.turn_history.length > prevTurnCount
      if (turnJustStarted) {
        const currentPlayerIdx = engine.state.current_player_index
        const currentScore = engine.state.players[currentPlayerIdx]?.score
        if (currentScore != null && getCheckout(currentScore, 3)) {
          // Only announce if we haven't already announced for this player at this score
          const shouldAnnounce = !lastCheckoutAnnouncement
            || lastCheckoutAnnouncement.playerIndex !== currentPlayerIdx
            || lastCheckoutAnnouncement.score !== currentScore
          if (shouldAnnounce) {
            lastCheckoutAnnouncement = { playerIndex: currentPlayerIdx, score: currentScore }
            announcer.announceCheckout(currentScore)
          }
        }
      }
    }

    if (engine.state.is_finished) {
      // Save finished game to server
      const ctx = getTournamentContext()
      $fetch('/api/game/save', {
        method: 'POST',
        body: {
          state: JSON.parse(JSON.stringify(engine.state)),
          tournamentMatchId: ctx.matchId ?? undefined,
        },
      }).catch((err) => {
        console.warn('Failed to save finished game:', err)
      })
      clearStorage()
      clearDatabaseState()
    } else {
      const ctx = getTournamentContext()
      persistToStorage(ctx.matchId, ctx.tournamentId)
      scheduleDatabaseSync()
    }
  }

  function undoThrow() {
    if (!engine) return
    engine.undoThrow()
    syncToStore()
    const ctx = getTournamentContext()
    persistToStorage(ctx.matchId, ctx.tournamentId)
    scheduleDatabaseSync()
  }

  function loadState() {
    store.resetFlashes()
    const persisted = readStorage()
    if (!persisted?.state || persisted.state.players.length === 0) {
      return
    }
    engine = new GameEngine(persisted.state)
    syncToStore()
    hasActiveGame.value = true

    // Restore tournament context if present
    if (persisted.tournamentMatchId && persisted.tournamentId) {
      setContext(persisted.tournamentMatchId, persisted.tournamentId)
    }
  }

  async function stopGame() {
    store.resetFlashes()

    // If tournament match, reset it on server
    const ctx = getTournamentContext()
    if (ctx.matchId && ctx.tournamentId) {
      try {
        await $fetch(`/api/tournament/${ctx.tournamentId}/match/${ctx.matchId}/stop`, {
          method: 'POST',
        })
      } catch (err) {
        console.warn('Failed to stop tournament match:', err)
      }
      clearTournamentContext()
    }

    engine = null
    store.resetState()
    clearStorage()
    clearDatabaseState()
    hasActiveGame.value = false
  }

  function checkActiveGame(): boolean {
    const persisted = readStorage()
    const active = !!persisted?.state && persisted.state.players.length > 0 && !persisted.state.is_finished
    hasActiveGame.value = active
    // Clean up stale store state when no active game exists
    if (!active && store.hasGame) {
      engine = null
      store.resetFlashes()
      store.resetState()
    }
    return active
  }

  return {
    state: store.state,
    bustFlash: computed(() => store.bustFlash),
    gameOverFlash: computed(() => store.gameOverFlash),
    legWonFlash: computed(() => store.legWonFlash),
    currentPlayer: store.currentPlayer,
    hasGame: computed(() => store.hasGame),
    hasActiveGame: readonly(hasActiveGame),
    newGame,
    undoThrow,
    manualScore,
    stopGame,
    loadState,
    checkActiveGame,
  }
}
