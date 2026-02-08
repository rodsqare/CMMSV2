import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole, hashPassword } from '@/lib/auth'
import { z } from 'zod'

// GET - Listar usuarios
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const rol = searchParams.get('rol')
    const activo = searchParams.get('activo')
    
    const where: any = {}
    
    if (rol) where.rol = rol
    if (activo !== null) where.activo = activo === 'true'
    
    const usuarios = await prisma.usuario.findMany({
      where,
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        ultimo_acceso: true,
        created_at: true,
        _count: {
          select: {
            ordenesCreadas: true,
            ordenesAsignadas: true,
            mantenimientosRealizados: true,
          },
        },
      },
    })
    
    return NextResponse.json(usuarios)
  } catch (error: any) {
    console.error('[v0] Error fetching usuarios:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener usuarios' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}

// POST - Crear usuario (solo admin)
const createUsuarioSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres'),
  rol: z.enum(['admin', 'supervisor', 'tecnico', 'viewer'], {
    required_error: 'Rol requerido',
  }),
  activo: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin'])
    const body = await request.json()
    
    const validation = createUsuarioSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors?.[0]?.message || 'Validación fallida'
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      )
    }
    
    const data = validation.data
    
    // Verificar que el email no exista
    const existente = await prisma.usuario.findUnique({
      where: { email: data.email },
    })
    
    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese email' },
        { status: 400 }
      )
    }
    
    // Hashear password
    const passwordHash = await hashPassword(data.password)
    
    const usuario = await prisma.usuario.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        password: passwordHash,
        rol: data.rol,
        activo: data.activo ?? true,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        created_at: true,
      },
    })
    
    return NextResponse.json(usuario, { status: 201 })
  } catch (error: any) {
    console.error('[v0] Error creating usuario:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear usuario' },
      { status: error.message?.includes('permisos') ? 403 : 500 }
    )
  }
}
