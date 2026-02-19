/**
 * X01 game engine implementing 501/301 rules with configurable checkout.
 * Ported from Python: server/app/game/engine.py
 */

import type {
  CheckoutMode,
  GameMode,
  GameState,
  Multiplier,
  Player,
  PlayerDescriptor,
  ThrowResult,
  Turn,
} from './game-models'
import { createDefaultGameState, throwPoints, turnIsComplete, turnTotalPoints } from './game-models'
import { isAchievableScore, validateVisitScore } from './visit-score-validation'

export class GameEngine {
  state: GameState

  constructor(state?: GameState) {
    this.state = state ?? createDefaultGameState()
  }

  newGame(
    mode: GameMode = '501',
    playerDescriptors?: PlayerDescriptor[] | string[],
    checkout: CheckoutMode = 'double_out',
    legsToWin: number = 1,
    setsToWin: number = 1,
  ): GameState {
    const descriptors: PlayerDescriptor[] = (playerDescriptors ?? [{ name: 'Player 1' }, { name: 'Player 2' }])
      .map(d => typeof d === 'string' ? { name: d } : d)
    const starting = Number.parseInt(mode, 10)
    const numPlayers = descriptors.length

    this.state = {
      mode,
      checkout,
      legs_to_win: legsToWin,
      sets_to_win: setsToWin,
      players: descriptors.map((d): Player => ({
        name: d.name,
        score: starting,
        legs_won: 0,
        sets_won: 0,
        turns: [],
        ...(d.isBot ? { isBot: true, botDifficulty: d.botDifficulty } : {}),
      })),
      current_player_index: 0,
      current_turn: { player_index: 0, throws: [], busted: false, score_before: starting },
      is_finished: false,
      winner_index: null,
      turn_history: [],
      score_before_turn: starting,
      current_set_legs: Array.from({ length: numPlayers }).fill(0) as number[],
      sets_won: Array.from({ length: numPlayers }).fill(0) as number[],
      leg_starting_player: 0,
    }

    return this.state
  }

  stopGame(): GameState {
    this.state = createDefaultGameState()
    return this.state
  }

  throw(dart: ThrowResult): GameState {
    if (this.state.is_finished)
      return this.state

    const turn = this.state.current_turn
    if (turnIsComplete(turn))
      return this.state

    const player = this.state.players[this.state.current_player_index]!
    const newScore = player.score - throwPoints(dart)

    // Check bust conditions
    if (newScore < 0) {
      this._bust(turn, dart)
      return this.state
    }
    else if (newScore === 0) {
      if (this.state.checkout === 'double_out' && dart.multiplier !== 2) {
        this._bust(turn, dart)
        return this.state
      }
      // Checkout!
      turn.throws.push(dart)
      player.score = 0
      this._winLeg()
      return this.state
    }
    else if (newScore === 1 && this.state.checkout === 'double_out') {
      // Can't finish on 1 with double-out (need at least D1=2)
      this._bust(turn, dart)
      return this.state
    }
    else {
      // Normal throw
      turn.throws.push(dart)
      player.score = newScore
    }

    // Auto-complete turn after 3 darts (if not busted/won)
    if (turnIsComplete(turn) && !this.state.is_finished) {
      this._endTurn()
    }

    return this.state
  }

  undoThrow(): GameState {
    if (this.state.is_finished)
      return this.state

    const turn = this.state.current_turn
    const player = this.state.players[this.state.current_player_index]!

    if (turn.throws.length > 0) {
      // Undo last throw in current turn
      const last = turn.throws.pop()!
      if (turn.busted) {
        turn.busted = false
        player.score = this.state.score_before_turn!
      }
      else {
        player.score += throwPoints(last)
      }
    }
    else if (this.state.turn_history.length > 0) {
      // Go back to previous player's turn
      const prevTurn = this.state.turn_history.pop()!
      const prevPlayer = this.state.players[prevTurn.player_index]!

      // Remove the completed turn from that player's turns
      if (prevPlayer.turns.length > 0) {
        prevPlayer.turns.pop()
      }

      // Use stored score_before to restore accurately
      const scoreAtTurnStart = prevTurn.score_before ?? this._recomputeScore(prevTurn.player_index)

      if (prevTurn.visitScore !== undefined) {
        // Visit-score turn: undo the entire turn at once — restore to empty turn
        prevTurn.visitScore = undefined
        prevTurn.busted = false
        prevPlayer.score = scoreAtTurnStart
      }
      else {
        // Per-dart turn: remove last throw
        prevTurn.throws.pop()
        if (prevTurn.busted) {
          prevTurn.busted = false
          prevPlayer.score = scoreAtTurnStart
        }
        else {
          // Recompute score: start + points from remaining throws
          const totalRemaining = prevTurn.throws.reduce((sum, t) => sum + throwPoints(t), 0)
          prevPlayer.score = scoreAtTurnStart - totalRemaining
        }
      }

      // Switch back to previous player
      this.state.current_player_index = prevTurn.player_index
      this.state.current_turn = prevTurn
      this.state.score_before_turn = scoreAtTurnStart
    }

    return this.state
  }

  manualScore(segment: number, multiplier: Multiplier): GameState {
    const dart: ThrowResult = { segment, multiplier }
    return this.throw(dart)
  }

  applyVisitScore(score: number): GameState {
    if (this.state.is_finished)
      return this.state

    const turn = this.state.current_turn
    // Reject if mid-turn (already has per-dart throws)
    if (turn.throws.length > 0)
      return this.state

    if (!isAchievableScore(score))
      return this.state

    const player = this.state.players[this.state.current_player_index]!
    const result = validateVisitScore(score, player.score, this.state.checkout)

    switch (result) {
      case 'invalid_score':
        return this.state
      case 'bust':
      case 'invalid_checkout': {
        turn.visitScore = score
        turn.busted = true
        player.score = this.state.score_before_turn!
        this._endTurn()
        return this.state
      }
      case 'checkout': {
        turn.visitScore = score
        player.score = 0
        this._winLeg()
        return this.state
      }
      case 'valid': {
        turn.visitScore = score
        player.score -= score
        this._endTurn()
        return this.state
      }
    }
  }

  private _bust(turn: Turn, dart: ThrowResult): void {
    turn.throws.push(dart)
    turn.busted = true
    const player = this.state.players[this.state.current_player_index]!
    player.score = this.state.score_before_turn!
    this._endTurn()
  }

  private _endTurn(): void {
    const turn = this.state.current_turn
    turn.score_before = this.state.score_before_turn
    const player = this.state.players[this.state.current_player_index]!
    player.turns.push(turn)
    this.state.turn_history.push(turn)

    // Switch player
    const nextIdx = (this.state.current_player_index + 1) % this.state.players.length
    this.state.current_player_index = nextIdx
    const nextScore = this.state.players[nextIdx]!.score
    this.state.current_turn = { player_index: nextIdx, throws: [], busted: false, score_before: nextScore }
    this.state.score_before_turn = nextScore
  }

  private _winLeg(): void {
    const state = this.state
    const idx = state.current_player_index
    const player = state.players[idx]!

    player.legs_won += 1
    state.current_set_legs[idx] = (state.current_set_legs[idx] ?? 0) + 1

    // Record the winning turn
    const turn = state.current_turn
    turn.score_before = state.score_before_turn
    player.turns.push(turn)
    state.turn_history.push(turn)

    if (state.current_set_legs[idx]! >= state.legs_to_win) {
      this._winSet()
    }
    else {
      this._startLeg()
    }
  }

  private _winSet(): void {
    const state = this.state
    const idx = state.current_player_index
    const player = state.players[idx]!

    player.sets_won += 1
    state.sets_won[idx] = (state.sets_won[idx] ?? 0) + 1

    if (state.sets_won[idx]! >= state.sets_to_win) {
      this._finishGame()
    }
    else {
      // Reset leg counters for new set
      state.current_set_legs = Array.from({ length: state.players.length }).fill(0)
      for (const p of state.players) {
        p.legs_won = 0
      }
      this._startLeg()
    }
  }

  private _startLeg(): void {
    const state = this.state
    const starting = Number.parseInt(state.mode, 10)

    for (const p of state.players) {
      p.score = starting
      p.turns = []
    }

    state.turn_history = []

    // Alternate who throws first
    state.leg_starting_player = (state.leg_starting_player + 1) % state.players.length
    const nextIdx = state.leg_starting_player
    state.current_player_index = nextIdx
    state.current_turn = { player_index: nextIdx, throws: [], busted: false, score_before: starting }
    state.score_before_turn = starting
  }

  private _finishGame(): void {
    this.state.is_finished = true
    this.state.winner_index = this.state.current_player_index
  }

  private _recomputeScore(playerIndex: number): number {
    const starting = Number.parseInt(this.state.mode, 10)
    const player = this.state.players[playerIndex]!
    const scored = player.turns.reduce(
      (sum, t) => sum + turnTotalPoints(t),
      0,
    )
    return starting - scored
  }
}
