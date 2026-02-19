const STORAGE_KEY = 'darts-scorer:announcer-enabled'

/** Classic darts score nicknames */
const SCORE_NICKNAMES: Record<number, string> = {
  26: 'Bed and breakfast',
  40: 'Forty',
  41: 'Forty one',
  45: 'Shanghai',
  57: 'Heinz',
  60: 'Sixty',
  80: 'Eighty',
  85: 'Eighty five',
  95: 'Ninety five',
  100: 'Ton!',
  120: 'Ton twenty',
  125: 'Ton twenty five',
  133: 'Ton thirty three',
  140: 'Ton forty',
  150: 'Ton fifty',
  160: 'Ton sixty',
  170: 'Big fish!',
  171: 'Ton seventy one',
  // 180 is handled separately with custom rate/pitch in announceScore()
}

/** Module-level state shared across all consumers */
const enabled = ref(false)
let initialized = false

/** Cached voice selection — resolved once and updated on voiceschanged */
let cachedVoice: SpeechSynthesisVoice | null = null
let voiceListenerAttached = false

function selectVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0)
    return null
  return voices.find(v => v.lang === 'en-GB' && /male/i.test(v.name))
    ?? voices.find(v => v.lang === 'en-GB')
    ?? voices.find(v => v.lang.startsWith('en-'))
    ?? voices[0]
    ?? null
}

function initVoiceCache() {
  if (!import.meta.client || !('speechSynthesis' in window))
    return
  if (voiceListenerAttached)
    return
  voiceListenerAttached = true

  // Attempt initial selection (may already be populated)
  cachedVoice = selectVoice()

  // Re-select when the browser finishes loading voices asynchronously
  window.speechSynthesis.addEventListener(
    'voiceschanged',
    () => {
      cachedVoice = selectVoice()
    },
    { once: true },
  )
}

function loadPreference() {
  if (!import.meta.client || initialized)
    return
  initialized = true
  const stored = localStorage.getItem(STORAGE_KEY)
  enabled.value = stored === 'true'
}

function savePreference() {
  if (!import.meta.client)
    return
  localStorage.setItem(STORAGE_KEY, String(enabled.value))
}

function speak(text: string, options?: { rate?: number, pitch?: number }) {
  if (!import.meta.client || !enabled.value)
    return
  if (!('speechSynthesis' in window))
    return

  // Ensure the voice cache is initialized
  initVoiceCache()

  // Cancel any ongoing speech before starting new
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = options?.rate ?? 0.9
  utterance.pitch = options?.pitch ?? 0.8
  utterance.volume = 1

  // Use cached voice selection
  if (cachedVoice) {
    utterance.voice = cachedVoice
  }

  window.speechSynthesis.speak(utterance)
}

export function useAnnouncer() {
  loadPreference()

  function toggle() {
    enabled.value = !enabled.value
    savePreference()
  }

  function setEnabled(value: boolean) {
    enabled.value = value
    savePreference()
  }

  function announceScore(total: number) {
    if (total === 180) {
      speak('ONE HUNDRED AND EIGHTY!', { rate: 0.75, pitch: 0.7 })
      return
    }
    const nickname = SCORE_NICKNAMES[total]
    if (nickname) {
      speak(nickname)
      return
    }
    if (total > 0) {
      speak(String(total))
    }
  }

  function announceBust() {
    const phrases = ['Bust!', 'No score!']
    speak(phrases[Math.floor(Math.random() * phrases.length)] ?? 'Bust!')
  }

  function announceGameShot(name: string) {
    speak(`Game shot! ${name}!`, { rate: 0.85 })
  }

  function announceMatchWon(name: string) {
    speak(`Game, set, and match! ${name}!`, { rate: 0.8, pitch: 0.7 })
  }

  function announceCheckout(remaining: number) {
    speak(`You require ${remaining}`)
  }

  function announceGameStart() {
    speak('Game on!', { rate: 0.85 })
  }

  return {
    enabled: readonly(enabled),
    toggle,
    setEnabled,
    announceScore,
    announceBust,
    announceGameShot,
    announceMatchWon,
    announceCheckout,
    announceGameStart,
  }
}
