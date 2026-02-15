import { describe, it, expect } from 'vitest'
import { GameEvent, detectThrowEvent } from '../../shared/game-events'
import { GameEngine } from '../../shared/game-engine'
import {
  create501Game,
  throwDarts,
  throwMissTurn,
  T20, D20, S20, MISS,
} from '../helpers/darts'

/**
 * Helper: capture pre-throw state, throw dart, return event.
 */
function throwAndDetect(engine: GameEngine, dart: { segment: number; multiplier: 1 | 2 | 3 }) {
  const prevTurnCount = engine.state.turn_history.length
  const prevLegs = engine.state.players.map(p => p.legs_won)
  const prevSets = [...engine.state.sets_won]
  engine.throw(dart)
  return detectThrowEvent(prevTurnCount, prevLegs, prevSets, engine.state)
}

describe('detectThrowEvent', () => {
  it('normal throw returns DART_SCORED', () => {
    const engine = create501Game()
    const event = throwAndDetect(engine, T20)
    expect(event).toBe(GameEvent.DART_SCORED)
  })

  it('bust returns BUST', () => {
    const engine = create501Game()
    engine.state.players[0]!.score = 10
    engine.state.score_before_turn = 10
    engine.state.current_turn.score_before = 10
    const event = throwAndDetect(engine, T20) // 10 - 60 < 0, bust
    expect(event).toBe(GameEvent.BUST)
  })

  it('leg won (not final) returns LEG_WON', () => {
    const engine = create501Game(['A', 'B'], 2) // best of 2 legs
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40
    const event = throwAndDetect(engine, D20)
    expect(event).toBe(GameEvent.LEG_WON)
  })

  it('game over returns GAME_OVER (priority over LEG_WON)', () => {
    const engine = create501Game()
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40
    const event = throwAndDetect(engine, D20)
    expect(event).toBe(GameEvent.GAME_OVER)
  })

  it('3rd dart completing non-bust turn returns DART_SCORED', () => {
    const engine = create501Game()
    engine.throw(S20)
    engine.throw(S20)
    const event = throwAndDetect(engine, S20) // completes turn, not bust
    expect(event).toBe(GameEvent.DART_SCORED)
  })

  it('set change detected via sets_won comparison', () => {
    const engine = create501Game(['A', 'B'], 1, 2) // 1 leg per set, 2 sets to win
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40
    const event = throwAndDetect(engine, D20)
    // Won a set (leg + set), but not the game yet → LEG_WON
    expect(event).toBe(GameEvent.LEG_WON)
    expect(engine.state.sets_won[0]).toBe(1)
  })

  it('2nd dart hit returns DART_SCORED', () => {
    const engine = create501Game()
    engine.throw(T20)
    const event = throwAndDetect(engine, T20)
    expect(event).toBe(GameEvent.DART_SCORED)
  })

  it('miss returns DART_SCORED', () => {
    const engine = create501Game()
    const event = throwAndDetect(engine, MISS)
    expect(event).toBe(GameEvent.DART_SCORED)
  })
})
