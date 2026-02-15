# Feature 12 — Additional Game Variants

**Priority:** 16 (Medium) | **Effort:** Medium per variant | **Impact:** Medium
**Depends on:** Feature #1 (engine refactor for multi-mode architecture)

---

## Summary

Additional darts game variants that extend the multi-mode engine system. Each variant follows the same pattern: new engine in `shared/engines/`, new entry in `GameMode` type, game-specific UI component.

---

## Variant 1: Cut-Throat Cricket

### What is it?
A variant of Cricket where points scored go to **opponents who haven't closed that number**, not to yourself. Strategy flips: you want to close numbers to *protect* yourself from scoring, not to score.

### Rules
- Same closing mechanic as standard Cricket (hit 3 times to close)
- When you score on an open number: points go to each opponent who hasn't closed it
- Win condition: first to close all 7 targets wins (lowest score wins, since points are bad)
- If you close all targets: you win only if you have the lowest score

### Engine: `shared/engines/cutthroat-cricket-engine.ts`

```ts
// Extends CricketEngine logic but reverses scoring direction
throw(dart: ThrowResult): GameState {
  const target = dart.segment
  if (!CRICKET_TARGETS.includes(target)) { /* record and continue */ }

  const myState = this.state.cricket!.player_states[currentIdx]
  const newMarks = myState.marks[target] + dart.multiplier

  if (newMarks > 3 && myState.marks[target] < 3) {
    // Overflow marks: score goes to opponents who haven't closed
    const excessMarks = newMarks - 3
    const pointsPerMark = target === 25 ? 25 : target

    for (let i = 0; i < this.state.players.length; i++) {
      if (i === currentIdx) continue
      const opState = this.state.cricket!.player_states[i]
      if (opState.marks[target] < 3) {
        opState.cricket_score += excessMarks * pointsPerMark
      }
    }
  }

  myState.marks[target] = Math.min(newMarks, 3)
}
```

### GameMode addition
```ts
export type GameMode = '501' | '301' | 'cricket' | 'cutthroat-cricket' | ...
```

### UI
Reuse `CricketScoreBoard.vue` with a "lower score is better" indicator. Show scores in **red** (higher = worse for the player).

---

## Variant 2: 701 / 1001

### What is it?
Longer X01 games. Identical rules to 501/301 but starting from 701 or 1001.

### Implementation
Trivial — the `X01Engine` already parses `parseInt(mode)` to get the starting score. Just extend the `GameMode` type:

```ts
export type GameMode = '301' | '501' | '701' | '1001' | 'cricket' | ...
```

### Files changed
- `shared/game-models.ts` — extend `GameMode`
- `app/components/GameSettingsPanel.vue` — add 701, 1001 buttons to mode toggle
- No new engine needed!

---

## Variant 3: Shanghai

### What is it?
Each round, all players target a specific number (1 in round 1, 2 in round 2, etc., through 20). Score = sum of all hits on the target number (including multipliers). "Shanghai" (hitting a single, double, AND triple of the same number in one turn) = **instant win**.

### Rules
- 20 rounds
- Round N: target is number N
- 3 darts per turn
- Only darts hitting the target number score
- Score = face value × multiplier for hits on target
- **Shanghai**: Single + Double + Triple of the target in one turn = instant win
- After 20 rounds: highest total score wins

### Engine: `shared/engines/shanghai-engine.ts`

```ts
export class ShanghaiEngine implements IGameEngine {
  state: GameState & {
    shanghai: {
      round: number              // 1–20
      player_scores: number[]    // cumulative scores
      round_scores: number[][]   // per-round scores for each player
    }
  }

  throw(dart: ThrowResult): GameState {
    const targetNumber = this.state.shanghai.round
    const playerIdx = this.state.current_player_index

    if (dart.segment === targetNumber) {
      const points = dart.segment * dart.multiplier
      this.state.shanghai.player_scores[playerIdx] += points
    }
    // Non-target hits: recorded but score 0

    // Check for Shanghai (after all 3 darts)
    if (turnIsComplete(this.state.current_turn)) {
      if (this._isShanghai(this.state.current_turn, targetNumber)) {
        this._finishGame() // instant win!
      }
    }
  }

  _isShanghai(turn: Turn, target: number): boolean {
    const hits = turn.throws.filter(t => t.segment === target)
    const hasSingle = hits.some(t => t.multiplier === 1)
    const hasDouble = hits.some(t => t.multiplier === 2)
    const hasTriple = hits.some(t => t.multiplier === 3)
    return hasSingle && hasDouble && hasTriple
  }
}
```

### UI: `app/components/ShanghaiBoard.vue`
- Round indicator: "Round 7 — Target: 7"
- Per-player score table with per-round breakdown
- Shanghai alert animation on instant win

---

## Variant 4: Killer

### What is it?
Party game for 3+ players. Each player is assigned a random double. Hit your own double to become a "Killer". Then hit other players' doubles to take their lives. Last player standing wins.

### Rules
- Each player starts with 3 lives
- Phase 1: Each player throws to determine their assigned double (first double they hit)
- Phase 2: Hit your own double again to become a "Killer"
- Phase 3: As a Killer, hit other players' doubles to remove their lives
- Hitting your own double when already a Killer: lose a life!
- Player at 0 lives: eliminated
- Last player standing wins

### Engine: `shared/engines/killer-engine.ts`

```ts
export interface KillerPlayerState {
  assignedDouble: number | null   // null until determined
  isKiller: boolean
  lives: number
  eliminated: boolean
}

export class KillerEngine implements IGameEngine {
  state: GameState & {
    killer: {
      player_states: KillerPlayerState[]
      phase: 'assign' | 'play'
      startingLives: number
    }
  }

  throw(dart: ThrowResult): GameState {
    const myState = this.state.killer!.player_states[currentIdx]

    if (this.state.killer!.phase === 'assign') {
      // First double hit becomes assigned double
      if (dart.multiplier === 2 && dart.segment > 0) {
        myState.assignedDouble = dart.segment
        this._checkAllAssigned()
      }
    } else {
      // Play phase
      if (dart.multiplier === 2 && dart.segment > 0) {
        if (dart.segment === myState.assignedDouble) {
          if (myState.isKiller) {
            myState.lives-- // hit own double as killer = lose life
          } else {
            myState.isKiller = true // become killer
          }
        } else if (myState.isKiller) {
          // Hit someone else's double — they lose a life
          const victim = this.state.killer!.player_states.find(p => p.assignedDouble === dart.segment && !p.eliminated)
          if (victim) {
            victim.lives--
            if (victim.lives <= 0) victim.eliminated = true
          }
        }
      }
    }

    this._checkWin()
  }

  _checkWin() {
    const alive = this.state.killer!.player_states.filter(p => !p.eliminated)
    if (alive.length === 1) {
      this.state.winner_index = this.state.killer!.player_states.indexOf(alive[0])
      this._finishGame()
    }
  }
}
```

### UI: `app/components/KillerBoard.vue`
- Player cards with lives (hearts), assigned double, killer status
- Eliminated players shown as greyed out
- Dramatic elimination animation

---

## Files to Create (per variant)

| Variant | Engine File | UI Component |
|---------|-------------|--------------|
| Cut-Throat Cricket | `shared/engines/cutthroat-cricket-engine.ts` | Reuse `CricketScoreBoard.vue` with props |
| 701 / 1001 | None (reuse X01Engine) | None (reuse existing) |
| Shanghai | `shared/engines/shanghai-engine.ts` | `app/components/ShanghaiBoard.vue` |
| Killer | `shared/engines/killer-engine.ts` | `app/components/KillerBoard.vue` |

## Files to Modify (all variants)

| File | Change |
|------|--------|
| `shared/game-models.ts` | Extend `GameMode` type, add variant-specific state interfaces |
| `shared/engines/engine-factory.ts` | Add cases for each new variant |
| `app/components/GameSettingsPanel.vue` | Add variant buttons (group modes: X01, Cricket, Party Games) |
| `app/pages/game.vue` | Conditional rendering for each variant's board component |
| `app/stores/game.ts` | Extend `parseGameState()` for new state fields |

---

## Suggested Implementation Order

1. **701/1001** — trivial, just extend GameMode type
2. **Cut-Throat Cricket** — extends Cricket engine (after #1 Cricket is done)
3. **Shanghai** — standalone, medium complexity
4. **Killer** — party game, most complex (multi-phase, elimination)
