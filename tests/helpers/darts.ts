/**
 * Reusable throw constants and factory helpers for darts tests.
 */
import type { ThrowResult } from '../../shared/game-models'
import { GameEngine } from '../../shared/game-engine'

// ── Throw Constants ──

export const MISS: ThrowResult = { segment: 0, multiplier: 1 }

// Singles
export const S1: ThrowResult = { segment: 1, multiplier: 1 }
export const S5: ThrowResult = { segment: 5, multiplier: 1 }
export const S10: ThrowResult = { segment: 10, multiplier: 1 }
export const S19: ThrowResult = { segment: 19, multiplier: 1 }
export const S20: ThrowResult = { segment: 20, multiplier: 1 }
export const S25: ThrowResult = { segment: 25, multiplier: 1 } // Single bull

// Doubles
export const D1: ThrowResult = { segment: 1, multiplier: 2 }
export const D10: ThrowResult = { segment: 10, multiplier: 2 }
export const D12: ThrowResult = { segment: 12, multiplier: 2 }
export const D16: ThrowResult = { segment: 16, multiplier: 2 }
export const D20: ThrowResult = { segment: 20, multiplier: 2 }
export const D25: ThrowResult = { segment: 25, multiplier: 2 } // Double bull (50)

// Triples
export const T15: ThrowResult = { segment: 15, multiplier: 3 }
export const T17: ThrowResult = { segment: 17, multiplier: 3 }
export const T19: ThrowResult = { segment: 19, multiplier: 3 }
export const T20: ThrowResult = { segment: 20, multiplier: 3 }
export const T25: ThrowResult = { segment: 25, multiplier: 3 } // Triple bull (75)

// ── Helpers ──

/** Throw multiple darts in sequence */
export function throwDarts(engine: GameEngine, darts: ThrowResult[]) {
  for (const d of darts) {
    engine.throw(d)
  }
}

/** Throw 3 misses to complete a turn */
export function throwMissTurn(engine: GameEngine) {
  throwDarts(engine, [MISS, MISS, MISS])
}

/** Create a standard 501 double-out game */
export function create501Game(
  names: string[] = ['Alice', 'Bob'],
  legs = 1,
  sets = 1,
): GameEngine {
  const engine = new GameEngine()
  engine.newGame('501', names, 'double_out', legs, sets)
  return engine
}

/** Create a 301 single-out game */
export function create301Game(
  names: string[] = ['Alice', 'Bob'],
  legs = 1,
  sets = 1,
): GameEngine {
  const engine = new GameEngine()
  engine.newGame('301', names, 'single_out', legs, sets)
  return engine
}
