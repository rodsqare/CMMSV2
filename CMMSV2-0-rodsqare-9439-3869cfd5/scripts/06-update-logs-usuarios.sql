-- Script para actualizar los logs existentes que tienen usuario_id NULL
-- y asignarles el primer usuario admin del sistema

-- Obtener el ID del primer usuario admin
SET @admin_id = (SELECT id FROM usuarios WHERE rol = 'admin' ORDER BY id ASC LIMIT 1);

-- Actualizar los logs que tienen usuario_id NULL
UPDATE logs_auditoria 
SET usuario_id = @admin_id 
WHERE usuario_id IS NULL;

-- Verificar los cambios
SELECT 
    COUNT(*) as total_logs,
    COUNT(usuario_id) as logs_con_usuario,
    COUNT(*) - COUNT(usuario_id) as logs_sin_usuario
FROM logs_auditoria;
