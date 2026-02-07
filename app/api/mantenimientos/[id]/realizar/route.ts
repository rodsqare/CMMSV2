import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { addDays } from 'date-fns'

const realizarMantenimientoSchema = z.object({
  tiempo_real: z.number().optional(),
  costo: z.number().optional(),
  observaciones: z.string().optional(),
  tareas_realizadas: z.any().optional(),
  estado_equipo: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body = await request.json()
    
    const validation = realizarMantenimientoSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }
    
    const data = validation.data
    
    // Obtener mantenimiento
    const mantenimiento = await prisma.mantenimiento.findUnique({
      where: { id: parseInt(id) },
      include: { equipo: true },
    })
    
    if (!mantenimiento) {
      return NextResponse.json(
        { error: 'Mantenimiento no encontrado' },
        { status: 404 }
      )
    }
    
    // Crear registro de realización
    const realizacion = await prisma.mantenimientoRealizado.create({
      data: {
        mantenimiento_id: mantenimiento.id,
        equipo_id: mantenimiento.equipo_id,
        realizado_por: session.id,
        tiempo_real: data.tiempo_real,
        costo: data.costo,
        observaciones: data.observaciones,
        tareas_realizadas: data.tareas_realizadas,
        estado_equipo: data.estado_equipo,
      },
      include: {
        tecnico: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    })
    
    // Calcular próxima fecha
    const proximaFecha = addDays(new Date(), mantenimiento.frecuencia_dias)
    
    // Actualizar mantenimiento programado
    await prisma.mantenimiento.update({
      where: { id: mantenimiento.id },
      data: {
        ultima_realizacion: new Date(),
        proxima_programada: proximaFecha,
      },
    })
    
    // Actualizar equipo
    await prisma.equipo.update({
      where: { id: mantenimiento.equipo_id },
      data: {
        ultima_mantencion: new Date(),
        proxima_mantencion: proximaFecha,
        estado: data.estado_equipo || mantenimiento.equipo.estado,
      },
    })
    
    // Crear log
    await prisma.log.create({
      data: {
        usuario_id: session.id,
        accion: 'realizar',
        modulo: 'mantenimientos',
        descripcion: `Mantenimiento realizado para equipo ${mantenimiento.equipo.nombre}`,
        datos: { 
          mantenimiento_id: mantenimiento.id,
          realizacion_id: realizacion.id,
        },
      },
    })
    
    return NextResponse.json(realizacion, { status: 201 })
  } catch (error: any) {
    console.error('[v0] Error realizando mantenimiento:', error)
    return NextResponse.json(
      { error: error.message || 'Error al realizar mantenimiento' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}
