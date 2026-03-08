"use client"

import { useEffect, useState } from "react"
import { Bell, AlertCircle, CheckCircle2, Clock, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { getNotifications, type Notification, markAsRead, markAllAsRead } from "@/app/actions/notificaciones"

interface NotificationWithType extends Notification {
  mensaje: string
  fecha: string
}

function getNotificationIcon(tipo?: string) {
  switch (tipo?.toLowerCase()) {
    case "warning":
      return <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
    case "success":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
    case "info":
    default:
      return <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />
  }
}

function getNotificationBgColor(tipo?: string) {
  switch (tipo?.toLowerCase()) {
    case "warning":
      return "bg-amber-50 dark:bg-amber-950"
    case "error":
      return "bg-red-50 dark:bg-red-950"
    case "success":
      return "bg-emerald-50 dark:bg-emerald-950"
    case "info":
    default:
      return "bg-blue-50 dark:bg-blue-950"
  }
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (hours < 1) return "Hace unos minutos"
  if (hours === 1) return "Hace 1 hora"
  if (hours < 24) return `Hace ${hours} horas`
  if (days === 1) return "Hace 1 día"
  return `Hace ${days} días`
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<NotificationWithType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true)
        const data = await getNotifications()
        setNotifications(Array.isArray(data) ? (data as NotificationWithType[]) : [])
      } catch (error) {
        console.error("[v0] Failed to load notifications:", error)
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
    const interval = setInterval(loadNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter((n) => !n.leida).length

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await markAsRead(id)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, leida: true } : n)
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, leida: true })))
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Notificaciones</h2>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Cargando notificaciones...</div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No hay notificaciones</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.slice(0, 5).map((notification, index) => (
              <div
                key={notification.id}
                className={`${
                  !notification.leida ? getNotificationBgColor(notification.tipo) : "hover:bg-muted/50"
                } px-4 py-3 border-b border-border last:border-b-0 transition-colors cursor-pointer group`}
              >
                <div className="flex gap-3">
                  <div className="pt-0.5">
                    {getNotificationIcon(notification.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground leading-snug">
                          {notification.titulo}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 leading-snug">
                          {notification.mensaje}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {formatTime(notification.fecha)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.leida && (
                          <div className="h-2.5 w-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                        <button
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-all"
                          title="Marcar como leído"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-3 border-t border-border bg-muted/30 text-center">
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            Ver todas las notificaciones
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
