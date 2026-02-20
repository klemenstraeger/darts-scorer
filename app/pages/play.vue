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

function nextBotName(difficulty: BotDifficulty): string {
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
  const base = `Bot ${label}`
  if (!botPlayers.value.has(base))
    return base
  for (let i = 2; ; i++) {
    const name = `${base} #${i}`
    if (!botPlayers.value.has(name))
      return name
  }
}

function addBot(difficulty: BotDifficulty) {
  if (totalPlayerCount.value >= 4)
    return
  botPlayers.value.set(nextBotName(difficulty), difficulty)
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
      <BackLink to="/" label="Back" />
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
          class="player-name-input flex-1 px-md py-sm bg-surface-1 border-2 border-black rounded-md text-fg font-semibold text-base outline-none transition-all duration-fast focus:border-[var(--yellow)] focus:shadow-sm placeholder:text-fg-muted placeholder:font-normal"
          type="text"
          :placeholder="`Player ${i + 1}`"
          maxlength="20"
          @keydown.enter="focusNextInput(i)"
        >
        <button
          v-if="playerNames.length > 1 || botPlayers.size > 0"
          class="flex items-center justify-center w-8 h-8 bg-transparent border-2 border-black rounded-sm text-fg-muted text-[1.2rem] cursor-pointer transition-all duration-fast shrink-0 hover:text-[var(--red)] hover:border-[var(--red)] hover:bg-[var(--red-tint)]"
          title="Remove player"
          @click="removePlayer(i)"
        >
          &times;
        </button>
      </div>

      <!-- Add player button -->
      <button
        v-if="playerNames.length + botPlayers.size < 4"
        class="flex items-center justify-center gap-xs px-md py-sm bg-transparent border-2 border-dashed border-black rounded-md text-fg-muted text-[0.85rem] font-semibold cursor-pointer transition-all duration-fast hover:border-[var(--yellow)] hover:text-[var(--yellow)]"
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
          class="inline-flex items-center px-md py-xs bg-surface-1 border-2 border-black rounded-md text-fg-secondary text-[0.85rem] font-semibold cursor-pointer shadow-sm transition-all duration-fast hover:bg-[var(--yellow-light)] hover:text-[var(--yellow)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-md active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
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
        class="inline-flex items-center px-sm py-xs bg-[var(--yellow-light)] border-2 border-black rounded-md text-[var(--yellow)] text-[0.8rem] font-semibold"
      >
        <svg class="inline-block w-[14px] h-[14px] mr-[3px] opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="8.5" cy="16" r="1.5" /><circle cx="15.5" cy="16" r="1.5" /><path d="M12 2v5M7 7h10" /></svg>
        {{ name }}
        <button class="ml-xs bg-transparent border-none text-fg-muted text-base cursor-pointer leading-none p-0 px-[2px] hover:text-[var(--red)]" @click="removeBot(name)">&times;</button>
      </span>
    </div>

    <!-- Settings toggle -->
    <button
      class="flex items-center gap-sm px-md py-sm bg-surface-1 border-2 border-black rounded-md text-fg-muted text-[0.85rem] font-semibold cursor-pointer transition-all duration-fast hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-sm hover:text-fg-secondary"
      @click="showSettings = !showSettings"
    >
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
      class="flex flex-col items-center gap-[2px] w-full px-xl py-md bg-[var(--yellow)] text-black border-[3px] border-black rounded-lg font-extrabold text-[1.05rem] cursor-pointer shadow-lg transition-all duration-fast hover:not-disabled:-translate-x-0.5 hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-xl active:not-disabled:translate-x-0.5 active:not-disabled:translate-y-0.5 active:not-disabled:shadow-none disabled:opacity-40 disabled:cursor-not-allowed"
      :disabled="!canStart"
      @click="startGame"
    >
      Start Game
      <span v-if="!showSettings" class="text-[0.7rem] font-medium opacity-80">{{ gameMode }} &middot; {{ checkout === 'double_out' ? 'Double Out' : 'Single Out' }} &middot; {{ legsToWin }} {{ legsToWin === 1 ? 'Leg' : 'Legs' }}</span>
    </button>

    <!-- Abandon confirm modal -->
    <Teleport to="body">
      <div v-if="showAbandonConfirm" class="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-lg" @click.self="showAbandonConfirm = false">
        <div class="bg-surface-1 border-[3px] border-black rounded-lg shadow-lg w-full max-w-[380px] p-2xl flex flex-col gap-lg">
          <h3 class="text-[1.1rem] font-bold text-fg">
            Abandon Current Game?
          </h3>
          <p class="text-fg-secondary text-[0.9rem] leading-relaxed">
            Starting a new game will end your current game in progress.
          </p>
          <div class="flex gap-md justify-end">
            <Button variant="secondary" @click="showAbandonConfirm = false">
              Cancel
            </Button>
            <Button variant="destructive" @click="doStartGame">
              Start New Game
            </Button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
