# Feature 13 — Team Tournaments

**Priority:** 17 (Low-Medium) | **Effort:** Large | **Impact:** Medium
**Depends on:** Nothing (builds on existing tournament infrastructure)

---

## Summary

Support for doubles and team play in tournaments. Teams consist of 2+ players. Matches can be singles-based (each team member plays one game) or doubles-based (alternating throws between partners).

---

## Database

### `server/db/schema.ts`

```ts
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.name),
])

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  playerName: text('player_name').notNull(),
  position: integer('position').notNull(), // throw order
}, (table) => [
  unique().on(table.teamId, table.playerName),
])
```

Extend `tournamentParticipants`:

```ts
export const tournamentParticipants = pgTable('tournament_participants', {
  // ... existing columns ...
  teamId: integer('team_id').references(() => teams.id, { onDelete: 'set null' }), // NEW: nullable
})
```

---

## Team Tournament Formats

### 1. Singles-based (World Cup style)
- Each team has N members
- Match = N individual games (each team member plays one)
- Winner = team with most individual game wins
- Optional: tiebreaker doubles game

### 2. Doubles (alternating throws)
- Two teams of 2 players each
- Partners alternate throws within each turn
- Player A throws dart 1, Player B throws dart 2, Player A throws dart 3
- Next turn: opponent team alternates similarly
- Existing `GameEngine` handles this by cycling through 4 players with custom turn logic

### 3. Team Round Robin
- Each team plays every other team
- Per-round: team members play 1v1 matches against corresponding opponent team members
- League points based on matches won

---

## Tournament Manager Changes

### `server/utils/tournament-manager.ts`

```ts
export async function createTeamTournament(
  userId: string,
  name: string,
  format: 'knockout' | 'league',
  teams: { name: string; members: string[] }[],
  gameSettings: GameSettings,
  teamMatchFormat: 'singles' | 'doubles',
) {
  // Create tournament
  const [tournament] = await db.insert(tournaments).values({
    userId, name, format,
    gameMode: gameSettings.mode,
    checkout: gameSettings.checkout,
    legsToWin: gameSettings.legsToWin,
    setsToWin: gameSettings.setsToWin,
    // New field needed in schema:
    // teamFormat: teamMatchFormat,
  }).returning()

  // Create teams and members
  for (const team of teams) {
    const [dbTeam] = await db.insert(teams).values({ userId, name: team.name }).returning()
    await db.insert(teamMembers).values(
      team.members.map((name, i) => ({ teamId: dbTeam.id, playerName: name, position: i }))
    )
    await db.insert(tournamentParticipants).values({
      tournamentId: tournament.id,
      playerName: team.name, // team name as participant
      seed: teams.indexOf(team) + 1,
      teamId: dbTeam.id,
    })
  }

  // Generate fixtures using existing scheduler (works with team names)
  await generateFixtures(tournament.id, format, teams.length)
}
```

### Match Start for Teams

When starting a team match, the system needs to know which players to include:

```ts
export async function startTeamMatch(tournamentId: number, matchId: number) {
  // Get match → get team names → get team members
  // For singles format: return list of individual games to play
  // For doubles format: return 4 players (2 per team) with alternating order
}
```

---

## UI Components

### `app/pages/teams.vue` (NEW)

Team management page:

```
┌──────────────────────────────────┐
│  My Teams                        │
│                                  │
│  ┌─ The Arrows ─────────────┐   │
│  │  Alice, Bob               │   │
│  │  [Edit] [Delete]          │   │
│  └───────────────────────────┘   │
│                                  │
│  ┌─ Bullseye Boys ──────────┐   │
│  │  Carol, Dave, Eve         │   │
│  │  [Edit] [Delete]          │   │
│  └───────────────────────────┘   │
│                                  │
│  [+ Create Team]                 │
└──────────────────────────────────┘
```

### `app/components/TeamPicker.vue` (NEW)

Used in tournament creation to select teams instead of players:

```vue
<template>
  <div>
    <div v-for="team in availableTeams" :key="team.id">
      <button @click="toggleTeam(team)" :class="{ selected: isSelected(team) }">
        {{ team.name }} ({{ team.members.join(', ') }})
      </button>
    </div>
  </div>
</template>
```

### Tournament Creation

Modify `app/pages/tournaments/new.vue`:
- Add toggle: "Individual" vs "Team" tournament
- When team mode: show `TeamPicker` instead of `PlayerPicker`
- Add team match format selector: "Singles" vs "Doubles"

---

## API Endpoints

### `server/api/teams/index.get.ts` (NEW)
List user's teams with members.

### `server/api/teams/index.post.ts` (NEW)
Create a new team with members.

### `server/api/teams/[id].put.ts` (NEW)
Update team name or members.

### `server/api/teams/[id].delete.ts` (NEW)
Delete a team.

---

## Files to Create

| File | Description |
|------|-------------|
| `app/pages/teams.vue` | Team management page |
| `app/components/TeamPicker.vue` | Team selection for tournaments |
| `server/api/teams/index.get.ts` | List teams |
| `server/api/teams/index.post.ts` | Create team |
| `server/api/teams/[id].put.ts` | Update team |
| `server/api/teams/[id].delete.ts` | Delete team |

## Files to Modify

| File | Change |
|------|--------|
| `server/db/schema.ts` | Add `teams`, `teamMembers` tables; add `teamId` to `tournamentParticipants` |
| `server/utils/tournament-manager.ts` | Add team tournament creation, team match start logic |
| `app/pages/tournaments/new.vue` | Add team tournament toggle, team picker |
| `app/pages/tournaments/[id].vue` | Show team names in brackets, handle team match start |
| `app/components/AppNav.vue` | Add "Teams" nav item |
| `app/components/tournament/MatchCard.vue` | Display team names and sub-match results |

---

## Doubles Throw Order

For doubles games (alternating throws between partners):

```ts
// Players array: [Team1-Player1, Team1-Player2, Team2-Player1, Team2-Player2]
// Turn order alternates: T1P1, T2P1, T1P2, T2P2, T1P1, ...
// Each player gets 3 darts per visit (standard)
// BUT within a single "team turn", partners alternate:
// T1P1 throws 1 dart, T1P2 throws 1 dart, T1P1 throws 1 dart (3 darts total for team)

// This requires extending the engine to support sub-turn player switching
// Simpler approach: each partner gets their own 3-dart turn, alternating
```

**Simpler approach chosen:** Each partner takes a full 3-dart turn, alternating. So the order is:
1. Team A - Player 1 (3 darts)
2. Team B - Player 1 (3 darts)
3. Team A - Player 2 (3 darts)
4. Team B - Player 2 (3 darts)
5. Repeat

This fits the existing engine's turn model without changes.

---

## Testing Strategy

1. **Team CRUD**: Create, update, delete teams
2. **Team tournament creation**: Generates correct fixtures with team names
3. **Singles match**: Individual games tracked under team match
4. **Doubles match**: 4-player game with correct turn order
5. **Standings**: Team-level points calculated from sub-match results
6. **Bracket**: Team names displayed correctly in knockout bracket
