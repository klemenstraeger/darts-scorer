/**
 * Factory function that creates the appropriate game engine based on game mode.
 */

import type { GameState } from '../game-models'
import type { IGameEngine } from './engine-interface'
import { X01Engine } from './x01-engine'
import { CricketEngine } from './cricket-engine'

/**
 * Create a game engine instance.
 *
 * @param state - Optional existing game state to resume. The mode field determines the engine type.
 * @param mode - Optional mode hint for when creating a fresh engine without state.
 */
export function createEngine(state?: GameState, mode?: string): IGameEngine {
  const effectiveMode = state?.mode ?? mode

  if (effectiveMode === 'cricket') {
    return new CricketEngine(state)
  }

  // Default: X01 engine for 501, 301, or any unknown mode
  return new X01Engine(state)
}
