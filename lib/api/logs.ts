export type AuditLog = {
  id: number
  usuario_id?: number
  usuario?: {
    id: number
    nombre: string
    email: string
  }
  accion: string
  modulo: string
  descripcion: string
  ip_address?: string
  user_agent?: string
  datos?: any
  created_at: string
}

export function filterLogs(logs: AuditLog[], searchTerm: string, actionFilter: string): AuditLog[] {
  return logs.filter((log) => {
    const matchesSearch =
      log.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.usuario?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.modulo.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAction = actionFilter === "all" || log.accion === actionFilter

    return matchesSearch && matchesAction
  })
}

import { apiClient } from "./client"
import { serverApiClient } from "./server-client"

const getClient = () => {
  return typeof window === "undefined" ? serverApiClient : apiClient
}

export async function getAuditLogs(
  search?: string,
  action?: string,
  perPage = 10,
): Promise<{
  data: AuditLog[]
  current_page: number
  last_page: number
  total: number
}> {
  const params = new URLSearchParams()
  if (search) params.append("search", search)
  if (action && action !== "all") params.append("accion", action)
  params.append("limit", perPage.toString())

  const client = getClient()
  const response = await client.get(`/logs?${params.toString()}`)

  const logsData = response.data?.data || response.data || []
  const currentPage = response.data?.current_page || response.current_page || 1
  const lastPage = response.data?.last_page || response.last_page || 1
  const total = response.data?.total || response.total || 0

  const transformedData = logsData.map((log: any) => ({
    id: log.id,
    usuario_id: log.usuario_id,
    usuario: log.usuario,
    accion: log.accion,
    modulo: log.modulo,
    descripcion: log.descripcion,
    ip_address: log.ip_address,
    user_agent: log.user_agent,
    datos: log.datos,
    created_at: log.created_at,
  }))

  return {
    data: transformedData,
    current_page: currentPage,
    last_page: lastPage,
    total: total,
  }
}

// Helper function to extract module from log detail
function extractModuloFromDetalle(detalle: string): string {
  if (detalle.toLowerCase().includes("equipo")) return "Equipos"
  if (detalle.toLowerCase().includes("usuario")) return "Usuarios"
  if (detalle.toLowerCase().includes("orden")) return "Órdenes de Trabajo"
  if (detalle.toLowerCase().includes("mantenimiento")) return "Mantenimiento"
  if (detalle.toLowerCase().includes("reporte")) return "Reportes"
  return "Sistema"
}
