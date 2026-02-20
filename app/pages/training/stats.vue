<script setup lang="ts">
import type { TrainingMode } from '~/types/training'
import { TRAINING_MODES } from '~/types/training'

const activeMode = ref<TrainingMode | null>(null)

const { data: statsData, refresh: _refreshStats } = await useFetch('/api/training/stats')
const { data: sessionsData, refresh: _refreshSessions } = await useFetch('/api/training/sessions', {
  query: computed(() => ({
    mode: activeMode.value ?? undefined,
    limit: 20,
  })),
  watch: [activeMode],
})

function selectMode(mode: TrainingMode | null) {
  activeMode.value = mode
}

function modeName(mode: string): string {
  return TRAINING_MODES.find(m => m.mode === mode)?.name ?? mode
}

function modeColor(mode: string): string {
  return TRAINING_MODES.find(m => m.mode === mode)?.color ?? 'var(--text-primary)'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0)
    return 'Today'
  if (days === 1)
    return 'Yesterday'
  if (days < 7)
    return `${days}d ago`
  return d.toLocaleDateString()
}

function formatStat(value: unknown): string {
  if (value === null || value === undefined)
    return '-'
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : (value as number).toFixed(1)
  }
  return String(value)
}

function sessionStatEntries(stats: Record<string, unknown> | null): { label: string, value: string }[] {
  if (!stats)
    return []
  return Object.entries(stats)
    .filter(([key]) => key !== 'mode' && key !== 'totalDarts')
    .slice(0, 4)
    .map(([key, value]) => ({
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
      value: formatStat(value),
    }))
}
</script>

<template>
  <AuthGate feature="Training Stats" description="Sign in to track your training session history, scores, and improvement over time.">
    <div class="px-lg py-xl max-w-[800px] mx-auto w-full max-sm:px-md">
      <div class="flex items-center gap-md mb-xl">
        <BackLink to="/training" />
        <h1 class="text-[1.8rem] font-black text-fg max-sm:text-[1.4rem]">
          Training Stats
        </h1>
      </div>

      <!-- Mode filter tabs -->
      <div class="flex gap-xs overflow-x-auto pb-sm mb-lg scrollbar-none">
        <button
          class="shrink-0 px-md py-xs bg-surface-1 border-2 border-black text-fg-muted text-[0.8rem] font-semibold cursor-pointer transition-all duration-fast whitespace-nowrap shadow-sm hover:bg-[var(--surface-2)] hover:text-fg hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-md"
          :class="activeMode === null ? 'bg-[var(--yellow-light)] !text-[var(--yellow)]' : ''"
          @click="selectMode(null)"
        >
          All
        </button>
        <button
          v-for="mode in TRAINING_MODES"
          :key="mode.mode"
          class="shrink-0 px-md py-xs bg-surface-1 border-2 border-black text-fg-muted text-[0.8rem] font-semibold cursor-pointer transition-all duration-fast whitespace-nowrap shadow-sm hover:bg-[var(--surface-2)] hover:text-fg hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-md"
          :class="activeMode === mode.mode ? 'bg-[var(--yellow-light)]' : ''"
          :style="activeMode === mode.mode ? { color: mode.color, borderColor: mode.color } : {}"
          @click="selectMode(mode.mode)"
        >
          {{ mode.name }}
        </button>
      </div>

      <!-- Aggregate stats overview -->
      <div v-if="statsData?.stats" class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-md">
        <div
          v-for="(stat, mode) in statsData.stats"
          :key="mode"
          class="p-md flex flex-col gap-sm bg-surface-1 border-2 border-black rounded-md shadow-md"
          :class="{ hidden: activeMode && activeMode !== mode }"
        >
          <span class="text-[0.8rem] font-bold uppercase tracking-wider" :style="{ color: modeColor(mode as string) }">
            {{ modeName(mode as string) }}
          </span>
          <div class="flex gap-lg">
            <div class="flex flex-col">
              <span class="text-[1.3rem] font-extrabold text-fg tabular-nums">{{ stat.totalSessions }}</span>
              <span class="text-[0.65rem] font-bold text-fg-muted uppercase">Sessions</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[1.3rem] font-extrabold text-fg tabular-nums">{{ stat.avgDarts }}</span>
              <span class="text-[0.65rem] font-bold text-fg-muted uppercase">Avg Darts</span>
            </div>
            <div v-if="stat.lastPlayed" class="flex flex-col">
              <span class="text-[0.9rem] font-extrabold text-fg tabular-nums">{{ formatDate(stat.lastPlayed) }}</span>
              <span class="text-[0.65rem] font-bold text-fg-muted uppercase">Last Played</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Session history list -->
      <div class="mt-xl">
        <h2 class="text-[1.1rem] font-bold text-fg mb-md">
          Recent Sessions
        </h2>

        <div v-if="!sessionsData?.sessions?.length" class="flex flex-col items-center p-2xl">
          <p class="text-fg-muted text-center">
            No training sessions yet. Start practicing!
          </p>
          <NuxtLink
            to="/training"
            class="mt-md inline-flex items-center justify-center px-xl py-sm bg-[var(--yellow)] text-black border-2 border-black rounded-md font-bold text-sm shadow-md hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-fast"
          >
            Start Training
          </NuxtLink>
        </div>

        <div v-else class="flex flex-col gap-sm">
          <div
            v-for="session in sessionsData.sessions"
            :key="session.id"
            class="p-md flex flex-col gap-xs bg-surface-1 border-2 border-black rounded-md shadow-md"
          >
            <div class="flex justify-between items-center">
              <span class="text-[0.85rem] font-bold" :style="{ color: modeColor(session.mode) }">
                {{ modeName(session.mode) }}
              </span>
              <span class="text-[0.75rem] text-fg-muted">{{ formatDate(session.createdAt) }}</span>
            </div>
            <div class="flex items-center gap-sm">
              <span class="text-[0.8rem] font-semibold text-fg-secondary tabular-nums">{{ session.totalDarts }} darts</span>
              <span
                v-if="session.completed"
                class="text-[0.65rem] font-bold uppercase tracking-wider px-xs py-[2px] border border-black bg-[var(--green-light,#dcfce7)] text-[var(--green)]"
              >Completed</span>
              <span
                v-else
                class="text-[0.65rem] font-bold uppercase tracking-wider px-xs py-[2px] border border-black bg-[var(--surface-2)] text-fg-muted"
              >Abandoned</span>
            </div>
            <div v-if="session.stats" class="flex flex-wrap gap-sm">
              <span
                v-for="entry in sessionStatEntries(session.stats as Record<string, unknown>)"
                :key="entry.label"
                class="text-[0.75rem] text-fg-muted"
              >
                {{ entry.label }}: <strong class="text-fg-secondary">{{ entry.value }}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AuthGate>
</template>
