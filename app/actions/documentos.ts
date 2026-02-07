"use server"

import { getDocumentos, uploadDocumento, deleteDocumento, downloadDocumento } from "@/lib/api/documentos"
import { getAuthToken } from "@/lib/supabase/server"

export async function fetchDocumentos(equipoId: number) {
  try {
    return await getDocumentos(equipoId)
  } catch (error) {
    console.error("Error fetching documentos:", error)
    throw error
  }
}

export async function uploadDocumentoAction(equipoId: number, formData: FormData) {
  try {
    const file = formData.get('file') as File
    const subidoPorId = formData.get('subido_por_id') as string
    const token = await getAuthToken()
    
    if (!file) {
      throw new Error("No file provided")
    }

    if (!token) {
      throw new Error("No authentication token found. Please log in again.")
    }

    return await uploadDocumento(
      equipoId,
      file,
      subidoPorId ? Number.parseInt(subidoPorId) : 0,
      token
    )
  } catch (error) {
    console.error("Error uploading documento:", error)
    throw error
  }
}

export async function deleteDocumentoAction(documentoId: number) {
  try {
    await deleteDocumento(documentoId)
  } catch (error) {
    console.error("Error deleting documento:", error)
    throw error
  }
}

export async function downloadDocumentoAction(documentoId: number) {
  try {
    return await downloadDocumento(documentoId)
  } catch (error) {
    console.error("Error downloading documento:", error)
    throw error
  }
}
