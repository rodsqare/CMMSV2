"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export type Usuario = {
  id?: number
  nombre: string
  email: string
  correo?: string
  rol: string
  activo: boolean
  especialidad?: string
  permissions?: any
  estado?: string
  created_at?: string | Date
  updated_at?: string | Date
}

export type UsuarioWithPassword = Usuario & {
  password?: string
}

export type FetchUsuariosParams = {
  page?: number
  perPage?: number
  rol?: string
  estado?: string
  search?: string
}

export type UsuariosResponse = {
  data: Usuario[]
  total: number
  page: number
  perPage: number
}

export type UserActivity = {
  equipos: number
  mantenimientos: number
  ordenes: number
}

export async function fetchUsuarios(params: FetchUsuariosParams = {}): Promise<UsuariosResponse> {
  try {
    const page = params.page || 1
    const perPage = params.perPage || 10
    const skip = (page - 1) * perPage

    const where: any = {}
    
    if (params.rol) {
      where.rol = params.rol
    }
    
    if (params.estado) {
      where.activo = params.estado === 'activo'
    }
    
    if (params.search) {
      where.OR = [
        { nombre: { contains: params.search } },
        { email: { contains: params.search } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          email: true,
          correo: true,
          rol: true,
          activo: true,
          especialidad: true,
          created_at: true,
          updated_at: true,
        },
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' }
      }),
      prisma.usuario.count({ where })
    ])

    return { 
      data: data.map(u => ({ 
        ...u,
        correo: u.correo || u.email,
        especialidad: u.especialidad || "",
        estado: u.activo ? 'activo' : 'inactivo',
        created_at: u.created_at ? u.created_at.toISOString() : undefined,
        updated_at: u.updated_at ? u.updated_at.toISOString() : undefined,
      })),
      total, 
      page, 
      perPage 
    }
  } catch (error) {
    console.error("Error fetching usuarios:", error)
    return { data: [], total: 0, page: 1, perPage: 10 }
  }
}

export async function fetchUsuarioDetails(id: number): Promise<Usuario | null> {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        email: true,
        correo: true,
        rol: true,
        activo: true,
        especialidad: true,
        created_at: true,
        updated_at: true,
      }
    })
    
    if (!usuario) return null
    
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      correo: usuario.correo,
      rol: usuario.rol,
      activo: usuario.activo,
      especialidad: usuario.especialidad,
      estado: usuario.activo ? 'activo' : 'inactivo',
      created_at: usuario.created_at ? usuario.created_at.toISOString() : undefined,
      updated_at: usuario.updated_at ? usuario.updated_at.toISOString() : undefined,
    }
  } catch (error) {
    console.error("[v0] Error fetching usuario details:", error)
    return null
  }
}

export async function saveUsuario(usuario: UsuarioWithPassword): Promise<{
  success: boolean
  usuario?: Usuario
  error?: string
}> {
  try {
    // Map frontend fields to API fields
    const email = usuario.email || usuario.correo || usuario.email
    const correo = usuario.correo || usuario.email
    const especialidad = usuario.especialidad || ""
    const activo = usuario.activo !== undefined ? usuario.activo : (usuario.estado?.toLowerCase() === 'activo' ? true : false)
    
    console.log("[v0] saveUsuario called with:", { 
      id: usuario.id, 
      nombre: usuario.nombre, 
      email,
      correo,
      especialidad,
      rol: usuario.rol,
      activo,
      hasPassword: !!usuario.password
    })

    let savedUsuario: any

    if (usuario.id) {
      // Update existing usuario
      const updateData: any = {
        nombre: usuario.nombre,
        email: email,
        correo: correo,
        especialidad: especialidad,
        rol: usuario.rol,
        activo: activo,
        updated_at: new Date(),
      }
      
      if (usuario.password) {
        updateData.password = await bcrypt.hash(usuario.password, 10)
      }
      
      console.log("[v0] Updating usuario with data:", updateData)
      
      savedUsuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: updateData,
        select: {
          id: true,
          nombre: true,
          email: true,
          correo: true,
          especialidad: true,
          rol: true,
          activo: true,
          created_at: true,
          updated_at: true,
        }
      })
    } else {
      // Create new usuario
      if (!usuario.password) {
        return { success: false, error: "La contraseña es requerida" }
      }
      
      console.log("[v0] Creating new usuario with data:", { 
        nombre: usuario.nombre, 
        email,
        correo,
        especialidad,
        rol: usuario.rol,
        activo
      })
      
      savedUsuario = await prisma.usuario.create({
        data: {
          nombre: usuario.nombre,
          email: email,
          correo: correo,
          especialidad: especialidad,
          password: await bcrypt.hash(usuario.password, 10),
          rol: usuario.rol,
          activo: activo ?? true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          correo: true,
          especialidad: true,
          rol: true,
          activo: true,
          created_at: true,
          updated_at: true,
        }
      })
    }

    console.log("[v0] Usuario saved successfully:", { 
      id: savedUsuario.id,
      nombre: savedUsuario.nombre,
      activo: savedUsuario.activo
    })

    return {
      success: true,
      usuario: { 
        ...savedUsuario, 
        estado: savedUsuario.activo ? 'activo' : 'inactivo',
      },
    }
  } catch (error: any) {
    console.error("[v0] Error saving usuario:", error)
    return {
      success: false,
      error: error.message || "Error al guardar el usuario",
    }
  }
}

export async function removeUsuario(id: number): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await prisma.usuario.delete({
      where: { id }
    })
    return { success: true }
  } catch (error: any) {
    console.error("Error removing usuario:", error)
    return {
      success: false,
      error: error.message || "Error al eliminar el usuario",
    }
  }
}

export async function updatePermissions(
  id: number,
  permissions: Usuario["permissions"],
): Promise<{
  success: boolean
  usuario?: Usuario
  error?: string
}> {
  try {
    // Permissions can be stored as JSON in the database if needed
    const updatedUsuario = await prisma.usuario.update({
      where: { id },
      data: { updated_at: new Date() },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        created_at: true,
        updated_at: true,
      }
    })
    
    return {
      success: true,
      usuario: { ...updatedUsuario, estado: updatedUsuario.activo ? 'activo' : 'inactivo', permissions },
    }
  } catch (error: any) {
    console.error("Error updating permissions:", error)
    return {
      success: false,
      error: error.message || "Error al actualizar permisos",
    }
  }
}

export async function resetPassword(
  id: number,
  newPassword: string,
): Promise<{
  success: boolean
  usuario?: Usuario
  error?: string
}> {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const updatedUsuario = await prisma.usuario.update({
      where: { id },
      data: { 
        password: hashedPassword,
        updated_at: new Date() 
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        created_at: true,
        updated_at: true,
      }
    })
    
    return {
      success: true,
      usuario: { ...updatedUsuario, estado: updatedUsuario.activo ? 'activo' : 'inactivo' },
    }
  } catch (error: any) {
    console.error("Error resetting password:", error)
    return {
      success: false,
      error: error.message || "Error al restablecer la contraseña",
    }
  }
}

export async function toggleUserStatus(
  id: number,
  nuevoEstado: "Activo" | "Inactivo",
): Promise<{
  success: boolean
  usuario?: Usuario
  error?: string
}> {
  try {
    const activo = nuevoEstado === "Activo"
    const usuario = await prisma.usuario.update({
      where: { id },
      data: { 
        activo,
        updated_at: new Date() 
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        created_at: true,
        updated_at: true,
      }
    })

    return {
      success: true,
      usuario: { ...usuario, estado: usuario.activo ? 'activo' : 'inactivo' },
    }
  } catch (error: any) {
    console.error("Error changing user status:", error)
    return {
      success: false,
      error: error.message || "Error al cambiar el estado del usuario",
    }
  }
}

export async function getUserActivity(usuarioId: number, token: string): Promise<UserActivity> {
  try {
    const [usuario, ordenesCreadas, ordenesAsignadas, recentLogs] = await Promise.all([
      prisma.usuario.findUnique({ where: { id: usuarioId }, select: { ultimo_acceso: true } }),
      prisma.orden_trabajo.count({ where: { creado_por: usuarioId } }),
      prisma.orden_trabajo.count({ where: { asignado_a: usuarioId } }),
      prisma.log.findMany({
        where: { usuario_id: usuarioId },
        select: { id: true, accion: true, modulo: true, descripcion: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
    ])
    
    return { 
      ultimo_acceso: usuario?.ultimo_acceso?.toISOString() || null,
      ordenes_creadas: ordenesCreadas,
      ordenes_asignadas: ordenesAsignadas,
      actividades_recientes: recentLogs.map(log => ({
        id: log.id,
        timestamp: log.created_at.toISOString(),
        accion: log.accion,
        descripcion: log.descripcion,
        modulo: log.modulo,
      }))
    }
  } catch (error) {
    console.error("[v0] Error fetching user activity:", error)
    return { 
      ultimo_acceso: null,
      ordenes_creadas: 0,
      ordenes_asignadas: 0,
      actividades_recientes: []
    }
  }
}
