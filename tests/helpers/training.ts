/**
 * Reusable helpers for training mode tests.
 */
import type { ThrowResult } from '../../shared/game-models'
import type { TrainingConfig, TrainingModeState, TrainingThrowResult } from '../../shared/training/training-models'
import { TrainingEngine } from '../../shared/training/training-engine'
import { MISS } from './darts'

/** Create a training engine with a new session for the given mode. */
export function createTrainingSession(
  mode: TrainingConfig['mode'],
  config?: Partial<TrainingConfig>,
): { engine: TrainingEngine; state: TrainingModeState } {
  const engine = new TrainingEngine()
  const state = engine.newSession({ mode, ...config })
  return { engine, state }
}

/** Throw multiple darts, returning all results. */
export function trainingThrow(
  engine: TrainingEngine,
  darts: ThrowResult[],
): TrainingThrowResult[] {
  return darts.map(d => engine.throw(d))
}

/** Throw N misses. */
export function trainingMisses(
  engine: TrainingEngine,
  count: number,
): TrainingThrowResult[] {
  const results: TrainingThrowResult[] = []
  for (let i = 0; i < count; i++) {
    results.push(engine.throw(MISS))
  }
  return results
}
