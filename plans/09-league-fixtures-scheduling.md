# Feature 09 — League Fixtures & Scheduling

**Priority:** 14 (Low) | **Effort:** Small-Medium | **Impact:** Low
**Depends on:** Nothing (builds on existing tournament infrastructure)

---

## Summary

Add date/time scheduling to tournament fixtures, a fixture calendar view, and an enhanced league standings table. The tournament scheduler (`server/utils/tournament-scheduler.ts`) already generates round-robin fixtures — this feature adds temporal scheduling and better visualization.

---

## Database Changes

### `server/db/schema.ts`

```ts
// Add to tournamentMatches table
export const tournamentMatches = pgTable('tournament_matches', {
  // ... existing columns ...
  scheduledAt: timestamp('scheduled_at'),  // NEW: when this match is scheduled to play
})
```

**Migration:**
```sql
ALTER TABLE tournament_matches ADD COLUMN scheduled_at timestamp;
```

---

## Scheduling Logic

### `server/utils/tournament-manager.ts`

Add `scheduleFixtures()` method:

```ts
export async function scheduleFixtures(
  tournamentId: number,
  startDate: Date,
  intervalDays: number = 7,  // default: weekly
  matchesPerDay: number = 4, // max matches per scheduled date
) {
  const matches = await db.select().from(tournamentMatches)
    .where(eq(tournamentMatches.tournamentId, tournamentId))
    .orderBy(asc(tournamentMatches.round), asc(tournamentMatches.position))

  let currentDate = new Date(startDate)
  let matchesOnCurrentDay = 0

  for (const match of matches) {
    await db.update(tournamentMatches)
      .set({ scheduledAt: currentDate })
      .where(eq(tournamentMatches.id, match.id))

    matchesOnCurrentDay++
    if (matchesOnCurrentDay >= matchesPerDay) {
      matchesOnCurrentDay = 0
      currentDate = new Date(currentDate.getTime() + intervalDays * 24 * 60 * 60 * 1000)
    }
  }
}
```

### API endpoint for scheduling

### `server/api/tournament/[id]/schedule.post.ts` (NEW)

```ts
export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event)
  const tournamentId = parseInt(getRouterParam(event, 'id')!)
  const body = await readBody(event)

  // Verify tournament belongs to user
  // ...

  await scheduleFixtures(
    tournamentId,
    new Date(body.startDate),
    body.intervalDays ?? 7,
    body.matchesPerDay ?? 4,
  )

  return { success: true }
})
```

---

## UI Components

### `app/components/FixtureCalendar.vue` (NEW)

A calendar/list view showing upcoming and past fixtures grouped by date:

```
┌──────────────────────────────────┐
│  Upcoming Fixtures               │
│                                  │
│  ── Monday, Jan 20 ──           │
│  7:00 PM  Alice vs Bob      ●   │  ← pending
│  7:30 PM  Carol vs Dave     ●   │
│                                  │
│  ── Monday, Jan 27 ──           │
│  7:00 PM  Alice vs Carol    ●   │
│  7:30 PM  Bob vs Dave       ✓   │  ← completed
│                                  │
│  ── Monday, Feb 3 ──            │
│  7:00 PM  Alice vs Dave     ●   │
│  7:30 PM  Bob vs Carol      ●   │
└──────────────────────────────────┘
```

**Features:**
- Group matches by scheduled date
- Status indicator: pending (dot), in_progress (pulse), completed (check)
- Score display for completed matches
- Click to start match (links to existing match start flow)
- "Reschedule" button per match (date picker)

### `app/components/LeagueTable.vue` (ENHANCE existing StandingsTable)

Enhance the existing `StandingsTable.vue` with sortable columns:

| # | Player | P | W | L | F | A | +/- | Pts |
|---|--------|---|---|---|---|---|-----|-----|
| 1 | Alice  | 3 | 2 | 1 | 7 | 4 | +3  | 6   |
| 2 | Bob    | 3 | 2 | 1 | 6 | 5 | +1  | 6   |

(P=Played, W=Won, L=Lost, F=Legs For, A=Legs Against, +/-=Difference, Pts=Points)

- Click column header to sort
- Highlight promotion/relegation zones (if configured)
- Current user's players highlighted

---

## Tournament Detail Page Integration

### `app/pages/tournaments/[id].vue`

Add "Fixtures" tab alongside existing tabs (Bracket, Standings, Matches):

```vue
<div class="tabs">
  <button :class="{ active: tab === 'fixtures' }" @click="tab = 'fixtures'">Fixtures</button>
  <!-- existing tabs -->
</div>

<FixtureCalendar
  v-if="tab === 'fixtures'"
  :matches="tournament.matches"
  :tournament-id="tournament.id"
/>
```

Add scheduling controls:

```vue
<!-- Schedule Fixtures button (only for league/group format) -->
<div v-if="tournament.format === 'league' || tournament.format === 'group_only'">
  <button @click="showScheduleModal = true">Schedule Fixtures</button>

  <!-- Modal: Start date picker + interval + matches per day -->
  <div v-if="showScheduleModal" class="modal">
    <input type="date" v-model="startDate" />
    <select v-model="intervalDays">
      <option :value="1">Daily</option>
      <option :value="7">Weekly</option>
      <option :value="14">Fortnightly</option>
    </select>
    <button @click="scheduleFixtures">Apply Schedule</button>
  </div>
</div>
```

---

## Files to Create

| File | Description |
|------|-------------|
| `app/components/FixtureCalendar.vue` | Calendar/list view of fixtures |
| `server/api/tournament/[id]/schedule.post.ts` | Apply schedule to tournament |

## Files to Modify

| File | Change |
|------|--------|
| `server/db/schema.ts` | Add `scheduledAt` to `tournamentMatches` |
| `server/utils/tournament-manager.ts` | Add `scheduleFixtures()` function |
| `app/pages/tournaments/[id].vue` | Add Fixtures tab, scheduling controls |
| `app/components/tournament/StandingsTable.vue` | Add sortable columns |
| `server/api/tournament/[id].get.ts` | Include `scheduledAt` in match data |

---

## Testing Strategy

1. **Scheduling**: Correct date distribution across matches
2. **Interval**: Weekly/daily/custom intervals applied correctly
3. **Max per day**: Matches distributed across dates when limit reached
4. **UI**: Fixtures grouped by date, sorted chronologically
5. **Reschedule**: Individual match date change works
6. **Integration**: Starting a match from fixtures tab works correctly
