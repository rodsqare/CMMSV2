-- Script para asignar usuarios a logs que tienen usuario_id NULL
-- Este script asigna el primer usuario admin a todos los logs sin usuario

-- Obtener el ID del primer usuario admin
DO $$
DECLARE
    admin_id INTEGER;
BEGIN
    -- Buscar el primer usuario con rol admin
    SELECT id INTO admin_id FROM usuarios WHERE rol = 'admin' LIMIT 1;
    
    -- Si no hay admin, buscar cualquier usuario
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM usuarios LIMIT 1;
    END IF;
    
    -- Actualizar logs sin usuario
    IF admin_id IS NOT NULL THEN
        UPDATE logs_auditoria 
        SET usuario_id = admin_id 
        WHERE usuario_id IS NULL;
        
        RAISE NOTICE 'Logs actualizados con usuario_id: %', admin_id;
    ELSE
        RAISE NOTICE 'No hay usuarios en la base de datos para asignar';
    END IF;
END $$;

-- Verificar los logs actualizados
SELECT 
    l.id,
    l.usuario_id,
    u.nombre as usuario_nombre,
    u.email as usuario_email,
    l.accion,
    l.detalle,
    l.created_at
FROM logs_auditoria l
LEFT JOIN usuarios u ON l.usuario_id = u.id
ORDER BY l.created_at DESC
LIMIT 10;
