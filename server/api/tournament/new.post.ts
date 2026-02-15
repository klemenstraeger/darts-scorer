export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const body = await readBody<{
    name: string
    format: 'knockout' | 'league' | 'group_only' | 'group_knockout'
    playerNames: string[]
    gameMode?: string
    checkout?: string
    legsToWin?: number
    setsToWin?: number
    groupCount?: number
    advancePerGroup?: number
  }>(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, message: 'Tournament name is required' })
  }

  if (!body.format) {
    throw createError({ statusCode: 400, message: 'Format is required' })
  }

  if (!body.playerNames || body.playerNames.length < 2) {
    throw createError({ statusCode: 400, message: 'At least 2 players required' })
  }

  if (body.playerNames.length > 16) {
    throw createError({ statusCode: 400, message: 'Maximum 16 players' })
  }

  return tournamentManager.create(userId, {
    name: body.name.trim(),
    format: body.format,
    playerNames: body.playerNames,
    gameMode: body.gameMode,
    checkout: body.checkout,
    legsToWin: body.legsToWin,
    setsToWin: body.setsToWin,
    groupCount: body.groupCount,
    advancePerGroup: body.advancePerGroup,
  })
})
