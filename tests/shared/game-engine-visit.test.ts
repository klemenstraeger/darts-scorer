import { describe, it, expect } from 'vitest'
import { GameEngine } from '../../shared/game-engine'

function createEngine(mode = '501' as const, checkout = 'double_out' as const) {
  const engine = new GameEngine()
  engine.newGame(mode, ['Alice', 'Bob'], checkout)
  return engine
}

describe('GameEngine.applyVisitScore', () => {
  it('applies a valid visit score and ends the turn', () => {
    const engine = createEngine()
    engine.applyVisitScore(60)

    // Turn should have ended — now Bob's turn
    expect(engine.state.current_player_index).toBe(1)
    // Alice's score should be reduced
    expect(engine.state.players[0]!.score).toBe(441)
    // Alice should have one completed turn with visitScore
    expect(engine.state.players[0]!.turns.length).toBe(1)
    expect(engine.state.players[0]!.turns[0]!.visitScore).toBe(60)
    expect(engine.state.players[0]!.turns[0]!.throws).toEqual([])
  })

  it('applies score of 0 (all misses) without busting', () => {
    const engine = createEngine()
    engine.applyVisitScore(0)

    expect(engine.state.current_player_index).toBe(1)
    expect(engine.state.players[0]!.score).toBe(501)
    expect(engine.state.players[0]!.turns[0]!.visitScore).toBe(0)
    expect(engine.state.players[0]!.turns[0]!.busted).toBe(false)
  })

  it('rejects impossible scores', () => {
    const engine = createEngine()
    engine.applyVisitScore(179) // impossible

    // Should not have changed anything
    expect(engine.state.current_player_index).toBe(0)
    expect(engine.state.players[0]!.turns.length).toBe(0)
  })

  it('rejects negative scores', () => {
    const engine = createEngine()
    engine.applyVisitScore(-1)

    expect(engine.state.current_player_index).toBe(0)
  })

  it('rejects scores above 180', () => {
    const engine = createEngine()
    engine.applyVisitScore(181)

    expect(engine.state.current_player_index).toBe(0)
  })

  it('busts when score exceeds remaining', () => {
    const engine = createEngine()
    // Get Alice down to 50
    engine.applyVisitScore(180) // Alice: 321
    engine.applyVisitScore(100) // Bob: 401
    engine.applyVisitScore(180) // Alice: 141
    engine.applyVisitScore(100) // Bob: 301
    engine.applyVisitScore(100) // Alice: 41

    // Now try to score 60 from 41 — bust
    engine.applyVisitScore(100) // Bob: 201
    engine.applyVisitScore(60)  // Alice: bust (60 > 41)

    // Alice should have busted — her score stays at 41
    expect(engine.state.players[0]!.score).toBe(41)
    const lastTurn = engine.state.players[0]!.turns[engine.state.players[0]!.turns.length - 1]!
    expect(lastTurn.busted).toBe(true)
    expect(lastTurn.visitScore).toBe(60)
  })

  it('busts when remaining would be 1 in double-out', () => {
    const engine = createEngine('501', 'double_out')
    // Get Alice to 61
    engine.applyVisitScore(180) // Alice: 321
    engine.applyVisitScore(100) // Bob
    engine.applyVisitScore(180) // Alice: 141
    engine.applyVisitScore(100) // Bob
    engine.applyVisitScore(80)  // Alice: 61

    // Score 60 from 61 = remaining 1 = bust in double-out
    engine.applyVisitScore(100) // Bob
    engine.applyVisitScore(60)

    expect(engine.state.players[0]!.score).toBe(61)
    const lastTurn = engine.state.players[0]!.turns[engine.state.players[0]!.turns.length - 1]!
    expect(lastTurn.busted).toBe(true)
  })

  it('handles checkout in double-out mode', () => {
    const engine = createEngine('501', 'double_out')
    // Get Alice to 40 (D20 checkout)
    engine.applyVisitScore(180) // Alice: 321
    engine.applyVisitScore(100) // Bob
    engine.applyVisitScore(180) // Alice: 141
    engine.applyVisitScore(100) // Bob
    engine.applyVisitScore(101) // Alice: 40

    // Checkout: 40 from 40 = D20
    engine.applyVisitScore(100) // Bob
    engine.applyVisitScore(40)

    expect(engine.state.players[0]!.score).toBe(0)
    expect(engine.state.players[0]!.legs_won).toBe(1)
  })

  it('handles checkout in single-out mode', () => {
    const engine = createEngine('501', 'single_out')
    // Get Alice to 60
    engine.applyVisitScore(180) // Alice: 321
    engine.applyVisitScore(100) // Bob
    engine.applyVisitScore(180) // Alice: 141
    engine.applyVisitScore(100) // Bob
    engine.applyVisitScore(81)  // Alice: 60

    // Checkout: any remaining works in single-out
    engine.applyVisitScore(100) // Bob
    engine.applyVisitScore(60)

    expect(engine.state.players[0]!.score).toBe(0)
    expect(engine.state.players[0]!.legs_won).toBe(1)
  })

  it('invalid checkout in double-out (score not in CHECKOUTS)', () => {
    const engine = createEngine('501', 'double_out')
    // Get Alice to 159 (no checkout path)
    engine.applyVisitScore(180) // Alice: 321
    engine.applyVisitScore(100) // Bob
    engine.applyVisitScore(162) // Alice: 159

    // Try to checkout 159 — invalid in double-out
    engine.applyVisitScore(100) // Bob
    engine.applyVisitScore(159)

    // Should bust
    expect(engine.state.players[0]!.score).toBe(159)
    const lastTurn = engine.state.players[0]!.turns[engine.state.players[0]!.turns.length - 1]!
    expect(lastTurn.busted).toBe(true)
  })

  it('rejects visit score when mid-turn (throws already entered)', () => {
    const engine = createEngine()
    // Do a per-dart throw first
    engine.throw({ segment: 20, multiplier: 1 })
    // Now try visit score — should be rejected
    engine.applyVisitScore(60)

    expect(engine.state.current_turn.throws.length).toBe(1)
    expect(engine.state.current_turn.visitScore).toBeUndefined()
  })

  it('rejects visit score when game is finished', () => {
    const engine = createEngine('501', 'double_out')
    engine.state.is_finished = true
    engine.applyVisitScore(60)

    // No change
    expect(engine.state.players[0]!.turns.length).toBe(0)
  })

  it('game over: finishes the game when last leg/set is won', () => {
    const engine = new GameEngine()
    engine.newGame('501', ['Alice', 'Bob'], 'single_out', 1, 1)

    // Play full game to finish
    engine.applyVisitScore(180) // Alice: 321
    engine.applyVisitScore(180) // Bob: 321
    engine.applyVisitScore(180) // Alice: 141
    engine.applyVisitScore(180) // Bob: 141
    engine.applyVisitScore(141) // Alice: 0 → checkout

    expect(engine.state.is_finished).toBe(true)
    expect(engine.state.winner_index).toBe(0)
  })
})

describe('GameEngine.undoThrow with visit-score turns', () => {
  it('undoes an entire visit-score turn at once', () => {
    const engine = createEngine()
    engine.applyVisitScore(60) // Alice: 441, turn ends
    engine.applyVisitScore(80) // Bob: 421, turn ends

    // Now on Alice's turn. Undo should go back to Bob's turn
    engine.undoThrow()

    expect(engine.state.current_player_index).toBe(1) // Back to Bob
    expect(engine.state.players[1]!.score).toBe(501) // Bob's score restored
    expect(engine.state.current_turn.visitScore).toBeUndefined() // visitScore cleared
    expect(engine.state.current_turn.throws).toEqual([]) // No throws
  })

  it('undoes back through mixed per-dart and visit-score turns', () => {
    const engine = createEngine()
    engine.applyVisitScore(60) // Alice visit-score turn
    // Now Bob's turn — do per-dart
    engine.throw({ segment: 20, multiplier: 1 }) // Bob: 481
    engine.throw({ segment: 20, multiplier: 1 }) // Bob: 461
    engine.throw({ segment: 20, multiplier: 1 }) // Bob: 441, turn ends

    // Now Alice's turn again. Undo goes back to Bob's last throw
    engine.undoThrow()
    expect(engine.state.current_player_index).toBe(1) // Back to Bob
    expect(engine.state.current_turn.throws.length).toBe(2) // Two throws remain

    // Undo twice more to clear Bob's turn
    engine.undoThrow()
    engine.undoThrow()
    expect(engine.state.current_turn.throws.length).toBe(0)

    // Undo should now go back to Alice's visit-score turn
    engine.undoThrow()
    expect(engine.state.current_player_index).toBe(0)
    expect(engine.state.players[0]!.score).toBe(501) // Alice's score restored
    expect(engine.state.current_turn.visitScore).toBeUndefined()
  })
})

describe('Mixed-mode game', () => {
  it('supports alternating between per-dart and visit-score turns', () => {
    const engine = createEngine()

    // Alice: per-dart
    engine.throw({ segment: 20, multiplier: 3 }) // T20 = 60
    engine.throw({ segment: 20, multiplier: 3 }) // T20 = 60
    engine.throw({ segment: 20, multiplier: 3 }) // T20 = 60, total = 180, turn ends
    expect(engine.state.players[0]!.score).toBe(321)

    // Bob: visit-score
    engine.applyVisitScore(100)
    expect(engine.state.players[1]!.score).toBe(401)

    // Verify both turns are tracked correctly
    expect(engine.state.players[0]!.turns[0]!.throws.length).toBe(3)
    expect(engine.state.players[0]!.turns[0]!.visitScore).toBeUndefined()
    expect(engine.state.players[1]!.turns[0]!.throws.length).toBe(0)
    expect(engine.state.players[1]!.turns[0]!.visitScore).toBe(100)
  })
})

describe('Multi-leg visit-score game', () => {
  it('handles leg transitions correctly', () => {
    const engine = new GameEngine()
    engine.newGame('501', ['Alice', 'Bob'], 'single_out', 2, 1)

    // Leg 1: Alice wins
    engine.applyVisitScore(180) // Alice: 321
    engine.applyVisitScore(180) // Bob: 321
    engine.applyVisitScore(180) // Alice: 141
    engine.applyVisitScore(180) // Bob: 141
    engine.applyVisitScore(141) // Alice: 0 → win leg 1

    expect(engine.state.players[0]!.legs_won).toBe(1)
    expect(engine.state.is_finished).toBe(false)

    // Leg 2: new starting scores
    expect(engine.state.players[0]!.score).toBe(501)
    expect(engine.state.players[1]!.score).toBe(501)
  })
})
