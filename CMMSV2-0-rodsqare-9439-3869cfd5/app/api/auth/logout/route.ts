import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (session) {
      // Crear log
      await prisma.log.create({
        data: {
          usuario_id: session.id,
          accion: 'logout',
          modulo: 'auth',
          descripcion: 'Cierre de sesión',
          ip_address: request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown',
          user_agent: request.headers.get('user-agent') || undefined,
        },
      })
    }
    
    const response = NextResponse.json({ success: true })
    
    // Eliminar cookie
    response.cookies.delete('token')
    
    return response
  } catch (error) {
    console.error('[v0] Logout error:', error)
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}
