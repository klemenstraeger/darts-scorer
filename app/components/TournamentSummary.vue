<script setup lang="ts">
import type { TournamentFormat } from '~/types/tournament'
import { FORMAT_LABELS } from '~/types/tournament'
import type { CheckoutMode } from '~/types/game'

const props = defineProps<{
  name: string
  format: TournamentFormat
  players: string[]
  gameMode: '501' | '301'
  checkout: CheckoutMode
  legsToWin: number
  setsToWin: number
  groupCount?: number
  advancePerGroup?: number
  teamMode?: 'doubles' | null
}>()

const { getAvatarProps } = usePlayers()

const isGroupFormat = computed(() =>
  props.format === 'group_only' || props.format === 'group_knockout'
)

const checkoutLabel = computed(() =>
  props.checkout === 'double_out' ? 'Double Out' : 'Single Out'
)
</script>

<template>
  <div class="tournament-summary">
    <!-- Tournament name -->
    <h3 class="tourney-name">{{ name || 'Untitled Tournament' }}</h3>

    <!-- Format badge -->
    <div class="flex gap-sm flex-wrap justify-center">
      <span class="format-badge">{{ FORMAT_LABELS[format] }}</span>
      <span v-if="teamMode" class="format-badge">Doubles</span>
    </div>

    <!-- Players / Teams -->
    <div class="players-section">
      <span class="section-label">{{ players.length }} {{ teamMode ? 'Teams' : 'Players' }}</span>
      <div class="players-scroll">
        <div
          v-for="pName in players"
          :key="pName"
          class="player-mini"
        >
          <PlayerAvatar v-bind="getAvatarProps(pName)" :size="32" />
          <span class="mini-name">{{ pName }}</span>
        </div>
      </div>
    </div>

    <!-- Settings tags -->
    <div class="settings-tags">
      <span class="tag tag-gold">{{ gameMode }}</span>
      <span class="tag">{{ checkoutLabel }}</span>
      <span class="tag">{{ legsToWin }} {{ legsToWin === 1 ? 'Leg' : 'Legs' }}</span>
      <span v-if="setsToWin > 1" class="tag">{{ setsToWin }} Sets</span>
      <span v-if="isGroupFormat && groupCount" class="tag">{{ groupCount }} Groups</span>
      <span v-if="format === 'group_knockout' && advancePerGroup" class="tag">Top {{ advancePerGroup }} advance</span>
    </div>
  </div>
</template>

<style scoped>
.tournament-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  width: 100%;
}

.tourney-name {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-primary);
  text-align: center;
}

.format-badge {
  padding: var(--spacing-xs) var(--spacing-lg);
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid var(--border-gold);
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--gold);
}

/* ── Players ─────────────────────────────────────────────────── */
.players-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: 100%;
  align-items: center;
}

.section-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.players-scroll {
  display: flex;
  gap: var(--spacing-md);
  overflow-x: auto;
  max-width: 100%;
  padding: var(--spacing-xs) 0;
  justify-content: center;
  flex-wrap: wrap;
}

.player-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.mini-name {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-secondary);
  max-width: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
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
