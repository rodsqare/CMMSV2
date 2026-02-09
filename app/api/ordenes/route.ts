import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

// GET - Listar órdenes de trabajo
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const equipo_id = searchParams.get('equipo_id')
    const estado = searchParams.get('estado')
    const prioridad = searchParams.get('prioridad')
    const tipo = searchParams.get('tipo')
    const asignado_a = searchParams.get('asignado_a')
    
    const where: any = {}
    
    if (equipo_id) where.equipo_id = parseInt(equipo_id)
    if (estado) where.estado = estado
    if (prioridad) where.prioridad = prioridad
    if (tipo) where.tipo = tipo
    if (asignado_a) where.asignado_a = parseInt(asignado_a)
    
    const ordenes = await prisma.orden_trabajo.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        equipo: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            ubicacion: true,
          },
        },
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
        _count: {
          select: {
            documentos: true,
          },
        },
      },
    })
    
    return NextResponse.json(ordenes)
  } catch (error: any) {
    console.error('[v0] Error fetching ordenes:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener órdenes' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}

// POST - Crear orden de trabajo
const createOrdenSchema = z.object({
  equipo_id: z.number({ required_error: 'Equipo requerido' }).or(z.string().transform(Number)),
  tipo: z.string().min(1, 'Tipo requerido'),
  prioridad: z.string().min(1, 'Prioridad requerida'),
  descripcion: z.string().min(1, 'Descripción requerida'),
  fecha_programada: z.string().optional().or(z.null()),
  tiempo_estimado: z.number().optional().or(z.null()),
  costo_estimado: z.number().optional().or(z.null()),
  asignado_a: z.number().optional().or(z.null()),
}).strict()

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    
    console.log('[v0] POST /ordenes - Received body:', JSON.stringify(body, null, 2))
    
    const validation = createOrdenSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code
      }))
      console.error('[v0] POST /ordenes - Validation errors:', errors)
      const firstError = errors[0]?.message || 'Validación fallida'
      return NextResponse.json(
        { error: firstError, details: errors },
        { status: 400 }
      )
    }
    
    const data = validation.data
    
    // Generar número de orden único
    const ultimaOrden = await prisma.orden_trabajo.findFirst({
      orderBy: { id: 'desc' },
    })
    
    const numeroOrden = `OT-${String((ultimaOrden?.id || 0) + 1).padStart(6, '0')}`
    
    const orden = await prisma.orden_trabajo.create({
      data: {
        numero_orden: numeroOrden,
        equipo_id: data.equipo_id,
        tipo: data.tipo,
        prioridad: data.prioridad,
        descripcion: data.descripcion,
        estado: 'pendiente',
        fecha_programada: data.fecha_programada 
          ? new Date(data.fecha_programada) 
          : undefined,
        tiempo_estimado: data.tiempo_estimado,
        costo_estimado: data.costo_estimado,
        creado_por: session.id,
        asignado_a: data.asignado_a,
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
        accion: 'Crear',
        modulo: 'Órdenes de Trabajo',
        descripcion: `Orden de trabajo creada: ${orden.numero_orden}`,
        datos: { orden_id: orden.id },
      },
    })
    
    // Crear notificación si hay técnico asignado
    if (data.asignado_a) {
      await prisma.notificacion.create({
        data: {
          usuario_id: data.asignado_a,
          tipo: 'orden_asignada',
          titulo: 'Nueva orden asignada',
          mensaje: `Se te ha asignado la orden ${orden.numero_orden}`,
          datos: { orden_id: orden.id },
        },
      })
    }
    
    return NextResponse.json(orden, { status: 201 })
  } catch (error: any) {
    console.error('[v0] Error creating orden:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear orden' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}
