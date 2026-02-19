<script setup lang="ts">
import type { TournamentMatch } from '~/types/tournament'

const props = defineProps<{
  match: TournamentMatch
  showPlayButton?: boolean
}>()

const emit = defineEmits<{
  play: [matchId: number]
}>()

const { getAvatarProps } = usePlayers()

const isPlayable = computed(() =>
  props.match.status === 'pending'
  && props.match.player1Name
  && props.match.player2Name,
)

const _scoreDisplay = computed(() => {
  if (props.match.status !== 'completed')
    return null
  return `${props.match.player1LegsWon} - ${props.match.player2LegsWon}`
})
</script>

<template>
  <div
    class="match-card"
    :class="{
      'pending': match.status === 'pending',
      'in-progress': match.status === 'in_progress',
      'completed': match.status === 'completed',
      'playable': isPlayable && showPlayButton,
    }"
  >
    <div class="match-players">
      <div class="match-player" :class="{ winner: match.winnerName === match.player1Name }">
        <PlayerAvatar v-if="match.player1Name" v-bind="getAvatarProps(match.player1Name)" :size="20" />
        <span class="player-name">{{ match.player1Name || 'TBD' }}</span>
        <span v-if="match.status === 'completed'" class="player-score">{{ match.player1LegsWon }}</span>
      </div>
      <div class="match-vs">
        <span v-if="match.status === 'in_progress'" class="vs-live">LIVE</span>
        <span v-else class="vs-text">vs</span>
      </div>
      <div class="match-player" :class="{ winner: match.winnerName === match.player2Name }">
        <PlayerAvatar v-if="match.player2Name" v-bind="getAvatarProps(match.player2Name)" :size="20" />
        <span class="player-name">{{ match.player2Name || 'TBD' }}</span>
        <span v-if="match.status === 'completed'" class="player-score">{{ match.player2LegsWon }}</span>
      </div>
    </div>
    <button
      v-if="isPlayable && showPlayButton"
      class="btn btn-gold play-btn"
      @click.stop="emit('play', match.id)"
    >
      Play
    </button>
  </div>
</template>

<style scoped>
.match-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
}

.match-card.playable {
  border-color: var(--border-gold);
}

.match-card.in-progress {
  border-color: var(--gold);
  box-shadow: 0 0 12px var(--gold-glow);
}

.match-card.completed {
  opacity: 0.85;
}

.match-players {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

.match-player {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xs);
  min-width: 0;
}

.match-player:last-child {
  flex-direction: row-reverse;
}

.player-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.match-player.winner .player-name {
  color: var(--gold);
  font-weight: 700;
}

.player-score {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-primary);
  tabular-nums: true;
}

.match-player.winner .player-score {
  color: var(--gold);
}

.match-vs {
  flex-shrink: 0;
  width: 36px;
  text-align: center;
}

.vs-text {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.vs-live {
  font-size: 0.6rem;
  font-weight: 800;
  color: var(--gold);
  text-transform: uppercase;
  animation: pulse-live 1.5s ease-in-out infinite;
}

@keyframes pulse-live {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.play-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: 0.75rem;
  flex-shrink: 0;
}
</style>
