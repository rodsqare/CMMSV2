-- Seed Data for Medical Equipment Management System (MySQL)

-- Insert sample users with different roles
INSERT INTO usuarios (nombre, correo, contrasena, rol, especialidad, estado, permisos) VALUES
('Admin Usuario', 'admin@hospital.com', '$2a$10$hashedpassword1', 'administrador', 'Administración', 'activo', 
  JSON_OBJECT('gestionEquipos', true, 'gestionUsuarios', true, 'ordenesTrabajoCrear', true, 'ordenesTrabajoAsignar', true, 'ordenesTrabajoEjecutar', true, 'mantenimientoPreventivo', true, 'reportesGenerar', true, 'reportesVer', true, 'logsAcceso', true, 'configuracionSistema', true)),
('María Supervisor', 'supervisor@hospital.com', '$2a$10$hashedpassword2', 'supervisor', 'Supervisión Técnica', 'activo',
  JSON_OBJECT('gestionEquipos', true, 'gestionUsuarios', false, 'ordenesTrabajoCrear', true, 'ordenesTrabajoAsignar', true, 'ordenesTrabajoEjecutar', true, 'mantenimientoPreventivo', true, 'reportesGenerar', true, 'reportesVer', true, 'logsAcceso', false, 'configuracionSistema', false)),
('Juan Pérez', 'tecnico@hospital.com', '$2a$10$hashedpassword3', 'tecnico', 'Biomédico', 'activo',
  JSON_OBJECT('gestionEquipos', false, 'gestionUsuarios', false, 'ordenesTrabajoCrear', false, 'ordenesTrabajoAsignar', false, 'ordenesTrabajoEjecutar', true, 'mantenimientoPreventivo', true, 'reportesGenerar', false, 'reportesVer', true, 'logsAcceso', false, 'configuracionSistema', false)),
('Carlos Rodríguez', 'carlos@hospital.com', '$2a$10$hashedpassword4', 'tecnico', 'Eléctrico', 'activo',
  JSON_OBJECT('gestionEquipos', false, 'gestionUsuarios', false, 'ordenesTrabajoCrear', false, 'ordenesTrabajoAsignar', false, 'ordenesTrabajoEjecutar', true, 'mantenimientoPreventivo', true, 'reportesGenerar', false, 'reportesVer', true, 'logsAcceso', false, 'configuracionSistema', false)),
('Ana Martínez', 'ana@hospital.com', '$2a$10$hashedpassword5', 'supervisor', 'Mantenimiento', 'activo',
  JSON_OBJECT('gestionEquipos', true, 'gestionUsuarios', false, 'ordenesTrabajoCrear', true, 'ordenesTrabajoAsignar', true, 'ordenesTrabajoEjecutar', true, 'mantenimientoPreventivo', true, 'reportesGenerar', true, 'reportesVer', true, 'logsAcceso', false, 'configuracionSistema', false));

-- Insert sample equipment
INSERT INTO equipos (numero_serie, nombre, modelo, fabricante, ubicacion, fecha_instalacion, ultima_calibracion, ultima_inspeccion, estado, es_critico, voltaje, frecuencia) VALUES
('BM2024001', 'Monitor de Signos Vitales', 'VSM-3000', 'MedTech Solutions', 'UCI - Sala 1', '2023-01-15', '2024-11-20', '2024-12-01', 'operativo', true, '220V', '60Hz'),
('BM2024002', 'Ventilador Mecánico', 'VM-Pro', 'RespiraTech', 'UCI - Sala 2', '2023-03-20', '2024-10-15', '2024-11-25', 'en_reparacion', true, '220V', '60Hz'),
('BM2024003', 'Bomba de Infusión', 'IP-500', 'InfusionCare', 'Piso 3 - Habitación 301', '2023-06-10', '2024-09-10', '2024-11-30', 'operativo', false, '110V', '60Hz'),
('BM2024004', 'Electrocardiografo', 'ECG-12L', 'CardioMed', 'Cardiología', '2022-11-05', '2024-08-20', '2024-11-15', 'operativo', true, '220V', '60Hz'),
('BM2024005', 'Desfibrilador', 'DEF-2000', 'LifeSaver Inc', 'Emergencias', '2023-02-28', '2024-12-05', '2024-12-10', 'operativo', true, '220V', '60Hz'),
('BM2024006', 'Ultrasonido', 'US-4D Pro', 'ImageTech', 'Radiología', '2023-08-15', '2024-07-30', '2024-11-20', 'operativo', false, '220V', '60Hz'),
('BM2024007', 'Autoclave', 'AC-300', 'SterilPro', 'Esterilización', '2022-05-20', '2024-06-15', '2024-11-10', 'fuera_de_servicio', false, '220V', '60Hz'),
('BM2024008', 'Cama Hospitalaria', 'CH-Electric', 'HospitalBeds Co', 'Piso 2 - Habitación 205', '2023-04-12', NULL, '2024-11-28', 'operativo', false, '110V', '60Hz');

-- Insert sample work orders
INSERT INTO ordenes_trabajo (equipo_id, descripcion, prioridad, estado, tecnico_asignado_id, fecha_creacion, notas) VALUES
(1, 'Pantalla presenta líneas intermitentes', 'critica', 'en_progreso', 3, '2024-12-15 09:30:00', 'Revisar conexiones de pantalla'),
(2, 'Alarma de presión no funciona correctamente', 'critica', 'abierta', NULL, '2024-12-18 14:20:00', 'Requiere calibración urgente'),
(3, 'Mantenimiento preventivo programado', 'media', 'completada', 3, '2024-12-10 08:00:00', 'Completado sin novedades'),
(4, 'Actualización de software requerida', 'baja', 'abierta', 4, '2024-12-19 10:15:00', NULL),
(5, 'Revisión de batería interna', 'media', 'en_progreso', 3, '2024-12-17 11:00:00', 'Batería al 60% de capacidad'),
(6, 'Limpieza profunda del transductor', 'baja', 'completada', 4, '2024-12-12 13:30:00', 'Limpieza realizada exitosamente');

-- Insert preventive maintenance schedules
INSERT INTO mantenimiento_preventivo (equipo_id, tipo, frecuencia, proxima_fecha, ultima_fecha, resultado, observaciones) VALUES
(1, 'calibracion', 'trimestral', '2025-02-20', '2024-11-20', 'completado', 'Calibración dentro de parámetros normales'),
(2, 'inspeccion', 'mensual', '2025-01-15', '2024-12-15', 'vencido', 'Requiere atención inmediata'),
(3, 'limpieza', 'mensual', '2025-01-10', '2024-12-10', 'completado', 'Limpieza rutinaria completada'),
(4, 'calibracion', 'semestral', '2025-02-20', '2024-08-20', 'completado', 'Sin novedades'),
(5, 'inspeccion', 'trimestral', '2025-03-05', '2024-12-05', 'completado', 'Batería en buen estado'),
(6, 'calibracion', 'anual', '2025-07-30', '2024-07-30', 'pendiente', 'Próxima calibración programada'),
(7, 'inspeccion', 'mensual', '2024-12-15', '2024-11-15', 'vencido', 'Equipo fuera de servicio'),
(8, 'inspeccion', 'trimestral', '2025-02-28', '2024-11-28', 'completado', 'Funcionamiento correcto');

-- Insert task history
INSERT INTO historial_tareas (equipo_id, tipo_tarea, descripcion, fecha_tarea, resultado, realizado_por_id) VALUES
(1, 'calibracion', 'Calibración trimestral de monitor', '2024-11-20', 'Exitoso - Parámetros normales', 3),
(1, 'inspeccion', 'Inspección visual y funcional', '2024-12-01', 'Sin novedades', 3),
(2, 'reparacion', 'Reemplazo de sensor de presión', '2024-10-15', 'Completado - Sensor reemplazado', 4),
(3, 'mantenimiento', 'Mantenimiento preventivo mensual', '2024-12-10', 'Completado sin problemas', 3),
(4, 'calibracion', 'Calibración semestral ECG', '2024-08-20', 'Exitoso', 3),
(5, 'inspeccion', 'Revisión de batería y electrodos', '2024-12-05', 'Batería al 60%', 3),
(6, 'calibracion', 'Calibración anual ultrasonido', '2024-07-30', 'Exitoso', 4);

-- Insert audit logs
INSERT INTO logs_auditoria (usuario_id, accion, detalle, created_at, ip_address) VALUES
(1, 'inicio_sesion', 'Inicio de sesión exitoso', '2024-12-20 08:00:00', '192.168.1.100'),
(3, 'inicio_sesion', 'Inicio de sesión exitoso', '2024-12-20 08:15:00', '192.168.1.101'),
(1, 'creacion', 'Creación de orden de trabajo #OT001', '2024-12-20 09:30:00', '192.168.1.100'),
(3, 'edicion', 'Actualización de estado de orden #OT001 a en_progreso', '2024-12-20 10:00:00', '192.168.1.101'),
(1, 'generacion_reporte', 'Generación de reporte de equipos operativos', '2024-12-20 11:00:00', '192.168.1.100'),
(2, 'inicio_sesion', 'Inicio de sesión exitoso', '2024-12-20 09:00:00', '192.168.1.102'),
(4, 'inicio_sesion', 'Inicio de sesión exitoso', '2024-12-20 08:30:00', '192.168.1.103');

-- Insert notifications
INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, leida) VALUES
(3, 'warning', 'Mantenimiento Vencido', 'El equipo Ventilador Mecánico (BM2024002) tiene mantenimiento vencido', false),
(1, 'info', 'Nueva Orden Creada', 'Se ha creado una nueva orden de trabajo para Monitor de Signos Vitales', true),
(3, 'success', 'Orden Completada', 'La orden de trabajo #OT003 ha sido completada exitosamente', true),
(2, 'warning', 'Equipo Crítico', 'El equipo Desfibrilador requiere calibración en 5 días', false),
(4, 'info', 'Asignación de Orden', 'Se te ha asignado la orden de trabajo #OT004', false);

-- Insert sample documents
INSERT INTO documentos (equipo_id, nombre_archivo, tipo_archivo, tamano_kb, url_archivo, subido_por_id) VALUES
(1, 'Manual_VSM3000.pdf', 'application/pdf', 2048, '/documents/manual_vsm3000.pdf', 1),
(1, 'Certificado_Calibracion_Nov2024.pdf', 'application/pdf', 512, '/documents/cert_cal_vsm_nov2024.pdf', 3),
(2, 'Manual_VMPro.pdf', 'application/pdf', 3072, '/documents/manual_vmpro.pdf', 1),
(4, 'Guia_Mantenimiento_ECG.pdf', 'application/pdf', 1024, '/documents/guia_mant_ecg.pdf', 1),
(5, 'Protocolo_Uso_Desfibrilador.pdf', 'application/pdf', 768, '/documents/protocolo_def.pdf', 1);
