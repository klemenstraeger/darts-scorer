/** Strategy interface for training mode implementations. */

import type { ThrowResult } from '../game-models'
import type { TrainingConfig, TrainingModeState, TrainingThrowResult, TrainingStats } from './training-models'

export interface TrainingModeStrategy<S extends TrainingModeState = TrainingModeState> {
  /** Create the initial state for a new session with the given config. */
  createInitialState(config: TrainingConfig): S

  /** Process a dart throw and return events + updated state. */
  processThrow(state: S, dart: ThrowResult): TrainingThrowResult

  /** Undo the last throw, returning the updated state. */
  undoLastThrow(state: S): S

  /** Check if the session is complete. */
  isComplete(state: S): boolean

  /** Compute summary stats for a completed (or in-progress) session. */
  computeStats(state: S): TrainingStats
}
