import { apiClient } from "./client"
import { serverApiClient } from "./server-client"
// Import server-side DB functions
import {
  createOrdenDB,
  getOrdenDB,
  getOrdenesDB,
  updateOrdenDB,
  deleteOrdenDB,
  asignarTecnicoDB,
  cambiarEstadoDB,
} from "@/lib/db/ordenes-trabajo"

export interface OrdenTrabajo {
  id: number
  numeroOrden: string
  equipoId: number
  equipoNombre?: string
  tipo: string
  prioridad: string
  estado: string
  descripcion: string
  tecnicoAsignadoId?: number
  tecnicoAsignadoNombre?: string
  fechaCreacion: string
  fechaInicio?: string
  fechaFinalizacion?: string
  horasTrabajadas?: number
  costoRepuestos?: number
  costoTotal?: number
  observaciones?: string
  createdAt?: string
  updatedAt?: string
}

export interface OrdenesTrabajoFilters {
  estado?: string
  prioridad?: string
  tipo?: string
  fechaDesde?: string
  fechaHasta?: string
  tecnicoId?: number
  equipoId?: number
  search?: string
  page?: number
  perPage?: number
}

export interface OrdenesTrabajoResponse {
  data: OrdenTrabajo[]
  total: number
  currentPage: number
  lastPage: number
  perPage: number
}

const toNumber = (val: any): number | undefined => {
  if (val === null || val === undefined || val === "") return undefined
  const num = Number(val)
  return isNaN(num) ? undefined : num
}

// Transform snake_case to camelCase
function transformOrdenFromAPI(orden: any): OrdenTrabajo {
  return {
    id: orden.id,
    numeroOrden: orden.numeroOrden || orden.numero_orden,
    equipoId: orden.equipoId || orden.equipo_id,
    equipoNombre: orden.equipoNombre || orden.equipo_nombre,
    tipo: orden.tipo,
    prioridad: orden.prioridad,
    estado: orden.estado,
    descripcion: orden.descripcion,
    tecnicoAsignadoId: orden.tecnicoAsignadoId || orden.asignado_a,
    tecnicoAsignadoNombre: orden.tecnicoAsignadoNombre || orden.tecnico_nombre,
    fechaCreacion: orden.fechaCreacion || orden.fecha_solicitud,
    fechaInicio: orden.fechaInicio || orden.fecha_inicio,
    fechaFinalizacion: orden.fechaFinalizacion || orden.fecha_finalizacion,
    horasTrabajadas: toNumber(orden.horasTrabajadas || orden.tiempo_real),
    costoRepuestos: toNumber(orden.costoRepuestos || orden.costo_estimado),
    costoTotal: toNumber(orden.costoTotal || orden.costo_real),
    observaciones: orden.observaciones || orden.notas,
    createdAt: orden.createdAt || orden.created_at,
    updatedAt: orden.updatedAt || orden.updated_at,
  }
}

// Transform camelCase to snake_case
function transformOrdenToAPI(orden: Partial<OrdenTrabajo>): any {
  let tipo = orden.tipo?.toLowerCase() || ""
  // Remove accents from "inspección" to "inspeccion"
  tipo = tipo.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  const estado = orden.estado?.toLowerCase().replace(/\s+/g, "_") || ""

  let prioridad = orden.prioridad?.toLowerCase() || ""
  prioridad = prioridad.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents

  // Map "alta" to "critica" since the database only accepts baja, media, critica
  if (prioridad === "alta") {
    prioridad = "critica"
  }

  const normalized: any = {
    equipo_id: orden.equipoId,
    tipo: tipo,
    prioridad: prioridad,
    descripcion: orden.descripcion,
    asignado_a: orden.tecnicoAsignadoId || undefined,
    // Optional fields - map fechaCreacion to fecha_programada
    ...(orden.fechaCreacion && { fecha_programada: orden.fechaCreacion }),
    ...(orden.horasTrabajadas !== undefined && orden.horasTrabajadas !== null && { tiempo_estimado: orden.horasTrabajadas }),
    ...(orden.costoRepuestos !== undefined && orden.costoRepuestos !== null && { costo_estimado: orden.costoRepuestos }),
    // For updates only, include estado
    ...(orden.id && { estado: estado }),
  }

  // Remove undefined values
  Object.keys(normalized).forEach((key) => {
    if (normalized[key] === undefined || normalized[key] === null || normalized[key] === "") {
      delete normalized[key]
    }
  })

  console.log("[v0] transformOrdenToAPI - Final transformed data:", normalized)

  return normalized
}

const isServer = typeof window === "undefined"

export async function getOrdenesTrabajo(filters?: OrdenesTrabajoFilters): Promise<OrdenesTrabajoResponse> {
  const client = isServer ? serverApiClient : apiClient

  console.log("[v0] getOrdenesTrabajo - Building request with filters:", filters)

  const params = new URLSearchParams()

  if (filters?.estado && filters.estado !== "all") params.append("estado", filters.estado)
  if (filters?.prioridad && filters.prioridad !== "all") params.append("prioridad", filters.prioridad)
  if (filters?.tipo && filters.tipo !== "all") params.append("tipo", filters.tipo)
  if (filters?.fechaDesde) params.append("fechaDesde", filters.fechaDesde)
  if (filters?.fechaHasta) params.append("fechaHasta", filters.fechaHasta)
  if (filters?.tecnicoId) params.append("tecnico_id", filters.tecnicoId.toString())
  if (filters?.equipoId) params.append("equipo_id", filters.equipoId.toString())
  if (filters?.search) params.append("search", filters.search)
  if (filters?.page) params.append("page", filters.page.toString())
  if (filters?.perPage) params.append("perPage", filters.perPage.toString())

  const queryString = params.toString()
  const url = `/ordenes${queryString ? `?${queryString}` : ""}`

  console.log("[v0] getOrdenesTrabajo - API URL:", url)

  const response = await client.get<any>(url)

  console.log("[v0] getOrdenesTrabajo - Raw API response:", response)

  // The structure is typically { data: [...], links: {...}, meta: { current_page, total, etc } }
  // OR just { data: [...], current_page, ... } depending on how it's returned

  let items = []
  let meta = {
    total: 0,
    current_page: 1,
    last_page: 1,
    per_page: 10,
  }

  if (response.data && Array.isArray(response.data)) {
    // Standard Resource Collection structure
    items = response.data
    if (response.meta) {
      meta = {
        total: response.meta.total,
        current_page: response.meta.current_page,
        last_page: response.meta.last_page,
        per_page: response.meta.per_page,
      }
    } else {
      // Fallback or non-wrapped pagination
      meta = {
        total: response.total || items.length,
        current_page: response.current_page || 1,
        last_page: response.last_page || 1,
        per_page: response.per_page || 10,
      }
    }
  } else if (response.data && response.data.data) {
    // Wrapped structure (sometimes happens)
    items = response.data.data
    meta = {
      total: response.data.total,
      current_page: response.data.current_page,
      last_page: response.data.last_page,
      per_page: response.data.per_page,
    }
  } else {
    // Direct array or other format
    items = Array.isArray(response) ? response : []
    meta.total = items.length
  }

  const result = {
    data: items.map(transformOrdenFromAPI),
    total: meta.total,
    currentPage: meta.current_page,
    lastPage: meta.last_page,
    perPage: meta.per_page,
  }

  console.log("[v0] getOrdenesTrabajo - Transformed result:", result)

  return result
}

export async function getOrdenTrabajo(id: number): Promise<OrdenTrabajo> {
  const client = isServer ? serverApiClient : apiClient

  const response = await client.get<any>(`/ordenes/${id}`)
  return transformOrdenFromAPI(response)
}

export async function createOrdenTrabajo(orden: Partial<OrdenTrabajo>): Promise<OrdenTrabajo> {
  console.log("[v0] createOrdenTrabajo - Input data:", orden)
  const transformedData = transformOrdenToAPI(orden)
  console.log("[v0] createOrdenTrabajo - Sending to API:", transformedData)

  // If on server side, use direct DB call
  if (typeof window === 'undefined') {
    console.log("[v0] createOrdenTrabajo - Using server DB function")
    try {
      const result = await createOrdenDB(transformedData)
      console.log("[v0] createOrdenTrabajo - DB response:", result)
      return result
    } catch (error) {
      console.error("[v0] createOrdenTrabajo - DB Error:", error)
      throw error
    }
  }

  // If on client side, use API client
  const client = apiClient
  const response = await client.post<any>("/ordenes", transformedData)
  console.log("[v0] createOrdenTrabajo - API response:", response)

  return transformOrdenFromAPI(response)
}

export async function updateOrdenTrabajo(id: number, orden: Partial<OrdenTrabajo>): Promise<OrdenTrabajo> {
  const transformedData = transformOrdenToAPI(orden)

  // If on server side, use direct DB call
  if (typeof window === 'undefined') {
    console.log("[v0] updateOrdenTrabajo - Using server DB function")
    try {
      const result = await updateOrdenDB(id, transformedData)
      return result
    } catch (error) {
      console.error("[v0] updateOrdenTrabajo - DB Error:", error)
      throw error
    }
  }

  // If on client side, use API client
  const response = await apiClient.put<any>(`/ordenes/${id}`, transformedData)
  return transformOrdenFromAPI(response)
}

export async function deleteOrdenTrabajo(id: number): Promise<boolean> {
  console.log("[v0] deleteOrdenTrabajo - Attempting to delete orden with id:", id)

  // If on server side, use direct DB call
  if (typeof window === 'undefined') {
    console.log("[v0] deleteOrdenTrabajo - Using server DB function")
    try {
      const result = await deleteOrdenDB(id)
      console.log("[v0] deleteOrdenTrabajo - Deletion successful:", result)
      return result
    } catch (error: any) {
      console.error("[v0] deleteOrdenTrabajo - DB Error:", error)
      throw error
    }
  }

  // If on client side, use API client
  try {
    const response = await apiClient.delete<any>(`/ordenes/${id}`)
    console.log("[v0] deleteOrdenTrabajo - Raw API response:", JSON.stringify(response, null, 2))

    const wasSuccessful = response?.success === true || response?.message !== undefined
    console.log("[v0] deleteOrdenTrabajo - Deletion successful:", wasSuccessful)

    if (!wasSuccessful) {
      throw new Error(response?.message || "Error al eliminar la orden")
    }

    return true
  } catch (error: any) {
    console.error("[v0] deleteOrdenTrabajo - Error caught:", error)
    console.error("[v0] deleteOrdenTrabajo - Error message:", error?.message)
    console.error("[v0] deleteOrdenTrabajo - Error type:", typeof error)
    throw error
  }
}

export async function asignarTecnico(ordenId: number, tecnicoId: number): Promise<OrdenTrabajo> {
  console.log("[v0] asignarTecnico - ordenId:", ordenId, "tecnicoId:", tecnicoId)

  // If on server side, use direct DB call
  if (typeof window === 'undefined') {
    console.log("[v0] asignarTecnico - Using server DB function")
    try {
      const result = await asignarTecnicoDB(ordenId, tecnicoId)
      console.log("[v0] asignarTecnico - Response:", result)
      return result
    } catch (error) {
      console.error("[v0] asignarTecnico - DB Error:", error)
      throw error
    }
  }

  // If on client side, use API client
  const response = await apiClient.post<any>(`/ordenes/${ordenId}/asignar-tecnico`, {
    tecnico_id: tecnicoId,
  })

  console.log("[v0] asignarTecnico - Response:", response)
  return transformOrdenFromAPI(response)
}

export async function cambiarEstado(
  ordenId: number,
  nuevoEstado: string,
  observaciones?: string,
): Promise<OrdenTrabajo> {
  console.log("[v0] cambiarEstado - ordenId:", ordenId, "estado:", nuevoEstado, "observaciones:", observaciones)

  const estadoTransformado = nuevoEstado.toLowerCase().replace(/\s+/g, "_")

  // If on server side, use direct DB call
  if (typeof window === 'undefined') {
    console.log("[v0] cambiarEstado - Using server DB function")
    try {
      const result = await cambiarEstadoDB(ordenId, estadoTransformado)
      console.log("[v0] cambiarEstado - Response:", result)
      return result
    } catch (error) {
      console.error("[v0] cambiarEstado - DB Error:", error)
      throw error
    }
  }

  // If on client side, use API client
  const response = await apiClient.post<any>(`/ordenes/${ordenId}/cambiar-estado`, {
    estado: estadoTransformado,
    observaciones,
  })

  console.log("[v0] cambiarEstado - Response:", response)
  return transformOrdenFromAPI(response)
}

export async function exportOrdenTrabajoPDF(id: number): Promise<Blob> {
  const client = isServer ? serverApiClient : apiClient

  const response = await client.get<Blob>(`/ordenes/${id}/pdf`, {
    responseType: "blob",
  })

  console.log("[v0] exportOrdenTrabajoPDF - PDF blob received")
  return response as unknown as Blob
}
