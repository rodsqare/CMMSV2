-- ============================================
-- CMMS Biomédico - Base de Datos MySQL
-- Auto-initialize script para Railway
-- ============================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS cmms_biomedico;
USE cmms_biomedico;

-- ============================================
-- TABLA: Usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  correo VARCHAR(255) UNIQUE NOT NULL,
  contrasena VARCHAR(255) NOT NULL,
  rol ENUM('Técnico', 'Supervisor', 'Administrador') DEFAULT 'Técnico',
  especialidad VARCHAR(255),
  estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_correo (correo),
  INDEX idx_estado (estado),
  INDEX idx_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: Equipos
-- ============================================
CREATE TABLE IF NOT EXISTS equipos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_serie VARCHAR(255) UNIQUE NOT NULL,
  nombre_equipo VARCHAR(255) NOT NULL,
  modelo VARCHAR(255),
  fabricante VARCHAR(255),
  ubicacion VARCHAR(255),
  estado ENUM('operativo', 'mantenimiento', 'en reparacion', 'fuera de servicio', 'nuevo') DEFAULT 'nuevo',
  voltaje VARCHAR(50),
  frecuencia VARCHAR(50),
  fecha_adquisicion DATE,
  fecha_instalacion DATE,
  fecha_ultimo_mantenimiento DATE,
  proximo_mantenimiento DATE,
  observaciones TEXT,
  codigo_institucional VARCHAR(255),
  servicio VARCHAR(255),
  vencimiento_garantia DATE,
  fecha_ingreso DATE,
  procedencia VARCHAR(255),
  potencia VARCHAR(100),
  corriente VARCHAR(100),
  otros_especificaciones TEXT,
  accesorios_consumibles TEXT,
  estado_equipo ENUM('nuevo', 'operativo', 'no_operable') DEFAULT 'nuevo',
  manual_usuario BOOLEAN DEFAULT FALSE,
  manual_servicio BOOLEAN DEFAULT FALSE,
  nivel_riesgo ENUM('alto', 'medio', 'bajo') DEFAULT 'medio',
  proveedor_nombre VARCHAR(255),
  proveedor_direccion VARCHAR(255),
  proveedor_telefono VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_numero_serie (numero_serie),
  INDEX idx_estado (estado),
  INDEX idx_ubicacion (ubicacion),
  INDEX idx_fabricante (fabricante),
  INDEX idx_proximo_mantenimiento (proximo_mantenimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: Mantenimientos
-- ============================================
CREATE TABLE IF NOT EXISTS mantenimientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_equipo INT NOT NULL,
  tipo ENUM('preventivo', 'correctivo') DEFAULT 'preventivo',
  frecuencia ENUM('diaria', 'semanal', 'mensual', 'trimestral', 'semestral', 'anual', 'unica') DEFAULT 'mensual',
  proxima_fecha DATE,
  ultima_fecha DATE,
  resultado ENUM('pendiente', 'en_progreso', 'completado', 'rechazado', 'pausado') DEFAULT 'pendiente',
  observaciones TEXT,
  responsable_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_equipo) REFERENCES equipos(id) ON DELETE CASCADE,
  FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_id_equipo (id_equipo),
  INDEX idx_responsable_id (responsable_id),
  INDEX idx_proxima_fecha (proxima_fecha),
  INDEX idx_resultado (resultado),
  INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: Órdenes de Trabajo
-- ============================================
CREATE TABLE IF NOT EXISTS ordenes_trabajo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_orden VARCHAR(255) UNIQUE NOT NULL,
  id_equipo INT NOT NULL,
  id_usuario_creador INT NOT NULL,
  id_usuario_asignado INT,
  tipo ENUM('preventivo', 'correctivo', 'emergencia') DEFAULT 'correctivo',
  estado ENUM('abierta', 'en_proceso', 'pausada', 'completada', 'cancelada') DEFAULT 'abierta',
  prioridad ENUM('baja', 'media', 'alta', 'critica') DEFAULT 'media',
  descripcion TEXT,
  observaciones TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_inicio DATE,
  fecha_estimada_finalizacion DATE,
  fecha_finalizacion DATE,
  tiempo_horas DECIMAL(10, 2),
  costo_estimado DECIMAL(12, 2),
  costo_real DECIMAL(12, 2),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_equipo) REFERENCES equipos(id) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario_creador) REFERENCES usuarios(id) ON DELETE RESTRICT,
  FOREIGN KEY (id_usuario_asignado) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_numero_orden (numero_orden),
  INDEX idx_id_equipo (id_equipo),
  INDEX idx_estado (estado),
  INDEX idx_prioridad (prioridad),
  INDEX idx_id_usuario_asignado (id_usuario_asignado),
  INDEX idx_fecha_creacion (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: Documentos
-- ============================================
CREATE TABLE IF NOT EXISTS documentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_equipo INT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  tipo ENUM('manual', 'especificaciones', 'garantia', 'certificado', 'otro') DEFAULT 'otro',
  url VARCHAR(500) NOT NULL,
  ruta_almacenamiento VARCHAR(500),
  tamaño_bytes INT,
  fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  subido_por INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_equipo) REFERENCES equipos(id) ON DELETE CASCADE,
  FOREIGN KEY (subido_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_id_equipo (id_equipo),
  INDEX idx_tipo (tipo),
  INDEX idx_fecha_subida (fecha_subida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: Logs de Actividad
-- ============================================
CREATE TABLE IF NOT EXISTS logs_actividad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT,
  modulo VARCHAR(100),
  accion VARCHAR(100),
  descripcion TEXT,
  tabla_afectada VARCHAR(100),
  id_registro INT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_id_usuario (id_usuario),
  INDEX idx_timestamp (timestamp),
  INDEX idx_modulo (modulo),
  INDEX idx_tabla_afectada (tabla_afectada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: Notificaciones
-- ============================================
CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  tipo ENUM('mantenimiento', 'orden_trabajo', 'equipo', 'sistema') DEFAULT 'sistema',
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  leida BOOLEAN DEFAULT FALSE,
  id_referencia INT,
  tabla_referencia VARCHAR(100),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_id_usuario (id_usuario),
  INDEX idx_leida (leida),
  INDEX idx_tipo (tipo),
  INDEX idx_fecha_creacion (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: Permisos de Usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS permisos_usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  gestionEquipos BOOLEAN DEFAULT FALSE,
  gestionUsuarios BOOLEAN DEFAULT FALSE,
  ordenesTrabajoCrear BOOLEAN DEFAULT FALSE,
  ordenesTrabajoAsignar BOOLEAN DEFAULT FALSE,
  ordenesTrabajoEjecutar BOOLEAN DEFAULT FALSE,
  mantenimientoPreventivo BOOLEAN DEFAULT FALSE,
  reportesGenerar BOOLEAN DEFAULT FALSE,
  reportesVer BOOLEAN DEFAULT FALSE,
  logsAcceso BOOLEAN DEFAULT FALSE,
  configuracionSistema BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_usuario (id_usuario),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insertar datos de ejemplo (OPCIONAL)
-- ============================================

-- Usuario Administrador
INSERT IGNORE INTO usuarios (nombre, correo, contrasena, rol, estado) 
VALUES ('Administrador', 'admin@cmms.local', '$2y$10$3H4Z5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5', 'Administrador', 'Activo');

-- Usuario Supervisor
INSERT IGNORE INTO usuarios (nombre, correo, contrasena, rol, especialidad, estado) 
VALUES ('Supervisor', 'supervisor@cmms.local', '$2y$10$3H4Z5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5', 'Supervisor', 'General', 'Activo');

-- Usuarios Técnicos
INSERT IGNORE INTO usuarios (nombre, correo, contrasena, rol, especialidad, estado) 
VALUES 
  ('Juan Pérez', 'juan@cmms.local', '$2y$10$3H4Z5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5', 'Técnico', 'Electrónica', 'Activo'),
  ('María García', 'maria@cmms.local', '$2y$10$3H4Z5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5', 'Técnico', 'Mecánica', 'Activo'),
  ('Carlos Rodríguez', 'carlos@cmms.local', '$2y$10$3H4Z5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5', 'Técnico', 'Hidráulica', 'Activo');

-- Asignar permisos al Administrador
INSERT IGNORE INTO permisos_usuarios (id_usuario, gestionEquipos, gestionUsuarios, ordenesTrabajoCrear, ordenesTrabajoAsignar, ordenesTrabajoEjecutar, mantenimientoPreventivo, reportesGenerar, reportesVer, logsAcceso, configuracionSistema)
SELECT id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE FROM usuarios WHERE rol = 'Administrador' LIMIT 1;

-- Asignar permisos al Supervisor
INSERT IGNORE INTO permisos_usuarios (id_usuario, gestionEquipos, ordenesTrabajoCrear, ordenesTrabajoAsignar, ordenesTrabajoEjecutar, mantenimientoPreventivo, reportesGenerar, reportesVer, logsAcceso)
SELECT id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE FROM usuarios WHERE rol = 'Supervisor' LIMIT 1;

-- Asignar permisos a Técnicos
INSERT IGNORE INTO permisos_usuarios (id_usuario, ordenesTrabajoEjecutar, reportesVer)
SELECT id, TRUE, TRUE FROM usuarios WHERE rol = 'Técnico';
