import { beforeEach, describe, expect, it } from 'vitest'
import { GameEngine } from '../../shared/game-engine'
import {
  create301Game,
  create501Game,
  D1,
  D20,
  D25,
  MISS,
  S1,
  S19,
  S20,
  S25,
  T19,
  T20,
  throwDarts,
  throwMissTurn,
} from '../helpers/darts'

// ── Initialization ──

describe('gameEngine initialization', () => {
  it('creates 501 game with correct starting scores', () => {
    const engine = create501Game()
    expect(engine.state.mode).toBe('501')
    expect(engine.state.players[0]!.score).toBe(501)
    expect(engine.state.players[1]!.score).toBe(501)
  })

  it('creates 301 game', () => {
    const engine = create301Game()
    expect(engine.state.mode).toBe('301')
    expect(engine.state.players[0]!.score).toBe(301)
  })

  it('uses custom player names', () => {
    const engine = create501Game(['X', 'Y', 'Z'])
    expect(engine.state.players).toHaveLength(3)
    expect(engine.state.players[0]!.name).toBe('X')
    expect(engine.state.players[2]!.name).toBe('Z')
  })

  it('sets checkout mode', () => {
    const engine = create501Game()
    expect(engine.state.checkout).toBe('double_out')
    const engine2 = create301Game()
    expect(engine2.state.checkout).toBe('single_out')
  })

  it('tracks legs and sets config', () => {
    const engine = create501Game(['A', 'B'], 3, 2)
    expect(engine.state.legs_to_win).toBe(3)
    expect(engine.state.sets_to_win).toBe(2)
  })

  it('sets score_before on initial turn', () => {
    const engine = create501Game()
    expect(engine.state.score_before_turn).toBe(501)
    expect(engine.state.current_turn.score_before).toBe(501)
  })

  it('initializes current_set_legs and sets_won arrays', () => {
    const engine = create501Game(['A', 'B', 'C'])
    expect(engine.state.current_set_legs).toEqual([0, 0, 0])
    expect(engine.state.sets_won).toEqual([0, 0, 0])
  })

  it('constructs from existing state', () => {
    const engine = create501Game()
    engine.throw(T20)
    const engine2 = new GameEngine(engine.state)
    expect(engine2.state.players[0]!.score).toBe(441)
  })
})

// ── Scoring ──

describe('gameEngine scoring', () => {
  let engine: GameEngine

  beforeEach(() => {
    engine = create501Game()
  })

  it('decrements score on throw', () => {
    engine.throw(T20) // 60 points
    expect(engine.state.players[0]!.score).toBe(441)
  })

  it('records throw in current turn', () => {
    engine.throw(T20)
    expect(engine.state.current_turn.throws).toHaveLength(1)
    expect(engine.state.current_turn.throws[0]).toEqual(T20)
  })

  it('handles miss correctly', () => {
    engine.throw(MISS)
    expect(engine.state.players[0]!.score).toBe(501)
    expect(engine.state.current_turn.throws).toHaveLength(1)
  })

  it('handles bull correctly', () => {
    engine.throw(S25)
    expect(engine.state.players[0]!.score).toBe(476)
  })

  it('handles triple correctly', () => {
    engine.throw(T19) // 57
    expect(engine.state.players[0]!.score).toBe(444)
  })

  it('no-op when game finished', () => {
    engine.state.is_finished = true
    engine.throw(T20)
    expect(engine.state.players[0]!.score).toBe(501)
  })

  it('no-op when turn already complete', () => {
    throwDarts(engine, [T20, T20, T20]) // turn complete, switches player
    // Now it's Bob's turn — Alice still at 501 - 180 = 321
    expect(engine.state.players[0]!.score).toBe(321)
    expect(engine.state.current_player_index).toBe(1)
  })
})

// ── Turn Completion & Rotation ──

describe('turn completion & rotation', () => {
  it('auto-completes turn after 3 darts', () => {
    const engine = create501Game()
    throwDarts(engine, [T20, T20, T20])
    expect(engine.state.current_player_index).toBe(1)
    expect(engine.state.players[0]!.turns).toHaveLength(1)
  })

  it('stores score_before in completed turn', () => {
    const engine = create501Game()
    throwDarts(engine, [T20, T20, T20])
    const turn = engine.state.players[0]!.turns[0]!
    expect(turn.score_before).toBe(501)
  })

  it('rotates through 3+ players', () => {
    const engine = create501Game(['A', 'B', 'C'])
    expect(engine.state.current_player_index).toBe(0)
    throwMissTurn(engine) // A
    expect(engine.state.current_player_index).toBe(1)
    throwMissTurn(engine) // B
    expect(engine.state.current_player_index).toBe(2)
    throwMissTurn(engine) // C
    expect(engine.state.current_player_index).toBe(0) // back to A
  })

  it('sets up new turn correctly after completion', () => {
    const engine = create501Game()
    throwDarts(engine, [T20, T20, T20])
    expect(engine.state.current_turn.player_index).toBe(1)
    expect(engine.state.current_turn.throws).toEqual([])
    expect(engine.state.current_turn.busted).toBe(false)
    expect(engine.state.score_before_turn).toBe(501) // Bob's starting score
  })
})

// ── Bust (double-out) ──

describe('bust conditions (double-out)', () => {
  it('busts when score goes below 0', () => {
    const engine = create501Game()
    // Set Alice to 10, then throw T20 (60)
    engine.state.players[0]!.score = 10
    engine.state.score_before_turn = 10
    engine.state.current_turn.score_before = 10
    engine.throw(T20)
    expect(engine.state.players[0]!.score).toBe(10) // restored
    expect(engine.state.current_player_index).toBe(1) // turn ended
  })

  it('busts when score = 0 but non-double', () => {
    const engine = create501Game()
    engine.state.players[0]!.score = 20
    engine.state.score_before_turn = 20
    engine.state.current_turn.score_before = 20
    engine.throw(S20) // 20 - 20 = 0 but single, not double
    expect(engine.state.players[0]!.score).toBe(20) // restored
  })

  it('busts when score = 1 (impossible to checkout with double)', () => {
    const engine = create501Game()
    engine.state.players[0]!.score = 2
    engine.state.score_before_turn = 2
    engine.state.current_turn.score_before = 2
    engine.throw(S1) // 2 - 1 = 1, can't finish
    expect(engine.state.players[0]!.score).toBe(2) // restored
  })

  it('records bust dart in the turn', () => {
    const engine = create501Game()
    engine.state.players[0]!.score = 10
    engine.state.score_before_turn = 10
    engine.state.current_turn.score_before = 10
    engine.throw(T20)
    // The bust turn should be in history now
    const bustTurn = engine.state.turn_history[engine.state.turn_history.length - 1]!
    expect(bustTurn.busted).toBe(true)
    expect(bustTurn.throws).toHaveLength(1)
    expect(bustTurn.throws[0]).toEqual(T20)
  })

  it('busts on 2nd dart restoring score', () => {
    const engine = create501Game()
    engine.state.players[0]!.score = 80
    engine.state.score_before_turn = 80
    engine.state.current_turn.score_before = 80
    engine.throw(T20) // 80 - 60 = 20
    engine.throw(T20) // 20 - 60 = -40, bust!
    expect(engine.state.players[0]!.score).toBe(80) // restored to score_before_turn
  })

  it('busts on 3rd dart', () => {
    const engine = create501Game()
    engine.state.players[0]!.score = 100
    engine.state.score_before_turn = 100
    engine.state.current_turn.score_before = 100
    engine.throw(S20) // 80
    engine.throw(S20) // 60
    engine.throw(T20) // 60 - 60 = 0 but triple, bust!
    expect(engine.state.players[0]!.score).toBe(100)
  })
})

// ── Bust (single-out) ──

describe('bust conditions (single-out)', () => {
  it('score = 0 with single is NOT bust', () => {
    const engine = create301Game()
    engine.state.players[0]!.score = 20
    engine.state.score_before_turn = 20
    engine.state.current_turn.score_before = 20
    engine.throw(S20)
    expect(engine.state.players[0]!.score).toBe(0)
    expect(engine.state.is_finished).toBe(true)
  })

  it('score = 1 is NOT bust', () => {
    const engine = create301Game()
    engine.state.players[0]!.score = 2
    engine.state.score_before_turn = 2
    engine.state.current_turn.score_before = 2
    engine.throw(S1) // 2 - 1 = 1
    expect(engine.state.players[0]!.score).toBe(1)
    expect(engine.state.current_turn.busted).toBe(false)
  })
})

// ── Checkout ──

describe('checkout', () => {
  it('d20 at 40 wins (double-out)', () => {
    const engine = create501Game()
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40
    engine.throw(D20)
    expect(engine.state.players[0]!.score).toBe(0)
    expect(engine.state.is_finished).toBe(true)
    expect(engine.state.winner_index).toBe(0)
  })

  it('d25 (bull) at 50 wins', () => {
    const engine = create501Game()
    engine.state.players[0]!.score = 50
    engine.state.score_before_turn = 50
    engine.state.current_turn.score_before = 50
    engine.throw(D25)
    expect(engine.state.players[0]!.score).toBe(0)
    expect(engine.state.is_finished).toBe(true)
  })

  it('d1 at 2 wins', () => {
    const engine = create501Game()
    engine.state.players[0]!.score = 2
    engine.state.score_before_turn = 2
    engine.state.current_turn.score_before = 2
    engine.throw(D1)
    expect(engine.state.players[0]!.score).toBe(0)
    expect(engine.state.is_finished).toBe(true)
  })

  it('checkout on 2nd dart', () => {
    const engine = create501Game()
    engine.state.players[0]!.score = 80
    engine.state.score_before_turn = 80
    engine.state.current_turn.score_before = 80
    engine.throw(D20) // 80 - 40 = 40
    engine.throw(D20) // 40 - 40 = 0, double!
    expect(engine.state.players[0]!.score).toBe(0)
    expect(engine.state.is_finished).toBe(true)
  })

  it('single-out checkout with S19', () => {
    const engine = create301Game()
    engine.state.players[0]!.score = 19
    engine.state.score_before_turn = 19
    engine.state.current_turn.score_before = 19
    engine.throw(S19)
    expect(engine.state.players[0]!.score).toBe(0)
    expect(engine.state.is_finished).toBe(true)
  })
})

// ── Multi-leg ──

describe('multi-leg', () => {
  it('new leg starts after win', () => {
    const engine = create501Game(['Alice', 'Bob'], 2)
    // Alice wins leg 1
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40
    engine.throw(D20)

    // New leg should start
    expect(engine.state.is_finished).toBe(false)
    expect(engine.state.players[0]!.score).toBe(501)
    expect(engine.state.players[1]!.score).toBe(501)
    expect(engine.state.players[0]!.legs_won).toBe(1)
  })

  it('alternates starting player', () => {
    const engine = create501Game(['Alice', 'Bob'], 2)
    // Alice wins leg 1
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40
    engine.throw(D20)

    // Bob should start leg 2
    expect(engine.state.current_player_index).toBe(1)
    expect(engine.state.leg_starting_player).toBe(1)
  })

  it('finishes game when legs_to_win reached', () => {
    const engine = create501Game(['Alice', 'Bob'], 2)

    // Alice wins leg 1
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40
    engine.throw(D20)

    // Bob starts leg 2, misses, Alice gets turn
    throwMissTurn(engine)

    // Alice wins leg 2
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40
    engine.throw(D20)

    expect(engine.state.is_finished).toBe(true)
    expect(engine.state.winner_index).toBe(0)
  })

  it('clears turn history on new leg', () => {
    const engine = create501Game(['Alice', 'Bob'], 2)
    throwMissTurn(engine) // build some history
    throwMissTurn(engine)

    // Alice wins leg 1
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40
    engine.throw(D20)

    expect(engine.state.turn_history).toEqual([])
  })
})

// ── Multi-set ──

describe('multi-set', () => {
  it('sets_won increments when set is won', () => {
    const engine = create501Game(['Alice', 'Bob'], 1, 2)

    // Alice wins leg 1 (= set 1, since legs_to_win = 1)
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40
    engine.throw(D20)

    expect(engine.state.players[0]!.sets_won).toBe(1)
    expect(engine.state.sets_won[0]).toBe(1)
    expect(engine.state.is_finished).toBe(false)
  })

  it('resets legs for new set', () => {
    const engine = create501Game(['Alice', 'Bob'], 1, 2)

    // Alice wins set 1
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40
    engine.throw(D20)

    // legs should be reset
    expect(engine.state.players[0]!.legs_won).toBe(0)
    expect(engine.state.players[1]!.legs_won).toBe(0)
    expect(engine.state.current_set_legs).toEqual([0, 0])
  })

  it('finishes game when sets_to_win reached', () => {
    const engine = create501Game(['Alice', 'Bob'], 1, 2)

    // Alice wins set 1
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40
    engine.throw(D20)

    // Bob starts, misses
    throwMissTurn(engine)

    // Alice wins set 2
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40
    engine.throw(D20)

    expect(engine.state.is_finished).toBe(true)
    expect(engine.state.winner_index).toBe(0)
    expect(engine.state.sets_won[0]).toBe(2)
  })
})

// ── Undo ──

describe('undo', () => {
  it('undoes last throw and restores score', () => {
    const engine = create501Game()
    engine.throw(T20)
    expect(engine.state.players[0]!.score).toBe(441)
    engine.undoThrow()
    expect(engine.state.players[0]!.score).toBe(501)
    expect(engine.state.current_turn.throws).toHaveLength(0)
  })

  it('undoes 2nd throw keeping 1st', () => {
    const engine = create501Game()
    engine.throw(T20)
    engine.throw(T19)
    expect(engine.state.players[0]!.score).toBe(384) // 501 - 60 - 57
    engine.undoThrow()
    expect(engine.state.players[0]!.score).toBe(441) // 501 - 60
    expect(engine.state.current_turn.throws).toHaveLength(1)
  })

  it('undoes bust (clears flag, restores score)', () => {
    const engine = create501Game()
    engine.state.players[0]!.score = 10
    engine.state.score_before_turn = 10
    engine.state.current_turn.score_before = 10
    engine.throw(T20) // bust

    // Now it's Bob's turn, bust turn is in history
    expect(engine.state.current_player_index).toBe(1)
    expect(engine.state.players[0]!.score).toBe(10)

    // Undo goes back to Alice's busted turn
    engine.undoThrow()
    expect(engine.state.current_player_index).toBe(0)
    expect(engine.state.current_turn.busted).toBe(false)
    expect(engine.state.players[0]!.score).toBe(10)
  })

  it('undoes into previous player turn', () => {
    const engine = create501Game()
    throwDarts(engine, [T20, T20, T20]) // Alice: 501 → 321, turn ends
    // Now Bob's turn
    expect(engine.state.current_player_index).toBe(1)

    engine.undoThrow() // goes back to Alice's last dart
    expect(engine.state.current_player_index).toBe(0)
    expect(engine.state.current_turn.throws).toHaveLength(2) // T20, T20 remain
    expect(engine.state.players[0]!.score).toBe(381) // 501 - 120
  })

  it('no-op on empty game', () => {
    const engine = create501Game()
    engine.undoThrow()
    expect(engine.state.players[0]!.score).toBe(501)
    expect(engine.state.current_player_index).toBe(0)
  })

  it('no-op when finished', () => {
    const engine = create501Game()
    engine.state.is_finished = true
    engine.undoThrow()
    expect(engine.state.is_finished).toBe(true)
  })

  it('multi-undo through several turns', () => {
    const engine = create501Game()
    throwDarts(engine, [T20, T20, T20]) // Alice: 321
    throwDarts(engine, [T19, T19, T19]) // Bob: 501 - 171 = 330
    // Now Alice's turn again
    engine.throw(S20) // Alice: 321 - 20 = 301

    // Undo Alice's S20
    engine.undoThrow()
    expect(engine.state.players[0]!.score).toBe(321)

    // Undo back into Bob's turn
    engine.undoThrow()
    expect(engine.state.current_player_index).toBe(1)
    expect(engine.state.current_turn.throws).toHaveLength(2)
    expect(engine.state.players[1]!.score).toBe(387) // 501 - 57 - 57
  })
})

// ── stopGame & manualScore ──

describe('stopGame', () => {
  it('resets to default state', () => {
    const engine = create501Game()
    engine.throw(T20)
    engine.stopGame()
    expect(engine.state.players).toEqual([])
    expect(engine.state.is_finished).toBe(false)
    expect(engine.state.mode).toBe('501')
  })
})

describe('manualScore', () => {
  it('delegates to throw', () => {
    const engine = create501Game()
    engine.manualScore(20, 3) // same as T20
    expect(engine.state.players[0]!.score).toBe(441)
  })
})
