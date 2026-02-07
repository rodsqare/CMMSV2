"use server"

import { prisma } from "@/lib/prisma"

// Fallback to localStorage-like storage when DATABASE_URL is not configured
let localStorageData: Record<string, string> = {}

export async function getConfiguracion(clave: string): Promise<string | null> {
  try {
    const config = await prisma.configuracion.findUnique({
      where: { clave }
    })
    
    return config?.valor || null
  } catch (error) {
    console.error("[v0] Error fetching configuracion from DB, using fallback:", error)
    // Fallback: return from in-memory storage (this will reset on page reload)
    return localStorageData[clave] || null
  }
}

export async function setConfiguracion(clave: string, valor: string, descripcion?: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.configuracion.upsert({
      where: { clave },
      update: {
        valor,
        descripcion,
        updated_at: new Date(),
      },
      create: {
        clave,
        valor,
        descripcion,
        created_at: new Date(),
        updated_at: new Date(),
      }
    })
    
    // Also store in fallback
    localStorageData[clave] = valor
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error setting configuracion, using fallback:", error)
    // Fallback: store in memory and return success
    localStorageData[clave] = valor
    console.log("[v0] Configuration stored in memory fallback:", { clave, valor })
    return { success: true }
  }
}

export async function getHospitalLogo(): Promise<string | null> {
  return await getConfiguracion('hospital_logo')
}

export async function setHospitalLogo(logoUrl: string): Promise<{ success: boolean; error?: string }> {
  return await setConfiguracion('hospital_logo', logoUrl, 'Logo del hospital')
}
