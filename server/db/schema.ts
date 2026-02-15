import { pgTable, serial, text, integer, boolean, timestamp, unique, uuid, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ── Tournament Tables ──────────────────────────────────────

export const tournaments = pgTable('tournaments', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  format: text('format').notNull(), // knockout | league | group_only | group_knockout
  status: text('status').notNull().default('created'), // created | in_progress | completed
  gameMode: text('game_mode').notNull().default('501'),
  checkout: text('checkout').notNull().default('double_out'),
  legsToWin: integer('legs_to_win').notNull().default(1),
  setsToWin: integer('sets_to_win').notNull().default(1),
  groupCount: integer('group_count'),
  advancePerGroup: integer('advance_per_group'),
  winnerName: text('winner_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}).enableRLS()

export const tournamentParticipants = pgTable('tournament_participants', {
  id: serial('id').primaryKey(),
  tournamentId: integer('tournament_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
  playerName: text('player_name').notNull(),
  seed: integer('seed').notNull(),
  groupIndex: integer('group_index'),
}, (table) => [
  unique().on(table.tournamentId, table.playerName),
  unique().on(table.tournamentId, table.seed),
]).enableRLS()

export const tournamentMatches = pgTable('tournament_matches', {
  id: serial('id').primaryKey(),
  tournamentId: integer('tournament_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
  round: integer('round').notNull(),
  position: integer('position').notNull(),
  phase: text('phase').notNull(), // group | knockout | main
  groupIndex: integer('group_index'),
  player1Name: text('player1_name'),
  player2Name: text('player2_name'),
  winnerName: text('winner_name'),
  loserName: text('loser_name'),
  status: text('status').notNull().default('pending'), // pending | in_progress | completed
  gameId: integer('game_id').references(() => games.id),
  player1LegsWon: integer('player1_legs_won').notNull().default(0),
  player2LegsWon: integer('player2_legs_won').notNull().default(0),
  scheduledAt: timestamp('scheduled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  unique().on(table.tournamentId, table.phase, table.round, table.position, table.groupIndex),
]).enableRLS()

export const tournamentStandings = pgTable('tournament_standings', {
  id: serial('id').primaryKey(),
  tournamentId: integer('tournament_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
  playerName: text('player_name').notNull(),
  groupIndex: integer('group_index'),
  played: integer('played').notNull().default(0),
  won: integer('won').notNull().default(0),
  lost: integer('lost').notNull().default(0),
  points: integer('points').notNull().default(0),
  legsWon: integer('legs_won').notNull().default(0),
  legsLost: integer('legs_lost').notNull().default(0),
  legDifference: integer('leg_difference').notNull().default(0),
}, (table) => [
  unique().on(table.tournamentId, table.playerName),
]).enableRLS()

// ── Tables ──────────────────────────────────────────────

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // matches auth.users.id
  displayName: text('display_name').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()

export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  avatarStyle: text('avatar_style'),
  avatarSeed: text('avatar_seed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.name),
]).enableRLS()

export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  mode: text('mode').notNull(),
  winnerName: text('winner_name'),
  totalTurns: integer('total_turns').notNull(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()

export const gamePlayers = pgTable('game_players', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  playerName: text('player_name').notNull(),
  position: integer('position').notNull(),
  finalScore: integer('final_score').notNull(),
}, (table) => [
  unique().on(table.gameId, table.position),
]).enableRLS()

export const turns = pgTable('turns', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  turnNumber: integer('turn_number').notNull(),
  playerName: text('player_name').notNull(),
  totalPoints: integer('total_points').notNull(),
  busted: boolean('busted').default(false).notNull(),
}).enableRLS()

export const dartsThrows = pgTable('throws', {
  id: serial('id').primaryKey(),
  turnId: integer('turn_id').notNull().references(() => turns.id, { onDelete: 'cascade' }),
  throwNumber: integer('throw_number').notNull(),
  segment: integer('segment').notNull(),
  multiplier: integer('multiplier').notNull(),
  points: integer('points').notNull(),
}).enableRLS()

export const activeGames = pgTable('active_games', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().unique().references(() => profiles.id, { onDelete: 'cascade' }),
  state: jsonb('state').notNull(),
  tournamentMatchId: integer('tournament_match_id').references(() => tournamentMatches.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}).enableRLS()

export const broadcastSessions = pgTable('broadcast_sessions', {
  id: serial('id').primaryKey(),
  tournamentId: integer('tournament_id').notNull().unique().references(() => tournaments.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  offer: jsonb('offer'),
  answer: jsonb('answer'),
  status: text('status').notNull().default('waiting'), // waiting | connected | ended
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}).enableRLS()

// ── Relations (for relational query builder) ────────────

export const profilesRelations = relations(profiles, ({ many }) => ({
  players: many(players),
  games: many(games),
}))

export const playersRelations = relations(players, ({ one }) => ({
  profile: one(profiles, { fields: [players.userId], references: [profiles.id] }),
}))

export const gamesRelations = relations(games, ({ one, many }) => ({
  profile: one(profiles, { fields: [games.userId], references: [profiles.id] }),
  players: many(gamePlayers),
  turns: many(turns),
}))

export const gamePlayersRelations = relations(gamePlayers, ({ one }) => ({
  game: one(games, { fields: [gamePlayers.gameId], references: [games.id] }),
}))

export const turnsRelations = relations(turns, ({ one, many }) => ({
  game: one(games, { fields: [turns.gameId], references: [games.id] }),
  throws: many(dartsThrows),
}))

export const dartsThrowsRelations = relations(dartsThrows, ({ one }) => ({
  turn: one(turns, { fields: [dartsThrows.turnId], references: [turns.id] }),
}))

// ── Tournament Relations ──

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  profile: one(profiles, { fields: [tournaments.userId], references: [profiles.id] }),
  participants: many(tournamentParticipants),
  matches: many(tournamentMatches),
  standings: many(tournamentStandings),
}))

export const tournamentParticipantsRelations = relations(tournamentParticipants, ({ one }) => ({
  tournament: one(tournaments, { fields: [tournamentParticipants.tournamentId], references: [tournaments.id] }),
}))

export const tournamentMatchesRelations = relations(tournamentMatches, ({ one }) => ({
  tournament: one(tournaments, { fields: [tournamentMatches.tournamentId], references: [tournaments.id] }),
  game: one(games, { fields: [tournamentMatches.gameId], references: [games.id] }),
}))

export const tournamentStandingsRelations = relations(tournamentStandings, ({ one }) => ({
  tournament: one(tournaments, { fields: [tournamentStandings.tournamentId], references: [tournaments.id] }),
}))
