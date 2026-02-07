-- Medical Equipment Management System Database Schema for MySQL
-- Hospital Dr Beningo Sánchez CMMS

-- Table: usuarios (Users/Technicians)
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  correo VARCHAR(255) UNIQUE NOT NULL,
  contrasena VARCHAR(255) NOT NULL,
  rol ENUM('administrador', 'supervisor', 'tecnico') NOT NULL,
  especialidad VARCHAR(100),
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  permisos JSON DEFAULT '{}',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_correo (correo),
  INDEX idx_rol (rol),
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: equipos (Equipment)
CREATE TABLE IF NOT EXISTS equipos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_serie VARCHAR(100) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  modelo VARCHAR(100),
  fabricante VARCHAR(100),
  ubicacion VARCHAR(255),
  fecha_instalacion DATE,
  ultima_calibracion DATE,
  ultima_inspeccion DATE,
  estado ENUM('operativo', 'en_reparacion', 'fuera_de_servicio') DEFAULT 'operativo',
  es_critico BOOLEAN DEFAULT false,
  voltaje VARCHAR(20),
  frecuencia VARCHAR(20),
  fecha_retiro DATE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_numero_serie (numero_serie),
  INDEX idx_estado (estado),
  INDEX idx_ubicacion (ubicacion),
  INDEX idx_es_critico (es_critico)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ordenes_trabajo (Work Orders)
CREATE TABLE IF NOT EXISTS ordenes_trabajo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL,
  descripcion TEXT NOT NULL,
  prioridad ENUM('baja', 'media', 'critica') NOT NULL,
  estado ENUM('abierta', 'en_progreso', 'completada', 'pospuesta') DEFAULT 'abierta',
  tecnico_asignado_id INT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_completado TIMESTAMP NULL,
  notas TEXT,
  INDEX idx_equipo_id (equipo_id),
  INDEX idx_tecnico_asignado_id (tecnico_asignado_id),
  INDEX idx_estado (estado),
  INDEX idx_prioridad (prioridad),
  CONSTRAINT fk_ot_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
  CONSTRAINT fk_ot_tecnico FOREIGN KEY (tecnico_asignado_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: mantenimiento_preventivo (Preventive Maintenance Schedules)
CREATE TABLE IF NOT EXISTS mantenimiento_preventivo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL,
  tipo ENUM('calibracion', 'inspeccion', 'limpieza') NOT NULL,
  frecuencia ENUM('mensual', 'trimestral', 'semestral', 'anual') NOT NULL,
  proxima_fecha DATE NOT NULL,
  ultima_fecha DATE,
  resultado ENUM('completado', 'pendiente', 'vencido'),
  observaciones TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_equipo_id (equipo_id),
  INDEX idx_proxima_fecha (proxima_fecha),
  INDEX idx_resultado (resultado),
  CONSTRAINT fk_mp_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: documentos (Documents associated with equipment)
CREATE TABLE IF NOT EXISTS documentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  tipo_archivo VARCHAR(50),
  tamano_kb INT,
  url_archivo TEXT,
  fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  subido_por_id INT,
  INDEX idx_equipo_id (equipo_id),
  INDEX idx_subido_por_id (subido_por_id),
  CONSTRAINT fk_doc_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
  CONSTRAINT fk_doc_usuario FOREIGN KEY (subido_por_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: historial_tareas (Task History for Equipment)
CREATE TABLE IF NOT EXISTS historial_tareas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL,
  tipo_tarea ENUM('mantenimiento', 'calibracion', 'inspeccion', 'reparacion') NOT NULL,
  descripcion TEXT,
  fecha_tarea DATE NOT NULL,
  resultado VARCHAR(100),
  realizado_por_id INT,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_equipo_id (equipo_id),
  INDEX idx_realizado_por_id (realizado_por_id),
  INDEX idx_fecha_tarea (fecha_tarea),
  CONSTRAINT fk_ht_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
  CONSTRAINT fk_ht_usuario FOREIGN KEY (realizado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: logs_auditoria (Audit Logs)
-- Updated to use created_at and updated_at instead of fecha_hora
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  accion VARCHAR(100) NOT NULL,
  detalle TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_created_at (created_at),
  INDEX idx_accion (accion),
  CONSTRAINT fk_log_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: notificaciones (Notifications)
CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo ENUM('warning', 'info', 'success', 'error') NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_leida (leida),
  INDEX idx_fecha_creacion (fecha_creacion),
  CONSTRAINT fk_notif_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: reportes (Reports)
CREATE TABLE IF NOT EXISTS reportes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo_reporte VARCHAR(50) NOT NULL,
  generado_por_id INT,
  parametros JSON,
  fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  url_archivo TEXT,
  INDEX idx_generado_por_id (generado_por_id),
  INDEX idx_fecha_generacion (fecha_generacion),
  CONSTRAINT fk_reporte_usuario FOREIGN KEY (generado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
