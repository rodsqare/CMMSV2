"use server"

import {
  getEquipos,
  getEquipo,
  createEquipo,
  updateEquipo,
  deleteEquipo,
  type Equipo,
  type EquiposResponse,
  type EquipoWithDetails,
} from "@/lib/api/equipos"

export type { Equipo, EquiposResponse, EquipoWithDetails }

// Obtener lista de equipos con filtros
export async function fetchEquipos(params?: {
  page?: number
  per_page?: number
  search?: string
  estado?: string
  ubicacion?: string
  fabricante?: string
}): Promise<EquiposResponse> {
  try {
    return await getEquipos(params)
  } catch (error) {
    return {
      data: [],
      total: 0,
      per_page: 10,
      current_page: 1,
    }
  }
}

// Obtener detalles de un equipo
export async function fetchEquipoDetails(id: number): Promise<EquipoWithDetails | null> {
  try {
    return await getEquipo(id)
  } catch (error) {
    console.error("Error fetching equipo details:", error)
    return null
  }
}

// Guardar equipo (crear o actualizar)
export async function saveEquipo(data: Equipo, userId?: string): Promise<{ success: boolean; equipo?: Equipo; error?: string }> {
  try {
    console.log(`[v0] Server Action: saveEquipo called with userId ${userId}`, data)

    let equipo: Equipo
    if (data.id && data.id > 0) {
      const dataWithUserId = {
        ...data,
        usuario_id: userId ? parseInt(userId) : null
      }
      equipo = await updateEquipo(data.id, dataWithUserId)
    } else {
      const { id, created_at, updated_at, ...createData } = data

      const cleanData = {
        ...createData,
        nombre_equipo: createData.nombre_equipo || "",
        numero_serie: createData.numero_serie || "",
        fabricante: createData.fabricante || "",
        modelo: createData.modelo || "",
        ubicacion: createData.ubicacion || "",
        estado: createData.estado || "operativo",
        usuario_id: userId ? parseInt(userId) : null
      }

      console.log("[v0] Creating equipment with data:", cleanData)
      equipo = await createEquipo(cleanData)
    }

    console.log("[v0] Equipment saved successfully:", equipo)
    return { success: true, equipo }
  } catch (error) {
    console.error("[v0] Error saving equipo:", error)

    let errorMessage = "Error al guardar el equipo"
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return { success: false, error: errorMessage }
  }
}

// Eliminar equipo
export async function removeEquipo(id: number, userId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[v0] Server Action: removeEquipo called with ID ${id} and userId ${userId}`)
    await deleteEquipo(id, userId)
    return { success: true }
  } catch (error) {
    console.error("Error deleting equipo:", error)
    return { success: false, error: "Error al eliminar el equipo" }
  }
}

export { getEquipo }
