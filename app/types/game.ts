/** Re-export shared game types and helpers so existing imports don't break. */

export type {
  GameMode,
  CheckoutMode,
  Multiplier,
  ThrowResult,
  Turn,
  Player,
  GameState,
  BotDifficulty,
  PlayerDescriptor,
  CricketPlayerState,
  CricketState,
} from '#shared/game-models'

export {
  throwPoints,
  throwLabel,
  turnTotalPoints as turnTotal,
  turnIsComplete,
  createDefaultGameState,
  threeDartAverage,
  CRICKET_TARGETS,
} from '#shared/game-models'
