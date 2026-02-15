# Feature 15 — Social Features

**Priority:** 18 (Low) | **Effort:** Large | **Impact:** Medium
**Depends on:** Feature #11 (Online Multiplayer) for challenges to work as live games

---

## Summary

Friend lists, game challenges, and activity feeds to create community engagement. Players can add friends, challenge them to games, and see each other's activity.

---

## Database

### `server/db/schema.ts`

```ts
export const friendships = pgTable('friendships', {
  id: serial('id').primaryKey(),
  fromUserId: uuid('from_user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  toUserId: uuid('to_user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'), // pending | accepted | rejected
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique().on(table.fromUserId, table.toUserId),
])

export const challenges = pgTable('challenges', {
  id: serial('id').primaryKey(),
  fromUserId: uuid('from_user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  toUserId: uuid('to_user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  gameSettings: jsonb('game_settings').notNull(), // { mode, checkout, legs_to_win, sets_to_win }
  message: text('message'),  // optional challenge message
  status: text('status').notNull().default('pending'), // pending | accepted | declined | completed | expired
  onlineGameId: integer('online_game_id'), // links to online game room when accepted
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const activityFeed = pgTable('activity_feed', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // game_completed | achievement_unlocked | tournament_won | friend_added
  data: jsonb('data').notNull(), // event-specific payload
  visibility: text('visibility').notNull().default('friends'), // friends | public
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

---

## Friend System

### API Endpoints

```
GET    /api/friends                     — List friends (accepted)
GET    /api/friends/requests            — List pending incoming requests
POST   /api/friends/request             — Send friend request (by display name)
POST   /api/friends/[id]/accept         — Accept request
POST   /api/friends/[id]/reject         — Reject request
DELETE /api/friends/[id]                — Remove friend
```

### Friend Request Flow

1. User searches by display name (profile.displayName)
2. Send friend request → status = 'pending'
3. Recipient sees in their requests list
4. Accept → status = 'accepted', bidirectional friendship
5. Reject → status = 'rejected'

### `server/api/friends/request.post.ts` (NEW)

```ts
export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event)
  const { displayName } = await readBody(event)

  // Find target user by display name
  const [target] = await db.select().from(profiles)
    .where(eq(profiles.displayName, displayName))

  if (!target) throw createError({ statusCode: 404, message: 'User not found' })
  if (target.id === userId) throw createError({ statusCode: 400, message: 'Cannot add yourself' })

  // Check existing friendship
  const existing = await db.select().from(friendships)
    .where(or(
      and(eq(friendships.fromUserId, userId), eq(friendships.toUserId, target.id)),
      and(eq(friendships.fromUserId, target.id), eq(friendships.toUserId, userId)),
    ))

  if (existing.length > 0) throw createError({ statusCode: 400, message: 'Friendship already exists' })

  await db.insert(friendships).values({
    fromUserId: userId,
    toUserId: target.id,
    status: 'pending',
  })

  return { success: true }
})
```

---

## Challenge System

### API Endpoints

```
POST   /api/challenges                  — Send challenge to friend
GET    /api/challenges                  — List my challenges (sent + received)
POST   /api/challenges/[id]/accept      — Accept challenge → creates online game room
POST   /api/challenges/[id]/decline     — Decline challenge
```

### Challenge Flow

1. Player selects a friend → configures game settings → sends challenge
2. Recipient sees challenge notification
3. Accept → auto-creates online game room (Feature #11) → both redirected to game
4. Decline → challenge marked as declined
5. Challenges expire after 24h

---

## Activity Feed

### Event Types

| Type | Data | Example |
|------|------|---------|
| `game_completed` | `{ mode, opponent, result, avg }` | "Alice beat Bob in 501 (avg 78.2)" |
| `achievement_unlocked` | `{ type, name }` | "Alice unlocked Maximum! (first 180)" |
| `tournament_won` | `{ tournament, name }` | "Alice won Friday Night Darts" |
| `friend_added` | `{ friendName }` | "Alice and Bob are now friends" |
| `elo_milestone` | `{ elo, playerName }` | "Alice reached 1600 Elo" |

### API

```
GET /api/activity                       — My activity + friends' activity
```

### Generating Activity

Add activity creation to existing flows:
- `server/utils/save-game.ts` → create `game_completed` activity
- `server/utils/achievements.ts` → create `achievement_unlocked` activity
- `server/api/friends/[id]/accept.post.ts` → create `friend_added` activity

---

## UI Pages

### `app/pages/friends.vue` (NEW)

```
┌──────────────────────────────────┐
│  Friends                          │
│                                  │
│  ── Pending Requests (2) ──      │
│  Bob wants to be friends          │
│  [Accept] [Reject]               │
│                                  │
│  ── My Friends ──                │
│  Alice (1523 Elo) [Challenge]    │
│  Carol (1487 Elo) [Challenge]    │
│                                  │
│  ── Add Friend ──                │
│  [Search by name...]  [Send]     │
└──────────────────────────────────┘
```

### `app/pages/activity.vue` (NEW)

```
┌──────────────────────────────────┐
│  Activity                        │
│                                  │
│  Today                           │
│  Alice beat Bob in 501 (78.2 avg)│
│  Carol unlocked "Maximum!" 🎯    │
│                                  │
│  Yesterday                       │
│  Bob won Friday Night Darts      │
│  Alice reached 1600 Elo          │
└──────────────────────────────────┘
```

### `app/components/ChallengeModal.vue` (NEW)

Game settings picker for sending a challenge:

```vue
<template>
  <div class="modal">
    <h3>Challenge {{ friendName }}</h3>
    <GameSettingsPanel v-model:game-mode="mode" ... />
    <textarea v-model="message" placeholder="Add a message (optional)" />
    <button @click="sendChallenge">Send Challenge</button>
  </div>
</template>
```

---

## Files to Create

| File | Description |
|------|-------------|
| `server/api/friends/index.get.ts` | List friends |
| `server/api/friends/requests.get.ts` | List pending requests |
| `server/api/friends/request.post.ts` | Send friend request |
| `server/api/friends/[id]/accept.post.ts` | Accept request |
| `server/api/friends/[id]/reject.post.ts` | Reject request |
| `server/api/friends/[id].delete.ts` | Remove friend |
| `server/api/challenges/index.get.ts` | List challenges |
| `server/api/challenges/index.post.ts` | Send challenge |
| `server/api/challenges/[id]/accept.post.ts` | Accept challenge |
| `server/api/challenges/[id]/decline.post.ts` | Decline challenge |
| `server/api/activity/index.get.ts` | Activity feed |
| `app/pages/friends.vue` | Friends management |
| `app/pages/activity.vue` | Activity feed |
| `app/components/ChallengeModal.vue` | Challenge configuration |

## Files to Modify

| File | Change |
|------|--------|
| `server/db/schema.ts` | Add `friendships`, `challenges`, `activityFeed` tables |
| `server/utils/save-game.ts` | Create activity on game completion |
| `server/utils/achievements.ts` | Create activity on achievement unlock |
| `app/components/AppNav.vue` | Add Friends, Activity nav items with badge counts |

---

## Notification Badges

Show unread count on nav items:
- Friends: pending request count
- Challenges: pending challenge count
- Activity: new items since last viewed

---

## Testing Strategy

1. **Friend requests**: Send, accept, reject, remove, duplicate prevention
2. **Challenges**: Create, accept (creates online game), decline, expiry
3. **Activity feed**: Events created on game save, achievement unlock
4. **Privacy**: Only see friends' activity, not strangers'
5. **Self-referential**: Can't friend/challenge yourself
