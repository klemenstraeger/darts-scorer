<script setup lang="ts">
import type { CheckoutMode, BotDifficulty, PlayerDescriptor } from '~/types/game'

const { newGame, hasActiveGame, checkActiveGame, hasGame } = useGameState()
const { shouldShowTour, startTour } = useOnboarding()

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
  // At least 1 human + 1 bot, or 2+ humans
  return total >= 2 && humans >= 1
})

let botCounter = 0
let tourTimeout: ReturnType<typeof setTimeout> | null = null

function addBot(difficulty: BotDifficulty) {
  if (selectedPlayers.value.length >= 4) return
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

// Human-only selection for PlayerPicker (bots are managed separately)
const humanSelection = computed({
  get: () => selectedPlayers.value.filter(n => !botPlayers.value.has(n)),
  set: (humanNames: string[]) => {
    // Rebuild selectedPlayers: humans first, then bots in their original order
    const botNames = selectedPlayers.value.filter(n => botPlayers.value.has(n))
    selectedPlayers.value = [...humanNames, ...botNames]
  },
})

function buildDescriptors(): PlayerDescriptor[] {
  return selectedPlayers.value.map(name => {
    const botDiff = botPlayers.value.get(name)
    if (botDiff) {
      return { name, isBot: true, botDifficulty: botDiff }
    }
    return { name }
  })
}

// Check for active game on mount
onMounted(() => {
  checkActiveGame()

  if (shouldShowTour('dashboard')) {
    tourTimeout = setTimeout(() => {
      const tourSteps = [
        {
          element: '[data-tour="player-picker"]',
          popover: {
            title: 'Select Players',
            description: 'Tap player cards to add them to the game. The selection order determines throw order.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '[data-tour="add-bot"]',
          popover: {
            title: 'Play vs AI Bots',
            description: 'Add AI opponents at different difficulty levels to practice or play solo.',
            side: 'top',
            align: 'center',
          },
        },
      ]

      // Only add quick-start step if the button is visible
      if (canAdvanceStep1.value) {
        tourSteps.push({
          element: '[data-tour="quick-start"]',
          popover: {
            title: 'Quick Start',
            description: 'Jump straight into a standard 501 Double Out game with one tap.',
            side: 'top',
            align: 'center',
          },
        })
      }

      tourSteps.push(
        {
          element: '[data-tour="wizard"]',
          popover: {
            title: 'Game Setup Wizard',
            description: 'Use Next to customize game mode, checkout rules, and match format before starting.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '[data-tour="nav"]',
          popover: {
            title: 'Navigation',
            description: 'Access Players management, Tournaments, and Statistics from the navigation bar.',
            side: 'bottom',
            align: 'center',
          },
        },
      )

      startTour(tourSteps, 'dashboard')
      tourTimeout = null
    }, 800)
  }
})

onBeforeUnmount(() => {
  if (tourTimeout !== null) {
    clearTimeout(tourTimeout)
    tourTimeout = null
  }
})

function resumeGame() {
  navigateTo('/game')
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
  if (pendingAction.value === 'quick') doQuickStart()
  else doStartGame()
}
</script>

<template>
  <div class="flex flex-col items-center gap-xl px-lg py-2xl max-w-[600px] mx-auto w-full max-sm:px-md max-sm:py-xl">
    <!-- Title -->
    <div
      class="text-center mb-sm"
      v-motion
      :initial="{ opacity: 0, y: -20 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 400, ease: 'easeOut' } }"
    >
      <h2 class="text-[2.5rem] font-black leading-tight max-sm:text-[2rem]">
        <span class="block text-fg">Darts</span>
        <span class="block text-gradient-gold">Scorer</span>
      </h2>
    </div>

    <!-- Resume game banner -->
    <div
      v-if="hasActiveGame || hasGame"
      class="glass-card w-full px-xl py-lg flex items-center justify-between border border-border-gold"
      v-motion
      :initial="{ opacity: 0, scale: 0.95 }"
      :enter="{ opacity: 1, scale: 1, transition: { duration: 300 } }"
    >
      <div class="flex items-center gap-md">
        <span class="game-pulse-large" />
        <div class="flex flex-col gap-[2px]">
          <span class="text-[0.9rem] font-bold text-fg">Game in progress</span>
          <span class="text-[0.75rem] text-fg-muted">Pick up where you left off</span>
        </div>
      </div>
      <button class="btn btn-gold" @click="resumeGame">Resume</button>
    </div>

    <!-- Wizard -->
    <WizardShell
      v-model:current-step="step"
      :total-steps="3"
      :can-advance="step === 1 ? canAdvanceStep1 : true"
      :finish-label="'Start Game'"
      data-tour="wizard"
      @finish="startGame"
    >
      <!-- Step 1: Select Players -->
      <div v-if="step === 1" key="step-players" class="wizard-step">
        <h3 class="step-title">Select Players</h3>
        <p class="step-subtitle">Tap to select. Order = throw order.</p>

        <PlayerPicker
          v-model="humanSelection"
          :min="1"
          :max="4 - botPlayers.size"
          data-tour="player-picker"
        />

        <!-- Add Bot section -->
        <div v-if="selectedPlayers.length < 4" class="w-full flex flex-col items-center gap-sm" data-tour="add-bot">
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
            v-for="[name, diff] in botPlayers"
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
          data-tour="quick-start"
          @click="quickStart"
        >
          Quick Start
          <span class="quick-hint">501 &middot; Double Out &middot; 1 Leg</span>
        </button>
      </div>

      <!-- Step 2: Game Settings -->
      <div v-else-if="step === 2" key="step-settings" class="wizard-step">
        <h3 class="step-title">Game Settings</h3>
        <p class="step-subtitle">Customize or just tap Next for defaults.</p>

        <GameSettingsPanel
          v-model:game-mode="gameMode"
          v-model:checkout="checkout"
          v-model:legs-to-win="legsToWin"
          v-model:sets-to-win="setsToWin"
        />
      </div>

      <!-- Step 3: Review & Start -->
      <div v-else key="step-review" class="wizard-step">
        <h3 class="step-title">Ready to Play</h3>
        <p class="step-subtitle">Review your game setup.</p>

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
          <h3 class="text-[1.1rem] font-bold text-fg">Abandon Current Game?</h3>
          <p class="text-fg-secondary text-[0.9rem] leading-relaxed">Starting a new game will end your current game in progress.</p>
          <div class="flex gap-md justify-end">
            <button class="btn btn-secondary" @click="showAbandonConfirm = false">Cancel</button>
            <button class="btn btn-danger" @click="confirmAbandon">Start New Game</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
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

/* ── Resume pulse ────────────────────────────────────────────── */
.game-pulse-large {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--green);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
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
