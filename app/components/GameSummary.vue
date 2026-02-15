<script setup lang="ts">
import type { CheckoutMode } from '~/types/game'

const props = defineProps<{
  players: string[]
  gameMode: '501' | '301'
  checkout: CheckoutMode
  legsToWin: number
  setsToWin: number
}>()

const { getAvatarProps } = usePlayers()

const checkoutLabel = computed(() =>
  props.checkout === 'double_out' ? 'Double Out' : 'Single Out'
)
</script>

<template>
  <div class="game-summary">
    <!-- Players row -->
    <div class="players-row">
      <template v-for="(name, i) in players" :key="name">
        <div class="player-entry">
          <PlayerAvatar v-bind="getAvatarProps(name)" :size="44" />
          <span class="player-name">{{ name }}</span>
        </div>
        <span v-if="i < players.length - 1" class="vs-badge">vs</span>
      </template>
    </div>

    <!-- Settings tags -->
    <div class="settings-tags">
      <span class="tag tag-gold">{{ gameMode }}</span>
      <span class="tag">{{ checkoutLabel }}</span>
      <span class="tag">{{ legsToWin }} {{ legsToWin === 1 ? 'Leg' : 'Legs' }}</span>
      <span v-if="setsToWin > 1" class="tag">{{ setsToWin }} Sets</span>
    </div>
  </div>
</template>

<style scoped>
.game-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  width: 100%;
}

/* ── Players ─────────────────────────────────────────────────── */
.players-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
  justify-content: center;
}

.player-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.player-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}

.vs-badge {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Settings tags ───────────────────────────────────────────── */
.settings-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  justify-content: center;
}

.tag {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.tag-gold {
  background: rgba(255, 215, 0, 0.1);
  border-color: var(--border-gold);
  color: var(--gold);
}
</style>
