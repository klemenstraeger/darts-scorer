<script setup lang="ts">
import type { BotDifficulty, CheckoutMode, PlayerDescriptor } from '~/types/game'

const { newGame, hasActiveGame, hasGame } = useGameState()
const { isAuthenticated } = useAuth()

// ── Game settings ─────────────────────────────────────────────────────
const playerNames = ref<string[]>(['', ''])
const botPlayers = ref<Map<string, BotDifficulty>>(new Map())
const gameMode = ref<'501' | '301'>('501')
const checkout = ref<CheckoutMode>('double_out')
const legsToWin = ref(1)
const setsToWin = ref(1)
const showAbandonConfirm = ref(false)
const showSettings = ref(false)

const totalPlayerCount = computed(() =>
  playerNames.value.filter(n => n.trim()).length + botPlayers.value.size,
)

const canStart = computed(() => {
  const filledHumans = playerNames.value.filter(n => n.trim()).length
  return totalPlayerCount.value >= 2 && filledHumans >= 1
})

let botCounter = 0

function addPlayer() {
  if (playerNames.value.length + botPlayers.value.size >= 4)
    return
  playerNames.value.push('')
}

function removePlayer(index: number) {
  if (playerNames.value.length <= 1 && botPlayers.value.size === 0)
    return
  playerNames.value.splice(index, 1)
}

function addBot(difficulty: BotDifficulty) {
  if (totalPlayerCount.value >= 4)
    return
  botCounter++
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
  const name = `Bot ${label}${botCounter > 1 ? ` #${botCounter}` : ''}`
  botPlayers.value.set(name, difficulty)
}

function removeBot(name: string) {
  botPlayers.value.delete(name)
}

function buildDescriptors(): PlayerDescriptor[] {
  const humans: PlayerDescriptor[] = playerNames.value
    .filter(n => n.trim())
    .map(n => ({ name: n.trim() }))
  const bots: PlayerDescriptor[] = Array.from(botPlayers.value.entries())
    .map(([name, diff]) => ({ name, isBot: true, botDifficulty: diff }))
  return [...humans, ...bots]
}

function startGame() {
  if (hasActiveGame.value || hasGame.value) {
    showAbandonConfirm.value = true
    return
  }
  doStartGame()
}

function doStartGame() {
  showAbandonConfirm.value = false
  newGame(gameMode.value, buildDescriptors(), {
    checkout: checkout.value,
    legs_to_win: legsToWin.value,
    sets_to_win: setsToWin.value,
  })
  navigateTo('/game')
}

function focusNextInput(index: number) {
  const inputs = document.querySelectorAll<HTMLInputElement>('.player-name-input')
  inputs[index + 1]?.focus()
}
</script>

<template>
  <div class="flex flex-col items-center gap-xl px-lg py-xl max-w-[600px] mx-auto w-full max-sm:px-md">
    <!-- Back link -->
    <div class="w-full flex items-center justify-between">
      <NuxtLink to="/" class="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </NuxtLink>
      <NuxtLink v-if="!isAuthenticated" to="/login" class="text-[0.8rem] font-semibold text-fg-muted hover:text-gold transition-colors">
        Sign In
      </NuxtLink>
    </div>

    <!-- Title -->
    <div class="text-center">
      <h1 class="text-[1.8rem] font-black text-fg max-sm:text-[1.5rem]">
        Quick Play
      </h1>
      <p class="text-fg-muted text-[0.85rem] mt-xs">
        Enter player names and start scoring
      </p>
    </div>

    <!-- Player name inputs -->
    <div class="w-full flex flex-col gap-md">
      <span class="text-[0.8rem] font-bold text-fg-muted uppercase tracking-wide">Players</span>

      <div
        v-for="(_, i) in playerNames"
        :key="i"
        class="flex items-center gap-sm"
      >
        <span class="text-[0.75rem] font-bold text-fg-muted w-[20px] text-center shrink-0">{{ i + 1 }}</span>
        <input
          v-model="playerNames[i]"
          class="player-name-input"
          type="text"
          :placeholder="`Player ${i + 1}`"
          maxlength="20"
          @keydown.enter="focusNextInput(i)"
        >
        <button
          v-if="playerNames.length > 1 || botPlayers.size > 0"
          class="remove-btn"
          title="Remove player"
          @click="removePlayer(i)"
        >
          &times;
        </button>
      </div>

      <!-- Add player button -->
      <button
        v-if="playerNames.length + botPlayers.size < 4"
        class="add-player-btn"
        @click="addPlayer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Player
      </button>
    </div>

    <!-- Add Bot section -->
    <div v-if="totalPlayerCount < 4" class="w-full flex flex-col items-center gap-sm">
      <span class="text-[0.8rem] font-bold text-fg-muted uppercase tracking-wide">Add a Bot</span>
      <div class="flex gap-xs flex-wrap justify-center">
        <button
          v-for="diff in (['easy', 'medium', 'hard', 'pro'] as const)"
          :key="diff"
          class="bot-diff-btn"
          @click="addBot(diff)"
        >
          <svg class="inline-block w-[14px] h-[14px] mr-[4px] opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="8.5" cy="16" r="1.5" /><circle cx="15.5" cy="16" r="1.5" /><path d="M12 2v5M7 7h10" /></svg>
          {{ diff.charAt(0).toUpperCase() + diff.slice(1) }}
        </button>
      </div>
    </div>

    <!-- Bot chips -->
    <div v-if="botPlayers.size > 0" class="w-full flex flex-wrap gap-xs justify-center">
      <span
        v-for="[name] in botPlayers"
        :key="name"
        class="bot-chip"
      >
        <svg class="inline-block w-[14px] h-[14px] mr-[3px] opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="8.5" cy="16" r="1.5" /><circle cx="15.5" cy="16" r="1.5" /><path d="M12 2v5M7 7h10" /></svg>
        {{ name }}
        <button class="bot-chip-remove" @click="removeBot(name)">&times;</button>
      </span>
    </div>

    <!-- Settings toggle -->
    <button class="settings-toggle" @click="showSettings = !showSettings">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
      {{ showSettings ? 'Hide Settings' : 'Game Settings' }}
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        class="transition-transform" :class="{ 'rotate-180': showSettings }"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <!-- Game settings (collapsible) -->
    <Transition name="settings">
      <div v-if="showSettings" class="w-full">
        <GameSettingsPanel
          v-model:game-mode="gameMode"
          v-model:checkout="checkout"
          v-model:legs-to-win="legsToWin"
          v-model:sets-to-win="setsToWin"
        />
      </div>
    </Transition>

    <!-- Start button -->
    <button
      class="start-btn"
      :disabled="!canStart"
      @click="startGame"
    >
      Start Game
      <span v-if="!showSettings" class="start-hint">{{ gameMode }} &middot; {{ checkout === 'double_out' ? 'Double Out' : 'Single Out' }} &middot; {{ legsToWin }} {{ legsToWin === 1 ? 'Leg' : 'Legs' }}</span>
    </button>

    <!-- Abandon confirm modal -->
    <Teleport to="body">
      <div v-if="showAbandonConfirm" class="modal-overlay" @click.self="showAbandonConfirm = false">
        <div class="glass-card-heavy w-full max-w-[380px] p-2xl flex flex-col gap-lg">
          <h3 class="text-[1.1rem] font-bold text-fg">
            Abandon Current Game?
          </h3>
          <p class="text-fg-secondary text-[0.9rem] leading-relaxed">
            Starting a new game will end your current game in progress.
          </p>
          <div class="flex gap-md justify-end">
            <button class="btn btn-secondary" @click="showAbandonConfirm = false">
              Cancel
            </button>
            <button class="btn btn-danger" @click="doStartGame">
              Start New Game
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ── Back link ─────────────────────────────────────────────── */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: color var(--duration-fast);
}

.back-link:hover {
  color: var(--text-primary);
}

/* ── Player name inputs ──────────────────────────────────────── */
.player-name-input {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 1rem;
  font-weight: 600;
  outline: none;
  transition: border-color var(--duration-fast);
}

.player-name-input::placeholder {
  color: var(--text-muted);
  font-weight: 400;
}

.player-name-input:focus {
  border-color: var(--gold);
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all var(--duration-fast);
  shrink: 0;
}

.remove-btn:hover {
  color: var(--red);
  border-color: var(--red);
  background: rgba(239, 68, 68, 0.1);
}

.add-player-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.add-player-btn:hover {
  border-color: var(--gold);
  color: var(--gold);
}

/* ── Settings toggle ──────────────────────────────────────── */
.settings-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.settings-toggle:hover {
  border-color: var(--border-default);
  color: var(--text-secondary);
}

/* ── Settings transition ──────────────────────────────────── */
.settings-enter-active {
  transition: all var(--duration-normal) var(--ease-out);
}

.settings-leave-active {
  transition: all var(--duration-fast) var(--ease-out);
}

.settings-enter-from,
.settings-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ── Start button ──────────────────────────────────────────── */
.start-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--gold-gradient);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-size: 1.05rem;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out),
    opacity var(--duration-fast);
  box-shadow: var(--shadow-glow-gold);
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow-gold), 0 8px 30px rgba(255, 215, 0, 0.2);
}

.start-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.start-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.start-hint {
  font-size: 0.7rem;
  font-weight: 500;
  opacity: 0.8;
}

/* ── Bot difficulty buttons ─────────────────────────────────── */
.bot-diff-btn {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color var(--duration-fast), background var(--duration-fast);
}

.bot-diff-btn:hover {
  border-color: var(--border-gold);
  background: rgba(255, 215, 0, 0.06);
  color: var(--gold);
}

.bot-diff-btn:active {
  transform: scale(0.96);
}

/* ── Bot chips ──────────────────────────────────────────────── */
.bot-chip {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: rgba(255, 215, 0, 0.08);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: var(--radius-md);
  color: var(--gold);
  font-size: 0.8rem;
  font-weight: 600;
}

.bot-chip-remove {
  margin-left: var(--spacing-xs);
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  cursor: pointer;
  line-height: 1;
  padding: 0 2px;
}

.bot-chip-remove:hover {
  color: var(--red);
}

/* ── Modal overlay ───────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--spacing-lg);
}
</style>
