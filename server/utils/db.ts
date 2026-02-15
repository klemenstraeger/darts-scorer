import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../db/schema'

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined
}

function createDb() {
  const connectionString = process.env.DATABASE_URL ?? useRuntimeConfig().databaseUrl
  const client = postgres(connectionString)
  return drizzle(client, { schema })
}

export const db = globalForDb.db ?? createDb()

if (process.env.NODE_ENV !== 'production') globalForDb.db = db
