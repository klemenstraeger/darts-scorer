/**
 * Polymorphic game engine interface.
 * All game mode engines (X01, Cricket, etc.) implement this contract.
 */

import type {
  CheckoutMode,
  GameMode,
  GameState,
  Multiplier,
  PlayerDescriptor,
  ThrowResult,
} from '../game-models'

export interface IGameEngine {
  /** Current game state */
  state: GameState

  /** Initialize a new game with the given settings */
  newGame(
    mode: GameMode,
    playerDescriptors?: PlayerDescriptor[] | string[],
    checkout?: CheckoutMode,
    legsToWin?: number,
    setsToWin?: number,
  ): GameState

  /** Record a throw */
  throw(dart: ThrowResult): GameState

  /** Undo the last throw */
  undoThrow(): GameState

  /** Convenience: create a ThrowResult and record it */
  manualScore(segment: number, multiplier: Multiplier): GameState

  /** Stop/abandon the current game */
  stopGame(): GameState
}
