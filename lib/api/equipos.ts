import { apiClient } from "./client"
import { serverApiClient } from "./server-client"

export interface Equipo {
  id: number
  numero_serie: string
  nombre_equipo: string
  modelo: string
  fabricante: string
  ubicacion: string
  estado: "operativo" | "mantenimiento" | "en reparacion" | "fuera de servicio" | "nuevo"
  voltaje?: string
  frecuencia?: string
  fecha_adquisicion?: string
  fecha_instalacion?: string
  fecha_ultimo_mantenimiento?: string
  proximo_mantenimiento?: string
  observaciones?: string
  codigo_institucional?: string
  servicio?: string
  vencimiento_garantia?: string
  fecha_ingreso?: string
  procedencia?: string
  potencia?: string
  corriente?: string
  otros_especificaciones?: string
  accesorios_consumibles?: string
  estado_equipo?: "nuevo" | "operativo" | "no_operable"
  manual_usuario?: boolean
  manual_servicio?: boolean
  nivel_riesgo?: "alto" | "medio" | "bajo"
  proveedor_nombre?: string
  proveedor_direccion?: string
  proveedor_telefono?: string
  created_at?: string
  updated_at?: string
}

export interface EquiposResponse {
  data: Equipo[]
  total: number
  per_page: number
  current_page: number
}

export interface EquipoWithDetails extends Equipo {
  historial_tareas?: Array<{
    id: number
    tarea: string
    fecha: string
    realizado_por: string
    estado: string
  }>
  documentos?: Array<{
    id: number
    nombre: string
    tipo: string
    fecha_subida: string
    url: string
  }>
}

const isServer = typeof window === "undefined"

// Obtener todos los equipos
export async function getEquipos(params?: {
  page?: number
  per_page?: number
  search?: string
  estado?: string
  ubicacion?: string
  fabricante?: string
}): Promise<EquiposResponse> {
  const client = isServer ? serverApiClient : apiClient
  return await client.get("/equipos", params)
}

// Obtener un equipo específico con detalles completos
export async function getEquipo(id: number): Promise<EquipoWithDetails> {
  console.log("[v0] Fetching equipment from /equipos/" + id)
  const client = isServer ? serverApiClient : apiClient
  const response = await client.get<any>(`/equipos/${id}`)
  console.log("[v0] Raw response from getEquipo:", response)

  let equipoData: EquipoWithDetails
  if (response && typeof response === "object" && "data" in response) {
    console.log("[v0] Unwrapping 'data' property from response")
    equipoData = response.data as EquipoWithDetails
  } else {
    equipoData = response as EquipoWithDetails
  }

  console.log("[v0] Equipment data from API:", equipoData)

  return equipoData
}

export const fetchEquipoDetails = getEquipo

// Crear un nuevo equipo
export async function createEquipo(data: Omit<Equipo, "id" | "created_at" | "updated_at">): Promise<Equipo> {
  const transformedData = {
    ...data,
    // Ensure estado uses correct format
    estado: data.estado || "operativo",
    // Map any underscore fields to the correct format
    estado_equipo: data.estado_equipo || "operativo",
  }

  console.log("[v0] Sending equipment data to backend:", transformedData)

  const client = isServer ? serverApiClient : apiClient
  const response = await client.post<{ data: Equipo }>("/equipos", transformedData)

  if (response && typeof response === "object") {
    return "data" in response ? response.data : (response as Equipo)
  }

  return response as Equipo
}

// Actualizar un equipo
export async function updateEquipo(id: number, data: Partial<Equipo>): Promise<Equipo> {
  const client = isServer ? serverApiClient : apiClient

  // Otherwise try to get from localStorage if on client side
  let usuarioId: number | null = (data.usuario_id as number) || null

  if (!usuarioId && typeof window !== "undefined") {
    const storedUserId = localStorage.getItem("userId")
    if (storedUserId) {
      usuarioId = Number.parseInt(storedUserId, 10)
    }
  }

  console.log("[v0] updateEquipo - usuarioId:", usuarioId)

  const dataWithUserId = {
    ...data,
    usuario_id: usuarioId,
  }

  console.log("[v0] updateEquipo - full payload:", JSON.stringify(dataWithUserId, null, 2))

  return await client.put(`/equipos/${id}`, dataWithUserId)
}

export async function deleteEquipo(id: number, userId?: string): Promise<void> {
  const client = isServer ? serverApiClient : apiClient
  return await client.delete(`/equipos/${id}`, undefined, userId)
}

// Check if equipment has associated maintenances or work orders
export async function checkEquipoAssociations(
  id: number,
): Promise<{
  hasMaintenances: boolean
  hasWorkOrders: boolean
  maintenanceCount: number
  workOrderCount: number
}> {
  const client = isServer ? serverApiClient : apiClient

  try {
    console.log("[v0] Checking equipment associations for id:", id)
    const response = await client.get<{
      data: {
        mantenimientos_count: number
        ordenes_trabajo_count: number
      }
    }>(`/equipos/${id}/associations`)

    const data = response.data || response

    return {
      hasMaintenances: (data.mantenimientos_count || 0) > 0,
      hasWorkOrders: (data.ordenes_trabajo_count || 0) > 0,
      maintenanceCount: data.mantenimientos_count || 0,
      workOrderCount: data.ordenes_trabajo_count || 0,
    }
  } catch (error) {
    console.error("[v0] Error checking equipment associations:", error)
    // Return default values if API call fails
    return {
      hasMaintenances: false,
      hasWorkOrders: false,
      maintenanceCount: 0,
      workOrderCount: 0,
    }
  }
}
