import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

// POST - Cambiar estado de una orden
const cambiarEstadoSchema = z.object({
  estado: z.string({ required_error: 'Estado requerido' }).min(1),
  observaciones: z.string().optional(),
})

export async function POST(
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

    const body = await request.json()
    console.log('[v0] POST /ordenes/[id]/cambiar-estado - Received:', body)

    const validation = cambiarEstadoSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      )
    }

    const { estado, observaciones } = validation.data

    // Obtener orden actual
    const ordenExistente = await prisma.orden_trabajo.findUnique({
      where: { id: ordenId },
    })

    if (!ordenExistente) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    // Actualizar la orden
    const orden = await prisma.orden_trabajo.update({
      where: { id: ordenId },
      data: {
        estado: estado.toLowerCase().replace(/\s+/g, '_'),
        ...(observaciones && { notas: observaciones }),
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

    // Crear notificación para el creador de la orden
    await prisma.notificacion.create({
      data: {
        usuario_id: ordenExistente.creado_por,
        tipo: 'orden_actualizada',
        titulo: 'Estado de orden actualizado',
        mensaje: `La orden ${orden.numero_orden} cambió a estado: ${estado}`,
        datos: { orden_id: orden.id },
      },
    })

    // Crear log
    await prisma.log.create({
      data: {
        usuario_id: session.id,
        accion: 'Cambiar Estado',
        modulo: 'Órdenes de Trabajo',
        descripcion: `Estado de orden ${orden.numero_orden} cambiado a: ${estado}`,
        datos: { orden_id: orden.id, estado_anterior: ordenExistente.estado, estado_nuevo: estado },
      },
    })

    return NextResponse.json(orden)
  } catch (error: any) {
    console.error('[v0] Error changing status:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Error al cambiar el estado' },
      { status: 500 }
    )
  }
}
