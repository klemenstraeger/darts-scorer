# Feature 06 — Practice Modes

**Priority:** 7 (Medium) | **Effort:** Large | **Impact:** High
**Depends on:** Feature #1 (engine refactor for multi-mode architecture)

---

## Summary

Dedicated training routines with their own tracking and stats. Three popular practice games from the darts community: **Double Training**, **Checkout Practice**, and **Bob's 27**.

---

## Practice Games

### 1. Double Training

**Rules:**
- Hit each double in order: D1, D2, D3, ... D20, D-Bull
- 3 darts per round
- Hit the current target double to advance
- Miss all 3 → move to next target anyway (record as failed)
- Score = total darts thrown to complete (lower is better)
- Alternate metric: doubles hit out of 21 attempts

### 2. Checkout Practice

**Rules:**
- System generates random checkout scores (2–170)
- Player has 3/6/9 darts to hit the checkout (configurable)
- Success → new checkout generated
- Fail → new checkout generated, record as missed
- Track: attempts, successes, success rate %
- Session length: configurable (10, 20, 50 checkouts)

### 3. Bob's 27

**Rules:**
- Start with 27 points
- 21 rounds: target doubles D1, D2, ... D20, D-Bull
- Each round: throw 3 darts at the target double
- **Hit**: add double value to score (e.g., hit D5 = +10)
- **Miss all 3**: subtract double value from score (e.g., miss D5 = -10)
- If score drops to 0 or below → bust, game over
- Score = final score after all 21 rounds (higher is better)
- Perfect score = 27 + sum of all doubles×2 = 27 + 2(2+4+...+40+50) = 27 + 2(470) = 967

---

## Database

### `server/db/schema.ts`

```ts
export const practiceSessions = pgTable('practice_sessions', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  playerName: text('player_name').notNull(),
  practiceType: text('practice_type').notNull(), // 'double_training' | 'checkout_practice' | 'bobs_27'
  score: integer('score').notNull(),              // Final score/metric
  metadata: jsonb('metadata'),                    // Type-specific data (rounds, hit details)
  completed: boolean('completed').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

**Metadata examples:**

```ts
// Double Training
{ totalDarts: 45, doublesHit: 18, doublesAttempted: 21, perDouble: { 1: true, 2: false, ... } }

// Checkout Practice
{ attempts: 20, successes: 14, checkouts: [{ target: 40, hit: true, darts: 2 }, ...] }

// Bob's 27
{ finalScore: 327, rounds: [{ target: 'D1', hit: true, score: 29 }, ...], busted: false }
```

---

## Engine: Practice Engines

### `shared/engines/practice-engine.ts` (NEW)

Base class with practice-specific behavior (no legs/sets/checkout):

```ts
export class DoubleTrainingEngine implements IGameEngine {
  state: GameState & {
    practice: {
      type: 'double_training'
      currentTarget: number       // 1–20, then 25 (Bull)
      doublesHit: boolean[]       // 21 entries
      totalDarts: number
      round: number               // 0–20
    }
  }

  throw(dart: ThrowResult): GameState {
    this.state.practice.totalDarts++

    // Check if dart hit the target double
    if (dart.segment === this.state.practice.currentTarget && dart.multiplier === 2) {
      this.state.practice.doublesHit[this.state.practice.round] = true
      this._advance()
    }

    // After 3 darts, advance regardless
    if (turnIsComplete(this.state.current_turn)) {
      if (!this.state.practice.doublesHit[this.state.practice.round]) {
        this._advance() // missed all 3, move on
      }
      this._endTurn()
    }
  }

  _advance() {
    this.state.practice.round++
    if (this.state.practice.round >= 21) {
      this._finishGame()
    } else {
      this.state.practice.currentTarget = this._targetForRound(this.state.practice.round)
    }
  }

  _targetForRound(round: number): number {
    return round < 20 ? round + 1 : 25 // D1–D20, then DBull
  }
}
```

```ts
export class Bobs27Engine implements IGameEngine {
  state: GameState & {
    practice: {
      type: 'bobs_27'
      currentScore: number     // starts at 27
      round: number            // 0–20
      currentTarget: number    // D1–D20, DBull
      roundHits: number        // hits in current round
      rounds: { target: number, hits: number, scoreAfter: number }[]
    }
  }

  throw(dart: ThrowResult): GameState {
    if (dart.segment === this.state.practice.currentTarget && dart.multiplier === 2) {
      this.state.practice.roundHits++
      this.state.practice.currentScore += dart.segment * 2 // double value
    }

    if (turnIsComplete(this.state.current_turn)) {
      if (this.state.practice.roundHits === 0) {
        // Missed all 3 darts → subtract double value
        this.state.practice.currentScore -= this.state.practice.currentTarget * 2
      }

      this.state.practice.rounds.push({
        target: this.state.practice.currentTarget,
        hits: this.state.practice.roundHits,
        scoreAfter: this.state.practice.currentScore,
      })

      // Check bust
      if (this.state.practice.currentScore <= 0) {
        this._finishGame() // busted
        return this.state
      }

      this._advance()
      this._endTurn()
    }
  }
}
```

---

## UI Components

### `app/pages/practice.vue` (NEW)

Practice mode selection screen:

```
┌─────────────────────────────┐
│      Practice Modes         │
│                             │
│  [Double Training]          │
│  Hit all 21 doubles         │
│                             │
│  [Checkout Practice]        │
│  Random checkout drills     │
│                             │
│  [Bob's 27]                 │
│  Classic scoring game       │
│                             │
│  ─── Your Best Scores ───   │
│  Bob's 27: 327 (Jan 15)    │
│  Doubles: 18/21 (Jan 14)   │
│  Checkout: 72% (Jan 13)    │
└─────────────────────────────┘
```

### Practice-specific game displays:

**Double Training:**
- Grid of 21 targets (D1–D20, DBull)
- Green check for hit, red X for missed, gold highlight for current
- Dart count in center

**Bob's 27:**
- Current score (large, prominent)
- Round indicator (D1, D2, ... D20, DBull)
- Score graph (line chart showing score progression over rounds)
- Hit indicator for current round

**Checkout Practice:**
- Large display of current checkout target (e.g., "108")
- Checkout path hint (optional, toggleable)
- Success counter: "14/20"
- Success rate percentage

---

## API Endpoints

### `server/api/practice/save.post.ts` (NEW)

```ts
export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event)
  const body = await readBody(event)

  await db.insert(practiceSessions).values({
    userId,
    playerName: body.playerName,
    practiceType: body.practiceType,
    score: body.score,
    metadata: body.metadata,
    completed: body.completed ?? true,
  })

  return { success: true }
})
```

### `server/api/practice/stats.get.ts` (NEW)

```ts
// Returns per-practice-type stats:
// - Best scores
// - Average scores
// - Sessions count
// - Improvement trend
```

---

## Files to Create

| File | Description |
|------|-------------|
| `shared/engines/practice-engine.ts` | Double Training, Checkout Practice, Bob's 27 engines |
| `app/pages/practice.vue` | Practice mode selection + play |
| `app/components/DoubleTrainingBoard.vue` | Double training progress display |
| `app/components/Bobs27Board.vue` | Bob's 27 score + round display |
| `app/components/CheckoutPracticeBoard.vue` | Checkout drill display |
| `server/api/practice/save.post.ts` | Save practice session |
| `server/api/practice/stats.get.ts` | Practice-specific stats |

## Files to Modify

| File | Change |
|------|--------|
| `server/db/schema.ts` | Add `practiceSessions` table |
| `shared/game-models.ts` | Add practice mode types to `GameMode` or separate `PracticeMode` type |
| `shared/engines/engine-factory.ts` | Route practice modes to correct engine |
| `app/pages/index.vue` | Add "Practice" button alongside Quick Game |
| `app/components/AppNav.vue` | Add "Practice" nav item |

---

## Home Page Integration

Add a prominent "Practice" button on the home page:

```vue
<!-- After the wizard, before or alongside it -->
<NuxtLink to="/practice" class="practice-btn">
  Practice
  <span class="hint">Training drills & Bob's 27</span>
</NuxtLink>
```

---

## Testing Strategy

1. **Bob's 27**: Score calculation, bust detection, round progression
2. **Double Training**: Target advancement, hit/miss tracking, completion
3. **Checkout Practice**: Random generation in valid range, success tracking
4. **Undo**: Each practice mode supports undo correctly
5. **Save**: Practice sessions stored with correct metadata
6. **Stats**: Aggregation returns correct bests and averages
