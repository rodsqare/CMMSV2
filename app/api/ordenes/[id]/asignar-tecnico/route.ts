import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

// POST - Asignar técnico a una orden
const asignarTecnicoSchema = z.object({
  tecnico_id: z.number({ required_error: 'Técnico requerido' }),
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
    console.log('[v0] POST /ordenes/[id]/asignar-tecnico - Received:', body)

    const validation = asignarTecnicoSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      )
    }

    const { tecnico_id } = validation.data

    // Verificar que el técnico existe
    const tecnico = await prisma.usuario.findUnique({
      where: { id: tecnico_id },
    })

    if (!tecnico) {
      return NextResponse.json(
        { error: 'Técnico no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar la orden
    const orden = await prisma.orden_trabajo.update({
      where: { id: ordenId },
      data: { asignado_a: tecnico_id },
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

    // Crear notificación
    await prisma.notificacion.create({
      data: {
        usuario_id: tecnico_id,
        tipo: 'orden_asignada',
        titulo: 'Nueva orden asignada',
        mensaje: `Se te ha asignado la orden ${orden.numero_orden}`,
        datos: { orden_id: orden.id },
      },
    })

    // Crear log
    await prisma.log.create({
      data: {
        usuario_id: session.id,
        accion: 'Asignar',
        modulo: 'Órdenes de Trabajo',
        descripcion: `Técnico asignado a orden ${orden.numero_orden}: ${tecnico.nombre}`,
        datos: { orden_id: orden.id, tecnico_id },
      },
    })

    return NextResponse.json(orden)
  } catch (error: any) {
    console.error('[v0] Error assigning technician:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Error al asignar técnico' },
      { status: 500 }
    )
  }
}
