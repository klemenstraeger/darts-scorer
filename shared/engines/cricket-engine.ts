/**
 * Cricket game engine.
 *
 * Rules:
 * - Targets: 20, 19, 18, 17, 16, 15, Bull (25)
 * - Hit a target: multiplier adds that many marks (triple = 3 marks)
 * - 3+ marks = "closed" that target
 * - Hitting a closed target scores points ONLY if at least one opponent hasn't closed it
 * - Points = face value x excess marks (marks above 3)
 * - Win condition: all 7 targets closed AND score >= all opponents
 * - No bust concept in Cricket
 * - Bull: segment 25, single (mult 1) = 1 mark worth 25pts, double (mult 2) = 2 marks worth 50pts
 */

import type {
  CheckoutMode,
  CricketPlayerState,
  CricketState,
  GameMode,
  GameState,
  Multiplier,
  Player,
  PlayerDescriptor,
  ThrowResult,
  Turn,
} from '../game-models'
import { CRICKET_TARGETS, createDefaultGameState, turnIsComplete } from '../game-models'
import type { IGameEngine } from './engine-interface'

function createCricketPlayerState(): CricketPlayerState {
  const marks: Record<number, number> = {}
  for (const t of CRICKET_TARGETS) {
    marks[t] = 0
  }
  return { marks, cricket_score: 0 }
}

function cloneCricketState(cs: CricketState): CricketState {
  return {
    player_states: cs.player_states.map(ps => ({
      marks: { ...ps.marks },
      cricket_score: ps.cricket_score,
    })),
  }
}

function isCricketTarget(segment: number): boolean {
  return (CRICKET_TARGETS as readonly number[]).includes(segment)
}

export class CricketEngine implements IGameEngine {
  state: GameState

  constructor(state?: GameState) {
    this.state = state ?? createDefaultGameState()
  }

  newGame(
    _mode: GameMode = 'cricket',
    playerDescriptors?: PlayerDescriptor[] | string[],
    _checkout: CheckoutMode = 'double_out',
    legsToWin: number = 1,
    setsToWin: number = 1,
  ): GameState {
    const descriptors: PlayerDescriptor[] = (playerDescriptors ?? [{ name: 'Player 1' }, { name: 'Player 2' }])
      .map(d => typeof d === 'string' ? { name: d } : d)
    const numPlayers = descriptors.length

    this.state = {
      mode: 'cricket',
      checkout: 'double_out', // Not used for cricket but keep for compatibility
      legs_to_win: legsToWin,
      sets_to_win: setsToWin,
      players: descriptors.map((d): Player => ({
        name: d.name,
        score: 0, // Cricket scores go up from 0
        legs_won: 0,
        sets_won: 0,
        turns: [],
        ...(d.isBot ? { isBot: true, botDifficulty: d.botDifficulty } : {}),
      })),
      current_player_index: 0,
      current_turn: { player_index: 0, throws: [], busted: false, score_before: 0 },
      is_finished: false,
      winner_index: null,
      turn_history: [],
      score_before_turn: 0,
      current_set_legs: new Array(numPlayers).fill(0),
      sets_won: new Array(numPlayers).fill(0),
      leg_starting_player: 0,
      cricket: {
        player_states: descriptors.map(() => createCricketPlayerState()),
      },
    }

    return this.state
  }

  stopGame(): GameState {
    this.state = createDefaultGameState()
    return this.state
  }

  throw(dart: ThrowResult): GameState {
    if (this.state.is_finished) return this.state
    if (!this.state.cricket) return this.state

    const turn = this.state.current_turn
    if (turnIsComplete(turn)) return this.state

    const playerIdx = this.state.current_player_index
    const cricketState = this.state.cricket.player_states[playerIdx]!

    // Snapshot marks before this throw (for undo) — only on first dart of turn
    if (turn.throws.length === 0 && !turn.marks_before) {
      turn.marks_before = { ...cricketState.marks }
      turn.score_before = cricketState.cricket_score
    }

    // Process the throw
    turn.throws.push(dart)

    if (isCricketTarget(dart.segment)) {
      const segment = dart.segment
      const currentMarks = cricketState.marks[segment] ?? 0
      const newMarks = currentMarks + dart.multiplier

      // Check if all opponents have closed this target
      const opponentsClosed = this.state.players.every((_, i) => {
        if (i === playerIdx) return true
        return (this.state.cricket!.player_states[i]!.marks[segment] ?? 0) >= 3
      })

      if (currentMarks < 3) {
        // Still need marks to close
        const marksToClose = 3 - currentMarks
        const excessMarks = Math.max(0, dart.multiplier - marksToClose)
        cricketState.marks[segment] = Math.min(newMarks, 3 + (opponentsClosed ? 0 : excessMarks))

        // Score points for excess marks only if opponents haven't all closed
        if (excessMarks > 0 && !opponentsClosed) {
          const pointsPerMark = segment // face value (25 for bull)
          const scoredPoints = excessMarks * pointsPerMark
          cricketState.cricket_score += scoredPoints
          this.state.players[playerIdx]!.score += scoredPoints
        }

        // Update marks to actual total (at least 3 if we had excess)
        cricketState.marks[segment] = Math.max(currentMarks + dart.multiplier, cricketState.marks[segment]!)
        // Cap display marks: we track them as raw total for undo accuracy
        // but logically >= 3 means closed
      } else {
        // Already closed by this player — score points if opponents haven't all closed
        if (!opponentsClosed) {
          const pointsPerMark = segment
          const scoredPoints = dart.multiplier * pointsPerMark
          cricketState.cricket_score += scoredPoints
          this.state.players[playerIdx]!.score += scoredPoints
        }
        cricketState.marks[segment] = newMarks
      }

      // Check win condition after each dart
      if (this._checkWin(playerIdx)) {
        this._winLeg()
        return this.state
      }
    }

    // Auto-complete turn after 3 darts
    if (turnIsComplete(turn) && !this.state.is_finished) {
      this._endTurn()
    }

    return this.state
  }

  undoThrow(): GameState {
    if (this.state.is_finished) return this.state
    if (!this.state.cricket) return this.state

    const turn = this.state.current_turn
    const playerIdx = this.state.current_player_index

    if (turn.throws.length > 0) {
      // Undo last throw in current turn
      turn.throws.pop()

      // Restore entire cricket state from marks_before snapshot
      // This is simpler and more reliable than trying to reverse individual throws
      if (turn.marks_before !== undefined && turn.score_before !== null) {
        const cricketPs = this.state.cricket.player_states[playerIdx]!
        // Restore marks from snapshot
        cricketPs.marks = { ...turn.marks_before }
        cricketPs.cricket_score = turn.score_before
        this.state.players[playerIdx]!.score = turn.score_before

        // Re-apply remaining throws
        for (const remainingDart of turn.throws) {
          this._applyCricketThrow(playerIdx, remainingDart)
        }
      }
    } else if (this.state.turn_history.length > 0) {
      // Go back to previous player's turn
      const prevTurn = this.state.turn_history.pop()!
      const prevPlayerIdx = prevTurn.player_index
      const prevPlayer = this.state.players[prevPlayerIdx]!

      // Remove the completed turn from that player's turns
      if (prevPlayer.turns.length > 0) {
        prevPlayer.turns.pop()
      }

      // Restore cricket state from the turn's marks_before
      if (prevTurn.marks_before !== undefined && prevTurn.score_before !== null) {
        const cricketPs = this.state.cricket.player_states[prevPlayerIdx]!
        cricketPs.marks = { ...prevTurn.marks_before }
        cricketPs.cricket_score = prevTurn.score_before
        prevPlayer.score = prevTurn.score_before
      }

      // Remove last throw from the turn
      prevTurn.throws.pop()

      // Re-apply remaining throws
      if (prevTurn.marks_before !== undefined && prevTurn.score_before !== null) {
        for (const remainingDart of prevTurn.throws) {
          this._applyCricketThrow(prevPlayerIdx, remainingDart)
        }
      }

      // Switch back to previous player
      this.state.current_player_index = prevPlayerIdx
      this.state.current_turn = prevTurn
      this.state.score_before_turn = prevTurn.score_before ?? 0
    }

    return this.state
  }

  manualScore(segment: number, multiplier: Multiplier): GameState {
    const dart: ThrowResult = { segment, multiplier }
    return this.throw(dart)
  }

  /** Apply a single cricket throw's scoring effect without pushing to throws array */
  private _applyCricketThrow(playerIdx: number, dart: ThrowResult): void {
    if (!this.state.cricket) return
    if (!isCricketTarget(dart.segment)) return

    const cricketPs = this.state.cricket.player_states[playerIdx]!
    const segment = dart.segment
    const currentMarks = cricketPs.marks[segment] ?? 0

    const opponentsClosed = this.state.players.every((_, i) => {
      if (i === playerIdx) return true
      return (this.state.cricket!.player_states[i]!.marks[segment] ?? 0) >= 3
    })

    const newMarks = currentMarks + dart.multiplier
    cricketPs.marks[segment] = newMarks

    if (currentMarks < 3) {
      const marksToClose = 3 - currentMarks
      const excessMarks = Math.max(0, dart.multiplier - marksToClose)
      if (excessMarks > 0 && !opponentsClosed) {
        const scoredPoints = excessMarks * segment
        cricketPs.cricket_score += scoredPoints
        this.state.players[playerIdx]!.score += scoredPoints
      }
    } else {
      if (!opponentsClosed) {
        const scoredPoints = dart.multiplier * segment
        cricketPs.cricket_score += scoredPoints
        this.state.players[playerIdx]!.score += scoredPoints
      }
    }
  }

  /** Check if a player has won: all targets closed AND score >= all opponents */
  private _checkWin(playerIdx: number): boolean {
    if (!this.state.cricket) return false

    const ps = this.state.cricket.player_states[playerIdx]!

    // Check all targets are closed (>= 3 marks)
    const allClosed = CRICKET_TARGETS.every(t => (ps.marks[t] ?? 0) >= 3)
    if (!allClosed) return false

    // Check score >= all opponents
    const myScore = ps.cricket_score
    const beaten = this.state.players.every((_, i) => {
      if (i === playerIdx) return true
      return myScore >= this.state.cricket!.player_states[i]!.cricket_score
    })

    return beaten
  }

  private _endTurn(): void {
    const turn = this.state.current_turn
    // score_before and marks_before already set on first throw
    const player = this.state.players[this.state.current_player_index]!
    player.turns.push(turn)
    this.state.turn_history.push(turn)

    // Switch player
    const nextIdx = (this.state.current_player_index + 1) % this.state.players.length
    this.state.current_player_index = nextIdx
    const nextCricketScore = this.state.cricket
      ? this.state.cricket.player_states[nextIdx]!.cricket_score
      : 0
    this.state.current_turn = {
      player_index: nextIdx,
      throws: [],
      busted: false,
      score_before: nextCricketScore,
    }
    this.state.score_before_turn = nextCricketScore
  }

  private _winLeg(): void {
    const state = this.state
    const idx = state.current_player_index
    const player = state.players[idx]!

    player.legs_won += 1
    state.current_set_legs[idx] = (state.current_set_legs[idx] ?? 0) + 1

    // Record the winning turn
    const turn = state.current_turn
    player.turns.push(turn)
    state.turn_history.push(turn)

    if (state.current_set_legs[idx]! >= state.legs_to_win) {
      this._winSet()
    } else {
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
    } else {
      // Reset leg counters for new set
      state.current_set_legs = new Array(state.players.length).fill(0)
      for (const p of state.players) {
        p.legs_won = 0
      }
      this._startLeg()
    }
  }

  private _startLeg(): void {
    const state = this.state

    for (const p of state.players) {
      p.score = 0
      p.turns = []
    }

    state.turn_history = []

    // Reset cricket state
    if (state.cricket) {
      state.cricket.player_states = state.players.map(() => createCricketPlayerState())
    }

    // Alternate who throws first
    state.leg_starting_player = (state.leg_starting_player + 1) % state.players.length
    const nextIdx = state.leg_starting_player
    state.current_player_index = nextIdx
    state.current_turn = { player_index: nextIdx, throws: [], busted: false, score_before: 0 }
    state.score_before_turn = 0
  }

  private _finishGame(): void {
    this.state.is_finished = true
    this.state.winner_index = this.state.current_player_index
  }
}
