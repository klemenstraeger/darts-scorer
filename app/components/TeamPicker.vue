<script setup lang="ts">
const { teams, ensureLoaded } = useTeams()

const props = withDefaults(defineProps<{
  modelValue: string[]
  min?: number
  max?: number
}>(), {
  min: 2,
  max: 16,
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const search = ref('')

onMounted(() => {
  ensureLoaded()
})

const showSearch = computed(() => teams.value.length > 6)

const filteredTeams = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return teams.value
  return teams.value.filter(t => t.name.toLowerCase().includes(q))
})

const maxReached = computed(() => props.modelValue.length >= props.max)

function selectionIndex(name: string): number {
  return props.modelValue.indexOf(name)
}

function toggleTeam(name: string) {
  const idx = selectionIndex(name)
  if (idx >= 0) {
    const updated = [...props.modelValue]
    updated.splice(idx, 1)
    emit('update:modelValue', updated)
  } else if (!maxReached.value) {
    emit('update:modelValue', [...props.modelValue, name])
  }
}

function removeTeam(name: string) {
  emit('update:modelValue', props.modelValue.filter(n => n !== name))
}
</script>

<template>
  <div class="team-picker">
    <!-- Search bar -->
    <input
      v-if="showSearch"
      v-model="search"
      class="picker-search"
      type="text"
      placeholder="Search teams..."
    />

    <!-- Team grid -->
    <div class="team-grid">
      <button
        v-for="team in filteredTeams"
        :key="team.id"
        class="team-card"
        :class="{
          selected: selectionIndex(team.name) >= 0,
          dimmed: maxReached && selectionIndex(team.name) < 0,
        }"
        @click="toggleTeam(team.name)"
      >
        <div class="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span
            v-if="selectionIndex(team.name) >= 0"
            class="selection-badge"
          >
            {{ selectionIndex(team.name) + 1 }}
          </span>
        </div>
        <span class="card-name">{{ team.name }}</span>
        <span class="card-members">{{ team.members.map(m => m.playerName).join(', ') }}</span>
      </button>

      <div v-if="filteredTeams.length === 0" class="empty-state">
        <template v-if="teams.length === 0">
          <p>No teams yet.</p>
          <NuxtLink to="/teams" class="btn btn-secondary text-[0.85rem]">
            Manage Teams
          </NuxtLink>
        </template>
        <p v-else>No teams match "{{ search }}"</p>
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
          {{ name }}
          <button class="chip-remove" @click="removeTeam(name)">&times;</button>
        </span>
      </div>
    </div>

    <!-- Status line -->
    <p class="picker-status">
      {{ modelValue.length }} of {{ min }}-{{ max }} teams
    </p>
  </div>
</template>

<style scoped>
.team-picker {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  width: 100%;
}

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

.team-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

@media (max-width: 400px) {
  .team-grid {
    grid-template-columns: 1fr;
  }
}

.team-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
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

.team-card:hover:not(.dimmed) {
  border-color: var(--border-default);
  background: var(--surface-2);
}

.team-card:active:not(.dimmed) {
  transform: scale(0.96);
}

.team-card.selected {
  border-color: var(--gold);
  background: rgba(255, 215, 0, 0.06);
}

.team-card.dimmed {
  opacity: 0.35;
  cursor: default;
}

.card-icon {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--surface-3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.team-card.selected .card-icon {
  color: var(--gold);
  background: rgba(255, 215, 0, 0.1);
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

.team-card.selected .card-name {
  color: var(--gold);
}

.card-members {
  font-size: 0.65rem;
  color: var(--text-muted);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

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
  padding: var(--spacing-xs) var(--spacing-md);
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

.picker-status {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
}

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
