-- Useful Views and Functions for the Medical Equipment Management System

-- View: Equipment with upcoming maintenance
CREATE OR REPLACE VIEW equipos_mantenimiento_proximo AS
SELECT 
  e.id,
  e.numero_serie,
  e.nombre,
  e.ubicacion,
  mp.tipo,
  mp.proxima_fecha,
  mp.resultado,
  CASE 
    WHEN mp.proxima_fecha < CURRENT_DATE THEN 'vencido'
    WHEN mp.proxima_fecha <= CURRENT_DATE + INTERVAL '7 days' THEN 'proximo'
    ELSE 'programado'
  END as urgencia
FROM equipos e
JOIN mantenimiento_preventivo mp ON e.id = mp.equipo_id
WHERE mp.resultado != 'completado' OR mp.proxima_fecha >= CURRENT_DATE
ORDER BY mp.proxima_fecha;

-- View: Work orders summary by status
CREATE OR REPLACE VIEW resumen_ordenes_trabajo AS
SELECT 
  estado,
  COUNT(*) as total_ordenes,
  COUNT(CASE WHEN prioridad = 'critica' THEN 1 END) as criticas,
  COUNT(CASE WHEN prioridad = 'media' THEN 1 END) as medias,
  COUNT(CASE WHEN prioridad = 'baja' THEN 1 END) as bajas
FROM ordenes_trabajo
GROUP BY estado;

-- View: Equipment operational status
CREATE OR REPLACE VIEW estado_equipos AS
SELECT 
  estado,
  COUNT(*) as total,
  COUNT(CASE WHEN es_critico = true THEN 1 END) as criticos,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM equipos) * 100, 2) as porcentaje
FROM equipos
GROUP BY estado;

-- View: Technician workload
CREATE OR REPLACE VIEW carga_trabajo_tecnicos AS
SELECT 
  u.id,
  u.nombre,
  u.especialidad,
  COUNT(ot.id) as ordenes_asignadas,
  COUNT(CASE WHEN ot.estado = 'en_progreso' THEN 1 END) as en_progreso,
  COUNT(CASE WHEN ot.estado = 'abierta' THEN 1 END) as pendientes
FROM usuarios u
LEFT JOIN ordenes_trabajo ot ON u.id = ot.tecnico_asignado_id
WHERE u.rol = 'tecnico' AND u.estado = 'activo'
GROUP BY u.id, u.nombre, u.especialidad;

-- Function: Get equipment maintenance history
CREATE OR REPLACE FUNCTION obtener_historial_equipo(equipo_id_param INTEGER)
RETURNS TABLE (
  fecha DATE,
  tipo VARCHAR,
  descripcion TEXT,
  resultado VARCHAR,
  realizado_por VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ht.fecha_tarea,
    ht.tipo_tarea,
    ht.descripcion,
    ht.resultado,
    u.nombre
  FROM historial_tareas ht
  LEFT JOIN usuarios u ON ht.realizado_por_id = u.id
  WHERE ht.equipo_id = equipo_id_param
  ORDER BY ht.fecha_tarea DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate equipment uptime percentage
CREATE OR REPLACE FUNCTION calcular_disponibilidad_equipo(equipo_id_param INTEGER, dias INTEGER DEFAULT 30)
RETURNS NUMERIC AS $$
DECLARE
  dias_operativo INTEGER;
  porcentaje NUMERIC;
BEGIN
  SELECT COUNT(DISTINCT DATE(fecha_hora))
  INTO dias_operativo
  FROM logs_auditoria
  WHERE detalle LIKE '%equipo%' || equipo_id_param || '%'
    AND accion = 'operativo'
    AND fecha_hora >= CURRENT_DATE - dias;
  
  porcentaje := (dias_operativo::NUMERIC / dias) * 100;
  RETURN ROUND(porcentaje, 2);
END;
$$ LANGUAGE plpgsql;

-- Function: Generate automatic notifications for overdue maintenance
CREATE OR REPLACE FUNCTION generar_notificaciones_mantenimiento()
RETURNS void AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT mp.id, mp.equipo_id, e.nombre, mp.tipo, mp.proxima_fecha
    FROM mantenimiento_preventivo mp
    JOIN equipos e ON mp.equipo_id = e.id
    WHERE mp.proxima_fecha < CURRENT_DATE 
      AND mp.resultado != 'completado'
  LOOP
    INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje)
    SELECT 
      u.id,
      'warning',
      'Mantenimiento Vencido',
      'El equipo ' || rec.nombre || ' tiene ' || rec.tipo || ' vencido desde ' || rec.proxima_fecha
    FROM usuarios u
    WHERE u.rol IN ('administrador', 'supervisor')
      AND u.estado = 'activo';
  END LOOP;
END;
$$ LANGUAGE plpgsql;
