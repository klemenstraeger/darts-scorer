<script setup lang="ts">
const { newGame } = useGameState()
const { getLastGameSettings } = useSettings()

onMounted(() => {
  const settings = getLastGameSettings()

  if (!settings || settings.players.length < 2) {
    navigateTo('/')
    return
  }

  newGame(settings.mode, settings.players, {
    checkout: settings.checkout,
    legs_to_win: settings.legs_to_win,
    sets_to_win: settings.sets_to_win,
  })
  navigateTo('/game')
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="flex flex-col items-center gap-md">
      <svg
        class="animate-spin h-8 w-8 text-fg-muted"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span class="text-fg-muted text-sm">Starting game...</span>
    </div>
  </div>
</template>
