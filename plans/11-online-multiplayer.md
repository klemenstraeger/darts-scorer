# Feature 11 — Online Multiplayer

**Priority:** 15 (Medium) | **Effort:** Large | **Impact:** High
**Depends on:** Nothing (but complex infrastructure)

---

## Summary

Play against remote friends in real-time. Uses **Supabase Realtime** (already a dependency via `@nuxtjs/supabase`) for game state synchronization. Host creates a room with a short code, guest joins, and turns alternate with live state sync.

---

## Architecture

**Approach:** Supabase Realtime Channels (pub/sub, not database changes)

```
Host                         Supabase                      Guest
  │                            │                              │
  ├──create room──────────────>│                              │
  │<────room code (ABC123)─────│                              │
  │                            │                              │
  │          [share code]      │      [enter code]            │
  │                            │<─────join room───────────────┤
  │<────guest joined───────────│──────host info────────────── │
  │                            │                              │
  ├──throw(dart)──────────────>│──────state update───────────>│
  │                            │                              │
  │                            │<─────throw(dart)─────────────┤
  │<────state update───────────│                              │
```

**Source of truth:** Host runs the `GameEngine`. Guest sends throw intents, host validates and broadcasts confirmed state.

---

## Database

### `server/db/schema.ts`

```ts
export const onlineGames = pgTable('online_games', {
  id: serial('id').primaryKey(),
  roomCode: text('room_code').notNull().unique(),
  hostUserId: uuid('host_user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  guestUserId: uuid('guest_user_id').references(() => profiles.id, { onDelete: 'set null' }),
  hostPlayerName: text('host_player_name').notNull(),
  guestPlayerName: text('guest_player_name'),
  gameSettings: jsonb('game_settings').notNull(), // { mode, checkout, legs_to_win, sets_to_win }
  status: text('status').notNull().default('waiting'), // waiting | in_progress | completed | cancelled
  state: jsonb('state'),  // latest GameState snapshot
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

---

## Room Code Generation

```ts
function generateRoomCode(): string {
  // 6-char alphanumeric, uppercase, no ambiguous chars (0/O, 1/I/L)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
```

---

## API Endpoints

### `server/api/game/online/create.post.ts` (NEW)

```ts
export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event)
  const body = await readBody(event)

  const roomCode = generateRoomCode()

  await db.insert(onlineGames).values({
    roomCode,
    hostUserId: userId,
    hostPlayerName: body.playerName,
    gameSettings: body.settings, // { mode, checkout, legs_to_win, sets_to_win }
    status: 'waiting',
  })

  return { roomCode }
})
```

### `server/api/game/online/join.post.ts` (NEW)

```ts
export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event)
  const body = await readBody(event)

  const [room] = await db.select().from(onlineGames)
    .where(and(eq(onlineGames.roomCode, body.roomCode.toUpperCase()), eq(onlineGames.status, 'waiting')))

  if (!room) throw createError({ statusCode: 404, message: 'Room not found or already started' })
  if (room.hostUserId === userId) throw createError({ statusCode: 400, message: 'Cannot join your own room' })

  await db.update(onlineGames)
    .set({ guestUserId: userId, guestPlayerName: body.playerName, status: 'in_progress' })
    .where(eq(onlineGames.id, room.id))

  return {
    roomCode: room.roomCode,
    hostPlayerName: room.hostPlayerName,
    settings: room.gameSettings,
  }
})
```

---

## Real-time Composable

### `app/composables/useOnlineGame.ts` (NEW)

```ts
export function useOnlineGame() {
  const supabase = useSupabaseClient()
  let channel: ReturnType<typeof supabase.channel> | null = null
  const isHost = ref(false)
  const isConnected = ref(false)
  const opponentName = ref('')
  const roomCode = ref('')

  // Host: create room and listen for guest
  async function createRoom(playerName: string, settings: GameSettings) {
    const { data } = await $fetch('/api/game/online/create', {
      method: 'POST',
      body: { playerName, settings },
    })

    roomCode.value = data.roomCode
    isHost.value = true

    channel = supabase.channel(`game:${data.roomCode}`)
    channel
      .on('broadcast', { event: 'guest_joined' }, (payload) => {
        opponentName.value = payload.payload.playerName
        isConnected.value = true
      })
      .on('broadcast', { event: 'throw_intent' }, (payload) => {
        // Host validates and applies throw
        handleGuestThrow(payload.payload)
      })
      .subscribe()
  }

  // Guest: join room
  async function joinRoom(code: string, playerName: string) {
    const { data } = await $fetch('/api/game/online/join', {
      method: 'POST',
      body: { roomCode: code, playerName },
    })

    roomCode.value = code
    isHost.value = false
    opponentName.value = data.hostPlayerName

    channel = supabase.channel(`game:${code}`)
    channel
      .on('broadcast', { event: 'state_update' }, (payload) => {
        // Guest receives confirmed state from host
        updateGameState(payload.payload.state)
      })
      .on('broadcast', { event: 'game_started' }, () => {
        isConnected.value = true
      })
      .subscribe()

    // Notify host
    channel.send({
      type: 'broadcast',
      event: 'guest_joined',
      payload: { playerName },
    })
  }

  // Host: send confirmed state after each throw
  function broadcastState(state: GameState) {
    if (!channel) return
    channel.send({
      type: 'broadcast',
      event: 'state_update',
      payload: { state },
    })
  }

  // Guest: send throw intent to host for validation
  function sendThrowIntent(dart: ThrowResult) {
    if (!channel || isHost.value) return
    channel.send({
      type: 'broadcast',
      event: 'throw_intent',
      payload: { dart },
    })
  }

  function disconnect() {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
    isConnected.value = false
  }

  return {
    isHost,
    isConnected,
    opponentName,
    roomCode,
    createRoom,
    joinRoom,
    broadcastState,
    sendThrowIntent,
    disconnect,
  }
}
```

---

## Game Flow

### Host flow:
1. Create room → get room code
2. Show room code on screen (share with friend)
3. Wait for guest to join (show "Waiting..." UI)
4. Guest joins → start game with both player names
5. Host runs `GameEngine` locally
6. On host's turn: input normally, broadcast state after each throw
7. On guest's turn: receive throw intents, validate, apply, broadcast

### Guest flow:
1. Enter room code
2. Join room → receive game settings
3. Wait for host to start
4. On guest's turn: input normally, send throw intent to host
5. On host's turn: watch state updates arrive
6. Guest's `GameEngine` is read-only (state comes from host)

### Turn enforcement:
```ts
// In game.vue or useGameState
const canThrow = computed(() => {
  if (!onlineGame.isConnected) return true // offline game
  const myPlayerIndex = onlineGame.isHost ? 0 : 1
  return state.current_player_index === myPlayerIndex
})
```

---

## UI Page

### `app/pages/online.vue` (NEW)

```
┌──────────────────────────────────┐
│       Online Play                │
│                                  │
│  [Create Room]                   │
│  Host a game for a friend        │
│                                  │
│  ── OR ──                        │
│                                  │
│  Room Code: [______]             │
│  [Join Room]                     │
│                                  │
│  ── Waiting for opponent... ──   │
│  Room Code: ABC123               │
│  Share this code with your       │
│  friend to start playing!        │
└──────────────────────────────────┘
```

---

## Conflict Resolution

- **Host is authoritative**: Guest throw intents are validated by host's engine
- **Latency handling**: Show "Waiting for opponent..." during their turn
- **Disconnect handling**: If either player disconnects for >30s, offer to save/abandon
- **State snapshots**: Periodically save state to `online_games.state` for recovery

---

## Files to Create

| File | Description |
|------|-------------|
| `app/composables/useOnlineGame.ts` | Supabase Realtime game sync |
| `app/pages/online.vue` | Create/join room UI |
| `server/api/game/online/create.post.ts` | Create game room |
| `server/api/game/online/join.post.ts` | Join game room |

## Files to Modify

| File | Change |
|------|--------|
| `server/db/schema.ts` | Add `onlineGames` table |
| `app/composables/useGameState.ts` | Integrate online game broadcasts |
| `app/pages/game.vue` | Turn enforcement (disable input when opponent's turn), connection status indicator |
| `app/pages/index.vue` | Add "Online Play" button |
| `app/components/AppNav.vue` | Add "Online" nav item |
| `nuxt.config.ts` | Ensure Supabase Realtime is configured |

---

## Testing Strategy

1. **Room creation**: Generates unique codes, stores in DB
2. **Room joining**: Validates code, prevents self-join, prevents double-join
3. **State sync**: Host state broadcasts arrive at guest
4. **Turn enforcement**: Only current player can throw
5. **Disconnect handling**: Graceful cleanup
6. **Game completion**: Both players see game over, game saved correctly
