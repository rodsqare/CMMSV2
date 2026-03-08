"use client"

import { useEffect, useState } from "react"
import { Bell, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { getNotifications, type Notification } from "@/app/actions/notificaciones"

function getNotificationIcon(tipo?: string) {
  switch (tipo?.toLowerCase()) {
    case "warning":
      return <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
    case "success":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
    default:
      return <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />
  }
}

function getNotificationColor(tipo?: string) {
  switch (tipo?.toLowerCase()) {
    case "warning":
      return "bg-amber-50 dark:bg-amber-950"
    case "error":
      return "bg-red-50 dark:bg-red-950"
    case "success":
      return "bg-emerald-50 dark:bg-emerald-950"
    default:
      return "hover:bg-muted/50"
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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true)
        const data = await getNotifications()
        console.log("[v0] Loaded notifications:", data)
        // Ensure data is always an array
        setNotifications(Array.isArray(data) ? data : [])
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Cargando...</div>
        ) : notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">No hay notificaciones</div>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <DropdownMenuItem key={notification.id} className={`flex flex-col items-start p-3 cursor-pointer ${getNotificationColor(notification.tipo)}`}>
              <div className="flex items-start gap-3 w-full">
                {getNotificationIcon(notification.tipo)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium leading-none">{notification.titulo}</p>
                    {!notification.leida && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.mensaje}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(notification.fecha)}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-center cursor-pointer">
          Ver todas las notificaciones
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
