/**
 * Pure Elo rating computation.
 * Standard formula: Expected(A) = 1 / (1 + 10^((Rb - Ra) / 400))
 */

export interface EloResult {
  newWinner: number
  newLoser: number
  winnerDelta: number
  loserDelta: number
}

export function computeElo(winnerRating: number, loserRating: number, k: number = 32): EloResult {
  const expectedWinner = 1 / (1 + 10 ** ((loserRating - winnerRating) / 400))
  const expectedLoser = 1 / (1 + 10 ** ((winnerRating - loserRating) / 400))

  const winnerDelta = Math.round(k * (1 - expectedWinner))
  const loserDelta = Math.round(k * (0 - expectedLoser))

  return {
    newWinner: winnerRating + winnerDelta,
    newLoser: loserRating + loserDelta,
    winnerDelta,
    loserDelta,
  }
}
