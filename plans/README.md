# Darts Scorer — Feature Plans

Each file below contains a self-contained implementation plan with architecture decisions, file lists, code snippets, and testing strategies.

## Priority Order

| # | Feature | Plan | Effort | Impact | Dependencies |
|---|---------|------|--------|--------|--------------|
| 1 | Cricket Game Mode (+ engine refactor) | [01-cricket-game-mode.md](./01-cricket-game-mode.md) | Large | High | None (unlocks #2, #6, #12) |
| 2 | Sound Effects & Haptics | [10-sound-effects-haptics.md](./10-sound-effects-haptics.md) | Small | High | None |
| 3 | Announcer Voice | [18-announcer-voice.md](./18-announcer-voice.md) | Small | High | None |
| 4 | Elo Rating System | [03-elo-rating-system.md](./03-elo-rating-system.md) | Small-Med | Medium | None |
| 5 | Achievements / Milestones | [07-achievements.md](./07-achievements.md) | Medium | Medium | None |
| 6 | Game Replay Viewer | [05-game-replay-viewer.md](./05-game-replay-viewer.md) | Medium | Medium | None |
| 7 | Practice Modes | [06-practice-modes.md](./06-practice-modes.md) | Large | High | #1 (engine refactor) |
| 8 | Around the Clock | [02-around-the-clock.md](./02-around-the-clock.md) | Medium | Medium | #1 (engine refactor) |
| 9 | Statistics Export | [04-statistics-export.md](./04-statistics-export.md) | Small | Low-Med | None |
| 10 | Head-to-Head Comparison | [08-head-to-head-comparison.md](./08-head-to-head-comparison.md) | Small-Med | Low-Med | None |
| 11 | Onboarding Tour | [16-onboarding-tour.md](./16-onboarding-tour.md) | Small | Medium | None |
| 12 | Dartboard Themes | [17-dartboard-themes.md](./17-dartboard-themes.md) | Small | Low | None |
| 13 | PWA Quick-Start Widget | [19-pwa-quick-start-widget.md](./19-pwa-quick-start-widget.md) | Small | Low-Med | None |
| 14 | League Fixtures & Scheduling | [09-league-fixtures-scheduling.md](./09-league-fixtures-scheduling.md) | Small-Med | Low | None |
| 15 | Online Multiplayer | [11-online-multiplayer.md](./11-online-multiplayer.md) | Large | High | None |
| 16 | Additional Game Variants | [12-additional-game-variants.md](./12-additional-game-variants.md) | Med/variant | Medium | #1 (engine refactor) |
| 17 | Team Tournaments | [13-team-tournaments.md](./13-team-tournaments.md) | Large | Medium | None |
| 18 | Social Features | [15-social-features.md](./15-social-features.md) | Large | Medium | #11 (online multiplayer) |
| 19 | Camera Auto-Detection | [14-camera-auto-detection.md](./14-camera-auto-detection.md) | Very Large | High (R&D) | None |

## Dependency Graph

```
#1 Cricket (engine refactor)
 ├── #2 Around the Clock
 ├── #6 Practice Modes
 └── #12 Additional Game Variants (Cut-throat Cricket, Shanghai, Killer)

#11 Online Multiplayer
 └── #15 Social Features (challenges require online play)

All others are independent.
```

## Quick Wins (Small effort, can ship fast)

- **#10 Sound Effects** — composable + sound files
- **#18 Announcer Voice** — Web Speech API, zero dependencies
- **#17 Dartboard Themes** — CSS color mapping
- **#19 PWA Quick-Start** — 1 page + manifest update
- **#4 Stats Export** — 1 API endpoint + download button

## Shared Infrastructure

Several features share common infrastructure that should be built once:

| Component | Used by |
|-----------|---------|
| `useSettings.ts` composable | #10, #17, #18, #19 |
| Engine refactor (`IGameEngine` + factory) | #1, #2, #6, #12 |
| `game_data` jsonb column on `games` table | #1, #2, #6, #12 |
