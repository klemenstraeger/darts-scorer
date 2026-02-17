/**
 * TrainingEngine — host class that delegates to mode-specific strategies.
 * Unlike the X01 GameEngine, training modes have fundamentally different
 * state shapes, so we use strategy pattern instead of inheritance.
 */

import type { ThrowResult, Multiplier } from '../game-models'
import { throwPoints } from '../game-models'
import type { TrainingConfig, TrainingModeState, TrainingThrowResult, TrainingStats, TrainingThrowRecord } from './training-models'
import type { TrainingModeStrategy } from './training-strategy'
import { getStrategy } from './modes'

export class TrainingEngine {
  state: TrainingModeState | null = null
  private strategy: TrainingModeStrategy | null = null

  constructor(state?: TrainingModeState) {
    if (state) {
      this.state = state
      this.strategy = getStrategy(state.mode)
    }
  }

  newSession(config: TrainingConfig): TrainingModeState {
    this.strategy = getStrategy(config.mode)
    this.state = this.strategy.createInitialState(config)
    return this.state
  }

  throw(dart: ThrowResult): TrainingThrowResult {
    if (!this.state || !this.strategy) {
      throw new Error('No active training session')
    }
    if (this.state.isComplete) {
      return { events: [], state: this.state }
    }

    // Record the throw
    const record: TrainingThrowRecord = {
      segment: dart.segment,
      multiplier: dart.multiplier,
      points: throwPoints(dart),
    }
    this.state.throws.push(record)

    // Delegate to strategy
    const result = this.strategy.processThrow(this.state, dart)
    this.state = result.state

    // Check completion
    if (this.strategy.isComplete(this.state) && !this.state.isComplete) {
      this.state.isComplete = true
      this.state.completedAt = new Date().toISOString()
      if (!result.events.includes('session_complete')) {
        result.events.push('session_complete')
      }
    }

    return result
  }

  undo(): TrainingModeState {
    if (!this.state || !this.strategy) {
      throw new Error('No active training session')
    }
    if (this.state.throws.length === 0) {
      return this.state
    }

    // Remove the throw record
    this.state.throws.pop()

    // Delegate undo to strategy
    this.state = this.strategy.undoLastThrow(this.state)

    // Un-complete if it was completed
    if (this.state.isComplete) {
      this.state.isComplete = false
      this.state.completedAt = null
    }

    return this.state
  }

  manualScore(segment: number, multiplier: Multiplier): TrainingThrowResult {
    return this.throw({ segment, multiplier })
  }

  getStats(): TrainingStats | null {
    if (!this.state || !this.strategy) return null
    return this.strategy.computeStats(this.state)
  }

  stopSession(): void {
    this.state = null
    this.strategy = null
  }
}
