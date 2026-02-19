<script setup lang="ts">
import type { TournamentMatch } from '~/types/tournament'

const props = defineProps<{
  matches: TournamentMatch[]
  showPlayButton?: boolean
}>()

const emit = defineEmits<{
  play: [matchId: number]
}>()

const { getAvatarProps } = usePlayers()

// Organize matches by round
const rounds = computed(() => {
  const map = new Map<number, TournamentMatch[]>()
  for (const match of props.matches) {
    if (!map.has(match.round))
      map.set(match.round, [])
    map.get(match.round)!.push(match)
  }

  // Sort each round's matches by position
  for (const [, matches] of map) {
    matches.sort((a, b) => a.position - b.position)
  }

  // Return sorted by round number
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([round, matches]) => ({ round, matches }))
})

const totalRounds = computed(() => rounds.value.length)

function roundLabel(round: number): string {
  const fromFinal = totalRounds.value - round + 1
  if (fromFinal === 1)
    return 'Final'
  if (fromFinal === 2)
    return 'Semi-Finals'
  if (fromFinal === 3)
    return 'Quarter-Finals'
  return `Round ${round}`
}
</script>

<template>
  <div class="bracket-scroll">
    <div class="bracket" :style="{ '--rounds': totalRounds }">
      <div
        v-for="r in rounds"
        :key="r.round"
        class="bracket-round"
      >
        <div class="round-header">
          {{ roundLabel(r.round) }}
        </div>
        <div class="round-matches">
          <div
            v-for="match in r.matches"
            :key="match.id"
            class="bracket-match"
          >
            <div
              class="bracket-slot"
              :class="{
                'winner': match.winnerName === match.player1Name,
                'in-progress': match.status === 'in_progress',
              }"
            >
              <span class="slot-name"><PlayerAvatar v-if="match.player1Name" v-bind="getAvatarProps(match.player1Name)" :size="16" />{{ match.player1Name || 'TBD' }}</span>
              <span v-if="match.status === 'completed'" class="slot-score">{{ match.player1LegsWon }}</span>
            </div>
            <div
              class="bracket-slot"
              :class="{
                'winner': match.winnerName === match.player2Name,
                'in-progress': match.status === 'in_progress',
              }"
            >
              <span class="slot-name"><PlayerAvatar v-if="match.player2Name" v-bind="getAvatarProps(match.player2Name)" :size="16" />{{ match.player2Name || 'TBD' }}</span>
              <span v-if="match.status === 'completed'" class="slot-score">{{ match.player2LegsWon }}</span>
            </div>
            <button
              v-if="match.status === 'pending' && match.player1Name && match.player2Name && showPlayButton"
              class="bracket-play-btn"
              @click="emit('play', match.id)"
            >
              Play
            </button>
            <span v-if="match.status === 'in_progress'" class="bracket-live">LIVE</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bracket-scroll {
  overflow-x: auto;
  padding-bottom: var(--spacing-md);
}

.bracket {
  display: flex;
  gap: var(--spacing-xl);
  min-width: max-content;
  padding: var(--spacing-md);
}

.bracket-round {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-width: 180px;
}

.round-header {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid var(--border-subtle);
}

.round-matches {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  flex: 1;
  gap: var(--spacing-lg);
}

.bracket-match {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.bracket-slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) var(--spacing-sm);
  min-height: 28px;
  transition: background var(--duration-fast);
}

.bracket-slot + .bracket-slot {
  border-top: 1px solid var(--border-subtle);
}

.bracket-slot.winner {
  background: var(--gold-tint);
}

.bracket-slot.in-progress {
  border-left: 2px solid var(--gold);
}

.slot-name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.bracket-slot.winner .slot-name {
  color: var(--gold);
  font-weight: 700;
}

.slot-score {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.bracket-slot.winner .slot-score {
  color: var(--gold);
}

.bracket-play-btn {
  position: absolute;
  top: 50%;
  right: -4px;
  transform: translateY(-50%) translateX(100%);
  padding: 2px var(--spacing-sm);
  background: var(--gold-gradient);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  font-size: 0.65rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  z-index: 1;
}

.bracket-live {
  position: absolute;
  top: 50%;
  right: -4px;
  transform: translateY(-50%) translateX(100%);
  padding: 2px var(--spacing-sm);
  font-size: 0.6rem;
  font-weight: 800;
  color: var(--gold);
  animation: pulse-live 1.5s ease-in-out infinite;
}

@keyframes pulse-live {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
