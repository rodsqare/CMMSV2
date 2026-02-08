"use client"

import { Bell, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { CurrentUser } from "@/lib/utils/permissions"

interface Notification {
  id: number
  titulo: string
  mensaje: string
  tipo: "info" | "warning" | "success" | "error"
  leida: boolean
  fecha: string
}

interface AppHeaderProps {
  currentUser: CurrentUser | null
  hospitalLogo: string
  unreadCount: number
  notifications: Notification[]
  handleMarkNotificationAsRead: (id: number) => void
  handleMarkAllAsRead: () => void
  setActiveSection: (section: string) => void
}

export function AppHeader({
  currentUser,
  hospitalLogo,
  unreadCount,
  notifications,
  handleMarkNotificationAsRead,
  handleMarkAllAsRead,
  setActiveSection,
}: AppHeaderProps) {
  const getNotificationStyle = (tipo: string) => {
    switch (tipo) {
      case "success":
        return { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" }
      case "warning":
        return { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" }
      case "error":
        return { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" }
      default:
        return { icon: Info, color: "text-blue-500", bg: "bg-blue-50" }
    }
  }

  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {hospitalLogo ? (
              <img src={hospitalLogo || "/placeholder.svg"} alt="Hospital Logo" className="h-10 w-10 object-contain" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                H
              </div>
            )}
            <h1 className="text-xl font-semibold">HDBS CMMS Biomedico</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-yellow-500" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96">
              <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
                <span className="text-base font-semibold">Notificaciones</span>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMarkAllAsRead} 
                    className="text-xs h-7 hover:bg-gray-100"
                  >
                    Marcar todas como leídas
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[28rem] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No hay notificaciones</p>
                    <p className="text-xs text-gray-400 mt-1">Estás al día con todas tus tareas</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const style = getNotificationStyle(notif.tipo)
                    const NotifIcon = style.icon
                    return (
                      <DropdownMenuItem
                        key={notif.id}
                        className={`flex gap-3 p-4 cursor-pointer border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                          !notif.leida ? "bg-blue-50/50" : ""
                        }`}
                        onClick={() => {
                          if (!notif.leida) {
                            handleMarkNotificationAsRead(notif.id)
                          }
                          if (notif.tipo === "info") {
                            setActiveSection("ordenes")
                          }
                        }}
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${style.bg} flex items-center justify-center`}>
                          <NotifIcon className={`h-5 w-5 ${style.color}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-gray-900 leading-tight">{notif.titulo}</h4>
                            {!notif.leida && (
                              <div className="flex-shrink-0 h-2 w-2 bg-blue-500 rounded-full mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed mb-2">{notif.mensaje}</p>
                          <time className="text-xs text-gray-400 font-medium">{notif.fecha}</time>
                        </div>
                      </DropdownMenuItem>
                    )
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback>{currentUser?.nombre?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{currentUser?.nombre || "Usuario"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setActiveSection("configuracion")}>Configuración</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  localStorage.removeItem("isAuthenticated")
                  localStorage.removeItem("userEmail")
                  localStorage.removeItem("userRole")
                  localStorage.removeItem("userName")
                  window.location.href = "/auth/login"
                }}
              >
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
