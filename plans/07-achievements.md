# Feature 07 — Achievements / Milestones

**Priority:** 5 (Medium) | **Effort:** Medium | **Impact:** Medium
**Depends on:** Nothing

---

## Summary

Gamification through unlockable badges for milestones. Adds long-term engagement by rewarding players for reaching specific goals. Detection runs **server-side** during game save to prevent manipulation.

---

## Achievement Catalog

| ID | Name | Condition | Icon idea |
|----|------|-----------|-----------|
| `first_180` | Maximum! | Score a 180 (three treble-20s in one turn) | Target |
| `first_ton_plus` | Ton Plus | Score 100+ in a single turn | Fire |
| `nine_darter` | Perfect Game | Win a leg in 9 darts | Star |
| `games_10` | Getting Started | Play 10 games | Medal |
| `games_100` | Century | Play 100 games | Trophy |
| `games_500` | Veteran | Play 500 games | Shield |
| `wins_10` | Winner | Win 10 games | Crown |
| `wins_50` | Champion | Win 50 games | Crown+ |
| `streak_5` | Hot Streak | Win 5 games in a row | Flame |
| `streak_10` | On Fire | Win 10 games in a row | Flame+ |
| `checkout_170` | Big Fish | Hit a 170 checkout (T20 T20 DB) | Fish |
| `checkout_100plus` | Ton Checkout | Check out on 100+ | Dart |
| `sub_15_leg` | Speed Demon | Win a leg in under 15 darts | Lightning |
| `all_doubles` | Double Master | Use every double (D1–D20, DB) to checkout | Ring |
| `tournament_win` | Tournament Champion | Win a tournament | Cup |
| `tournament_wins_10` | Dynasty | Win 10 tournaments | Castle |
| `avg_80_plus` | Consistent | Achieve 80+ three-dart average in a game | Graph |
| `avg_100_plus` | Elite | Achieve 100+ three-dart average in a game | Diamond |

---

## Database

### `server/db/schema.ts`

```ts
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  playerName: text('player_name').notNull(),
  type: text('type').notNull(),           // achievement ID from catalog
  gameId: integer('game_id').references(() => games.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata'),             // e.g., { score: 180 } or { checkout: 170 }
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.playerName, table.type), // each achievement unlockable once per player
])
```

---

## Achievement Detection Logic

### `server/utils/achievements.ts` (NEW)

```ts
import type { GameState } from '../../shared/game-models'

export interface NewAchievement {
  type: string
  playerName: string
  metadata?: Record<string, unknown>
}

export async function checkAchievements(
  userId: string,
  gameId: number,
  state: GameState
): Promise<NewAchievement[]> {
  const newAchievements: NewAchievement[] = []

  // Get already unlocked achievements for all players in this game
  const existing = await db.select({ type: achievements.type, playerName: achievements.playerName })
    .from(achievements)
    .where(eq(achievements.userId, userId))

  const isUnlocked = (player: string, type: string) =>
    existing.some(e => e.playerName === player && e.type === type)

  for (const player of state.players) {
    if (player.isBot) continue // no achievements for bots

    // ── Per-game checks ──

    // 180 check
    if (!isUnlocked(player.name, 'first_180')) {
      const has180 = player.turns.some(t =>
        !t.busted && t.throws.length === 3 &&
        t.throws.every(d => d.segment === 20 && d.multiplier === 3)
      )
      if (has180) newAchievements.push({ type: 'first_180', playerName: player.name })
    }

    // Ton+ check
    if (!isUnlocked(player.name, 'first_ton_plus')) {
      const hasTon = player.turns.some(t => {
        if (t.busted) return false
        const total = t.throws.reduce((s, d) => s + (d.segment === 25 ? 25 * d.multiplier : d.segment * d.multiplier), 0)
        return total >= 100
      })
      if (hasTon) newAchievements.push({ type: 'first_ton_plus', playerName: player.name })
    }

    // Average check
    const avg = threeDartAverage(player)
    if (avg >= 100 && !isUnlocked(player.name, 'avg_100_plus')) {
      newAchievements.push({ type: 'avg_100_plus', playerName: player.name, metadata: { avg } })
    } else if (avg >= 80 && !isUnlocked(player.name, 'avg_80_plus')) {
      newAchievements.push({ type: 'avg_80_plus', playerName: player.name, metadata: { avg } })
    }

    // 9-darter check
    if (!isUnlocked(player.name, 'nine_darter')) {
      const totalDarts = player.turns.reduce((s, t) => s + t.throws.length, 0)
      const isWinner = state.winner_index !== null && state.players[state.winner_index]?.name === player.name
      if (totalDarts === 9 && isWinner) {
        newAchievements.push({ type: 'nine_darter', playerName: player.name })
      }
    }

    // Sub-15 dart leg (winner only, single leg check)
    if (!isUnlocked(player.name, 'sub_15_leg')) {
      const totalDarts = player.turns.reduce((s, t) => s + t.throws.length, 0)
      if (totalDarts < 15 && state.players[state.winner_index!]?.name === player.name) {
        newAchievements.push({ type: 'sub_15_leg', playerName: player.name })
      }
    }
  }

  // ── Historical/cumulative checks (query database) ──

  const winnerName = state.players[state.winner_index!]?.name
  if (winnerName && !state.players.find(p => p.name === winnerName)?.isBot) {
    // Count total games and wins
    const [counts] = await db.select({
      total: sql`count(*)`,
      wins: sql`count(*) filter (where ${games.winnerName} = ${winnerName})`,
    }).from(games).where(eq(games.userId, userId))

    // Games milestones
    const totalGames = Number(counts.total) + 1
    if (totalGames >= 10 && !isUnlocked(winnerName, 'games_10'))
      newAchievements.push({ type: 'games_10', playerName: winnerName })
    if (totalGames >= 100 && !isUnlocked(winnerName, 'games_100'))
      newAchievements.push({ type: 'games_100', playerName: winnerName })

    // Win streak check
    // Query last N games for this player, check consecutive wins
    // ...
  }

  // Save new achievements
  if (newAchievements.length > 0) {
    await db.insert(achievements).values(
      newAchievements.map(a => ({
        userId,
        playerName: a.playerName,
        type: a.type,
        gameId,
        metadata: a.metadata ?? null,
      }))
    ).onConflictDoNothing()
  }

  return newAchievements
}
```

---

## Integration with Game Save

### `server/utils/save-game.ts`

```ts
export async function saveFinishedGame(userId: string, state: GameState) {
  // ... existing save logic ...

  // Check achievements
  const newAchievements = await checkAchievements(userId, gameId, state)

  return { gameId, newAchievements }
}
```

### `server/api/game/save.post.ts`

Return new achievements in response so the client can show toasts:

```ts
const { gameId, newAchievements } = await saveFinishedGame(userId, body.state)
return { gameId, newAchievements }
```

---

## API Endpoints

### `server/api/achievements/index.get.ts` (NEW)

```ts
// GET /api/achievements?player=Alice
// Returns all achievements (unlocked + locked with progress)

export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event)
  const query = getQuery(event)

  const unlocked = await db.select().from(achievements)
    .where(and(
      eq(achievements.userId, userId),
      query.player ? eq(achievements.playerName, query.player as string) : undefined,
    ))
    .orderBy(desc(achievements.unlockedAt))

  // Return full catalog with unlock status
  return {
    achievements: ACHIEVEMENT_CATALOG.map(a => ({
      ...a,
      unlocked: unlocked.find(u => u.type === a.id),
    }))
  }
})
```

---

## UI Components

### `app/components/AchievementToast.vue` (NEW)

Popup notification when achievement unlocked (shown after game ends):

```vue
<template>
  <Transition name="slide-up">
    <div v-if="show" class="achievement-toast">
      <div class="achievement-icon">{{ icon }}</div>
      <div>
        <div class="font-bold text-gold">Achievement Unlocked!</div>
        <div class="text-fg">{{ name }}</div>
      </div>
    </div>
  </Transition>
</template>
```

### `app/components/AchievementBadge.vue` (NEW)

Badge display for achievement gallery:

```vue
<template>
  <div class="achievement-badge" :class="{ locked: !unlocked }">
    <div class="badge-icon">{{ icon }}</div>
    <div class="badge-name">{{ name }}</div>
    <div v-if="unlocked" class="badge-date">{{ formatDate(unlockedAt) }}</div>
    <div v-else class="badge-progress">{{ progress }}</div>
  </div>
</template>
```

### Achievement Gallery

Add to `app/pages/stats.vue` or create `app/pages/achievements.vue`:

- Grid of achievement badges
- Unlocked badges: full color, with date
- Locked badges: dimmed/greyed out, with progress indicator
- Filter by player

---

## Files to Create

| File | Description |
|------|-------------|
| `server/utils/achievements.ts` | Achievement detection logic + catalog |
| `server/api/achievements/index.get.ts` | List achievements endpoint |
| `app/components/AchievementToast.vue` | Unlock notification toast |
| `app/components/AchievementBadge.vue` | Badge display component |

## Files to Modify

| File | Change |
|------|--------|
| `server/db/schema.ts` | Add `achievements` table |
| `server/utils/save-game.ts` | Call `checkAchievements()` after saving, return new achievements |
| `server/api/game/save.post.ts` | Return `newAchievements` in response |
| `app/composables/useGameState.ts` | Handle `newAchievements` from save response, show toasts |
| `app/pages/game.vue` | Show `AchievementToast` after game over when achievements unlocked |
| `app/pages/stats.vue` | Add achievements section/tab |

---

## Testing Strategy

1. **Detection**: Each achievement condition correctly identified
2. **Uniqueness**: Same achievement not awarded twice
3. **Bot exclusion**: Bot players don't earn achievements
4. **Historical checks**: Cumulative achievements (games_100) work correctly
5. **Toast display**: Shows after game over with correct data
6. **Gallery**: Shows locked/unlocked states correctly
