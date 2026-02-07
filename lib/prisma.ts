import { PrismaClient } from '@prisma/client'
import { PrismaMySql } from '@prisma/adapter-mysql'
import mysql from 'mysql2/promise'

const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient
  connectionPool: mysql.Pool 
}

// Create a connection pool for MySQL
const connectionPool = globalForPrisma.connectionPool || mysql.createPool({
  uri: process.env.DATABASE_URL,
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.connectionPool = connectionPool
}

// Create the adapter
const adapter = new PrismaMySql(connectionPool)

// Initialize Prisma Client with adapter
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
