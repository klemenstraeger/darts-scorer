import type { TrainingModeState, TrainingThrowRecord } from '../../../shared/training/training-models'
import { trainingSessions, trainingThrows } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const body = await readBody<{
    session: TrainingModeState
    throws: TrainingThrowRecord[]
    stats: Record<string, unknown> | null
  }>(event)

  if (!body.session) {
    throw createError({ statusCode: 400, message: 'Missing session data' })
  }

  const session = body.session

  const [inserted] = await db
    .insert(trainingSessions)
    .values({
      userId,
      mode: session.mode,
      variant: session.config.variant ?? null,
      config: session.config,
      stats: body.stats ?? null,
      totalDarts: session.throws.length,
      completed: session.isComplete,
      startedAt: new Date(session.startedAt),
      completedAt: session.completedAt ? new Date(session.completedAt) : null,
    })
    .returning({ id: trainingSessions.id })

  const sessionId = inserted!.id

  // Bulk insert throws
  if (body.throws.length > 0) {
    await db.insert(trainingThrows).values(
      body.throws.map((t, i) => ({
        sessionId,
        throwNumber: i,
        segment: t.segment,
        multiplier: t.multiplier,
        points: t.points,
      })),
    )
  }

  return { sessionId }
})
