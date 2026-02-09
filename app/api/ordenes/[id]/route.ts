import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

// GET - Obtener orden por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    
    const orden = await prisma.orden_trabajo.findUnique({
      where: { id: parseInt(id) },
      include: {
        equipo: true,
        creador: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
        tecnico: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
        documentos: {
          orderBy: { created_at: 'desc' },
          include: {
            subidoPor: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
    })
    
    if (!orden) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(orden)
  } catch (error: any) {
    console.error('[v0] Error fetching orden:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener orden' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}

// PUT - Actualizar orden
const updateOrdenSchema = z.object({
  equipo_id: z.number().optional().or(z.string().transform(Number).optional()),
  tipo: z.string().optional(),
  prioridad: z.string().optional(),
  descripcion: z.string().optional(),
  estado: z.string().optional(),
  fecha_programada: z.string().optional().or(z.null()),
  tiempo_estimado: z.number().optional().or(z.null()),
  costo_estimado: z.number().optional().or(z.null()),
  asignado_a: z.number().nullable().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body = await request.json()
    
    console.log('[v0] PUT /ordenes/[id] - Received body:', JSON.stringify(body, null, 2))
    
    const validation = updateOrdenSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code
      }))
      console.error('[v0] PUT /ordenes/[id] - Validation errors:', errors)
      return NextResponse.json(
        { error: 'Datos inválidos', details: errors },
        { status: 400 }
      )
    }
    
    const data = validation.data
    const ordenId = parseInt(id)

    if (isNaN(ordenId)) {
      return NextResponse.json(
        { error: 'ID de orden inválido' },
        { status: 400 }
      )
    }
    
    const ordenExistente = await prisma.orden_trabajo.findUnique({
      where: { id: ordenId },
      include: {
        tecnico: true,
      },
    })
    
    if (!ordenExistente) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }
    
    // Build update object, only including provided fields
    const updateData: any = {}
    if (data.equipo_id !== undefined) updateData.equipo_id = data.equipo_id
    if (data.tipo !== undefined) updateData.tipo = data.tipo
    if (data.prioridad !== undefined) updateData.prioridad = data.prioridad
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion
    if (data.estado !== undefined) updateData.estado = data.estado
    if (data.fecha_programada !== undefined) {
      updateData.fecha_programada = data.fecha_programada ? new Date(data.fecha_programada) : null
    }
    if (data.tiempo_estimado !== undefined) updateData.tiempo_estimado = data.tiempo_estimado
    if (data.costo_estimado !== undefined) updateData.costo_estimado = data.costo_estimado
    if (data.asignado_a !== undefined) updateData.asignado_a = data.asignado_a
    
    const orden = await prisma.orden_trabajo.update({
      where: { id: ordenId },
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
        tecnico: {
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
        accion: 'Actualizar',
        modulo: 'Órdenes de Trabajo',
        descripcion: `Orden actualizada: ${orden.numero_orden}`,
        datos: { orden_id: orden.id, cambios: data },
      },
    })
    
    // Notificar si cambió el técnico asignado
    if (data.asignado_a !== undefined && 
        data.asignado_a !== ordenExistente.asignado_a) {
      if (data.asignado_a) {
        await prisma.notificacion.create({
          data: {
            usuario_id: data.asignado_a,
            tipo: 'orden_asignada',
            titulo: 'Orden asignada',
            mensaje: `Se te ha asignado la orden ${orden.numero_orden}`,
            datos: { orden_id: orden.id },
          },
        })
      }
    }
    
    // Notificar si cambió el estado
    if (data.estado && data.estado !== ordenExistente.estado) {
      await prisma.notificacion.create({
        data: {
          usuario_id: ordenExistente.creado_por,
          tipo: 'orden_actualizada',
          titulo: 'Estado de orden actualizado',
          mensaje: `La orden ${orden.numero_orden} cambió a ${data.estado}`,
          datos: { orden_id: orden.id },
        },
      })
    }
    
    return NextResponse.json(orden)
  } catch (error: any) {
    console.error('[v0] Error updating orden:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Error al actualizar la orden' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar orden
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const ordenId = parseInt(id)

    if (isNaN(ordenId)) {
      return NextResponse.json(
        { error: 'ID de orden inválido' },
        { status: 400 }
      )
    }
    
    const orden = await prisma.orden_trabajo.findUnique({
      where: { id: ordenId },
    })
    
    if (!orden) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }
    
    // Soft delete - cambiar estado a "cancelada"
    const updatedOrden = await prisma.orden_trabajo.update({
      where: { id: ordenId },
      data: { estado: 'cancelada', deleted_at: new Date() },
    })
    
    // Crear log
    await prisma.log.create({
      data: {
        usuario_id: session.id,
        accion: 'Eliminar',
        modulo: 'Órdenes de Trabajo',
        descripcion: `Orden eliminada: ${orden.numero_orden}`,
        datos: { orden_id: ordenId },
      },
    })
    
    return NextResponse.json({ success: true, message: 'Orden eliminada correctamente' })
  } catch (error: any) {
    console.error('[v0] Error deleting orden:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar la orden' },
      { status: 500 }
    )
  }
}
