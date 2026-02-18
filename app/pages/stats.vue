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
  players: { player_name: string; position: number; final_score: number }[]
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
  } catch {
    rankings.value = []
  } finally {
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
  if (trend.length < 2) return 'neutral'
  const last = trend[trend.length - 1]!.eloAfter
  const first = trend[0]!.eloAfter
  if (last > first) return 'up'
  if (last < first) return 'down'
  return 'neutral'
}

function eloTrendDelta(trend: EloTrendEntry[]): number {
  if (trend.length < 2) return 0
  return trend[trend.length - 1]!.eloAfter - trend[0]!.eloAfter
}

interface AchievementItem {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedBy: { playerName: string; unlockedAt: string; metadata: unknown }[]
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
    if (days <= 8) parts.push('Last 7 days')
    else if (days <= 31) parts.push('Last 30 days')
    else parts.push('Last 90 days')
  }
  if (mode) parts.push(mode)
  return parts.length > 0 ? parts.join(' \u00b7 ') : 'All games'
})

function buildFilterParams(filter: FilterState): string {
  const parts: string[] = []
  if (filter.from) parts.push(`from=${encodeURIComponent(filter.from)}`)
  if (filter.to) parts.push(`to=${encodeURIComponent(filter.to)}`)
  if (filter.mode) parts.push(`mode=${encodeURIComponent(filter.mode)}`)
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
  } catch {
    stats.value = null
    trends.value = null
  } finally {
    loading.value = false
  }
}

async function fetchHistory() {
  const fp = buildFilterParams(activeFilter.value)
  try {
    const h = await $fetch<GameHistoryItem[]>(`/api/history?limit=20${fp}`)
    history.value = h
    hasMoreHistory.value = h.length >= 20
  } catch {
    history.value = []
  }
}

async function loadMoreHistory() {
  if (loadingMore.value || !hasMoreHistory.value) return
  loadingMore.value = true
  const fp = buildFilterParams(activeFilter.value)
  const playerParam = selectedPlayer.value ? `&player=${encodeURIComponent(selectedPlayer.value)}` : ''
  try {
    const more = await $fetch<GameHistoryItem[]>(
      `/api/history?limit=20&offset=${history.value.length}${playerParam}${fp}`
    )
    history.value = [...history.value, ...more]
    hasMoreHistory.value = more.length >= 20
  } catch {
    hasMoreHistory.value = false
  } finally {
    loadingMore.value = false
  }
}

function onFilterUpdate(filter: FilterState) {
  activeFilter.value = filter
  if (selectedPlayer.value) {
    fetchStats(selectedPlayer.value)
  } else {
    fetchHistory()
  }
}

watch(selectedPlayer, (name) => {
  if (name) fetchStats(name)
})

async function fetchAchievements() {
  try {
    achievementList.value = await $fetch<AchievementItem[]>('/api/achievements')
  } catch {
    achievementList.value = []
  }
}

const unlockedCount = computed(() => achievementList.value.filter(a => a.unlocked).length)
const totalCount = computed(() => achievementList.value.length)

function achievementUnlockDate(achievement: AchievementItem): string | null {
  if (achievement.unlockedBy.length === 0) return null
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
    if (selectedPlayer.value) params.push(`player=${encodeURIComponent(selectedPlayer.value)}`)
    if (activeFilter.value.from) params.push(`from=${encodeURIComponent(activeFilter.value.from)}`)
    if (activeFilter.value.to) params.push(`to=${encodeURIComponent(activeFilter.value.to)}`)
    if (activeFilter.value.mode) params.push(`mode=${encodeURIComponent(activeFilter.value.mode)}`)

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
  } finally {
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
  if (!stats.value || stats.value.total_turns === 0) return 0
  return Math.round((stats.value.busts / stats.value.total_turns) * 1000) / 10
})

// Milestone cards
const milestoneCards = computed(() => {
  if (!stats.value) return []
  return [
    { label: '180s', value: stats.value.count_180, accent: 'gold' as const },
    { label: '140+', value: stats.value.count_140_plus, accent: 'muted' as const },
    { label: '100+', value: stats.value.count_100_plus, accent: 'muted' as const },
    { label: 'Highest Turn', value: stats.value.highest_turn ?? '\u2014', accent: 'muted' as const },
  ]
})

// Recent form dots (last 10 games)
const recentForm = computed(() => {
  if (!trends.value || trends.value.game_averages.length === 0) return []
  return trends.value.game_averages.slice(-10).map(g => g.won)
})

// Performance trend data
const trendValues = computed(() => {
  if (!trends.value) return []
  return trends.value.game_averages.map(g => g.average)
})

const trendXLabels = computed(() => {
  if (!trends.value) return []
  return trends.value.game_averages.map(g => formatShortDate(g.created_at))
})

const overallAverage = computed(() => stats.value?.three_dart_average ?? 0)

// Win rate trend (cumulative)
const winRateTrendValues = computed(() => {
  if (!trends.value || trends.value.game_averages.length < 2) return []
  let wins = 0
  return trends.value.game_averages.map((g, i) => {
    if (g.won) wins++
    return Math.round((wins / (i + 1)) * 1000) / 10
  })
})

const winRateTrendLabels = computed(() => {
  if (!trends.value) return []
  return trends.value.game_averages.map(g => formatShortDate(g.created_at))
})

const overallWinRate = computed(() => stats.value?.win_rate ?? 0)

// Turn distribution
const recentTurnTotals = computed(() => {
  if (!insights.value) return []
  return insights.value.turns
    .slice(0, 16)
    .map((turn) => (turn.busted ? 0 : turn.total_points))
    .reverse()
})

const momentumXLabels = computed(() => {
  if (!insights.value) return undefined
  const turns = insights.value.turns.slice(0, 16).reverse()
  if (turns.length === 0 || !turns[0]?.game_created_at) return undefined
  return turns.map(t => formatShortDate(t.game_created_at))
})

const turnDistribution = computed(() => {
  const buckets = [0, 20, 40, 60, 80, 100, 120, 140]
  const labels = buckets.map((b, i) => (
    i === 0 ? '0-19*' : i === buckets.length - 1 ? '140+' : `${b}-${b + 19}`
  ))
  const values = new Array(labels.length).fill(0) as number[]
  if (!insights.value) return { labels, values }
  insights.value.turns.forEach((turn) => {
    const total = turn.busted ? 0 : turn.total_points
    const idx = buckets.findIndex((b, i) => (
      i === buckets.length - 1
        ? total >= b
        : total >= b && total < buckets[i + 1]!
    ))
    if (idx >= 0) values[idx]! += 1
  })
  return { labels, values }
})

// Ring accuracy (with misses) — donut format
const ringBreakdownForDonut = computed(() => {
  const ringColors = {
    Miss: 'var(--red)',
    S: 'var(--blue)',
    D: 'var(--gold)',
    T: 'var(--green)',
    Bull: 'var(--purple)',
  } as Record<string, string>

  const labels = ['Miss', 'S', 'D', 'T', 'Bull'] as const
  const values = [0, 0, 0, 0, 0]

  if (insights.value) {
    insights.value.throws.forEach((t) => {
      if (t.segment === 0) {
        values[0]! += 1
      } else if (t.segment === 25) {
        values[4]! += 1
      } else if (t.multiplier === 1) {
        values[1]! += 1
      } else if (t.multiplier === 2) {
        values[2]! += 1
      } else if (t.multiplier === 3) {
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
  if (!insights.value) return { labels: [] as string[], values: [] as number[] }
  insights.value.throws.forEach((t) => {
    if (t.segment === 0) return
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
  if (!insights.value) return counts
  insights.value.throws.forEach((t) => {
    if (t.segment === 0) return
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
  if (!trends.value || trends.value.checkout_darts.length === 0) return { labels: [] as string[], values: [] as number[] }
  const top = trends.value.checkout_darts.slice(0, 8)
  return {
    labels: top.map(c => c.label),
    values: top.map(c => c.count),
  }
})

// Head-to-head
const headToHead = computed(() => {
  if (!trends.value) return []
  return trends.value.head_to_head
})

// Top segments
const topSegments = computed(() => {
  if (!insights.value) return []
  const map = new Map<string, number>()
  insights.value.throws.forEach((t) => {
    if (t.segment === 0) return
    const label = t.segment === 25
      ? (t.multiplier === 2 ? 'DB' : 'SB')
      : `${t.multiplier === 3 ? 'T' : t.multiplier === 2 ? 'D' : 'S'}${t.segment}`
    map.set(label, (map.get(label) ?? 0) + 1)
  })
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
})

const consistencyScore = computed(() => {
  if (!insights.value || insights.value.turns.length === 0) return 0
  const totals = insights.value.turns.map((t) => (t.busted ? 0 : t.total_points))
  const avg = totals.reduce((a, v) => a + v, 0) / totals.length
  const variance = totals.reduce((a, v) => a + Math.pow(v - avg, 2), 0) / totals.length
  const score = Math.max(0, 100 - Math.sqrt(variance))
  return Math.round(score)
})

const insightCards = computed(() => {
  const cards: { title: string; detail: string; tone?: 'gold' | 'blue' | 'green' }[] = []
  if (!stats.value) return cards

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
  if (!trends.value) return null
  const g = trends.value.game_averages.find(ga => ga.game_id === gameId)
  return g ? g.average : null
}
</script>

<template>
  <div class="px-lg py-xl max-w-[1100px] mx-auto w-full">
    <!-- Section 1: Hero -->
    <div
      class="stats-hero"
      v-motion
      :initial="{ opacity: 0, y: -10 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 300 } }"
    >
      <div class="flex-1">
        <h2 class="text-[2rem] font-extrabold text-fg mb-xs">Performance Hub</h2>
        <p class="text-[0.9rem] text-fg-secondary max-w-[480px]">Track trends, accuracy, and game flow.</p>
      </div>
      <div class="export-wrapper" style="position: relative; z-index: 10;">
        <button
          class="export-btn"
          :disabled="exporting"
          @click="showExportMenu = !showExportMenu"
        >
          {{ exporting ? 'Exporting...' : 'Export' }}
        </button>
        <div v-if="showExportMenu" class="export-menu">
          <button class="export-menu-item" @click="exportData('csv')">Download CSV</button>
          <button class="export-menu-item" @click="exportData('json')">Download JSON</button>
        </div>
      </div>
      <div class="stats-glow"></div>
    </div>

    <!-- Tab switcher -->
    <div
      class="flex justify-center gap-sm mb-xl"
      v-motion
      :initial="{ opacity: 0 }"
      :enter="{ opacity: 1, transition: { duration: 300, delay: 80 } }"
    >
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'stats' }"
        @click="switchTab('stats')"
      >
        Player Stats
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'rankings' }"
        @click="switchTab('rankings')"
      >
        Rankings
      </button>
    </div>

    <!-- Rankings view -->
    <div v-if="activeTab === 'rankings'">
      <div v-if="loadingRankings" class="text-center text-fg-muted p-2xl">Loading rankings...</div>
      <div v-else-if="rankings.length === 0" class="text-center text-fg-muted p-2xl text-[0.95rem]">
        No rankings yet. Play some 2-player games to generate Elo ratings!
      </div>
      <div v-else class="flex flex-col gap-sm">
        <div
          v-for="player in rankings"
          :key="player.name"
          class="glass-card p-md flex items-center gap-md rankings-row"
          :class="{ 'rank-gold': player.rank === 1, 'rank-silver': player.rank === 2, 'rank-bronze': player.rank === 3 }"
          v-motion
          :initial="{ opacity: 0, x: -10 }"
          :enter="{ opacity: 1, x: 0, transition: { duration: 300, delay: 80 + player.rank * 50 } }"
        >
          <div class="rank-badge" :class="{ 'rank-1': player.rank === 1, 'rank-2': player.rank === 2, 'rank-3': player.rank === 3 }">
            {{ player.rank }}
          </div>
          <PlayerAvatar :name="player.name" :avatar-seed="player.avatarSeed" :avatar-style="player.avatarStyle" :size="36" />
          <div class="flex-1 min-w-0">
            <div class="text-[0.95rem] font-semibold text-fg truncate">{{ player.name }}</div>
            <div class="flex items-center gap-xs">
              <span
                v-if="player.trend.length >= 2"
                class="elo-trend"
                :class="{
                  'trend-up': eloTrendDirection(player.trend) === 'up',
                  'trend-down': eloTrendDirection(player.trend) === 'down',
                  'trend-neutral': eloTrendDirection(player.trend) === 'neutral',
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
                  class="sparkline-dot"
                  :class="entry.result === 'win' ? 'spark-win' : 'spark-loss'"
                ></span>
              </span>
            </div>
          </div>
          <div class="text-right">
            <div class="text-[1.4rem] font-extrabold tabular-nums text-fg">{{ player.currentElo }}</div>
            <div class="text-[0.65rem] font-semibold text-fg-muted uppercase tracking-wide">Elo</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Player stats view -->
    <div v-if="activeTab === 'stats'">

    <!-- Player chips -->
    <div
      class="flex flex-wrap gap-sm justify-center mb-md"
      v-motion
      :initial="{ opacity: 0 }"
      :enter="{ opacity: 1, transition: { duration: 300, delay: 100 } }"
    >
      <button
        v-for="player in players"
        :key="player.id"
        class="player-chip"
        :class="{ active: player.name === selectedPlayer }"
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
      class="flex justify-center mb-xl"
      v-motion
      :initial="{ opacity: 0 }"
      :enter="{ opacity: 1, transition: { duration: 300, delay: 150 } }"
    >
      <StatsFilterBar @update="onFilterUpdate" />
    </div>

    <div v-if="loading" class="text-center text-fg-muted p-2xl">Loading stats...</div>

    <div v-if="stats && !loading" class="flex flex-col gap-2xl">

      <!-- ============================================================ -->
      <!-- OVERVIEW BAND: Primary Cards + Form Dots + Secondary Cards   -->
      <!-- ============================================================ -->
      <section class="flex flex-col gap-md">
        <div class="flex items-center justify-between gap-md mb-md flex-wrap">
          <h3 class="section-title !mb-0">Overview</h3>
          <span class="text-[0.7rem] text-fg-muted uppercase tracking-widest">{{ filterLabel }}</span>
        </div>

        <!-- Primary tier (3 hero cards) -->
        <div class="grid grid-cols-3 gap-md max-sm:grid-cols-1">
          <div
            v-for="(card, i) in primaryCards"
            :key="card.key"
            class="primary-stat-card"
            :class="{ 'primary-hero': card.hero }"
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: 150 + i * 40 } }"
          >
            <div class="text-[0.75rem] text-fg-muted">{{ card.icon }}</div>
            <div class="text-[2.4rem] font-extrabold text-fg tabular-nums leading-none">
              <template v-if="card.key === 'win_rate'">{{ (stats as any)[card.key] ?? 0 }}</template>
              <template v-else>{{ (stats as any)[card.key] ?? '\u2014' }}</template>
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
            class="form-dot"
            :class="won ? 'form-win' : 'form-loss'"
          ></span>
        </div>

        <!-- Secondary tier (6 smaller cards) -->
        <div class="grid grid-cols-3 gap-sm max-sm:grid-cols-2">
          <div
            v-for="(card, i) in secondaryCards"
            :key="card.key"
            class="glass-card p-md text-center flex flex-col items-center gap-[2px]"
            :title="card.title"
            v-motion
            :initial="{ opacity: 0, y: 12 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: 280 + i * 30 } }"
          >
            <div class="text-[0.7rem] text-fg-muted">{{ card.icon }}</div>
            <div class="text-[1.4rem] font-extrabold text-fg tabular-nums">
              <template v-if="card.key === 'bust_rate'">{{ bustRate.toFixed(1) }}</template>
              <template v-else>{{ (stats as any)[card.key] ?? '\u2014' }}</template>
              <span v-if="card.suffix" class="text-[0.85rem]">{{ card.suffix }}</span>
            </div>
            <div class="text-[0.65rem] font-semibold text-fg-muted uppercase tracking-wide">
              {{ card.label }}
              <span v-if="card.sublabel" class="text-fg-muted font-normal">({{ card.sublabel }})</span>
            </div>
          </div>
        </div>

        <!-- Metric explainer -->
        <details class="metric-explainer">
          <summary class="text-[0.7rem] text-fg-muted cursor-pointer hover:text-fg-secondary transition-colors">What do these mean?</summary>
          <div class="explainer-content">
            <p><strong>3-Dart Avg</strong> &mdash; Average points per 3-dart visit across all turns, including busts (counted as 0).</p>
            <p><strong>Scoring Avg</strong> &mdash; Average per 3-dart visit, excluding busted turns entirely. Usually higher than 3-Dart Avg.</p>
            <p><strong>First 9 Avg</strong> &mdash; Average of your first 3 visits (9 darts) each leg. Shows opening strength before checkout pressure.</p>
            <p><strong>Bust Rate</strong> &mdash; Percentage of turns that busted (went over the remaining score).</p>
            <p><strong>Avg Darts/Leg</strong> &mdash; Average number of darts needed to complete a leg. Lower is better.</p>
          </div>
        </details>
      </section>

      <!-- Scoring Milestones -->
      <section
        class="flex flex-col gap-md"
        v-motion
        :initial="{ opacity: 0 }"
        :enter="{ opacity: 1, transition: { duration: 300, delay: 400 } }"
      >
        <h3 class="section-title">Scoring Milestones</h3>
        <div class="grid grid-cols-4 gap-md max-sm:grid-cols-2">
          <div
            v-for="m in milestoneCards"
            :key="m.label"
            class="milestone-card"
            :class="m.accent"
          >
            <div class="text-[2rem] font-extrabold tabular-nums">{{ m.value }}</div>
            <div class="text-[0.7rem] font-semibold uppercase tracking-wide opacity-70">{{ m.label }}</div>
          </div>
        </div>
      </section>

      <!-- ============================================================ -->
      <!-- TRENDS GROUP: Performance Trend + Win Rate Trend             -->
      <!-- ============================================================ -->
      <StatsChartSection
        v-if="trendValues.length >= 2"
        title="Performance Trend"
        description="Your 3-dart average per game over time. The dashed line shows a 5-game rolling average to smooth out variance."
        v-motion
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
        title="Win Rate Trend"
        description="Cumulative win percentage across all games. A rising line means you're winning more than losing."
        v-motion
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
          <p class="text-[0.65rem] text-fg-muted mt-xs">* includes busts</p>
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
        class="flex flex-col gap-md"
        v-motion
        :initial="{ opacity: 0, y: 20 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: 550 } }"
      >
        <div class="flex items-center justify-between gap-md">
          <h3 class="section-title !mb-0">Head-to-Head</h3>
          <NuxtLink
            :to="{ path: '/stats/head-to-head', query: { player1: selectedPlayer } }"
            class="h2h-compare-link"
          >
            Compare
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </NuxtLink>
        </div>
        <div class="flex flex-col gap-sm">
          <NuxtLink
            v-for="h2h in headToHead"
            :key="h2h.opponent"
            :to="{ path: '/stats/head-to-head', query: { player1: selectedPlayer, player2: h2h.opponent } }"
            class="glass-card p-md flex items-center gap-md h2h-row-link"
          >
            <PlayerAvatar v-bind="getAvatarProps(h2h.opponent)" :size="28" />
            <div class="flex-1 min-w-0">
              <div class="text-[0.85rem] font-semibold text-fg truncate">{{ h2h.opponent }}</div>
              <div class="text-[0.7rem] text-fg-muted">{{ h2h.games_played }} game{{ h2h.games_played !== 1 ? 's' : '' }}</div>
            </div>
            <div class="flex items-center gap-sm">
              <span class="text-[0.9rem] font-bold tabular-nums" :class="h2h.wins >= h2h.losses ? 'text-green' : 'text-fg-muted'">{{ h2h.wins }}</span>
              <div class="h2h-bar" :style="{ '--win-pct': `${(h2h.wins / h2h.games_played) * 100}%` }">
                <div class="h2h-bar-fill"></div>
              </div>
              <span class="text-[0.9rem] font-bold tabular-nums" :class="h2h.losses > h2h.wins ? 'text-red' : 'text-fg-muted'">{{ h2h.losses }}</span>
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Recommendations -->
      <section class="flex flex-col gap-md">
        <div class="flex items-baseline justify-between gap-md mb-md">
          <h3 class="section-title !mb-0">Recommendations</h3>
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
      <h3 class="section-title mt-2xl">Game History</h3>
      <div class="flex flex-col gap-sm">
        <div
          v-for="game in history"
          :key="game.id"
          class="glass-card p-md flex justify-between items-center max-sm:flex-wrap max-sm:gap-sm"
        >
          <div class="flex items-center gap-md">
            <span class="text-[0.75rem] font-bold text-gold bg-gold-tint px-[8px] py-[2px] rounded-sm">{{ game.mode }}</span>
            <span class="text-[0.85rem] text-fg-secondary">
              <template v-for="(p, i) in game.players" :key="p.player_name">
                <span v-if="i > 0" class="text-fg-muted mx-xs text-[0.75rem]">vs</span>
                <span :class="{ 'text-gold font-semibold': game.winner_name === p.player_name }">
                  {{ p.player_name }}
                </span>
              </template>
            </span>
            <span class="text-[0.85rem] font-semibold text-fg tabular-nums">
              {{ game.players.map(p => p.final_score).join(' - ') }}
            </span>
          </div>
          <div class="flex flex-col items-end gap-[2px]">
            <span v-if="gameAverage(game.id) != null" class="text-[0.75rem] text-fg-secondary font-semibold tabular-nums">
              avg {{ gameAverage(game.id)!.toFixed(1) }}
            </span>
            <span class="text-[0.75rem] text-fg-muted">{{ game.total_turns }} turns</span>
            <span class="text-[0.7rem] text-fg-muted">{{ formatDate(game.created_at) }}</span>
          </div>
        </div>
      </div>
      <div v-if="hasMoreHistory" class="flex justify-center mt-lg">
        <button
          class="load-more-btn"
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
      class="mt-2xl"
      v-motion
      :initial="{ opacity: 0, y: 20 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: 600 } }"
    >
      <div class="flex items-baseline justify-between gap-md mb-md">
        <h3 class="section-title !mb-0">Achievements</h3>
        <span class="text-[0.7rem] text-fg-muted uppercase tracking-widest tabular-nums">
          {{ unlockedCount }} / {{ totalCount }} unlocked
        </span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-md">
        <div
          v-for="achievement in achievementList"
          :key="achievement.id"
          class="achievement-card"
          :class="{ unlocked: achievement.unlocked, locked: !achievement.unlocked }"
        >
          <div class="achievement-card-icon">{{ achievement.icon }}</div>
          <div class="achievement-card-name">{{ achievement.name }}</div>
          <div class="achievement-card-desc">{{ achievement.description }}</div>
          <template v-if="achievement.unlocked">
            <div class="achievement-card-players">
              <span
                v-for="u in achievement.unlockedBy"
                :key="u.playerName"
                class="achievement-player-tag"
              >
                {{ u.playerName }}
              </span>
            </div>
            <div v-if="achievementUnlockDate(achievement)" class="achievement-card-date">
              {{ achievementUnlockDate(achievement) }}
            </div>
          </template>
        </div>
      </div>
    </section>

    </div><!-- end activeTab === 'stats' -->
  </div>
</template>

<style scoped>
.stats-hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg) var(--spacing-xl);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(59, 130, 246, 0.08));
  border: 1px solid var(--border-subtle);
  overflow: visible;
  margin-bottom: var(--spacing-xl);
}

.stats-glow {
  position: absolute;
  top: -60px;
  right: -40px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.25), transparent 70%);
  filter: blur(6px);
}

.section-title {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: var(--spacing-md);
}

/* Primary stat cards (3 hero metrics) */
.primary-stat-card {
  padding: var(--spacing-lg) var(--spacing-xl);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
}

.primary-stat-card.primary-hero {
  border-color: rgba(255, 215, 0, 0.25);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.08), transparent);
  box-shadow: 0 0 24px rgba(255, 215, 0, 0.08);
}

/* Metric explainer */
.metric-explainer {
  margin-top: var(--spacing-xs);
}

.metric-explainer summary {
  list-style: none;
  user-select: none;
}

.metric-explainer summary::-webkit-details-marker {
  display: none;
}

.metric-explainer summary::before {
  content: '\25B6  ';
  font-size: 0.55rem;
  vertical-align: middle;
}

.metric-explainer[open] summary::before {
  content: '\25BC  ';
}

.explainer-content {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.72rem;
  color: var(--text-muted);
  line-height: 1.6;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.explainer-content strong {
  color: var(--text-secondary);
}

.player-chip {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-lg);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background var(--duration-fast),
    border-color var(--duration-fast),
    color var(--duration-fast),
    transform var(--duration-fast);
}

.player-chip:hover {
  background: var(--surface-3);
  transform: translateY(-1px);
}

.player-chip.active {
  background: rgba(255, 215, 0, 0.12);
  border-color: var(--border-gold);
  color: var(--gold);
  font-weight: 600;
}

/* Milestone cards */
.milestone-card {
  padding: var(--spacing-lg);
  text-align: center;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  background: var(--surface-2);
}

.milestone-card.gold {
  border-color: rgba(255, 215, 0, 0.25);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.08), transparent);
  color: var(--gold);
  box-shadow: 0 0 24px rgba(255, 215, 0, 0.1);
}

.milestone-card.muted {
  color: var(--text-primary);
}

/* Head-to-head bar */
.h2h-bar {
  width: 60px;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  position: relative;
}

.h2h-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: var(--win-pct);
  border-radius: 3px;
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.8), rgba(34, 197, 94, 0.4));
  transition: width var(--duration-normal) var(--ease-out);
}

/* Recent form dots */
.form-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.form-win {
  background: rgba(34, 197, 94, 0.9);
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
}

.form-loss {
  background: rgba(239, 68, 68, 0.9);
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
}

/* Load more button */
.load-more-btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background var(--duration-fast),
    border-color var(--duration-fast);
}

.load-more-btn:hover:not(:disabled) {
  background: var(--surface-3);
  border-color: var(--border-default);
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Export button */
.export-wrapper {
  flex-shrink: 0;
}

.export-btn {
  padding: var(--spacing-xs) var(--spacing-lg);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background var(--duration-fast),
    border-color var(--duration-fast);
}

.export-btn:hover:not(:disabled) {
  background: var(--surface-3);
  border-color: var(--border-default);
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  min-width: 150px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.export-menu-item {
  display: block;
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: none;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background var(--duration-fast);
}

.export-menu-item:hover {
  background: var(--surface-3);
}

/* H2H row link */
.h2h-row-link {
  text-decoration: none;
  transition:
    border-color var(--duration-fast),
    background var(--duration-fast);
  cursor: pointer;
}

.h2h-row-link:hover {
  border-color: var(--border-default);
  background: var(--surface-3);
}

/* H2H compare link */
.h2h-compare-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: color var(--duration-fast);
}

.h2h-compare-link:hover {
  color: var(--gold);
}

/* Color utilities */
.text-green {
  color: rgba(34, 197, 94, 0.9);
}

.text-red {
  color: rgba(239, 68, 68, 0.9);
}

/* Tab buttons */
.tab-btn {
  padding: var(--spacing-xs) var(--spacing-xl);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background var(--duration-fast),
    border-color var(--duration-fast),
    color var(--duration-fast);
}

.tab-btn:hover {
  background: var(--surface-3);
}

.tab-btn.active {
  background: rgba(255, 215, 0, 0.12);
  border-color: var(--border-gold);
  color: var(--gold);
  font-weight: 600;
}

/* Rankings */
.rankings-row {
  transition: transform var(--duration-fast), box-shadow var(--duration-fast);
}

.rankings-row:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.rank-gold {
  border-color: rgba(255, 215, 0, 0.25);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.06), transparent);
}

.rank-silver {
  border-color: rgba(192, 192, 192, 0.2);
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.04), transparent);
}

.rank-bronze {
  border-color: rgba(205, 127, 50, 0.2);
  background: linear-gradient(135deg, rgba(205, 127, 50, 0.04), transparent);
}

.rank-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
  background: var(--surface-3);
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.1));
  color: var(--gold);
  border-color: rgba(255, 215, 0, 0.4);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.2);
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.25), rgba(192, 192, 192, 0.08));
  color: #c0c0c0;
  border-color: rgba(192, 192, 192, 0.3);
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, rgba(205, 127, 50, 0.25), rgba(205, 127, 50, 0.08));
  color: #cd7f32;
  border-color: rgba(205, 127, 50, 0.3);
}

.elo-trend {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  tabular-nums: true;
}

.trend-up {
  color: rgba(34, 197, 94, 0.9);
  background: rgba(34, 197, 94, 0.1);
}

.trend-down {
  color: rgba(239, 68, 68, 0.9);
  background: rgba(239, 68, 68, 0.1);
}

.trend-neutral {
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
}

.sparkline-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.spark-win {
  background: rgba(34, 197, 94, 0.8);
}

.spark-loss {
  background: rgba(239, 68, 68, 0.8);
}

/* Achievement cards */
.achievement-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-md) var(--spacing-sm);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  background: var(--surface-2);
  text-align: center;
  transition: transform var(--duration-fast), box-shadow var(--duration-fast);
}

.achievement-card.unlocked {
  border-color: rgba(255, 215, 0, 0.25);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.08), transparent);
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.08);
}

.achievement-card.unlocked:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.15);
}

.achievement-card.locked {
  opacity: 0.45;
}

.achievement-card-icon {
  font-size: 1.8rem;
  line-height: 1;
}

.achievement-card.locked .achievement-card-icon {
  filter: grayscale(1);
}

.achievement-card-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.achievement-card-desc {
  font-size: 0.65rem;
  color: var(--text-muted);
  line-height: 1.3;
}

.achievement-card-players {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  justify-content: center;
  margin-top: 2px;
}

.achievement-player-tag {
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--gold);
  background: rgba(255, 215, 0, 0.1);
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

.achievement-card-date {
  font-size: 0.6rem;
  color: var(--text-muted);
}
</style>
