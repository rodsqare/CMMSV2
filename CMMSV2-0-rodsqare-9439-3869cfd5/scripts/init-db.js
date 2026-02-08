#!/usr/bin/env node

/**
 * Database Initialization Script for Railway MySQL
 * Ejecuta automáticamente durante el despliegue en Railway
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Función para obtener las credenciales de la base de datos
function getDatabaseConfig() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    // Usar las variables de entorno individuales
    return {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
  }

  // Parsear DATABASE_URL (formato: mysql://user:password@host:port/database)
  try {
    const url = new URL(dbUrl);
    return {
      host: url.hostname,
      user: url.username,
      password: decodeURIComponent(url.password),
      port: parseInt(url.port || '3306'),
      database: url.pathname.replace('/', ''),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error.message);
    process.exit(1);
  }
}

// Función para ejecutar el script SQL
async function initializeDatabase() {
  console.log('[INIT-DB] Iniciando inicialización de base de datos MySQL...');
  
  const config = getDatabaseConfig();
  console.log('[INIT-DB] Conectando a:', {
    host: config.host,
    user: config.user,
    port: config.port,
  });

  let connection;
  try {
    // Crear conexión
    connection = await mysql.createConnection(config);
    console.log('[INIT-DB] Conexión exitosa a MySQL');

    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'init-mysql.sql');
    if (!fs.existsSync(sqlFile)) {
      console.error('[INIT-DB] Error: No se encontró el archivo init-mysql.sql');
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    console.log('[INIT-DB] Archivo SQL leído exitosamente');

    // Dividir en sentencias individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`[INIT-DB] Ejecutando ${statements.length} sentencias SQL...`);

    // Ejecutar cada sentencia
    let executedCount = 0;
    for (const statement of statements) {
      try {
        await connection.query(statement);
        executedCount++;
        
        // Log cada 5 sentencias
        if (executedCount % 5 === 0) {
          console.log(`[INIT-DB] ${executedCount}/${statements.length} sentencias ejecutadas`);
        }
      } catch (error) {
        // Ignorar errores de "ya existe"
        if (error.code === 'ER_DB_CREATE_EXISTS' || 
            error.code === 'ER_TABLE_EXISTS_ERROR' ||
            error.message.includes('already exists')) {
          console.log(`[INIT-DB] ✓ (ya existe) ${statement.substring(0, 50)}...`);
        } else {
          console.error(`[INIT-DB] Error ejecutando sentencia: ${statement.substring(0, 80)}...`);
          console.error(`[INIT-DB] Error: ${error.message}`);
          // Continuar con las siguientes sentencias
        }
      }
    }

    console.log(`[INIT-DB] ✅ Inicialización completada: ${executedCount} sentencias ejecutadas`);

    // Mostrar información de la base de datos creada
    const [databases] = await connection.query('SHOW DATABASES;');
    console.log('[INIT-DB] Bases de datos disponibles:', databases.map(db => db.Database).join(', '));

    // Mostrar tablas creadas
    try {
      const [tables] = await connection.query('SHOW TABLES FROM cmms_biomedico;');
      console.log(`[INIT-DB] Tablas creadas: ${tables.length} tablas`);
      tables.forEach(table => {
        const tableName = table[`Tables_in_cmms_biomedico`];
        console.log(`  - ${tableName}`);
      });
    } catch (error) {
      console.log('[INIT-DB] No se pudo listar las tablas (base de datos aún no existe)');
    }

    process.exit(0);
  } catch (error) {
    console.error('[INIT-DB] Error fatal:', error.message);
    console.error('[INIT-DB] Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('[INIT-DB] Conexión cerrada');
    }
  }
}

// Esperar a que haya conexión a la base de datos (útil en Railway)
async function waitForDatabase(maxRetries = 30, retryDelay = 1000) {
  const config = getDatabaseConfig();
  let retries = 0;

  console.log('[INIT-DB] Esperando disponibilidad de la base de datos...');

  while (retries < maxRetries) {
    try {
      const connection = await mysql.createConnection(config);
      await connection.end();
      console.log('[INIT-DB] Base de datos disponible');
      return;
    } catch (error) {
      retries++;
      if (retries < maxRetries) {
        console.log(`[INIT-DB] Intento ${retries}/${maxRetries} - Reintentando en ${retryDelay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error('[INIT-DB] No se pudo conectar a la base de datos después de varios intentos');
        process.exit(1);
      }
    }
  }
}

// Ejecutar inicialización
(async () => {
  try {
    // Skip initialization during build phase if database is not available
    const isDatabaseConfigured = process.env.DATABASE_URL || 
                                 (process.env.DB_HOST && process.env.DB_USER);
    
    if (!isDatabaseConfigured && process.env.NODE_ENV === 'production') {
      console.log('[INIT-DB] ⏭️ Skipping database initialization - database not configured for build phase');
      console.log('[INIT-DB] Run "npm run init-db" after deployment when database is available');
      process.exit(0);
    }

    if (!isDatabaseConfigured) {
      console.warn('[INIT-DB] ⚠️ Database configuration not found. Skipping initialization.');
      process.exit(0);
    }

    await waitForDatabase();
    await initializeDatabase();
  } catch (error) {
    console.error('[INIT-DB] Error:', error);
    process.exit(1);
  }
})();
