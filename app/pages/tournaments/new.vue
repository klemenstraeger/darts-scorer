<script setup lang="ts">
import type { CheckoutMode } from '~/types/game'
import type { TournamentFormat } from '~/types/tournament'

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

const formats: { value: TournamentFormat, label: string }[] = [
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
  }
  catch (e: any) {
    error.value = e.data?.message || 'Failed to create tournament'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthGate feature="Tournaments" description="Sign in to create and manage tournaments.">
    <div class="flex flex-col items-center gap-xl px-lg py-2xl max-w-[600px] mx-auto w-full max-sm:px-md max-sm:py-xl">
      <div class="text-center">
        <h2 class="text-[2rem] font-black text-fg max-sm:text-[1.5rem]">
          New Tournament
        </h2>
      </div>

      <WizardShell
        v-model:current-step="step"
        :total-steps="4"
        :can-advance="canAdvance"
        finish-label="Create Tournament"
        :loading="submitting"
        @finish="createTournament"
      >
        <!-- Step 1: Tournament Info -->
        <div v-if="step === 1" key="step-info" class="flex flex-col items-center gap-xl w-full">
          <h3 class="text-[1.3rem] font-extrabold text-fg text-center">
            Tournament Info
          </h3>
          <p class="text-[0.85rem] text-fg-muted text-center -mt-md">
            Give your tournament a name and pick a format.
          </p>

          <!-- Name -->
          <div class="bg-surface-1 border-2 border-black rounded-lg shadow-md w-full p-lg flex flex-col gap-md">
            <span class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-widest">Tournament Name</span>
            <input
              v-model="name"
              class="w-full px-md py-sm bg-surface-1 border-2 border-black rounded-md text-fg font-semibold text-base outline-none transition-colors duration-fast focus:border-[var(--yellow)] placeholder:text-fg-muted placeholder:font-normal"
              type="text"
              placeholder="Friday Night Darts"
              maxlength="50"
            >
          </div>

          <!-- Format -->
          <div class="bg-surface-1 border-2 border-black rounded-lg shadow-md w-full p-lg flex flex-col items-center gap-md">
            <span class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-widest">Format</span>
            <ModeToggle
              :model-value="format"
              :options="formats"
              @update:model-value="format = $event as TournamentFormat"
            />
          </div>

          <!-- Participant Type -->
          <div class="bg-surface-1 border-2 border-black rounded-lg shadow-md w-full p-lg flex flex-col items-center gap-md">
            <span class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-widest">Participants</span>
            <ModeToggle
              :model-value="participantType"
              :options="[
                { value: 'individual', label: 'Individual' },
                { value: 'team', label: 'Teams (Doubles)' },
              ]"
              @update:model-value="participantType = $event as 'individual' | 'team'; selectedPlayers = []"
            />
          </div>
        </div>

        <!-- Step 2: Select Players / Teams -->
        <div v-else-if="step === 2" key="step-players" class="flex flex-col items-center gap-xl w-full">
          <h3 class="text-[1.3rem] font-extrabold text-fg text-center">
            {{ isTeamMode ? 'Select Teams' : 'Select Players' }}
          </h3>
          <p class="text-[0.85rem] text-fg-muted text-center -mt-md">
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
        <div v-else-if="step === 3" key="step-settings" class="flex flex-col items-center gap-xl w-full">
          <h3 class="text-[1.3rem] font-extrabold text-fg text-center">
            Match Settings
          </h3>
          <p class="text-[0.85rem] text-fg-muted text-center -mt-md">
            How should each match be played?
          </p>

          <GameSettingsPanel
            v-model:game-mode="gameMode"
            v-model:checkout="checkout"
            v-model:legs-to-win="legsToWin"
            v-model:sets-to-win="setsToWin"
          >
            <!-- Group-specific settings slotted into the panel -->
            <template v-if="isGroupFormat">
              <div class="bg-surface-1 border-2 border-black rounded-lg shadow-md w-full p-lg flex flex-col items-center gap-md">
                <span class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-widest">Number of Groups</span>
                <ModeToggle
                  :model-value="groupCount"
                  :options="groupOptions.map(o => ({ value: o, label: String(o) }))"
                  @update:model-value="groupCount = Number($event)"
                />
              </div>

              <div v-if="format === 'group_knockout'" class="bg-surface-1 border-2 border-black rounded-lg shadow-md w-full p-lg flex flex-col items-center gap-md">
                <span class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-widest">Advance per Group</span>
                <ModeToggle
                  :model-value="advancePerGroup"
                  :options="advanceOptions.map(o => ({ value: o, label: String(o) }))"
                  @update:model-value="advancePerGroup = Number($event)"
                />
              </div>
            </template>
          </GameSettingsPanel>
        </div>

        <!-- Step 4: Review & Create -->
        <div v-else key="step-review" class="flex flex-col items-center gap-xl w-full">
          <h3 class="text-[1.3rem] font-extrabold text-fg text-center">
            Review Tournament
          </h3>
          <p class="text-[0.85rem] text-fg-muted text-center -mt-md">
            Everything look good?
          </p>

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

          <div v-if="error" class="text-red text-[0.85rem] font-semibold text-center">
            {{ error }}
          </div>
        </div>
      </WizardShell>
    </div>
  </AuthGate>
</template>
