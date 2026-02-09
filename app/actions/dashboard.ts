"use server"

import { prisma } from "@/lib/prisma"

export type DashboardStats = {
  usuariosCount: number
  equiposCount: number
  mantenimientosCount: number
  ordenesCount: number
  equiposPorFabricante: Array<{ nombre: string; cantidad: number }>
  mantenimientosPorMes: Array<{ mes: string; cantidad: number }>
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [usuariosCount, equiposCount, mantenimientosCount, ordenesCount] = await Promise.all([
      prisma.usuario.count(),
      prisma.equipo.count(),
      prisma.mantenimiento.count(),
      prisma.orden_trabajo.count(),
    ])
    
    // Get equipment by manufacturer - filter out null values
    let equiposPorFabricante: Array<{ nombre: string; cantidad: number }> = []
    
    try {
      const equipos = await prisma.equipo.groupBy({
        by: ['marca'],
        _count: {
          id: true
        },
        where: {
          marca: {
            not: null
          }
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 4
      })
      
      equiposPorFabricante = equipos
        .filter(e => e.marca != null)
        .map(e => ({
          nombre: e.marca || "Desconocido",
          cantidad: e._count.id || 0
        }))
    } catch (fabricanteError) {
      console.warn("[v0] Error fetching equipment by manufacturer:", fabricanteError)
      equiposPorFabricante = []
    }
    
    // Get maintenance by month (last 6 months)
    const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const mantenimientosPorMesMap = new Map<string, number>()
    
    // Initialize last 6 months
    const today = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthNum = String(date.getMonth() + 1).padStart(2, '0')
      const mesKey = `${date.getFullYear()}-${monthNum}`
      mantenimientosPorMesMap.set(mesKey, 0)
    }
    
    // Fetch maintenances from the database
    try {
      const mantenimientos = await prisma.mantenimiento.findMany({
        select: {
          proxima_programada: true
        }
      })
      
      // Count by month
      mantenimientos.forEach((mant) => {
        if (mant.proxima_programada) {
          const fecha = new Date(mant.proxima_programada)
          const monthNum = String(fecha.getMonth() + 1).padStart(2, '0')
          const mesKey = `${fecha.getFullYear()}-${monthNum}`
          if (mantenimientosPorMesMap.has(mesKey)) {
            mantenimientosPorMesMap.set(mesKey, (mantenimientosPorMesMap.get(mesKey) || 0) + 1)
          }
        }
      })
    } catch (mantenimientoError) {
      console.warn("[v0] Error fetching maintenance by month:", mantenimientoError)
    }
    
    // Convert to array with month names
    const mantenimientosPorMes: Array<{ mes: string; cantidad: number }> = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthNum = String(date.getMonth() + 1).padStart(2, '0')
      const mesKey = `${date.getFullYear()}-${monthNum}`
      const mesNombre = mesesNombres[date.getMonth()]
      const cantidad = mantenimientosPorMesMap.get(mesKey) || 0
      mantenimientosPorMes.push({
        mes: mesNombre,
        cantidad,
      })
    }
    
    console.log("[v0] Dashboard stats loaded successfully:", {
      usuariosCount,
      equiposCount,
      mantenimientosCount,
      ordenesCount,
    })
    
    return {
      usuariosCount,
      equiposCount,
      mantenimientosCount,
      ordenesCount,
      equiposPorFabricante,
      mantenimientosPorMes,
    }
  } catch (error) {
    console.error("[v0] Error fetching dashboard stats:", error)
    return {
      usuariosCount: 0,
      equiposCount: 0,
      mantenimientosCount: 0,
      ordenesCount: 0,
      equiposPorFabricante: [],
      mantenimientosPorMes: [],
    }
  }
}
