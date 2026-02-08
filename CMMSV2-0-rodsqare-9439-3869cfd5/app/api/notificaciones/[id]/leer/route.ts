import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// PUT - Marcar notificación como leída
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    
    // Verificar que la notificación pertenece al usuario
    const notificacion = await prisma.notificacion.findUnique({
      where: { id: parseInt(id) },
    })
    
    if (!notificacion) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      )
    }
    
    if (notificacion.usuario_id !== session.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }
    
    const actualizada = await prisma.notificacion.update({
      where: { id: parseInt(id) },
      data: { leida: true },
    })
    
    return NextResponse.json(actualizada)
  } catch (error: any) {
    console.error('[v0] Error marking notificacion:', error)
    return NextResponse.json(
      { error: error.message || 'Error al marcar notificación' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}
