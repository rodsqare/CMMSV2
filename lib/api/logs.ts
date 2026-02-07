export type AuditLog = {
  id: number
  timestamp: string
  usuario: string
  accion: "Crear" | "Actualizar" | "Eliminar" | "Ver" | "Descargar" | "Exportar"
  descripcion: string
  modulo: string
  detalles?: string
}

export function filterLogs(logs: AuditLog[], searchTerm: string, actionFilter: string): AuditLog[] {
  return logs.filter((log) => {
    const matchesSearch =
      log.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
  if (action && action !== "all") params.append("action", action)
  params.append("per_page", perPage.toString())

  const client = getClient()
  const response = await client.get(`/logs-auditoria?${params.toString()}`)

  const logsData = response.data?.data || response.data || []
  const currentPage = response.data?.current_page || response.current_page || 1
  const lastPage = response.data?.last_page || response.last_page || 1
  const total = response.data?.total || response.total || 0

  const transformedData = logsData.map((log: any) => ({
    id: log.id,
    timestamp: log.timestamp || log.fecha_hora || log.created_at,
    usuario: log.usuario,
    accion: log.accion as AuditLog["accion"],
    descripcion: log.descripcion || log.detalle,
    modulo: log.modulo || extractModuloFromDetalle(log.detalle || log.descripcion),
    detalles: log.detalle || log.descripcion,
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
