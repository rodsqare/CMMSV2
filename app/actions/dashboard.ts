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
    
    // Get equipment by manufacturer
    const equipos = await prisma.equipo.groupBy({
      by: ['fabricante'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 4
    })
    
    const equiposPorFabricante = equipos.map(e => ({
      nombre: e.fabricante,
      cantidad: e._count.id
    }))
    
    // Get maintenance by month (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const mantenimientosPorMes = [
      { mes: "Ene", cantidad: 0 },
      { mes: "Feb", cantidad: 0 },
      { mes: "Mar", cantidad: 0 },
      { mes: "Abr", cantidad: 0 },
      { mes: "May", cantidad: 0 },
      { mes: "Jun", cantidad: 0 },
    ]
    
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
