"use server"

import { mantenimientosApi, type Mantenimiento } from "@/lib/api/mantenimientos"

export type { Mantenimiento }

export async function getAllMantenimientos(params?: {
  page?: number
  perPage?: number
  tipo?: string
  frecuencia?: string
  resultado?: string
  search?: string
}) {
  return await mantenimientosApi.getAll(params)
}

export async function getMantenimientoById(id: number) {
  return await mantenimientosApi.getById(id)
}

export async function createMantenimiento(mantenimiento: Partial<Mantenimiento>) {
  console.log("[v0] Action: Creating maintenance", mantenimiento)

  try {
    // Validate required fields before sending to API
    if (!mantenimiento.equipoId) {
      return { success: false, error: "El equipo es obligatorio" }
    }
    if (!mantenimiento.tipo) {
      return { success: false, error: "El tipo de mantenimiento es obligatorio" }
    }
    if (!mantenimiento.frecuencia) {
      return { success: false, error: "La frecuencia es obligatoria" }
    }
    if (!mantenimiento.proximaFecha) {
      return { success: false, error: "La próxima fecha es obligatoria" }
    }

    const maintenanceData = {
      ...mantenimiento,
      tipo: mantenimiento.tipo?.toLowerCase(),
      frecuencia: mantenimiento.frecuencia?.toLowerCase(),
      resultado: mantenimiento.resultado?.toLowerCase() || "pendiente",
    }

    const result = await mantenimientosApi.create(maintenanceData)
    console.log("[v0] Action: Maintenance created successfully", result)
    return { success: true, data: result }
  } catch (error: any) {
    console.error("[v0] Action: Error creating maintenance", error)
    const errorMessage = error.response?.data?.message || error.message || "Error al crear el mantenimiento"
    return { success: false, error: errorMessage }
  }
}

export async function updateMantenimiento(id: number, mantenimiento: Partial<Mantenimiento>) {
  console.log("[v0] Action: Updating maintenance", id, mantenimiento)

  try {
    const maintenanceData = {
      ...mantenimiento,
      tipo: mantenimiento.tipo?.toLowerCase(),
      frecuencia: mantenimiento.frecuencia?.toLowerCase(),
      resultado: mantenimiento.resultado?.toLowerCase(),
    }

    const result = await mantenimientosApi.update(id, maintenanceData)
    console.log("[v0] Action: Maintenance updated successfully", result)
    return { success: true, data: result }
  } catch (error: any) {
    console.error("[v0] Action: Error updating maintenance", error)
    const errorMessage = error.response?.data?.message || error.message || "Error al actualizar el mantenimiento"
    return { success: false, error: errorMessage }
  }
}

export async function deleteMantenimiento(id: number) {
  console.log("[v0] Action: Deleting maintenance", id)

  try {
    const result = await mantenimientosApi.delete(id)
    console.log("[v0] Action: Delete result", result)
    return result
  } catch (error: any) {
    console.error("[v0] Action: Error deleting maintenance", error)
    const errorMessage = error.response?.data?.message || error.message || "Error al eliminar el mantenimiento"
    return { success: false, error: errorMessage }
  }
}

export async function getMantenimientosStats() {
  return await mantenimientosApi.getStats()
}

export async function checkUpcomingMaintenances() {
  return await mantenimientosApi.checkUpcoming()
}
