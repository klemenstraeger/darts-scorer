<script setup lang="ts">
const { players, ensureLoaded } = usePlayers()

const props = withDefaults(defineProps<{
  modelValue: string[]
  min?: number
  max?: number
}>(), {
  min: 2,
  max: 4,
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const search = ref('')

onMounted(() => {
  ensureLoaded()
})

const showSearch = computed(() => players.value.length > 6)

const filteredPlayers = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return players.value
  return players.value.filter(p => p.name.toLowerCase().includes(q))
})

const maxReached = computed(() => props.modelValue.length >= props.max)

function selectionIndex(name: string): number {
  return props.modelValue.indexOf(name)
}

function togglePlayer(name: string) {
  const idx = selectionIndex(name)
  if (idx >= 0) {
    // Deselect
    const updated = [...props.modelValue]
    updated.splice(idx, 1)
    emit('update:modelValue', updated)
  } else if (!maxReached.value) {
    // Select
    emit('update:modelValue', [...props.modelValue, name])
  }
}

function removePlayer(name: string) {
  emit('update:modelValue', props.modelValue.filter(n => n !== name))
}

function getAvatarProps(name: string) {
  const player = players.value.find(p => p.name === name)
  return {
    name,
    avatarSeed: player?.avatarSeed ?? null,
    avatarStyle: player?.avatarStyle ?? null,
  }
}
</script>

<template>
  <div class="player-picker">
    <!-- Search bar (only if many players) -->
    <input
      v-if="showSearch"
      v-model="search"
      class="picker-search"
      type="text"
      placeholder="Search players..."
    />

    <!-- Player grid -->
    <div class="player-grid">
      <button
        v-for="player in filteredPlayers"
        :key="player.id"
        class="player-card"
        :class="{
          selected: selectionIndex(player.name) >= 0,
          dimmed: maxReached && selectionIndex(player.name) < 0,
        }"
        @click="togglePlayer(player.name)"
      >
        <div class="card-avatar">
          <PlayerAvatar
            v-bind="getAvatarProps(player.name)"
            :size="48"
          />
          <span
            v-if="selectionIndex(player.name) >= 0"
            class="selection-badge"
          >
            {{ selectionIndex(player.name) + 1 }}
          </span>
        </div>
        <span class="card-name">{{ player.name }}</span>
      </button>

      <div v-if="filteredPlayers.length === 0" class="empty-state">
        <template v-if="players.length === 0">
          <p>No players yet.</p>
          <NuxtLink to="/players" class="btn btn-secondary text-[0.85rem]">
            Manage Players
          </NuxtLink>
        </template>
        <p v-else>No players match "{{ search }}"</p>
      </div>
    </div>

    <!-- Selected summary -->
    <div v-if="modelValue.length > 0" class="selected-summary">
      <div class="selected-chips">
        <span
          v-for="name in modelValue"
          :key="name"
          class="selected-chip"
        >
          <PlayerAvatar v-bind="getAvatarProps(name)" :size="20" />
          {{ name }}
          <button class="chip-remove" @click="removePlayer(name)">&times;</button>
        </span>
      </div>
    </div>

    <!-- Status line -->
    <p class="picker-status">
      {{ modelValue.length }} of {{ min }}-{{ max }} players
    </p>
  </div>
</template>

<style scoped>
.player-picker {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  width: 100%;
}

/* ── Search ──────────────────────────────────────────────────── */
.picker-search {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  outline: none;
  transition: border-color var(--duration-fast);
}

.picker-search:focus {
  border-color: var(--border-gold);
}

.picker-search::placeholder {
  color: var(--text-muted);
}

/* ── Grid ────────────────────────────────────────────────────── */
.player-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

@media (max-width: 400px) {
  .player-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ── Player card ─────────────────────────────────────────────── */
.player-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) var(--spacing-sm);
  background: var(--surface-1);
  border: 2px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    border-color var(--duration-fast),
    background var(--duration-fast),
    opacity var(--duration-fast),
    transform var(--duration-fast) var(--ease-out);
  min-height: 90px;
  font-family: var(--font-sans);
}

.player-card:hover:not(.dimmed) {
  border-color: var(--border-default);
  background: var(--surface-2);
}

.player-card:active:not(.dimmed) {
  transform: scale(0.96);
}

.player-card.selected {
  border-color: var(--gold);
  background: rgba(255, 215, 0, 0.06);
}

.player-card.dimmed {
  opacity: 0.35;
  cursor: default;
}

/* ── Card avatar + badge ─────────────────────────────────────── */
.card-avatar {
  position: relative;
}

.selection-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--gold-gradient);
  color: var(--text-inverse);
  font-size: 0.7rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.card-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.player-card.selected .card-name {
  color: var(--gold);
}

/* ── Selected summary chips ──────────────────────────────────── */
.selected-summary {
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-subtle);
}

.selected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.selected-chip {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md) var(--spacing-xs) var(--spacing-xs);
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid var(--border-gold);
  border-radius: var(--radius-full);
  color: var(--gold);
  font-size: 0.8rem;
  font-weight: 600;
}

.chip-remove {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  transition: color var(--duration-fast);
}

.chip-remove:hover {
  color: var(--red);
}

/* ── Status ──────────────────────────────────────────────────── */
.picker-status {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
}

/* ── Empty state ─────────────────────────────────────────────── */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>
