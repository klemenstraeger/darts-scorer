# Feature 10 — Sound Effects & Haptics

**Priority:** 2 (High) | **Effort:** Small | **Impact:** High
**Depends on:** Nothing

---

## Summary

Audio and haptic feedback to make the app feel premium and engaging. Dart thwack on throw, crowd roar on 180, thud on bust, fanfare on game won. Uses Web Audio API for low-latency playback and Vibration API for haptics.

---

## Sound Design

| Event | Sound | Duration | File |
|-------|-------|----------|------|
| Dart scored | Dart hitting board thwack | ~200ms | `throw.mp3` |
| Bust | Heavy thud/buzzer | ~400ms | `bust.mp3` |
| 180 scored | Crowd roar + "ONE HUNDRED AND EIGHTY!" | ~2s | `180.mp3` |
| Ton+ (100-179) | Quick crowd cheer | ~800ms | `ton-plus.mp3` |
| Leg won | Short fanfare | ~1.5s | `leg-won.mp3` |
| Game won | Victory fanfare | ~2s | `game-won.mp3` |
| Checkout possible | Subtle ping/chime | ~200ms | `checkout.mp3` |
| Turn complete | Soft swoosh | ~150ms | `turn-end.mp3` |

**File requirements:** MP3 format, < 100KB each for PWA. Total audio budget: ~500KB.

**Sound sources:** Use royalty-free sounds from freesound.org or similar. The "180" crowd sound is iconic and adds massive atmosphere.

---

## Audio Composable

### `app/composables/useAudio.ts` (NEW)

```ts
const SOUNDS = {
  throw: '/sounds/throw.mp3',
  bust: '/sounds/bust.mp3',
  '180': '/sounds/180.mp3',
  'ton-plus': '/sounds/ton-plus.mp3',
  'leg-won': '/sounds/leg-won.mp3',
  'game-won': '/sounds/game-won.mp3',
  checkout: '/sounds/checkout.mp3',
  'turn-end': '/sounds/turn-end.mp3',
} as const

type SoundKey = keyof typeof SOUNDS

// Module-level audio context and buffers (singleton)
let audioCtx: AudioContext | null = null
const buffers = new Map<string, AudioBuffer>()
const audioEnabled = useLocalStorage('darts-scorer:audio-enabled', true)

async function initAudio() {
  if (audioCtx) return
  audioCtx = new AudioContext()

  // Preload all sounds
  await Promise.all(
    Object.entries(SOUNDS).map(async ([key, url]) => {
      try {
        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await audioCtx!.decodeAudioData(arrayBuffer)
        buffers.set(key, audioBuffer)
      } catch (e) {
        console.warn(`Failed to load sound: ${key}`, e)
      }
    })
  )
}

function play(sound: SoundKey, volume: number = 1.0) {
  if (!audioEnabled.value || !audioCtx || !buffers.has(sound)) return

  // Resume context if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }

  const source = audioCtx.createBufferSource()
  source.buffer = buffers.get(sound)!

  const gainNode = audioCtx.createGain()
  gainNode.gain.value = volume

  source.connect(gainNode)
  gainNode.connect(audioCtx.destination)
  source.start(0)
}

export function useAudio() {
  // Initialize on first user interaction (required by browsers)
  onMounted(() => {
    const init = () => {
      initAudio()
      document.removeEventListener('touchstart', init)
      document.removeEventListener('click', init)
    }
    document.addEventListener('touchstart', init, { once: true })
    document.addEventListener('click', init, { once: true })
  })

  return {
    play,
    audioEnabled,
    toggleAudio: () => { audioEnabled.value = !audioEnabled.value },
  }
}
```

**Why Web Audio API instead of `<audio>` elements?**
- Much lower latency (~5ms vs ~100ms+)
- Can play multiple sounds simultaneously
- Better control over volume and effects
- Works better on mobile (no audio element lifecycle issues)

---

## Haptic Feedback

### Vibration patterns

```ts
// In useAudio.ts or separate useHaptics.ts

function vibrate(pattern: number | number[]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

const HAPTICS = {
  throw: 15,              // short tap
  bust: [50, 30, 50],     // double pulse
  '180': [30, 20, 30, 20, 100], // celebration pattern
  'leg-won': [50, 30, 100],
  'game-won': [50, 30, 50, 30, 200],
} as const
```

---

## Integration with Game State

### `app/composables/useGameState.ts`

Add audio triggers after event detection:

```ts
const { play } = useAudio()

function manualScore(segment: number, multiplier: number) {
  // ... existing logic ...

  // Play sound based on event
  switch (event) {
    case GameEvent.BUST:
      play('bust')
      vibrate(HAPTICS.bust)
      break
    case GameEvent.LEG_WON:
      play('leg-won')
      vibrate(HAPTICS['leg-won'])
      break
    case GameEvent.GAME_OVER:
      play('game-won')
      vibrate(HAPTICS['game-won'])
      break
    case GameEvent.DART_SCORED:
      play('throw', 0.5)
      vibrate(HAPTICS.throw)

      // Check for special scores
      if (turnIsComplete(engine.state.current_turn)) {
        const turnTotal = currentTurnTotal()
        if (turnTotal === 180) {
          play('180')
          vibrate(HAPTICS['180'])
        } else if (turnTotal >= 100) {
          play('ton-plus')
        }
      }
      break
  }
}
```

**Note:** Sound triggers happen in `useGameState.ts` (not `game.vue`) so they work regardless of the UI view.

---

## Mute Toggle UI

### `app/pages/game.vue`

Add mute button to the game page (alongside existing controls):

```vue
<button
  class="btn btn-icon"
  @click="toggleAudio"
  :title="audioEnabled ? 'Mute sounds' : 'Enable sounds'"
>
  <svg v-if="audioEnabled"><!-- speaker icon --></svg>
  <svg v-else><!-- muted speaker icon --></svg>
</button>
```

Also add to `AppNav.vue` or a settings area for global access.

---

## Sound Files Directory

```
public/
  sounds/
    throw.mp3       (~15KB)
    bust.mp3        (~30KB)
    180.mp3         (~80KB)
    ton-plus.mp3    (~40KB)
    leg-won.mp3     (~50KB)
    game-won.mp3    (~60KB)
    checkout.mp3    (~15KB)
    turn-end.mp3    (~10KB)
```

Total: ~300KB — well within PWA budget.

---

## PWA Caching

### `nuxt.config.ts`

Add sounds to workbox precache patterns:

```ts
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,mp3}'],
  // ...
}
```

---

## Files to Create

| File | Description |
|------|-------------|
| `app/composables/useAudio.ts` | Audio manager (Web Audio API + haptics) |
| `public/sounds/*.mp3` | 8 sound effect files |

## Files to Modify

| File | Change |
|------|--------|
| `app/composables/useGameState.ts` | Add audio/haptic triggers after event detection |
| `app/pages/game.vue` | Add mute toggle button |
| `nuxt.config.ts` | Add `mp3` to workbox glob patterns |

---

## Browser Compatibility

- **Web Audio API**: Supported in all modern browsers (Chrome, Firefox, Safari, Edge)
- **Vibration API**: Chrome/Android only. Safari/iOS does NOT support `navigator.vibrate()`. Graceful degradation — no-op on unsupported browsers.
- **Autoplay policy**: Audio context must be resumed after first user interaction. The composable handles this with click/touch event listeners.

---

## Testing Strategy

1. Sound plays on each event type
2. Mute toggle persists across page reloads (localStorage)
3. No errors on browsers without Vibration API
4. Audio context resumes after user interaction
5. Multiple rapid sounds don't cause issues (concurrent playback)
6. PWA offline: sounds cached and playable
