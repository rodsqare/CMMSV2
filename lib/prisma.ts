import { PrismaClient } from '@prisma/client'
import { initializeDatabase } from './db-init'

const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient
  dbInitialized: boolean
  dbInitPromise?: Promise<void>
}

// Initialize Prisma Client
// Prisma 5 reads datasource URL from schema.prisma
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Initialize database tables on first connection
if (!globalForPrisma.dbInitialized && !globalForPrisma.dbInitPromise) {
  console.log('[PRISMA] Starting database initialization...')
  globalForPrisma.dbInitPromise = initializeDatabase()
    .then(() => {
      console.log('[PRISMA] Database initialization completed')
      globalForPrisma.dbInitialized = true
      globalForPrisma.dbInitPromise = undefined
    })
    .catch((error) => {
      console.error('[PRISMA] Failed to initialize database:', error)
      globalForPrisma.dbInitPromise = undefined
    })
}

// Export a function to wait for initialization
export async function waitForDbInit() {
  if (globalForPrisma.dbInitPromise) {
    await globalForPrisma.dbInitPromise
  }
}
