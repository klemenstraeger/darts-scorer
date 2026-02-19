const STUN_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

const ICE_GATHER_TIMEOUT = 5000

/** Wait for all ICE candidates to be gathered, then return the complete SDP */
function waitForIceGathering(pc: RTCPeerConnection): Promise<RTCSessionDescription> {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') {
      resolve(pc.localDescription!)
      return
    }

    const timeout = setTimeout(() => {
      resolve(pc.localDescription!)
    }, ICE_GATHER_TIMEOUT)

    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timeout)
        resolve(pc.localDescription!)
      }
    })
  })
}

export type BroadcastState = 'idle' | 'starting' | 'waiting' | 'connected' | 'error'

/**
 * Phone side: captures camera and broadcasts via WebRTC.
 * Manages its own polling loop to detect when the spectate view answers.
 */
export function useBroadcaster(tournamentId: Ref<number> | number) {
  const tid = typeof tournamentId === 'number' ? tournamentId : unref(tournamentId)

  const state = ref<BroadcastState>('idle')
  const localStream = ref<MediaStream | null>(null)
  const errorMsg = ref('')

  let pc: RTCPeerConnection | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null

  async function startBroadcast() {
    state.value = 'starting'
    errorMsg.value = ''

    try {
      // Get rear camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      localStream.value = stream

      // Create peer connection
      pc = new RTCPeerConnection(STUN_SERVERS)
      stream.getTracks().forEach(track => pc!.addTrack(track, stream))

      // Monitor connection state
      pc.addEventListener('connectionstatechange', () => {
        if (pc?.connectionState === 'connected') {
          state.value = 'connected'
        }
        else if (pc?.connectionState === 'disconnected' || pc?.connectionState === 'failed') {
          state.value = 'error'
          errorMsg.value = 'Connection lost'
        }
      })

      // Create and send offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const completeSdp = await waitForIceGathering(pc)

      await $fetch('/api/broadcast/offer', {
        method: 'POST',
        body: { tournamentId: tid, offer: completeSdp.toJSON() },
      })

      state.value = 'waiting'

      // Poll for answer
      pollTimer = setInterval(async () => {
        try {
          const data = await $fetch<{
            session: { status: string, answer: unknown } | null
          }>(`/api/broadcast/${tid}`)

          if (data.session?.answer && pc && !pc.remoteDescription) {
            const answer = new RTCSessionDescription(data.session.answer as RTCSessionDescriptionInit)
            await pc.setRemoteDescription(answer)
            // Stop polling once answer is set
            if (pollTimer) {
              clearInterval(pollTimer)
              pollTimer = null
            }
          }
        }
        catch {
          // Ignore poll errors
        }
      }, 2000)
    }
    catch (e: any) {
      state.value = 'error'
      errorMsg.value = e.message || 'Failed to start broadcast'
    }
  }

  async function stopBroadcast() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }

    if (localStream.value) {
      localStream.value.getTracks().forEach(t => t.stop())
      localStream.value = null
    }

    if (pc) {
      pc.close()
      pc = null
    }

    // Clean up DB session
    try {
      await $fetch(`/api/broadcast/${tid}`, { method: 'DELETE' })
    }
    catch {
      // Best effort cleanup
    }

    state.value = 'idle'
  }

  // Cleanup on page close
  if (import.meta.client) {
    const cleanup = () => {
      if (state.value !== 'idle') {
        // Use keepalive fetch for cleanup on page close
        navigator.sendBeacon?.(`/api/broadcast/${tid}`) // sendBeacon doesn't support DELETE, so we'll use fetch keepalive
        fetch(`/api/broadcast/${tid}`, { method: 'DELETE', keepalive: true }).catch(() => {})
        localStream.value?.getTracks().forEach(t => t.stop())
      }
    }

    onUnmounted(() => {
      stopBroadcast()
    })

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', cleanup)
      onUnmounted(() => window.removeEventListener('beforeunload', cleanup))
    }
  }

  return {
    state: readonly(state),
    localStream: readonly(localStream),
    errorMsg: readonly(errorMsg),
    startBroadcast,
    stopBroadcast,
  }
}

export type ViewerState = 'idle' | 'connecting' | 'connected' | 'error'

/**
 * Spectate (TV) side: receives WebRTC video stream.
 * Does NOT manage its own polling — handleOffer() is called
 * reactively from the existing spectate page polling loop.
 */
export function useViewer(tournamentId: Ref<number> | number) {
  const tid = typeof tournamentId === 'number' ? tournamentId : unref(tournamentId)

  const state = ref<ViewerState>('idle')
  const remoteStream = ref<MediaStream | null>(null)

  let pc: RTCPeerConnection | null = null
  let currentOfferSdp: string | null = null

  /**
   * Called from the spectate polling loop when broadcast data changes.
   * Only creates a new peer connection if the offer SDP has changed.
   */
  async function handleOffer(offer: unknown, hasAnswer: boolean) {
    if (!offer || hasAnswer)
      return

    const offerDesc = offer as RTCSessionDescriptionInit
    const offerSdp = offerDesc.sdp ?? ''

    // Skip if we already processed this exact offer
    if (offerSdp === currentOfferSdp && pc)
      return

    // New offer — create fresh peer connection
    if (pc) {
      pc.close()
      pc = null
    }

    currentOfferSdp = offerSdp
    state.value = 'connecting'

    try {
      pc = new RTCPeerConnection(STUN_SERVERS)

      // Receive remote tracks
      pc.addEventListener('track', (event) => {
        remoteStream.value = event.streams[0] ?? null
      })

      pc.addEventListener('connectionstatechange', () => {
        if (pc?.connectionState === 'connected') {
          state.value = 'connected'
        }
        else if (pc?.connectionState === 'disconnected' || pc?.connectionState === 'failed') {
          state.value = 'error'
        }
      })

      await pc.setRemoteDescription(new RTCSessionDescription(offerDesc))

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      const completeSdp = await waitForIceGathering(pc)

      await $fetch('/api/broadcast/answer', {
        method: 'POST',
        body: { tournamentId: tid, answer: completeSdp.toJSON() },
      })
    }
    catch {
      state.value = 'error'
    }
  }

  function handleBroadcastEnded() {
    if (pc) {
      pc.close()
      pc = null
    }
    remoteStream.value = null
    currentOfferSdp = null
    state.value = 'idle'
  }

  onUnmounted(() => {
    if (pc) {
      pc.close()
      pc = null
    }
  })

  return {
    state: readonly(state),
    remoteStream: readonly(remoteStream),
    handleOffer,
    handleBroadcastEnded,
  }
}
