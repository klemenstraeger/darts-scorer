# Feature 05 — Game Replay Viewer

**Priority:** 6 (Medium) | **Effort:** Medium | **Impact:** Medium
**Depends on:** Nothing (the `turns` and `throws` tables already store all dart data)

---

## Summary

Replay completed games dart-by-dart with an interactive timeline, dartboard visualization, and animated score updates. The database already stores every individual dart throw — this feature surfaces that data in a compelling visual format.

---

## Data Source

The existing schema already has everything needed:

- `turns` table: `game_id`, `turn_number`, `player_name`, `total_points`, `busted`
- `throws` table (via `dartsThrows`): `turn_id`, `throw_number`, `segment`, `multiplier`, `points`
- `games` table: `mode`, `winner_name`
- `game_players` table: `player_name`, `position`, `final_score`

---

## API Endpoint

### `server/api/game/[id]/replay.get.ts` (NEW)

```ts
// GET /api/game/123/replay
// Returns full game data with ordered turns and throws

export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event)
  const gameId = parseInt(getRouterParam(event, 'id')!)

  // Verify game belongs to user
  const [game] = await db.select().from(games)
    .where(and(eq(games.id, gameId), eq(games.userId, userId)))

  if (!game) throw createError({ statusCode: 404 })

  // Get players
  const playersList = await db.select().from(gamePlayers)
    .where(eq(gamePlayers.gameId, gameId))
    .orderBy(asc(gamePlayers.position))

  // Get all turns with throws, ordered
  const turnsList = await db.select().from(turns)
    .where(eq(turns.gameId, gameId))
    .orderBy(asc(turns.turnNumber))

  const turnsWithThrows = await Promise.all(turnsList.map(async (turn) => {
    const throwsList = await db.select().from(dartsThrows)
      .where(eq(dartsThrows.turnId, turn.id))
      .orderBy(asc(dartsThrows.throwNumber))

    return { ...turn, throws: throwsList }
  }))

  return {
    game,
    players: playersList,
    turns: turnsWithThrows,
  }
})
```

---

## Replay Page

### `app/pages/game/[id]/replay.vue` (NEW)

**Layout:**

```
┌──────────────────────────────────┐
│  Player 1: 501    Player 2: 501 │  ← Score display (updates live)
├──────────────────────────────────┤
│                                  │
│          [Dartboard]             │  ← Shows where darts landed this turn
│     (read-only DartBoard.vue)    │
│                                  │
├──────────────────────────────────┤
│  Turn 3/24 │ Alice │ T20 T20 T1 │  ← Current turn info
├──────────────────────────────────┤
│  [|<] [<] [▶/❚❚] [>] [>|]      │  ← Controls
│  ───────────●────────────────    │  ← Timeline scrubber
│  Speed: [1x] [2x] [4x]         │
└──────────────────────────────────┘
```

**Implementation approach:**

```ts
const { data: replay } = await useFetch(`/api/game/${route.params.id}/replay`)

// Replay state
const currentTurnIndex = ref(0)
const currentDartIndex = ref(0)  // within current turn
const isPlaying = ref(false)
const speed = ref(1)  // 1x, 2x, 4x

// Reconstruct scores at current position using GameEngine
const reconstructedState = computed(() => {
  // Feed throws into a new GameEngine up to currentTurnIndex + currentDartIndex
  const engine = createEngine()
  engine.newGame(replay.value.game.mode, replay.value.players.map(p => p.playerName))

  for (let t = 0; t <= currentTurnIndex.value; t++) {
    const turn = replay.value.turns[t]
    const maxDarts = t === currentTurnIndex.value ? currentDartIndex.value : turn.throws.length
    for (let d = 0; d < maxDarts; d++) {
      const dart = turn.throws[d]
      engine.throw({ segment: dart.segment, multiplier: dart.multiplier })
    }
  }

  return engine.state
})

// Playback timer
function startPlayback() {
  isPlaying.value = true
  playNextDart()
}

function playNextDart() {
  if (!isPlaying.value) return

  // Advance to next dart
  const turn = replay.value.turns[currentTurnIndex.value]
  if (currentDartIndex.value < turn.throws.length) {
    currentDartIndex.value++
  } else {
    // Next turn
    if (currentTurnIndex.value < replay.value.turns.length - 1) {
      currentTurnIndex.value++
      currentDartIndex.value = 0
      // Pause between turns
      setTimeout(playNextDart, 1500 / speed.value)
      return
    } else {
      isPlaying.value = false
      return
    }
  }

  setTimeout(playNextDart, 800 / speed.value)
}
```

---

## Dartboard Visualization

Reuse the existing `DartBoard.vue` in **read-only mode** with dart position indicators:

```vue
<DartBoard
  :disabled="true"
  :highlight-segments="currentTurnDarts"
/>
```

Add to `DartBoard.vue`:
- New prop `highlightSegments: { segment: number, multiplier: number }[]`
- Render small dart markers (circles/dots) on the corresponding board segments
- Animate darts appearing one by one during playback

---

## Replay Controls Component

### `app/components/ReplayControls.vue` (NEW)

```vue
<template>
  <div class="replay-controls">
    <div class="flex items-center gap-md">
      <button @click="goToStart">|&lt;</button>
      <button @click="stepBack">&lt;</button>
      <button @click="togglePlay">{{ isPlaying ? '❚❚' : '▶' }}</button>
      <button @click="stepForward">&gt;</button>
      <button @click="goToEnd">&gt;|</button>
    </div>

    <!-- Timeline scrubber -->
    <input
      type="range"
      :min="0"
      :max="totalDarts"
      :value="currentPosition"
      @input="seekTo($event.target.value)"
    />

    <!-- Speed selector -->
    <div class="flex gap-xs">
      <button v-for="s in [1, 2, 4]" :key="s"
        :class="{ active: speed === s }"
        @click="speed = s"
      >{{ s }}x</button>
    </div>
  </div>
</template>
```

---

## Entry Point: Game History

Add replay button to the game history list (existing in `app/pages/stats.vue` or a separate history page):

```vue
<NuxtLink :to="`/game/${game.id}/replay`" class="btn btn-secondary btn-sm">
  Replay
</NuxtLink>
```

---

## Files to Create

| File | Description |
|------|-------------|
| `server/api/game/[id]/replay.get.ts` | Replay data endpoint |
| `app/pages/game/[id]/replay.vue` | Replay viewer page |
| `app/components/ReplayControls.vue` | Playback controls + timeline |

## Files to Modify

| File | Change |
|------|--------|
| `app/components/DartBoard.vue` | Add `highlightSegments` prop for showing dart positions |
| `app/pages/stats.vue` | Add "Replay" link to game history entries |

---

## Testing Strategy

1. **API**: Returns correct ordered turns and throws for a game
2. **Replay logic**: Score reconstruction matches final scores at each step
3. **Controls**: Play/pause, step forward/back, speed changes
4. **Edge cases**: Busted turns, checkout turns, multi-leg games
5. **Auth**: Can only replay own games

---

## Performance Considerations

- For long games (50+ turns), the `GameEngine` reconstruction runs in O(n) time — acceptable for client-side
- Lazy-load the replay page to avoid bundling `GameEngine` on initial load
- Cache replay data in the component (single fetch on mount)
