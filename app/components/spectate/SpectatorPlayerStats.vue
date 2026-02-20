<script setup lang="ts">
import type { TournamentMatch, TournamentParticipant } from '~/types/tournament'

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
  if (rotateTimer)
    clearInterval(rotateTimer)
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
    const recent = completed.slice(-3).map((m) => {
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
  <div class="flex flex-col gap-sm">
    <span class="text-[0.65rem] font-bold text-fg-muted uppercase tracking-[1px]">Player Stats</span>

    <div class="flex flex-col gap-sm">
      <div
        v-for="participant in participants"
        :key="participant.id"
        class="flex flex-col gap-xs px-md py-sm bg-surface-1 border-2 border-black rounded-md shadow-md"
      >
        <!-- Row 1: Avatar + Name -->
        <div class="flex items-center gap-sm">
          <PlayerAvatar v-bind="getAvatarProps(participant.playerName)" :size="28" />
          <span class="text-[0.85rem] font-bold text-fg whitespace-nowrap overflow-hidden text-ellipsis">{{ participant.playerName }}</span>
        </div>

        <!-- Row 2: Auto-rotating stats -->
        <div class="min-h-[24px] relative">
          <Transition name="stat-fade" mode="out-in">
            <!-- Group A: Match stats -->
            <div v-if="statGroup === 0" key="group-a" class="flex gap-xs flex-wrap">
              <span class="text-[0.7rem] font-semibold text-fg-secondary bg-surface-2 px-[6px] py-[2px] rounded-sm tabular-nums whitespace-nowrap">
                {{ playerMatchInfo[participant.playerName]?.gamesPlayed ?? 0 }} games
              </span>
              <span class="text-[0.7rem] font-semibold text-green bg-surface-2 px-[6px] py-[2px] rounded-sm tabular-nums whitespace-nowrap">
                {{ playerMatchInfo[participant.playerName]?.wins ?? 0 }} wins
              </span>
              <span class="text-[0.7rem] font-semibold text-fg-secondary bg-surface-2 px-[6px] py-[2px] rounded-sm tabular-nums whitespace-nowrap">
                {{ playerMatchInfo[participant.playerName]?.winRate ?? 0 }}%
              </span>
              <span class="text-[0.7rem] font-semibold text-fg-secondary bg-surface-2 px-[6px] py-[2px] rounded-sm tabular-nums whitespace-nowrap">
                {{ (playerStats[participant.playerName]?.three_dart_average ?? 0).toFixed(1) }} avg
              </span>
            </div>

            <!-- Group B: Scoring milestones -->
            <div v-else key="group-b" class="flex gap-xs flex-wrap">
              <span class="text-[0.7rem] font-semibold text-black bg-yellow px-[6px] py-[2px] rounded-sm border border-black tabular-nums whitespace-nowrap">
                {{ playerStats[participant.playerName]?.count_180 ?? 0 }}&times;180
              </span>
              <span class="text-[0.7rem] font-semibold text-fg-secondary bg-surface-2 px-[6px] py-[2px] rounded-sm tabular-nums whitespace-nowrap">
                {{ playerStats[participant.playerName]?.count_140_plus ?? 0 }}&times;140+
              </span>
              <span class="text-[0.7rem] font-semibold text-fg-secondary bg-surface-2 px-[6px] py-[2px] rounded-sm tabular-nums whitespace-nowrap">
                {{ playerStats[participant.playerName]?.count_100_plus ?? 0 }}&times;100+
              </span>
              <span class="text-[0.7rem] font-semibold text-fg-secondary bg-surface-2 px-[6px] py-[2px] rounded-sm tabular-nums whitespace-nowrap">
                Best: {{ playerStats[participant.playerName]?.highest_turn ?? '–' }}
              </span>
            </div>
          </Transition>
        </div>

        <!-- Row 3: Recent matches -->
        <div class="flex gap-xs flex-wrap">
          <template v-if="(playerMatchInfo[participant.playerName]?.recentMatches.length ?? 0) > 0">
            <span
              v-for="(rm, i) in playerMatchInfo[participant.playerName]!.recentMatches"
              :key="i"
              class="text-[0.65rem] font-medium text-fg-muted whitespace-nowrap"
            >
              vs {{ rm.opponent }}
              <strong :class="rm.won ? 'text-green' : 'text-red'">{{ rm.won ? 'W' : 'L' }}</strong>
              {{ rm.legsWon }}-{{ rm.legsLost }}
            </span>
          </template>
          <span v-else class="text-[0.65rem] text-fg-muted italic">No matches yet</span>
        </div>
      </div>
    </div>
  </div>
</template>
