import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole, hashPassword } from '@/lib/auth'
import { z } from 'zod'

// GET - Obtener detalles de un usuario
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    
    const id = parseInt(params.id)
    
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        ultimo_acceso: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            ordenesCreadas: true,
            ordenesAsignadas: true,
            mantenimientosRealizados: true,
          },
        },
      },
    })
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(usuario)
  } catch (error: any) {
    console.error('[v0] Error fetching usuario details:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener detalles del usuario' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}

// PUT - Actualizar usuario
const updateUsuarioSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').optional(),
  email: z.string().email('Email inválido').optional(),
  rol: z.enum(['admin', 'supervisor', 'tecnico', 'viewer']).optional(),
  activo: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['admin'])
    
    const id = parseInt(params.id)
    const body = await request.json()
    
    const validation = updateUsuarioSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors?.[0]?.message || 'Validación fallida'
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      )
    }
    
    const data = validation.data
    
    // Verificar que el usuario existe
    const usuarioExiste = await prisma.usuario.findUnique({
      where: { id },
    })
    
    if (!usuarioExiste) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    
    // Si se cambió el email, verificar que no esté en uso
    if (data.email && data.email !== usuarioExiste.email) {
      const emailEnUso = await prisma.usuario.findUnique({
        where: { email: data.email },
      })
      
      if (emailEnUso) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con ese email' },
          { status: 400 }
        )
      }
    }
    
    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        ultimo_acceso: true,
        created_at: true,
        updated_at: true,
      },
    })
    
    return NextResponse.json(usuario)
  } catch (error: any) {
    console.error('[v0] Error updating usuario:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar usuario' },
      { status: error.message?.includes('permisos') ? 403 : 500 }
    )
  }
}

// DELETE - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['admin'])
    
    const id = parseInt(params.id)
    
    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id },
    })
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    
    await prisma.usuario.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[v0] Error deleting usuario:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar usuario' },
      { status: error.message?.includes('permisos') ? 403 : 500 }
    )
  }
}
