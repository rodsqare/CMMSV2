import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

// GET - Obtener un mantenimiento específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth()
    
    const id = parseInt(params.id)
    
    const mantenimiento = await prisma.mantenimiento.findUnique({
      where: { id },
      include: {
        equipo: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            ubicacion: true,
            estado: true,
          },
        },
        creador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        realizaciones: {
          select: {
            id: true,
            realizado_por: true,
            fecha_realizacion: true,
          },
        },
      },
    })
    
    if (!mantenimiento) {
      return NextResponse.json(
        { error: 'Mantenimiento no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(mantenimiento)
  } catch (error: any) {
    console.error('[v0] Error fetching mantenimiento:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener mantenimiento' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}

// PUT - Actualizar un mantenimiento
const updateMantenimientoSchema = z.object({
  equipo_id: z.number().optional(),
  tipo: z.string().optional(),
  frecuencia: z.string().optional(),
  frecuencia_dias: z.number().optional(),
  proxima_programada: z.string().optional(),
  ultima_realizacion: z.string().optional(),
  descripcion: z.string().optional(),
  procedimiento: z.string().optional(),
  tiempo_estimado: z.number().optional(),
  activo: z.boolean().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const id = parseInt(params.id)
    
    // Verificar que el mantenimiento existe
    const existingMaintenance = await prisma.mantenimiento.findUnique({
      where: { id },
    })
    
    if (!existingMaintenance) {
      return NextResponse.json(
        { error: 'Mantenimiento no encontrado' },
        { status: 404 }
      )
    }
    
    const body = await request.json()
    
    const validation = updateMantenimientoSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }
    
    const data = validation.data
    
    const updateData: any = {}
    
    if (data.equipo_id !== undefined) updateData.equipo_id = data.equipo_id
    if (data.tipo !== undefined) updateData.tipo = data.tipo
    if (data.frecuencia !== undefined) updateData.frecuencia = data.frecuencia
    if (data.frecuencia_dias !== undefined) updateData.frecuencia_dias = data.frecuencia_dias
    if (data.proxima_programada !== undefined) updateData.proxima_programada = new Date(data.proxima_programada)
    if (data.ultima_realizacion !== undefined) updateData.ultima_realizacion = data.ultima_realizacion ? new Date(data.ultima_realizacion) : null
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion
    if (data.procedimiento !== undefined) updateData.procedimiento = data.procedimiento
    if (data.tiempo_estimado !== undefined) updateData.tiempo_estimado = data.tiempo_estimado
    if (data.activo !== undefined) updateData.activo = data.activo
    
    updateData.updated_at = new Date()
    
    const mantenimiento = await prisma.mantenimiento.update({
      where: { id },
      data: updateData,
      include: {
        equipo: true,
        creador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    })
    
    // Crear log
    await prisma.log.create({
      data: {
        usuario_id: session.id,
        accion: 'actualizar',
        modulo: 'mantenimientos',
        descripcion: `Mantenimiento actualizado: ${mantenimiento.tipo} para equipo ${mantenimiento.equipo_id}`,
        datos: { mantenimiento_id: mantenimiento.id },
      },
    })
    
    return NextResponse.json(mantenimiento)
  } catch (error: any) {
    console.error('[v0] Error updating mantenimiento:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar mantenimiento' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}

// DELETE - Eliminar un mantenimiento
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const id = parseInt(params.id)
    
    // Verificar que el mantenimiento existe
    const existingMaintenance = await prisma.mantenimiento.findUnique({
      where: { id },
    })
    
    if (!existingMaintenance) {
      return NextResponse.json(
        { error: 'Mantenimiento no encontrado' },
        { status: 404 }
      )
    }
    
    // Eliminar mantenimiento
    await prisma.mantenimiento.delete({
      where: { id },
    })
    
    // Crear log
    await prisma.log.create({
      data: {
        usuario_id: session.id,
        accion: 'eliminar',
        modulo: 'mantenimientos',
        descripcion: `Mantenimiento eliminado: ${existingMaintenance.tipo} para equipo ${existingMaintenance.equipo_id}`,
        datos: { mantenimiento_id: id },
      },
    })
    
    return NextResponse.json({ success: true, message: 'Mantenimiento eliminado correctamente' })
  } catch (error: any) {
    console.error('[v0] Error deleting mantenimiento:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar mantenimiento' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}
