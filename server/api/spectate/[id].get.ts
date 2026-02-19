/**
 * Public spectate API — no authentication required.
 * Returns tournament data + live game state in a single call.
 */

import type { GameState } from '../../../shared/game-models'
import { eq, inArray, sql } from 'drizzle-orm'
import {
  activeGames,
  broadcastSessions,
  players,
  tournamentMatches,
  tournamentParticipants,
  tournaments,
  tournamentStandings,
  turns,
} from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Invalid tournament ID' })
  }

  // No userId filter — public endpoint
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, id))

  if (!tournament) {
    throw createError({ statusCode: 404, message: 'Tournament not found' })
  }

  const [participantRows, matchRows, standingRows] = await Promise.all([
    db.select().from(tournamentParticipants).where(eq(tournamentParticipants.tournamentId, id)),
    db.select().from(tournamentMatches).where(eq(tournamentMatches.tournamentId, id)),
    db.select().from(tournamentStandings).where(eq(tournamentStandings.tournamentId, id)),
  ])

  // Load player avatar data for all participants
  const playerAvatars = await db
    .select({
      name: players.name,
      avatarStyle: players.avatarStyle,
      avatarSeed: players.avatarSeed,
    })
    .from(players)
    .where(eq(players.userId, tournament.userId))

  // Find live game: query the tournament owner's active game, then check if it
  // matches an in-progress tournament match by comparing player names.
  // This is more robust than relying on tournament_match_id which may not be
  // synced to the DB immediately.
  const inProgressMatches = matchRows.filter(m => m.status === 'in_progress')

  let liveGame: { matchId: number, state: any } | null = null

  if (inProgressMatches.length > 0) {
    const [activeRow] = await db
      .select()
      .from(activeGames)
      .where(eq(activeGames.userId, tournament.userId))

    if (activeRow) {
      const state = activeRow.state as GameState
      const gamePlayerNames = state.players?.map(p => p.name) ?? []

      // Match by tournamentMatchId first (if synced), otherwise by player names
      if (activeRow.tournamentMatchId) {
        const match = inProgressMatches.find(m => m.id === activeRow.tournamentMatchId)
        if (match) {
          liveGame = { matchId: match.id, state }
        }
      }

      if (!liveGame && gamePlayerNames.length === 2) {
        const match = inProgressMatches.find(m =>
          (m.player1Name === gamePlayerNames[0] && m.player2Name === gamePlayerNames[1])
          || (m.player1Name === gamePlayerNames[1] && m.player2Name === gamePlayerNames[0]),
        )
        if (match) {
          liveGame = { matchId: match.id, state }
        }
      }
    }
  }

  // Aggregate per-player scoring stats from completed tournament games
  const completedGameIds = matchRows
    .filter(m => m.gameId)
    .map(m => m.gameId!)

  const playerStats: Record<string, {
    three_dart_average: number
    count_180: number
    count_140_plus: number
    count_100_plus: number
    highest_turn: number | null
  }> = {}

  if (completedGameIds.length > 0) {
    const rows = await db
      .select({
        playerName: turns.playerName,
        avg: sql<number>`round(avg(case when not ${turns.busted} then ${turns.totalPoints} end)::numeric, 1)::float`,
        count_180: sql<number>`count(*) filter (where ${turns.totalPoints} = 180 and not ${turns.busted})`,
        count_140_plus: sql<number>`count(*) filter (where ${turns.totalPoints} >= 140 and not ${turns.busted})`,
        count_100_plus: sql<number>`count(*) filter (where ${turns.totalPoints} >= 100 and not ${turns.busted})`,
        highest_turn: sql<number | null>`max(case when not ${turns.busted} then ${turns.totalPoints} end)`,
      })
      .from(turns)
      .where(inArray(turns.gameId, completedGameIds))
      .groupBy(turns.playerName)

    for (const row of rows) {
      playerStats[row.playerName] = {
        three_dart_average: row.avg ?? 0,
        count_180: Number(row.count_180),
        count_140_plus: Number(row.count_140_plus),
        count_100_plus: Number(row.count_100_plus),
        highest_turn: row.highest_turn,
      }
    }
  }

  // Check for active broadcast session
  const [broadcastSession] = await db
    .select()
    .from(broadcastSessions)
    .where(eq(broadcastSessions.tournamentId, id))

  const broadcast = broadcastSession
    ? { status: broadcastSession.status, offer: broadcastSession.offer, hasAnswer: !!broadcastSession.answer }
    : null

  // Prevent caching
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-store')

  return {
    tournament: {
      id: tournament.id,
      name: tournament.name,
      format: tournament.format,
      status: tournament.status,
      gameMode: tournament.gameMode,
      checkout: tournament.checkout,
      legsToWin: tournament.legsToWin,
      setsToWin: tournament.setsToWin,
      groupCount: tournament.groupCount,
      advancePerGroup: tournament.advancePerGroup,
      winnerName: tournament.winnerName,
      playerCount: participantRows.length,
    },
    participants: participantRows,
    matches: matchRows,
    standings: standingRows,
    players: playerAvatars,
    playerStats,
    liveGame,
    broadcast,
  }
})
