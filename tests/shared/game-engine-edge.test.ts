import { describe, it, expect } from 'vitest'
import { GameEngine } from '../../shared/game-engine'
import {
  create501Game,
  throwDarts,
  throwMissTurn,
  T20, T19,
  D20, D25,
  S1, S20,
  MISS,
} from '../helpers/darts'

// ── PlayerDescriptor objects ──

describe('PlayerDescriptor objects', () => {
  it('accepts bot players', () => {
    const engine = new GameEngine()
    engine.newGame('501', [
      { name: 'Bot', isBot: true, botDifficulty: 'hard' },
      { name: 'Human' },
    ])
    expect(engine.state.players[0]!.name).toBe('Bot')
    expect(engine.state.players[0]!.isBot).toBe(true)
    expect(engine.state.players[0]!.botDifficulty).toBe('hard')
    expect(engine.state.players[1]!.name).toBe('Human')
    expect(engine.state.players[1]!.isBot).toBeUndefined()
  })

  it('mixed string and descriptor inputs', () => {
    const engine = new GameEngine()
    engine.newGame('501', ['Alice', { name: 'Bot', isBot: true }])
    expect(engine.state.players[0]!.name).toBe('Alice')
    expect(engine.state.players[0]!.isBot).toBeUndefined()
    expect(engine.state.players[1]!.name).toBe('Bot')
    expect(engine.state.players[1]!.isBot).toBe(true)
  })
})

// ── State hydration ──

describe('state hydration', () => {
  it('constructor with existing GameState allows throw continuation', () => {
    const engine = create501Game()
    engine.throw(T20) // Alice: 501 - 60 = 441
    const engine2 = new GameEngine(engine.state)
    engine2.throw(T19) // Alice: 441 - 57 = 384
    expect(engine2.state.players[0]!.score).toBe(384)
    expect(engine2.state.current_turn.throws).toHaveLength(2)
  })

  it('mid-game state preserves scores and turns', () => {
    const engine = create501Game()
    throwDarts(engine, [T20, T20, T20]) // Alice: 321, turn ends
    throwMissTurn(engine) // Bob misses
    engine.throw(S20) // Alice: 321 - 20 = 301

    const engine2 = new GameEngine(engine.state)
    expect(engine2.state.players[0]!.score).toBe(301)
    expect(engine2.state.players[1]!.score).toBe(501)
    expect(engine2.state.current_player_index).toBe(0)
    expect(engine2.state.current_turn.throws).toHaveLength(1)
    expect(engine2.state.turn_history).toHaveLength(2)
  })
})

// ── Edge cases ──

describe('edge cases', () => {
  it('newGame with defaults creates 2-player 501 game', () => {
    const engine = new GameEngine()
    engine.newGame()
    expect(engine.state.mode).toBe('501')
    expect(engine.state.checkout).toBe('double_out')
    expect(engine.state.players).toHaveLength(2)
    expect(engine.state.players[0]!.name).toBe('Player 1')
    expect(engine.state.players[1]!.name).toBe('Player 2')
    expect(engine.state.players[0]!.score).toBe(501)
    expect(engine.state.legs_to_win).toBe(1)
    expect(engine.state.sets_to_win).toBe(1)
  })

  it('stopGame returns default state with empty players', () => {
    const engine = create501Game()
    engine.throw(T20)
    const state = engine.stopGame()
    expect(state.players).toEqual([])
    expect(state.is_finished).toBe(false)
    expect(state.winner_index).toBeNull()
    expect(state.turn_history).toEqual([])
    expect(state.current_set_legs).toEqual([])
    expect(state.sets_won).toEqual([])
  })

  it('leg starting player alternates through 3 legs in best-of-3', () => {
    const engine = create501Game(['Alice', 'Bob'], 3)

    // --- Leg 1: Alice starts (player 0) ---
    expect(engine.state.leg_starting_player).toBe(0)
    expect(engine.state.current_player_index).toBe(0)

    // Win leg 1 for player 0 (Alice): set score to checkout and finish
    engine.state.players[0]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40
    engine.throw(D20) // checkout

    // --- Leg 2: Bob starts (player 1) ---
    expect(engine.state.is_finished).toBe(false)
    expect(engine.state.leg_starting_player).toBe(1)
    expect(engine.state.current_player_index).toBe(1)

    // Win leg 2 for player 1 (Bob): Bob throws
    engine.state.players[1]!.score = 40
    engine.state.score_before_turn = 40
    engine.state.current_turn.score_before = 40
    engine.throw(D20) // Bob checkout

    // --- Leg 3: Alice starts again (player 0) ---
    expect(engine.state.is_finished).toBe(false)
    expect(engine.state.leg_starting_player).toBe(0)
    expect(engine.state.current_player_index).toBe(0)
  })
})
