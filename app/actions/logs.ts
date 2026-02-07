"use server"

import { prisma } from "@/lib/prisma"

export async function fetchAuditLogs(search?: string, action?: string, perPage = 10) {
  try {
    const where: any = {}
    
    if (action) {
      where.accion = action
    }
    
    if (search) {
      where.OR = [
        { descripcion: { contains: search } },
        { modulo: { contains: search } },
      ]
    }

    const result = await prisma.log.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          }
        }
      },
      take: perPage,
      orderBy: { created_at: 'desc' }
    })

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error("[v0] fetchAuditLogs - Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al obtener logs",
      data: [],
    }
  }
}

export async function createAuditLog(data: {
  usuario_id?: number
  accion: string
  modulo: string
  descripcion: string
  ip_address?: string
  user_agent?: string
  datos?: any
}) {
  try {
    const log = await prisma.log.create({
      data: {
        ...data,
        created_at: new Date(),
      }
    })

    return { success: true, data: log }
  } catch (error) {
    console.error("[v0] createAuditLog - Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear log de auditoría"
    }
  }
}
