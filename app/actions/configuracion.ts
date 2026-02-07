"use server"

import { prisma } from "@/lib/prisma"

export async function getConfiguracion(clave: string): Promise<string | null> {
  try {
    const config = await prisma.configuracion.findUnique({
      where: { clave }
    })
    
    return config?.valor || null
  } catch (error) {
    console.error("[v0] Error fetching configuracion:", error)
    return null
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
    
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error setting configuracion:", error)
    return { success: false, error: error.message || "Error al guardar configuración" }
  }
}

export async function getHospitalLogo(): Promise<string | null> {
  return await getConfiguracion('hospital_logo')
}

export async function setHospitalLogo(logoUrl: string): Promise<{ success: boolean; error?: string }> {
  return await setConfiguracion('hospital_logo', logoUrl, 'Logo del hospital')
}
