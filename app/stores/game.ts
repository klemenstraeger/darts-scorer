import type { GameState } from '#shared/game-models'
import { createDefaultGameState } from '#shared/game-models'

export const useGameStore = defineStore('game', () => {
  const state = reactive<GameState>(createDefaultGameState())
  const bustFlash = ref(false)
  const gameOverFlash = ref(false)
  const legWonFlash = ref(false)

  const currentPlayer = computed(() =>
    state.players[state.current_player_index] ?? null,
  )

  const hasGame = computed(() => state.players.length > 0)

  function updateState(data: GameState | Record<string, unknown>) {
    Object.assign(state, parseGameState(data))
  }

  function resetFlashes() {
    gameOverFlash.value = false
    bustFlash.value = false
    legWonFlash.value = false
  }

  function resetState() {
    Object.assign(state, createDefaultGameState())
  }

  function triggerBust() {
    bustFlash.value = true
    setTimeout(() => { bustFlash.value = false }, 2000)
  }

  function triggerLegWon() {
    legWonFlash.value = true
    setTimeout(() => { legWonFlash.value = false }, 2000)
  }

  function triggerGameOver() {
    gameOverFlash.value = true
  }

  return {
    state,
    bustFlash,
    gameOverFlash,
    legWonFlash,
    currentPlayer,
    hasGame,
    updateState,
    resetFlashes,
    resetState,
    triggerBust,
    triggerLegWon,
    triggerGameOver,
  }
})

function parseGameState(data: GameState | Record<string, unknown>): GameState {
  const parsed: GameState = {
    mode: (data.mode as GameState['mode']) ?? '501',
    checkout: (data.checkout as GameState['checkout']) ?? 'double_out',
    legs_to_win: (data.legs_to_win as number) ?? 1,
    sets_to_win: (data.sets_to_win as number) ?? 1,
    players: (data.players as GameState['players']) ?? [],
    current_player_index: (data.current_player_index as number) ?? 0,
    current_turn: (data.current_turn as GameState['current_turn']) ?? { player_index: 0, throws: [], busted: false, score_before: null },
    is_finished: (data.is_finished as boolean) ?? false,
    winner_index: (data.winner_index as number | null) ?? null,
    turn_history: (data.turn_history as GameState['turn_history']) ?? [],
    score_before_turn: (data.score_before_turn as number | null) ?? null,
    current_set_legs: (data.current_set_legs as number[]) ?? [],
    sets_won: (data.sets_won as number[]) ?? [],
    leg_starting_player: (data.leg_starting_player as number) ?? 0,
  }

  // Preserve cricket state if present
  if ('cricket' in data && data.cricket) {
    parsed.cricket = data.cricket as GameState['cricket']
  }

  return parsed
}
