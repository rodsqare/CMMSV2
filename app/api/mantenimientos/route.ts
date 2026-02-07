import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { addDays } from 'date-fns'

// GET - Listar mantenimientos programados
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const equipo_id = searchParams.get('equipo_id')
    const tipo = searchParams.get('tipo')
    const activo = searchParams.get('activo')
    const proximos = searchParams.get('proximos') // próximos N días
    
    const where: any = {}
    
    if (equipo_id) where.equipo_id = parseInt(equipo_id)
    if (tipo) where.tipo = tipo
    if (activo !== null) where.activo = activo === 'true'
    
    if (proximos) {
      const dias = parseInt(proximos)
      where.proxima_programada = {
        lte: addDays(new Date(), dias),
      }
    }
    
    const mantenimientos = await prisma.mantenimiento.findMany({
      where,
      orderBy: { proxima_programada: 'asc' },
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
    
    return NextResponse.json(mantenimientos)
  } catch (error: any) {
    console.error('[v0] Error fetching mantenimientos:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener mantenimientos' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}

// POST - Crear mantenimiento programado
const createMantenimientoSchema = z.object({
  equipo_id: z.number({ required_error: 'Equipo requerido' }),
  tipo: z.string().min(1, 'Tipo requerido'),
  frecuencia: z.string().min(1, 'Frecuencia requerida'),
  frecuencia_dias: z.number({ required_error: 'Frecuencia en días requerida' }),
  proxima_programada: z.string({ required_error: 'Fecha próxima requerida' }),
  descripcion: z.string().min(1, 'Descripción requerida'),
  procedimiento: z.string().optional(),
  tiempo_estimado: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    
    const validation = createMantenimientoSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }
    
    const data = validation.data
    
    const mantenimiento = await prisma.mantenimiento.create({
      data: {
        equipo_id: data.equipo_id,
        tipo: data.tipo,
        frecuencia: data.frecuencia,
        frecuencia_dias: data.frecuencia_dias,
        proxima_programada: new Date(data.proxima_programada),
        descripcion: data.descripcion,
        procedimiento: data.procedimiento,
        tiempo_estimado: data.tiempo_estimado,
        activo: true,
        creado_por: session.id,
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
      },
    })
    
    // Crear log
    await prisma.log.create({
      data: {
        usuario_id: session.id,
        accion: 'crear',
        modulo: 'mantenimientos',
        descripcion: `Mantenimiento programado: ${mantenimiento.tipo} para equipo ${mantenimiento.equipo_id}`,
        datos: { mantenimiento_id: mantenimiento.id },
      },
    })
    
    return NextResponse.json(mantenimiento, { status: 201 })
  } catch (error: any) {
    console.error('[v0] Error creating mantenimiento:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear mantenimiento' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}
