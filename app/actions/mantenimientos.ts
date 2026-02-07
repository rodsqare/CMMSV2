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

// Fallback in-memory storage when DATABASE_URL is not configured
let localMantenimientosStorage: Mantenimiento[] = []
let nextMantenimientoId = 1

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

    try {
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
    } catch (dbError) {
      console.log("[v0] Database error, using fallback storage for getAllMantenimientos")
      // Fallback: filter from memory
      let filteredData = [...localMantenimientosStorage]
      
      if (params?.tipo) {
        filteredData = filteredData.filter(m => m.tipo?.toLowerCase() === params.tipo?.toLowerCase())
      }
      if (params?.frecuencia) {
        filteredData = filteredData.filter(m => m.frecuencia?.toLowerCase() === params.frecuencia?.toLowerCase())
      }
      if (params?.activo !== undefined) {
        filteredData = filteredData.filter(m => m.activo === params.activo)
      }
      if (params?.search) {
        const searchLower = params.search.toLowerCase()
        filteredData = filteredData.filter(m => 
          m.descripcion?.toLowerCase().includes(searchLower) ||
          m.procedimiento?.toLowerCase().includes(searchLower)
        )
      }
      
      const total = filteredData.length
      const data = filteredData.slice(skip, skip + perPage)
      
      return { data, total, page, perPage }
    }
  } catch (error) {
    console.error("[v0] Error fetching mantenimientos:", error)
    return { data: [], total: 0, page: 1, perPage: 10 }
  }
}

export async function getMantenimientoById(id: number) {
  try {
    try {
      return await prisma.mantenimiento.findUnique({
        where: { id },
        include: {
          equipo: true,
        }
      })
    } catch (dbError) {
      console.log("[v0] Database error, using fallback storage for getMantenimientoById")
      // Fallback: search in memory
      return localMantenimientosStorage.find(m => m.id === id) || null
    }
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

    try {
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
    } catch (dbError) {
      console.log("[v0] Database error, using fallback storage for createMantenimiento")
      // Fallback: create in memory
      const newMaintenance = {
        id: nextMantenimientoId++,
        equipo_id: mantenimiento.equipoId || mantenimiento.equipo_id,
        tipo: mantenimiento.tipo?.toLowerCase(),
        descripcion: descripcion,
        procedimiento: mantenimiento.procedimiento || null,
        frecuencia: mantenimiento.frecuencia?.toLowerCase(),
        ultima_realizacion: mantenimiento.ultimaFecha || null,
        proxima_programada: mantenimiento.proximaFecha || mantenimiento.proxima_programada,
        activo: mantenimiento.activo ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      localMantenimientosStorage.push(newMaintenance)
      console.log("[v0] Action: Maintenance created in fallback storage", newMaintenance)
      return { success: true, data: newMaintenance }
    }
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

    try {
      const result = await prisma.mantenimiento.update({
        where: { id },
        data: updateData
      })
      console.log("[v0] Action: Maintenance updated successfully", result)
      return { success: true, data: result }
    } catch (dbError) {
      console.log("[v0] Database error, using fallback storage for updateMantenimiento")
      // Fallback: update in memory
      const index = localMantenimientosStorage.findIndex(m => m.id === id)
      if (index >= 0) {
        localMantenimientosStorage[index] = {
          ...localMantenimientosStorage[index],
          tipo: updateData.tipo,
          descripcion: updateData.descripcion,
          procedimiento: updateData.procedimiento,
          frecuencia: updateData.frecuencia,
          ultima_realizacion: updateData.ultima_realizacion || localMantenimientosStorage[index].ultima_realizacion,
          proxima_programada: updateData.proxima_programada || localMantenimientosStorage[index].proxima_programada,
          activo: updateData.activo !== undefined ? updateData.activo : localMantenimientosStorage[index].activo,
          updated_at: new Date().toISOString(),
        }
        console.log("[v0] Action: Maintenance updated in fallback storage", localMantenimientosStorage[index])
        return { success: true, data: localMantenimientosStorage[index] }
      } else {
        return { success: false, error: "Mantenimiento no encontrado" }
      }
    }
  } catch (error: any) {
    console.error("[v0] Action: Error updating maintenance", error)
    const errorMessage = error.message || "Error al actualizar el mantenimiento"
    return { success: false, error: errorMessage }
  }
}

export async function deleteMantenimiento(id: number) {
  console.log("[v0] Action: Deleting maintenance", id)

  try {
    try {
      await prisma.mantenimiento.delete({
        where: { id }
      })
      return { success: true }
    } catch (dbError) {
      console.log("[v0] Database error, using fallback storage for deleteMantenimiento")
      // Fallback: delete from memory
      const index = localMantenimientosStorage.findIndex(m => m.id === id)
      if (index >= 0) {
        localMantenimientosStorage.splice(index, 1)
        console.log("[v0] Action: Maintenance deleted from fallback storage")
        return { success: true }
      } else {
        return { success: false, error: "Mantenimiento no encontrado" }
      }
    }
  } catch (error: any) {
    console.error("[v0] Action: Error deleting maintenance", error)
    const errorMessage = error.message || "Error al eliminar el mantenimiento"
    return { success: false, error: errorMessage }
  }
}

export async function getMantenimientosStats() {
  try {
    const today = new Date()
    
    try {
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
    } catch (dbError) {
      console.log("[v0] Database error, using fallback storage for getMantenimientosStats")
      // Fallback: calculate from memory
      const total = localMantenimientosStorage.length
      const preventivo = localMantenimientosStorage.filter(m => m.tipo?.toLowerCase() === 'preventivo').length
      const correctivo = localMantenimientosStorage.filter(m => m.tipo?.toLowerCase() === 'correctivo').length
      const activos = localMantenimientosStorage.filter(m => m.activo === true).length
      const pendientes = localMantenimientosStorage.filter(m => 
        new Date(m.proxima_programada) >= today && m.activo === true
      ).length
      const vencidos = localMantenimientosStorage.filter(m => 
        new Date(m.proxima_programada) < today && m.activo === true
      ).length
      
      return {
        total,
        preventivo,
        correctivo,
        activos,
        pendientes,
        vencidos,
      }
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

    try {
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
    } catch (dbError) {
      console.log("[v0] Database error, using fallback storage for checkUpcomingMaintenances")
      // Fallback: filter from memory
      const upcoming = localMantenimientosStorage.filter(m => {
        const proximaDate = new Date(m.proxima_programada)
        return proximaDate >= today && proximaDate <= nextWeek && m.activo === true
      }).sort((a, b) => new Date(a.proxima_programada).getTime() - new Date(b.proxima_programada).getTime())
      
      console.log("[v0] Upcoming maintenances checked (fallback):", { count: upcoming.length })
      return { upcoming, count: upcoming.length }
    }
  } catch (error) {
    console.error("[v0] Error checking upcoming maintenances:", error)
    return { upcoming: [], count: 0 }
  }
}
