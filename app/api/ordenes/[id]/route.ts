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
    
    const orden = await prisma.ordenTrabajo.findUnique({
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
            usuario: {
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
  estado: z.string().optional(),
  prioridad: z.string().optional(),
  descripcion: z.string().optional(),
  fecha_programada: z.string().optional(),
  fecha_inicio: z.string().optional(),
  fecha_finalizacion: z.string().optional(),
  tiempo_real: z.number().optional(),
  costo_real: z.number().optional(),
  asignado_a: z.number().nullable().optional(),
  notas: z.string().optional(),
  resultado: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body = await request.json()
    
    const validation = updateOrdenSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }
    
    const data = validation.data
    
    const ordenExistente = await prisma.ordenTrabajo.findUnique({
      where: { id: parseInt(id) },
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
    
    const orden = await prisma.ordenTrabajo.update({
      where: { id: parseInt(id) },
      data: {
        ...data,
        fecha_programada: data.fecha_programada 
          ? new Date(data.fecha_programada) 
          : undefined,
        fecha_inicio: data.fecha_inicio 
          ? new Date(data.fecha_inicio) 
          : undefined,
        fecha_finalizacion: data.fecha_finalizacion 
          ? new Date(data.fecha_finalizacion) 
          : undefined,
      },
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
        accion: 'actualizar',
        modulo: 'ordenes',
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
    return NextResponse.json(
      { error: error.message || 'Error al actualizar orden' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
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
    
    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id: parseInt(id) },
    })
    
    if (!orden) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }
    
    await prisma.ordenTrabajo.delete({
      where: { id: parseInt(id) },
    })
    
    // Crear log
    await prisma.log.create({
      data: {
        usuario_id: session.id,
        accion: 'eliminar',
        modulo: 'ordenes',
        descripcion: `Orden eliminada: ${orden.numero_orden}`,
        datos: { orden_id: orden.id },
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[v0] Error deleting orden:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar orden' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}
