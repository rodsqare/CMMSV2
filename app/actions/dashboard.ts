"use server"

import { getDashboardStats as getStatsFromAPI, type DashboardStats } from "@/lib/api/dashboard"

export type { DashboardStats }

const MOCK_DATA = {
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

export async function getDashboardStats() {
  try {
    const stats = await getStatsFromAPI()
    return stats
  } catch (error) {
    return MOCK_DATA
  }
}
