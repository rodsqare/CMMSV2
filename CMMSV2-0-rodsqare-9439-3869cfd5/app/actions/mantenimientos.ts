"use server"

import { prisma } from "@/lib/prisma"

export type Mantenimiento = {
  id?: number
  equipo_id: number
  tipo: string
  procedimiento?: string | null
  frecuencia: string
  ultima_realizacion?: string | null
  proxima_programada: string
  descripcion?: string | null
  activo?: boolean
  created_at?: string
  updated_at?: string
}

export async function getAllMantenimientos(params?: {
  page?: number
  perPage?: number
  tipo?: string
  frecuencia?: string
  activo?: boolean
  search?: string
}) {
  try {
    const page = params?.page || 1
    const perPage = params?.perPage || 10
    const skip = (page - 1) * perPage

    const where: any = {}
    
    if (params?.tipo) {
      where.tipo = params.tipo
    }
    
    if (params?.frecuencia) {
      where.frecuencia = params.frecuencia
    }
    
    if (params?.activo !== undefined) {
      where.activo = params.activo
    }
    
    if (params?.search) {
      where.OR = [
        { descripcion: { contains: params.search } },
        { procedimiento: { contains: params.search } },
        { equipo: { nombre: { contains: params.search } } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.mantenimiento.findMany({
        where,
        include: {
          equipo: true,
        },
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' }
      }),
      prisma.mantenimiento.count({ where })
    ])

    return { data, total, page, perPage }
  } catch (error) {
    console.error("[v0] Error fetching mantenimientos:", error)
    return { data: [], total: 0, page: 1, perPage: 10 }
  }
}

export async function getMantenimientoById(id: number) {
  try {
    return await prisma.mantenimiento.findUnique({
      where: { id },
      include: {
        equipo: true,
      }
    })
  } catch (error) {
    console.error("[v0] Error fetching mantenimiento:", error)
    return null
  }
}

// Helper function to convert frecuencia text to days
function frecuenciaToDias(frecuencia: string): number {
  const frecuenciaMap: Record<string, number> = {
    'diaria': 1,
    'semanal': 7,
    'quincenal': 15,
    'mensual': 30,
    'bimensual': 60,
    'trimestral': 90,
    'semestral': 180,
    'anual': 365,
  }
  return frecuenciaMap[frecuencia?.toLowerCase()] || 30
}

export async function createMantenimiento(mantenimiento: any, usuarioId?: number) {
  console.log("[v0] Action: Creating maintenance", mantenimiento)

  try {
    // Get current user if not provided
    let creadorId = usuarioId
    if (!creadorId) {
      // Try to get from session or use a default - this might need to be passed from the component
      creadorId = 1
    }

    const frecuenciaDias = frecuenciaToDias(mantenimiento.frecuencia)
    const descripcion = mantenimiento.descripcion || mantenimiento.observaciones || "Sin descripción"

    const result = await prisma.mantenimiento.create({
      data: {
        equipo_id: mantenimiento.equipoId || mantenimiento.equipo_id,
        tipo: mantenimiento.tipo?.toLowerCase(),
        descripcion: descripcion,
        procedimiento: mantenimiento.procedimiento,
        frecuencia: mantenimiento.frecuencia?.toLowerCase(),
        frecuencia_dias: frecuenciaDias,
        ultima_realizacion: mantenimiento.ultimaFecha ? new Date(mantenimiento.ultimaFecha) : null,
        proxima_programada: new Date(mantenimiento.proximaFecha || mantenimiento.proxima_programada),
        activo: mantenimiento.activo ?? true,
        creado_por: creadorId,
      }
    })
    console.log("[v0] Action: Maintenance created successfully", result)
    return { success: true, data: result }
  } catch (error: any) {
    console.error("[v0] Action: Error creating maintenance", error)
    const errorMessage = error.message || "Error al crear el mantenimiento"
    return { success: false, error: errorMessage }
  }
}

export async function updateMantenimiento(id: number, mantenimiento: any) {
  console.log("[v0] Action: Updating maintenance", id, mantenimiento)

  try {
    const frecuenciaDias = frecuenciaToDias(mantenimiento.frecuencia)
    const descripcion = mantenimiento.descripcion || mantenimiento.observaciones

    const updateData: any = {
      tipo: mantenimiento.tipo?.toLowerCase(),
      descripcion: descripcion,
      procedimiento: mantenimiento.procedimiento,
      frecuencia: mantenimiento.frecuencia?.toLowerCase(),
      frecuencia_dias: frecuenciaDias,
      updated_at: new Date(),
    }

    if (mantenimiento.ultimaFecha) {
      updateData.ultima_realizacion = new Date(mantenimiento.ultimaFecha)
    }
    
    if (mantenimiento.proximaFecha || mantenimiento.proxima_programada) {
      updateData.proxima_programada = new Date(mantenimiento.proximaFecha || mantenimiento.proxima_programada)
    }
    
    if (mantenimiento.activo !== undefined) {
      updateData.activo = mantenimiento.activo
    }

    const result = await prisma.mantenimiento.update({
      where: { id },
      data: updateData
    })
    console.log("[v0] Action: Maintenance updated successfully", result)
    return { success: true, data: result }
  } catch (error: any) {
    console.error("[v0] Action: Error updating maintenance", error)
    const errorMessage = error.message || "Error al actualizar el mantenimiento"
    return { success: false, error: errorMessage }
  }
}

export async function deleteMantenimiento(id: number) {
  console.log("[v0] Action: Deleting maintenance", id)

  try {
    await prisma.mantenimiento.delete({
      where: { id }
    })
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Action: Error deleting maintenance", error)
    const errorMessage = error.message || "Error al eliminar el mantenimiento"
    return { success: false, error: errorMessage }
  }
}

export async function getMantenimientosStats() {
  try {
    const today = new Date()
    
    const [total, preventivo, correctivo, activos, pendientes, vencidos] = await Promise.all([
      prisma.mantenimiento.count(),
      prisma.mantenimiento.count({ where: { tipo: 'preventivo' } }),
      prisma.mantenimiento.count({ where: { tipo: 'correctivo' } }),
      prisma.mantenimiento.count({ where: { activo: true } }),
      prisma.mantenimiento.count({ where: { proxima_programada: { gte: today }, activo: true } }),
      prisma.mantenimiento.count({ where: { proxima_programada: { lt: today }, activo: true } }),
    ])

    return {
      total,
      preventivo,
      correctivo,
      activos,
      pendientes,
      vencidos,
    }
  } catch (error) {
    console.error("[v0] Error fetching stats:", error)
    return { total: 0, preventivo: 0, correctivo: 0, activos: 0, pendientes: 0, vencidos: 0 }
  }
}

export async function checkUpcomingMaintenances() {
  try {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    const upcoming = await prisma.mantenimiento.findMany({
      where: {
        proxima_programada: {
          gte: today,
          lte: nextWeek,
        },
        activo: true,
      },
      include: {
        equipo: true,
      },
      orderBy: { proxima_programada: 'asc' }
    })

    console.log("[v0] Upcoming maintenances checked:", { count: upcoming.length })
    return { upcoming, count: upcoming.length }
  } catch (error) {
    console.error("[v0] Error checking upcoming maintenances:", error)
    return { upcoming: [], count: 0 }
  }
}
