"use server"

import { prisma } from "@/lib/prisma"

export type Equipo = {
  id?: number
  codigo: string
  nombre: string
  tipo: string
  marca?: string | null
  modelo?: string | null
  numero_serie?: string | null
  ubicacion?: string | null
  fecha_adquisicion?: string | null
  vida_util_anos?: number | null
  valor_adquisicion?: number | null
  estado: string
  criticidad: string
  descripcion?: string | null
  especificaciones?: any | null
  ultima_mantencion?: string | null
  proxima_mantencion?: string | null
  horas_operacion?: number | null
  created_at?: string
  updated_at?: string
}

export type EquiposResponse = {
  data: Equipo[]
  total: number
  per_page: number
  current_page: number
}

export type EquipoWithDetails = Equipo & {
  mantenimientos?: any[]
  ordenesTrabajo?: any[]
  mantenimientosRealizados?: any[]
  documentos?: any[]
}

// Obtener lista de equipos con filtros
export async function fetchEquipos(params?: {
  page?: number
  per_page?: number
  search?: string
  estado?: string
  ubicacion?: string
  tipo?: string
  marca?: string
}): Promise<EquiposResponse> {
  try {
    const page = params?.page || 1
    const perPage = params?.per_page || 10
    const skip = (page - 1) * perPage

    const where: any = {}
    
    if (params?.search) {
      where.OR = [
        { codigo: { contains: params.search } },
        { nombre: { contains: params.search } },
        { marca: { contains: params.search } },
        { modelo: { contains: params.search } },
        { numero_serie: { contains: params.search } },
      ]
    }
    
    if (params?.estado) {
      where.estado = params.estado
    }
    
    if (params?.ubicacion) {
      where.ubicacion = { contains: params.ubicacion }
    }
    
    if (params?.tipo) {
      where.tipo = params.tipo
    }

    if (params?.marca) {
      where.marca = { contains: params.marca }
    }

    const [equipos, total] = await Promise.all([
      prisma.equipo.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' }
      }),
      prisma.equipo.count({ where })
    ])

    return {
      data: equipos as any[],
      total,
      per_page: perPage,
      current_page: page,
    }
  } catch (error) {
    console.error("[v0] Error fetching equipos:", error)
    return {
      data: [],
      total: 0,
      per_page: 10,
      current_page: 1,
    }
  }
}

// Obtener detalles de un equipo
export async function fetchEquipoDetails(id: number): Promise<EquipoWithDetails | null> {
  try {
    const equipo = await prisma.equipo.findUnique({
      where: { id },
      include: {
        mantenimientos: true,
        ordenesTrabajo: true,
        mantenimientosRealizados: true,
        documentos: true,
      }
    })
    
    return equipo as any
  } catch (error) {
    console.error("[v0] Error fetching equipo details:", error)
    return null
  }
}

// Guardar equipo (crear o actualizar)
export async function saveEquipo(data: Equipo, userId?: string): Promise<{ success: boolean; equipo?: Equipo; error?: string }> {
  try {
    console.log(`[v0] Server Action: saveEquipo called with userId ${userId}`, data)

    let equipo: any
    if (data.id && data.id > 0) {
      equipo = await prisma.equipo.update({
        where: { id: data.id },
        data: {
          codigo: data.codigo,
          nombre: data.nombre,
          tipo: data.tipo,
          marca: data.marca || null,
          modelo: data.modelo || null,
          numero_serie: data.numero_serie || null,
          ubicacion: data.ubicacion || null,
          estado: data.estado,
          criticidad: data.criticidad,
          descripcion: data.descripcion || null,
          especificaciones: data.especificaciones || null,
          fecha_adquisicion: data.fecha_adquisicion ? new Date(data.fecha_adquisicion) : null,
          vida_util_anos: data.vida_util_anos || null,
          valor_adquisicion: data.valor_adquisicion || null,
          ultima_mantencion: data.ultima_mantencion ? new Date(data.ultima_mantencion) : null,
          proxima_mantencion: data.proxima_mantencion ? new Date(data.proxima_mantencion) : null,
          horas_operacion: data.horas_operacion || null,
        }
      })
    } else {
      equipo = await prisma.equipo.create({
        data: {
          codigo: data.codigo,
          nombre: data.nombre,
          tipo: data.tipo,
          marca: data.marca || null,
          modelo: data.modelo || null,
          numero_serie: data.numero_serie || null,
          ubicacion: data.ubicacion || null,
          estado: data.estado || "operativo",
          criticidad: data.criticidad || "media",
          descripcion: data.descripcion || null,
          especificaciones: data.especificaciones || null,
          fecha_adquisicion: data.fecha_adquisicion ? new Date(data.fecha_adquisicion) : null,
          vida_util_anos: data.vida_util_anos || null,
          valor_adquisicion: data.valor_adquisicion || null,
          ultima_mantencion: data.ultima_mantencion ? new Date(data.ultima_mantencion) : null,
          proxima_mantencion: data.proxima_mantencion ? new Date(data.proxima_mantencion) : null,
          horas_operacion: data.horas_operacion || null,
        }
      })
    }

    console.log("[v0] Equipment saved successfully:", equipo)
    return { success: true, equipo }
  } catch (error) {
    console.error("[v0] Error saving equipo:", error)

    let errorMessage = "Error al guardar el equipo"
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return { success: false, error: errorMessage }
  }
}

// Eliminar equipo
export async function removeEquipo(id: number, userId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[v0] Server Action: removeEquipo called with ID ${id} and userId ${userId}`)
    await prisma.equipo.delete({
      where: { id }
    })
    return { success: true }
  } catch (error) {
    console.error("[v0] Error deleting equipo:", error)
    return { success: false, error: "Error al eliminar el equipo" }
  }
}
