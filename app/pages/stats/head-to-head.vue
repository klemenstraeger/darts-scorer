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
  if (!player1.value || !player2.value)
    return
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
  }
  catch (e: any) {
    error.value = e.data?.message || 'Failed to load head-to-head stats'
    stats.value = null
  }
  finally {
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
  if (p1)
    player1.value = p1
  if (p2)
    player2.value = p2
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const winPctPlayer1 = computed(() => {
  if (!stats.value || stats.value.total_games === 0)
    return 0
  return Math.round((stats.value.player1_wins / stats.value.total_games) * 1000) / 10
})

const winPctPlayer2 = computed(() => {
  if (!stats.value || stats.value.total_games === 0)
    return 0
  return Math.round((stats.value.player2_wins / stats.value.total_games) * 1000) / 10
})

// Recent form: last 5 results from perspective of player1
const recentForm = computed(() => {
  if (!stats.value)
    return []
  return stats.value.recent_games.map(g => ({
    won: g.winner_name === stats.value!.player1,
    draw: g.winner_name === null,
  }))
})
</script>

<template>
  <AuthGate feature="Head-to-Head" description="Sign in to compare player rivalries, win rates, and match history.">
    <div class="px-lg py-xl max-w-[800px] mx-auto w-full">
      <!-- Header -->
      <div class="flex items-center gap-lg px-lg py-xl rounded-xl bg-[var(--blue-light,#e8f0fe)] border-2 border-black shadow-md mb-xl">
        <div class="flex-1">
          <h2 class="text-[1.8rem] font-extrabold text-fg mb-xs">
            Head-to-Head
          </h2>
          <p class="text-[0.85rem] text-fg-secondary">
            Compare two players side by side.
          </p>
        </div>
        <BackLink to="/stats" label="Stats" />
      </div>

      <!-- Player selectors -->
      <div class="flex items-end gap-md mb-xl max-[480px]:flex-col max-[480px]:items-stretch">
        <div class="flex-1 flex flex-col gap-xs">
          <label class="text-[0.7rem] font-semibold uppercase tracking-wide text-fg-muted">Player 1</label>
          <select v-model="player1" class="h2h-selector-input">
            <option value="" disabled>
              Select player
            </option>
            <option v-for="p in players" :key="p.id" :value="p.name">
              {{ p.name }}
            </option>
          </select>
        </div>

        <div class="px-md py-sm text-[0.75rem] font-extrabold text-fg-muted tracking-wide shrink-0 max-[480px]:text-center max-[480px]:px-0 max-[480px]:py-xs">
          VS
        </div>

        <div class="flex-1 flex flex-col gap-xs">
          <label class="text-[0.7rem] font-semibold uppercase tracking-wide text-fg-muted">Player 2</label>
          <select v-model="player2" class="h2h-selector-input">
            <option value="" disabled>
              Select player
            </option>
            <option v-for="p in player2Options" :key="p.id" :value="p.name">
              {{ p.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="text-center text-red text-[0.85rem] mb-lg">
        {{ error }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center text-fg-muted p-2xl">
        Loading comparison...
      </div>

      <!-- No games -->
      <div v-if="stats && stats.total_games === 0 && !loading" class="text-center text-fg-muted p-2xl text-[0.9rem]">
        No head-to-head games found between these players.
      </div>

      <!-- Stats content -->
      <div v-if="stats && stats.total_games > 0 && !loading" class="flex flex-col gap-xl">
        <!-- Win record with avatars -->
        <section class="bg-surface-1 border-2 border-black rounded-lg shadow-md p-xl">
          <div class="flex items-center gap-lg max-[480px]:gap-sm">
            <div class="flex-none flex flex-col items-center gap-xs min-w-[70px] max-[480px]:min-w-[55px]">
              <PlayerAvatar v-bind="getAvatarProps(stats.player1)" :size="56" />
              <div class="text-[0.8rem] font-semibold text-fg-secondary text-center max-w-[90px] truncate max-[480px]:text-[0.7rem] max-[480px]:max-w-[65px]">
                {{ stats.player1 }}
              </div>
              <div
                class="text-[2rem] font-extrabold tabular-nums leading-none max-[480px]:text-[1.6rem]"
                :class="stats.player1_wins > stats.player2_wins ? 'text-yellow' : 'text-fg-muted'"
              >
                {{ stats.player1_wins }}
              </div>
            </div>

            <div class="flex-1 flex flex-col items-center gap-xs">
              <div class="text-[0.7rem] font-semibold uppercase tracking-wide text-fg-muted">
                {{ stats.total_games }} game{{ stats.total_games !== 1 ? 's' : '' }}
              </div>
              <div class="w-full h-2.5 rounded-[5px] bg-surface-2 border border-black flex overflow-hidden gap-[2px]">
                <div
                  class="h-full bg-blue rounded-l-[5px] transition-all duration-500"
                  :style="{ width: `${stats.total_games > 0 ? (stats.player1_wins / stats.total_games) * 100 : 50}%` }"
                />
                <div
                  v-if="stats.draws > 0"
                  class="h-full bg-surface-3 transition-all duration-500"
                  :style="{ width: `${(stats.draws / stats.total_games) * 100}%` }"
                />
                <div
                  class="h-full bg-red rounded-r-[5px] transition-all duration-500"
                  :style="{ width: `${stats.total_games > 0 ? (stats.player2_wins / stats.total_games) * 100 : 50}%` }"
                />
              </div>
              <!-- Recent form dots -->
              <div v-if="recentForm.length > 0" class="flex items-center gap-[4px] mt-sm">
                <span
                  v-for="(result, i) in recentForm"
                  :key="i"
                  class="w-2 h-2 rounded-full shrink-0 border border-black"
                  :class="result.draw ? 'bg-surface-3' : result.won ? 'bg-green' : 'bg-red'"
                />
                <span class="text-[0.65rem] text-fg-muted ml-xs">recent</span>
              </div>
            </div>

            <div class="flex-none flex flex-col items-center gap-xs min-w-[70px] max-[480px]:min-w-[55px]">
              <PlayerAvatar v-bind="getAvatarProps(stats.player2)" :size="56" />
              <div class="text-[0.8rem] font-semibold text-fg-secondary text-center max-w-[90px] truncate max-[480px]:text-[0.7rem] max-[480px]:max-w-[65px]">
                {{ stats.player2 }}
              </div>
              <div
                class="text-[2rem] font-extrabold tabular-nums leading-none max-[480px]:text-[1.6rem]"
                :class="stats.player2_wins > stats.player1_wins ? 'text-yellow' : 'text-fg-muted'"
              >
                {{ stats.player2_wins }}
              </div>
            </div>
          </div>
        </section>

        <!-- Stats comparison bars -->
        <section class="bg-surface-1 border-2 border-black rounded-lg shadow-md p-lg">
          <h3 class="text-[0.8rem] text-fg-muted uppercase tracking-wide mb-md">
            Comparison
          </h3>
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
          <h3 class="text-[0.8rem] text-fg-muted uppercase tracking-wide mb-md">
            Recent Matches
          </h3>
          <div class="flex flex-col gap-sm">
            <div
              v-for="game in stats.recent_games"
              :key="game.game_id"
              class="bg-surface-1 border-2 border-black rounded-lg shadow-md p-md flex flex-col gap-sm"
            >
              <div class="flex justify-between items-center">
                <span class="text-[0.7rem] font-bold text-fg bg-yellow-light px-[8px] py-[2px] rounded-sm">
                  {{ game.mode }}
                </span>
                <span class="text-[0.7rem] text-fg-muted">{{ formatDate(game.created_at) }}</span>
              </div>
              <div class="flex items-center gap-md">
                <div class="flex-1 flex items-center gap-sm min-w-0">
                  <PlayerAvatar v-bind="getAvatarProps(stats.player1)" :size="28" />
                  <span
                    class="text-[0.85rem] font-medium truncate"
                    :class="game.winner_name === stats.player1 ? 'text-yellow font-bold' : 'text-fg-secondary'"
                  >{{ stats.player1 }}</span>
                </div>
                <div class="text-[1.1rem] font-extrabold tabular-nums text-fg shrink-0 text-center">
                  <span :class="{ 'text-yellow': game.winner_name === stats.player1 }">{{ game.player1_score }}</span>
                  <span class="text-fg-muted mx-xs">-</span>
                  <span :class="{ 'text-yellow': game.winner_name === stats.player2 }">{{ game.player2_score }}</span>
                </div>
                <div class="flex-1 flex items-center gap-sm min-w-0 justify-end">
                  <span
                    class="text-[0.85rem] font-medium truncate"
                    :class="game.winner_name === stats.player2 ? 'text-yellow font-bold' : 'text-fg-secondary'"
                  >{{ stats.player2 }}</span>
                  <PlayerAvatar v-bind="getAvatarProps(stats.player2)" :size="28" />
                </div>
              </div>
              <div v-if="game.player1_avg != null || game.player2_avg != null" class="flex justify-between">
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
  </AuthGate>
</template>

<style>
/* Custom select arrow — cannot be done in pure Tailwind */
.h2h-selector-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  padding-right: 32px;
  background: var(--surface-1);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 500;
  appearance: none;
  cursor: pointer;
  transition: box-shadow var(--duration-fast);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.h2h-selector-input:hover,
.h2h-selector-input:focus {
  outline: none;
  box-shadow: var(--shadow-sm);
}
</style>
