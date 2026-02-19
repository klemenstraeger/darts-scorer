<script setup lang="ts">
import type { TournamentFormat } from '~/types/tournament'
import type { CheckoutMode } from '~/types/game'

// ── Wizard state ──────────────────────────────────────────────────────
const step = ref(1)

// ── Tournament config ─────────────────────────────────────────────────
const name = ref('')
const format = ref<TournamentFormat>('knockout')
const participantType = ref<'individual' | 'team'>('individual')
const selectedPlayers = ref<string[]>([])
const gameMode = ref<'501' | '301'>('501')
const checkout = ref<CheckoutMode>('double_out')
const legsToWin = ref(1)
const setsToWin = ref(1)
const groupCount = ref(2)
const advancePerGroup = ref(2)
const submitting = ref(false)
const error = ref('')

const isTeamMode = computed(() => participantType.value === 'team')

const formats: { value: TournamentFormat; label: string }[] = [
  { value: 'knockout', label: 'Knockout' },
  { value: 'league', label: 'League' },
  { value: 'group_only', label: 'Groups' },
  { value: 'group_knockout', label: 'Groups + KO' },
]
const formatIndex = computed(() => formats.findIndex(f => f.value === format.value))

const groupOptions = [2, 3, 4]
const advanceOptions = [1, 2, 3]

const isGroupFormat = computed(() => format.value === 'group_only' || format.value === 'group_knockout')
const minPlayers = computed(() => isGroupFormat.value ? groupCount.value * 2 : 2)

// ── Step validation ───────────────────────────────────────────────────
const canAdvance = computed(() => {
  switch (step.value) {
    case 1: return name.value.trim().length > 0
    case 2: return selectedPlayers.value.length >= minPlayers.value
    case 3: return true
    case 4: return true
    default: return false
  }
})

async function createTournament() {
  error.value = ''

  if (!name.value.trim()) {
    error.value = 'Tournament name is required'
    return
  }

  const playerNames = selectedPlayers.value

  // Check for duplicates
  const unique = new Set(playerNames)
  if (unique.size < playerNames.length) {
    error.value = 'Player names must be unique'
    return
  }

  if (playerNames.length < minPlayers.value) {
    error.value = `Need at least ${minPlayers.value} players for this format`
    return
  }

  submitting.value = true
  try {
    const result = await $fetch<{ id: number }>('/api/tournament/new', {
      method: 'POST',
      body: {
        name: name.value.trim(),
        format: format.value,
        playerNames,
        gameMode: gameMode.value,
        checkout: checkout.value,
        legsToWin: legsToWin.value,
        setsToWin: setsToWin.value,
        ...(isGroupFormat.value && {
          groupCount: groupCount.value,
          advancePerGroup: advancePerGroup.value,
        }),
        ...(isTeamMode.value && {
          teamMode: 'doubles' as const,
        }),
      },
    })
    navigateTo(`/tournaments/${result.id}`)
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to create tournament'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-xl px-lg py-2xl max-w-[600px] mx-auto w-full max-sm:px-md max-sm:py-xl">
    <div class="text-center">
      <h2 class="text-[2rem] font-black text-fg max-sm:text-[1.5rem]">New Tournament</h2>
    </div>

    <WizardShell
      v-model:current-step="step"
      :total-steps="4"
      :can-advance="canAdvance"
      :finish-label="'Create Tournament'"
      :loading="submitting"
      @finish="createTournament"
    >
      <!-- Step 1: Tournament Info -->
      <div v-if="step === 1" key="step-info" class="wizard-step">
        <h3 class="step-title">Tournament Info</h3>
        <p class="step-subtitle">Give your tournament a name and pick a format.</p>

        <!-- Name -->
        <div class="glass-card w-full p-lg flex flex-col gap-md">
          <span class="settings-label">Tournament Name</span>
          <input
            v-model="name"
            class="name-input"
            type="text"
            placeholder="Friday Night Darts"
            maxlength="50"
          />
        </div>

        <!-- Format -->
        <div class="glass-card w-full p-lg flex flex-col items-center gap-md">
          <span class="settings-label">Format</span>
          <div class="mode-toggle multi format-toggle">
            <button
              v-for="f in formats"
              :key="f.value"
              class="mode-option"
              :class="{ active: format === f.value }"
              @click="format = f.value"
            >
              {{ f.label }}
            </button>
            <div
              class="mode-pill"
              :style="{
                width: `calc(${100 / formats.length}% - 2px)`,
                transform: `translateX(${formatIndex * 100}%)`
              }"
            />
          </div>
        </div>

        <!-- Participant Type -->
        <div class="glass-card w-full p-lg flex flex-col items-center gap-md">
          <span class="settings-label">Participants</span>
          <div class="mode-toggle">
            <button
              class="mode-option"
              :class="{ active: participantType === 'individual' }"
              @click="participantType = 'individual'; selectedPlayers = []"
            >
              Individual
            </button>
            <button
              class="mode-option"
              :class="{ active: participantType === 'team' }"
              @click="participantType = 'team'; selectedPlayers = []"
            >
              Teams (Doubles)
            </button>
            <div
              class="mode-pill"
              :style="{ transform: `translateX(${participantType === 'team' ? 100 : 0}%)` }"
            />
          </div>
        </div>
      </div>

      <!-- Step 2: Select Players / Teams -->
      <div v-else-if="step === 2" key="step-players" class="wizard-step">
        <h3 class="step-title">{{ isTeamMode ? 'Select Teams' : 'Select Players' }}</h3>
        <p class="step-subtitle">
          Pick at least {{ minPlayers }} {{ isTeamMode ? 'teams' : 'players' }} for this format.
        </p>

        <TeamPicker
          v-if="isTeamMode"
          v-model="selectedPlayers"
          :min="minPlayers"
          :max="16"
        />
        <PlayerPicker
          v-else
          v-model="selectedPlayers"
          :min="minPlayers"
          :max="16"
        />
      </div>

      <!-- Step 3: Match Settings -->
      <div v-else-if="step === 3" key="step-settings" class="wizard-step">
        <h3 class="step-title">Match Settings</h3>
        <p class="step-subtitle">How should each match be played?</p>

        <GameSettingsPanel
          v-model:game-mode="gameMode"
          v-model:checkout="checkout"
          v-model:legs-to-win="legsToWin"
          v-model:sets-to-win="setsToWin"
        >
          <!-- Group-specific settings slotted into the panel -->
          <template v-if="isGroupFormat">
            <div class="glass-card w-full p-lg flex flex-col items-center gap-md">
              <span class="settings-label">Number of Groups</span>
              <div class="mode-toggle multi">
                <button
                  v-for="opt in groupOptions"
                  :key="opt"
                  class="mode-option"
                  :class="{ active: groupCount === opt }"
                  @click="groupCount = opt"
                >{{ opt }}</button>
                <div class="mode-pill" :style="{ width: `calc(${100 / groupOptions.length}% - 2px)`, transform: `translateX(${groupOptions.indexOf(groupCount) * 100}%)` }" />
              </div>
            </div>

            <div v-if="format === 'group_knockout'" class="glass-card w-full p-lg flex flex-col items-center gap-md">
              <span class="settings-label">Advance per Group</span>
              <div class="mode-toggle multi">
                <button
                  v-for="opt in advanceOptions"
                  :key="opt"
                  class="mode-option"
                  :class="{ active: advancePerGroup === opt }"
                  @click="advancePerGroup = opt"
                >{{ opt }}</button>
                <div class="mode-pill" :style="{ width: `calc(${100 / advanceOptions.length}% - 2px)`, transform: `translateX(${advanceOptions.indexOf(advancePerGroup) * 100}%)` }" />
              </div>
            </div>
          </template>
        </GameSettingsPanel>
      </div>

      <!-- Step 4: Review & Create -->
      <div v-else key="step-review" class="wizard-step">
        <h3 class="step-title">Review Tournament</h3>
        <p class="step-subtitle">Everything look good?</p>

        <TournamentSummary
          :name="name"
          :format="format"
          :players="selectedPlayers"
          :game-mode="gameMode"
          :checkout="checkout"
          :legs-to-win="legsToWin"
          :sets-to-win="setsToWin"
          :group-count="isGroupFormat ? groupCount : undefined"
          :advance-per-group="format === 'group_knockout' ? advancePerGroup : undefined"
          :team-mode="isTeamMode ? 'doubles' : undefined"
        />

        <div v-if="error" class="text-red text-[0.85rem] font-semibold text-center">{{ error }}</div>
      </div>
    </WizardShell>
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

.settings-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* ── Name input ──────────────────────────────────────────────── */
.name-input {
  width: 100%;
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

.name-input:focus {
  border-color: var(--border-gold);
}

.name-input::placeholder {
  color: var(--text-muted);
  font-weight: 400;
}

/* ── Mode toggle (for format + group settings) ───────────────── */
.mode-toggle {
  position: relative;
  display: flex;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.mode-option {
  position: relative;
  z-index: 1;
  padding: var(--spacing-sm) var(--spacing-2xl);
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: color var(--duration-normal) var(--ease-out);
}

.mode-option.active {
  color: var(--text-inverse);
}

.mode-pill {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(50% - 2px);
  height: calc(100% - 4px);
  background: var(--gold-gradient);
  border-radius: calc(var(--radius-md) - 2px);
  transition: transform var(--duration-normal) var(--ease-spring);
}

.mode-toggle.multi .mode-option {
  padding: var(--spacing-sm) var(--spacing-lg);
}

.format-toggle .mode-option {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 0.85rem;
}

@media (max-width: 600px) {
  .mode-option {
    padding: var(--spacing-sm) var(--spacing-xl);
    font-size: 1rem;
  }
  .format-toggle .mode-option {
    padding: var(--spacing-sm) var(--spacing-sm);
    font-size: 0.75rem;
  }
}
</style>
