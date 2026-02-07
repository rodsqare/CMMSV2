-- Script para resetear la tabla logs_auditoria
-- Esto eliminará todos los registros y recreará la tabla con la estructura correcta

-- Eliminar la tabla si existe
DROP TABLE IF EXISTS logs_auditoria;

-- Recrear la tabla con la estructura correcta
CREATE TABLE logs_auditoria (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT UNSIGNED NULL,
    accion VARCHAR(255) NOT NULL,
    detalle TEXT NULL,
    ip_address VARCHAR(255) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_accion (accion),
    INDEX idx_created_at (created_at),
    
    CONSTRAINT fk_logs_usuario 
        FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar algunos registros de ejemplo
INSERT INTO logs_auditoria (usuario_id, accion, detalle, ip_address, created_at, updated_at) VALUES
(1, 'login', 'Usuario admin inició sesión', '127.0.0.1', '2025-01-06 10:15:00', '2025-01-06 10:15:00'),
(1, 'crear', 'Usuario agregado al sistema', '127.0.0.1', '2025-01-06 11:30:00', '2025-01-06 11:30:00'),
(2, 'actualizar', 'Actualizó equipo con ID: 7. Campos modificados: nombre, estado', '127.0.0.1', '2025-01-07 14:00:00', '2025-01-07 14:00:00'),
(3, 'ver', 'Reporte de equipos descargado', '127.0.0.1', '2025-01-08 12:00:00', '2025-01-08 12:00:00'),
(1, 'crear', 'Nueva orden de trabajo creada con ID: 1', '127.0.0.1', '2025-01-07 16:45:00', '2025-01-07 16:45:00'),
(2, 'actualizar', 'Orden asignada a técnico', '127.0.0.1', '2025-01-07 15:20:00', '2025-01-07 15:20:00'),
(3, 'actualizar', 'Orden completada exitosamente', '127.0.0.1', '2025-01-07 14:00:00', '2025-01-07 14:00:00'),
(1, 'exportar', 'Reporte mensual exportado a PDF', '127.0.0.1', '2025-01-06 10:15:00', '2025-01-06 10:15:00');
