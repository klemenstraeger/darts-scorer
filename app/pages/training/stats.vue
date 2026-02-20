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
    <div class="training-stats px-lg py-xl max-w-[800px] mx-auto w-full max-sm:px-md">
      <div class="flex items-center gap-md mb-xl">
        <NuxtLink to="/training" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </NuxtLink>
        <h1 class="text-[1.8rem] font-black text-fg max-sm:text-[1.4rem]">
          Training Stats
        </h1>
      </div>

      <!-- Mode filter tabs -->
      <div class="mode-tabs">
        <button
          class="mode-tab"
          :class="{ active: activeMode === null }"
          @click="selectMode(null)"
        >
          All
        </button>
        <button
          v-for="mode in TRAINING_MODES"
          :key="mode.mode"
          class="mode-tab"
          :class="{ active: activeMode === mode.mode }"
          :style="activeMode === mode.mode ? { color: mode.color, borderColor: mode.color } : {}"
          @click="selectMode(mode.mode)"
        >
          {{ mode.name }}
        </button>
      </div>

      <!-- Aggregate stats overview -->
      <div v-if="statsData?.stats" class="stats-overview">
        <div
          v-for="(stat, mode) in statsData.stats"
          :key="mode"
          class="stat-card glass-card"
          :class="{ hidden: activeMode && activeMode !== mode }"
        >
          <span class="stat-card-mode" :style="{ color: modeColor(mode as string) }">
            {{ modeName(mode as string) }}
          </span>
          <div class="stat-card-values">
            <div class="stat-item">
              <span class="stat-number">{{ stat.totalSessions }}</span>
              <span class="stat-label">Sessions</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ stat.avgDarts }}</span>
              <span class="stat-label">Avg Darts</span>
            </div>
            <div v-if="stat.lastPlayed" class="stat-item">
              <span class="stat-number text-[0.9rem]">{{ formatDate(stat.lastPlayed) }}</span>
              <span class="stat-label">Last Played</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Session history list -->
      <div class="sessions-list mt-xl">
        <h2 class="text-[1.1rem] font-bold text-fg mb-md">
          Recent Sessions
        </h2>

        <div v-if="!sessionsData?.sessions?.length" class="empty-state">
          <p class="text-fg-muted text-center">
            No training sessions yet. Start practicing!
          </p>
          <NuxtLink to="/training" class="btn btn-gold mt-md">
            Start Training
          </NuxtLink>
        </div>

        <div v-else class="sessions-grid">
          <div
            v-for="session in sessionsData.sessions"
            :key="session.id"
            class="session-card glass-card"
          >
            <div class="session-header">
              <span class="session-mode" :style="{ color: modeColor(session.mode) }">
                {{ modeName(session.mode) }}
              </span>
              <span class="session-date">{{ formatDate(session.createdAt) }}</span>
            </div>
            <div class="session-stats">
              <span class="session-darts">{{ session.totalDarts }} darts</span>
              <span v-if="session.completed" class="session-badge completed">Completed</span>
              <span v-else class="session-badge abandoned">Abandoned</span>
            </div>
            <div v-if="session.stats" class="session-details">
              <span
                v-for="entry in sessionStatEntries(session.stats as Record<string, unknown>)"
                :key="entry.label"
                class="session-detail"
              >
                {{ entry.label }}: <strong>{{ entry.value }}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AuthGate>
</template>

<style scoped>
.back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  transition: all var(--duration-fast);
}

.back-link:hover {
  color: var(--text-primary);
  background: var(--surface-2);
}

.mode-tabs {
  display: flex;
  gap: var(--spacing-xs);
  overflow-x: auto;
  padding-bottom: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  scrollbar-width: none;
}

.mode-tabs::-webkit-scrollbar {
  display: none;
}

.mode-tab {
  flex-shrink: 0;
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast);
  white-space: nowrap;
}

.mode-tab:hover {
  background: var(--surface-3);
  color: var(--text-primary);
}

.mode-tab.active {
  background: rgba(255, 215, 0, 0.08);
  border-color: var(--border-gold);
  color: var(--gold);
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.stat-card {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.stat-card.hidden {
  display: none;
}

.stat-card-mode {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-card-values {
  display: flex;
  gap: var(--spacing-lg);
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2xl);
}

.sessions-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.session-card {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-mode {
  font-size: 0.85rem;
  font-weight: 700;
}

.session-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.session-stats {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.session-darts {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.session-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px var(--spacing-xs);
  border-radius: var(--radius-sm);
}

.session-badge.completed {
  background: rgba(34, 197, 94, 0.12);
  color: var(--green);
}

.session-badge.abandoned {
  background: rgba(255, 215, 0, 0.08);
  color: var(--text-muted);
}

.session-details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.session-detail {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.session-detail strong {
  color: var(--text-secondary);
}
</style>
