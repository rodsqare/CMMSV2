import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET - Obtener notificaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const leida = searchParams.get('leida')
    const limit = searchParams.get('limit')
    
    const where: any = {
      usuario_id: session.id,
    }
    
    if (leida !== null) {
      where.leida = leida === 'true'
    }
    
    const notificaciones = await prisma.notificacion.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    })
    
    return NextResponse.json(notificaciones)
  } catch (error: any) {
    console.error('[v0] Error fetching notificaciones:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener notificaciones' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}

// GET - Contar notificaciones no leídas
export async function HEAD(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    const count = await prisma.notificacion.count({
      where: {
        usuario_id: session.id,
        leida: false,
      },
    })
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Unread-Count': count.toString(),
      },
    })
  } catch (error: any) {
    console.error('[v0] Error counting notificaciones:', error)
    return new NextResponse(null, { status: 500 })
  }
}
