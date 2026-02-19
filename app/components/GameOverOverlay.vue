<script setup lang="ts">
import type { GameState } from '~/types/game'
import { count180s, getCheckoutDart, highestTurnScore, totalDartsThrown } from '#shared/game-models'
import { threeDartAverage, throwLabel } from '~/types/game'

const props = defineProps<{
  state: GameState
  isTournamentMatch: boolean
  tournamentId: number | null
}>()

defineEmits<{
  dismiss: []
  clearTournament: []
}>()

const { getAvatarProps } = usePlayers()

const isMatch = computed(() => props.state.legs_to_win > 1 || props.state.sets_to_win > 1)
const hasSets = computed(() => props.state.sets_to_win > 1)

const winnerName = computed(() => {
  if (props.state.winner_index == null)
    return ''
  return props.state.players[props.state.winner_index]?.name ?? ''
})
</script>

<template>
  <div class="gameover-overlay">
    <div class="gameover-content">
      <!-- Title -->
      <div class="gameover-title">
        Game Over
      </div>

      <!-- Winner -->
      <div class="gameover-winner">
        <PlayerAvatar v-if="winnerName" v-bind="getAvatarProps(winnerName)" :size="56" />
        <div>
          <div class="winner-name">
            {{ winnerName }}
          </div>
          <div class="winner-badge">
            WINNER
          </div>
        </div>
      </div>

      <!-- Player stat cards -->
      <div class="gameover-stats">
        <div
          v-for="(player, i) in state.players"
          :key="i"
          class="stat-card"
          :class="{ winner: i === state.winner_index }"
        >
          <div class="stat-card-header">
            <PlayerAvatar v-bind="getAvatarProps(player.name)" :size="32" />
            <span class="stat-player-name">{{ player.name }}</span>
          </div>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="stat-value">{{ threeDartAverage(player).toFixed(1) }}</span>
              <span class="stat-label">Avg</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ totalDartsThrown(player) }}</span>
              <span class="stat-label">Darts</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ highestTurnScore(player) }}</span>
              <span class="stat-label">Best</span>
            </div>
            <div v-if="count180s(player) > 0" class="stat-item">
              <span class="stat-value stat-highlight">{{ count180s(player) }}</span>
              <span class="stat-label">180s</span>
            </div>
            <div v-if="i === state.winner_index && getCheckoutDart(player)" class="stat-item">
              <span class="stat-value stat-highlight">{{ throwLabel(getCheckoutDart(player)!) }}</span>
              <span class="stat-label">Checkout</span>
            </div>
            <div v-if="isMatch" class="stat-item">
              <span class="stat-value">
                <template v-if="hasSets">{{ state.sets_won[i] ?? 0 }}s </template>{{ player.legs_won }}l
              </span>
              <span class="stat-label">{{ hasSets ? 'Sets/Legs' : 'Legs' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="gameover-actions">
        <NuxtLink
          v-if="isTournamentMatch"
          :to="`/tournaments/${tournamentId}`"
          class="btn btn-gold"
          @click="$emit('clearTournament')"
        >
          Back to Tournament
        </NuxtLink>
        <template v-else>
          <button class="btn btn-gold" @click="$emit('dismiss')">
            Continue
          </button>
          <NuxtLink to="/" class="btn btn-secondary">
            New Game
          </NuxtLink>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gameover-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  overflow-y: auto;
  padding: var(--spacing-md);
}

.gameover-content {
  text-align: center;
  max-width: 520px;
  width: 100%;
}

.gameover-title {
  font-size: 2.5rem;
  font-weight: 800;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--spacing-sm);
  animation: scale-in 0.5s var(--ease-spring);
}

.gameover-winner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  animation: scale-in 0.5s var(--ease-spring) 0.1s both;
}

.winner-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.winner-badge {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--gold);
  text-transform: uppercase;
}

.gameover-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  animation: scale-in 0.5s var(--ease-spring) 0.15s both;
}

.stat-card {
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.stat-card.winner {
  border-color: var(--border-gold);
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.1);
}

.stat-card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-subtle);
}

.stat-player-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xs) var(--spacing-sm);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  tabular-nums: true;
}

.stat-highlight {
  color: var(--gold);
}

.stat-label {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.gameover-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  animation: scale-in 0.5s var(--ease-spring) 0.2s both;
}

@keyframes scale-in {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
