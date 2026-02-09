import { prisma } from '@/lib/prisma'
import type { OrdenTrabajo } from '@/lib/api/ordenes-trabajo'

// Helper to transform database record to OrdenTrabajo type
function transformFromDB(record: any): OrdenTrabajo {
  return {
    id: record.id,
    numeroOrden: record.numero_orden,
    equipoId: record.equipo_id,
    tipo: record.tipo,
    prioridad: record.prioridad,
    estado: record.estado,
    descripcion: record.descripcion,
    fechaCreacion: record.fecha_programada,
    tecnicoAsignadoId: record.asignado_a,
    horasTrabajadas: record.tiempo_estimado,
    costoRepuestos: record.costo_estimado,
    costoTotal: record.costo_real,
  }
}

export async function createOrdenDB(data: any): Promise<OrdenTrabajo> {
  console.log('[v0] createOrdenDB - Creating with data:', data)
  
  const orden = await prisma.orden_trabajo.create({
    data: {
      equipo_id: data.equipo_id,
      tipo: data.tipo,
      prioridad: data.prioridad,
      descripcion: data.descripcion,
      estado: 'pendiente',
      fecha_programada: data.fecha_programada ? new Date(data.fecha_programada) : null,
      tiempo_estimado: data.tiempo_estimado || null,
      costo_estimado: data.costo_estimado || null,
      asignado_a: data.asignado_a || null,
      creado_por: data.creado_por || 1, // Default to user 1 if not provided
    },
    include: {
      equipo: true,
      tecnico: true,
      creador: true,
    },
  })

  console.log('[v0] createOrdenDB - Created orden:', orden.id)
  return transformFromDB(orden)
}

export async function getOrdenDB(id: number): Promise<OrdenTrabajo | null> {
  const orden = await prisma.orden_trabajo.findUnique({
    where: { id },
    include: {
      equipo: true,
      tecnico: true,
      creador: true,
    },
  })

  if (!orden) return null
  return transformFromDB(orden)
}

export async function getOrdenesDB(filters?: any): Promise<OrdenTrabajo[]> {
  const ordenes = await prisma.orden_trabajo.findMany({
    where: {
      deleted_at: null,
      ...(filters?.estado && { estado: filters.estado }),
      ...(filters?.prioridad && { prioridad: filters.prioridad }),
    },
    include: {
      equipo: true,
      tecnico: true,
      creador: true,
    },
    orderBy: { created_at: 'desc' },
    take: filters?.limit || 100,
    skip: filters?.offset || 0,
  })

  return ordenes.map(transformFromDB)
}

export async function updateOrdenDB(id: number, data: any): Promise<OrdenTrabajo> {
  console.log('[v0] updateOrdenDB - Updating orden', id, 'with data:', data)
  
  const updateData: any = {}
  
  if (data.equipo_id !== undefined) updateData.equipo_id = data.equipo_id
  if (data.tipo !== undefined) updateData.tipo = data.tipo
  if (data.prioridad !== undefined) updateData.prioridad = data.prioridad
  if (data.descripcion !== undefined) updateData.descripcion = data.descripcion
  if (data.estado !== undefined) updateData.estado = data.estado
  if (data.fecha_programada !== undefined) {
    updateData.fecha_programada = data.fecha_programada ? new Date(data.fecha_programada) : null
  }
  if (data.tiempo_estimado !== undefined) updateData.tiempo_estimado = data.tiempo_estimado
  if (data.costo_estimado !== undefined) updateData.costo_estimado = data.costo_estimado
  if (data.asignado_a !== undefined) updateData.asignado_a = data.asignado_a

  const orden = await prisma.orden_trabajo.update({
    where: { id },
    data: updateData,
    include: {
      equipo: true,
      tecnico: true,
      creador: true,
    },
  })

  console.log('[v0] updateOrdenDB - Updated orden:', id)
  return transformFromDB(orden)
}

export async function deleteOrdenDB(id: number): Promise<boolean> {
  console.log('[v0] deleteOrdenDB - Deleting orden', id)
  
  await prisma.orden_trabajo.update({
    where: { id },
    data: {
      estado: 'cancelada',
      deleted_at: new Date(),
    },
  })

  console.log('[v0] deleteOrdenDB - Deleted orden:', id)
  return true
}

export async function asignarTecnicoDB(ordenId: number, tecnicoId: number): Promise<OrdenTrabajo> {
  console.log('[v0] asignarTecnicoDB - Assigning tecnico', tecnicoId, 'to orden', ordenId)
  
  const orden = await prisma.orden_trabajo.update({
    where: { id: ordenId },
    data: {
      asignado_a: tecnicoId,
      estado: 'asignada',
    },
    include: {
      equipo: true,
      tecnico: true,
      creador: true,
    },
  })

  console.log('[v0] asignarTecnicoDB - Assigned tecnico')
  return transformFromDB(orden)
}

export async function cambiarEstadoDB(
  ordenId: number,
  nuevoEstado: string,
): Promise<OrdenTrabajo> {
  console.log('[v0] cambiarEstadoDB - Changing estado of orden', ordenId, 'to', nuevoEstado)
  
  const orden = await prisma.orden_trabajo.update({
    where: { id: ordenId },
    data: {
      estado: nuevoEstado,
    },
    include: {
      equipo: true,
      tecnico: true,
      creador: true,
    },
  })

  console.log('[v0] cambiarEstadoDB - Changed estado')
  return transformFromDB(orden)
}
