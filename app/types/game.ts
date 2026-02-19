/** Re-export shared game types and helpers so existing imports don't break. */

export type {
  BotDifficulty,
  CheckoutMode,
  GameMode,
  GameState,
  InputMode,
  Multiplier,
  Player,
  PlayerDescriptor,
  ThrowResult,
  Turn,
} from '#shared/game-models'

export {
  count180s,
  countTonPlus,
  createDefaultGameState,
  getCheckoutDart,
  highestTurnScore,
  isVisitScoreTurn,
  threeDartAverage,
  throwLabel,
  throwPoints,
  totalDartsThrown,
  turnIsComplete,
  turnTotalPoints as turnTotal,
} from '#shared/game-models'
