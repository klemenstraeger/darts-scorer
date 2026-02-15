# Feature 03 — Elo Rating System

**Priority:** 4 (Medium-High) | **Effort:** Small-Medium | **Impact:** Medium
**Depends on:** Nothing

---

## Summary

Standard Elo rating system giving players a competitive skill ranking that evolves over time. Starting rating: 1500. K-factor: 32 (adjustable). Only computed for **human-vs-human** games (skip when bots are involved).

---

## Algorithm

The standard Elo formula:

```
Expected(A) = 1 / (1 + 10^((Rb - Ra) / 400))
New_Ra = Ra + K * (Score - Expected(A))
```

Where:
- `Ra`, `Rb` = current ratings of player A and B
- `Score` = 1 for win, 0 for loss (no draws in darts)
- `K` = 32 (default, configurable)

For multiplayer games (3+ players), compute pairwise: winner gains against each loser.

---

## Database Changes

### `server/db/schema.ts`

```ts
// Add to players table
export const players = pgTable('players', {
  // ... existing columns ...
  currentElo: integer('current_elo').notNull().default(1500),
})

// New table
export const eloHistory = pgTable('elo_history', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  playerName: text('player_name').notNull(),
  eloBefore: integer('elo_before').notNull(),
  eloAfter: integer('elo_after').notNull(),
  gameId: integer('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  opponentName: text('opponent_name').notNull(),
  result: text('result').notNull(), // 'win' | 'loss'
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

**Migration:**
```sql
ALTER TABLE players ADD COLUMN current_elo integer NOT NULL DEFAULT 1500;

CREATE TABLE elo_history (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  elo_before integer NOT NULL,
  elo_after integer NOT NULL,
  game_id integer NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  opponent_name text NOT NULL,
  result text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);
```

---

## Elo Computation Utility

### `server/utils/elo.ts` (NEW)

```ts
export interface EloResult {
  newWinner: number
  newLoser: number
  winnerDelta: number
  loserDelta: number
}

export function computeElo(
  winnerRating: number,
  loserRating: number,
  k: number = 32
): EloResult {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400))
  const expectedLoser = 1 - expectedWinner

  const winnerDelta = Math.round(k * (1 - expectedWinner))
  const loserDelta = Math.round(k * (0 - expectedLoser))

  return {
    newWinner: winnerRating + winnerDelta,
    newLoser: loserRating + loserDelta,
    winnerDelta,
    loserDelta,
  }
}
```

Pure function, easy to unit test.

---

## Integration with Game Save

### `server/utils/save-game.ts`

After saving the game record, compute and update Elo:

```ts
import { computeElo } from './elo'

export async function saveFinishedGame(userId: string, state: GameState): Promise<number | null> {
  // ... existing save logic ...

  // Elo update: skip if any player is a bot
  const hasBots = state.players.some(p => p.isBot)
  if (!hasBots && state.players.length === 2) {
    await updateEloRatings(userId, gameId, state)
  }

  return gameId
}

async function updateEloRatings(userId: string, gameId: number, state: GameState) {
  const winner = state.players[state.winner_index!]!
  const loser = state.players.find((_, i) => i !== state.winner_index)!

  // Get current Elo ratings from players table
  const [winnerRecord] = await db.select().from(players)
    .where(and(eq(players.userId, userId), eq(players.name, winner.name)))
  const [loserRecord] = await db.select().from(players)
    .where(and(eq(players.userId, userId), eq(players.name, loser.name)))

  const winnerElo = winnerRecord?.currentElo ?? 1500
  const loserElo = loserRecord?.currentElo ?? 1500

  const result = computeElo(winnerElo, loserElo)

  // Update current ratings
  await db.update(players).set({ currentElo: result.newWinner })
    .where(and(eq(players.userId, userId), eq(players.name, winner.name)))
  await db.update(players).set({ currentElo: result.newLoser })
    .where(and(eq(players.userId, userId), eq(players.name, loser.name)))

  // Record history for both players
  await db.insert(eloHistory).values([
    { userId, playerName: winner.name, eloBefore: winnerElo, eloAfter: result.newWinner, gameId, opponentName: loser.name, result: 'win' },
    { userId, playerName: loser.name, eloBefore: loserElo, eloAfter: result.newLoser, gameId, opponentName: winner.name, result: 'loss' },
  ])
}
```

---

## API Endpoints

### `server/api/stats/rankings.get.ts` (NEW)

Returns all players sorted by Elo rating:

```ts
// GET /api/stats/rankings
// Response: { rankings: [{ name, elo, recentTrend: number[], gamesPlayed }] }

export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event)

  // Get all players with their Elo
  const allPlayers = await db.select().from(players)
    .where(eq(players.userId, userId))
    .orderBy(desc(players.currentElo))

  // Get last 5 Elo changes per player for sparkline
  const rankings = await Promise.all(allPlayers.map(async (p) => {
    const history = await db.select().from(eloHistory)
      .where(and(eq(eloHistory.userId, userId), eq(eloHistory.playerName, p.name)))
      .orderBy(desc(eloHistory.createdAt))
      .limit(5)

    return {
      name: p.name,
      elo: p.currentElo,
      recentTrend: history.map(h => h.eloAfter).reverse(),
      gamesPlayed: history.length, // approximate
    }
  }))

  return { rankings }
})
```

---

## Files to Create

| File | Description |
|------|-------------|
| `server/utils/elo.ts` | `computeElo()` pure function |
| `server/api/stats/rankings.get.ts` | Rankings leaderboard endpoint |

## Files to Modify

| File | Change |
|------|--------|
| `server/db/schema.ts` | Add `currentElo` to `players`, add `eloHistory` table + relations |
| `server/utils/save-game.ts` | Call Elo update after saving human-vs-human games |
| `server/api/stats/index.get.ts` | Include `currentElo` in player stats response |
| `app/pages/stats.vue` | Add "Rankings" tab/section with Elo leaderboard |

---

## Backfill Script

### `scripts/backfill-elo.ts`

One-time script to compute Elo from all historical games in chronological order:

```ts
// 1. Reset all players to 1500
// 2. Query all games ORDER BY created_at ASC
// 3. For each game: computeElo() and update player ratings
// 4. Record elo_history entries
```

Run with: `npx tsx scripts/backfill-elo.ts`

---

## UI: Rankings Section in Stats Page

Add to `app/pages/stats.vue`:

- New tab "Rankings" alongside existing stats tabs
- Leaderboard table: Rank, Avatar, Name, Elo rating, Trend sparkline (last 5 games)
- Elo badge next to player name showing rating (e.g., "1534")
- Color-coded: green if trending up, red if trending down

---

## Testing Strategy

1. **Unit tests** (`tests/elo.test.ts`):
   - Equal ratings → ~16 point swing
   - Large gap → smaller gain for favorite, larger gain for underdog
   - K-factor sensitivity
   - No negative ratings

2. **Integration**:
   - Elo updates after human-vs-human game save
   - Elo NOT updated for bot games
   - History records created correctly
   - Rankings API returns sorted results

---

## Future Enhancements

- Per-mode Elo (separate rating for 501 vs Cricket)
- K-factor that decreases with games played (provisional period)
- Global Elo across users (cross-account, when online multiplayer exists)
