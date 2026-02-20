<script setup lang="ts">
import type { TeamRecord } from '~/composables/useTeams'

const { teams, fetchTeams } = useTeams()
const { players, ensureLoaded: ensurePlayers } = usePlayers()

// ── Create form ──
const newTeamName = ref('')
const newMemberName = ref('')
const newMembers = ref<string[]>([])
const creating = ref(false)

function addMember() {
  const name = newMemberName.value.trim()
  if (!name || newMembers.value.includes(name))
    return
  newMembers.value.push(name)
  newMemberName.value = ''
}

function removeMember(index: number) {
  newMembers.value.splice(index, 1)
}

function moveMember(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= newMembers.value.length)
    return
  const items = [...newMembers.value]
  ;[items[index]!, items[target]!] = [items[target]!, items[index]!]
  newMembers.value = items
}

const availablePlayersForCreate = computed(() =>
  players.value.filter(p => !newMembers.value.includes(p.name)),
)

async function createTeam() {
  const name = newTeamName.value.trim()
  if (!name || newMembers.value.length < 2 || creating.value)
    return
  creating.value = true
  try {
    await $fetch('/api/teams', {
      method: 'POST',
      body: {
        name,
        members: newMembers.value.map((pn, i) => ({ playerName: pn, position: i })),
      },
    })
    newTeamName.value = ''
    newMembers.value = []
    await fetchTeams()
  }
  catch {
    // ignore duplicate
  }
  finally {
    creating.value = false
  }
}

// ── Edit state ──
const editingId = ref<number | null>(null)
const editName = ref('')
const editMembers = ref<string[]>([])
const editMemberName = ref('')
const saving = ref(false)

function startEdit(team: TeamRecord) {
  editingId.value = team.id
  editName.value = team.name
  editMembers.value = team.members.map(m => m.playerName)
  editMemberName.value = ''
}

function cancelEdit() {
  editingId.value = null
}

function editAddMember() {
  const name = editMemberName.value.trim()
  if (!name || editMembers.value.includes(name))
    return
  editMembers.value.push(name)
  editMemberName.value = ''
}

function editRemoveMember(index: number) {
  editMembers.value.splice(index, 1)
}

function editMoveMember(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= editMembers.value.length)
    return
  const items = [...editMembers.value]
  ;[items[index]!, items[target]!] = [items[target]!, items[index]!]
  editMembers.value = items
}

const availablePlayersForEdit = computed(() =>
  players.value.filter(p => !editMembers.value.includes(p.name)),
)

async function saveEdit() {
  if (!editingId.value || saving.value)
    return
  saving.value = true
  try {
    await $fetch(`/api/teams/${editingId.value}`, {
      method: 'PUT',
      body: {
        name: editName.value.trim(),
        members: editMembers.value.map((pn, i) => ({ playerName: pn, position: i })),
      },
    })
    editingId.value = null
    await fetchTeams()
  }
  catch {
    // ignore
  }
  finally {
    saving.value = false
  }
}

// ── Delete state ──
const deleteTarget = ref<TeamRecord | null>(null)
const deleting = ref(false)

async function confirmDelete() {
  if (!deleteTarget.value || deleting.value)
    return
  deleting.value = true
  try {
    await $fetch(`/api/teams/${deleteTarget.value.id}`, { method: 'DELETE' })
    deleteTarget.value = null
    await fetchTeams()
  }
  catch {
    // ignore
  }
  finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchTeams()
  ensurePlayers()
})
</script>

<template>
  <AuthGate feature="Teams" description="Sign in to create and manage teams for doubles tournaments.">
    <div class="px-lg py-xl max-w-[700px] mx-auto w-full">
      <!-- Hero -->
      <div
        v-motion
        class="page-hero"
        :initial="{ opacity: 0, y: -10 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 300 } }"
      >
        <div>
          <h2 class="text-[2rem] font-extrabold text-fg mb-xs">
            Teams
          </h2>
          <p class="text-[0.9rem] text-fg-secondary">
            Create and manage your teams for doubles tournaments.
          </p>
        </div>
        <div class="hero-glow" />
      </div>

      <!-- Create team -->
      <section
        v-motion
        class="glass-card p-xl mb-xl"
        :initial="{ opacity: 0, y: 10 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: 100 } }"
      >
        <h3 class="section-title mb-lg">
          New Team
        </h3>
        <div class="flex flex-col gap-md">
          <input
            v-model="newTeamName"
            class="form-input"
            type="text"
            placeholder="Team name"
            maxlength="30"
          >

          <!-- Member list -->
          <div v-if="newMembers.length > 0" class="flex flex-col gap-xs">
            <div class="text-[0.75rem] text-fg-muted uppercase tracking-wide">
              Members (throw order)
            </div>
            <div
              v-for="(member, i) in newMembers"
              :key="member"
              class="member-row"
            >
              <span class="member-pos">{{ i + 1 }}</span>
              <PlayerAvatar v-bind="usePlayers().getAvatarProps(member)" :size="28" />
              <span class="flex-1 text-[0.85rem] text-fg truncate">{{ member }}</span>
              <button class="order-btn" :disabled="i === 0" title="Move up" @click="moveMember(i, -1)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6" /></svg>
              </button>
              <button class="order-btn" :disabled="i === newMembers.length - 1" title="Move down" @click="moveMember(i, 1)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <button class="order-btn order-btn-danger" title="Remove" @click="removeMember(i)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <!-- Add member -->
          <div class="flex gap-sm">
            <div class="flex-1 relative">
              <input
                v-model="newMemberName"
                class="form-input"
                type="text"
                placeholder="Add member name"
                maxlength="20"
                list="create-player-list"
                @keyup.enter="addMember"
              >
              <datalist id="create-player-list">
                <option v-for="p in availablePlayersForCreate" :key="p.id" :value="p.name" />
              </datalist>
            </div>
            <button
              class="btn btn-secondary shrink-0"
              :disabled="!newMemberName.trim()"
              @click="addMember"
            >
              + Add
            </button>
          </div>

          <button
            class="btn btn-gold w-full"
            :disabled="!newTeamName.trim() || newMembers.length < 2 || creating"
            @click="createTeam"
          >
            {{ creating ? 'Creating...' : 'Create Team' }}
          </button>
        </div>
      </section>

      <!-- Team list -->
      <section>
        <div v-if="teams.length === 0" class="text-center text-fg-muted p-2xl text-[0.95rem]">
          No teams yet. Create one above!
        </div>

        <TransitionGroup name="list" tag="div" class="flex flex-col gap-sm">
          <div
            v-for="team in teams"
            :key="team.id"
            class="glass-card p-md"
          >
            <!-- View mode -->
            <div v-if="editingId !== team.id">
              <div class="flex items-center gap-md mb-sm">
                <div class="team-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-[0.95rem] font-bold text-fg truncate">
                    {{ team.name }}
                  </div>
                  <div class="text-[0.7rem] text-fg-muted">
                    {{ team.members.length }} members
                  </div>
                </div>
                <div class="flex gap-xs shrink-0">
                  <button class="action-btn" title="Edit" @click="startEdit(team)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button class="action-btn action-btn-danger" title="Delete" @click="deleteTarget = team">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
              <!-- Member chips -->
              <div class="flex flex-wrap gap-xs">
                <div v-for="m in team.members" :key="m.id" class="member-chip">
                  <PlayerAvatar v-bind="usePlayers().getAvatarProps(m.playerName)" :size="20" />
                  <span>{{ m.playerName }}</span>
                </div>
              </div>
            </div>

            <!-- Edit mode -->
            <div v-else class="flex flex-col gap-md">
              <input
                v-model="editName"
                class="form-input"
                type="text"
                placeholder="Team name"
                maxlength="30"
              >

              <div v-if="editMembers.length > 0" class="flex flex-col gap-xs">
                <div class="text-[0.75rem] text-fg-muted uppercase tracking-wide">
                  Members (throw order)
                </div>
                <div
                  v-for="(member, i) in editMembers"
                  :key="member"
                  class="member-row"
                >
                  <span class="member-pos">{{ i + 1 }}</span>
                  <PlayerAvatar v-bind="usePlayers().getAvatarProps(member)" :size="28" />
                  <span class="flex-1 text-[0.85rem] text-fg truncate">{{ member }}</span>
                  <button class="order-btn" :disabled="i === 0" title="Move up" @click="editMoveMember(i, -1)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6" /></svg>
                  </button>
                  <button class="order-btn" :disabled="i === editMembers.length - 1" title="Move down" @click="editMoveMember(i, 1)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6" /></svg>
                  </button>
                  <button class="order-btn order-btn-danger" title="Remove" @click="editRemoveMember(i)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div class="flex gap-sm">
                <div class="flex-1 relative">
                  <input
                    v-model="editMemberName"
                    class="form-input"
                    type="text"
                    placeholder="Add member name"
                    maxlength="20"
                    list="edit-player-list"
                    @keyup.enter="editAddMember"
                  >
                  <datalist id="edit-player-list">
                    <option v-for="p in availablePlayersForEdit" :key="p.id" :value="p.name" />
                  </datalist>
                </div>
                <button
                  class="btn btn-secondary shrink-0"
                  :disabled="!editMemberName.trim()"
                  @click="editAddMember"
                >
                  + Add
                </button>
              </div>

              <div class="flex gap-sm justify-end">
                <button class="btn btn-secondary" @click="cancelEdit">
                  Cancel
                </button>
                <button class="btn btn-gold" :disabled="!editName.trim() || editMembers.length < 2 || saving" @click="saveEdit">
                  {{ saving ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </section>

      <!-- Delete confirmation modal -->
      <Transition name="fade">
        <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
          <div class="modal-card">
            <h3 class="text-[1rem] font-bold text-fg mb-sm">
              Delete Team
            </h3>
            <div class="flex items-center gap-md mb-md">
              <div class="team-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span class="text-[0.9rem] text-fg-secondary">{{ deleteTarget.name }}</span>
            </div>
            <p class="text-[0.85rem] text-fg-muted mb-lg">
              This will remove the team. Tournament history will be kept.
            </p>
            <div class="flex gap-sm justify-end">
              <button class="btn btn-secondary" @click="deleteTarget = null">
                Cancel
              </button>
              <button class="btn btn-danger" :disabled="deleting" @click="confirmDelete">
                {{ deleting ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </AuthGate>
</template>

<style scoped>
.page-hero {
  position: relative;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(59, 130, 246, 0.08));
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  margin-bottom: var(--spacing-xl);
}

.hero-glow {
  position: absolute;
  top: -60px;
  right: -40px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.25), transparent 70%);
  filter: blur(6px);
}

.section-title {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.form-input {
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

.form-input:focus {
  border-color: var(--border-strong);
}

.form-input::placeholder {
  color: var(--text-muted);
}

.team-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--surface-3);
  border: 2px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  shrink: 0;
}

.member-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--surface-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.member-pos {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  background: var(--surface-3);
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-chip {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px var(--spacing-sm) 2px 2px;
  background: var(--surface-2);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.order-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast);
}

.order-btn:hover:not(:disabled) {
  color: var(--text-primary);
  background: var(--surface-3);
}

.order-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.order-btn-danger:hover:not(:disabled) {
  color: var(--red);
  background: rgba(239, 68, 68, 0.1);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xs);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast);
}

.action-btn:hover {
  color: var(--text-primary);
  background: var(--surface-2);
}

.action-btn-danger:hover {
  color: var(--red);
  background: rgba(239, 68, 68, 0.1);
}

.btn-danger {
  background: var(--red);
  color: white;
  border: none;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--duration-fast);
}

.btn-danger:hover {
  opacity: 0.9;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--spacing-lg);
}

.modal-card {
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  max-width: 400px;
  width: 100%;
}

/* List transition */
.list-enter-active {
  transition: all var(--duration-normal) var(--ease-out);
}
.list-leave-active {
  transition: all var(--duration-fast) var(--ease-out);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-fast);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
