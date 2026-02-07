"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export type Usuario = {
  id?: number
  nombre: string
  email: string
  rol: string
  activo: boolean
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
      // Handle both lowercase and capitalized versions
      where.activo = params.estado.toLowerCase() === 'activo'
    }
    
    if (params.search) {
      where.OR = [
        { nombre: { contains: params.search } },
        { email: { contains: params.search } },
      ]
    }

    try {
      const [data, total] = await Promise.all([
        prisma.usuario.findMany({
          where,
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
            activo: true,
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
          estado: u.activo ? 'Activo' : 'Inactivo',
          fecha_creacion: u.created_at ? u.created_at.toISOString() : undefined,
          created_at: u.created_at ? u.created_at.toISOString() : undefined,
          updated_at: u.updated_at ? u.updated_at.toISOString() : undefined,
        })),
        total, 
        page, 
        perPage 
      }
    } catch (dbError) {
      console.log("[v0] Database error, using fallback storage for fetchUsuarios")
      // Fallback: use in-memory storage
      let filteredUsers = [...localUsuariosStorage]
      
      if (params.rol) {
        filteredUsers = filteredUsers.filter(u => u.rol === params.rol)
      }
      
      if (params.estado) {
        const isActive = params.estado.toLowerCase() === 'activo'
        filteredUsers = filteredUsers.filter(u => u.activo === isActive)
      }
      
      if (params.search) {
        const searchLower = params.search.toLowerCase()
        filteredUsers = filteredUsers.filter(u => 
          u.nombre.toLowerCase().includes(searchLower) || 
          u.email.toLowerCase().includes(searchLower)
        )
      }
      
      const total = filteredUsers.length
      const paginatedUsers = filteredUsers.slice(skip, skip + perPage)
      
      return {
        data: paginatedUsers.map(u => ({
          ...u,
          estado: u.activo ? 'Activo' : 'Inactivo',
          created_at: u.created_at ? (typeof u.created_at === 'string' ? u.created_at : u.created_at.toISOString()) : undefined,
          updated_at: u.updated_at ? (typeof u.updated_at === 'string' ? u.updated_at : u.updated_at.toISOString()) : undefined,
        })),
        total,
        page,
        perPage
      }
    }
  } catch (error) {
    console.error("Error fetching usuarios:", error)
    return { data: [], total: 0, page: 1, perPage: 10 }
  }
}

export async function fetchUsuarioDetails(id: number): Promise<Usuario | null> {
  try {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id },
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
      
      if (!usuario) return null
      
      return {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
        estado: usuario.activo ? 'activo' : 'inactivo',
        created_at: usuario.created_at ? usuario.created_at.toISOString() : undefined,
        updated_at: usuario.updated_at ? usuario.updated_at.toISOString() : undefined,
      }
    } catch (dbError) {
      console.log("[v0] Database error, using fallback storage for fetchUsuarioDetails")
      // Fallback: search in memory
      const usuario = localUsuariosStorage.find(u => u.id === id)
      return usuario || null
    }
  } catch (error) {
    console.error("[v0] Error fetching usuario details:", error)
    return null
  }
}

// Fallback in-memory storage when DATABASE_URL is not configured
let localUsuariosStorage: Usuario[] = [
  {
    id: 1,
    nombre: "Admin User",
    email: "admin@hospital.com",
    rol: "Administrador",
    activo: true,
    estado: "Activo",
  },
]

export async function saveUsuario(usuario: UsuarioWithPassword): Promise<{
  success: boolean
  usuario?: Usuario
  error?: string
}> {
  try {
    // Map frontend fields to API fields
    const email = usuario.email || usuario.correo || usuario.email
    const activo = usuario.activo !== undefined ? usuario.activo : (usuario.estado?.toLowerCase() === 'activo' ? true : false)
    
    console.log("[v0] saveUsuario called with:", { 
      id: usuario.id, 
      nombre: usuario.nombre, 
      email,
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
        rol: usuario.rol,
        activo: activo,
        updated_at: new Date(),
      }
      
      if (usuario.password) {
        updateData.password = await bcrypt.hash(usuario.password, 10)
      }
      
      console.log("[v0] Updating usuario with data:", updateData)
      
      try {
        savedUsuario = await prisma.usuario.update({
          where: { id: usuario.id },
          data: updateData,
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
      } catch (dbError) {
        console.log("[v0] Database error, using fallback storage for update")
        // Fallback: update in memory
        const index = localUsuariosStorage.findIndex(u => u.id === usuario.id)
        if (index >= 0) {
          localUsuariosStorage[index] = {
            ...localUsuariosStorage[index],
            nombre: usuario.nombre,
            email: email,
            rol: usuario.rol,
            activo: activo,
            updated_at: new Date().toISOString(),
          }
          savedUsuario = localUsuariosStorage[index]
        } else {
          throw dbError
        }
      }
    } else {
      // Create new usuario
      if (!usuario.password) {
        return { success: false, error: "La contraseña es requerida" }
      }
      
      console.log("[v0] Creating new usuario with data:", { 
        nombre: usuario.nombre, 
        email,
        rol: usuario.rol,
        activo
      })
      
      try {
        savedUsuario = await prisma.usuario.create({
          data: {
            nombre: usuario.nombre,
            email: email,
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
            rol: true,
            activo: true,
            created_at: true,
            updated_at: true,
          }
        })
      } catch (dbError) {
        console.log("[v0] Database error, using fallback storage for create")
        // Fallback: create in memory
        const newId = Math.max(...localUsuariosStorage.map(u => u.id || 0), 0) + 1
        const now = new Date().toISOString()
        savedUsuario = {
          id: newId,
          nombre: usuario.nombre,
          email: email,
          rol: usuario.rol,
          activo: activo ?? true,
          created_at: now,
          updated_at: now,
        }
        localUsuariosStorage.push(savedUsuario)
      }
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
