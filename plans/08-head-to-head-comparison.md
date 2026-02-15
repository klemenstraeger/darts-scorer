# Feature 08 — Head-to-Head Comparison Page

**Priority:** 10 (Low-Medium) | **Effort:** Small-Medium | **Impact:** Low-Medium
**Depends on:** Nothing (the trends API already returns basic H2H data)

---

## Summary

A dedicated page for deep rivalry analysis between two players. The existing `server/api/stats/trends.get.ts` already returns basic H2H data — this feature expands it with a full-page comparison UI and a more detailed API endpoint.

---

## API Endpoint

### `server/api/stats/head-to-head.get.ts` (NEW)

```ts
// GET /api/stats/head-to-head?player1=Alice&player2=Bob

export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event)
  const query = getQuery(event)
  const { player1, player2 } = query as { player1: string; player2: string }

  if (!player1 || !player2) throw createError({ statusCode: 400, message: 'Both players required' })

  // Find all games where both players participated
  const h2hGames = await db
    .select({
      gameId: games.id,
      mode: games.mode,
      winner: games.winnerName,
      totalTurns: games.totalTurns,
      createdAt: games.createdAt,
    })
    .from(games)
    .innerJoin(gamePlayers as gp1, and(eq(gp1.gameId, games.id), eq(gp1.playerName, player1)))
    .innerJoin(gamePlayers as gp2, and(eq(gp2.gameId, games.id), eq(gp2.playerName, player2)))
    .where(eq(games.userId, userId))
    .orderBy(desc(games.createdAt))

  // Compute stats
  const totalGames = h2hGames.length
  const player1Wins = h2hGames.filter(g => g.winner === player1).length
  const player2Wins = h2hGames.filter(g => g.winner === player2).length

  // Per-game averages (query turns for both players in H2H games)
  const gameIds = h2hGames.map(g => g.gameId)
  const turnStats = await db
    .select({
      gameId: turns.gameId,
      playerName: turns.playerName,
      totalPoints: turns.totalPoints,
      busted: turns.busted,
    })
    .from(turns)
    .where(and(
      inArray(turns.gameId, gameIds),
      inArray(turns.playerName, [player1, player2]),
    ))

  // Compute averages per player
  function computeAvg(name: string) {
    const playerTurns = turnStats.filter(t => t.playerName === name)
    const total = playerTurns.reduce((s, t) => s + t.totalPoints, 0)
    return playerTurns.length > 0 ? total / playerTurns.length * 3 : 0
  }

  // Recent form (last 5 H2H games)
  const recentForm = h2hGames.slice(0, 5).map(g => ({
    date: g.createdAt,
    winner: g.winner,
    mode: g.mode,
  }))

  // Best checkout in H2H games
  // ... query throws for checkout darts

  return {
    player1: {
      name: player1,
      wins: player1Wins,
      avgScore: computeAvg(player1),
      // bestCheckout, bestLeg, etc.
    },
    player2: {
      name: player2,
      wins: player2Wins,
      avgScore: computeAvg(player2),
    },
    totalGames,
    recentForm,
    gameHistory: h2hGames,
  }
})
```

---

## UI Page

### `app/pages/stats/head-to-head.vue` (NEW)

**Layout:**

```
┌──────────────────────────────────────────────┐
│           Head-to-Head                        │
│                                               │
│  [Player 1 ▼]        vs        [Player 2 ▼]  │  ← Player selectors
│                                               │
│  ┌─────────┐                  ┌─────────┐    │
│  │ Avatar  │     12 - 8      │ Avatar  │    │  ← Win record
│  │ Alice   │                  │ Bob     │    │
│  └─────────┘                  └─────────┘    │
│                                               │
│  ─── Stats Comparison ───                     │
│  3-Dart Avg  │████████░░│  78.2 vs 72.1      │  ← Bar comparison
│  Checkout %  │█████░░░░░│  45% vs 38%        │
│  Best Leg    │██████░░░░│  12 vs 15 darts    │
│  180s        │███░░░░░░░│  4 vs 2            │
│                                               │
│  ─── Performance Over Time ───                │
│  [Line chart: both players' avg overlaid]     │
│                                               │
│  ─── Recent Games ───                         │
│  Jan 15  Alice  3-1  Bob  (501)               │
│  Jan 12  Bob    2-3  Alice (301)              │
│  Jan 10  Alice  1-0  Bob  (501)               │
└──────────────────────────────────────────────┘
```

**Components reused:**
- `StatsBarChart.vue` — side-by-side comparison bars
- `StatsLineChart.vue` — overlaid performance trends (two series)
- `PlayerAvatar.vue` — player identity display

**New component:**

### `app/components/stats/ComparisonBar.vue` (NEW)

```vue
<!-- Horizontal bar showing relative stats -->
<template>
  <div class="comparison-row">
    <span class="value left">{{ leftValue }}</span>
    <div class="bar-track">
      <div class="bar left" :style="{ width: leftPct + '%' }" />
      <div class="bar right" :style="{ width: rightPct + '%' }" />
    </div>
    <span class="value right">{{ rightValue }}</span>
  </div>
</template>
```

---

## Player Selection

The player selectors should:
- Load from `/api/players` (existing endpoint)
- Show player avatars in dropdown
- Pre-fill from URL query params: `/stats/head-to-head?p1=Alice&p2=Bob`
- Update URL when selection changes (for shareable links)

---

## Files to Create

| File | Description |
|------|-------------|
| `server/api/stats/head-to-head.get.ts` | Detailed H2H stats endpoint |
| `app/pages/stats/head-to-head.vue` | Full comparison page |
| `app/components/stats/ComparisonBar.vue` | Side-by-side stat bar |

## Files to Modify

| File | Change |
|------|--------|
| `app/pages/stats.vue` | Add link/button to H2H page |
| `app/components/AppNav.vue` | Optional: add H2H as sub-nav item under Stats |

---

## Testing Strategy

1. **API**: Returns correct win counts, averages for two specific players
2. **No games**: Handles case where players have never played each other
3. **Self comparison**: Handle (or prevent) comparing a player with themselves
4. **Auth**: Only returns user's own games
5. **UI**: Comparison bars scale correctly to relative values
