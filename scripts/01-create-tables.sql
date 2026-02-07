-- Medical Equipment Management System Database Schema
-- Hospital Dr Beningo Sánchez CMMS

-- Table: usuarios (Users/Technicians)
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  correo VARCHAR(255) UNIQUE NOT NULL,
  contrasena VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('administrador', 'supervisor', 'tecnico')),
  especialidad VARCHAR(100),
  estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  permisos JSONB DEFAULT '{}',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: equipos (Equipment)
CREATE TABLE IF NOT EXISTS equipos (
  id SERIAL PRIMARY KEY,
  numero_serie VARCHAR(100) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  modelo VARCHAR(100),
  fabricante VARCHAR(100),
  ubicacion VARCHAR(255),
  fecha_instalacion DATE,
  ultima_calibracion DATE,
  ultima_inspeccion DATE,
  estado VARCHAR(50) DEFAULT 'operativo' CHECK (estado IN ('operativo', 'en_reparacion', 'fuera_de_servicio')),
  es_critico BOOLEAN DEFAULT false,
  voltaje VARCHAR(20),
  frecuencia VARCHAR(20),
  fecha_retiro DATE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: ordenes_trabajo (Work Orders)
CREATE TABLE IF NOT EXISTS ordenes_trabajo (
  id SERIAL PRIMARY KEY,
  equipo_id INTEGER REFERENCES equipos(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  prioridad VARCHAR(20) NOT NULL CHECK (prioridad IN ('baja', 'media', 'critica')),
  estado VARCHAR(30) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'en_progreso', 'completada', 'pospuesta')),
  tecnico_asignado_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_completado TIMESTAMP,
  notas TEXT
);

-- Table: mantenimiento_preventivo (Preventive Maintenance Schedules)
CREATE TABLE IF NOT EXISTS mantenimiento_preventivo (
  id SERIAL PRIMARY KEY,
  equipo_id INTEGER REFERENCES equipos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('calibracion', 'inspeccion', 'limpieza')),
  frecuencia VARCHAR(20) NOT NULL CHECK (frecuencia IN ('mensual', 'trimestral', 'semestral', 'anual')),
  proxima_fecha DATE NOT NULL,
  ultima_fecha DATE,
  resultado VARCHAR(50) CHECK (resultado IN ('completado', 'pendiente', 'vencido')),
  observaciones TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: documentos (Documents associated with equipment)
CREATE TABLE IF NOT EXISTS documentos (
  id SERIAL PRIMARY KEY,
  equipo_id INTEGER REFERENCES equipos(id) ON DELETE CASCADE,
  nombre_archivo VARCHAR(255) NOT NULL,
  tipo_archivo VARCHAR(50),
  tamano_kb INTEGER,
  url_archivo TEXT,
  fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  subido_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Table: historial_tareas (Task History for Equipment)
CREATE TABLE IF NOT EXISTS historial_tareas (
  id SERIAL PRIMARY KEY,
  equipo_id INTEGER REFERENCES equipos(id) ON DELETE CASCADE,
  tipo_tarea VARCHAR(50) NOT NULL CHECK (tipo_tarea IN ('mantenimiento', 'calibracion', 'inspeccion', 'reparacion')),
  descripcion TEXT,
  fecha_tarea DATE NOT NULL,
  resultado VARCHAR(100),
  realizado_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: logs_auditoria (Audit Logs)
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  accion VARCHAR(100) NOT NULL,
  detalle TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: notificaciones (Notifications)
CREATE TABLE IF NOT EXISTS notificaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('warning', 'info', 'success', 'error')),
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: reportes (Reports)
CREATE TABLE IF NOT EXISTS reportes (
  id SERIAL PRIMARY KEY,
  tipo_reporte VARCHAR(50) NOT NULL,
  generado_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  parametros JSONB,
  fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  url_archivo TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_equipos_estado ON equipos(estado);
CREATE INDEX idx_equipos_ubicacion ON equipos(ubicacion);
CREATE INDEX idx_equipos_numero_serie ON equipos(numero_serie);
CREATE INDEX idx_ordenes_estado ON ordenes_trabajo(estado);
CREATE INDEX idx_ordenes_prioridad ON ordenes_trabajo(prioridad);
CREATE INDEX idx_ordenes_tecnico ON ordenes_trabajo(tecnico_asignado_id);
CREATE INDEX idx_mantenimiento_proxima_fecha ON mantenimiento_preventivo(proxima_fecha);
CREATE INDEX idx_mantenimiento_equipo ON mantenimiento_preventivo(equipo_id);
CREATE INDEX idx_logs_usuario ON logs_auditoria(usuario_id);
CREATE INDEX idx_logs_fecha ON logs_auditoria(created_at);
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_actualizacion = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with ultima_actualizacion
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipos_updated_at BEFORE UPDATE ON equipos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
