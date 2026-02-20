<script setup lang="ts">
const route = useRoute()
const selectedPlayer = ref('')
const activeTab = ref<'stats' | 'rankings'>('stats')
const { players, fetchPlayers, getAvatarProps } = usePlayers()

interface FilterState {
  from: string | null
  to: string | null
  mode: string | null
}

interface PlayerStats {
  player_name: string
  total_games: number
  games_won: number
  three_dart_average: number
  total_points: number
  total_darts: number
  total_turns: number
  busts: number
  best_leg_turns: number | null
  win_rate: number
  count_180: number
  count_140_plus: number
  count_100_plus: number
  highest_turn: number | null
  scoring_average: number
  first_9_average: number | null
  miss_rate: number
  best_game_darts: number | null
  points_per_dart: number
  avg_darts_per_leg: number | null
}

interface GameHistoryItem {
  id: number
  mode: string
  winner_name: string
  players: { player_name: string, position: number, final_score: number }[]
  total_turns: number
  created_at: string
}

interface InsightTurn {
  id: number
  game_id: number
  turn_number: number
  total_points: number
  busted: boolean
  game_created_at: string
}

interface InsightThrow {
  segment: number
  multiplier: number
  points: number
}

interface PlayerInsights {
  player_name: string
  turns: InsightTurn[]
  throws: InsightThrow[]
}

interface GameAverage {
  game_id: number
  created_at: string
  average: number
  won: boolean
  opponent: string | null
}

interface HeadToHead {
  opponent: string
  games_played: number
  wins: number
  losses: number
}

interface CheckoutDart {
  segment: number
  multiplier: number
  label: string
  count: number
}

interface TrendsData {
  game_averages: GameAverage[]
  head_to_head: HeadToHead[]
  checkout_darts: CheckoutDart[]
}

interface EloTrendEntry {
  eloAfter: number
  result: string
  createdAt: string
}

interface RankedPlayer {
  rank: number
  name: string
  currentElo: number
  avatarStyle: string | null
  avatarSeed: string | null
  trend: EloTrendEntry[]
}

const rankings = ref<RankedPlayer[]>([])
const loadingRankings = ref(false)

async function fetchRankings() {
  loadingRankings.value = true
  try {
    rankings.value = await $fetch<RankedPlayer[]>('/api/stats/rankings')
  }
  catch {
    rankings.value = []
  }
  finally {
    loadingRankings.value = false
  }
}

function switchTab(tab: 'stats' | 'rankings') {
  activeTab.value = tab
  if (tab === 'rankings') {
    fetchRankings()
  }
}

function eloTrendDirection(trend: EloTrendEntry[]): 'up' | 'down' | 'neutral' {
  if (trend.length < 2)
    return 'neutral'
  const last = trend[trend.length - 1]!.eloAfter
  const first = trend[0]!.eloAfter
  if (last > first)
    return 'up'
  if (last < first)
    return 'down'
  return 'neutral'
}

function eloTrendDelta(trend: EloTrendEntry[]): number {
  if (trend.length < 2)
    return 0
  return trend[trend.length - 1]!.eloAfter - trend[0]!.eloAfter
}

interface AchievementItem {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedBy: { playerName: string, unlockedAt: string, metadata: unknown }[]
}

const stats = ref<PlayerStats | null>(null)
const trends = ref<TrendsData | null>(null)
const history = ref<GameHistoryItem[]>([])
const insights = ref<PlayerInsights | null>(null)
const achievementList = ref<AchievementItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMoreHistory = ref(true)
const activeFilter = ref<FilterState>({ from: null, to: null, mode: null })

const filterLabel = computed(() => {
  const { from, mode } = activeFilter.value
  const parts: string[] = []
  if (from) {
    const days = Math.round((Date.now() - new Date(from).getTime()) / 86400000)
    if (days <= 8)
      parts.push('Last 7 days')
    else if (days <= 31)
      parts.push('Last 30 days')
    else parts.push('Last 90 days')
  }
  if (mode)
    parts.push(mode)
  return parts.length > 0 ? parts.join(' \u00B7 ') : 'All games'
})

function buildFilterParams(filter: FilterState): string {
  const parts: string[] = []
  if (filter.from)
    parts.push(`from=${encodeURIComponent(filter.from)}`)
  if (filter.to)
    parts.push(`to=${encodeURIComponent(filter.to)}`)
  if (filter.mode)
    parts.push(`mode=${encodeURIComponent(filter.mode)}`)
  return parts.length > 0 ? `&${parts.join('&')}` : ''
}

async function fetchStats(name: string) {
  loading.value = true
  const fp = buildFilterParams(activeFilter.value)
  try {
    const [s, t, h, i] = await Promise.all([
      $fetch<PlayerStats>(`/api/stats?player=${encodeURIComponent(name)}${fp}`),
      $fetch<TrendsData>(`/api/stats/trends?player=${encodeURIComponent(name)}${fp}`),
      $fetch<GameHistoryItem[]>(`/api/history?player=${encodeURIComponent(name)}&limit=20${fp}`),
      $fetch<PlayerInsights>(`/api/stats/insights?player=${encodeURIComponent(name)}&turn_limit=40&throw_limit=300${fp}`),
    ])
    stats.value = s
    trends.value = t
    history.value = h
    hasMoreHistory.value = h.length >= 20
    insights.value = i
  }
  catch {
    stats.value = null
    trends.value = null
  }
  finally {
    loading.value = false
  }
}

async function fetchHistory() {
  const fp = buildFilterParams(activeFilter.value)
  try {
    const h = await $fetch<GameHistoryItem[]>(`/api/history?limit=20${fp}`)
    history.value = h
    hasMoreHistory.value = h.length >= 20
  }
  catch {
    history.value = []
  }
}

async function loadMoreHistory() {
  if (loadingMore.value || !hasMoreHistory.value)
    return
  loadingMore.value = true
  const fp = buildFilterParams(activeFilter.value)
  const playerParam = selectedPlayer.value ? `&player=${encodeURIComponent(selectedPlayer.value)}` : ''
  try {
    const more = await $fetch<GameHistoryItem[]>(
      `/api/history?limit=20&offset=${history.value.length}${playerParam}${fp}`,
    )
    history.value = [...history.value, ...more]
    hasMoreHistory.value = more.length >= 20
  }
  catch {
    hasMoreHistory.value = false
  }
  finally {
    loadingMore.value = false
  }
}

function onFilterUpdate(filter: FilterState) {
  activeFilter.value = filter
  if (selectedPlayer.value) {
    fetchStats(selectedPlayer.value)
  }
  else {
    fetchHistory()
  }
}

watch(selectedPlayer, (name) => {
  if (name)
    fetchStats(name)
})

async function fetchAchievements() {
  try {
    achievementList.value = await $fetch<AchievementItem[]>('/api/achievements')
  }
  catch {
    achievementList.value = []
  }
}

const unlockedCount = computed(() => achievementList.value.filter(a => a.unlocked).length)
const totalCount = computed(() => achievementList.value.length)

function achievementUnlockDate(achievement: AchievementItem): string | null {
  if (achievement.unlockedBy.length === 0)
    return null
  const earliest = achievement.unlockedBy.reduce((a, b) =>
    new Date(a.unlockedAt) < new Date(b.unlockedAt) ? a : b,
  )
  return formatDate(earliest.unlockedAt)
}

onMounted(async () => {
  await fetchPlayers()
  fetchHistory()
  fetchAchievements()
  const playerParam = route.query.player as string | undefined
  if (playerParam && !selectedPlayer.value) {
    selectedPlayer.value = playerParam
  }
})

function selectPlayer(name: string) {
  selectedPlayer.value = name
}

const showExportMenu = ref(false)
const exporting = ref(false)

function closeExportMenu(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.export-wrapper')) {
    showExportMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', closeExportMenu))
onUnmounted(() => document.removeEventListener('click', closeExportMenu))

async function exportData(format: 'csv' | 'json') {
  showExportMenu.value = false
  exporting.value = true
  try {
    const params: string[] = [`format=${format}`]
    if (selectedPlayer.value)
      params.push(`player=${encodeURIComponent(selectedPlayer.value)}`)
    if (activeFilter.value.from)
      params.push(`from=${encodeURIComponent(activeFilter.value.from)}`)
    if (activeFilter.value.to)
      params.push(`to=${encodeURIComponent(activeFilter.value.to)}`)
    if (activeFilter.value.mode)
      params.push(`mode=${encodeURIComponent(activeFilter.value.mode)}`)

    const response = await $fetch.raw(`/api/stats/export?${params.join('&')}`)
    const blob = new Blob(
      [typeof response._data === 'string' ? response._data : JSON.stringify(response._data, null, 2)],
      { type: format === 'csv' ? 'text/csv' : 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `darts-stats-${new Date().toISOString().slice(0, 10)}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  finally {
    exporting.value = false
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

// Primary overview cards (3 hero metrics)
const primaryCards = computed(() => [
  { key: 'three_dart_average', label: '3-Dart Avg', sublabel: 'Points scored per 3-dart visit', icon: 'x\u0304', hero: true },
  { key: 'win_rate', label: 'Win %', sublabel: 'Percentage of games won', icon: '%', suffix: '%' },
  { key: 'total_games', label: 'Games Played', sublabel: 'Total matches completed', icon: '#' },
])

// Secondary overview cards (6 deeper metrics)
const secondaryCards = computed(() => [
  { key: 'scoring_average', label: 'Scoring Avg', icon: 'S', title: 'Average per 3-dart visit, excluding busts' },
  { key: 'first_9_average', label: 'First 9 Avg', icon: '9', title: 'Average of your first 3 visits each leg' },
  { key: 'games_won', label: 'Wins', icon: 'W' },
  { key: 'bust_rate', label: 'Bust Rate', icon: 'BR', suffix: '%' },
  { key: 'best_game_darts', label: 'Best Game', icon: 'D', sublabel: 'darts' },
  { key: 'avg_darts_per_leg', label: 'Avg Darts/Leg', icon: 'A' },
])

const bustRate = computed(() => {
  if (!stats.value || stats.value.total_turns === 0)
    return 0
  return Math.round((stats.value.busts / stats.value.total_turns) * 1000) / 10
})

// Milestone cards
const milestoneCards = computed(() => {
  if (!stats.value)
    return []
  return [
    { label: '180s', value: stats.value.count_180, accent: 'gold' as const },
    { label: '140+', value: stats.value.count_140_plus, accent: 'muted' as const },
    { label: '100+', value: stats.value.count_100_plus, accent: 'muted' as const },
    { label: 'Highest Turn', value: stats.value.highest_turn ?? '\u2014', accent: 'muted' as const },
  ]
})

// Recent form dots (last 10 games)
const recentForm = computed(() => {
  if (!trends.value || trends.value.game_averages.length === 0)
    return []
  return trends.value.game_averages.slice(-10).map(g => g.won)
})

// Performance trend data
const trendValues = computed(() => {
  if (!trends.value)
    return []
  return trends.value.game_averages.map(g => g.average)
})

const trendXLabels = computed(() => {
  if (!trends.value)
    return []
  return trends.value.game_averages.map(g => formatShortDate(g.created_at))
})

const _overallAverage = computed(() => stats.value?.three_dart_average ?? 0)

// Win rate trend (cumulative)
const winRateTrendValues = computed(() => {
  if (!trends.value || trends.value.game_averages.length < 2)
    return []
  let wins = 0
  return trends.value.game_averages.map((g, i) => {
    if (g.won)
      wins++
    return Math.round((wins / (i + 1)) * 1000) / 10
  })
})

const winRateTrendLabels = computed(() => {
  if (!trends.value)
    return []
  return trends.value.game_averages.map(g => formatShortDate(g.created_at))
})

const _overallWinRate = computed(() => stats.value?.win_rate ?? 0)

// Turn distribution
const recentTurnTotals = computed(() => {
  if (!insights.value)
    return []
  return insights.value.turns
    .slice(0, 16)
    .map(turn => (turn.busted ? 0 : turn.total_points))
    .reverse()
})

const momentumXLabels = computed(() => {
  if (!insights.value)
    return undefined
  const turns = insights.value.turns.slice(0, 16).reverse()
  if (turns.length === 0 || !turns[0]?.game_created_at)
    return undefined
  return turns.map(t => formatShortDate(t.game_created_at))
})

const turnDistribution = computed(() => {
  const buckets = [0, 20, 40, 60, 80, 100, 120, 140]
  const labels = buckets.map((b, i) => (
    i === 0 ? '0-19*' : i === buckets.length - 1 ? '140+' : `${b}-${b + 19}`
  ))
  const values = Array.from({ length: labels.length }).fill(0) as number[]
  if (!insights.value)
    return { labels, values }
  insights.value.turns.forEach((turn) => {
    const total = turn.busted ? 0 : turn.total_points
    const idx = buckets.findIndex((b, i) => (
      i === buckets.length - 1
        ? total >= b
        : total >= b && total < buckets[i + 1]!
    ))
    if (idx >= 0)
      values[idx]! += 1
  })
  return { labels, values }
})

// Ring accuracy (with misses) — donut format
const ringBreakdownForDonut = computed(() => {
  const ringColors = {
    Miss: 'var(--red)',
    S: 'var(--blue)',
    D: 'var(--yellow)',
    T: 'var(--green)',
    Bull: 'var(--purple)',
  } as Record<string, string>

  const labels = ['Miss', 'S', 'D', 'T', 'Bull'] as const
  const values = [0, 0, 0, 0, 0]

  if (insights.value) {
    insights.value.throws.forEach((t) => {
      if (t.segment === 0) {
        values[0]! += 1
      }
      else if (t.segment === 25) {
        values[4]! += 1
      }
      else if (t.multiplier === 1) {
        values[1]! += 1
      }
      else if (t.multiplier === 2) {
        values[2]! += 1
      }
      else if (t.multiplier === 3) {
        values[3]! += 1
      }
    })
  }

  return labels.map((label, i) => ({
    label,
    value: values[i]!,
    color: ringColors[label],
  }))
})

const hasThrowData = computed(() => (insights.value?.throws?.length ?? 0) > 0)

// Scoring by number (darts per board number 1-20 + Bull)
const scoringByNumber = computed(() => {
  const counts = new Map<number, number>()
  if (!insights.value)
    return { labels: [] as string[], values: [] as number[] }
  insights.value.throws.forEach((t) => {
    if (t.segment === 0)
      return
    counts.set(t.segment, (counts.get(t.segment) ?? 0) + 1)
  })
  const segments = [...counts.entries()].sort((a, b) => a[0] - b[0])
  return {
    labels: segments.map(([seg]) => seg === 25 ? 'Bull' : String(seg)),
    values: segments.map(([, count]) => count),
  }
})

// Heatmap
const segmentHeat = computed(() => {
  const counts: Record<string, number> = {}
  if (!insights.value)
    return counts
  insights.value.throws.forEach((t) => {
    if (t.segment === 0)
      return
    if (t.segment === 25) {
      const key = `25-${t.multiplier === 2 ? 'double' : 'single'}`
      counts[key] = (counts[key] ?? 0) + 1
      return
    }
    const ring = t.multiplier === 3 ? 'treble' : t.multiplier === 2 ? 'double' : 'single'
    const key = `${t.segment}-${ring}`
    counts[key] = (counts[key] ?? 0) + 1
  })
  return counts
})

// Checkout analysis
const checkoutBars = computed(() => {
  if (!trends.value || trends.value.checkout_darts.length === 0)
    return { labels: [] as string[], values: [] as number[] }
  const top = trends.value.checkout_darts.slice(0, 8)
  return {
    labels: top.map(c => c.label),
    values: top.map(c => c.count),
  }
})

// Head-to-head
const headToHead = computed(() => {
  if (!trends.value)
    return []
  return trends.value.head_to_head
})

// Top segments
const topSegments = computed(() => {
  if (!insights.value)
    return []
  const map = new Map<string, number>()
  insights.value.throws.forEach((t) => {
    if (t.segment === 0)
      return
    const label = t.segment === 25
      ? (t.multiplier === 2 ? 'DB' : 'SB')
      : `${t.multiplier === 3 ? 'T' : t.multiplier === 2 ? 'D' : 'S'}${t.segment}`
    map.set(label, (map.get(label) ?? 0) + 1)
  })
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
})

const consistencyScore = computed(() => {
  if (!insights.value || insights.value.turns.length === 0)
    return 0
  const totals = insights.value.turns.map(t => (t.busted ? 0 : t.total_points))
  const avg = totals.reduce((a, v) => a + v, 0) / totals.length
  const variance = totals.reduce((a, v) => a + (v - avg) ** 2, 0) / totals.length
  const score = Math.max(0, 100 - Math.sqrt(variance))
  return Math.round(score)
})

const insightCards = computed(() => {
  const cards: { title: string, detail: string, tone?: 'gold' | 'blue' | 'green' }[] = []
  if (!stats.value)
    return cards

  if (stats.value.first_9_average != null && stats.value.three_dart_average > 0) {
    const diff = stats.value.first_9_average - stats.value.three_dart_average
    const pct = ((diff / stats.value.three_dart_average) * 100).toFixed(0)
    cards.push({
      title: 'Opening form',
      detail: diff >= 0
        ? `First 9 avg ${stats.value.first_9_average.toFixed(1)} (+${pct}% vs overall)`
        : `First 9 avg ${stats.value.first_9_average.toFixed(1)} (${pct}% vs overall)`,
      tone: diff >= 0 ? 'green' : 'gold',
    })
  }

  cards.push({
    title: 'Consistency',
    detail: `${consistencyScore.value}/100 based on recent turns`,
    tone: consistencyScore.value >= 60 ? 'blue' : 'gold',
  })

  if (topSegments.value.length > 0) {
    const detail = topSegments.value.map(([label]) => label).join(', ')
    cards.push({ title: 'Top targets', detail, tone: 'gold' })
  }

  if (trends.value && trends.value.checkout_darts.length > 0) {
    const uniqueCheckouts = trends.value.checkout_darts.length
    cards.push({
      title: 'Checkout variety',
      detail: `${uniqueCheckouts} different checkout${uniqueCheckouts !== 1 ? 's' : ''} used`,
      tone: uniqueCheckouts >= 4 ? 'green' : 'blue',
    })
  }

  if (trends.value && trends.value.head_to_head.length > 0) {
    const worst = trends.value.head_to_head
      .filter(h => h.games_played >= 2)
      .sort((a, b) => (a.wins / a.games_played) - (b.wins / b.games_played))[0]
    if (worst && worst.wins < worst.losses) {
      cards.push({
        title: 'Rival alert',
        detail: `${worst.wins}-${worst.losses} vs ${worst.opponent}`,
        tone: 'gold',
      })
    }
  }

  const bustPct = bustRate.value
  cards.push({
    title: 'Bust control',
    detail: `${bustPct.toFixed(1)}% bust rate`,
    tone: bustPct < 10 ? 'green' : 'blue',
  })

  return cards
})

// Per-game average for history items
function gameAverage(gameId: number): number | null {
  if (!trends.value)
    return null
  const g = trends.value.game_averages.find(ga => ga.game_id === gameId)
  return g ? g.average : null
}
</script>

<template>
  <AuthGate feature="Statistics" description="Sign in to track your averages, checkout rates, rankings, and game history.">
    <div class="px-lg py-xl max-w-[1100px] mx-auto w-full">
      <!-- Section 1: Hero -->
      <div
        v-motion
        class="relative flex items-center gap-lg px-lg py-xl rounded-xl bg-yellow-light border-2 border-black overflow-visible mb-xl shadow-md"
        :initial="{ opacity: 0, y: -10 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 300 } }"
      >
        <div class="flex-1">
          <h2 class="text-[2rem] font-extrabold text-fg mb-xs">
            Performance Hub
          </h2>
          <p class="text-[0.9rem] text-fg-secondary max-w-[480px]">
            Track trends, accuracy, and game flow.
          </p>
        </div>
        <div class="export-wrapper relative z-10 shrink-0">
          <button
            class="px-lg py-xs bg-surface-1 border-2 border-black rounded-full text-fg-secondary text-[0.8rem] font-medium cursor-pointer shadow-sm transition-all duration-150 hover:enabled:-translate-x-0.5 hover:enabled:-translate-y-0.5 hover:enabled:shadow-md active:enabled:translate-x-0.5 active:enabled:translate-y-0.5 active:enabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="exporting"
            @click="showExportMenu = !showExportMenu"
          >
            {{ exporting ? 'Exporting...' : 'Export' }}
          </button>
          <div v-if="showExportMenu" class="absolute top-[calc(100%+6px)] right-0 bg-surface-1 border-2 border-black rounded-lg overflow-hidden min-w-[150px] shadow-lg">
            <button class="block w-full px-lg py-sm bg-transparent border-none text-fg-secondary text-[0.8rem] font-medium text-left cursor-pointer transition-colors duration-150 hover:bg-surface-2" @click="exportData('csv')">
              Download CSV
            </button>
            <button class="block w-full px-lg py-sm bg-transparent border-none text-fg-secondary text-[0.8rem] font-medium text-left cursor-pointer transition-colors duration-150 hover:bg-surface-2" @click="exportData('json')">
              Download JSON
            </button>
          </div>
        </div>
      </div>

      <!-- Tab switcher -->
      <div
        v-motion
        class="flex justify-center gap-sm mb-xl"
        :initial="{ opacity: 0 }"
        :enter="{ opacity: 1, transition: { duration: 300, delay: 80 } }"
      >
        <button
          class="px-xl py-xs border-2 border-black rounded-full text-[0.85rem] font-medium cursor-pointer shadow-sm transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md"
          :class="activeTab === 'stats' ? 'bg-yellow-light text-fg font-semibold' : 'bg-surface-1 text-fg-secondary'"
          @click="switchTab('stats')"
        >
          Player Stats
        </button>
        <button
          class="px-xl py-xs border-2 border-black rounded-full text-[0.85rem] font-medium cursor-pointer shadow-sm transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md"
          :class="activeTab === 'rankings' ? 'bg-yellow-light text-fg font-semibold' : 'bg-surface-1 text-fg-secondary'"
          @click="switchTab('rankings')"
        >
          Rankings
        </button>
      </div>

      <!-- Rankings view -->
      <div v-if="activeTab === 'rankings'">
        <div v-if="loadingRankings" class="text-center text-fg-muted p-2xl">
          Loading rankings...
        </div>
        <div v-else-if="rankings.length === 0" class="text-center text-fg-muted p-2xl text-[0.95rem]">
          No rankings yet. Play some 2-player games to generate Elo ratings!
        </div>
        <div v-else class="flex flex-col gap-sm">
          <div
            v-for="player in rankings"
            :key="player.name"
            v-motion
            class="bg-surface-1 border-2 border-black rounded-lg shadow-md p-md flex items-center gap-md transition-all duration-150 cursor-default hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg"
            :class="{
              'bg-yellow-light': player.rank === 1,
              'bg-[#f0f0f0]': player.rank === 2,
              'bg-[#fdf0e0]': player.rank === 3,
            }"
            :initial="{ opacity: 0, x: -10 }"
            :enter="{ opacity: 1, x: 0, transition: { duration: 300, delay: 80 + player.rank * 50 } }"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-[0.85rem] font-bold shrink-0 border-2 border-black"
              :class="{
                'bg-yellow text-fg-inverse': player.rank === 1,
                'bg-[#c0c0c0] text-fg-inverse': player.rank === 2,
                'bg-[#cd7f32] text-fg-inverse': player.rank === 3,
                'bg-surface-2 text-fg-muted': player.rank > 3,
              }"
            >
              {{ player.rank }}
            </div>
            <PlayerAvatar :name="player.name" :avatar-seed="player.avatarSeed" :avatar-style="player.avatarStyle" :size="36" />
            <div class="flex-1 min-w-0">
              <div class="text-[0.95rem] font-semibold text-fg truncate">
                {{ player.name }}
              </div>
              <div class="flex items-center gap-xs">
                <span
                  v-if="player.trend.length >= 2"
                  class="text-[0.7rem] font-semibold px-[6px] py-[1px] rounded tabular-nums"
                  :class="{
                    'text-green bg-green-light': eloTrendDirection(player.trend) === 'up',
                    'text-red bg-red-light': eloTrendDirection(player.trend) === 'down',
                    'text-fg-muted bg-surface-2': eloTrendDirection(player.trend) === 'neutral',
                  }"
                >
                  <template v-if="eloTrendDirection(player.trend) === 'up'">+{{ eloTrendDelta(player.trend) }}</template>
                  <template v-else-if="eloTrendDirection(player.trend) === 'down'">{{ eloTrendDelta(player.trend) }}</template>
                  <template v-else>=</template>
                </span>
                <span v-if="player.trend.length > 0" class="flex items-center gap-[3px]">
                  <span
                    v-for="(entry, i) in player.trend"
                    :key="i"
                    class="w-1.5 h-1.5 rounded-full shrink-0"
                    :class="entry.result === 'win' ? 'bg-green' : 'bg-red'"
                  />
                </span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-[1.4rem] font-extrabold tabular-nums text-fg">
                {{ player.currentElo }}
              </div>
              <div class="text-[0.65rem] font-semibold text-fg-muted uppercase tracking-wide">
                Elo
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Player stats view -->
      <div v-if="activeTab === 'stats'">
        <!-- Player chips -->
        <div
          v-motion
          class="flex flex-wrap gap-sm justify-center mb-md"
          :initial="{ opacity: 0 }"
          :enter="{ opacity: 1, transition: { duration: 300, delay: 100 } }"
        >
          <button
            v-for="player in players"
            :key="player.id"
            class="flex items-center gap-xs px-lg py-xs border-2 border-black rounded-full text-[0.85rem] font-medium cursor-pointer transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md"
            :class="player.name === selectedPlayer ? 'bg-yellow-light text-fg font-semibold shadow-sm' : 'bg-surface-1 text-fg-secondary'"
            @click="selectPlayer(player.name)"
          >
            <PlayerAvatar v-bind="getAvatarProps(player.name)" :size="22" />
            {{ player.name }}
          </button>
          <div v-if="players.length === 0" class="text-fg-muted italic text-[0.9rem]">
            No players yet. Play a game first!
          </div>
        </div>

        <!-- Filter bar -->
        <div
          v-if="selectedPlayer"
          v-motion
          class="flex justify-center mb-xl"
          :initial="{ opacity: 0 }"
          :enter="{ opacity: 1, transition: { duration: 300, delay: 150 } }"
        >
          <StatsFilterBar @update="onFilterUpdate" />
        </div>

        <div v-if="loading" class="text-center text-fg-muted p-2xl">
          Loading stats...
        </div>

        <div v-if="stats && !loading" class="flex flex-col gap-2xl">
          <!-- ============================================================ -->
          <!-- OVERVIEW BAND: Primary Cards + Form Dots + Secondary Cards   -->
          <!-- ============================================================ -->
          <section class="flex flex-col gap-md">
            <div class="flex items-center justify-between gap-md mb-md flex-wrap">
              <h3 class="text-[0.8rem] text-fg-muted uppercase tracking-wide">
                Overview
              </h3>
              <span class="text-[0.7rem] text-fg-muted uppercase tracking-widest">{{ filterLabel }}</span>
            </div>

            <!-- Primary tier (3 hero cards) -->
            <div class="grid grid-cols-3 gap-md max-sm:grid-cols-1">
              <div
                v-for="(card, i) in primaryCards"
                :key="card.key"
                v-motion
                class="px-xl py-lg text-center flex flex-col items-center gap-xs rounded-lg border-2 border-black"
                :class="card.hero ? 'bg-yellow-light shadow-md' : 'bg-surface-1'"
                :initial="{ opacity: 0, y: 20 }"
                :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: 150 + i * 40 } }"
              >
                <div class="text-[0.75rem] text-fg-muted">
                  {{ card.icon }}
                </div>
                <div class="text-[2.4rem] font-extrabold text-fg tabular-nums leading-none">
                  <template v-if="card.key === 'win_rate'">
                    {{ (stats as any)[card.key] ?? 0 }}
                  </template>
                  <template v-else>
                    {{ (stats as any)[card.key] ?? '\u2014' }}
                  </template>
                  <span v-if="card.suffix" class="text-[1.2rem]">{{ card.suffix }}</span>
                </div>
                <div class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-wide">
                  {{ card.label }}
                </div>
                <div class="text-[0.65rem] text-fg-muted mt-[2px]">
                  {{ card.sublabel }}
                </div>
              </div>
            </div>

            <!-- Recent form dots (between tiers) -->
            <div v-if="recentForm.length > 0" class="flex justify-center items-center gap-[6px] py-xs">
              <span class="text-[0.65rem] text-fg-muted uppercase tracking-widest mr-sm">Form</span>
              <span
                v-for="(won, i) in recentForm"
                :key="i"
                class="w-2 h-2 rounded-full shrink-0 border border-black"
                :class="won ? 'bg-green' : 'bg-red'"
              />
            </div>

            <!-- Secondary tier (6 smaller cards) -->
            <div class="grid grid-cols-3 gap-sm max-sm:grid-cols-2">
              <div
                v-for="(card, i) in secondaryCards"
                :key="card.key"
                v-motion
                class="bg-surface-1 border-2 border-black rounded-lg shadow-md p-md text-center flex flex-col items-center gap-[2px]"
                :title="card.title"
                :initial="{ opacity: 0, y: 12 }"
                :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: 280 + i * 30 } }"
              >
                <div class="text-[0.7rem] text-fg-muted">
                  {{ card.icon }}
                </div>
                <div class="text-[1.4rem] font-extrabold text-fg tabular-nums">
                  <template v-if="card.key === 'bust_rate'">
                    {{ bustRate.toFixed(1) }}
                  </template>
                  <template v-else>
                    {{ (stats as any)[card.key] ?? '\u2014' }}
                  </template>
                  <span v-if="card.suffix" class="text-[0.85rem]">{{ card.suffix }}</span>
                </div>
                <div class="text-[0.65rem] font-semibold text-fg-muted uppercase tracking-wide">
                  {{ card.label }}
                  <span v-if="card.sublabel" class="text-fg-muted font-normal">({{ card.sublabel }})</span>
                </div>
              </div>
            </div>

            <!-- Metric explainer -->
            <details class="stats-metric-explainer mt-xs">
              <summary class="text-[0.7rem] text-fg-muted cursor-pointer hover:text-fg-secondary transition-colors list-none select-none">
                What do these mean?
              </summary>
              <div class="mt-sm p-md bg-surface-1 border-2 border-black rounded-md text-[0.72rem] text-fg-muted leading-relaxed flex flex-col gap-xs">
                <p><strong class="text-fg-secondary">3-Dart Avg</strong> &mdash; Average points per 3-dart visit across all turns, including busts (counted as 0).</p>
                <p><strong class="text-fg-secondary">Scoring Avg</strong> &mdash; Average per 3-dart visit, excluding busted turns entirely. Usually higher than 3-Dart Avg.</p>
                <p><strong class="text-fg-secondary">First 9 Avg</strong> &mdash; Average of your first 3 visits (9 darts) each leg. Shows opening strength before checkout pressure.</p>
                <p><strong class="text-fg-secondary">Bust Rate</strong> &mdash; Percentage of turns that busted (went over the remaining score).</p>
                <p><strong class="text-fg-secondary">Avg Darts/Leg</strong> &mdash; Average number of darts needed to complete a leg. Lower is better.</p>
              </div>
            </details>
          </section>

          <!-- Scoring Milestones -->
          <section
            v-motion
            class="flex flex-col gap-md"
            :initial="{ opacity: 0 }"
            :enter="{ opacity: 1, transition: { duration: 300, delay: 400 } }"
          >
            <h3 class="text-[0.8rem] text-fg-muted uppercase tracking-wide mb-md">
              Scoring Milestones
            </h3>
            <div class="grid grid-cols-4 gap-md max-sm:grid-cols-2">
              <div
                v-for="m in milestoneCards"
                :key="m.label"
                class="p-lg text-center rounded-lg border-2 border-black"
                :class="m.accent === 'gold' ? 'bg-yellow-light shadow-md text-fg' : 'bg-surface-1 text-fg'"
              >
                <div class="text-[2rem] font-extrabold tabular-nums">
                  {{ m.value }}
                </div>
                <div class="text-[0.7rem] font-semibold uppercase tracking-wide opacity-70">
                  {{ m.label }}
                </div>
              </div>
            </div>
          </section>

          <!-- ============================================================ -->
          <!-- TRENDS GROUP: Performance Trend + Win Rate Trend             -->
          <!-- ============================================================ -->
          <StatsChartSection
            v-if="trendValues.length >= 2"
            v-motion
            title="Performance Trend"
            description="Your 3-dart average per game over time. The dashed line shows a 5-game rolling average to smooth out variance."
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: 450 } }"
          >
            <StatsAreaChart
              :values="trendValues"
              :rolling="5"
              :x-labels="trendXLabels"
              :height="200"
              value-label="Game Avg"
            />
          </StatsChartSection>

          <StatsChartSection
            v-if="winRateTrendValues.length >= 2"
            v-motion
            title="Win Rate Trend"
            description="Cumulative win percentage across all games. A rising line means you're winning more than losing."
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: 470 } }"
          >
            <StatsAreaChart
              :values="winRateTrendValues"
              :x-labels="winRateTrendLabels"
              :height="180"
              value-label="Win %"
            />
          </StatsChartSection>

          <!-- ============================================================ -->
          <!-- SESSION GROUP: Momentum + Turn Distribution (two-column)     -->
          <!-- ============================================================ -->
          <section class="grid grid-cols-2 gap-lg max-sm:grid-cols-1">
            <StatsChartSection
              title="Momentum"
              description="Turn scores from your 16 most recent visits. Rising scores indicate good current form."
            >
              <StatsAreaChart
                :values="recentTurnTotals"
                :rolling="4"
                :x-labels="momentumXLabels"
                value-label="Turn Score"
                rolling-label="4-turn avg"
              />
            </StatsChartSection>

            <StatsChartSection
              title="Turn Distribution"
              description="How often your turns land in each scoring band. Elite players peak in the 100+ range."
            >
              <StatsBarChart :labels="turnDistribution.labels" :values="turnDistribution.values" accent="gold" value-label="Turns" />
              <p class="text-[0.65rem] text-fg-muted mt-xs">
                * includes busts
              </p>
            </StatsChartSection>
          </section>

          <!-- ============================================================ -->
          <!-- ACCURACY GROUP: Ring Accuracy (donut) + Target Heatmap       -->
          <!-- ============================================================ -->
          <section class="grid grid-cols-2 gap-lg max-sm:grid-cols-1">
            <StatsChartSection
              title="Ring Accuracy"
              description="Where your darts land by ring type. Doubles and Trebles are the highest-value rings."
            >
              <template v-if="hasThrowData">
                <StatsDonutChart
                  :data="ringBreakdownForDonut"
                  :size="180"
                  central-label="Throws"
                  :central-sub-label="String(insights?.throws?.length ?? 0)"
                />
              </template>
              <div v-else class="text-center text-fg-muted text-[0.8rem] py-xl">
                No throw data recorded yet
              </div>
            </StatsChartSection>

            <StatsChartSection
              title="Target Heatmap"
              description="Frequency map of which segments you hit most. Brighter means more darts thrown there."
            >
              <template v-if="hasThrowData">
                <div class="flex flex-col items-center gap-md">
                  <StatsDartboardHeatmap :hits="segmentHeat" :size="220" />
                </div>
              </template>
              <div v-else class="text-center text-fg-muted text-[0.8rem] py-xl">
                No throw data recorded yet
              </div>
            </StatsChartSection>
          </section>

          <!-- ============================================================ -->
          <!-- TARGETING GROUP: Scoring by Number + Favorite Checkouts      -->
          <!-- ============================================================ -->
          <section class="grid grid-cols-2 gap-lg max-sm:grid-cols-1">
            <StatsChartSection
              v-if="scoringByNumber.labels.length > 0"
              title="Scoring by Number"
              description="Darts thrown at each board number (1-20 + Bull). Shows your preferred scoring routes."
            >
              <StatsBarChart :labels="scoringByNumber.labels" :values="scoringByNumber.values" accent="blue" value-label="Darts" />
            </StatsChartSection>

            <StatsChartSection
              v-if="checkoutBars.labels.length > 0"
              title="Favorite Checkouts"
              description="Your most-used finishing doubles when closing out a leg."
            >
              <StatsBarChart :labels="checkoutBars.labels" :values="checkoutBars.values" accent="green" value-label="Times Used" />
            </StatsChartSection>
          </section>

          <!-- Head-to-Head Records -->
          <section
            v-if="headToHead.length > 0"
            v-motion
            class="flex flex-col gap-md"
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: 550 } }"
          >
            <div class="flex items-center justify-between gap-md">
              <h3 class="text-[0.8rem] text-fg-muted uppercase tracking-wide">
                Head-to-Head
              </h3>
              <NuxtLink
                :to="{ path: '/stats/head-to-head', query: { player1: selectedPlayer } }"
                class="flex items-center gap-xs text-[0.75rem] font-semibold text-fg-muted no-underline uppercase tracking-wide transition-colors duration-150 hover:text-yellow"
              >
                Compare
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </NuxtLink>
            </div>
            <div class="flex flex-col gap-sm">
              <NuxtLink
                v-for="h2h in headToHead"
                :key="h2h.opponent"
                :to="{ path: '/stats/head-to-head', query: { player1: selectedPlayer, player2: h2h.opponent } }"
                class="bg-surface-1 border-2 border-black rounded-lg shadow-md p-md flex items-center gap-md no-underline cursor-pointer transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <PlayerAvatar v-bind="getAvatarProps(h2h.opponent)" :size="28" />
                <div class="flex-1 min-w-0">
                  <div class="text-[0.85rem] font-semibold text-fg truncate">
                    {{ h2h.opponent }}
                  </div>
                  <div class="text-[0.7rem] text-fg-muted">
                    {{ h2h.games_played }} game{{ h2h.games_played !== 1 ? 's' : '' }}
                  </div>
                </div>
                <div class="flex items-center gap-sm">
                  <span class="text-[0.9rem] font-bold tabular-nums" :class="h2h.wins >= h2h.losses ? 'text-green' : 'text-fg-muted'">{{ h2h.wins }}</span>
                  <div class="w-[60px] h-1.5 rounded-[3px] bg-surface-3 overflow-hidden relative border border-black" :style="{ '--win-pct': `${(h2h.wins / h2h.games_played) * 100}%` }">
                    <div class="absolute top-0 left-0 h-full rounded-[3px] bg-green transition-all duration-300" :style="{ width: `${(h2h.wins / h2h.games_played) * 100}%` }" />
                  </div>
                  <span class="text-[0.9rem] font-bold tabular-nums" :class="h2h.losses > h2h.wins ? 'text-red' : 'text-fg-muted'">{{ h2h.losses }}</span>
                </div>
              </NuxtLink>
            </div>
          </section>

          <!-- Recommendations -->
          <section class="flex flex-col gap-md">
            <div class="flex items-baseline justify-between gap-md mb-md">
              <h3 class="text-[0.8rem] text-fg-muted uppercase tracking-wide">
                Recommendations
              </h3>
              <span class="text-[0.7rem] text-fg-muted uppercase tracking-widest">Based on recent trends</span>
            </div>
            <div class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-md">
              <StatsInsightCard
                v-for="card in insightCards"
                :key="card.title"
                :title="card.title"
                :detail="card.detail"
                :tone="card.tone"
              />
            </div>
          </section>
        </div>

        <!-- Game History -->
        <div
          v-if="history.length > 0"
          v-motion
          :initial="{ opacity: 0 }"
          :enter="{ opacity: 1, transition: { duration: 300, delay: 500 } }"
        >
          <h3 class="text-[0.8rem] text-fg-muted uppercase tracking-wide mb-md mt-2xl">
            Game History
          </h3>
          <div class="flex flex-col gap-sm">
            <div
              v-for="game in history"
              :key="game.id"
              class="bg-surface-1 border-2 border-black rounded-lg shadow-md p-md flex justify-between items-center max-sm:flex-wrap max-sm:gap-sm"
            >
              <div class="flex items-center gap-md">
                <span class="text-[0.75rem] font-bold text-fg bg-yellow-light px-[8px] py-[2px] rounded-sm">{{ game.mode }}</span>
                <span class="text-[0.85rem] text-fg-secondary">
                  <template v-for="(p, i) in game.players" :key="p.player_name">
                    <span v-if="i > 0" class="text-fg-muted mx-xs text-[0.75rem]">vs</span>
                    <span :class="{ 'text-yellow font-semibold': game.winner_name === p.player_name }">
                      {{ p.player_name }}
                    </span>
                  </template>
                </span>
                <span class="text-[0.85rem] font-semibold text-fg tabular-nums">
                  {{ game.players.map(p => p.final_score).join(' - ') }}
                </span>
              </div>
              <div class="flex items-center gap-md">
                <div class="flex flex-col items-end gap-[2px]">
                  <span v-if="gameAverage(game.id) != null" class="text-[0.75rem] text-fg-secondary font-semibold tabular-nums">
                    avg {{ gameAverage(game.id)!.toFixed(1) }}
                  </span>
                  <span class="text-[0.75rem] text-fg-muted">{{ game.total_turns }} turns</span>
                  <span class="text-[0.7rem] text-fg-muted">{{ formatDate(game.created_at) }}</span>
                </div>
                <NuxtLink
                  :to="`/game/${game.id}/replay`"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-surface-1 border-2 border-black text-fg-muted shrink-0 no-underline transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md hover:text-yellow"
                  title="Watch replay"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="6 3 20 12 6 21 6 3" />
                  </svg>
                </NuxtLink>
              </div>
            </div>
          </div>
          <div v-if="hasMoreHistory" class="flex justify-center mt-lg">
            <button
              class="px-xl py-sm bg-surface-1 border-2 border-black rounded-full text-fg-secondary text-[0.8rem] font-medium cursor-pointer shadow-sm transition-all duration-150 hover:enabled:-translate-x-0.5 hover:enabled:-translate-y-0.5 hover:enabled:shadow-md active:enabled:translate-x-0.5 active:enabled:translate-y-0.5 active:enabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="loadingMore"
              @click="loadMoreHistory"
            >
              {{ loadingMore ? 'Loading...' : 'Load more' }}
            </button>
          </div>
        </div>

        <div v-if="!selectedPlayer && history.length === 0 && !loading" class="text-center text-fg-muted p-2xl text-[0.95rem]">
          Select a player to view their statistics
        </div>

        <!-- Achievements Gallery -->
        <section
          v-if="achievementList.length > 0"
          v-motion
          class="mt-2xl"
          :initial="{ opacity: 0, y: 20 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: 600 } }"
        >
          <div class="flex items-baseline justify-between gap-md mb-md">
            <h3 class="text-[0.8rem] text-fg-muted uppercase tracking-wide">
              Achievements
            </h3>
            <span class="text-[0.7rem] text-fg-muted uppercase tracking-widest tabular-nums">
              {{ unlockedCount }} / {{ totalCount }} unlocked
            </span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-md">
            <div
              v-for="achievement in achievementList"
              :key="achievement.id"
              class="flex flex-col items-center gap-1 px-sm py-md rounded-lg border-2 border-black text-center transition-all duration-150"
              :class="achievement.unlocked
                ? 'bg-yellow-light shadow-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md'
                : 'bg-surface-1 opacity-45'"
            >
              <div class="text-[1.8rem] leading-none" :class="!achievement.unlocked ? 'grayscale' : ''">
                {{ achievement.icon }}
              </div>
              <div class="text-[0.8rem] font-bold text-fg leading-tight">
                {{ achievement.name }}
              </div>
              <div class="text-[0.65rem] text-fg-muted leading-tight">
                {{ achievement.description }}
              </div>
              <template v-if="achievement.unlocked">
                <div class="flex flex-wrap gap-[3px] justify-center mt-[2px]">
                  <span
                    v-for="u in achievement.unlockedBy"
                    :key="u.playerName"
                    class="text-[0.6rem] font-semibold text-fg bg-yellow-light px-[6px] py-[1px] rounded-full border border-black"
                  >
                    {{ u.playerName }}
                  </span>
                </div>
                <div v-if="achievementUnlockDate(achievement)" class="text-[0.6rem] text-fg-muted">
                  {{ achievementUnlockDate(achievement) }}
                </div>
              </template>
            </div>
          </div>
        </section>
      </div><!-- end activeTab === 'stats' -->
    </div>
  </AuthGate>
</template>

<style>
/* Metric explainer arrow pseudo-element — cannot be Tailwind */
.stats-metric-explainer summary::-webkit-details-marker {
  display: none;
}

.stats-metric-explainer summary::before {
  content: '\25B6  ';
  font-size: 0.55rem;
  vertical-align: middle;
}

.stats-metric-explainer[open] summary::before {
  content: '\25BC  ';
}
</style>
