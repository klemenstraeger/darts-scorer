# Feature 18 — Announcer Voice

**Priority:** 3 (High) | **Effort:** Small | **Impact:** High
**Depends on:** Nothing (can work alongside or independently of #10 Sound Effects)

---

## Summary

"One hundred and eighty!" — the iconic darts announcer. Uses the **Web Speech API** (`SpeechSynthesis`) for real-time announcements of scores, events, and checkout suggestions. Includes a phrase dictionary with traditional darts scoring terminology.

---

## Darts Scoring Terminology

### Common Score Names

| Score | Phrase |
|-------|--------|
| 180 | "ONE HUNDRED AND EIGHTY!" |
| 177 | "One hundred and seventy seven" |
| 140 | "One hundred and forty" |
| 120 | "One hundred and twenty" |
| 100 | "Ton!" / "One hundred" |
| 85 | "Eighty five" |
| 60 | "Sixty" |
| 45 | "Forty five" |
| 26 | "Twenty six" |
| 0 (bust) | "Bust!" / "No score!" |

### Classic Darts Nicknames

| Score | Nickname |
|-------|----------|
| 26 | "Bed and Breakfast" (or "Murphy") |
| 45 | "Shanghai" |
| 57 | "Heinz" (57 varieties) |
| 22 | "Double top" (if D11... actually just = 22) |
| 40 | "Tops" (double 20) |
| 100+ | "Ton" |
| 120 | "Ton-twenty" |
| 140 | "Ton-forty" |
| 171+ | "Maximum area!" |

### Event Phrases

| Event | Phrases (randomly selected) |
|-------|------|
| Game start | "Game on!" |
| 180 | "ONE HUNDRED AND EIGHTY!" |
| Ton+ (100-179) | "Ton {score}!", "{score}!" |
| Bust | "Bust!", "No score!" |
| Leg won | "Game shot! {name}!" |
| Match won | "Game, set, and match! {name}!" |
| Checkout available | "You require {score}" |
| Double hit | "Double {number}" |
| Triple hit | "Treble {number}" |
| Bullseye | "Bullseye!" |

---

## Announcer Composable

### `app/composables/useAnnouncer.ts` (NEW)

```ts
const announcerEnabled = useLocalStorage('darts-scorer:announcer-enabled', false)

// Voice selection: prefer deep male voice
let selectedVoice: SpeechSynthesisVoice | null = null

function initVoice() {
  const voices = window.speechSynthesis.getVoices()
  // Prefer: English (UK) male voice
  selectedVoice =
    voices.find(v => v.lang === 'en-GB' && v.name.includes('Male')) ||
    voices.find(v => v.lang === 'en-GB') ||
    voices.find(v => v.lang.startsWith('en') && v.name.includes('Male')) ||
    voices.find(v => v.lang.startsWith('en')) ||
    voices[0] || null
}

function speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }) {
  if (!announcerEnabled.value || !window.speechSynthesis) return

  // Cancel any current speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  if (selectedVoice) utterance.voice = selectedVoice
  utterance.rate = options?.rate ?? 0.9     // slightly slower for dramatic effect
  utterance.pitch = options?.pitch ?? 0.8   // deeper pitch
  utterance.volume = options?.volume ?? 1.0

  window.speechSynthesis.speak(utterance)
}

// Score-to-phrase mapping
function announceScore(total: number) {
  if (total === 180) {
    speak('ONE HUNDRED AND EIGHTY!', { rate: 0.7, pitch: 0.6, volume: 1.0 })
  } else if (total >= 100) {
    const nickname = SCORE_NICKNAMES[total]
    speak(nickname || `${total}`)
  } else if (total === 0) {
    // bust handled separately
  } else if (total >= 40) {
    speak(`${total}`)
  }
  // Don't announce small scores (< 40) to avoid being annoying
}

function announceBust() {
  speak(randomChoice(['Bust!', 'No score!']))
}

function announceGameShot(playerName: string) {
  speak(`Game shot! ${playerName}!`, { rate: 0.8 })
}

function announceMatchWon(playerName: string) {
  speak(`Game, set, and match! ${playerName}!`, { rate: 0.8 })
}

function announceCheckout(remaining: number) {
  speak(`You require ${remaining}`, { rate: 1.0, volume: 0.7 })
}

function announceGameStart() {
  speak('Game on!', { rate: 0.9 })
}

const SCORE_NICKNAMES: Record<number, string> = {
  26: 'Bed and breakfast',
  45: 'Shanghai',
  57: 'Heinz',
  100: 'Ton!',
  120: 'Ton twenty',
  140: 'Ton forty',
  180: 'ONE HUNDRED AND EIGHTY!',
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function useAnnouncer() {
  onMounted(() => {
    // Voices may load asynchronously
    if (window.speechSynthesis.getVoices().length > 0) {
      initVoice()
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', initVoice, { once: true })
    }
  })

  return {
    announcerEnabled,
    toggleAnnouncer: () => { announcerEnabled.value = !announcerEnabled.value },
    announceScore,
    announceBust,
    announceGameShot,
    announceMatchWon,
    announceCheckout,
    announceGameStart,
    speak,
  }
}
```

---

## Integration with Game State

### `app/composables/useGameState.ts`

Add announcer calls alongside existing event handling:

```ts
const { announceScore, announceBust, announceGameShot, announceMatchWon, announceGameStart } = useAnnouncer()

function newGame(...) {
  // ... existing logic ...
  announceGameStart()
}

function manualScore(segment: number, multiplier: number) {
  // ... existing logic ...

  switch (event) {
    case GameEvent.BUST:
      announceBust()
      break
    case GameEvent.LEG_WON:
      announceGameShot(state.players[state.winner_index]?.name ?? '')
      break
    case GameEvent.GAME_OVER:
      announceMatchWon(state.players[state.winner_index]?.name ?? '')
      break
    case GameEvent.DART_SCORED:
      // Announce turn total when turn completes
      if (turnIsComplete(engine.state.current_turn)) {
        const total = currentTurnTotal()
        announceScore(total)
      }
      break
  }
}
```

---

## Toggle UI

### `app/pages/game.vue`

Add announcer toggle alongside mute button:

```vue
<div class="flex gap-xs">
  <!-- Sound toggle (from #10) -->
  <button class="btn btn-icon" @click="toggleAudio" :title="audioEnabled ? 'Mute' : 'Unmute'">
    <svg><!-- speaker icon --></svg>
  </button>

  <!-- Announcer toggle -->
  <button class="btn btn-icon" @click="toggleAnnouncer" :title="announcerEnabled ? 'Announcer off' : 'Announcer on'">
    <svg><!-- microphone icon --></svg>
  </button>
</div>
```

---

## Voice Quality Considerations

**Web Speech API limitations:**
- Voice quality varies by OS/browser
- macOS/iOS: Excellent voices (Alex, Daniel)
- Chrome: Uses Google's TTS voices (decent quality)
- Firefox: Uses system voices

**Enhancement: Pre-recorded clips (future)**

For a more authentic experience, consider pre-recording key phrases:
- "ONE HUNDRED AND EIGHTY!" (requires a voice actor or high-quality TTS)
- Use Web Speech API for dynamic scores
- Mix: pre-recorded for iconic phrases, TTS for numbers

---

## Interaction with Sound Effects (#10)

If both Sound Effects and Announcer are enabled:
1. Sound effect plays immediately (throw thwack, bust thud)
2. Announcer speaks after a short delay (~300ms) to avoid overlap
3. For 180: sound effect (crowd roar) and announcer ("ONE HUNDRED AND EIGHTY!") should be timed to complement each other

```ts
// In useGameState or a coordinator:
if (total === 180) {
  play('180')  // crowd roar sound effect
  setTimeout(() => announceScore(180), 1500) // announcer after crowd dies down
}
```

---

## Files to Create

| File | Description |
|------|-------------|
| `app/composables/useAnnouncer.ts` | Web Speech API announcer with phrase dictionary |

## Files to Modify

| File | Change |
|------|--------|
| `app/composables/useGameState.ts` | Add announcer calls after events |
| `app/pages/game.vue` | Add announcer toggle button |

---

## Browser Compatibility

- **SpeechSynthesis API**: Supported in all modern browsers
- **Voice availability**: Varies by OS. `getVoices()` returns different lists
- **Mobile**: Works on iOS Safari and Chrome Android, but may have limitations on background/locked screen
- **Graceful degradation**: If no voices available, announcer silently does nothing

---

## Testing Strategy

1. Announcer speaks correct phrase for each score
2. Nickname mapping works (26 → "Bed and breakfast")
3. Toggle persists across sessions (localStorage)
4. No errors when SpeechSynthesis is unavailable
5. Announcer doesn't overlap with itself (cancel before new speech)
6. Voice selection prefers English voice
7. Interaction with Sound Effects is coordinated (no collision)
