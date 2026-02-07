import { apiClient } from "./client"

export interface Notification {
  id: number
  tipo: "info" | "success" | "warning" | "error"
  titulo: string
  mensaje: string
  fecha: string
  leida: boolean
}

export const getNotifications = async (): Promise<Notification[]> => {
  console.log("[v0] Fetching notifications from API")

  if (typeof window === "undefined") {
    console.log("[v0] Running on server, returning empty notifications")
    return []
  }

  const userId = localStorage.getItem("userId")
  if (!userId) {
    console.log("[v0] No user ID found in localStorage")
    return []
  }

  console.log("[v0] Fetching notifications for user ID:", userId)

  try {
    const response = await apiClient.get(`/notificaciones`, { usuario_id: userId })
    console.log("[v0] Notifications API response:", response)
    
    if (response.success && Array.isArray(response.data)) {
      return response.data
    }
    return []
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error)
    return []
  }
}

export const markAsRead = async (id: number): Promise<void> => {
  console.log("[v0] Marking notification as read:", id)

  if (typeof window === "undefined") {
    console.log("[v0] Running on server, cannot mark as read")
    return
  }

  const userId = localStorage.getItem("userId")
  if (!userId) {
    console.log("[v0] No user ID found")
    return
  }

  try {
    const response = await apiClient.post(`/notificaciones/${id}/mark-read`, {
      usuario_id: userId,
    })
    console.log("[v0] Mark as read response:", response)
  } catch (error) {
    console.error("[v0] Error marking notification as read:", error)
    throw error
  }
}

export const markAllAsRead = async (): Promise<void> => {
  console.log("[v0] Marking all notifications as read")

  if (typeof window === "undefined") {
    console.log("[v0] Running on server, cannot mark all as read")
    return
  }

  const userId = localStorage.getItem("userId")
  if (!userId) {
    console.log("[v0] No user ID found")
    return
  }

  try {
    const response = await apiClient.post("/notificaciones/mark-all-read", {
      usuario_id: userId,
    })
    console.log("[v0] Mark all as read response:", response)
  } catch (error) {
    console.error("[v0] Error marking all notifications as read:", error)
    throw error
  }
}

export const deleteNotification = async (id: number): Promise<void> => {
  console.log("[v0] Deleting notification:", id)

  if (typeof window === "undefined") {
    console.log("[v0] Running on server, cannot delete notification")
    return
  }

  const userId = localStorage.getItem("userId")
  if (!userId) {
    console.log("[v0] No user ID found")
    return
  }

  try {
    const response = await apiClient.delete(`/notificaciones/${id}`, { usuario_id: userId })
    console.log("[v0] Delete notification response:", response)
  } catch (error) {
    console.error("[v0] Error deleting notification:", error)
    throw error
  }
}

export const getUnreadCount = async (): Promise<number> => {
  if (typeof window === "undefined") {
    return 0
  }

  const userId = localStorage.getItem("userId")
  if (!userId) return 0

  try {
    const response = await apiClient.get(`/notificaciones/unread-count`, { usuario_id: userId })
    if (response.success) {
      return response.count || 0
    }
    return 0
  } catch (error) {
    console.error("[v0] Error getting unread count:", error)
    return 0
  }
}

function determinePriority(tipo: string): "alta" | "media" | "baja" {
  switch (tipo) {
    case "warning":
      return "alta"
    case "error":
      return "alta"
    case "info":
      return "media"
    case "success":
      return "baja"
    default:
      return "media"
  }
}

function determineLink(tipo: string): string | undefined {
  switch (tipo) {
    case "error":
      return "/dashboard"
    case "warning":
      return "/calendario"
    case "info":
      return "/ordenes"
    default:
      return undefined
  }
}
