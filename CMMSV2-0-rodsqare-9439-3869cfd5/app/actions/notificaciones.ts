"use server"

export type Notification = {
  id: number
  titulo: string
  mensaje: string
  fecha: string
  leida: boolean
}

// Placeholder function - returns empty array until database model is ready
export async function getNotifications(): Promise<Notification[]> {
  try {
    // TODO: Implement with Prisma once Notificacion model is added to schema
    console.log("[v0] getNotifications called - returning empty array (no model yet)")
    return []
  } catch (error) {
    console.error("[v0] Error getting notifications:", error)
    return []
  }
}

export async function markNotificationAsRead(id: number): Promise<{ success: boolean }> {
  try {
    // TODO: Implement with Prisma once Notificacion model is added to schema
    console.log("[v0] markNotificationAsRead called for id:", id)
    return { success: true }
  } catch (error) {
    console.error("[v0] Error marking notification as read:", error)
    return { success: false }
  }
}
