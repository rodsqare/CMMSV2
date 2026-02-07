import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production'
)

export interface JWTPayload {
  id: number
  email: string
  nombre: string
  rol: string
}

// Generar token JWT
export async function generateToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
  
  return token
}

// Verificar token JWT
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch (error) {
    console.error('[v0] Error verifying token:', error)
    return null
  }
}

// Obtener usuario de la sesión actual
export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')
  
  if (!token) return null
  
  return verifyToken(token.value)
}

// Hash de password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Verificar password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Middleware para verificar autenticación
export async function requireAuth(): Promise<JWTPayload> {
  const session = await getSession()
  
  if (!session) {
    throw new Error('No autorizado')
  }
  
  return session
}

// Middleware para verificar rol
export async function requireRole(roles: string[]): Promise<JWTPayload> {
  const session = await requireAuth()
  
  if (!roles.includes(session.rol)) {
    throw new Error('No tienes permisos para esta acción')
  }
  
  return session
}
