import { and, asc, eq, inArray } from 'drizzle-orm'
import { dartsThrows, gamePlayers, games, turns } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const gameId = Number(getRouterParam(event, 'id'))

  if (!gameId || Number.isNaN(gameId)) {
    throw createError({ statusCode: 400, message: 'Invalid game ID' })
  }

  // Fetch game and verify ownership
  const game = await db.query.games.findFirst({
    where: and(eq(games.id, gameId), eq(games.userId, userId)),
  })

  if (!game) {
    throw createError({ statusCode: 404, message: 'Game not found' })
  }

  // Fetch players ordered by position
  const players = await db
    .select({
      playerName: gamePlayers.playerName,
      position: gamePlayers.position,
      finalScore: gamePlayers.finalScore,
    })
    .from(gamePlayers)
    .where(eq(gamePlayers.gameId, gameId))
    .orderBy(asc(gamePlayers.position))

  // Fetch turns ordered by turnNumber
  const gameTurns = await db
    .select({
      id: turns.id,
      turnNumber: turns.turnNumber,
      playerName: turns.playerName,
      totalPoints: turns.totalPoints,
      busted: turns.busted,
    })
    .from(turns)
    .where(eq(turns.gameId, gameId))
    .orderBy(asc(turns.turnNumber))

  // Fetch all throws for all turns in a single query
  const turnIds = gameTurns.map(t => t.id)

  let allThrows: {
    turnId: number
    throwNumber: number
    segment: number
    multiplier: number
    points: number
  }[] = []

  if (turnIds.length > 0) {
    allThrows = await db
      .select({
        turnId: dartsThrows.turnId,
        throwNumber: dartsThrows.throwNumber,
        segment: dartsThrows.segment,
        multiplier: dartsThrows.multiplier,
        points: dartsThrows.points,
      })
      .from(dartsThrows)
      .where(inArray(dartsThrows.turnId, turnIds))
      .orderBy(asc(dartsThrows.turnId), asc(dartsThrows.throwNumber))
  }

  // Group throws by turnId
  const throwsByTurn = new Map<number, typeof allThrows>()
  for (const t of allThrows) {
    const existing = throwsByTurn.get(t.turnId) ?? []
    existing.push(t)
    throwsByTurn.set(t.turnId, existing)
  }

  // Build turns with their throws
  const turnsWithThrows = gameTurns.map(turn => ({
    turnNumber: turn.turnNumber,
    playerName: turn.playerName,
    totalPoints: turn.totalPoints,
    busted: turn.busted,
    throws: (throwsByTurn.get(turn.id) ?? []).map(t => ({
      throwNumber: t.throwNumber,
      segment: t.segment,
      multiplier: t.multiplier,
      points: t.points,
    })),
  }))

  return {
    game: {
      id: game.id,
      mode: game.mode,
      winnerName: game.winnerName,
      totalTurns: game.totalTurns,
      createdAt: game.createdAt,
    },
    players: players.map(p => ({
      playerName: p.playerName,
      position: p.position,
      finalScore: p.finalScore,
    })),
    turns: turnsWithThrows,
  }
})
