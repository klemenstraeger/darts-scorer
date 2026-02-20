<script setup lang="ts">
import type { BotDifficulty, CheckoutMode, PlayerDescriptor } from '~/types/game'

const { newGame, hasActiveGame, hasGame } = useGameState()

// ── Wizard state ──────────────────────────────────────────────────────
const step = ref(1)

// ── Game settings ─────────────────────────────────────────────────────
const selectedPlayers = ref<string[]>([])
const botPlayers = ref<Map<string, BotDifficulty>>(new Map())
const gameMode = ref<'501' | '301'>('501')
const checkout = ref<CheckoutMode>('double_out')
const legsToWin = ref(1)
const setsToWin = ref(1)
const showAbandonConfirm = ref(false)
const pendingAction = ref<'start' | 'quick' | null>(null)

const humanPlayerCount = computed(() =>
  selectedPlayers.value.filter(n => !botPlayers.value.has(n)).length,
)

const canAdvanceStep1 = computed(() => {
  const total = selectedPlayers.value.length
  const humans = humanPlayerCount.value
  return total >= 2 && humans >= 1
})

let botCounter = 0

function addBot(difficulty: BotDifficulty) {
  if (selectedPlayers.value.length >= 4)
    return
  botCounter++
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
  const name = `Bot ${label}${botCounter > 1 ? ` #${botCounter}` : ''}`
  selectedPlayers.value.push(name)
  botPlayers.value.set(name, difficulty)
}

function removeBot(name: string) {
  selectedPlayers.value = selectedPlayers.value.filter(n => n !== name)
  botPlayers.value.delete(name)
}

const humanSelection = computed({
  get: () => selectedPlayers.value.filter(n => !botPlayers.value.has(n)),
  set: (humanNames: string[]) => {
    const botNames = selectedPlayers.value.filter(n => botPlayers.value.has(n))
    selectedPlayers.value = [...humanNames, ...botNames]
  },
})

function buildDescriptors(): PlayerDescriptor[] {
  return selectedPlayers.value.map((name) => {
    const botDiff = botPlayers.value.get(name)
    if (botDiff) {
      return { name, isBot: true, botDifficulty: botDiff }
    }
    return { name }
  })
}

function quickStart() {
  if (hasActiveGame.value || hasGame.value) {
    pendingAction.value = 'quick'
    showAbandonConfirm.value = true
    return
  }
  doQuickStart()
}

function doQuickStart() {
  showAbandonConfirm.value = false
  newGame('501', buildDescriptors(), {
    checkout: 'double_out',
    legs_to_win: 1,
    sets_to_win: 1,
  })
  navigateTo('/game')
}

function startGame() {
  if (hasActiveGame.value || hasGame.value) {
    pendingAction.value = 'start'
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

function confirmAbandon() {
  if (pendingAction.value === 'quick')
    doQuickStart()
  else doStartGame()
}
</script>

<template>
  <AuthGate feature="New Game" description="Sign in to set up games with your saved players, avatars, and Elo ratings.">
    <div class="flex flex-col items-center gap-xl px-lg py-xl max-w-[600px] mx-auto w-full max-sm:px-md">
      <!-- Back link -->
      <div class="w-full">
        <BackLink to="/dashboard" label="Back to Home" />
      </div>

      <!-- Title -->
      <div class="text-center">
        <h1 class="text-[1.8rem] font-black text-fg max-sm:text-[1.5rem]">
          New Game
        </h1>
        <p class="text-fg-muted text-[0.85rem] mt-xs">
          Set up a custom match
        </p>
      </div>

      <!-- Wizard -->
      <WizardShell
        v-model:current-step="step"
        :total-steps="3"
        :can-advance="step === 1 ? canAdvanceStep1 : true"
        finish-label="Start Game"
        @finish="startGame"
      >
        <!-- Step 1: Select Players -->
        <div v-if="step === 1" key="step-players" class="flex flex-col items-center gap-xl w-full">
          <h3 class="text-[1.3rem] font-extrabold text-fg text-center">
            Select Players
          </h3>
          <p class="text-[0.85rem] text-fg-muted text-center -mt-md">
            Tap to select. Order = throw order.
          </p>

          <PlayerPicker
            v-model="humanSelection"
            :min="1"
            :max="4 - botPlayers.size"
          />

          <!-- Add Bot section -->
          <div v-if="selectedPlayers.length < 4" class="w-full flex flex-col items-center gap-sm">
            <span class="text-[0.8rem] font-bold text-fg-muted uppercase tracking-wide">Add a Bot</span>
            <div class="flex gap-xs flex-wrap justify-center">
              <button
                v-for="diff in (['easy', 'medium', 'hard', 'pro'] as const)"
                :key="diff"
                class="inline-flex items-center py-xs px-md bg-surface-1 border-2 border-black rounded-lg text-fg-secondary text-[0.85rem] font-semibold cursor-pointer shadow-sm transition-all duration-100 hover:bg-yellow-light hover:text-yellow hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-md active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
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
              class="inline-flex items-center py-xs px-sm bg-yellow-light border-2 border-black rounded-lg text-yellow text-[0.8rem] font-semibold"
            >
              <svg class="inline-block w-[14px] h-[14px] mr-[3px] opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="8.5" cy="16" r="1.5" /><circle cx="15.5" cy="16" r="1.5" /><path d="M12 2v5M7 7h10" /></svg>
              {{ name }}
              <button class="ml-xs bg-transparent border-0 text-fg-muted text-base cursor-pointer leading-none px-[2px] hover:text-red" @click="removeBot(name)">&times;</button>
            </span>
          </div>

          <!-- Quick Start -->
          <button
            v-if="canAdvanceStep1"
            class="flex flex-col items-center gap-[2px] w-full py-md px-xl bg-yellow text-fg-inverse border-[3px] border-black rounded-lg text-[1.05rem] font-extrabold cursor-pointer shadow-lg transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-xl active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            @click="quickStart"
          >
            Quick Start
            <span class="text-[0.7rem] font-medium opacity-80">501 &middot; Double Out &middot; 1 Leg</span>
          </button>
        </div>

        <!-- Step 2: Game Settings -->
        <div v-else-if="step === 2" key="step-settings" class="flex flex-col items-center gap-xl w-full">
          <h3 class="text-[1.3rem] font-extrabold text-fg text-center">
            Game Settings
          </h3>
          <p class="text-[0.85rem] text-fg-muted text-center -mt-md">
            Customize or just tap Next for defaults.
          </p>

          <GameSettingsPanel
            v-model:game-mode="gameMode"
            v-model:checkout="checkout"
            v-model:legs-to-win="legsToWin"
            v-model:sets-to-win="setsToWin"
          />
        </div>

        <!-- Step 3: Review & Start -->
        <div v-else key="step-review" class="flex flex-col items-center gap-xl w-full">
          <h3 class="text-[1.3rem] font-extrabold text-fg text-center">
            Ready to Play
          </h3>
          <p class="text-[0.85rem] text-fg-muted text-center -mt-md">
            Review your game setup.
          </p>

          <GameSummary
            :players="selectedPlayers"
            :game-mode="gameMode"
            :checkout="checkout"
            :legs-to-win="legsToWin"
            :sets-to-win="setsToWin"
          />
        </div>
      </WizardShell>

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
              <Button variant="destructive" @click="confirmAbandon">
                Start New Game
              </Button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </AuthGate>
</template>
