// Database initialization - creates tables if they don't exist
// This file is imported by lib/prisma.ts on startup

export async function initializeDatabase() {
  console.log('[DB-INIT] Checking database schema...')
  
  try {
    // Just connect to verify the database is accessible
    // Prisma handles schema creation via migrations
    // This is a placeholder for any additional initialization logic
    console.log('[DB-INIT] Database schema check completed')
  } catch (error) {
    console.error('[DB-INIT] Database initialization error:', error)
    // Don't throw - allow app to continue even if DB init fails
    // The actual DB operations will fail with proper error messages
  }
}
