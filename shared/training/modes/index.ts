/** Strategy registry — maps mode names to their implementations. */

import type { TrainingMode } from '../training-models'
import type { TrainingModeStrategy } from '../training-strategy'
import { scoringPracticeStrategy } from './scoring-practice'
import { aroundTheClockStrategy } from './around-the-clock'
import { bobs27Strategy } from './bobs-27'
import { hundredDartsStrategy } from './hundred-darts'
import { cricketStrategy } from './cricket'
import { checkoutPracticeStrategy } from './checkout-practice'
import { shanghaiStrategy } from './shanghai'

const strategies: Record<TrainingMode, TrainingModeStrategy> = {
  'scoring-practice': scoringPracticeStrategy as TrainingModeStrategy,
  'around-the-clock': aroundTheClockStrategy as TrainingModeStrategy,
  'bobs-27': bobs27Strategy as TrainingModeStrategy,
  'hundred-darts': hundredDartsStrategy as TrainingModeStrategy,
  'cricket': cricketStrategy as TrainingModeStrategy,
  'checkout-practice': checkoutPracticeStrategy as TrainingModeStrategy,
  'shanghai': shanghaiStrategy as TrainingModeStrategy,
}

export function getStrategy(mode: TrainingMode): TrainingModeStrategy {
  const strategy = strategies[mode]
  if (!strategy) {
    throw new Error(`Unknown training mode: ${mode}`)
  }
  return strategy
}
