/**
 * Composable that orchestrates bot auto-play during a game.
 * Watches for bot turns and feeds generated throws through manualScore().
 */

import type { BotDifficulty, CheckoutMode } from '#shared/game-models'
import { generateBotThrow } from '#shared/bot-engine'

const isBotPlaying = ref(false)
let botAbortController: AbortController | null = null

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

export function useBotPlay() {
  const store = useGameStore()
  const { manualScore } = useGameState()

  async function playBotTurn(signal: AbortSignal) {
    if (isBotPlaying.value)
      return
    isBotPlaying.value = true

    try {
      // Small initial delay so the UI has time to update
      await sleep(800, signal)

      for (let dart = 0; dart < 3; dart++) {
        if (signal.aborted)
          return

        const player = store.state.players[store.state.current_player_index]
        if (!player?.isBot || !player.botDifficulty)
          break
        if (store.state.is_finished)
          break

        // Check if turn is already complete (bust happened on previous dart)
        const currentTurn = store.state.current_turn
        if (currentTurn.busted || currentTurn.throws.length >= 3)
          break

        const dartsLeft = 3 - currentTurn.throws.length
        const botThrow = generateBotThrow(
          player.score,
          dartsLeft,
          player.botDifficulty as BotDifficulty,
          store.state.checkout as CheckoutMode,
        )

        manualScore(botThrow.segment, botThrow.multiplier)

        // Check if bust, leg won, or game over happened
        if (store.state.is_finished)
          break

        // If player index changed (turn ended due to bust or 3 darts), stop
        if (store.state.current_player_index !== currentTurn.player_index)
          break

        // Delay between darts (600–1000ms)
        if (dart < 2 && currentTurn.throws.length < 3) {
          await sleep(600 + Math.random() * 400, signal)
        }
      }
    }
    catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError')
        return
      throw e
    }
    finally {
      isBotPlaying.value = false
    }
  }

  // Watch for bot turns
  watch(
    () => ({
      playerIndex: store.state.current_player_index,
      hasPlayers: store.state.players.length > 0,
      isFinished: store.state.is_finished,
      // Also watch bustFlash to trigger next bot after bust animation
      bustFlash: store.bustFlash,
      legWonFlash: store.legWonFlash,
    }),
    async (val) => {
      if (!val.hasPlayers || val.isFinished || isBotPlaying.value)
        return
      // Wait for bust/leg flash to finish before starting bot turn
      if (val.bustFlash || val.legWonFlash)
        return

      const player = store.state.players[val.playerIndex]
      if (!player?.isBot)
        return

      // Cancel any previous bot turn in progress
      if (botAbortController) {
        botAbortController.abort()
      }
      botAbortController = new AbortController()

      await nextTick()
      playBotTurn(botAbortController.signal)
    },
    { immediate: true },
  )

  // Cleanup on unmount
  onUnmounted(() => {
    if (botAbortController) {
      botAbortController.abort()
      botAbortController = null
    }
    isBotPlaying.value = false
  })

  return {
    isBotPlaying: readonly(isBotPlaying),
  }
}
