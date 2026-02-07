import { apiClient } from "./client"

// Now all requests go through apiClient which already has the correct base URL

export interface Documento {
  id: number
  nombre: string
  tipo?: string
  tamanoKb?: number
  urlArchivo?: string
  subidoPorId?: number
  subidoPor?: string
  fechaSubida: string
  equipoId: number
}

export interface DocumentoResponse {
  data: Documento[]
}

// Get all documents for an equipment
export async function getDocumentos(equipoId: number): Promise<Documento[]> {
  const response = await apiClient.get<DocumentoResponse>(`/equipos/${equipoId}/documentos`)
  return response.data
}

export async function uploadDocumento(
  equipoId: number,
  file: File,
  subidoPorId: number,
  token: string,
): Promise<Documento> {
  if (!token) {
    throw new Error("No authentication token found. Please log in again.")
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
  const uploadUrl = `${API_BASE_URL}/equipos/${equipoId}/documentos`

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  }

  const formData = new FormData()
  formData.append("archivo", file)
  formData.append("subido_por_id", subidoPorId.toString())

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers,
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to upload document: ${response.statusText}`)
  }

  const result = await response.json()
  return result.data
}

export async function downloadDocumento(documentoId: number): Promise<Blob> {
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

  const headers: Record<string, string> = {
    Accept: "application/octet-stream",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/documentos/${documentoId}/download`, {
    method: "GET",
    headers,
  })

  if (!response.ok) {
    throw new Error(`Error al descargar documento: ${response.status}`)
  }

  return await response.blob()
}

export async function deleteDocumento(documentoId: number): Promise<void> {
  await apiClient.delete(`/documentos/${documentoId}`)
}

export function getDocumentoUrl(urlArchivo: string): string {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

  if (urlArchivo.startsWith("http")) {
    return urlArchivo
  }
  const baseUrlWithoutApi = API_BASE_URL.replace("/api", "")
  return `${baseUrlWithoutApi}/storage/${urlArchivo}`
}
