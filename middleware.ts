import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/api/auth/login', '/api/auth/session']
  
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // Verificar token para rutas protegidas
  if (pathname.startsWith('/api') || pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('token')
    
    if (!token) {
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    const session = await verifyToken(token.value)
    
    if (!session) {
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { error: 'Token inválido' },
          { status: 401 }
        )
      }
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('token')
      return response
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/equipos/:path*',
    '/ordenes/:path*',
    '/mantenimientos/:path*',
  ],
}
