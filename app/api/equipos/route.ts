import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

// GET - Listar equipos con filtros
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const estado = searchParams.get('estado')
    const criticidad = searchParams.get('criticidad')
    const search = searchParams.get('search')
    
    const where: any = {}
    
    if (tipo) where.tipo = tipo
    if (estado) where.estado = estado
    if (criticidad) where.criticidad = criticidad
    if (search) {
      where.OR = [
        { codigo: { contains: search } },
        { nombre: { contains: search } },
        { marca: { contains: search } },
        { modelo: { contains: search } },
        { ubicacion: { contains: search } },
      ]
    }
    
    const equipos = await prisma.equipo.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: {
            ordenesTrabajo: true,
            mantenimientos: true,
            documentos: true,
          },
        },
      },
    })
    
    return NextResponse.json(equipos)
  } catch (error: any) {
    console.error('[v0] Error fetching equipos:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener equipos' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}

// POST - Crear equipo
const createEquipoSchema = z.object({
  codigo: z.string().min(1, 'Código requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  tipo: z.string().min(1, 'Tipo requerido'),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  numero_serie: z.string().optional(),
  ubicacion: z.string().optional(),
  fecha_adquisicion: z.string().optional(),
  vida_util_anos: z.number().optional(),
  valor_adquisicion: z.number().optional(),
  estado: z.string().min(1, 'Estado requerido'),
  criticidad: z.string().min(1, 'Criticidad requerida'),
  descripcion: z.string().optional(),
  especificaciones: z.any().optional(),
  horas_operacion: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    
    const validation = createEquipoSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }
    
    const data = validation.data
    
    // Verificar que el código no exista
    const existente = await prisma.equipo.findUnique({
      where: { codigo: data.codigo },
    })
    
    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe un equipo con ese código' },
        { status: 400 }
      )
    }
    
    const equipo = await prisma.equipo.create({
      data: {
        ...data,
        fecha_adquisicion: data.fecha_adquisicion 
          ? new Date(data.fecha_adquisicion) 
          : undefined,
      },
    })
    
    // Crear log
    await prisma.log.create({
      data: {
        usuario_id: session.id,
        accion: 'crear',
        modulo: 'equipos',
        descripcion: `Equipo creado: ${equipo.nombre}`,
        datos: { equipo_id: equipo.id },
      },
    })
    
    return NextResponse.json(equipo, { status: 201 })
  } catch (error: any) {
    console.error('[v0] Error creating equipo:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear equipo' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}
