# Feature 04 — Statistics Export

**Priority:** 9 (Low-Medium) | **Effort:** Small | **Impact:** Low-Medium
**Depends on:** Nothing

---

## Summary

Allow users to export their game history and statistics as **CSV** or **JSON** for spreadsheet analysis, archival, or sharing. Optional **PDF** export of the stats dashboard.

---

## API Endpoint

### `server/api/stats/export.get.ts` (NEW)

```ts
// GET /api/stats/export?format=csv|json&player=name&from=2025-01-01&to=2025-12-31&mode=501

export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event)
  const query = getQuery(event)
  const format = (query.format as string) || 'csv'

  // Build query with existing filter pattern from stats/index.get.ts
  // Join games + gamePlayers + turns to get full game data

  const rows = await db.select({
    gameId: games.id,
    date: games.createdAt,
    mode: games.mode,
    winner: games.winnerName,
    totalTurns: games.totalTurns,
    playerName: gamePlayers.playerName,
    position: gamePlayers.position,
    finalScore: gamePlayers.finalScore,
  })
  .from(games)
  .innerJoin(gamePlayers, eq(gamePlayers.gameId, games.id))
  .where(and(
    eq(games.userId, userId),
    // Apply optional filters
    query.player ? eq(gamePlayers.playerName, query.player as string) : undefined,
    query.mode ? eq(games.mode, query.mode as string) : undefined,
    query.from ? gte(games.createdAt, new Date(query.from as string)) : undefined,
    query.to ? lte(games.createdAt, new Date(query.to as string)) : undefined,
  ))
  .orderBy(asc(games.createdAt))

  if (format === 'json') {
    setResponseHeader(event, 'Content-Type', 'application/json')
    setResponseHeader(event, 'Content-Disposition', 'attachment; filename=darts-stats.json')
    return rows
  }

  // CSV format
  const header = 'Date,Mode,Player,Opponent,Result,Final Score,Total Turns\n'
  const csv = rows.map(r => {
    const result = r.winner === r.playerName ? 'Win' : 'Loss'
    return `${r.date.toISOString()},${r.mode},${r.playerName},,${result},${r.finalScore},${r.totalTurns}`
  }).join('\n')

  setResponseHeader(event, 'Content-Type', 'text/csv')
  setResponseHeader(event, 'Content-Disposition', 'attachment; filename=darts-stats.csv')
  return header + csv
})
```

### Enhanced CSV with per-turn data

Optional `?detail=full` parameter to include throw-by-throw data:

```
Date,Mode,Player,Turn,Dart1,Dart2,Dart3,Turn Total,Busted
2025-01-15,501,Alice,1,T20,T20,T20,180,false
2025-01-15,501,Alice,2,T20,T19,D16,89,false
```

---

## UI: Export Button

### `app/pages/stats.vue`

Add export button to the stats page header area:

```vue
<div class="flex items-center gap-sm">
  <button class="btn btn-secondary" @click="showExportMenu = !showExportMenu">
    Export
    <svg><!-- download icon --></svg>
  </button>
  <div v-if="showExportMenu" class="export-menu">
    <button @click="exportData('csv')">CSV</button>
    <button @click="exportData('json')">JSON</button>
    <button @click="exportPdf()">PDF (Dashboard)</button>
  </div>
</div>
```

```ts
async function exportData(format: 'csv' | 'json') {
  const params = new URLSearchParams({ format })
  // Apply current filter state
  if (selectedPlayer.value) params.set('player', selectedPlayer.value)
  if (selectedMode.value) params.set('mode', selectedMode.value)

  const response = await $fetch(`/api/stats/export?${params}`, { responseType: 'blob' })
  // Trigger download
  const url = URL.createObjectURL(response)
  const a = document.createElement('a')
  a.href = url
  a.download = `darts-stats.${format}`
  a.click()
  URL.revokeObjectURL(url)
}
```

### PDF Export (Client-side)

Use `html2canvas` to screenshot the stats dashboard and convert to PDF:

```ts
async function exportPdf() {
  const { default: html2canvas } = await import('html2canvas')
  const { jsPDF } = await import('jspdf')

  const element = document.querySelector('.stats-dashboard')
  const canvas = await html2canvas(element)
  const pdf = new jsPDF('p', 'mm', 'a4')
  const imgData = canvas.toDataURL('image/png')
  pdf.addImage(imgData, 'PNG', 10, 10, 190, 0)
  pdf.save('darts-stats.pdf')
}
```

**Note:** `html2canvas` and `jspdf` are dynamically imported (not bundled by default). Add as dev dependencies.

---

## Files to Create

| File | Description |
|------|-------------|
| `server/api/stats/export.get.ts` | Export endpoint (CSV/JSON) |

## Files to Modify

| File | Change |
|------|--------|
| `app/pages/stats.vue` | Add export button with format dropdown |
| `package.json` | Add `html2canvas` and `jspdf` as dependencies (for PDF option) |

---

## CSV Format Specification

**Summary export (default):**

| Column | Description |
|--------|-------------|
| Date | ISO timestamp |
| Mode | 501, 301, cricket, etc. |
| Player | Player name |
| Opponent | Opponent name |
| Result | Win / Loss |
| 3-Dart Average | Computed from turns |
| Legs Won | Total legs won |
| Legs Lost | Total legs lost |
| Checkout Dart | Last dart thrown (if won) |

---

## Testing Strategy

1. CSV output format validation
2. JSON output structure
3. Filter parameters (player, mode, date range)
4. Auth requirement (403 without auth)
5. Empty data handling
6. Large dataset performance
