import { PrismaClient } from '@prisma/client'
import { initializeDatabase } from './db/db-init'

const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient | undefined
  dbInitialized: boolean
  dbInitPromise?: Promise<void>
}

// Initialize Prisma Client with error handling
let prismaInstance: PrismaClient | undefined

function createPrismaInstance(): PrismaClient {
  if (prismaInstance) {
    return prismaInstance
  }

  console.log('[PRISMA] Creating new PrismaClient instance...')
  
  prismaInstance = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  // Handle connection errors
  prismaInstance.$on('error' as never, (error: any) => {
    console.error('[PRISMA] Error event:', error)
  })

  return prismaInstance
}

// Initialize Prisma Client
export const prisma = globalForPrisma.prisma || createPrismaInstance()

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
      // Don't throw - allow app to continue
    })
}

// Export a function to wait for initialization
export async function waitForDbInit() {
  if (globalForPrisma.dbInitPromise) {
    try {
      await globalForPrisma.dbInitPromise
    } catch (error) {
      console.error('[PRISMA] Error waiting for DB init:', error)
      // Don't throw - allow operations to proceed
    }
  }
}

// Ensure prisma is properly initialized
if (!prisma) {
  console.error('[PRISMA] ERROR: Prisma client is not initialized!')
  process.exit(1)
}

