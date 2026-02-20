<script setup lang="ts">
import type { PlayerRecord } from '~/composables/usePlayers'
import type { AvatarStyle } from '~/utils/avatar'
import { AVATAR_STYLES, DEFAULT_AVATAR_STYLE, generateRandomSeed, getAvatarUrl } from '~/utils/avatar'

const { players, fetchPlayers } = usePlayers()

// ── Create form ──
const newName = ref('')
const newStyle = ref<AvatarStyle>(DEFAULT_AVATAR_STYLE)
const newSeed = ref('')
const creating = ref(false)

const previewUrl = computed(() =>
  getAvatarUrl(newName.value || 'Preview', newSeed.value || undefined, newStyle.value, 128),
)

function rerollSeed() {
  newSeed.value = generateRandomSeed()
}

async function createPlayer() {
  const name = newName.value.trim()
  if (!name || creating.value)
    return
  creating.value = true
  try {
    await $fetch('/api/players', {
      method: 'POST',
      body: { name, avatarStyle: newStyle.value, avatarSeed: newSeed.value || undefined },
    })
    newName.value = ''
    newSeed.value = ''
    newStyle.value = DEFAULT_AVATAR_STYLE
    await fetchPlayers()
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
const editStyle = ref<AvatarStyle>(DEFAULT_AVATAR_STYLE)
const editSeed = ref('')
const saving = ref(false)

function startEdit(player: PlayerRecord) {
  editingId.value = player.id
  editName.value = player.name
  editStyle.value = (player.avatarStyle as AvatarStyle) || DEFAULT_AVATAR_STYLE
  editSeed.value = player.avatarSeed || ''
}

function cancelEdit() {
  editingId.value = null
}

function editReroll() {
  editSeed.value = generateRandomSeed()
}

async function saveEdit() {
  if (!editingId.value || saving.value)
    return
  saving.value = true
  try {
    await $fetch(`/api/players/${editingId.value}`, {
      method: 'PUT',
      body: {
        name: editName.value.trim(),
        avatarStyle: editStyle.value,
        avatarSeed: editSeed.value || null,
      },
    })
    editingId.value = null
    await fetchPlayers()
  }
  catch {
    // ignore
  }
  finally {
    saving.value = false
  }
}

// ── Delete state ──
const deleteTarget = ref<PlayerRecord | null>(null)
const deleting = ref(false)

async function confirmDelete() {
  if (!deleteTarget.value || deleting.value)
    return
  deleting.value = true
  try {
    await $fetch(`/api/players/${deleteTarget.value.id}`, { method: 'DELETE' })
    deleteTarget.value = null
    await fetchPlayers()
  }
  catch {
    // ignore
  }
  finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchPlayers()
})
</script>

<template>
  <AuthGate feature="Players" description="Sign in to manage your player roster with avatars, nicknames, and Elo ratings.">
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
            Players
          </h2>
          <p class="text-[0.9rem] text-fg-secondary">
            Manage your players and their avatars.
          </p>
        </div>
        <div class="hero-glow" />
      </div>

      <!-- Create player -->
      <section
        v-motion
        class="glass-card p-xl mb-xl"
        :initial="{ opacity: 0, y: 10 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: 100 } }"
      >
        <h3 class="section-title mb-lg">
          New Player
        </h3>
        <div class="flex gap-lg items-start max-sm:flex-col">
          <!-- Avatar preview -->
          <div class="flex flex-col items-center gap-sm shrink-0">
            <div class="avatar-preview">
              <img :src="previewUrl" alt="Avatar preview" width="96" height="96">
            </div>
            <button class="btn btn-secondary text-[0.75rem] px-md py-xs" @click="rerollSeed">
              Re-roll
            </button>
          </div>

          <!-- Form -->
          <div class="flex-1 flex flex-col gap-md w-full">
            <input
              v-model="newName"
              class="form-input"
              type="text"
              placeholder="Player name"
              maxlength="20"
              @keyup.enter="createPlayer"
            >

            <!-- Style picker -->
            <div class="flex flex-wrap gap-sm">
              <button
                v-for="style in AVATAR_STYLES"
                :key="style"
                class="style-thumb"
                :class="{ active: newStyle === style }"
                :title="style"
                @click="newStyle = style"
              >
                <img
                  :src="getAvatarUrl(newName || 'Preview', newSeed || undefined, style, 40)"
                  :alt="style"
                  width="32"
                  height="32"
                  loading="lazy"
                >
              </button>
            </div>

            <button
              class="btn btn-gold w-full"
              :disabled="!newName.trim() || creating"
              @click="createPlayer"
            >
              {{ creating ? 'Creating...' : 'Create Player' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Player list -->
      <section>
        <div v-if="players.length === 0" class="text-center text-fg-muted p-2xl text-[0.95rem]">
          No players yet. Create one above!
        </div>

        <TransitionGroup name="list" tag="div" class="flex flex-col gap-sm">
          <div
            v-for="player in players"
            :key="player.id"
            class="glass-card p-md"
          >
            <!-- View mode -->
            <div v-if="editingId !== player.id" class="flex items-center gap-md">
              <PlayerAvatar
                :name="player.name"
                :avatar-seed="player.avatarSeed"
                :avatar-style="player.avatarStyle"
                :size="48"
              />
              <div class="flex-1 min-w-0">
                <div class="text-[0.95rem] font-bold text-fg truncate">
                  {{ player.name }}
                </div>
                <div class="text-[0.7rem] text-fg-muted capitalize">
                  {{ player.avatarStyle || 'bottts' }}
                </div>
              </div>
              <div class="flex gap-xs shrink-0">
                <NuxtLink
                  :to="`/stats?player=${encodeURIComponent(player.name)}`"
                  class="action-btn"
                  title="View stats"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
                  </svg>
                </NuxtLink>
                <button class="action-btn" title="Edit" @click="startEdit(player)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button class="action-btn action-btn-danger" title="Delete" @click="deleteTarget = player">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Edit mode -->
            <div v-else class="flex flex-col gap-md">
              <div class="flex gap-md items-start max-sm:flex-col">
                <div class="flex flex-col items-center gap-sm shrink-0">
                  <div class="avatar-preview small">
                    <img
                      :src="getAvatarUrl(editName || player.name, editSeed || undefined, editStyle, 80)"
                      alt="Edit preview"
                      width="64"
                      height="64"
                    >
                  </div>
                  <button class="btn btn-secondary text-[0.7rem] px-sm py-xs" @click="editReroll">
                    Re-roll
                  </button>
                </div>
                <div class="flex-1 flex flex-col gap-sm w-full">
                  <input
                    v-model="editName"
                    class="form-input"
                    type="text"
                    placeholder="Player name"
                    maxlength="20"
                    @keyup.enter="saveEdit"
                  >
                  <div class="flex flex-wrap gap-xs">
                    <button
                      v-for="style in AVATAR_STYLES"
                      :key="style"
                      class="style-thumb small"
                      :class="{ active: editStyle === style }"
                      :title="style"
                      @click="editStyle = style"
                    >
                      <img
                        :src="getAvatarUrl(editName || player.name, editSeed || undefined, style, 32)"
                        :alt="style"
                        width="24"
                        height="24"
                        loading="lazy"
                      >
                    </button>
                  </div>
                </div>
              </div>
              <div class="flex gap-sm justify-end">
                <button class="btn btn-secondary" @click="cancelEdit">
                  Cancel
                </button>
                <button class="btn btn-gold" :disabled="!editName.trim() || saving" @click="saveEdit">
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
              Delete Player
            </h3>
            <div class="flex items-center gap-md mb-md">
              <PlayerAvatar
                :name="deleteTarget.name"
                :avatar-seed="deleteTarget.avatarSeed"
                :avatar-style="deleteTarget.avatarStyle"
                :size="40"
              />
              <span class="text-[0.9rem] text-fg-secondary">{{ deleteTarget.name }}</span>
            </div>
            <p class="text-[0.85rem] text-fg-muted mb-lg">
              This will remove the player from your list. Game history data will be kept.
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

.avatar-preview {
  width: 96px;
  height: 96px;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--surface-3);
  border: 2px solid var(--border-subtle);
}

.avatar-preview.small {
  width: 64px;
  height: 64px;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.style-thumb {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  border: 2px solid var(--border-subtle);
  background: var(--surface-2);
  padding: 4px;
  cursor: pointer;
  transition: border-color var(--duration-fast), transform var(--duration-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.style-thumb.small {
  width: 36px;
  height: 36px;
  padding: 3px;
}

.style-thumb:hover {
  border-color: var(--border-default);
  transform: translateY(-1px);
}

.style-thumb.active {
  border-color: var(--gold);
  background: rgba(255, 215, 0, 0.08);
}

.style-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
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
  text-decoration: none;
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
