import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

// GET - Listar logs (solo admin/supervisor)
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'supervisor'])
    
    const { searchParams } = new URL(request.url)
    const modulo = searchParams.get('modulo')
    const accion = searchParams.get('accion')
    const usuario_id = searchParams.get('usuario_id')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    
    const where: any = {}
    
    if (modulo) where.modulo = modulo
    if (accion) where.accion = accion
    if (usuario_id) where.usuario_id = parseInt(usuario_id)
    
    const logs = await prisma.log.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit ? parseInt(limit) : 100,
      skip: offset ? parseInt(offset) : 0,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
      },
    })
    
    const total = await prisma.log.count({ where })
    
    return NextResponse.json({
      logs,
      total,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    })
  } catch (error: any) {
    console.error('[v0] Error fetching logs:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener logs' },
      { status: error.message?.includes('permisos') ? 403 : 500 }
    )
  }
}
