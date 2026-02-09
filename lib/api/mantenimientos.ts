import { apiClient } from "./client"
import { serverApiClient } from "./server-client"

export interface Mantenimiento {
  id?: number
  equipo_id: number
  equipo?: string
  tipo: string
  frecuencia: string
  proxima_programada: string
  ultima_realizacion?: string
  descripcion?: string
  procedimiento?: string
  creado_por?: number
  creador?: {
    id: number
    nombre: string
    email: string
  }
  activo?: boolean
  created_at?: string
  updated_at?: string
}

export interface MantenimientoBackend {
  id?: number
  equipo_id: number
  equipo?: string
  tipo: string
  frecuencia: string
  proxima_programada: string
  ultima_realizacion?: string
  descripcion?: string
  procedimiento?: string
  creado_por?: number
  creador?: {
    id: number
    nombre: string
    email: string
  }
  activo?: boolean
  created_at?: string
  updated_at?: string
}

export interface MantenimientosPaginados {
  data: Mantenimiento[]
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

const transformMantenimientoFromBackend = (backend: any): any => {
  console.log("[v0] Transforming from backend:", backend)

  // Handle both direct response and wrapped response
  const data = backend.data || backend

  return {
    id: data.id,
    equipoId: data.equipo_id,
    equipo: data.equipo || "",
    tipo: data.tipo,
    frecuencia: data.frecuencia,
    proximaFecha: data.proxima_programada,
    ultimaFecha: data.ultima_realizacion,
    resultado: data.procedimiento,
    observaciones: data.descripcion,
    responsableId: data.creado_por,
    responsableNombre: data.creador?.nombre,
    creadoEn: data.created_at,
    actualizadoEn: data.updated_at,
    programada_orden_generada: data.activo,
  }
}

const transformMantenimientoToBackend = (
  mantenimiento: Partial<Mantenimiento> & { tecnicoAsignadoId?: number },
): any => {
  console.log("[v0] Transforming maintenance data to backend format:", mantenimiento)

  const backendData: any = {
    equipo_id: mantenimiento.equipoId,
    tipo: mantenimiento.tipo?.toLowerCase(),
    frecuencia: mantenimiento.frecuencia?.toLowerCase(),
    proxima_programada: mantenimiento.proximaFecha,
    ultima_realizacion: mantenimiento.ultimaFecha,
    descripcion: mantenimiento.observaciones,
    procedimiento: mantenimiento.resultado?.toLowerCase(),
    creado_por: mantenimiento.tecnicoAsignadoId || mantenimiento.responsableId,
  }

  // Remove undefined values
  Object.keys(backendData).forEach((key) => {
    if (backendData[key] === undefined) {
      delete backendData[key]
    }
  })

  console.log("[v0] Transformed backend data:", backendData)
  return backendData
}

const MOCK_MANTENIMIENTOS: MantenimientoBackend[] = [
  {
    id: 1,
    id_equipo: 1,
    equipo: "Excavadora CAT 320",
    tipo: "Preventivo",
    frecuencia: "Mensual",
    proxima_fecha: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    ultima_fecha: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    resultado: "Pendiente",
    observaciones: "Revisión mensual programada",
    responsable_id: 1,
    responsable: {
      id: 1,
      nombre: "Juan Pérez",
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    id_equipo: 2,
    equipo: "Grúa Torre Liebherr",
    tipo: "Correctivo",
    frecuencia: "Única",
    proxima_fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    ultima_fecha: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    resultado: "Completado",
    observaciones: "Reparación del sistema hidráulico completada",
    responsable_id: 2,
    responsable: {
      id: 2,
      nombre: "María García",
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    id_equipo: 3,
    equipo: "Mezcladora de Concreto",
    tipo: "Preventivo",
    frecuencia: "Semanal",
    proxima_fecha: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    ultima_fecha: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    resultado: "Pendiente",
    observaciones: "Limpieza y lubricación",
    responsable_id: 3,
    responsable: {
      id: 3,
      nombre: "Carlos Rodríguez",
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockIdCounter = 4

const isServer = typeof window === "undefined"

export const mantenimientosApi = {
  // Obtener todos los mantenimientos con filtros y paginación
  getAll: async (params?: {
    page?: number
    perPage?: number
    tipo?: string
    frecuencia?: string
    resultado?: string
    search?: string
  }): Promise<MantenimientosPaginados> => {
    const client = isServer ? serverApiClient : apiClient

    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.perPage) queryParams.append("per_page", params.perPage.toString())
    if (params?.tipo && params.tipo !== "all") queryParams.append("tipo", params.tipo)
    if (params?.frecuencia && params.frecuencia !== "all") queryParams.append("frecuencia", params.frecuencia)
    if (params?.resultado && params.resultado !== "all") queryParams.append("resultado", params.resultado)
    if (params?.search) queryParams.append("search", params.search)

    const response = await client.get<{
      data: MantenimientoBackend[]
      total: number
      per_page: number
      current_page: number
      last_page: number
    }>(`/mantenimientos?${queryParams.toString()}`)

    return {
      data: response.data.map(transformMantenimientoFromBackend),
      total: response.total,
      perPage: response.per_page,
      currentPage: response.current_page,
      lastPage: response.last_page,
    }
  },

  // Obtener un mantenimiento por ID
  getById: async (id: number): Promise<Mantenimiento> => {
    const client = isServer ? serverApiClient : apiClient

    const response = await client.get<MantenimientoBackend>(`/mantenimientos/${id}`)
    return transformMantenimientoFromBackend(response)
  },

  // Crear un nuevo mantenimiento
  create: async (mantenimiento: Partial<Mantenimiento>): Promise<Mantenimiento> => {
    const client = isServer ? serverApiClient : apiClient

    console.log("[v0] Creating maintenance with data:", mantenimiento)

    // Validate required fields
    if (!mantenimiento.equipoId) {
      throw new Error("equipo_id is required")
    }
    if (!mantenimiento.tipo) {
      throw new Error("tipo is required")
    }
    if (!mantenimiento.frecuencia) {
      throw new Error("frecuencia is required")
    }
    if (!mantenimiento.proximaFecha) {
      throw new Error("proxima_fecha is required")
    }

    const backendData = transformMantenimientoToBackend(mantenimiento)
    console.log("[v0] Sending to backend:", backendData)

    try {
      const response = await client.post<any>("/mantenimientos", backendData)
      console.log("[v0] Backend response:", response)

      return transformMantenimientoFromBackend(response)
    } catch (error: any) {
      console.error("[v0] Error creating maintenance:", error)
      console.error("[v0] Error response:", error.response?.data)
      throw error
    }
  },

  // Actualizar un mantenimiento
  update: async (id: number, mantenimiento: Partial<Mantenimiento>): Promise<Mantenimiento> => {
    const client = isServer ? serverApiClient : apiClient

    console.log("[v0] Updating maintenance:", id, mantenimiento)
    const backendData = transformMantenimientoToBackend(mantenimiento)
    console.log("[v0] Sending update to backend:", backendData)

    try {
      const response = await client.put<any>(`/mantenimientos/${id}`, backendData)
      console.log("[v0] Update response:", response)
      return transformMantenimientoFromBackend(response)
    } catch (error: any) {
      console.error("[v0] Error updating maintenance:", error)
      console.error("[v0] Error response:", error.response?.data)
      throw error
    }
  },

  // Eliminar un mantenimiento
  delete: async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
    const client = isServer ? serverApiClient : apiClient

    try {
      console.log("[v0] Deleting maintenance:", id)
      await client.delete(`/mantenimientos/${id}`)
      console.log("[v0] Maintenance deleted successfully")
      return { success: true, message: "Mantenimiento eliminado exitosamente" }
    } catch (error: any) {
      console.error("[v0] Error deleting maintenance:", error)
      console.error("[v0] Error details:", error.response?.data)
      const errorMessage = error.response?.data?.message || error.message || "Error al eliminar el mantenimiento"
      return { success: false, error: errorMessage }
    }
  },

  // Obtener estadísticas
  getStats: async (): Promise<{
    vencidos: number
    proximos: number
    completados: number
    total: number
  }> => {
    const client = isServer ? serverApiClient : apiClient

    try {
      console.log("[v0] Fetching maintenance stats from API...")
      const response = await client.get<{
        vencidos: number
        proximos: number
        completados: number
        total: number
      }>("/mantenimientos/stats")
      console.log("[v0] Maintenance stats received:", response)
      return response
    } catch (error: any) {
      console.error("[v0] Error fetching maintenance stats:", error)
      console.error("[v0] Error details:", error.response?.data)
      return {
        vencidos: 0,
        proximos: 0,
        completados: 0,
        total: 0,
      }
    }
  },

  checkUpcoming: async (): Promise<{
    total_mantenimientos: number
    notificaciones_creadas: number
    detalles: Array<{
      mantenimiento_id: number
      equipo: string
      responsable_id: number
      dias_hasta: number
      fecha: string
    }>
  }> => {
    const client = isServer ? serverApiClient : apiClient

    try {
      console.log("[v0] Checking upcoming maintenances...")
      const response = await client.post<{
        success: boolean
        data: {
          total_mantenimientos: number
          notificaciones_creadas: number
          detalles: Array<{
            mantenimiento_id: number
            equipo: string
            responsable_id: number
            dias_hasta: number
            fecha: string
          }>
        }
      }>("/mantenimientos/check-upcoming", {})
      console.log("[v0] Upcoming maintenances checked:", response)
      return response.data
    } catch (error: any) {
      console.error("[v0] Error checking upcoming maintenances:", error)
      return {
        total_mantenimientos: 0,
        notificaciones_creadas: 0,
        detalles: [],
      }
    }
  },
}

export async function getAllMantenimientos(params?: {
  tipo?: string
  frecuencia?: string
  resultado?: string
  search?: string
}): Promise<MantenimientosPaginados> {
  return mantenimientosApi.getAll({
    ...params,
    perPage: 1000,
  })
}

export async function getMantenimientosStats() {
  return mantenimientosApi.getStats()
}

export async function checkUpcomingMaintenances() {
  return mantenimientosApi.checkUpcoming()
}
