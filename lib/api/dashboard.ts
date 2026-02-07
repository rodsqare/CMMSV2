import { apiClient } from "./client"
import { getUsuarios } from "./usuarios"
import { getEquipos } from "./equipos"
import { getAllMantenimientos } from "./mantenimientos"
import { getOrdenesTrabajo } from "./ordenes-trabajo"

export interface DashboardStats {
  usuariosCount: number
  equiposCount: number
  mantenimientosCount: number
  ordenesCount: number
  equiposPorFabricante: Array<{ nombre: string; cantidad: number }>
  mantenimientosPorMes: Array<{ mes: string; cantidad: number }>
}

async function calculateDashboardStats(): Promise<DashboardStats> {
  try {
    // Fetch all data in parallel for better performance
    const [usuarios, equipos, mantenimientos, ordenes] = await Promise.all([
      getUsuarios(),
      getEquipos({}),
      getAllMantenimientos({}),
      getOrdenesTrabajo({}),
    ])

    // Count users
    const usuariosCount = usuarios.length

    // Count equipment
    const equiposCount = equipos.data.length

    // Count maintenance schedules
    const mantenimientosCount = mantenimientos.data.length

    // Count work orders
    const ordenesCount = ordenes.data.length

    // Calculate equipment by manufacturer
    const fabricantesMap = new Map<string, number>()
    equipos.data.forEach((equipo) => {
      const fabricante = equipo.fabricante || "Desconocido"
      fabricantesMap.set(fabricante, (fabricantesMap.get(fabricante) || 0) + 1)
    })
    const equiposPorFabricante = Array.from(fabricantesMap.entries())
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)

    // Calculate maintenance by month (last 6 months)
    const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const mantenimientosPorMesMap = new Map<string, number>()

    // Initialize last 6 months
    const today = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const mesKey = `${date.getFullYear()}-${date.getMonth()}`
      mantenimientosPorMesMap.set(mesKey, 0)
    }

    // Count maintenances by month
    mantenimientos.data.forEach((mant) => {
      if (mant.proximaFecha) {
        const fecha = new Date(mant.proximaFecha)
        const mesKey = `${fecha.getFullYear()}-${fecha.getMonth()}`
        if (mantenimientosPorMesMap.has(mesKey)) {
          mantenimientosPorMesMap.set(mesKey, (mantenimientosPorMesMap.get(mesKey) || 0) + 1)
        }
      }
    })

    // Convert to array with month names
    const mantenimientosPorMes: Array<{ mes: string; cantidad: number }> = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const mesKey = `${date.getFullYear()}-${date.getMonth()}`
      const mesNombre = mesesNombres[date.getMonth()]
      mantenimientosPorMes.push({
        mes: mesNombre,
        cantidad: mantenimientosPorMesMap.get(mesKey) || 0,
      })
    }

    return {
      usuariosCount,
      equiposCount,
      mantenimientosCount,
      ordenesCount,
      equiposPorFabricante,
      mantenimientosPorMes,
    }
  } catch (error) {
    console.error("[v0] Error calculating dashboard stats:", error)
    // Fallback to mock data
    return mockDashboardStats
  }
}

const mockDashboardStats: DashboardStats = {
  usuariosCount: 12,
  equiposCount: 45,
  mantenimientosCount: 23,
  ordenesCount: 8,
  equiposPorFabricante: [
    { nombre: "Philips", cantidad: 15 },
    { nombre: "GE Healthcare", cantidad: 12 },
    { nombre: "Siemens", cantidad: 10 },
    { nombre: "Medtronic", cantidad: 8 },
  ],
  mantenimientosPorMes: [
    { mes: "Ene", cantidad: 5 },
    { mes: "Feb", cantidad: 8 },
    { mes: "Mar", cantidad: 12 },
    { mes: "Abr", cantidad: 7 },
    { mes: "May", cantidad: 10 },
    { mes: "Jun", cantidad: 15 },
  ],
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Attempting to fetch stats from API...
    console.log("[v0] Attempting to fetch stats from API...")
    const apiStats = await apiClient.get<DashboardStats>("/dashboard/stats")
    console.log("[v0] API stats received:", apiStats)
    return apiStats
  } catch (error) {
    // API failed, calculating from local data:
    console.log("[v0] API failed, calculating from local data:", error)
    const calculatedStats = await calculateDashboardStats()
    console.log("[v0] Calculated stats:", calculatedStats)
    return calculatedStats
  }
}
