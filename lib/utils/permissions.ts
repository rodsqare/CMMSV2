export type PermissionKey =
  | "gestionEquipos"
  | "gestionUsuarios"
  | "ordenesTrabajoCrear"
  | "ordenesTrabajoAsignar"
  | "ordenesTrabajoEjecutar"
  | "mantenimientoPreventivo"
  | "reportesGenerar"
  | "reportesVer"
  | "logsAcceso"
  | "configuracionSistema"

export type RoleType = "administrador" | "supervisor" | "tecnico"

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<RoleType, Record<PermissionKey, boolean>> = {
  administrador: {
    gestionEquipos: true,
    gestionUsuarios: true,
    ordenesTrabajoCrear: true,
    ordenesTrabajoAsignar: true,
    ordenesTrabajoEjecutar: true,
    mantenimientoPreventivo: true,
    reportesGenerar: true,
    reportesVer: true,
    logsAcceso: true,
    configuracionSistema: true,
  },
  supervisor: {
    gestionEquipos: true,
    gestionUsuarios: false,
    ordenesTrabajoCrear: true,
    ordenesTrabajoAsignar: true,
    ordenesTrabajoEjecutar: true,
    mantenimientoPreventivo: true,
    reportesGenerar: true,
    reportesVer: true,
    logsAcceso: false,
    configuracionSistema: false,
  },
  tecnico: {
    gestionEquipos: false,
    gestionUsuarios: false,
    ordenesTrabajoCrear: false,
    ordenesTrabajoAsignar: false,
    ordenesTrabajoEjecutar: true,
    mantenimientoPreventivo: true,
    reportesGenerar: false,
    reportesVer: true,
    logsAcceso: false,
    configuracionSistema: false,
  },
}

export interface CurrentUser {
  id: number
  nombre: string
  correo: string
  rol: RoleType
  especialidad?: string
  permissions?: Record<PermissionKey, boolean>
}

export function hasPermission(user: CurrentUser | null, permission: PermissionKey): boolean {
  if (!user) return false

  // Check custom permissions first
  if (user.permissions && user.permissions[permission] !== undefined) {
    return user.permissions[permission]
  }

  // Fall back to role-based permissions
  return DEFAULT_PERMISSIONS_BY_ROLE[user.rol]?.[permission] ?? false
}

export function canAccessSection(user: CurrentUser | null, section: string): boolean {
  if (!user) return false

  const sectionPermissions: Record<string, PermissionKey> = {
    dashboard: "reportesVer",
    equipos: "gestionEquipos",
    tecnicos: "gestionUsuarios",
    ordenes: "ordenesTrabajoEjecutar",
    mantenimiento: "mantenimientoPreventivo",
    reportes: "reportesVer",
    auditoria: "logsAcceso",
    configuracion: "configuracionSistema",
  }

  const requiredPermission = sectionPermissions[section]
  return requiredPermission ? hasPermission(user, requiredPermission) : false
}

export function canPerformAction(user: CurrentUser | null, action: string): boolean {
  if (!user) return false

  const actionPermissions: Record<string, PermissionKey> = {
    crearEquipo: "gestionEquipos",
    editarEquipo: "gestionEquipos",
    eliminarEquipo: "gestionEquipos",
    crearUsuario: "gestionUsuarios",
    editarUsuario: "gestionUsuarios",
    eliminarUsuario: "gestionUsuarios",
    crearOrdenTrabajo: "ordenesTrabajoCrear",
    asignarOrdenTrabajo: "ordenesTrabajoAsignar",
    ejecutarOrdenTrabajo: "ordenesTrabajoEjecutar",
    programarMantenimiento: "mantenimientoPreventivo",
    generarReporte: "reportesGenerar",
    verReporte: "reportesVer",
    verLogs: "logsAcceso",
    configurarSistema: "configuracionSistema",
  }

  const requiredPermission = actionPermissions[action]
  return requiredPermission ? hasPermission(user, requiredPermission) : false
}
