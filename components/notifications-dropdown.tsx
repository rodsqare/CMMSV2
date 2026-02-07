"use client"

import { useEffect, useState } from "react"
import { Bell } from 'lucide-react'
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
import { getNotifications, type Notification } from "@/lib/api/notifications"

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true)
        const data = await getNotifications()
        console.log("[v0] Loaded notifications:", data)
        setNotifications(data)
      } catch (error) {
        console.error("[v0] Failed to load notifications:", error)
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
            <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 cursor-pointer">
              <div className="flex items-start gap-2 w-full">
                {!notification.leida && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{notification.titulo}</p>
                  <p className="text-sm text-muted-foreground">{notification.mensaje}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.fecha).toLocaleDateString()}
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
