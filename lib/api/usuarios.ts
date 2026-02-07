import { apiClient } from "./client"
import { serverApiClient } from "./server-client"

const isServer = typeof window === "undefined"

export type Usuario = {
  id?: number
  nombre: string
  email: string
  password?: string
  rol: string
  activo: boolean
  estado?: string
  ultimo_acceso?: string | null
  intentos_fallidos?: number
  bloqueado_hasta?: string | null
  created_at?: string
  updated_at?: string
}

export type UsuarioWithPassword = Partial<Usuario> & {
  password?: string
}

export type UsuariosResponse = {
  data: Usuario[]
  total: number
  current_page: number
  per_page: number
  last_page: number
}

export type FetchUsuariosParams = {
  page?: number
  per_page?: number
  search?: string
  rol?: string
  estado?: string
}

export type UserActivity = {
  ultimo_acceso: string | null
  ordenes_creadas: number
  ordenes_asignadas: number
  actividades_recientes: Array<{
    id: number
    timestamp: string
    accion: string
    descripcion: string
    modulo: string
  }>
}

export async function fetchUsuarios(params: FetchUsuariosParams = {}): Promise<UsuariosResponse> {
  const client = isServer ? serverApiClient : apiClient
  
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append("page", params.page.toString())
  if (params.per_page) queryParams.append("per_page", params.per_page.toString())
  if (params.search) queryParams.append("search", params.search)
  if (params.rol && params.rol !== "all") queryParams.append("rol", params.rol)
  if (params.estado && params.estado !== "all") queryParams.append("estado", params.estado)

  const url = `/usuarios?${queryParams.toString()}`

  try {
    const response = await client.get<any>(url)

    if (response.data && Array.isArray(response.data)) {
      return {
        data: response.data,
        total: response.total || response.data.length,
        current_page: response.current_page || 1,
        per_page: response.per_page || response.data.length,
        last_page: response.last_page || 1,
      }
    }

    if (Array.isArray(response)) {
      return {
        data: response,
        total: response.length,
        current_page: 1,
        per_page: response.length,
        last_page: 1,
      }
    }

    return response
  } catch (error) {
    console.error("[v0] Error fetching usuarios:", error)
    throw error
  }
}

export async function fetchUsuarioDetails(id: number): Promise<Usuario | null> {
  const client = isServer ? serverApiClient : apiClient
  
  try {
    const response = await client.get<any>(`/usuarios/${id}`)
    return response.data || response
  } catch (error) {
    console.error("[v0] Error fetching usuario details:", error)
    return null
  }
}

export async function createUsuario(usuario: UsuarioWithPassword): Promise<Usuario> {
  const client = isServer ? serverApiClient : apiClient
  
  const response = await client.post<any>("/usuarios", usuario)
  return response.data || response
}

export async function updateUsuario(id: number, usuario: UsuarioWithPassword): Promise<Usuario> {
  const client = isServer ? serverApiClient : apiClient
  
  const dataToSend = {
    ...usuario,
    estado: usuario.estado ? usuario.estado.toLowerCase() : undefined,
  }

  const response = await client.put<any>(`/usuarios/${id}`, dataToSend)
  return response.data || response
}

export async function deleteUsuario(id: number): Promise<void> {
  const client = isServer ? serverApiClient : apiClient
  await client.delete(`/usuarios/${id}`)
}

export async function updateUsuarioPermissions(id: number, permissions: Usuario["permissions"]): Promise<Usuario> {
  const client = isServer ? serverApiClient : apiClient
  
  const response = await client.put<any>(`/usuarios/${id}`, { permissions })
  return response.data || response
}

export async function resetUsuarioPassword(id: number, contrasena: string): Promise<Usuario> {
  const client = isServer ? serverApiClient : apiClient
  
  const response = await client.post<any>(`/usuarios/${id}/reset-password`, { contrasena })
  return response.data?.data || response.data || response
}

export async function getUsuarios(): Promise<Usuario[]> {
  const response = await fetchUsuarios({ per_page: 1000 })
  return response.data
}

export async function toggleUsuarioEstado(id: number, nuevoEstado: "Activo" | "Inactivo"): Promise<Usuario> {
  const client = isServer ? serverApiClient : apiClient
  
  console.log("[v0] toggleUsuarioEstado API call", { id, nuevoEstado })
  
  const response = await client.put<any>(`/usuarios/${id}`, {
    estado: nuevoEstado.toLowerCase(),
  })

  console.log("[v0] toggleUsuarioEstado response", { response })

  const usuario = response.data?.data || response.data || response
  
  console.log("[v0] toggleUsuarioEstado parsed usuario", { usuario })
  
  return usuario
}

export async function getUserActivity(usuarioId: number, token: string): Promise<UserActivity> {
  const client = isServer ? serverApiClient : apiClient
  
  console.log("[v0] Getting user activity for user:", usuarioId)
  
  try {
    const response = await client.get<UserActivity>(`/usuarios/${usuarioId}/activity`)
    console.log("[v0] User activity retrieved:", response)
    return response
  } catch (error) {
    console.error("[v0] Error getting user activity:", error)
    throw error
  }
}
