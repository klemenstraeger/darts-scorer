/**
 * Composable for audio feedback and haptic vibration using Web Audio API.
 * Sounds are synthesized procedurally — no external audio files needed.
 */

const STORAGE_KEY = 'darts-scorer:audio-enabled'

type SoundName =
  | 'throw'
  | 'bust'
  | '180'
  | 'ton-plus'
  | 'leg-won'
  | 'game-won'
  | 'checkout'

// Module-level singletons (shared across all consumers)
let audioCtx: AudioContext | null = null
let audioInitialized = false
const audioEnabled = ref(true)

// Load persisted preference
if (import.meta.client) {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) {
    audioEnabled.value = stored === 'true'
  }
}

function ensureAudioContext(): AudioContext | null {
  if (!import.meta.client) return null
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext()
    } catch {
      return null
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

/** Initialize AudioContext on first user interaction (browser autoplay policy). */
function initOnInteraction() {
  if (audioInitialized || !import.meta.client) return
  const handler = () => {
    ensureAudioContext()
    audioInitialized = true
    document.removeEventListener('click', handler)
    document.removeEventListener('touchstart', handler)
  }
  document.addEventListener('click', handler, { once: false })
  document.addEventListener('touchstart', handler, { once: false })
}

if (import.meta.client) {
  initOnInteraction()
}

/**
 * Synthesize sounds procedurally using Web Audio API oscillators and gains.
 */
function synthesize(ctx: AudioContext, sound: SoundName, volume: number) {
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = volume
  master.connect(ctx.destination)

  switch (sound) {
    case 'throw': {
      // Short click/tap sound
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, now)
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.06)
      gain.gain.setValueAtTime(0.3 * volume, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
      osc.connect(gain).connect(master)
      osc.start(now)
      osc.stop(now + 0.08)
      break
    }
    case 'bust': {
      // Low buzzer sound
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(150, now)
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.3)
      gain.gain.setValueAtTime(0.25 * volume, now)
      gain.gain.linearRampToValueAtTime(0.15 * volume, now + 0.15)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
      osc.connect(gain).connect(master)
      osc.start(now)
      osc.stop(now + 0.4)
      break
    }
    case '180': {
      // Triumphant three-note ascending fanfare
      const notes = [523.25, 659.25, 783.99] // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        const t = now + i * 0.12
        osc.frequency.setValueAtTime(freq, t)
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.3 * volume, t + 0.03)
        gain.gain.linearRampToValueAtTime(0.2 * volume, t + 0.1)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
        osc.connect(gain).connect(master)
        osc.start(t)
        osc.stop(t + 0.35)
      })
      break
    }
    case 'ton-plus': {
      // Two-note positive chime
      const notes = [440, 554.37] // A4, C#5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        const t = now + i * 0.1
        osc.frequency.setValueAtTime(freq, t)
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.25 * volume, t + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
        osc.connect(gain).connect(master)
        osc.start(t)
        osc.stop(t + 0.25)
      })
      break
    }
    case 'leg-won': {
      // Victory jingle: ascending arpeggio
      const notes = [392, 493.88, 587.33, 783.99] // G4, B4, D5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        const t = now + i * 0.1
        osc.frequency.setValueAtTime(freq, t)
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.3 * volume, t + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
        osc.connect(gain).connect(master)
        osc.start(t)
        osc.stop(t + 0.4)
      })
      break
    }
    case 'game-won': {
      // Grand victory fanfare: full ascending scale + final chord
      const notes = [392, 440, 493.88, 523.25, 587.33, 659.25, 783.99] // G4 to G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        const t = now + i * 0.08
        osc.frequency.setValueAtTime(freq, t)
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.25 * volume, t + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
        osc.connect(gain).connect(master)
        osc.start(t)
        osc.stop(t + 0.5)
      })
      // Final chord at the end
      const chordTime = now + notes.length * 0.08
      const chord = [523.25, 659.25, 783.99] // C major
      chord.forEach((freq) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, chordTime)
        gain.gain.setValueAtTime(0, chordTime)
        gain.gain.linearRampToValueAtTime(0.2 * volume, chordTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.8)
        osc.connect(gain).connect(master)
        osc.start(chordTime)
        osc.stop(chordTime + 0.8)
      })
      break
    }
    case 'checkout': {
      // Quick positive ping
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, now)
      gain.gain.setValueAtTime(0.2 * volume, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
      osc.connect(gain).connect(master)
      osc.start(now)
      osc.stop(now + 0.15)
      break
    }
  }
}

/**
 * Trigger haptic vibration if the Vibration API is available.
 * @param pattern - Duration in ms or pattern array [vibrate, pause, vibrate, ...]
 */
function vibrate(pattern: number | number[]) {
  if (!import.meta.client) return
  if (!audioEnabled.value) return
  navigator?.vibrate?.(pattern)
}

/**
 * Play a synthesized sound effect.
 * @param sound - Sound name to play
 * @param volume - Volume multiplier (0-1), defaults to 1
 */
function play(sound: SoundName, volume: number = 1) {
  if (!audioEnabled.value) return
  const ctx = ensureAudioContext()
  if (!ctx) return
  synthesize(ctx, sound, Math.max(0, Math.min(1, volume)))
}

function toggle() {
  audioEnabled.value = !audioEnabled.value
  if (import.meta.client) {
    localStorage.setItem(STORAGE_KEY, String(audioEnabled.value))
  }
}

export function useAudio() {
  return {
    /** Whether audio/haptics are enabled */
    audioEnabled: readonly(audioEnabled),
    /** Play a sound effect */
    play,
    /** Trigger haptic vibration */
    vibrate,
    /** Toggle audio on/off */
    toggle,
  }
}
