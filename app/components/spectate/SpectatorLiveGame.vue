<script setup lang="ts">
import type { GameState, ThrowResult } from '~/types/game'
import { threeDartAverage, throwPoints, turnTotal } from '~/types/game'

const props = defineProps<{
  gameState: GameState
}>()

const { getAvatarProps } = usePlayers()

const isMatch = computed(() => props.gameState.legs_to_win > 1 || props.gameState.sets_to_win > 1)
const hasSets = computed(() => props.gameState.sets_to_win > 1)

// Animated score display
const displayScores = ref<number[]>([])
let animFrames: (number | null)[] = []

watch(
  () => props.gameState.players.map(p => p.score),
  (newScores, oldScores) => {
    if (!oldScores || displayScores.value.length !== newScores.length) {
      displayScores.value = [...newScores]
      animFrames = Array.from({ length: newScores.length }).fill(null)
      return
    }
    newScores.forEach((target, i) => {
      if (target === displayScores.value[i])
        return
      if (animFrames[i])
        cancelAnimationFrame(animFrames[i]!)
      const start = performance.now()
      const from = displayScores.value[i]!
      const duration = 350
      function step(now: number) {
        const p = Math.min((now - start) / duration, 1)
        const eased = 1 - (1 - p) ** 3
        displayScores.value[i] = Math.round(from + (target - from) * eased)
        if (p < 1) {
          animFrames[i] = requestAnimationFrame(step)
        }
        else {
          displayScores.value[i] = target
          animFrames[i] = null
        }
      }
      animFrames[i] = requestAnimationFrame(step)
    })
  },
  { deep: true, immediate: true },
)

function playerAvg(idx: number): string {
  const p = props.gameState.players[idx]
  return p ? threeDartAverage(p).toFixed(1) : '0.0'
}

function _playerDarts(idx: number): number {
  const p = props.gameState.players[idx]
  return p ? p.turns.reduce((s, t) => s + t.throws.length, 0) : 0
}

// Recent completed turns (last 5)
const recentTurns = computed(() => {
  const history = props.gameState.turn_history
  return history.slice(-5).reverse()
})

function turnPlayerName(turn: { player_index: number }): string {
  return props.gameState.players[turn.player_index]?.name ?? ''
}
</script>

<template>
  <div class="live-game">
    <!-- Player panels — stacked vertically to fit column -->
    <div
      v-for="(player, i) in gameState.players"
      :key="i"
      class="player-panel"
      :class="{ active: i === gameState.current_player_index }"
    >
      <div class="panel-header">
        <PlayerAvatar v-bind="getAvatarProps(player.name)" :size="32" />
        <span class="panel-name">{{ player.name }}</span>
        <div class="panel-stats">
          <span class="stat-chip">{{ playerAvg(i) }} avg</span>
          <span v-if="hasSets" class="stat-chip">S {{ gameState.sets_won[i] ?? 0 }}</span>
          <span v-if="isMatch" class="stat-chip">L {{ gameState.current_set_legs[i] ?? 0 }}</span>
        </div>
      </div>
      <div class="panel-score">
        {{ displayScores[i] ?? player.score }}
      </div>
    </div>

    <!-- Current turn darts -->
    <div class="current-turn">
      <div class="turn-label">
        Current Turn
      </div>
      <div class="turn-darts">
        <span
          v-for="slot in 3"
          :key="slot"
          class="dart-slot"
          :class="{ filled: gameState.current_turn.throws[slot - 1] }"
        >
          <template v-if="gameState.current_turn.throws[slot - 1]">
            <ThrowBadge :throw="gameState.current_turn.throws[slot - 1]!" />
          </template>
          <template v-else>
            <span class="dart-empty">&middot;</span>
          </template>
        </span>
        <span v-if="gameState.current_turn.throws.length > 0" class="turn-total">
          = {{ gameState.current_turn.throws.reduce((s: number, t: ThrowResult) => s + throwPoints(t), 0) }}
        </span>
      </div>
    </div>

    <!-- Recent throws -->
    <div v-if="recentTurns.length > 0" class="recent-throws">
      <div class="turn-label">
        Recent
      </div>
      <div class="recent-list">
        <div
          v-for="(turn, i) in recentTurns"
          :key="i"
          class="recent-row"
        >
          <span class="recent-player">{{ turnPlayerName(turn) }}</span>
          <span class="recent-darts">
            <ThrowBadge v-for="(t, j) in turn.throws" :key="j" :throw="t" />
          </span>
          <span class="recent-total" :class="{ busted: turn.busted }">
            {{ turn.busted ? 'BUST' : turnTotal(turn) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.live-game {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  height: 100%;
  overflow: hidden;
}

/* ── Player panels ── */
.player-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md) var(--spacing-sm);
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 2px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  transition: border-color var(--duration-normal), box-shadow var(--duration-normal);
}

.player-panel.active {
  border-color: var(--gold);
  box-shadow: 0 0 24px var(--gold-glow);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  width: 100%;
  justify-content: center;
}

.panel-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.player-panel.active .panel-name {
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.panel-stats {
  display: flex;
  gap: var(--spacing-xs);
  margin-left: auto;
}

.stat-chip {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface-2);
  padding: 1px 5px;
  border-radius: var(--radius-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.panel-score {
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 900;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.player-panel.active .panel-score {
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── Current turn ── */
.current-turn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.turn-label {
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.turn-darts {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.dart-slot {
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dart-empty {
  font-size: 1.2rem;
  color: var(--text-muted);
}

.turn-total {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  margin-left: var(--spacing-xs);
}

/* ── Recent throws ── */
.recent-throws {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
}

.recent-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px var(--spacing-xs);
  background: var(--surface-2);
  border-radius: var(--radius-sm);
}

.recent-player {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  min-width: 50px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-darts {
  display: flex;
  gap: 3px;
  flex: 1;
}

.recent-total {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  min-width: 32px;
  text-align: right;
}

.recent-total.busted {
  color: var(--red);
}
</style>
