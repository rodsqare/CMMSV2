import mysql from 'mysql2/promise'

/**
 * Database initialization script
 * This runs automatically when the application starts
 * It creates tables if they don't exist
 */

export async function initializeDatabase() {
  console.log('[DB-INIT] ========== DATABASE INITIALIZATION START ==========')
  console.log('[DB-INIT] Environment check:', {
    hasDATABASE_URL: !!process.env.DATABASE_URL,
    hasMYSQL_URL: !!process.env.MYSQL_URL,
  })
  
  // Railway provides MYSQL_URL, fallback to DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL
  
  if (!databaseUrl) {
    console.error('[DB-INIT] ERROR: DATABASE_URL or MYSQL_URL not found')
    console.error('[DB-INIT] Available env vars:', Object.keys(process.env).filter(k => k.includes('SQL') || k.includes('DATABASE')))
    return
  }

  console.log('[DB-INIT] Database URL found, creating connection pool...')
  
  const pool = mysql.createPool({
    uri: databaseUrl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  })

  try {
    console.log('[DB-INIT] Checking database tables...')

    // Check if tables already exist
    const [tables] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM information_schema.tables 
       WHERE table_schema = DATABASE() 
       AND table_name = 'usuarios'`
    )
    const tableCount = (tables as any[])[0].count

    // Always ensure configuration table exists
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS configuracion (
        id INT PRIMARY KEY AUTO_INCREMENT,
        clave VARCHAR(100) NOT NULL UNIQUE,
        valor TEXT,
        descripcion VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_clave (clave)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    
    if (tableCount > 0) {
      console.log('[DB-INIT] Database tables already exist, skipping main initialization')
      await pool.end()
      return
    }

    console.log('[DB-INIT] Creating database tables...')

    // Create usuarios table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(50) NOT NULL,
        activo BOOLEAN DEFAULT TRUE,
        ultimo_acceso DATETIME,
        intentos_fallidos INT DEFAULT 0,
        bloqueado_hasta DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_rol (rol)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Create equipos table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS equipos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        tipo VARCHAR(100) NOT NULL,
        marca VARCHAR(100),
        modelo VARCHAR(100),
        numero_serie VARCHAR(100),
        ubicacion VARCHAR(255),
        fecha_adquisicion DATETIME,
        vida_util_anos INT,
        valor_adquisicion DECIMAL(10, 2),
        estado VARCHAR(50) NOT NULL,
        criticidad VARCHAR(50) NOT NULL,
        descripcion TEXT,
        especificaciones JSON,
        ultima_mantencion DATETIME,
        proxima_mantencion DATETIME,
        horas_operacion DECIMAL(10, 2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_codigo (codigo),
        INDEX idx_estado (estado),
        INDEX idx_tipo (tipo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Create ordenes_trabajo table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ordenes_trabajo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_orden VARCHAR(50) UNIQUE NOT NULL,
        equipo_id INT NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        prioridad VARCHAR(50) NOT NULL,
        estado VARCHAR(50) NOT NULL,
        descripcion TEXT NOT NULL,
        fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_programada DATETIME,
        fecha_inicio DATETIME,
        fecha_finalizacion DATETIME,
        tiempo_estimado INT,
        tiempo_real INT,
        costo_estimado DECIMAL(10, 2),
        costo_real DECIMAL(10, 2),
        creado_por INT NOT NULL,
        asignado_a INT,
        notas TEXT,
        resultado TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
        FOREIGN KEY (creado_por) REFERENCES usuarios(id),
        FOREIGN KEY (asignado_a) REFERENCES usuarios(id),
        INDEX idx_numero_orden (numero_orden),
        INDEX idx_equipo_id (equipo_id),
        INDEX idx_estado (estado),
        INDEX idx_prioridad (prioridad),
        INDEX idx_creado_por (creado_por),
        INDEX idx_asignado_a (asignado_a)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Create mantenimientos table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS mantenimientos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        equipo_id INT NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        frecuencia VARCHAR(50) NOT NULL,
        frecuencia_dias INT NOT NULL,
        ultima_realizacion DATETIME,
        proxima_programada DATETIME NOT NULL,
        descripcion TEXT NOT NULL,
        procedimiento TEXT,
        tiempo_estimado INT,
        activo BOOLEAN DEFAULT TRUE,
        creado_por INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
        FOREIGN KEY (creado_por) REFERENCES usuarios(id),
        INDEX idx_equipo_id (equipo_id),
        INDEX idx_proxima_programada (proxima_programada),
        INDEX idx_activo (activo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Create mantenimientos_realizados table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS mantenimientos_realizados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mantenimiento_id INT NOT NULL,
        equipo_id INT NOT NULL,
        fecha_realizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        realizado_por INT NOT NULL,
        tiempo_real INT,
        costo DECIMAL(10, 2),
        observaciones TEXT,
        tareas_realizadas JSON,
        estado_equipo VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (mantenimiento_id) REFERENCES mantenimientos(id) ON DELETE CASCADE,
        FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
        FOREIGN KEY (realizado_por) REFERENCES usuarios(id),
        INDEX idx_mantenimiento_id (mantenimiento_id),
        INDEX idx_equipo_id (equipo_id),
        INDEX idx_fecha_realizacion (fecha_realizacion)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Create documentos table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS documentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tipo VARCHAR(50) NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        ruta_archivo VARCHAR(500) NOT NULL,
        tipo_archivo VARCHAR(50) NOT NULL,
        tamano INT NOT NULL,
        equipo_id INT,
        orden_id INT,
        subido_por INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
        FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
        FOREIGN KEY (subido_por) REFERENCES usuarios(id),
        INDEX idx_equipo_id (equipo_id),
        INDEX idx_orden_id (orden_id),
        INDEX idx_tipo (tipo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Create notificaciones table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        mensaje TEXT NOT NULL,
        leida BOOLEAN DEFAULT FALSE,
        fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
        datos JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_leida (leida),
        INDEX idx_tipo (tipo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Create logs table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT,
        accion VARCHAR(100) NOT NULL,
        modulo VARCHAR(50) NOT NULL,
        descripcion TEXT NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        datos JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_accion (accion),
        INDEX idx_modulo (modulo),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Create configuration table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS configuracion (
        id INT PRIMARY KEY AUTO_INCREMENT,
        clave VARCHAR(100) NOT NULL UNIQUE,
        valor TEXT,
        descripcion VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_clave (clave)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    console.log('[DB-INIT] Database tables created successfully')
    
    // Insert default admin user if no users exist
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM usuarios')
    const userCount = (users as any[])[0].count

    if (userCount === 0) {
      console.log('[DB-INIT] Creating default admin user...')
      const bcrypt = await import('bcryptjs')
      const hashedPassword = await bcrypt.hash('admin123', 10)
      
      await pool.execute(
        `INSERT INTO usuarios (nombre, email, password, rol, activo, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        ['Administrador', 'admin@cmms.com', hashedPassword, 'administrador', true]
      )
      
      console.log('[DB-INIT] Default admin user created (email: admin@cmms.com, password: admin123)')
    }

    await pool.end()
    console.log('[DB-INIT] Database initialization completed successfully')
  } catch (error) {
    console.error('[DB-INIT] Error initializing database:', error)
    await pool.end()
    throw error
  }
}
