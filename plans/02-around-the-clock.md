# Feature 02 — Around the Clock

**Priority:** 8 (Medium) | **Effort:** Medium | **Impact:** Medium
**Depends on:** Feature #1 (engine refactor for multi-mode architecture)

---

## Summary

Around the Clock (also called "Round the Board") is a popular practice/casual game. Players must hit numbers **1 through 20, then Bull**, in sequential order. First player to complete the sequence wins. Simple rules but great for training accuracy across all board segments.

---

## Rules

- Each turn: throw 3 darts
- Current target starts at 1
- Any hit on the current target number advances to the next (regardless of multiplier)
- A **double** of the target advances by **2** targets (e.g., D3 at target 3 → skip to 5)
- A **triple** of the target advances by **3** targets
- Misses (wrong segment or miss) are wasted
- After hitting 20, the final target is **Bull** (single or double)
- First player to hit Bull (after clearing 1–20) wins
- Score displayed = total darts thrown (lower is better)

**Variant option:** "Strict mode" — only singles count (no double/triple advancement). Configurable in settings.

---

## Model Changes

### `shared/game-models.ts`

```ts
export type GameMode = '501' | '301' | 'cricket' | 'around-the-clock'

export interface AroundTheClockPlayerState {
  current_target: number    // 1–20, then 25 for Bull
  targets_hit: number[]     // ordered list of targets completed
  total_darts: number       // total darts thrown (the "score")
}

// Extend GameState
export interface GameState {
  // ... existing fields ...
  around_the_clock?: {
    player_states: AroundTheClockPlayerState[]
    strict_mode: boolean    // if true, only singles count
  }
}
```

---

## Engine Implementation

### `shared/engines/around-the-clock-engine.ts`

```ts
export class AroundTheClockEngine implements IGameEngine {
  state: GameState

  newGame(mode, players, checkout, legsToWin, setsToWin, strictMode = false) {
    // Initialize all players with current_target = 1, total_darts = 0
  }

  throw(dart: ThrowResult): GameState {
    const playerState = this.state.around_the_clock!.player_states[this.state.current_player_index]
    playerState.total_darts++

    if (dart.segment === playerState.current_target) {
      // Hit! Advance by multiplier amount (or 1 in strict mode)
      const advance = this.state.around_the_clock!.strict_mode ? 1 : dart.multiplier
      for (let i = 0; i < advance; i++) {
        playerState.targets_hit.push(playerState.current_target)
        playerState.current_target = this._nextTarget(playerState.current_target)
        if (playerState.current_target === 0) break // completed!
      }
    }

    // Check win: current_target === 0 means all done (hit Bull)
    if (playerState.current_target === 0) {
      this._winLeg()
      return this.state
    }

    // Auto-end turn after 3 darts
    if (turnIsComplete(this.state.current_turn)) {
      this._endTurn()
    }

    return this.state
  }

  _nextTarget(current: number): number {
    if (current < 20) return current + 1
    if (current === 20) return 25  // Bull
    return 0  // completed
  }
}
```

**Undo logic:**
- Store `target_before` and `targets_hit_before` on each turn
- On undo, restore previous target state

---

## UI Components

### `app/components/AroundTheClockBoard.vue` (NEW)

Visual progress display showing the 1–20 + Bull sequence:

```
  Current Target: [ 7 ]

  [1] [2] [3] [4] [5] [6]  ← completed (green, checked)
  [7]                        ← current (gold, pulsing)
  [8] [9] ... [20] [Bull]   ← remaining (dimmed)

  Darts thrown: 18
```

**Layout:**
- Circular/grid layout of numbered circles
- Completed targets: filled green with checkmark
- Current target: gold border, pulsing glow
- Remaining: dimmed/muted
- Center displays current target number prominently
- Bottom shows total darts thrown per player

---

## Files to Create

| File | Description |
|------|-------------|
| `shared/engines/around-the-clock-engine.ts` | ATC game logic |
| `app/components/AroundTheClockBoard.vue` | Progress visualization |

## Files to Modify

| File | Change |
|------|--------|
| `shared/game-models.ts` | Add `'around-the-clock'` to `GameMode`, add `AroundTheClockPlayerState` |
| `shared/engines/engine-factory.ts` | Add `case 'around-the-clock'` to factory |
| `shared/game-events.ts` | Add `TARGET_HIT` event for advancing |
| `shared/bot-engine.ts` | Add ATC bot logic (aim for current target) |
| `app/components/GameSettingsPanel.vue` | Add ATC mode button. Hide checkout when ATC selected. Add "Strict Mode" toggle when ATC selected |
| `app/pages/game.vue` | Show `AroundTheClockBoard` when mode is ATC |
| `app/pages/index.vue` | Add ATC to mode selector |
| `app/stores/game.ts` | Extend `parseGameState()` for ATC fields |
| `server/utils/save-game.ts` | Store ATC state in `game_data` jsonb column |

---

## Bot Strategy

```
// ATC bot: simply aim for current target number
// segmentAccuracy determines hit rate
// On hit, advance. On miss, wasted dart.
// No complex strategy needed — just accuracy simulation.
```

---

## Settings Panel Interaction

When "Around the Clock" is selected:
- Hide Checkout selector (not applicable)
- Show "Strict Mode" toggle (doubles/triples count as 1 vs multiplier advancement)
- Legs/Sets still available (multi-leg ATC matches)

---

## Scoring/Stats

- Primary metric: **total darts thrown** (lower = better)
- Stats page: track best (fewest darts) ATC completion
- Save to `games` table with `mode = 'around-the-clock'`, `game_data` contains final target states

---

## Testing Strategy

1. Sequential target advancement (1→2→...→20→Bull)
2. Double/triple advancement (D5 at target 5 → skip to 7)
3. Strict mode (only advance by 1)
4. Overflow handling (T19 at target 19 → 20→Bull→done in one throw)
5. Win detection after hitting Bull
6. Multi-player turn alternation
7. Undo restores target correctly
8. Leg/set progression
