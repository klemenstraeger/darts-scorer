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

// Group matches by scheduled date
const fixturesByDate = computed(() => {
  const groups = new Map<string, TournamentMatch[]>()

  // Separate scheduled and unscheduled
  const scheduled: TournamentMatch[] = []
  const unscheduled: TournamentMatch[] = []

  for (const match of props.matches) {
    if (match.scheduledAt) {
      scheduled.push(match)
    }
    else {
      unscheduled.push(match)
    }
  }

  // Group scheduled matches by date
  for (const match of scheduled) {
    const date = new Date(match.scheduledAt!).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    if (!groups.has(date)) {
      groups.set(date, [])
    }
    groups.get(date)!.push(match)
  }

  // Sort matches within each group by round then position
  for (const [, matches] of groups) {
    matches.sort((a, b) => {
      if (a.round !== b.round)
        return a.round - b.round
      return a.position - b.position
    })
  }

  // Convert to array sorted by date
  const result: { date: string, rawDate: Date, matches: TournamentMatch[] }[] = []
  for (const [date, matches] of groups) {
    result.push({
      date,
      rawDate: new Date(matches[0]!.scheduledAt!),
      matches,
    })
  }
  result.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())

  // Add unscheduled group at the end if any
  if (unscheduled.length > 0) {
    unscheduled.sort((a, b) => {
      if (a.round !== b.round)
        return a.round - b.round
      return a.position - b.position
    })
    result.push({
      date: 'Unscheduled',
      rawDate: new Date(8640000000000000), // max date
      matches: unscheduled,
    })
  }

  return result
})

function isPlayable(match: TournamentMatch): boolean {
  return match.status === 'pending' && !!match.player1Name && !!match.player2Name
}

function statusClass(match: TournamentMatch): string {
  return match.status === 'in_progress' ? 'in-progress' : match.status
}

function isToday(dateStr: string): boolean {
  if (dateStr === 'Unscheduled')
    return false
  const today = new Date()
  const todayStr = today.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  return dateStr === todayStr
}

function isPast(rawDate: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(rawDate)
  d.setHours(0, 0, 0, 0)
  return d < today
}
</script>

<template>
  <div class="fixture-calendar">
    <div v-if="fixturesByDate.length === 0" class="empty-state">
      No fixtures scheduled
    </div>
    <div
      v-for="group in fixturesByDate"
      :key="group.date"
      class="fixture-day"
      :class="{
        today: isToday(group.date),
        past: isPast(group.rawDate) && group.date !== 'Unscheduled',
        unscheduled: group.date === 'Unscheduled',
      }"
    >
      <div class="day-header">
        <span class="day-date">{{ group.date }}</span>
        <span v-if="isToday(group.date)" class="today-badge">Today</span>
        <span class="day-count">{{ group.matches.length }} match{{ group.matches.length !== 1 ? 'es' : '' }}</span>
      </div>
      <div class="day-matches">
        <div
          v-for="match in group.matches"
          :key="match.id"
          class="fixture-match"
          :class="[statusClass(match), { playable: isPlayable(match) && showPlayButton }]"
        >
          <div class="fixture-status-dot" :class="statusClass(match)" />
          <div class="fixture-players">
            <div class="fixture-player" :class="{ winner: match.winnerName === match.player1Name }">
              <PlayerAvatar v-if="match.player1Name" v-bind="getAvatarProps(match.player1Name)" :size="18" />
              <span class="fixture-player-name">{{ match.player1Name || 'TBD' }}</span>
            </div>
            <div class="fixture-score">
              <template v-if="match.status === 'completed'">
                <span class="score-num" :class="{ 'score-winner': match.winnerName === match.player1Name }">{{ match.player1LegsWon }}</span>
                <span class="score-sep">-</span>
                <span class="score-num" :class="{ 'score-winner': match.winnerName === match.player2Name }">{{ match.player2LegsWon }}</span>
              </template>
              <span v-else-if="match.status === 'in_progress'" class="score-live">LIVE</span>
              <span v-else class="score-vs">vs</span>
            </div>
            <div class="fixture-player right" :class="{ winner: match.winnerName === match.player2Name }">
              <span class="fixture-player-name">{{ match.player2Name || 'TBD' }}</span>
              <PlayerAvatar v-if="match.player2Name" v-bind="getAvatarProps(match.player2Name)" :size="18" />
            </div>
          </div>
          <div class="fixture-round">
            R{{ match.round }}
          </div>
          <button
            v-if="isPlayable(match) && showPlayButton"
            class="btn btn-gold fixture-play-btn"
            @click.stop="emit('play', match.id)"
          >
            Play
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fixture-calendar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-muted);
  font-size: 0.85rem;
}

.fixture-day {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.fixture-day.today {
  position: relative;
}

.fixture-day.today::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--gold-gradient);
  border-radius: var(--radius-full);
}

.day-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
}

.day-date {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.fixture-day.past .day-date {
  color: var(--text-muted);
}

.fixture-day.unscheduled .day-date {
  color: var(--text-muted);
  font-style: italic;
}

.today-badge {
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--gold);
  background: rgba(245, 158, 11, 0.1);
  padding: 1px var(--spacing-xs);
  border-radius: var(--radius-full);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.day-count {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-left: auto;
}

.day-matches {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.fixture-match {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: border-color var(--duration-fast);
}

.fixture-match.playable {
  border-color: var(--border-gold);
}

.fixture-match.in-progress {
  border-color: var(--gold);
  box-shadow: 0 0 12px var(--gold-glow);
}

.fixture-match.completed {
  opacity: 0.8;
}

.fixture-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.fixture-status-dot.pending {
  background: var(--text-muted);
}

.fixture-status-dot.in-progress {
  background: var(--gold);
  animation: pulse-dot 1.5s ease-in-out infinite;
}

.fixture-status-dot.completed {
  background: var(--green);
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.fixture-players {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  min-width: 0;
}

.fixture-player {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  min-width: 0;
}

.fixture-player.right {
  justify-content: flex-end;
}

.fixture-player-name {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fixture-player.winner .fixture-player-name {
  color: var(--gold);
  font-weight: 700;
}

.fixture-score {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 48px;
  justify-content: center;
}

.score-num {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.score-num.score-winner {
  color: var(--gold);
}

.score-sep {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin: 0 1px;
}

.score-vs {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.score-live {
  font-size: 0.6rem;
  font-weight: 800;
  color: var(--gold);
  text-transform: uppercase;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

.fixture-round {
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--text-muted);
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.fixture-play-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.7rem;
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .fixture-round {
    display: none;
  }
}
</style>
