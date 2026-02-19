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
  <div class="flex flex-col items-center gap-xl px-lg py-xl max-w-[600px] mx-auto w-full max-sm:px-md">
    <!-- Back link -->
    <div class="w-full">
      <NuxtLink to="/dashboard" class="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Home
      </NuxtLink>
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
      <div v-if="step === 1" key="step-players" class="wizard-step">
        <h3 class="step-title">
          Select Players
        </h3>
        <p class="step-subtitle">
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

        <!-- Quick Start -->
        <button
          v-if="canAdvanceStep1"
          class="quick-start-btn"
          @click="quickStart"
        >
          Quick Start
          <span class="quick-hint">501 &middot; Double Out &middot; 1 Leg</span>
        </button>
      </div>

      <!-- Step 2: Game Settings -->
      <div v-else-if="step === 2" key="step-settings" class="wizard-step">
        <h3 class="step-title">
          Game Settings
        </h3>
        <p class="step-subtitle">
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
      <div v-else key="step-review" class="wizard-step">
        <h3 class="step-title">
          Ready to Play
        </h3>
        <p class="step-subtitle">
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
            <button class="btn btn-danger" @click="confirmAbandon">
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

/* ── Wizard step layout ──────────────────────────────────────── */
.wizard-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xl);
  width: 100%;
}

.step-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-primary);
  text-align: center;
}

.step-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
  margin-top: calc(-1 * var(--spacing-md));
}

/* ── Quick Start button ──────────────────────────────────────── */
.quick-start-btn {
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
    box-shadow var(--duration-normal) var(--ease-out);
  box-shadow: var(--shadow-glow-gold);
}

.quick-start-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow-gold), 0 8px 30px rgba(255, 215, 0, 0.2);
}

.quick-start-btn:active {
  transform: scale(0.97);
}

.quick-hint {
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
