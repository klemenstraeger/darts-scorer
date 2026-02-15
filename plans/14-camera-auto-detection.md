# Feature 14 — Camera Auto-Detection

**Priority:** 19 (Lowest) | **Effort:** Very Large | **Impact:** High (but R&D)
**Depends on:** Nothing (WebRTC camera infrastructure already exists)

---

## Summary

Automatic dart scoring from camera feed using computer vision / machine learning. The WebRTC camera infrastructure already exists (`app/composables/useBroadcast.ts`, `app/pages/camera/[id].vue`). This feature adds dart detection on top of the camera stream.

**This is an R&D feature.** It requires significant ML/CV work and should be treated as an experimental project.

---

## Approach Options

### Option A: Cloud ML (Recommended for v1)

```
Camera Feed → Capture frame → Upload to cloud API → Detect darts → Map to segments → Return score
```

**Pros:** Easier to implement, can use pre-trained models, no client-side ML overhead
**Cons:** Requires internet, latency (1-3s per detection), ongoing API costs

**Cloud options:**
- Google Cloud Vision API (custom model via AutoML)
- AWS Rekognition (custom labels)
- Roboflow (specialized CV platform, supports dartboard detection)
- Custom model hosted on a serverless GPU (Replicate, Modal)

### Option B: On-Device ML (Future)

```
Camera Feed → TensorFlow.js → Detect darts → Map to segments → Return score
```

**Pros:** Offline capable, no API costs, lower latency after model loads
**Cons:** Large model download (~10-50MB), requires training data, device performance constraints

---

## Detection Pipeline

### Step 1: Board Detection
- Detect the dartboard in the frame (circle detection, color segmentation)
- Compute homography transform to normalize perspective
- Cache board position (it doesn't move between throws)

### Step 2: Dart Detection
- Compare "before throw" frame with "after throw" frame (difference detection)
- Or: detect dart tip positions directly from current frame
- Each new dart tip = one dart thrown

### Step 3: Segment Mapping
- Map detected dart pixel positions to board coordinates
- Use existing dartboard geometry (`shared/dartboard-geometry.ts` or similar)
- Account for perspective distortion using homography

### Step 4: Score Computation
- Convert board coordinates to segment + multiplier
- Validate (is the dart on the board? is it in a valid segment?)
- Return `ThrowResult` to the game engine

---

## Implementation: Cloud ML Approach

### `app/composables/useAutoScore.ts` (NEW)

```ts
export function useAutoScore() {
  const isActive = ref(false)
  const confidence = ref(0)
  const lastDetection = ref<ThrowResult | null>(null)

  let videoElement: HTMLVideoElement | null = null
  let detectionInterval: number | null = null
  let lastFrameData: ImageData | null = null

  function start(video: HTMLVideoElement) {
    videoElement = video
    isActive.value = true
    // Capture reference frame (board with no darts)
    captureReferenceFrame()
    // Start detection loop
    detectionInterval = setInterval(detectDarts, 2000) // every 2s
  }

  function stop() {
    isActive.value = false
    if (detectionInterval) clearInterval(detectionInterval)
  }

  async function captureReferenceFrame() {
    if (!videoElement) return
    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(videoElement, 0, 0)
    lastFrameData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  async function detectDarts() {
    if (!videoElement || !lastFrameData) return

    // Capture current frame
    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(videoElement, 0, 0)

    // Convert to blob for upload
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8)
    })

    // Send to detection API
    const formData = new FormData()
    formData.append('image', blob)
    formData.append('reference', /* reference frame */)

    try {
      const result = await $fetch('/api/detection/detect', {
        method: 'POST',
        body: formData,
      })

      if (result.darts && result.darts.length > 0) {
        lastDetection.value = result.darts[0]
        confidence.value = result.confidence
      }
    } catch (e) {
      console.warn('Detection failed:', e)
    }
  }

  return {
    isActive,
    confidence,
    lastDetection,
    start,
    stop,
  }
}
```

### `server/api/detection/detect.post.ts` (NEW)

```ts
// Proxy to cloud ML service
export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  // Forward to Roboflow / Google Vision / custom model
  // Parse response into ThrowResult[]
})
```

---

## Training Data Requirements

For a custom model:
- **500-1000** labeled images of dartboards with darts
- Labels: dart tip position (x, y) or segment+multiplier
- Various lighting conditions, angles, dart types
- Both close-up and wide-angle shots

**Data collection approach:**
- Build a labeling tool into the app (manually score while recording)
- Each confirmed score = training data point
- Over time, build dataset from regular app usage

---

## Camera Calibration

On first use, guide the user through calibration:

1. Show camera feed
2. Ask user to position camera aimed at dartboard
3. Detect board edges using circle detection (OpenCV.js or manual)
4. Mark the board center and double ring
5. Compute perspective transform
6. Save calibration per camera position

---

## Files to Create

| File | Description |
|------|-------------|
| `app/composables/useAutoScore.ts` | Frame capture + detection pipeline |
| `server/api/detection/detect.post.ts` | ML inference proxy |
| `app/components/CameraCalibration.vue` | Board calibration wizard |
| Training pipeline (separate repo) | Model training scripts |

## Files to Modify

| File | Change |
|------|--------|
| `app/pages/game.vue` | Toggle between manual and auto scoring mode |
| `app/composables/useGameState.ts` | Accept auto-detected throws |
| `app/pages/camera/[id].vue` | Add detection overlay showing detected dart positions |

---

## Accuracy Expectations

- **v1 (Cloud ML):** 70-85% accuracy, 1-3s latency
- **v2 (Improved model):** 85-95% accuracy
- **Always provide manual override** — user can correct misdetections

**Important:** Auto-detection should be an *assist* mode, not a replacement. Always show detected score and let user confirm or correct before applying.

---

## Phased Rollout

1. **Phase 1**: Board detection only (confirm camera can see board)
2. **Phase 2**: Dart count detection (how many darts on board)
3. **Phase 3**: Dart position detection (which segment)
4. **Phase 4**: Full auto-scoring with confirmation UI

---

## Testing Strategy

1. Board detection: Correctly identifies dartboard in various conditions
2. Dart detection: Correctly counts new darts
3. Segment mapping: Pixel positions correctly map to segments
4. Calibration: Perspective correction works for different angles
5. Manual override: User can correct any detection
6. Performance: Detection doesn't freeze the UI
