import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken, verifyPassword } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password requerido'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }
    
    const { email, password } = validation.data
    
    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    })
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }
    
    // Verificar si está bloqueado
    if (usuario.bloqueado_hasta && usuario.bloqueado_hasta > new Date()) {
      return NextResponse.json(
        { error: 'Usuario bloqueado temporalmente' },
        { status: 403 }
      )
    }
    
    // Verificar si está activo
    if (!usuario.activo) {
      return NextResponse.json(
        { error: 'Usuario inactivo' },
        { status: 403 }
      )
    }
    
    // Verificar password
    const passwordValido = await verifyPassword(password, usuario.password)
    
    if (!passwordValido) {
      // Incrementar intentos fallidos
      const intentos = usuario.intentos_fallidos + 1
      const updates: any = { intentos_fallidos: intentos }
      
      // Bloquear si supera 5 intentos
      if (intentos >= 5) {
        updates.bloqueado_hasta = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
      }
      
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: updates,
      })
      
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }
    
    // Login exitoso - resetear intentos fallidos
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        intentos_fallidos: 0,
        bloqueado_hasta: null,
        ultimo_acceso: new Date(),
      },
    })
    
    // Generar token
    const token = await generateToken({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
    })
    
    // Crear log
    await prisma.log.create({
      data: {
        usuario_id: usuario.id,
        accion: 'login',
        modulo: 'auth',
        descripcion: 'Inicio de sesión exitoso',
        ip_address: request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown',
        user_agent: request.headers.get('user-agent') || undefined,
      },
    })
    
    // Crear respuesta con cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
      token,
    })
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    })
    
    return response
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
}
