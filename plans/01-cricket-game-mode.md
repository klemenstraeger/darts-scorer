# Feature 01 — Cricket Game Mode

**Priority:** 1 (High) | **Effort:** Large | **Impact:** High
**Depends on:** Nothing (includes the engine refactor that unlocks all future game modes)

---

## Summary

Cricket is the second most popular darts game globally. This feature includes a foundational **engine refactor** to support multiple game modes, plus the full Cricket implementation.

### What is Cricket?

Players take turns throwing 3 darts at numbers **15, 16, 17, 18, 19, 20, and Bull**. Hit a number 3 times to "close" it. After closing, further hits on that number **score points** (the face value) — unless the opponent has also closed it. The game ends when one player has closed all 7 targets. The winner is the player with all targets closed AND the highest (or equal) score. If a player closes all targets but has fewer points, the game continues until they equalize or the opponent closes everything.

---

## Architecture: Engine Refactor

The current `GameEngine` class (`shared/game-engine.ts`) is monolithic and X01-specific. To support Cricket (and future modes like Around the Clock, Shanghai, etc.), we need a polymorphic engine system.

### New file structure

```
shared/
  engines/
    engine-interface.ts       # IGameEngine interface
    x01-engine.ts             # Extracted from current game-engine.ts (renamed)
    cricket-engine.ts         # NEW: Cricket scoring logic
    engine-factory.ts         # createEngine(mode) factory
  game-engine.ts              # DELETE (replaced by engines/)
  game-models.ts              # Extended with Cricket types
  game-events.ts              # Extended with Cricket events
  bot-engine.ts               # Extended with Cricket bot logic
```

### IGameEngine interface

```ts
// shared/engines/engine-interface.ts
import type { GameState, Multiplier, PlayerDescriptor, ThrowResult, CheckoutMode, GameMode } from '../game-models'

export interface IGameEngine {
  state: GameState
  newGame(mode: GameMode, players?: PlayerDescriptor[] | string[], ...args: any[]): GameState
  throw(dart: ThrowResult): GameState
  undoThrow(): GameState
  manualScore(segment: number, multiplier: Multiplier): GameState
  stopGame(): GameState
}
```

### Engine factory

```ts
// shared/engines/engine-factory.ts
import type { GameState } from '../game-models'
import { X01Engine } from './x01-engine'
import { CricketEngine } from './cricket-engine'

export function createEngine(state?: GameState): IGameEngine {
  if (!state) return new X01Engine()

  switch (state.mode) {
    case 'cricket':
      return new CricketEngine(state)
    case '501':
    case '301':
    default:
      return new X01Engine(state)
  }
}
```

---

## Model Changes

### `shared/game-models.ts`

```ts
// Extend GameMode
export type GameMode = '501' | '301' | 'cricket'

// Cricket-specific targets
export const CRICKET_TARGETS = [20, 19, 18, 17, 16, 15, 25] as const
export type CricketTarget = typeof CRICKET_TARGETS[number]

// Cricket player extends base Player
export interface CricketPlayerState {
  marks: Record<number, number>    // target → mark count (0–3+)
  cricket_score: number             // points scored from hitting closed numbers
}

// Extend GameState with optional cricket data
export interface GameState {
  mode: GameMode
  checkout: CheckoutMode
  legs_to_win: number
  sets_to_win: number
  players: Player[]
  current_player_index: number
  current_turn: Turn
  is_finished: boolean
  winner_index: number | null
  turn_history: Turn[]
  score_before_turn: number | null
  current_set_legs: number[]
  sets_won: number[]
  leg_starting_player: number
  // Cricket-specific (only present when mode === 'cricket')
  cricket?: {
    player_states: CricketPlayerState[]
  }
}
```

---

## Cricket Engine Implementation

### `shared/engines/cricket-engine.ts`

**Core logic:**

1. **`throw(dart)`**:
   - If `dart.segment` is not in `CRICKET_TARGETS` → dart is wasted (still recorded)
   - Count marks: `marks[segment] += multiplier` (a triple = 3 marks at once)
   - If marks > 3 AND opponent hasn't closed → score `(marks - 3) * segment_value`
   - If marks > 3 AND opponent has closed → no score (marks still cap display at 3)
   - After 3 darts → end turn

2. **`_checkWin()`**:
   - Player has all 7 targets closed (marks >= 3 each)
   - AND has score >= all opponents' scores
   - If closed all but behind on points → game continues

3. **`undoThrow()`**:
   - Reverse marks and score changes
   - Store `marks_before` and `cricket_score_before` on each turn for reliable undo

4. **`_startLeg()`**:
   - Reset all marks to 0, all cricket_scores to 0

**Turn structure for Cricket:**

```ts
export interface Turn {
  player_index: number
  throws: ThrowResult[]
  busted: boolean             // always false in Cricket (no bust concept)
  score_before: number | null // X01: score before turn. Cricket: cricket_score before turn
  // Cricket undo support
  marks_before?: Record<number, number>  // snapshot of marks at turn start
}
```

---

## UI Components

### `app/components/CricketScoreBoard.vue` (NEW)

A marks grid showing each player's progress:

```
         P1    P2
  20     X     /
  19    (X)
  18     /     X
  17           /
  16
  15     /
  Bull

  Score: 45    20
```

**Mark symbols:**
- 0 marks: empty
- 1 mark: `/` (single slash)
- 2 marks: `X` (cross)
- 3 marks: `(X)` (circled cross — closed)
- Closed by both: dimmed/strikethrough

### Display logic:
- Show 7 rows (20, 19, 18, 17, 16, 15, Bull)
- Column per player with mark indicator + optional point contribution
- Highlight current player's column
- Green glow on fully closed numbers
- Score totals at bottom

---

## Files to Create

| File | Description |
|------|-------------|
| `shared/engines/engine-interface.ts` | IGameEngine interface |
| `shared/engines/x01-engine.ts` | Extracted from `shared/game-engine.ts` |
| `shared/engines/cricket-engine.ts` | Cricket game logic |
| `shared/engines/engine-factory.ts` | `createEngine(mode)` factory |
| `app/components/CricketScoreBoard.vue` | Cricket marks grid UI |

## Files to Modify

| File | Change |
|------|--------|
| `shared/game-models.ts` | Add `'cricket'` to `GameMode`, add `CricketPlayerState`, extend `GameState` with `cricket?` field, extend `Turn` with `marks_before?` |
| `shared/game-events.ts` | Add `CRICKET_CLOSED` event type for when a number is closed |
| `shared/bot-engine.ts` | Add Cricket bot strategy (aim for unclosed targets, prioritize scoring when ahead) |
| `app/composables/useGameState.ts` | Replace `new GameEngine()` with `createEngine()` from factory |
| `app/stores/game.ts` | Extend `parseGameState()` to handle `cricket` field |
| `app/pages/index.vue` | Add Cricket to game mode options in step 2 |
| `app/components/GameSettingsPanel.vue` | Add `'cricket'` button to mode toggle. Hide checkout option when Cricket selected (Cricket has no checkout concept) |
| `app/pages/game.vue` | Conditional rendering: show `CricketScoreBoard` when `mode === 'cricket'`, show X01 score display otherwise |
| `server/utils/save-game.ts` | Handle Cricket player state when saving (store `marks` and `cricket_score` in game_data) |
| `server/db/schema.ts` | Add `gameData: jsonb('game_data')` nullable column to `games` table for mode-specific data |
| `app/composables/useBotPlay.ts` | Route to Cricket bot logic when mode is cricket |

## Migration

```sql
ALTER TABLE games ADD COLUMN game_data jsonb;
```

---

## Testing Strategy

1. **Unit tests** (`tests/cricket-engine.test.ts`):
   - Mark counting (single, double, triple)
   - Scoring after closing (only when opponent hasn't closed)
   - Win condition (all closed + highest score)
   - Win condition (all closed + tied score)
   - Continue condition (all closed but behind on points)
   - Undo across turns
   - Multi-player (2–4 players)
   - Leg/set progression

2. **Integration**:
   - Engine factory returns correct engine for each mode
   - localStorage persistence works with Cricket state
   - Game save correctly stores Cricket data in `game_data` column

---

## Cricket Bot Strategy

```ts
// Priority order for Cricket bot:
// 1. If behind on score and opponent has open targets → aim for opponent's open targets (to score)
// 2. If any unclosed targets → aim for highest unclosed target (20 first)
// 3. If all closed → aim for opponent's unclosed targets to score
// Bot accuracy uses existing segmentAccuracy/ringAccuracy from BotConfig
```

---

## Checkout Mode Interaction

Cricket does **not** use checkout modes (double_out/single_out). When Cricket is selected:
- Hide the checkout selector in `GameSettingsPanel.vue`
- Set checkout to `'single_out'` internally (unused but type-safe)
- Legs/sets still apply (multi-leg Cricket matches are valid)
