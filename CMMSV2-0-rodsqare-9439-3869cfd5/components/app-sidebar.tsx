"use client"

import { BarChart3, Wrench, Users, FileText, Settings, Activity, Cog, Calendar, ChevronLeft } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { type CurrentUser, canAccessSection } from "@/lib/utils/permissions"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

const menuItemsByRole = {
  administrador: [
    { title: "Dashboard", icon: BarChart3, id: "dashboard" },
    { title: "Gestión de equipos", icon: Wrench, id: "equipos" },
    { title: "Gestión de Usuarios", icon: Users, id: "tecnicos" },
    { title: "Órdenes de trabajo", icon: FileText, id: "ordenes" },
    { title: "Programar mantenimiento", icon: Settings, id: "mantenimiento" },
    { title: "Reportes", icon: BarChart3, id: "reportes" },
    { title: "Auditoría (Logs)", icon: Activity, id: "auditoria" },
    { title: "Configuración", icon: Cog, id: "configuracion" },
  ],
  supervisor: [
    { title: "Dashboard", icon: BarChart3, id: "dashboard" },
    { title: "Gestión de equipos", icon: Wrench, id: "equipos" },
    { title: "Órdenes de trabajo", icon: FileText, id: "ordenes" },
    { title: "Programar mantenimiento", icon: Settings, id: "mantenimiento" },
    { title: "Reportes", icon: BarChart3, id: "reportes" },
  ],
  tecnico: [
    { title: "Dashboard", icon: BarChart3, id: "dashboard" },
    { title: "Equipos", icon: Wrench, id: "equipos" },
    { title: "Calendario", icon: Calendar, id: "mantenimiento" },
    { title: "Órdenes de trabajo", icon: FileText, id: "ordenes" },
    { title: "Mis Reportes", icon: BarChart3, id: "reportes" },
  ],
}

const roleLabels = {
  administrador: "Administrador",
  supervisor: "Supervisor",
  tecnico: "Técnico",
}

interface AppSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  userRole: "administrador" | "supervisor" | "tecnico"
  currentUser?: CurrentUser | null
  hospitalLogo?: string // Add hospitalLogo prop
}

export function AppSidebar({ activeSection, onSectionChange, userRole, currentUser, hospitalLogo }: AppSidebarProps) {
  const allMenuItems = menuItemsByRole[userRole] || menuItemsByRole.administrador
  const [isMounted, setIsMounted] = useState(false)
  const { toggleSidebar, state } = useSidebar()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const filteredMenuItems = allMenuItems.filter((item) => {
    if (!currentUser) return false
    return canAccessSection(currentUser, item.id)
  })

  const menuItems = filteredMenuItems.length > 0 ? filteredMenuItems : allMenuItems

  return (
    <Sidebar collapsible="icon" className="border-r bg-white">
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {isMounted ? (
              <img
                src={hospitalLogo || "/placeholder.svg?height=40&width=40"}
                alt="Hospital Dr Beningo Sánchez"
                className="object-contain shrink-0 w-10 h-10"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 animate-pulse rounded" />
            )}
            <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate">Hospital Dr Beningo Sánchez</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-7 w-7 shrink-0"
            title={state === 'expanded' ? 'Colapsar menú' : 'Expandir menú'}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${state === 'collapsed' ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        <div className="group-data-[collapsible=icon]:hidden">
          <div className="text-xs text-gray-600">Rol actual:</div>
          <div className="text-sm font-semibold text-blue-600">{roleLabels[userRole]}</div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
                    tooltip={item.title}
                    className="w-full justify-start gap-3 px-4 py-2.5 text-gray-700 hover:bg-blue-100 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 rounded-lg transition-colors"
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
