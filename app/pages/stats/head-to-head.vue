<script setup lang="ts">
const route = useRoute()
const { players, fetchPlayers, getAvatarProps } = usePlayers()

const player1 = ref('')
const player2 = ref('')
const loading = ref(false)

interface RecentGame {
  game_id: number
  created_at: string
  mode: string
  winner_name: string | null
  player1_score: number
  player2_score: number
  player1_avg: number | null
  player2_avg: number | null
}

interface H2HStats {
  player1: string
  player2: string
  total_games: number
  player1_wins: number
  player2_wins: number
  draws: number
  player1_avg: number
  player2_avg: number
  recent_games: RecentGame[]
}

const stats = ref<H2HStats | null>(null)
const error = ref('')

async function fetchH2H() {
  if (!player1.value || !player2.value) return
  if (player1.value === player2.value) {
    error.value = 'Please select two different players'
    stats.value = null
    return
  }

  loading.value = true
  error.value = ''
  try {
    const data = await $fetch<H2HStats>(
      `/api/stats/head-to-head?player1=${encodeURIComponent(player1.value)}&player2=${encodeURIComponent(player2.value)}`,
    )
    stats.value = data
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to load head-to-head stats'
    stats.value = null
  } finally {
    loading.value = false
  }
}

// Available opponents for player2 dropdown (exclude player1)
const player2Options = computed(() =>
  players.value.filter(p => p.name !== player1.value),
)

// Watch both selectors and auto-fetch when both are set
watch([player1, player2], () => {
  if (player1.value && player2.value && player1.value !== player2.value) {
    fetchH2H()
  }
})

// Reset player2 if it matches player1
watch(player1, (name) => {
  if (name === player2.value) {
    player2.value = ''
    stats.value = null
  }
})

onMounted(async () => {
  await fetchPlayers()
  // Pre-fill from query params
  const p1 = route.query.player1 as string | undefined
  const p2 = route.query.player2 as string | undefined
  if (p1) player1.value = p1
  if (p2) player2.value = p2
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const winPctPlayer1 = computed(() => {
  if (!stats.value || stats.value.total_games === 0) return 0
  return Math.round((stats.value.player1_wins / stats.value.total_games) * 1000) / 10
})

const winPctPlayer2 = computed(() => {
  if (!stats.value || stats.value.total_games === 0) return 0
  return Math.round((stats.value.player2_wins / stats.value.total_games) * 1000) / 10
})

// Recent form: last 5 results from perspective of player1
const recentForm = computed(() => {
  if (!stats.value) return []
  return stats.value.recent_games.map(g => ({
    won: g.winner_name === stats.value!.player1,
    draw: g.winner_name === null,
  }))
})
</script>

<template>
  <div class="px-lg py-xl max-w-[800px] mx-auto w-full">
    <!-- Header -->
    <div class="h2h-hero mb-xl">
      <div class="flex-1">
        <h2 class="text-[1.8rem] font-extrabold text-fg mb-xs">Head-to-Head</h2>
        <p class="text-[0.85rem] text-fg-secondary">Compare two players side by side.</p>
      </div>
      <NuxtLink to="/stats" class="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        Stats
      </NuxtLink>
    </div>

    <!-- Player selectors -->
    <div class="selector-row mb-xl">
      <div class="selector-group">
        <label class="selector-label">Player 1</label>
        <select v-model="player1" class="selector-input">
          <option value="" disabled>Select player</option>
          <option v-for="p in players" :key="p.id" :value="p.name">{{ p.name }}</option>
        </select>
      </div>

      <div class="vs-badge">VS</div>

      <div class="selector-group">
        <label class="selector-label">Player 2</label>
        <select v-model="player2" class="selector-input">
          <option value="" disabled>Select player</option>
          <option v-for="p in player2Options" :key="p.id" :value="p.name">{{ p.name }}</option>
        </select>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="text-center text-red text-[0.85rem] mb-lg">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="text-center text-fg-muted p-2xl">Loading comparison...</div>

    <!-- No games -->
    <div v-if="stats && stats.total_games === 0 && !loading" class="text-center text-fg-muted p-2xl text-[0.9rem]">
      No head-to-head games found between these players.
    </div>

    <!-- Stats content -->
    <div v-if="stats && stats.total_games > 0 && !loading" class="flex flex-col gap-xl">
      <!-- Win record with avatars -->
      <section class="glass-card p-xl">
        <div class="win-record">
          <div class="win-record-player">
            <PlayerAvatar v-bind="getAvatarProps(stats.player1)" :size="56" />
            <div class="win-record-name">{{ stats.player1 }}</div>
            <div class="win-record-wins" :class="{ leading: stats.player1_wins > stats.player2_wins }">
              {{ stats.player1_wins }}
            </div>
          </div>

          <div class="win-record-center">
            <div class="win-record-total">{{ stats.total_games }} game{{ stats.total_games !== 1 ? 's' : '' }}</div>
            <div class="win-record-bar">
              <div
                class="win-record-bar-p1"
                :style="{ width: `${stats.total_games > 0 ? (stats.player1_wins / stats.total_games) * 100 : 50}%` }"
              ></div>
              <div
                v-if="stats.draws > 0"
                class="win-record-bar-draw"
                :style="{ width: `${(stats.draws / stats.total_games) * 100}%` }"
              ></div>
              <div
                class="win-record-bar-p2"
                :style="{ width: `${stats.total_games > 0 ? (stats.player2_wins / stats.total_games) * 100 : 50}%` }"
              ></div>
            </div>
            <!-- Recent form dots -->
            <div v-if="recentForm.length > 0" class="flex items-center gap-[4px] mt-sm">
              <span
                v-for="(result, i) in recentForm"
                :key="i"
                class="form-dot"
                :class="result.draw ? 'form-draw' : result.won ? 'form-win' : 'form-loss'"
              ></span>
              <span class="text-[0.65rem] text-fg-muted ml-xs">recent</span>
            </div>
          </div>

          <div class="win-record-player">
            <PlayerAvatar v-bind="getAvatarProps(stats.player2)" :size="56" />
            <div class="win-record-name">{{ stats.player2 }}</div>
            <div class="win-record-wins" :class="{ leading: stats.player2_wins > stats.player1_wins }">
              {{ stats.player2_wins }}
            </div>
          </div>
        </div>
      </section>

      <!-- Stats comparison bars -->
      <section class="glass-card p-lg">
        <h3 class="section-title">Comparison</h3>
        <div class="flex flex-col gap-sm">
          <StatsComparisonBar
            label="Wins"
            :left-value="stats.player1_wins"
            :right-value="stats.player2_wins"
            format="number"
          />
          <StatsComparisonBar
            label="Win %"
            :left-value="winPctPlayer1"
            :right-value="winPctPlayer2"
            format="decimal"
          />
          <StatsComparisonBar
            label="3-Dart Avg"
            :left-value="stats.player1_avg"
            :right-value="stats.player2_avg"
            format="decimal"
          />
        </div>
      </section>

      <!-- Recent H2H games -->
      <section v-if="stats.recent_games.length > 0" class="flex flex-col gap-md">
        <h3 class="section-title">Recent Matches</h3>
        <div class="flex flex-col gap-sm">
          <div
            v-for="game in stats.recent_games"
            :key="game.game_id"
            class="glass-card p-md recent-game"
          >
            <div class="recent-game-header">
              <span class="text-[0.7rem] font-bold text-gold bg-gold-tint px-[8px] py-[2px] rounded-sm">
                {{ game.mode }}
              </span>
              <span class="text-[0.7rem] text-fg-muted">{{ formatDate(game.created_at) }}</span>
            </div>
            <div class="recent-game-result">
              <div class="recent-game-player left">
                <PlayerAvatar v-bind="getAvatarProps(stats.player1)" :size="28" />
                <span
                  class="recent-game-name"
                  :class="{ winner: game.winner_name === stats.player1 }"
                >{{ stats.player1 }}</span>
              </div>
              <div class="recent-game-score">
                <span :class="{ 'text-gold': game.winner_name === stats.player1 }">{{ game.player1_score }}</span>
                <span class="text-fg-muted mx-xs">-</span>
                <span :class="{ 'text-gold': game.winner_name === stats.player2 }">{{ game.player2_score }}</span>
              </div>
              <div class="recent-game-player right">
                <span
                  class="recent-game-name"
                  :class="{ winner: game.winner_name === stats.player2 }"
                >{{ stats.player2 }}</span>
                <PlayerAvatar v-bind="getAvatarProps(stats.player2)" :size="28" />
              </div>
            </div>
            <div v-if="game.player1_avg != null || game.player2_avg != null" class="recent-game-avgs">
              <span class="text-[0.7rem] tabular-nums text-fg-secondary">
                {{ game.player1_avg != null ? `avg ${game.player1_avg}` : '' }}
              </span>
              <span class="text-[0.7rem] tabular-nums text-fg-secondary">
                {{ game.player2_avg != null ? `avg ${game.player2_avg}` : '' }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Empty state -->
    <div v-if="!player1 && !player2 && !loading" class="text-center text-fg-muted p-2xl text-[0.9rem]">
      Select two players to compare their rivalry.
    </div>
  </div>
</template>

<style scoped>
.h2h-hero {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg) var(--spacing-xl);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(239, 68, 68, 0.08));
  border: 1px solid var(--border-subtle);
}

.back-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: color var(--duration-fast);
}

.back-link:hover {
  color: var(--text-secondary);
}

.section-title {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: var(--spacing-md);
}

/* Player selectors */
.selector-row {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-md);
}

.selector-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.selector-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
}

.selector-input {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 500;
  appearance: none;
  cursor: pointer;
  transition:
    border-color var(--duration-fast),
    background var(--duration-fast);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.selector-input:hover {
  border-color: var(--border-default);
}

.selector-input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.15);
}

.vs-badge {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 1px;
  flex-shrink: 0;
}

/* Win record */
.win-record {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.win-record-player {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  min-width: 70px;
}

.win-record-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-align: center;
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.win-record-wins {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.win-record-wins.leading {
  color: var(--gold);
}

.win-record-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.win-record-total {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
}

.win-record-bar {
  width: 100%;
  height: 10px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  overflow: hidden;
  gap: 2px;
}

.win-record-bar-p1 {
  height: 100%;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.7), rgba(59, 130, 246, 0.4));
  border-radius: 5px 0 0 5px;
  transition: width 0.5s var(--ease-out);
}

.win-record-bar-draw {
  height: 100%;
  background: rgba(255, 255, 255, 0.15);
  transition: width 0.5s var(--ease-out);
}

.win-record-bar-p2 {
  height: 100%;
  background: linear-gradient(270deg, rgba(239, 68, 68, 0.7), rgba(239, 68, 68, 0.4));
  border-radius: 0 5px 5px 0;
  transition: width 0.5s var(--ease-out);
}

/* Form dots */
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

.form-draw {
  background: rgba(255, 255, 255, 0.3);
}

/* Recent games */
.recent-game {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.recent-game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recent-game-result {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.recent-game-player {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

.recent-game-player.right {
  justify-content: flex-end;
}

.recent-game-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-game-name.winner {
  color: var(--gold);
  font-weight: 700;
}

.recent-game-score {
  font-size: 1.1rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  flex-shrink: 0;
  text-align: center;
}

.recent-game-avgs {
  display: flex;
  justify-content: space-between;
}

/* Color utilities */
.text-gold {
  color: var(--gold);
}

.text-red {
  color: rgba(239, 68, 68, 0.9);
}

/* Responsive */
@media (max-width: 480px) {
  .selector-row {
    flex-direction: column;
    align-items: stretch;
  }

  .vs-badge {
    text-align: center;
    padding: var(--spacing-xs) 0;
  }

  .win-record {
    gap: var(--spacing-sm);
  }

  .win-record-player {
    min-width: 55px;
  }

  .win-record-name {
    font-size: 0.7rem;
    max-width: 65px;
  }

  .win-record-wins {
    font-size: 1.6rem;
  }
}
</style>
