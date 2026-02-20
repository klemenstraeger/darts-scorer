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
  <div class="flex flex-col gap-lg">
    <div v-if="fixturesByDate.length === 0" class="text-center p-2xl text-fg-muted text-[0.85rem]">
      No fixtures scheduled
    </div>
    <div
      v-for="group in fixturesByDate"
      :key="group.date"
      class="flex flex-col gap-sm"
      :class="{
        'fixture-day-today': isToday(group.date),
      }"
    >
      <div class="flex items-center gap-sm py-xs">
        <span
          class="text-[0.8rem] font-bold"
          :class="[
            isPast(group.rawDate) && group.date !== 'Unscheduled' ? 'text-fg-muted' : 'text-fg',
            group.date === 'Unscheduled' ? 'text-fg-muted italic' : '',
          ]"
        >{{ group.date }}</span>
        <span v-if="isToday(group.date)" class="text-[0.6rem] font-extrabold uppercase tracking-[0.5px] text-black bg-yellow px-xs py-[1px] rounded-sm border-2 border-black">Today</span>
        <span class="text-[0.7rem] text-fg-muted ml-auto">{{ group.matches.length }} match{{ group.matches.length !== 1 ? 'es' : '' }}</span>
      </div>
      <div class="flex flex-col gap-xs">
        <div
          v-for="match in group.matches"
          :key="match.id"
          class="flex items-center gap-sm px-md py-sm bg-surface-1 rounded-md shadow-sm"
          :class="[
            match.status === 'in_progress' ? 'border-[3px] border-yellow' : isPlayable(match) && showPlayButton ? 'border-2 border-yellow' : 'border-2 border-black',
            match.status === 'completed' ? 'opacity-80' : '',
          ]"
        >
          <div
            class="w-1.5 h-1.5 rounded-full shrink-0"
            :class="[
              match.status === 'pending' ? 'bg-fg-muted' : '',
              match.status === 'in_progress' ? 'bg-yellow' : '',
              match.status === 'completed' ? 'bg-green' : '',
            ]"
            :style="match.status === 'in_progress' ? 'animation: pulse-opacity 1.5s ease-in-out infinite;' : ''"
          />
          <div class="flex-1 flex items-center gap-xs min-w-0">
            <div class="flex-1 flex items-center gap-xs min-w-0" :class="{ 'fixture-winner': match.winnerName === match.player1Name }">
              <PlayerAvatar v-if="match.player1Name" v-bind="getAvatarProps(match.player1Name)" :size="18" />
              <span
                class="text-[0.78rem] font-semibold truncate"
                :class="match.winnerName === match.player1Name ? 'text-yellow font-bold' : 'text-fg-secondary'"
              >{{ match.player1Name || 'TBD' }}</span>
            </div>
            <div class="shrink-0 flex items-center gap-[2px] min-w-[48px] justify-center">
              <template v-if="match.status === 'completed'">
                <span class="text-[0.85rem] font-extrabold tabular-nums" :class="match.winnerName === match.player1Name ? 'text-yellow' : 'text-fg'">{{ match.player1LegsWon }}</span>
                <span class="text-[0.7rem] text-fg-muted mx-[1px]">-</span>
                <span class="text-[0.85rem] font-extrabold tabular-nums" :class="match.winnerName === match.player2Name ? 'text-yellow' : 'text-fg'">{{ match.player2LegsWon }}</span>
              </template>
              <span v-else-if="match.status === 'in_progress'" class="text-[0.6rem] font-extrabold text-yellow uppercase" style="animation: pulse-opacity 1.5s ease-in-out infinite;">LIVE</span>
              <span v-else class="text-[0.65rem] font-semibold text-fg-muted uppercase">vs</span>
            </div>
            <div class="flex-1 flex items-center gap-xs min-w-0 justify-end" :class="{ 'fixture-winner': match.winnerName === match.player2Name }">
              <span
                class="text-[0.78rem] font-semibold truncate"
                :class="match.winnerName === match.player2Name ? 'text-yellow font-bold' : 'text-fg-secondary'"
              >{{ match.player2Name || 'TBD' }}</span>
              <PlayerAvatar v-if="match.player2Name" v-bind="getAvatarProps(match.player2Name)" :size="18" />
            </div>
          </div>
          <div class="text-[0.6rem] font-semibold text-fg-muted shrink-0 w-6 text-center max-[480px]:hidden">
            R{{ match.round }}
          </div>
          <Button
            v-if="isPlayable(match) && showPlayButton"
            variant="default"
            size="sm"
            class="shrink-0 text-[0.7rem] px-sm py-xs"
            @click.stop="emit('play', match.id)"
          >
            Play
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Today left-bar indicator — ::before pseudo-element cannot be Tailwind */
.fixture-day-today {
  position: relative;
}

.fixture-day-today::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--yellow);
}
</style>
