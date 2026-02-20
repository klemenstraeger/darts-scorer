<script setup lang="ts">
import type { TournamentFormat, TournamentStatus } from '~/types/tournament'

const props = defineProps<{
  id: number
  name: string
  format: TournamentFormat
  status: TournamentStatus
  playerCount: number
  winnerName: string | null
  createdAt: string
}>()

const statusLabel = computed(() => {
  switch (props.status) {
    case 'created': return 'Upcoming'
    case 'in_progress': return 'In Progress'
    case 'completed': return 'Completed'
    default: return props.status
  }
})

const dateLabel = computed(() => {
  const d = new Date(props.createdAt)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
})
</script>

<template>
  <NuxtLink
    :to="`/tournaments/${id}`"
    class="no-underline bg-surface-1 border-2 border-black rounded-lg shadow-md transition-all cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none p-lg flex flex-col gap-sm"
  >
    <div class="flex items-center justify-between gap-sm">
      <span class="text-[1rem] font-bold text-fg truncate">{{ name }}</span>
      <FormatBadge :format="format" />
    </div>
    <div class="flex items-center gap-md text-[0.75rem] text-fg-muted">
      <span class="flex items-center gap-xs">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        {{ playerCount }} players
      </span>
      <span>{{ dateLabel }}</span>
    </div>
    <div class="flex items-center gap-sm">
      <span
        class="tournament-card-status-dot"
        :class="{
          'bg-green': status === 'in_progress',
          'bg-yellow': status === 'created',
          'bg-fg-muted': status === 'completed',
        }"
      />
      <span
        class="text-[0.75rem] font-semibold" :class="{
          'text-green': status === 'in_progress',
          'text-yellow': status === 'created',
          'text-fg-muted': status === 'completed',
        }"
      >{{ statusLabel }}</span>
      <span v-if="winnerName" class="text-[0.75rem] text-fg-muted ml-auto">
        Winner: <span class="font-bold text-yellow">{{ winnerName }}</span>
      </span>
    </div>
  </NuxtLink>
</template>

<style>
.tournament-card-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tournament-card-status-dot.bg-green {
  animation: pulse-opacity 2s ease-in-out infinite;
}
</style>
