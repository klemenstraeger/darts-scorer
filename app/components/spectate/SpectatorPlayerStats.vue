<script setup lang="ts">
import type { TournamentParticipant, TournamentMatch } from '~/types/tournament'

interface PlayerStatsData {
  three_dart_average: number
  count_180: number
  count_140_plus: number
  count_100_plus: number
  highest_turn: number | null
}

const props = defineProps<{
  participants: TournamentParticipant[]
  matches: TournamentMatch[]
  playerStats: Record<string, PlayerStatsData>
}>()

const { getAvatarProps } = usePlayers()

// Auto-rotate stat groups every 3 seconds
const statGroup = ref(0)
let rotateTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  rotateTimer = setInterval(() => {
    statGroup.value = (statGroup.value + 1) % 2
  }, 3000)
})

onUnmounted(() => {
  if (rotateTimer) clearInterval(rotateTimer)
})

// Derive per-player match stats from matches (client-side)
interface PlayerMatchInfo {
  gamesPlayed: number
  wins: number
  winRate: number
  recentMatches: {
    opponent: string
    won: boolean
    legsWon: number
    legsLost: number
  }[]
}

const playerMatchInfo = computed(() => {
  const info: Record<string, PlayerMatchInfo> = {}

  for (const p of props.participants) {
    const name = p.playerName
    const completed = props.matches.filter(
      m => m.status === 'completed' && (m.player1Name === name || m.player2Name === name),
    )
    const wins = completed.filter(m => m.winnerName === name).length
    const gamesPlayed = completed.length

    // Recent matches — last 3
    const recent = completed.slice(-3).map(m => {
      const isP1 = m.player1Name === name
      return {
        opponent: isP1 ? (m.player2Name ?? '?') : (m.player1Name ?? '?'),
        won: m.winnerName === name,
        legsWon: isP1 ? m.player1LegsWon : m.player2LegsWon,
        legsLost: isP1 ? m.player2LegsWon : m.player1LegsWon,
      }
    }).reverse()

    info[name] = {
      gamesPlayed,
      wins,
      winRate: gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0,
      recentMatches: recent,
    }
  }

  return info
})
</script>

<template>
  <div class="player-stats-panel">
    <span class="section-label">Player Stats</span>

    <div class="player-cards">
      <div
        v-for="participant in participants"
        :key="participant.id"
        class="player-card"
      >
        <!-- Row 1: Avatar + Name -->
        <div class="card-header">
          <PlayerAvatar v-bind="getAvatarProps(participant.playerName)" :size="28" />
          <span class="card-name">{{ participant.playerName }}</span>
        </div>

        <!-- Row 2: Auto-rotating stats -->
        <div class="stats-rotator">
          <Transition name="stat-fade" mode="out-in">
            <!-- Group A: Match stats -->
            <div v-if="statGroup === 0" key="group-a" class="stat-row">
              <span class="stat-chip">
                {{ playerMatchInfo[participant.playerName]?.gamesPlayed ?? 0 }} games
              </span>
              <span class="stat-chip accent">
                {{ playerMatchInfo[participant.playerName]?.wins ?? 0 }} wins
              </span>
              <span class="stat-chip">
                {{ playerMatchInfo[participant.playerName]?.winRate ?? 0 }}%
              </span>
              <span class="stat-chip">
                {{ (playerStats[participant.playerName]?.three_dart_average ?? 0).toFixed(1) }} avg
              </span>
            </div>

            <!-- Group B: Scoring milestones -->
            <div v-else key="group-b" class="stat-row">
              <span class="stat-chip gold">
                {{ playerStats[participant.playerName]?.count_180 ?? 0 }}&times;180
              </span>
              <span class="stat-chip">
                {{ playerStats[participant.playerName]?.count_140_plus ?? 0 }}&times;140+
              </span>
              <span class="stat-chip">
                {{ playerStats[participant.playerName]?.count_100_plus ?? 0 }}&times;100+
              </span>
              <span class="stat-chip">
                Best: {{ playerStats[participant.playerName]?.highest_turn ?? '–' }}
              </span>
            </div>
          </Transition>
        </div>

        <!-- Row 3: Recent matches -->
        <div class="recent-matches">
          <template v-if="(playerMatchInfo[participant.playerName]?.recentMatches.length ?? 0) > 0">
            <span
              v-for="(rm, i) in playerMatchInfo[participant.playerName]!.recentMatches"
              :key="i"
              class="recent-match"
              :class="{ won: rm.won, lost: !rm.won }"
            >
              vs {{ rm.opponent }}
              <strong>{{ rm.won ? 'W' : 'L' }}</strong>
              {{ rm.legsWon }}-{{ rm.legsLost }}
            </span>
          </template>
          <span v-else class="no-matches">No matches yet</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-stats-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.section-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.player-cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.player-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

/* ── Card header ── */
.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.card-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Stats rotator ── */
.stats-rotator {
  min-height: 24px;
  position: relative;
}

.stat-row {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.stat-chip {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--surface-2);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.stat-chip.accent {
  color: var(--green);
}

.stat-chip.gold {
  background: var(--gold-gradient);
  color: var(--text-inverse);
}

/* ── Recent matches ── */
.recent-matches {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.recent-match {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--text-muted);
  white-space: nowrap;
}

.recent-match.won strong {
  color: var(--green);
}

.recent-match.lost strong {
  color: var(--red);
}

.no-matches {
  font-size: 0.65rem;
  color: var(--text-muted);
  font-style: italic;
}

/* ── Crossfade transition ── */
.stat-fade-enter-active,
.stat-fade-leave-active {
  transition: opacity 0.3s ease;
}

.stat-fade-enter-from,
.stat-fade-leave-to {
  opacity: 0;
}
</style>
