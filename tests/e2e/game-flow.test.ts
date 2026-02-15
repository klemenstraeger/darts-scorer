import { describe, it, expect } from 'vitest'
import { GameEngine } from '../../shared/game-engine'
import { GameEvent, detectThrowEvent } from '../../shared/game-events'
import type { GameState, ThrowResult } from '../../shared/game-models'
import {
  create501Game,
  create301Game,
  throwDarts,
  throwMissTurn,
  T20, T19, T17, T15,
  D20, D25, D12, D16, D1, D10,
  S20, S19, S1, S5, S10, S25,
  MISS,
} from '../helpers/darts'

/** Throw and return the event */
function throwAndDetect(engine: GameEngine, dart: ThrowResult) {
  const prevTurnCount = engine.state.turn_history.length
  const prevLegs = engine.state.players.map(p => p.legs_won)
  const prevSets = [...engine.state.sets_won]
  engine.throw(dart)
  return detectThrowEvent(prevTurnCount, prevLegs, prevSets, engine.state)
}

// ── 9-darter ──

describe('9-darter scenario', () => {
  it('completes a perfect 9-dart game with correct events', () => {
    const engine = create501Game()

    // Alice: Turn 1 — T20, T20, T20 (180, score: 321)
    expect(throwAndDetect(engine, T20)).toBe(GameEvent.DART_SCORED)
    expect(throwAndDetect(engine, T20)).toBe(GameEvent.DART_SCORED)
    expect(throwAndDetect(engine, T20)).toBe(GameEvent.DART_SCORED)
    expect(engine.state.players[0]!.score).toBe(321)

    // Bob: Turn 1 — miss miss miss
    throwMissTurn(engine)

    // Alice: Turn 2 — T20, T20, T20 (180, score: 141)
    expect(throwAndDetect(engine, T20)).toBe(GameEvent.DART_SCORED)
    expect(throwAndDetect(engine, T20)).toBe(GameEvent.DART_SCORED)
    expect(throwAndDetect(engine, T20)).toBe(GameEvent.DART_SCORED)
    expect(engine.state.players[0]!.score).toBe(141)

    // Bob: Turn 2 — miss miss miss
    throwMissTurn(engine)

    // Alice: Turn 3 — T20 (60→81), T19 (57→24), D12 (24→0) CHECKOUT
    expect(throwAndDetect(engine, T20)).toBe(GameEvent.DART_SCORED)
    expect(throwAndDetect(engine, T19)).toBe(GameEvent.DART_SCORED)
    expect(engine.state.players[0]!.score).toBe(24)
    expect(throwAndDetect(engine, D12)).toBe(GameEvent.GAME_OVER)

    expect(engine.state.is_finished).toBe(true)
    expect(engine.state.winner_index).toBe(0)
    expect(engine.state.players[0]!.score).toBe(0)
  })
})

// ── Multi-leg (best of 3) ──

describe('Multi-leg game (best of 3)', () => {
  it('plays through 2 legs with alternating starts', () => {
    const engine = create501Game(['Alice', 'Bob'], 2)

    // === Leg 1: Alice wins ===
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40

    const event1 = throwAndDetect(engine, D20)
    expect(event1).toBe(GameEvent.LEG_WON)
    expect(engine.state.is_finished).toBe(false)
    expect(engine.state.players[0]!.legs_won).toBe(1)

    // Scores reset, Bob starts leg 2
    expect(engine.state.players[0]!.score).toBe(501)
    expect(engine.state.players[1]!.score).toBe(501)
    expect(engine.state.current_player_index).toBe(1)

    // === Leg 2: Alice wins ===
    throwMissTurn(engine) // Bob misses
    // Alice's turn
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40

    const event2 = throwAndDetect(engine, D20)
    expect(event2).toBe(GameEvent.GAME_OVER)
    expect(engine.state.is_finished).toBe(true)
    expect(engine.state.winner_index).toBe(0)
  })
})

// ── Multi-set ──

describe('Multi-set game (best of 3 sets x 1 leg)', () => {
  it('progresses through sets to game over', () => {
    const engine = create501Game(['Alice', 'Bob'], 1, 2) // 1 leg/set, 2 sets to win

    // === Set 1: Alice wins ===
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40
    const e1 = throwAndDetect(engine, D20)
    expect(e1).toBe(GameEvent.LEG_WON) // set won, not game over
    expect(engine.state.sets_won[0]).toBe(1)

    // === Set 2: Alice wins ===
    throwMissTurn(engine) // Bob
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40
    const e2 = throwAndDetect(engine, D20)
    expect(e2).toBe(GameEvent.GAME_OVER)
    expect(engine.state.sets_won[0]).toBe(2)
  })
})

// ── Bust recovery ──

describe('Bust recovery', () => {
  it('busts mid-turn, score restored, player switches', () => {
    const engine = create501Game()

    // Alice throws T20 (60), then busts
    engine.throw(T20)
    expect(engine.state.players[0]!.score).toBe(441)

    // Manually set score low to cause bust on next dart
    engine.state.players[0]!.score = 5
    engine.state.score_before_turn = 5
    // Note: score_before_turn should be set but engine already stored 501,
    // so let's use a fresh approach

    // Better approach: set up a clean bust scenario
    const engine2 = create501Game()
    engine2.state.players[0]!.score = 61
    engine2.state.score_before_turn = 61
    engine2.state.current_turn.score_before = 61

    engine2.throw(T20) // 61 - 60 = 1, but double_out means can't finish on 1 → bust
    expect(engine2.state.players[0]!.score).toBe(61) // restored
    expect(engine2.state.current_player_index).toBe(1) // Bob's turn

    // Bob throws, misses
    throwMissTurn(engine2)

    // Alice still at 61
    expect(engine2.state.current_player_index).toBe(0)
    expect(engine2.state.players[0]!.score).toBe(61)
  })
})

// ── Undo across turns ──

describe('Undo across turns', () => {
  it('undoes from Bob back through Alice throws', () => {
    const engine = create501Game()

    // Alice: T20, T20, T20 (180, score: 321) → turn ends
    throwDarts(engine, [T20, T20, T20])
    expect(engine.state.current_player_index).toBe(1) // Bob

    // Bob: throw one dart
    engine.throw(S20)
    expect(engine.state.players[1]!.score).toBe(481)

    // Undo Bob's throw
    engine.undoThrow()
    expect(engine.state.players[1]!.score).toBe(501)
    expect(engine.state.current_player_index).toBe(1)

    // Undo into Alice's completed turn
    engine.undoThrow()
    expect(engine.state.current_player_index).toBe(0)
    expect(engine.state.current_turn.throws).toHaveLength(2)
    expect(engine.state.players[0]!.score).toBe(381) // 501 - 120

    // Undo one more Alice throw
    engine.undoThrow()
    expect(engine.state.current_turn.throws).toHaveLength(1)
    expect(engine.state.players[0]!.score).toBe(441) // 501 - 60

    // Undo Alice's first throw
    engine.undoThrow()
    expect(engine.state.current_turn.throws).toHaveLength(0)
    expect(engine.state.players[0]!.score).toBe(501)
  })
})

// ── 301 single-out ──

describe('301 single-out game', () => {
  it('checkout with S19, score=1 not bust', () => {
    const engine = create301Game()

    // Get to score 20
    engine.state.players[0]!.score = 20
    engine.state.score_before_turn = 20
    engine.state.current_turn.score_before = 20

    // S19 → score = 1 (not bust in single out)
    engine.throw(S19)
    expect(engine.state.players[0]!.score).toBe(1)
    expect(engine.state.current_turn.busted).toBe(false)

    // S1 → score = 0, checkout!
    engine.throw(S1)
    expect(engine.state.players[0]!.score).toBe(0)
    expect(engine.state.is_finished).toBe(true)
  })
})

// ── 4-player rotation ──

describe('4-player rotation', () => {
  it('cycles through all 4 players correctly', () => {
    const engine = create501Game(['A', 'B', 'C', 'D'])

    // A's turn
    expect(engine.state.current_player_index).toBe(0)
    engine.throw(T20)
    engine.throw(T20)
    engine.throw(T20)
    expect(engine.state.players[0]!.score).toBe(321)

    // B's turn
    expect(engine.state.current_player_index).toBe(1)
    engine.throw(T19)
    engine.throw(T19)
    engine.throw(T19)
    expect(engine.state.players[1]!.score).toBe(330)

    // C's turn
    expect(engine.state.current_player_index).toBe(2)
    throwMissTurn(engine)
    expect(engine.state.players[2]!.score).toBe(501)

    // D's turn
    expect(engine.state.current_player_index).toBe(3)
    engine.throw(S20)
    engine.throw(S20)
    engine.throw(S20)
    expect(engine.state.players[3]!.score).toBe(441)

    // Back to A
    expect(engine.state.current_player_index).toBe(0)

    // Scores should only affect the correct player
    expect(engine.state.players[0]!.score).toBe(321) // only A's throws
    expect(engine.state.players[1]!.score).toBe(330) // only B's throws
    expect(engine.state.players[2]!.score).toBe(501) // C missed all
    expect(engine.state.players[3]!.score).toBe(441) // only D's throws
  })
})

// ── Edge: Double bull checkout ──

describe('Double bull checkout', () => {
  it('D25 at 50 finishes the game', () => {
    const engine = create501Game()
    engine.state.players[0]!.score = 50
    engine.state.score_before_turn = 50
    engine.state.current_turn.score_before = 50
    engine.throw(D25)
    expect(engine.state.is_finished).toBe(true)
    expect(engine.state.winner_index).toBe(0)
  })
})

// ── Edge: Bust on exactly score = 0 with triple ──

describe('Bust on zero with wrong multiplier', () => {
  it('T20 at 60 busts (not double)', () => {
    const engine = create501Game()
    engine.state.players[0]!.score = 60
    engine.state.score_before_turn = 60
    engine.state.current_turn.score_before = 60
    engine.throw(T20) // 60 - 60 = 0 but triple
    expect(engine.state.players[0]!.score).toBe(60) // restored
    expect(engine.state.current_player_index).toBe(1) // busted, turn ended
  })
})
