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
} from '#shared/game-models'

export {
  throwPoints,
  throwLabel,
  turnTotalPoints as turnTotal,
  turnIsComplete,
  createDefaultGameState,
  threeDartAverage,
  highestTurnScore,
  totalDartsThrown,
  getCheckoutDart,
  count180s,
  countTonPlus,
} from '#shared/game-models'
