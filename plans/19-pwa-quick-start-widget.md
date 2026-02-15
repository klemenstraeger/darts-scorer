# Feature 19 — PWA Quick-Start Widget

**Priority:** 13 (Low-Medium) | **Effort:** Small | **Impact:** Low-Medium
**Depends on:** Nothing

---

## Summary

Leverage the app's existing PWA capabilities to add **home screen shortcuts** for instant game start with saved settings. Users can tap a shortcut icon to immediately jump into a 501 game with their last-used players and settings.

---

## PWA Shortcuts

### `nuxt.config.ts` — Manifest shortcuts

```ts
pwa: {
  manifest: {
    // ... existing config ...
    shortcuts: [
      {
        name: 'Quick Game',
        short_name: 'Quick',
        description: 'Start a 501 game with your last settings',
        url: '/quick-start',
        icons: [{ src: '/icons/quick-game-96.png', sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'Practice',
        short_name: 'Practice',
        description: 'Start a practice session',
        url: '/practice',
        icons: [{ src: '/icons/practice-96.png', sizes: '96x96', type: 'image/png' }],
      },
    ],
  },
}
```

**How shortcuts work:**
- On Android: Long-press the app icon → shows shortcuts in context menu
- On desktop (Chrome): Right-click app icon in taskbar → shows shortcuts
- On iOS: Not supported (iOS doesn't support PWA shortcuts)

---

## Quick-Start Page

### `app/pages/quick-start.vue` (NEW)

Auto-start a game with last-used settings, then redirect to `/game`:

```vue
<script setup lang="ts">
const { newGame } = useGameState()
const { settings } = useSettings()

onMounted(() => {
  const lastSettings = settings.value.lastGameSettings

  if (lastSettings && lastSettings.players.length >= 2) {
    // Start game with last-used settings
    newGame(lastSettings.mode, lastSettings.players, {
      checkout: lastSettings.checkout,
      legs_to_win: lastSettings.legs_to_win,
      sets_to_win: lastSettings.sets_to_win,
    })
    navigateTo('/game')
  } else {
    // No saved settings → redirect to home for setup
    navigateTo('/')
  }
})
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <div class="text-center">
      <div class="spinner" />
      <p class="text-fg-muted mt-md">Starting game...</p>
    </div>
  </div>
</template>
```

---

## Settings Persistence

### `app/composables/useSettings.ts` (NEW or extend from #17)

Store last-used game settings:

```ts
interface AppSettings {
  dartboardTheme: string
  lastGameSettings: {
    mode: string
    checkout: string
    legs_to_win: number
    sets_to_win: number
    players: PlayerDescriptor[]  // includes bot config
  } | null
}

const SETTINGS_KEY = 'darts-scorer:settings'

export function useSettings() {
  const settings = useLocalStorage<AppSettings>(SETTINGS_KEY, {
    dartboardTheme: 'classic',
    lastGameSettings: null,
  })

  function saveLastGameSettings(
    mode: string,
    checkout: string,
    legs_to_win: number,
    sets_to_win: number,
    players: PlayerDescriptor[],
  ) {
    settings.value.lastGameSettings = { mode, checkout, legs_to_win, sets_to_win, players }
  }

  return {
    settings,
    saveLastGameSettings,
  }
}
```

### Save settings on game start

In `app/composables/useGameState.ts`:

```ts
function newGame(mode, players, options) {
  // ... existing logic ...

  // Save settings for quick-start
  const { saveLastGameSettings } = useSettings()
  saveLastGameSettings(mode, options?.checkout ?? 'double_out', options?.legs_to_win ?? 1, options?.sets_to_win ?? 1, descriptors)
}
```

---

## Shortcut Icons

Create small (96x96) icons for each shortcut:

```
public/
  icons/
    quick-game-96.png     # Dartboard with lightning bolt
    practice-96.png       # Target/bullseye icon
```

Generate with the existing `scripts/generate-pwa-icons.mjs` pattern.

---

## Files to Create

| File | Description |
|------|-------------|
| `app/pages/quick-start.vue` | Auto-start game page |
| `app/composables/useSettings.ts` | Settings persistence (if not already created by #17) |
| `public/icons/quick-game-96.png` | Quick game shortcut icon |
| `public/icons/practice-96.png` | Practice shortcut icon |

## Files to Modify

| File | Change |
|------|--------|
| `nuxt.config.ts` | Add `shortcuts` to PWA manifest |
| `app/composables/useGameState.ts` | Save last-used settings on game start |

---

## Edge Cases

1. **No saved settings**: Redirect to home page for setup
2. **Saved players no longer exist**: Fall back to home page
3. **Active game in progress**: Show abandon confirmation (reuse existing logic)
4. **Offline**: Works fine — all client-side, localStorage-based

---

## Related: Install Prompt

Consider adding a "Install App" prompt for users who haven't installed the PWA yet, to make them aware of the shortcut feature:

```vue
<!-- In app.vue or layout -->
<div v-if="showInstallPrompt" class="install-banner">
  <p>Install Darts Scorer for quick-start shortcuts!</p>
  <button @click="installPwa">Install</button>
  <button @click="dismissInstall">Maybe later</button>
</div>
```

```ts
// Capture the beforeinstallprompt event
let deferredPrompt: BeforeInstallPromptEvent | null = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  showInstallPrompt.value = true
})

async function installPwa() {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  showInstallPrompt.value = false
}
```

---

## Testing Strategy

1. Quick-start with saved settings creates correct game
2. Quick-start without saved settings redirects to home
3. PWA manifest includes correct shortcuts
4. Settings saved correctly after each game start
5. Install prompt shows on eligible browsers
6. Shortcut icons render correctly (96x96)
