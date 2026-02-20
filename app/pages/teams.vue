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
        class="relative px-lg py-xl rounded-xl bg-yellow-light border-2 border-black overflow-hidden mb-xl shadow-md"
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
      </div>

      <!-- Create team -->
      <section
        v-motion
        class="bg-surface-1 border-2 border-black rounded-lg shadow-md p-xl mb-xl"
        :initial="{ opacity: 0, y: 10 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: 100 } }"
      >
        <h3 class="text-[0.8rem] text-fg-muted uppercase tracking-wide mb-lg">
          New Team
        </h3>
        <div class="flex flex-col gap-md">
          <input
            v-model="newTeamName"
            class="w-full px-sm py-sm bg-surface-1 border-2 border-black rounded-md text-fg text-[0.9rem] outline-none transition-all duration-150 focus:shadow-sm placeholder:text-fg-muted"
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
              class="flex items-center gap-sm px-sm py-xs bg-surface-1 rounded-md border-2 border-black"
            >
              <span class="w-5 h-5 rounded-full bg-surface-2 text-[0.7rem] font-bold text-fg-muted flex items-center justify-center shrink-0">{{ i + 1 }}</span>
              <PlayerAvatar v-bind="usePlayers().getAvatarProps(member)" :size="28" />
              <span class="flex-1 text-[0.85rem] text-fg truncate">{{ member }}</span>
              <button class="flex items-center justify-center p-[2px] bg-transparent border-none text-fg-muted cursor-pointer rounded-sm transition-all duration-150 hover:enabled:text-fg hover:enabled:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed" :disabled="i === 0" title="Move up" @click="moveMember(i, -1)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6" /></svg>
              </button>
              <button class="flex items-center justify-center p-[2px] bg-transparent border-none text-fg-muted cursor-pointer rounded-sm transition-all duration-150 hover:enabled:text-fg hover:enabled:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed" :disabled="i === newMembers.length - 1" title="Move down" @click="moveMember(i, 1)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <button class="flex items-center justify-center p-[2px] bg-transparent border-none text-fg-muted cursor-pointer rounded-sm transition-all duration-150 hover:enabled:text-red hover:enabled:bg-red-light disabled:opacity-30 disabled:cursor-not-allowed" title="Remove" @click="removeMember(i)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <!-- Add member -->
          <div class="flex gap-sm">
            <div class="flex-1 relative">
              <input
                v-model="newMemberName"
                class="w-full px-sm py-sm bg-surface-1 border-2 border-black rounded-md text-fg text-[0.9rem] outline-none transition-all duration-150 focus:shadow-sm placeholder:text-fg-muted"
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
            <Button
              variant="secondary"
              class="shrink-0"
              :disabled="!newMemberName.trim()"
              @click="addMember"
            >
              + Add
            </Button>
          </div>

          <Button
            class="w-full"
            :disabled="!newTeamName.trim() || newMembers.length < 2 || creating"
            @click="createTeam"
          >
            {{ creating ? 'Creating...' : 'Create Team' }}
          </Button>
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
            class="bg-surface-1 border-2 border-black rounded-lg shadow-md p-md"
          >
            <!-- View mode -->
            <div v-if="editingId !== team.id">
              <div class="flex items-center gap-md mb-sm">
                <div class="w-10 h-10 rounded-full bg-surface-2 border-2 border-black flex items-center justify-center text-fg-muted shrink-0">
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
                  <button class="flex items-center justify-center p-xs bg-transparent border-none text-fg-muted cursor-pointer rounded-sm transition-all duration-150 hover:text-fg hover:bg-surface-2" title="Edit" @click="startEdit(team)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button class="flex items-center justify-center p-xs bg-transparent border-none text-fg-muted cursor-pointer rounded-sm transition-all duration-150 hover:text-red hover:bg-red-light" title="Delete" @click="deleteTarget = team">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
              <!-- Member chips -->
              <div class="flex flex-wrap gap-xs">
                <div v-for="m in team.members" :key="m.id" class="flex items-center gap-xs py-[2px] pr-sm pl-[2px] bg-surface-2 rounded-full text-[0.75rem] text-fg-secondary border border-black">
                  <PlayerAvatar v-bind="usePlayers().getAvatarProps(m.playerName)" :size="20" />
                  <span>{{ m.playerName }}</span>
                </div>
              </div>
            </div>

            <!-- Edit mode -->
            <div v-else class="flex flex-col gap-md">
              <input
                v-model="editName"
                class="w-full px-sm py-sm bg-surface-1 border-2 border-black rounded-md text-fg text-[0.9rem] outline-none transition-all duration-150 focus:shadow-sm placeholder:text-fg-muted"
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
                  class="flex items-center gap-sm px-sm py-xs bg-surface-1 rounded-md border-2 border-black"
                >
                  <span class="w-5 h-5 rounded-full bg-surface-2 text-[0.7rem] font-bold text-fg-muted flex items-center justify-center shrink-0">{{ i + 1 }}</span>
                  <PlayerAvatar v-bind="usePlayers().getAvatarProps(member)" :size="28" />
                  <span class="flex-1 text-[0.85rem] text-fg truncate">{{ member }}</span>
                  <button class="flex items-center justify-center p-[2px] bg-transparent border-none text-fg-muted cursor-pointer rounded-sm transition-all duration-150 hover:enabled:text-fg hover:enabled:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed" :disabled="i === 0" title="Move up" @click="editMoveMember(i, -1)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6" /></svg>
                  </button>
                  <button class="flex items-center justify-center p-[2px] bg-transparent border-none text-fg-muted cursor-pointer rounded-sm transition-all duration-150 hover:enabled:text-fg hover:enabled:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed" :disabled="i === editMembers.length - 1" title="Move down" @click="editMoveMember(i, 1)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6" /></svg>
                  </button>
                  <button class="flex items-center justify-center p-[2px] bg-transparent border-none text-fg-muted cursor-pointer rounded-sm transition-all duration-150 hover:enabled:text-red hover:enabled:bg-red-light disabled:opacity-30 disabled:cursor-not-allowed" title="Remove" @click="editRemoveMember(i)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div class="flex gap-sm">
                <div class="flex-1 relative">
                  <input
                    v-model="editMemberName"
                    class="w-full px-sm py-sm bg-surface-1 border-2 border-black rounded-md text-fg text-[0.9rem] outline-none transition-all duration-150 focus:shadow-sm placeholder:text-fg-muted"
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
                <Button
                  variant="secondary"
                  class="shrink-0"
                  :disabled="!editMemberName.trim()"
                  @click="editAddMember"
                >
                  + Add
                </Button>
              </div>

              <div class="flex gap-sm justify-end">
                <Button variant="secondary" @click="cancelEdit">
                  Cancel
                </Button>
                <Button :disabled="!editName.trim() || editMembers.length < 2 || saving" @click="saveEdit">
                  {{ saving ? 'Saving...' : 'Save' }}
                </Button>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </section>

      <!-- Delete confirmation modal -->
      <Transition name="fade">
        <div v-if="deleteTarget" class="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-lg" @click.self="deleteTarget = null">
          <div class="bg-surface-1 border-[3px] border-black rounded-xl p-xl max-w-[400px] w-full shadow-lg">
            <h3 class="text-[1rem] font-bold text-fg mb-sm">
              Delete Team
            </h3>
            <div class="flex items-center gap-md mb-md">
              <div class="w-10 h-10 rounded-full bg-surface-2 border-2 border-black flex items-center justify-center text-fg-muted shrink-0">
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
              <Button variant="secondary" @click="deleteTarget = null">
                Cancel
              </Button>
              <Button variant="destructive" :disabled="deleting" @click="confirmDelete">
                {{ deleting ? 'Deleting...' : 'Delete' }}
              </Button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </AuthGate>
</template>

