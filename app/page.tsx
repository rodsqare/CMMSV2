"use client"

import { TooltipContent } from "@/components/ui/tooltip"

import React from "react"

import { useState, useEffect, useCallback, useMemo } from "react" // Added useMemo
import { getDashboardStats, type DashboardStats } from "@/app/actions/dashboard"
import { fetchEquipos, saveEquipo, removeEquipo, fetchEquipoDetails, getEquipo, checkEquipoAssociations, type Equipo } from "@/app/actions/equipos"
import {
  fetchUsuarios,
  saveUsuario,
  removeUsuario,
  fetchUsuarioDetails,
  updatePermissions,
  resetPassword,
  toggleUserStatus,
  getUserActivity,
  type Usuario,
} from "@/app/actions/usuarios"
import { getHospitalLogo, setHospitalLogo as saveHospitalLogo } from "@/app/actions/configuracion"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  Wrench,
  SettingsIcon,
  RefreshCw,
  Bell,
  Settings,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  Upload,
  Download,
  FileText,
  UserCheck,
  UserX,
  Key,
  Search,
  Activity,
  UserPlus,
  MoreVertical,
  Clock,
  XCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Building,
  X,
  Save,
  Briefcase,
  AlertCircle,
  AlertTriangle,
} from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2, LucideAlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import {
  fetchOrdenesTrabajo,
  saveOrdenTrabajo,
  removeOrdenTrabajo,
  asignarTecnicoAOrden,
  cambiarEstadoOrden,
  type OrdenTrabajo,
} from "./actions/ordenes-trabajo"
import {
  getAllMantenimientos,
  getMantenimientosStats,
  createMantenimiento, // Imported createMantenimiento
  updateMantenimiento, // Imported updateMantenimiento
  deleteMantenimiento, // Imported deleteMantenimiento
  checkUpcomingMaintenances,
} from "./actions/mantenimientos"
import type { Mantenimiento } from "@/lib/api/mantenimientos"
import { generatePDF, downloadPDF, generateEquipmentTechnicalSheet, generateWorkOrderPDF } from "@/lib/pdf-generator" // Added generateEquipmentTechnicalSheet, generateWorkOrderPDF
import { canAccessSection, type CurrentUser, type RoleType, type PermissionKey, DEFAULT_PERMISSIONS_BY_ROLE } from "@/lib/utils/permissions" // Import DEFAULT_PERMISSIONS_BY_ROLE
import { filterLogs } from "@/lib/api/logs"
import { fetchAuditLogs } from "@/app/actions/logs"
import { getNotifications, markAsRead, markAllAsRead, type Notification } from "@/lib/api/notifications"
import { Alert, AlertDescription } from "@/components/ui/alert" // Added Alert component
import { EquipmentCombobox } from "@/components/equipment-combobox"
import { useToast } from "@/components/ui/use-toast" // Imported toast
import { AppHeader } from "@/components/app-header" // Imported AppHeader
import { getDocumentoUrl } from "@/lib/api/documentos" // Imported getDocumentoUrl
// This feature was causing issues with the Laravel backend
// Notifications will still be created when maintenances are created/updated
// import { checkUpcomingMaintenances } from "@/lib/api/mantenimientos"

// ADDED: Helper function to format dates to DD-MM-YYYY
function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return "-"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "-"

    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()

    return `${day}-${month}-${year}`
  } catch (error) {
    return "-"
  }
}

// Mock users for authentication simulation
const mockUsers: Usuario[] = [
  {
    id: 1,
    nombre: "Admin User",
    email: "admin@hospital.com",
    rol: "Administrador",
    activo: true,
    estado: "Activo",
    permissions: {
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
  },
  {
    id: 2,
    nombre: "Supervisor User",
    email: "supervisor@hospital.com",
    rol: "Supervisor",
    activo: true,
    estado: "Activo",
    permissions: {
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
  },
  {
    id: 3,
    nombre: "Technician User",
    email: "technician@hospital.com",
    rol: "Técnico",
    activo: true,
    estado: "Activo",
    permissions: {
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
  },
]

type Equipment = {
  id: number
  numeroSerie: string
  nombre: string
  modelo: string
  fabricante: string
  ubicacion: string
  estado: string
  voltaje: string
  fechaInstalacion: string
  frecuencia?: string
  fechaRetiro?: string
  codigoInstitucional?: string
  servicio?: string
  vencimientoGarantia?: string
  fechaIngreso?: string
  procedencia?: string
  potencia?: string
  corriente?: string
  otrosEspecificaciones?: string
  accesoriosConsumibles?: string
  estadoEquipo?: string
  manualUsuario?: boolean
  manualServicio?: boolean
  nivelRiesgo?: string
  proveedorNombre?: string
  proveedorDireccion?: string
  proveedorTelefono?: string
  observaciones?: string
  documentos?: Array<{
    id?: number // Added id for delete handler
    nombre: string
    tipo: string
    fechaSubida?: string
    url?: string // Added url for view handler
  }>
}

function transformEquipoToEquipment(equipo: Equipo | any): Equipment {
  // Extract specifications from JSON if they exist
  const specs = equipo.especificaciones || {}
  
  return {
    id: equipo.id,
    numeroSerie: equipo.numero_serie || "",
    nombre: equipo.nombre || "",
    modelo: equipo.modelo || "",
    fabricante: equipo.marca || "",
    ubicacion: equipo.ubicacion || "",
    estado: equipo.estado || "operativo",
    voltaje: specs.voltaje || "",
    fechaInstalacion: specs.fechaInstalacion || "",
    frecuencia: specs.frecuencia || "",
    fechaRetiro: equipo.fecha_adquisicion || "",
    codigoInstitucional: equipo.codigo || "",
    servicio: specs.servicio,
    vencimientoGarantia: specs.vencimientoGarantia,
    fechaIngreso: equipo.fecha_adquisicion,
    procedencia: specs.procedencia,
    potencia: specs.potencia,
    corriente: specs.corriente,
    otrosEspecificaciones: specs.otrosEspecificaciones,
    accesoriosConsumibles: specs.accesoriosConsumibles,
    estadoEquipo: specs.estadoEquipo,
    manualUsuario: specs.manualUsuario ?? false,
    manualServicio: specs.manualServicio ?? false,
    nivelRiesgo: specs.nivelRiesgo,
    proveedorNombre: specs.proveedorNombre,
    proveedorDireccion: specs.proveedorDireccion,
    proveedorTelefono: specs.proveedorTelefono,
    observaciones: equipo.descripcion,
    documentos: equipo.documentos || [], // Initialize as empty array
  }
}

function transformEquipmentToEquipo(equipment: Partial<Equipment>): Partial<Equipo> {
  return {
    id: equipment.id,
    codigo: equipment.codigoInstitucional || `EQ-${Date.now()}`,
    nombre: equipment.nombre,
    tipo: "Médico", // Default type - can be adjusted based on form input
    marca: equipment.fabricante,
    modelo: equipment.modelo,
    numero_serie: equipment.numeroSerie,
    ubicacion: equipment.ubicacion,
    estado: equipment.estado || "operativo",
    criticidad: "media", // Default criticality - can be adjusted based on form input
    descripcion: equipment.observaciones,
    especificaciones: {
      // Electrical specifications
      voltaje: equipment.voltaje,
      frecuencia: equipment.frecuencia,
      potencia: equipment.potencia,
      corriente: equipment.corriente,
      // Additional specifications
      servicio: equipment.servicio,
      procedencia: equipment.procedencia,
      otrosEspecificaciones: equipment.otrosEspecificaciones,
      accesoriosConsumibles: equipment.accesoriosConsumibles,
      // Equipment condition
      estadoEquipo: equipment.estadoEquipo,
      nivelRiesgo: equipment.nivelRiesgo,
      // Documentation
      manualUsuario: equipment.manualUsuario,
      manualServicio: equipment.manualServicio,
      // Warranty and dates
      vencimientoGarantia: equipment.vencimientoGarantia,
      fechaInstalacion: equipment.fechaInstalacion,
      // Supplier information
      proveedorNombre: equipment.proveedorNombre,
      proveedorTelefono: equipment.proveedorTelefono,
      proveedorDireccion: equipment.proveedorDireccion,
    },
    fecha_adquisicion: equipment.fechaIngreso || equipment.fechaRetiro,
    valor_adquisicion: null,
    vida_util_anos: null,
    ultima_mantencion: null,
    proxima_mantencion: null,
    horas_operacion: null,
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast() // Initialize toast
  const [activeSection, setActiveSection] = useState("dashboard")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true) // Moved loading state here
  const [equipmentLoading, setEquipmentLoading] = useState(false)
  const [equipmentFilters, setEquipmentFilters] = useState({
    estado: "all",
    ubicacion: "all",
    fabricante: "all",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalEquipment, setTotalEquipment] = useState(0)
  const [perPage, setPerPage] = useState(10)

  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [showEquipmentForm, setShowEquipmentForm] = useState(false)
  const [showEquipmentDetails, setShowEquipmentDetails] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [equipmentForm, setEquipmentForm] = useState<Partial<Equipment>>({
    estado: "operativo",
    ubicacion: "uci",
  })
  // CHANGE: Add state for editing equipment
  const [editingEquipment, setEditingEquipment] = useState(false)

  const [users, setUsers] = useState<Usuario[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userFilters, setUserFilters] = useState({
    rol: "all",
    estado: "all",
  })
  const [showUserForm, setShowUserForm] = useState(false) // Renamed from showUserDialog
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null) // CHANGE: Renamed to match the type
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [editingPermissions, setEditingPermissions] = useState<Usuario | null>(null)
  const [newUser, setNewUser] = useState<Partial<Usuario> & { contrasena?: string }>({
    estado: "Activo",
  })
  const [userPermissions, setUserPermissions] = useState({
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
  })
  const [userRole, setUserRole] = useState<RoleType>("administrador") // Changed to RoleType

  const [usersPaginaActual, setUsersPaginaActual] = useState(1)
  const [usersPerPage, setUsersPerPage] = useState(10)
  const [usersTotalPages, setUsersTotalPages] = useState(1) // Initialize with 1

  const [loadingUserActivity, setLoadingUserActivity] = useState(false)
  const [userActivity, setUserActivity] = useState<any>(null)

  const [maintenanceSchedules, setMaintenanceSchedules] = useState<Mantenimiento[]>([])
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)
  const [maintenanceStats, setMaintenanceStats] = useState({
    vencidos: 0,
    proximos: 0,
    completados: 0,
    total: 0,
  })
  const [maintenanceFilters, setMaintenanceFilters] = useState({
    tipo: "all",
    frecuencia: "all",
  })
  const [calendarView, setCalendarView] = useState(false) // State to toggle between list and calendar view
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false)
  const [showMaintenanceDetails, setShowMaintenanceDetails] = useState(false)
  const [selectedMaintenance, setSelectedMaintenance] = useState<Mantenimiento | null>(null)
  const [maintenanceFormErrors, setMaintenanceFormErrors] = useState<Record<string, string>>({}) // ADDED
  // CHANGE: Removed default values from frecuencia field
  const [maintenanceForm, setMaintenanceForm] = useState<Partial<Mantenimiento>>({ resultado: "pendiente" }) // ADDED

  const [workOrders, setWorkOrders] = useState<OrdenTrabajo[]>([])
  const [orderFilters, setOrderFilters] = useState({
    estado: "all",
    prioridad: "all",
    tipo: "all",
    fechaDesde: "",
    fechaHasta: "",
  })
  const [searchOrder, setSearchOrder] = useState("")
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrdenTrabajo | null>(null)
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [newOrderData, setNewOrderData] = useState<Partial<OrdenTrabajo>>({
    tipo: "Preventivo",
    prioridad: "media",
    estado: "abierta",
    fechaCreacion: new Date().toISOString().split("T")[0],
  })
  const [orderCurrentPage, setOrderCurrentPage] = useState(1) // Renamed to avoid conflict
  const [orderTotalPages, setOrderTotalPages] = useState(1) // Renamed to avoid conflict
  const [orderPerPage, setOrderPerPage] = useState(10) // Renamed to avoid conflict
  const [isLoadingOrders, setIsLoadingOrders] = useState(false) // CHANGE: Add loading state for orders

  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null)
  const [statusObservaciones, setStatusObservaciones] = useState("")
  const [newStatus, setNewStatus] = useState("") // ADDED: State for new status in change status dialog

  // CHANGE: Updated report type to include cronograma
  const [reportType, setReportType] = useState<"equipos" | "mantenimientos" | "ordenes" | "cronograma">("equipos")
  const [reportFechaInicio, setReportFechaInicio] = useState("")
  const [reportFechaFin, setReportFechaFin] = useState("")
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  // ADDED: Audit log states
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [logSearchTerm, setLogSearchTerm] = useState("")
  const [logActionFilter, setLogActionFilter] = useState("all")
  const [logCurrentPage, setLogCurrentPage] = useState(1)
  const logsPerPage = 10

  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)

  // ADDED: Configuration states
  const [configLocations, setConfigLocations] = useState<string[]>([
    "UCI",
    "Emergencias",
    "Cirugía",
    "Radiología",
    "Laboratorio",
  ])
  const [configManufacturers, setConfigManufacturers] = useState<string[]>([
    "Philips",
    "GE Healthcare",
    "Siemens",
    "Medtronic",
  ])
  const [newLocation, setNewLocation] = useState("")
  const [newManufacturer, setNewManufacturer] = useState("")

  const [isMounted, setIsMounted] = useState(false)

  // ADDED: Error states for form validation
  const [orderFormErrors, setOrderFormErrors] = useState<Record<string, string>>({})
  const [equipmentFormErrors, setEquipmentFormErrors] = useState<Record<string, string>>({})
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({})
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState<Usuario | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [hospitalLogo, setHospitalLogo] = useState<string>("") // Declare hospitalLogo state

  // CHANGE: Add state for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedOrderToDelete, setSelectedOrderToDelete] = useState<number | null>(null)

  // CHANGE: Add state for equipment delete confirmation dialog
  const [isDeleteEquipmentDialogOpen, setIsDeleteEquipmentDialogOpen] = useState(false)
  const [selectedEquipmentToDelete, setSelectedEquipmentToDelete] = useState<number | null>(null)

  // CHANGE: Add state for user delete confirmation dialog
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false)
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<number | null>(null)

  // CHANGE: Add state for maintenance delete confirmation dialog
  const [isDeleteMaintenanceDialogOpen, setIsDeleteMaintenanceDialogOpen] = useState(false)
  const [selectedMaintenanceToDelete, setSelectedMaintenanceToDelete] = useState<number | null>(null)

  // CHANGE: Moved layout and navigation logic to AppHeader and AppSidebar components
  const [currentView, setCurrentView] = useState("dashboard")
  const [activeTab, setActiveTab] = useState("dashboard") // Not used in the main logic, can be removed or integrated

  // ADDED: State to store equipment associations (maintenances and work orders)
  const [equipmentAssociations, setEquipmentAssociations] = useState<
    Record<
      number,
      {
        hasMaintenances: boolean
        hasWorkOrders: boolean
        maintenanceCount: number
        workOrderCount: number
      }
    >
  >({})

  // Moved useEffect hooks to the top level
  useEffect(() => {
    setIsMounted(true)
    // Load hospital logo from database
    getHospitalLogo().then((logo) => {
      if (logo) {
        setHospitalLogo(logo)
      }
    }).catch((error) => {
      console.error("[v0] Error loading hospital logo:", error)
    })
  }, [])

  const loadEquipment = async () => {
    setEquipmentLoading(true)
    try {
      const params = {
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
        estado: equipmentFilters.estado !== "all" ? equipmentFilters.estado : undefined,
        ubicacion: equipmentFilters.ubicacion !== "all" ? equipmentFilters.ubicacion : undefined,
        fabricante: equipmentFilters.fabricante !== "all" ? equipmentFilters.fabricante : undefined,
      }

      const response = await fetchEquipos(params)
      const transformedEquipment = response.data.map(transformEquipoToEquipment)
      setEquipment(transformedEquipment)
      setTotalEquipment(response.total)
    } catch (error) {
      // If it fails, use mock data as a fallback
      setEquipment([
        {
          id: 1,
          numeroSerie: "SV-2023-001",
          nombre: "Monitor de Signos Vitales",
          modelo: "IntelliVue MX450",
          fabricante: "Philips",
          ubicacion: "UCI - Piso 3",
          estado: "operativo",
          voltaje: "110-240V",
          fechaInstalacion: "2023-01-15",
          frecuencia: "60Hz",
          documentos: [
            {
              nombre: "Manual_Usuario.pdf",
              tipo: "Manual",
              fechaSubida: "2023-01-15",
              url: "/files/manual_usuario.pdf",
            },
            {
              nombre: "Certificado_Calibracion.pdf",
              tipo: "Certificado",
              fechaSubida: "2024-11-15",
              url: "/files/certificado_calibracion.pdf",
            },
          ],
        },
      ])
      // Ensure totalEquipment is set even with mock data
      setTotalEquipment(1)
    } finally {
      setEquipmentLoading(false)
    }
  }

  // Initial load of equipment data when the component mounts.
  useEffect(() => {
    loadEquipment()
  }, [])

  // Re-load equipment data when the 'equipos' section becomes active.
  useEffect(() => {
    if (activeSection === "equipos") {
      loadEquipment()
    }
  }, [activeSection])

  const checkAndCreateWorkOrdersForMaintenance = async (mantenimientos: Mantenimiento[]) => {
    const today = new Date()
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(today.getDate() + 7)

    for (const m of mantenimientos) {
      const proximaFecha = new Date(m.proximaFecha)
      const diasFaltantes = Math.ceil((proximaFecha.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // If 7 days or less and date is in the future
      if (diasFaltantes <= 7 && diasFaltantes > 0 && m.resultado === "pendiente") {
        console.log(`[v0] Mantenimiento ${m.id} necesita orden de trabajo. Faltan ${diasFaltantes} días`)
        // TODO: Implement actual work order creation if needed, based on existing logic.
        // For now, this is a placeholder for the check.
      }
    }
  }

  // ADDED: Load audit logs from backend when section becomes active
  useEffect(() => {
    if (activeSection === "auditoria") {
      loadAuditLogs()
    }
  }, [activeSection])

  const loadAuditLogs = async () => {
    try {
      const result = await fetchAuditLogs(logSearchTerm, logActionFilter, 100)

      if (result.success && result.data && result.data.data && Array.isArray(result.data.data)) {
        setAuditLogs(result.data.data)
        toast({
          title: "Logs cargados",
          description: `Se cargaron ${result.data.data.length} registros de auditoría`,
        })
      } else {
        setAuditLogs([])
        toast({
          title: "Sin datos",
          description: "No se encontraron registros de auditoría en la base de datos.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] loadAuditLogs - Error:", error)
      setAuditLogs([])
      toast({
        title: "Error",
        description: "Error al cargar los registros de auditoría.",
        variant: "destructive",
      })
    }
  }

  // Authentication check and user data loading
  const checkAuthentication = async () => {
    await new Promise((resolve) => setTimeout(resolve, 200))

    const isAuthenticated = localStorage.getItem("isAuthenticated")
    const userEmail = localStorage.getItem("userEmail")
    const storedUserId = localStorage.getItem("userId")

    if (!isAuthenticated || !userEmail) {
      router.push("/auth/login")
      return
    }

    try {
      const response = await fetchUsuarios()
      const usuarios = response.data

      const userData = usuarios.find((u: any) => u.correo === userEmail)
      if (userData) {
        const roletype = userData.rol.toLowerCase() as RoleType
        const permissions = (userData.permissions as Record<PermissionKey, boolean> | undefined) || DEFAULT_PERMISSIONS_BY_ROLE[roletype]
        const currentUserWithPermissions: CurrentUser = {
          id: userData.id,
          nombre: userData.nombre,
          email: userEmail,
          rol: roletype,
          permissions,
        }
        setCurrentUser(currentUserWithPermissions)
        setUserRole(roletype)
      } else {
        const storedRole = (localStorage.getItem("userRole") as RoleType) || "tecnico"
        const storedName = localStorage.getItem("userName") || "Usuario"
        const userId = storedUserId ? Number.parseInt(storedUserId) : 0
        if (userId === 0) {
          localStorage.clear()
          router.push("/auth/login")
          return
        }
        const currentUserWithPermissions: CurrentUser = {
          id: userId,
          nombre: storedName,
          email: userEmail,
          rol: storedRole,
          permissions: DEFAULT_PERMISSIONS_BY_ROLE[storedRole],
        }
        setCurrentUser(currentUserWithPermissions)
        setUserRole(storedRole)
      }
    } catch (error) {
      const storedRole = (localStorage.getItem("userRole") as RoleType) || "tecnico"
      const storedName = localStorage.getItem("userName") || "Usuario"
      const userId = storedUserId ? Number.parseInt(storedUserId) : 0
      if (userId === 0) {
        localStorage.clear()
        router.push("/auth/login")
        return
      }
      const currentUserWithPermissions: CurrentUser = {
        id: userId,
        nombre: storedName,
        correo: userEmail,
        rol: storedRole,
        especialidad: "",
        permissions: DEFAULT_PERMISSIONS_BY_ROLE[storedRole],
      }
      setCurrentUser(currentUserWithPermissions)
      setUserRole(storedRole)
    }

    setLoading(false)
  }

  useEffect(() => {
    checkAuthentication()
  }, [router])

  // Moved useEffect hooks to the top level
  // Update total user pages and reset current page if it becomes invalid
  useEffect(() => {
    const totalPages = Math.ceil(users.length / usersPerPage) // Use users.length directly as it's already paginated for display
    setUsersTotalPages(totalPages)
    if (usersPaginaActual > totalPages && totalPages > 0) {
      setUsersPaginaActual(1)
    }
  }, [users, usersPerPage, usersPaginaActual, setUsersTotalPages, setUsersPaginaActual])

  // Moved useEffect hooks to the top level
  // Load notifications when the component mounts
  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    const checkMaintenances = async () => {
      try {
        const result = await checkUpcomingMaintenances()
        if (result && result.notificaciones_creadas > 0) {
          loadNotifications()
        }
      } catch (error) {
        console.error("[v0] Error checking upcoming maintenances:", error)
      }
    }

    checkMaintenances()
    // Check every 5 minutes
    const interval = setInterval(checkMaintenances, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // ADDED: Load equipment when entering mantenimiento section to populate select options
  useEffect(() => {
    if (activeSection === "mantenimiento" && equipment.length === 0) {
      loadEquipment()
    }
  }, [activeSection])

  // ADDED: Check equipment associations when equipment list is loaded or when entering equipos section
  useEffect(() => {
    const checkAllEquipmentAssociations = async () => {
      if (equipment && equipment.length > 0) {
        // Check associations for all equipment
        for (const equipo of equipment) {
          if (!equipmentAssociations[equipo.id]) {
            await checkEquipmentCanBeDeleted(equipo.id)
          }
        }
      }
    }

    if (activeSection === "equipos") {
      checkAllEquipmentAssociations()
    }
  }, [equipment, activeSection])

  // ADDED: Check equipment associations when opening equipment details dialog
  useEffect(() => {
    if (showEquipmentDetails && selectedEquipment && !equipmentAssociations[selectedEquipment.id]) {
      checkEquipmentCanBeDeleted(selectedEquipment.id)
    }
  }, [showEquipmentDetails, selectedEquipment])

  // CHANGE: Load equipment only when entering the 'equipos' section
  // This useEffect is now redundant due to the initial load and the activeSection specific load
  // Keeping it for now, but could be removed.
  // useEffect(() => {
  //   if (activeSection === "equipos") {
  //     loadEquipment()
  //   }
  // }, [activeSection])

  // CHANGE: Load dashboard stats once when user is authenticated
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDashboardStats()
        setStats(data)
      } catch (error) {
        setStats({
          usuariosCount: 0,
          equiposCount: 0,
          mantenimientosCount: 0,
          ordenesCount: 0,
          equiposPorFabricante: [],
          mantenimientosPorMes: [],
        })
      }
    }

    if (currentUser) {
      fetchData()
    }
  }, [currentUser])

  // --- Maintenance Loaders and Stats ---
  const loadMaintenanceSchedules = async () => {
    setMaintenanceLoading(true)
    try {
      const params: { tipo?: string; frecuencia?: string } = {}

      if (maintenanceFilters.tipo !== "all") {
        params.tipo = maintenanceFilters.tipo
      }

      if (maintenanceFilters.frecuencia !== "all") {
        params.frecuencia = maintenanceFilters.frecuencia
      }

      const response = await getAllMantenimientos(params)
      setMaintenanceSchedules(response.data)

      await checkAndCreateWorkOrdersForMaintenance(response.data)
    } catch (error) {
      console.error("[v0] Error loading maintenance schedules:", error)
      // Fallback with mock data if needed
      setMaintenanceSchedules([
        {
          id: 1,
          equipoId: 1,
          equipo: "Monitor de Signos Vitales",
          tipo: "Preventivo",
          frecuencia: "Mensual",
          proximaFecha: "2024-08-15",
          ultimaFecha: "2024-07-15",
          resultado: "Completado",
          observaciones: "Mantenimiento preventivo estándar realizado.",
        },
        {
          id: 2,
          equipoId: 2,
          equipo: "Bomba de Infusión",
          tipo: "Correctivo",
          frecuencia: "N/A",
          proximaFecha: "2024-08-20",
          ultimaFecha: "2024-08-10",
          resultado: "Pendiente",
          observaciones: "Falla en el display, requiere revisión.",
        },
      ])
    } finally {
      setMaintenanceLoading(false)
    }
  }

  const loadMaintenanceStats = async () => {
    try {
      const stats = await getMantenimientosStats()
      setMaintenanceStats(stats)
    } catch (error) {
      console.error("[v0] Error loading maintenance stats:", error)
      setMaintenanceStats({
        vencidos: 0,
        proximos: 0,
        completados: 0,
        total: 0,
      })
    }
  }

  // Load maintenance schedules and stats when entering the maintenance section.
  useEffect(() => {
    if (activeSection === "mantenimiento") {
      loadMaintenanceSchedules()
      loadMaintenanceStats()
      loadEquipment() // Load equipment for dropdown
    }
  }, [activeSection])

  useEffect(() => {
    if (activeSection === "mantenimiento") {
      loadMaintenanceSchedules()
    }
  }, [maintenanceFilters.tipo, maintenanceFilters.frecuencia, activeSection])

  // CHANGE: Load work orders and users when entering the 'orders' section
  useEffect(() => {
    if (activeSection === "ordenes") {
      loadWorkOrders()
      loadUsers()
    }
  }, [activeSection, orderCurrentPage, orderPerPage])

  // Load users when entering the 'tecnicos' section.
  useEffect(() => {
    if (activeSection === "tecnicos") {
      loadUsers()
    }
  }, [activeSection, usersPaginaActual, usersPerPage])

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const params = {
        rol: userFilters.rol !== "all" ? userFilters.rol : undefined,
        estado: userFilters.estado !== "all" ? userFilters.estado : undefined,
        page: usersPaginaActual, // Added pagination params
        perPage: usersPerPage,
      }

      const response = await fetchUsuarios(params)
      setUsers(response.data)
      setUsersTotalPages(Math.ceil(response.total / usersPerPage))
    } catch (error) {
      console.error("[v0] Error loading users:", error)
      toast({
        title: "Error al cargar usuarios",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo conectar al backend.",
        variant: "destructive",
      })

      setUsers([])
      setUsersTotalPages(1)
    } finally {
      setUsersLoading(false)
    }
  }

  // ADDED: Function to check if an equipment can be deleted
  const checkEquipmentCanBeDeleted = async (equipmentId: number) => {
    try {
      console.log("[v0] Checking if equipment can be deleted:", equipmentId)
      const associations = await checkEquipoAssociations(equipmentId)
      console.log("[v0] Equipment associations:", associations)

      // Store the associations in state for later use
      setEquipmentAssociations((prev) => ({
        ...prev,
        [equipmentId]: associations,
      }))

      return !associations.hasMaintenances && !associations.hasWorkOrders
    } catch (error) {
      console.error("[v0] Error checking equipment associations:", error)
      // If API fails, allow deletion to proceed (fallback behavior)
      return true
    }
  }

  // Load users when entering ordenes section or when dialog opens
  useEffect(() => {
    if (activeSection === "ordenes" && users.length === 0) {
      loadUsers()
    }
  }, [activeSection]) // Removed dependency on users.length to avoid potential infinite loops if not managed carefully

  // Load users when assign dialog opens
  useEffect(() => {
    if (isAssignDialogOpen && users.length === 0) {
      loadUsers()
    }
  }, [isAssignDialogOpen])

  useEffect(() => {
    if (isAssignDialogOpen && users.length > 0) {
      // ... (console logs removed as per change)
    }
  }, [isAssignDialogOpen, users])

  useEffect(() => {
    // Reload users when filters change
    if (activeSection === "tecnicos") {
      loadUsers()
    }
  }, [userFilters]) // Removed duplicate and problematic useEffects that were causing infinite loops

  // Reload work orders when filters change
  useEffect(() => {
    // Reload work orders when filters change
    if (activeSection === "ordenes") {
      loadWorkOrders()
    }
  }, [orderFilters, searchOrder]) // Removed duplicate and problematic useEffects that were causing infinite loops

  // Sync newUser state when editingUser changes
  useEffect(() => {
    if (editingUser && showUserForm) {
      // Explicitly copy all fields from editingUser to newUser
      // Don't include password field for editing - it's optional
      const syncedUser = {
        id: editingUser.id,
        nombre: editingUser.nombre || "",
        email: editingUser.email || "",
        rol: editingUser.rol,
        estado: editingUser.estado || (editingUser.activo ? "Activo" : "Inactivo"),
        activo: editingUser.activo !== undefined ? editingUser.activo : true,
        // Don't set contrasena for editing users - password field is hidden
      }
      
      setNewUser(syncedUser)
      // Clear any previous errors
      setUserFormErrors({})
    }
  }, [editingUser, showUserForm])

  const loadWorkOrders = async () => {
    setIsLoadingOrders(true)
    try {
      const response = await fetchOrdenesTrabajo({
        estado: orderFilters.estado !== "all" ? orderFilters.estado : undefined,
        prioridad: orderFilters.prioridad !== "all" ? orderFilters.prioridad : undefined,
        tipo: orderFilters.tipo !== "all" ? orderFilters.tipo : undefined,
        fechaDesde: orderFilters.fechaDesde || undefined,
        fechaHasta: orderFilters.fechaHasta || undefined,
        search: searchOrder || undefined,
        page: orderCurrentPage, // Use renamed state
        perPage: orderPerPage, // Use renamed state
      })

      setWorkOrders(response.data)
      setOrderTotalPages(response.lastPage) // Use renamed state
    } catch (error) {
      console.error("[v0] Error loading work orders:", error)
      setWorkOrders([])
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const handleSaveOrder = async () => {
    // Clear previous errors
    setOrderFormErrors({})

    // Validate required fields
    const errors: { [key: string]: string } = {}
    if (!newOrderData.equipoId) errors.equipoId = "El equipo es requerido"
    if (!newOrderData.tipo) errors.tipo = "El tipo es requerido"
    if (!newOrderData.prioridad) errors.prioridad = "La prioridad es requerida"
    if (!newOrderData.descripcion?.trim()) errors.descripcion = "La descripción es requerida"

    if (Object.keys(errors).length > 0) {
      setOrderFormErrors(errors)
      return
    }

    setIsLoadingOrders(true)

    try {
      const ordenToSave = selectedOrder ? { ...newOrderData, id: selectedOrder.id } : newOrderData
      const savedOrder = await saveOrdenTrabajo(ordenToSave)

      if (savedOrder) {
        toast({
          title: selectedOrder ? "Orden actualizada" : "Orden creada",
          description: selectedOrder
            ? "La orden de trabajo ha sido actualizada correctamente"
            : "La orden de trabajo ha sido creada correctamente",
        })
        setIsOrderDialogOpen(false)
        await loadWorkOrders()
      } else {
        throw new Error("No se recibió respuesta del servidor")
      }
    } catch (error) {
      setOrderFormErrors({
        general: "Error al guardar la orden. Por favor intente nuevamente.",
      })
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la orden de trabajo",
      })
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const handleDeleteOrder = async (id: number) => {
    setSelectedOrderToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteOrder = async () => {
    if (!selectedOrderToDelete) return

    setIsLoadingOrders(true)

    try {
      const result = await removeOrdenTrabajo(selectedOrderToDelete)

      if (result.success) {
        toast({
          title: "Orden eliminada",
          description: "La orden de trabajo ha sido eliminada correctamente",
        })
        setIsDeleteDialogOpen(false)
        setSelectedOrderToDelete(null)
        await loadWorkOrders()
      } else {
        toast({
          variant: "destructive",
          title: "Error al eliminar",
          description: result.error || "No se pudo eliminar la orden de trabajo",
        })
      }
    } catch (error) {
      console.error("[v0] confirmDeleteOrder - Unexpected error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar la orden de trabajo",
      })
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const handleAssignTechnician = async () => {
    if (selectedOrder && selectedTechnicianId) {
      const result = await asignarTecnicoAOrden(selectedOrder.id, selectedTechnicianId)
      if (result) {
        await loadWorkOrders()
        setIsAssignDialogOpen(false)
        setSelectedOrder(null)
        setSelectedTechnicianId(null)
      } else {
        alert("Error al asignar técnico.")
      }
    }
  }

  const handleChangeStatus = async () => {
    if (selectedOrder && newStatus) {
      const result = await cambiarEstadoOrden(selectedOrder.id, newStatus, statusObservaciones || undefined)
      if (result) {
        await loadWorkOrders()
        setIsStatusDialogOpen(false)
        setSelectedOrder(null)
        setNewStatus("")
        setStatusObservaciones("")
      } else {
        alert("Error al cambiar estado.")
      }
    }
  }

  // CHANGE: Actualizando función para usar generateWorkOrderPDF con el diseño profesional
  const handleDownloadPDF = async (order: any) => {
    try {
      // Find equipment data for this order
      const orderEquipment = equipment.find((eq) => eq.id === order.equipoId)
      // Generate PDF for single order using the professional template with equipment data
      const doc = await generateWorkOrderPDF(order, orderEquipment)

      // Download PDF
      const filename = `Orden_Trabajo_${order.numeroOrden || order.id}_${new Date().toISOString().split("T")[0]}.pdf`
      downloadPDF(doc, filename)

      toast({
        title: "PDF generado",
        description: "La orden de trabajo ha sido descargada correctamente",
      })
    } catch (error) {
      console.error("[v0] handleDownloadPDF - Error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar el PDF",
      })
    }
  }

  // CHANGE: Fixed recursive call - now calling getOrderStatusColor instead of getEstadoOrdenBadge
  const getEstadoOrdenBadge = (estado: string) => {
    const getOrderStatusColor = (estado: string) => {
      switch (estado) {
        case "abierta":
          return "bg-blue-100 text-blue-800"
        case "en_progreso": // CHANGE: Updated value to match snake_case expected by backend
          return "bg-yellow-100 text-yellow-800"
        case "completada":
          return "bg-green-100 text-green-800"
        case "pospuesta":
          return "bg-gray-100 text-gray-800"
        case "cancelada":
          return "bg-red-100 text-red-800"
        default:
          return "bg-gray-100 text-gray-800"
      }
    }

    return (
      <Badge className={`${getOrderStatusColor(estado)} rounded-md px-2 py-1`}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    )
  }

  const getPriorityBadge = (prioridad: string) => {
    const getPriorityColor = (prioridad: string) => {
      switch (prioridad) {
        case "crítica":
          return "bg-red-100 text-red-800"
        case "alta":
          return "bg-orange-100 text-orange-800"
        case "media":
          return "bg-yellow-100 text-yellow-800"
        case "baja":
          return "bg-green-100 text-green-800"
        default:
          return "bg-gray-100 text-gray-800"
      }
    }

    return (
      <Badge className={`${getPriorityColor(prioridad)} rounded-md px-2 py-1`}>
        {prioridad.charAt(0).toUpperCase() + prioridad.slice(1)}
      </Badge>
    )
  }

  const filteredOrders = workOrders

  const renderOrdenes = () => {
    const totalRecords = filteredOrders.length
    const totalPages = Math.ceil(totalRecords / orderPerPage)
    const startIndex = (orderCurrentPage - 1) * orderPerPage
    const endIndex = Math.min(startIndex + orderPerPage, totalRecords)
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

    // Moved useEffect for pagination logic to the top level
    // useEffect(() => {
    //   setOrderTotalPages(totalPages)
    //   if (orderCurrentPage > totalPages && totalPages > 0) {
    //     setOrderCurrentPage(1)
    //   }
    // }, [totalRecords, orderPerPage, totalPages, orderCurrentPage, setOrderTotalPages, setOrderCurrentPage])

    return (
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{""}</h1>
          <Button
            onClick={() => {
              setSelectedOrder(null)
              setNewOrderData({
                tipo: "Preventivo",
                prioridad: "media",
                estado: "abierta",
                fechaCreacion: new Date().toISOString().split("T")[0],
              })
              setIsOrderDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Orden
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Filtros:</span>
              </div>
              <Select
                value={orderFilters.estado}
                onValueChange={(value) => setOrderFilters({ ...orderFilters, estado: value })}
              >
                <SelectTrigger className="w-36 min-w-32">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="abierta">Abierta</SelectItem>
                  <SelectItem value="en_progreso">En Progreso</SelectItem>{" "}
                  {/* CHANGE: Updated value to match snake_case */}
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="pospuesta">Pospuesta</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={orderFilters.prioridad}
                onValueChange={(value) => setOrderFilters({ ...orderFilters, prioridad: value })}
              >
                <SelectTrigger className="w-36 min-w-32">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="crítica">Crítica</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={orderFilters.tipo}
                onValueChange={(value) => setOrderFilters({ ...orderFilters, tipo: value })}
              >
                <SelectTrigger className="w-36 min-w-32">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="Preventivo">Preventivo</SelectItem>
                  <SelectItem value="Correctivo">Correctivo</SelectItem>
                  <SelectItem value="Inspección">Inspección</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                className="w-40 bg-white"
                placeholder="Fecha desde"
                value={orderFilters.fechaDesde}
                onChange={(e) => setOrderFilters({ ...orderFilters, fechaDesde: e.target.value })}
              />
              <Input
                type="date"
                className="w-40 bg-white"
                placeholder="Fecha hasta"
                value={orderFilters.fechaHasta}
                onChange={(e) => setOrderFilters({ ...orderFilters, fechaHasta: e.target.value })}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setOrderFilters({ estado: "all", prioridad: "all", tipo: "all", fechaDesde: "", fechaHasta: "" })
                }
              >
                Limpiar
              </Button>
            </div>

            {/* Search and Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mostrar</span>
                <Select value={orderPerPage.toString()} onValueChange={(value) => setOrderPerPage(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600 dark:text-gray-400">registros</span>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  className="w-64"
                  placeholder="Buscar órdenes..."
                  value={searchOrder}
                  onChange={(e) => setSearchOrder(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      N° Orden
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Equipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Técnico
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingOrders ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        Cargando órdenes...
                      </td>
                    </tr>
                  ) : paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No se encontraron órdenes de trabajo
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{order.numeroOrden}</td>
                        <td className="px-4 py-3">{order.equipoNombre}</td>
                        <td className="px-4 py-3">{order.tipo}</td>
                        <td className="px-4 py-3">{getPriorityBadge(order.prioridad)}</td>
                        <td className="px-4 py-3">{getEstadoOrdenBadge(order.estado)}</td>
                        <td className="px-4 py-3">
                          {order.tecnicoAsignadoNombre || <span className="text-gray-400 text-sm">Sin asignar</span>}
                        </td>
                        <td className="px-4 py-3 text-sm">{formatDate(order.fechaCreacion)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* CHANGE: Added conditional rendering and colors to icons */}
                            {!order.tecnicoAsignadoId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setIsAssignDialogOpen(true)
                                }}
                              >
                                <UserPlus className="h-3 w-3 mr-1 text-green-600" />
                                Asignar
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order)
                                setIsOrderDetailsOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedOrder(order)
                                    setNewOrderData(order)
                                    setIsOrderDialogOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2 text-amber-600" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedOrder(order)
                                    setIsStatusDialogOpen(true)
                                  }}
                                >
                                  <Activity className="h-4 w-4 mr-2 text-purple-600" />
                                  Cambiar Estado
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadPDF(order)}>
                                  <Download className="h-4 w-4 mr-2 text-green-600" />
                                  Descargar PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteOrder(order.id)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {startIndex + 1} a {endIndex} de {totalRecords} registros
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={orderCurrentPage === 1}
                  onClick={() => setOrderCurrentPage(orderCurrentPage - 1)}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (orderCurrentPage <= 3) {
                      pageNum = i + 1
                    } else if (orderCurrentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = orderCurrentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === orderCurrentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setOrderCurrentPage(pageNum)}
                        className={pageNum === orderCurrentPage ? "bg-blue-600 text-white" : ""}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={orderCurrentPage === totalPages}
                  onClick={() => setOrderCurrentPage(orderCurrentPage + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Order Dialog */}
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedOrder ? "Editar Orden" : "Nueva Orden de Trabajo"}</DialogTitle>
              <DialogDescription>
                {selectedOrder ? "Modifica los datos de la orden" : "Completa los datos para crear una nueva orden"}
              </DialogDescription>
            </DialogHeader>

            {orderFormErrors.general && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{orderFormErrors.general}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="equipoId">Equipo *</Label>
                  <EquipmentCombobox
                    equipment={equipment}
                    value={newOrderData.equipoId?.toString() || ""}
                    onValueChange={(value) => {
                      setNewOrderData({ ...newOrderData, equipoId: Number(value) })
                      setOrderFormErrors({ ...orderFormErrors, equipoId: "" })
                    }}
                    error={!!orderFormErrors.equipoId}
                  />
                  {orderFormErrors.equipoId && <p className="text-red-500 text-xs">{orderFormErrors.equipoId}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={newOrderData.tipo}
                    onValueChange={(value) => {
                      setNewOrderData({ ...newOrderData, tipo: value })
                      setOrderFormErrors({ ...orderFormErrors, tipo: "" }) // Clear error on change
                    }}
                  >
                    <SelectTrigger className={orderFormErrors.tipo ? "border-red-500" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Preventivo">Preventivo</SelectItem>
                      <SelectItem value="Correctivo">Correctivo</SelectItem>
                      <SelectItem value="Inspección">Inspección</SelectItem>
                    </SelectContent>
                  </Select>
                  {orderFormErrors.tipo && <p className="text-red-500 text-xs">{orderFormErrors.tipo}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prioridad">Prioridad *</Label>
                  <Select
                    value={newOrderData.prioridad}
                    onValueChange={(value) => {
                      setNewOrderData({ ...newOrderData, prioridad: value })
                      setOrderFormErrors({ ...orderFormErrors, prioridad: "" }) // Clear error on change
                    }}
                  >
                    <SelectTrigger className={orderFormErrors.prioridad ? "border-red-500" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crítica">Crítica</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                  {orderFormErrors.prioridad && <p className="text-red-500 text-xs">{orderFormErrors.prioridad}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Select
                    value={newOrderData.estado}
                    onValueChange={(value) => setNewOrderData({ ...newOrderData, estado: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="abierta">Abierta</SelectItem>
                      <SelectItem value="en_progreso">En Progreso</SelectItem>{" "}
                      {/* CHANGE: Updated value to match snake_case */}
                      <SelectItem value="completada">Completada</SelectItem>
                      <SelectItem value="pospuesta">Pospuesta</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tecnicoAsignadoId">Técnico Asignado</Label>
                  <Select
                    value={newOrderData.tecnicoAsignadoId?.toString() || "0"}
                    onValueChange={(value) => {
                      const numValue = Number(value)
                      setNewOrderData({
                        ...newOrderData,
                        tecnicoAsignadoId: numValue === 0 ? undefined : numValue,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sin asignar</SelectItem>
                      {users
                        .filter((u) => {
                          const rolLower = u.rol?.toLowerCase() || ""
                          const rolMatch =
                            rolLower === "técnico" ||
                            rolLower === "tecnico" ||
                            rolLower === "supervisor" ||
                            rolLower === "administrador"
                          const estadoMatch = u.estado?.toLowerCase() === "activo"
                          return rolMatch && estadoMatch
                        })
                        .map((tech) => (
                          <SelectItem key={tech.id} value={tech.id.toString()}>
                            {tech.nombre} ({tech.rol})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describe el trabajo a realizar..."
                  value={newOrderData.descripcion || ""}
                  onChange={(e) => {
                    setNewOrderData({ ...newOrderData, descripcion: e.target.value })
                    setOrderFormErrors({ ...orderFormErrors, descripcion: "" }) // Clear error on change
                  }}
                  rows={3}
                  className={orderFormErrors.descripcion ? "border-red-500" : ""}
                />
                {orderFormErrors.descripcion && <p className="text-red-500 text-xs">{orderFormErrors.descripcion}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaCreacion">Fecha de Creación *</Label>
                  <Input
                    id="fechaCreacion"
                    type="date"
                    value={newOrderData.fechaCreacion || ""}
                    onChange={(e) => setNewOrderData({ ...newOrderData, fechaCreacion: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={newOrderData.fechaInicio || ""}
                    onChange={(e) => setNewOrderData({ ...newOrderData, fechaInicio: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaFinalizacion">Fecha de Finalización</Label>
                  <Input
                    id="fechaFinalizacion"
                    type="date"
                    value={newOrderData.fechaFinalizacion || ""}
                    onChange={(e) => setNewOrderData({ ...newOrderData, fechaFinalizacion: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horasTrabajadas">Horas Trabajadas</Label>
                  <Input
                    id="horasTrabajadas"
                    type="number"
                    step="0.5"
                    value={newOrderData.horasTrabajadas || ""}
                    onChange={(e) => setNewOrderData({ ...newOrderData, horasTrabajadas: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costoRepuestos">Costo Repuestos ($)</Label>
                  <Input
                    id="costoRepuestos"
                    type="number"
                    step="0.01"
                    value={newOrderData.costoRepuestos || ""}
                    onChange={(e) => setNewOrderData({ ...newOrderData, costoRepuestos: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costoTotal">Costo Total ($)</Label>
                  <Input
                    id="costoTotal"
                    type="number"
                    step="0.01"
                    value={newOrderData.costoTotal || ""}
                    onChange={(e) => setNewOrderData({ ...newOrderData, costoTotal: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Observaciones adicionales..."
                  value={newOrderData.observaciones || ""}
                  onChange={(e) => setNewOrderData({ ...newOrderData, observaciones: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveOrder} disabled={isLoadingOrders}>
                {selectedOrder ? "Guardar Cambios" : "Crear Orden"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Order Details Dialog */}
        <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de la Orden</DialogTitle>
              <DialogDescription>{selectedOrder?.numeroOrden}</DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Equipo</Label>
                    <p className="text-base">{selectedOrder.equipoNombre}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                    <p className="text-base">{selectedOrder.tipo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Prioridad</Label>
                    <div className="mt-1">{getPriorityBadge(selectedOrder.prioridad)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Estado</Label>
                    <div className="mt-1">{getEstadoOrdenBadge(selectedOrder.estado)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Técnico Asignado</Label>
                    <p className="text-base">{selectedOrder.tecnicoAsignadoNombre || "Sin asignar"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Fecha de Creación</Label>
                    <p className="text-base">{selectedOrder.fechaCreacion}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Fecha de Inicio</Label>
                    <p className="text-base">{selectedOrder.fechaInicio || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Fecha de Finalización</Label>
                    <p className="text-base">{selectedOrder.fechaFinalizacion || "-"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Descripción</Label>
                  <p className="text-base mt-1">{selectedOrder.descripcion}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Horas Trabajadas</Label>
                    <p className="text-base">{selectedOrder.horasTrabajadas || "0"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Costo Repuestos</Label>
                    <p className="text-base">${Number(selectedOrder.costoRepuestos || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Costo Total</Label>
                    <p className="text-base font-semibold">${Number(selectedOrder.costoTotal || 0).toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Observaciones</Label>
                  <p className="text-base mt-1">{selectedOrder.observaciones || "-"}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOrderDetailsOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Technician Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Asignar Técnico</DialogTitle>
              <DialogDescription>Selecciona un técnico para la orden {selectedOrder?.numeroOrden}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Select onValueChange={(value) => setSelectedTechnicianId(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar técnico" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => {
                      const rolLower = u.rol?.toLowerCase() || ""
                      const rolMatch =
                        rolLower === "técnico" ||
                        rolLower === "tecnico" ||
                        rolLower === "supervisor" ||
                        rolLower === "administrador"
                      const estadoMatch = u.estado?.toLowerCase() === "activo"
                      return rolMatch && estadoMatch
                    })
                    .map((tech) => (
                      <SelectItem key={tech.id} value={tech.id.toString()}>
                        {tech.nombre} ({tech.rol})
                      </SelectItem>
                    ))}
                  {users.filter((u) => {
                    const rolLower = u.rol?.toLowerCase() || ""
                    const rolMatch =
                      rolLower === "técnico" ||
                      rolLower === "tecnico" ||
                      rolLower === "supervisor" ||
                      rolLower === "administrador"
                    const estadoMatch = u.estado?.toLowerCase() === "activo"
                    return rolMatch && estadoMatch
                  }).length === 0 && (
                    <SelectItem value="0" disabled>
                      No hay usuarios activos disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAssignDialogOpen(false)
                  setSelectedTechnicianId(null)
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleAssignTechnician} disabled={!selectedTechnicianId}>
                Asignar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Status Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cambiar Estado</DialogTitle>
              <DialogDescription>Actualiza el estado de la orden {selectedOrder?.numeroOrden}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="abierta">Abierta</SelectItem>
                  <SelectItem value="en_progreso">En Progreso</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="pospuesta">Pospuesta</SelectItem>
                </SelectContent>
              </Select>
              <div className="space-y-2">
                <label htmlFor="observaciones" className="text-sm font-medium">
                  Observaciones (opcional)
                </label>
                <Textarea
                  id="observaciones"
                  placeholder="Agregar observaciones sobre el cambio de estado..."
                  value={statusObservaciones}
                  onChange={(e) => setStatusObservaciones(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsStatusDialogOpen(false)
                  setNewStatus("")
                  setStatusObservaciones("")
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleChangeStatus} disabled={!newStatus}>
                Cambiar Estado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Está seguro de que desea eliminar esta orden de trabajo? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setSelectedOrderToDelete(null)
                }}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDeleteOrder} disabled={isLoadingOrders}>
                {isLoadingOrders ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* EQUIPMENT DELETE CONFIRMATION DIALOG */}
        <Dialog open={isDeleteEquipmentDialogOpen} onOpenChange={setIsDeleteEquipmentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Está seguro de que desea eliminar este equipo? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteEquipmentDialogOpen(false)
                  setSelectedEquipmentToDelete(null)
                }}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDeleteEquipment} disabled={equipmentLoading}>
                {equipmentLoading ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* USER DELETE CONFIRMATION DIALOG */}
        <Dialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Está seguro de que desea eliminar este usuario? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteUserDialogOpen(false)
                  setSelectedUserToDelete(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!selectedUserToDelete) return

                  const result = await removeUsuario(selectedUserToDelete)
                  if (result.success) {
                    toast({
                      title: "Usuario eliminado",
                      description: "El usuario ha sido eliminado exitosamente",
                    })
                    setIsDeleteUserDialogOpen(false)
                    setSelectedUserToDelete(null)
                    await loadUsers()
                  } else {
                    toast({
                      variant: "destructive",
                      title: "Error al eliminar",
                      description: result.error || "No se pudo eliminar el usuario",
                    })
                  }
                }}
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MAINTENANCE DELETE CONFIRMATION DIALOG */}
        <Dialog open={isDeleteMaintenanceDialogOpen} onOpenChange={setIsDeleteMaintenanceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Está seguro de que desea eliminar este mantenimiento programado? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteMaintenanceDialogOpen(false)
                  setSelectedMaintenanceToDelete(null)
                }}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDeleteMaintenance} disabled={maintenanceLoading}>
                {maintenanceLoading ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const getFilteredEquipment = useMemo(() => {
    // First, filter by the selected filters
    const filtered = equipment.filter((eq) => {
      const matchesEstado = equipmentFilters.estado === "all" || eq.estado === equipmentFilters.estado
      const matchesUbicacion = equipmentFilters.ubicacion === "all" || eq.ubicacion === equipmentFilters.ubicacion
      const matchesFabricante = equipmentFilters.fabricante === "all" || eq.fabricante === equipmentFilters.fabricante
      return matchesEstado && matchesUbicacion && matchesFabricante
    })

    // Then, apply search term
    const searched = searchTerm
      ? filtered.filter(
          (eq) =>
            eq.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            eq.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
            eq.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            eq.fabricante.toLowerCase().includes(searchTerm.toLowerCase()) ||
            eq.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : filtered

    // Apply pagination
    const startIndex = (currentPage - 1) * perPage
    const endIndex = startIndex + perPage
    const paginated = searched.slice(startIndex, endIndex)

    // Return both the paginated results and the total count
    return {
      items: paginated,
      total: searched.length,
    }
  }, [equipment, equipmentFilters, searchTerm, currentPage, perPage])

  useEffect(() => {
    if (getFilteredEquipment && typeof getFilteredEquipment.total === "number") {
      setTotalEquipment(getFilteredEquipment.total)
    } else {
      setTotalEquipment(0)
    }
  }, [getFilteredEquipment])

  const getStatusColor = (estado: string) => {
    if (!estado) {
      return "bg-gray-100 text-gray-800"
    }
    switch (estado.toLowerCase()) {
      case "operativo":
        return "bg-green-100 text-green-800"
      case "en reparacion":
      case "en_reparacion":
        return "bg-yellow-100 text-yellow-800"
      case "fuera de servicio":
      case "fuera de servicio":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (estado: string) => {
    if (!estado) {
      return <LucideAlertCircle className="h-4 w-4" />
    }
    switch (estado.toLowerCase()) {
      case "operativo":
        return <CheckCircle2 className="h-4 w-4" />
      case "en reparacion":
      case "en_reparacion":
        return <Clock className="h-4 w-4" />
      case "fuera de servicio":
      case "fuera de servicio":
        return <XCircle className="h-4 w-4" />
      default:
        return <LucideAlertCircle className="h-4 w-4" />
    }
  }

  const resetEquipmentForm = () => {
    setEquipmentForm({
      estado: "operativo",
      ubicacion: "uci",
      // Reset other fields that might have values when editing
      numeroSerie: "",
      nombre: "",
      modelo: "",
      fabricante: "",
      fechaInstalacion: "",
      codigoInstitucional: "",
      servicio: "",
      vencimientoGarantia: "",
      fechaIngreso: "",
      procedencia: "",
      potencia: "",
      corriente: "",
      otrosEspecificaciones: "",
      accesoriosConsumibles: "",
      estadoEquipo: "operativo",
      manualUsuario: false,
      manualServicio: false,
      nivelRiesgo: "",
      proveedorNombre: "",
      proveedorDireccion: "",
      proveedorTelefono: "",
      observaciones: "", // Ensure observations are reset
    })
    setEditingEquipment(false) // Reset editing state
    setEquipmentFormErrors({}) // Clear errors
  }

  const handleSaveEquipment = async () => {
    const errors: Record<string, string> = {}

    if (!equipmentForm.numeroSerie || equipmentForm.numeroSerie.trim() === "") {
      errors.numeroSerie = "El número de serie es requerido"
    }
    if (!equipmentForm.nombre || equipmentForm.nombre.trim() === "") {
      errors.nombre = "El nombre del equipo es requerido"
    }
    if (!equipmentForm.fabricante || equipmentForm.fabricante.trim() === "") {
      errors.fabricante = "El fabricante es requerido"
    }
    if (!equipmentForm.modelo || equipmentForm.modelo.trim() === "") {
      errors.modelo = "El modelo es requerido"
    }
    if (!equipmentForm.ubicacion || equipmentForm.ubicacion.trim() === "") {
      errors.ubicacion = "La ubicación es requerida"
    }
    if (!equipmentForm.fechaInstalacion) {
      // Changed from fechaAdquisicion to fechaInstalacion based on form field
      errors.fechaInstalacion = "La fecha de instalación es requerida"
    }
    if (!equipmentForm.estado) {
      errors.estado = "Debe seleccionar un estado"
    }
    if (!equipmentForm.estadoEquipo) {
      errors.estadoEquipo = "Debe seleccionar un estado del equipo"
    }

    if (Object.keys(errors).length > 0) {
      setEquipmentFormErrors(errors)
      return
    }

    setEquipmentFormErrors({})
    setEquipmentLoading(true)
    try {
      const equipoData = transformEquipmentToEquipo({
        ...equipmentForm,
        id: equipmentForm.id || 0,
      }) as Equipo

      const result = await saveEquipo(equipoData)

      if (result.success && result.equipo) {
        toast({
          title: editingEquipment ? "Equipo actualizado" : "Equipo guardado",
          description: `El equipo ha sido ${editingEquipment ? "actualizado" : "guardado"} exitosamente.`,
        })
        setShowEquipmentForm(false)
        resetEquipmentForm()
        await loadEquipment()
      } else {
        setEquipmentFormErrors({ general: result.error || "Error al guardar el equipo" })
        toast({
          variant: "destructive",
          title: "Error al guardar equipo",
          description: result.error || "No se pudo guardar el equipo. Por favor intente de nuevo.",
        })
      }
    } catch (error) {
      console.error("[v0] Error saving equipment:", error)
      setEquipmentFormErrors({ general: "Error de conexión al guardar el equipo" })
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo conectar al servidor para guardar el equipo.",
      })
    } finally {
      setEquipmentLoading(false)
    }
  }

  const handleDeleteEquipment = async (id: number) => {
    // CHANGE: Remove browser confirm and use Dialog instead
    setSelectedEquipmentToDelete(id)
    setIsDeleteEquipmentDialogOpen(true)
  }

  // CHANGE: New function to confirm equipment deletion
  const confirmDeleteEquipment = async () => {
    if (!selectedEquipmentToDelete) return

    setEquipmentLoading(true)
    try {
      const userId = localStorage.getItem("userId")
      const result = await removeEquipo(selectedEquipmentToDelete, userId || undefined)

      if (result.success) {
        toast({
          title: "Equipo eliminado",
          description: "El equipo ha sido eliminado exitosamente",
        })
        setIsDeleteEquipmentDialogOpen(false)
        setSelectedEquipmentToDelete(null)
        setShowEquipmentDetails(false) // Close details if open
        await loadEquipment()
      } else {
        toast({
          variant: "destructive",
          title: "Error al eliminar",
          description: result.error || "No se pudo eliminar el equipo",
        })
      }
    } catch (error) {
      console.error("[v0] Error deleting equipment:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al eliminar el equipo",
      })
    } finally {
      setEquipmentLoading(false)
    }
  }

  const handleViewEquipmentDetails = async (equipo: Equipment) => {
    setSelectedEquipment(equipo)
    setShowEquipmentDetails(true)

    try {
      const details = await getEquipo(equipo.id)
      if (details) {
        const transformedDetails = transformEquipoToEquipment(details)

        // Handle documents if they exist
        if ((details as any).documentos && Array.isArray((details as any).documentos)) {
          transformedDetails.documentos = (details as any).documentos.map((d: any) => ({
            id: d.id, // Add id from API response
            nombre: d.nombre || "Sin nombre",
            tipo: d.tipo || "desconocido",
            fechaSubida: d.fecha_subida || d.fechaSubida || "N/A",
            url: d.url, // Add url from API response
          }))
        }
        setSelectedEquipment(transformedDetails)
      } else {
        // Keep the basic equipment data that was already set
      }
    } catch (error) {
      console.error("[v0] Error loading equipment details:", error)
      // Keep the basic equipment data that was already set
    }
  }

  // CHANGE: handleFileUpload function
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedEquipment) {
      return
    }

    try {
      setEquipmentLoading(true)
      const token = localStorage.getItem("authToken")
      const userId = localStorage.getItem("userId")

      if (!token) {
        throw new Error("No authentication token found. Please log in again.")
      }

      // Use the lib/api/documentos uploadDocumento function
      const { uploadDocumento } = await import("@/lib/api/documentos")
      const newDoc = await uploadDocumento(
        selectedEquipment.id,
        file,
        userId ? Number.parseInt(userId) : 1, // Default to 1 if userId is not found, though this should be handled by authentication
        token,
      )

      // Fetch updated equipment details to refresh the list of documents
      const { getEquipo } = await import("@/lib/api/equipos")
      const updatedEquipment = await getEquipo(selectedEquipment.id)

      const transformedEquipment = transformEquipoToEquipment(updatedEquipment)

      setSelectedEquipment(transformedEquipment)

      // Update equipment list in the main view as well
      setEquipment(equipment.map((eq) => (eq.id === selectedEquipment.id ? transformedEquipment : eq)))

      toast({
        title: "Documento subido",
        description: `El archivo ${file.name} se ha subido exitosamente.`,
      })
    } catch (error) {
      console.error("[v0] Error uploading document:", error)
      toast({
        variant: "destructive",
        title: "Error al subir documento",
        description: error instanceof Error ? error.message : "Ocurrió un error al subir el archivo.",
      })
    } finally {
      setEquipmentLoading(false)
      // Reset file input
      if (e.target) {
        e.target.value = ""
      }
    }
  }

  const handleViewDocument = (doc: { id?: number; url?: string }) => {
    if (doc.url) {
      const fullUrl = getDocumentoUrl(doc.url)
      window.open(fullUrl, "_blank")
    }
  }

  const handleDownloadDocument = async (doc: { id?: number; nombre?: string }) => {
    if (!doc.id) return

    try {
      const { downloadDocumento } = await import("@/lib/api/documentos")
      const blob = await downloadDocumento(doc.id)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = doc.nombre || "documento"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading document:", error)
      toast({
        variant: "destructive",
        title: "Error al descargar documento",
        description: "Ocurrió un error al descargar el archivo.",
      })
    }
  }

  const handleDeleteDocument = async (docId: number, index: number) => {
    if (!selectedEquipment) return

    if (!confirm("¿Está seguro de eliminar este documento?")) return

    try {
      setEquipmentLoading(true)

      const { deleteDocumento } = await import("@/lib/api/documentos")
      await deleteDocumento(docId)

      // Refresh equipment details
      const updatedEquipment = await getEquipo(selectedEquipment.id)
      const transformedEquipment = transformEquipoToEquipment(updatedEquipment)

      setSelectedEquipment(transformedEquipment)
      setEquipment(equipment.map((eq) => (eq.id === selectedEquipment.id ? transformedEquipment : eq)))

      toast({
        title: "Documento eliminado",
        description: "El documento se ha eliminado exitosamente.",
      })
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        variant: "destructive",
        title: "Error al eliminar documento",
        description: "Ocurrió un error al eliminar el archivo.",
      })
    } finally {
      setEquipmentLoading(false)
    }
  }

  // Removed handleNotifyEquipment
  // const handleNotifyEquipment = (equipo: Equipment) => {
  //   alert(`Notificación enviada para el equipo: ${equipo.nombre}`)
  // }

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Técnicos</p>
                  <p className="text-3xl font-bold">{stats?.usuariosCount || 0}</p>
                </div>
                <Users className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Equipos</p>
                  <p className="text-3xl font-bold">{stats?.equiposCount || 45}</p>
                </div>
                <Wrench className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-sky-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sky-100 text-sm">Mantenimientos</p>
                  <p className="text-3xl font-bold">{stats?.mantenimientosCount || 23}</p>
                </div>
                <SettingsIcon className="h-8 w-8 text-sky-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Equipos por Fabricante</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.equiposPorFabricante || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="cantidad" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Mantenimientos por Mes</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats?.mantenimientosPorMes || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cantidad" stroke="#3b82f6" name="Cantidad" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderGestionEquipos = () => (
    <TooltipProvider>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800"></h1>
        <Dialog open={showEquipmentForm} onOpenChange={setShowEquipmentForm}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Equipo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEquipment ? "Editar Equipo" : "Registrar Nuevo Equipo"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <h3 className="text-lg font-semibold mb-3 text-blue-700">Información Básica</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroSerie">Número de Serie *</Label>
                <Input
                  id="numeroSerie"
                  placeholder="Ej: BM2024001"
                  value={equipmentForm.numeroSerie || ""}
                  onChange={(e) => {
                    setEquipmentForm({ ...equipmentForm, numeroSerie: e.target.value })
                    setEquipmentFormErrors({ ...equipmentFormErrors, numeroSerie: "" })
                  }}
                />
                {equipmentFormErrors.numeroSerie && (
                  <p className="text-red-500 text-xs">{equipmentFormErrors.numeroSerie}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigoInstitucional">Código Institucional</Label>
                <Input
                  id="codigoInstitucional"
                  placeholder="Ej: TX-001"
                  value={equipmentForm.codigoInstitucional || ""}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, codigoInstitucional: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Equipo *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Monitor de Signos Vitales"
                  value={equipmentForm.nombre || ""}
                  onChange={(e) => {
                    setEquipmentForm({ ...equipmentForm, nombre: e.target.value })
                    setEquipmentFormErrors({ ...equipmentFormErrors, nombre: "" })
                  }}
                />
                {equipmentFormErrors.nombre && <p className="text-red-500 text-xs">{equipmentFormErrors.nombre}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="servicio">Servicio</Label>
                <Input
                  id="servicio"
                  placeholder="Ej: Laboratorio"
                  value={equipmentForm.servicio || ""}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, servicio: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fabricante">Marca / Fabricante</Label>
                <Select
                  value={equipmentForm.fabricante}
                  onValueChange={(value) => {
                    setEquipmentForm({ ...equipmentForm, fabricante: value })
                    setEquipmentFormErrors({ ...equipmentFormErrors, fabricante: "" })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar fabricante" />
                  </SelectTrigger>
                  <SelectContent>
                    {configManufacturers.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {equipmentFormErrors.fabricante && (
                  <p className="text-red-500 text-xs">{equipmentFormErrors.fabricante}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  placeholder="Ej: VSM-3000"
                  value={equipmentForm.modelo || ""}
                  onChange={(e) => {
                    setEquipmentForm({ ...equipmentForm, modelo: e.target.value })
                    setEquipmentFormErrors({ ...equipmentFormErrors, modelo: "" })
                  }}
                />
                {equipmentFormErrors.modelo && <p className="text-red-500 text-xs">{equipmentFormErrors.modelo}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaIngreso">Fecha de Ingreso</Label>
                <Input
                  id="fechaIngreso"
                  type="date"
                  value={equipmentForm.fechaIngreso || ""}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, fechaIngreso: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vencimientoGarantia">Vencimiento Garantía</Label>
                <Input
                  id="vencimientoGarantia"
                  type="date"
                  value={equipmentForm.vencimientoGarantia || ""}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, vencimientoGarantia: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="procedencia">Procedencia</Label>
                <Select
                  value={equipmentForm.procedencia}
                  onValueChange={(value) => setEquipmentForm({ ...equipmentForm, procedencia: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nacional">Nacional</SelectItem>
                    <SelectItem value="importado">Importado</SelectItem>
                    <SelectItem value="donacion">Donación</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ubicacion">Ubicación</Label>
                <Select
                  value={equipmentForm.ubicacion}
                  onValueChange={(value) => {
                    setEquipmentForm({ ...equipmentForm, ubicacion: value })
                    setEquipmentFormErrors({ ...equipmentFormErrors, ubicacion: "" })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    {configLocations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {equipmentFormErrors.ubicacion && (
                  <p className="text-red-500 text-xs">{equipmentFormErrors.ubicacion}</p>
                )}
              </div>

              <div className="col-span-2 mt-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-700">Especificaciones Técnicas</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voltaje">Voltaje</Label>
                <Input
                  id="voltaje"
                  placeholder="Ej: 220V AC"
                  value={equipmentForm.voltaje || ""}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, voltaje: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="potencia">Potencia</Label>
                <Input
                  id="potencia"
                  placeholder="Ej: 500W"
                  value={equipmentForm.potencia || ""}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, potencia: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="corriente">Corriente</Label>
                <Input
                  id="corriente"
                  placeholder="Ej: 2.5A"
                  value={equipmentForm.corriente || ""}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, corriente: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frecuencia">Frecuencia</Label>
                <Input
                  id="frecuencia"
                  placeholder="Ej: 50-60Hz"
                  value={equipmentForm.frecuencia || ""}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, frecuencia: e.target.value })}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="otrosEspecificaciones">Otras Especificaciones</Label>
                <Textarea
                  id="otrosEspecificaciones"
                  placeholder="Especificaciones técnicas adicionales"
                  value={equipmentForm.otrosEspecificaciones || ""}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, otrosEspecificaciones: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="col-span-2 mt-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-700">Accesorios y Estado</h3>
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="accesoriosConsumibles">Accesorios / Consumibles</Label>
                <Textarea
                  id="accesoriosConsumibles"
                  placeholder="Lista de accesorios y consumibles del equipo"
                  value={equipmentForm.accesoriosConsumibles || ""}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, accesoriosConsumibles: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estadoEquipo">Estado del Equipo</Label>
                <Select
                  value={equipmentForm.estadoEquipo}
                  onValueChange={(value) => setEquipmentForm({ ...equipmentForm, estadoEquipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nuevo">Nuevo</SelectItem>
                    <SelectItem value="operado">Operativo</SelectItem>
                    <SelectItem value="no_operable">No Operable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nivelRiesgo">Nivel de Riesgo</Label>
                <Select
                  value={equipmentForm.nivelRiesgo}
                  onValueChange={(value) => setEquipmentForm({ ...equipmentForm, nivelRiesgo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alto">Alto</SelectItem>
                    <SelectItem value="medio">Medio</SelectItem>
                    <SelectItem value="bajo">Bajo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* CHANGE: Updated manual checkboxes */}
              <div className="space-y-2">
                <Label>Manuales</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="manualUsuario"
                      checked={equipmentForm.manualUsuario || false}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, manualUsuario: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="manualUsuario" className="font-normal cursor-pointer text-sm">
                      Manual de Usuario
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="manualServicio"
                      checked={equipmentForm.manualServicio || false}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, manualServicio: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="manualServicio" className="font-normal cursor-pointer text-sm">
                      Manual de Servicio
                    </Label>
                  </div>
                </div>
              </div>

              <div className="col-span-2 mt-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-700">Datos del Proveedor</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proveedorNombre">Nombre del Proveedor</Label>
                <Input
                  id="proveedorNombre"
                  placeholder="Nombre de la empresa"
                  value={equipmentForm.proveedorNombre || ""}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, proveedorNombre: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proveedorTelefono">Teléfono / Celular</Label>
                <Input
                  id="proveedorTelefono"
                  placeholder="Ej: 591-4-1234567"
                  value={equipmentForm.proveedorTelefono || ""}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, proveedorTelefono: e.target.value })}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="proveedorDireccion">Dirección</Label>
                <Input
                  id="proveedorDireccion"
                  placeholder="Dirección completa del proveedor"
                  value={equipmentForm.proveedorDireccion || ""}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, proveedorDireccion: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaInstalacion">Fecha de Instalación</Label>
                <Input
                  id="fechaInstalacion"
                  type="date"
                  value={equipmentForm.fechaInstalacion || ""}
                  onChange={(e) => {
                    setEquipmentForm({ ...equipmentForm, fechaInstalacion: e.target.value })
                    setEquipmentFormErrors({ ...equipmentFormErrors, fechaInstalacion: "" })
                  }}
                />
                {equipmentFormErrors.fechaInstalacion && (
                  <p className="text-red-500 text-xs">{equipmentFormErrors.fechaInstalacion}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado Operativo</Label>
                <Select
                  value={equipmentForm.estado}
                  onValueChange={(value) => {
                    setEquipmentForm({ ...equipmentForm, estado: value })
                    setEquipmentFormErrors({ ...equipmentFormErrors, estado: "" })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operativo">Operativo</SelectItem>
                    <SelectItem value="en reparacion">En Reparación</SelectItem>
                    <SelectItem value="fuera de servicio">Fuera de Servicio</SelectItem>
                  </SelectContent>
                </Select>
                {equipmentFormErrors.estado && <p className="text-red-500 text-xs">{equipmentFormErrors.estado}</p>}
              </div>

              {/* CHANGE: Added observaciones field to equipment form */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Notas adicionales sobre el equipo"
                  value={equipmentForm.observaciones || ""}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, observaciones: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            {equipmentFormErrors.general && <p className="text-red-500 text-xs">{equipmentFormErrors.general}</p>}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEquipmentForm(false)
                  resetEquipmentForm()
                }}
                disabled={equipmentLoading}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveEquipment} disabled={equipmentLoading}>
                {equipmentLoading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>
            <Select
              value={equipmentFilters.estado}
              onValueChange={(value) => setEquipmentFilters({ ...equipmentFilters, estado: value })}
            >
              <SelectTrigger className="w-36 min-w-32">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="operativo">Operativo</SelectItem>
                <SelectItem value="en reparacion">En Reparación</SelectItem>
                <SelectItem value="fuera de servicio">Fuera de Servicio</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={equipmentFilters.ubicacion}
              onValueChange={(value) => setEquipmentFilters({ ...equipmentFilters, ubicacion: value })}
            >
              <SelectTrigger className="w-36 min-w-32">
                <SelectValue placeholder="Ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ubicaciones</SelectItem>
                {configLocations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={equipmentFilters.fabricante}
              onValueChange={(value) => setEquipmentFilters({ ...equipmentFilters, fabricante: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Fabricante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los fabricantes</SelectItem>
                {configManufacturers.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEquipmentFilters({ estado: "all", ubicacion: "all", fabricante: "all" })}
            >
              Limpiar
            </Button>
          </div>

          {/* Search and Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Mostrar</span>
              <select
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">registros</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Buscar:</span>
              <Input
                className="w-48"
                placeholder=""
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>

          {/* Table */}
          {equipmentLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-gray-600">Cargando equipos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ID Equipo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Serie</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Modelo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Fabricante</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ubicación</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Voltaje</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {getFilteredEquipment.items.map(
                    (
                      equipo, // Use .items from the memoized result
                    ) => (
                      <tr key={equipo.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">{equipo.id}</td>
                        <td className="py-3 px-4 text-sm">{equipo.numeroSerie}</td>
                        <td className="py-3 px-4 text-sm font-medium">{equipo.nombre}</td>
                        <td className="py-3 px-4 text-sm">{equipo.modelo}</td>
                        <td className="py-3 px-4 text-sm">{equipo.fabricante}</td>
                        <td className="py-3 px-4 text-sm">{equipo.ubicacion}</td>
                        <td className="py-3 px-4">
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge className={`${getStatusColor(equipo.estado)} flex items-center gap-1`}>
                                {getStatusIcon(equipo.estado)}
                                {equipo.estado}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Estado: {equipo.estado}</p>
                              <p>Instalado: {equipo.fechaInstalacion}</p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="py-3 px-4 text-sm">{equipo.voltaje}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewEquipmentDetails(equipo)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver detalles</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditEquipment(equipo)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Modificar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => handleDeleteEquipment(equipo.id)}
                                  disabled={
                                    equipmentAssociations[equipo.id]?.hasMaintenances ||
                                    equipmentAssociations[equipo.id]?.hasWorkOrders
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {equipmentAssociations[equipo.id]?.hasMaintenances ||
                                equipmentAssociations[equipo.id]?.hasWorkOrders
                                  ? "No se puede eliminar. Este equipo tiene mantenimientos u órdenes de trabajo asociadas."
                                  : "Eliminar"}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGenerateEquipmentTechnicalSheet(equipo)}
                                  className="text-purple-600 hover:text-purple-700"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ficha Técnica</TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <span className="text-sm text-gray-600">
              Mostrando {(currentPage - 1) * perPage + 1} a {Math.min(currentPage * perPage, totalEquipment)} de{" "}
              {totalEquipment} registros
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1 || equipmentLoading}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Anterior
              </Button>
              <Button variant="outline" size="sm" className="bg-blue-600 text-white border-blue-600">
                {currentPage}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage * perPage >= totalEquipment || equipmentLoading}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Details Dialog */}
      <Dialog open={showEquipmentDetails} onOpenChange={setShowEquipmentDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Equipo - {selectedEquipment?.nombre || "Cargando..."}</DialogTitle>
          </DialogHeader>
          {selectedEquipment && (
            <div className="space-y-6">
              {/* Equipment Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <strong>ID Equipo:</strong> {selectedEquipment.id || "N/A"}
                </div>
                <div>
                  <strong>Número de Serie:</strong> {selectedEquipment.numeroSerie || "N/A"}
                </div>
                <div>
                  <strong>Código Institucional:</strong> {selectedEquipment.codigoInstitucional || "N/A"}
                </div>
                <div>
                  <strong>Nombre Equipo:</strong> {selectedEquipment.nombre || "N/A"}
                </div>
                <div>
                  <strong>Servicio:</strong> {selectedEquipment.servicio || "N/A"}
                </div>
                <div>
                  <strong>Fabricante:</strong> {selectedEquipment.fabricante || "N/A"}
                </div>
                <div>
                  <strong>Modelo:</strong> {selectedEquipment.modelo || "N/A"}
                </div>
                <div>
                  <strong>Fecha Ingreso:</strong>{" "}
                  {selectedEquipment.fechaIngreso ? formatDate(selectedEquipment.fechaIngreso) : "N/A"}
                </div>
                <div>
                  <strong>Vencimiento Garantía:</strong>{" "}
                  {selectedEquipment.vencimientoGarantia ? formatDate(selectedEquipment.vencimientoGarantia) : "N/A"}
                </div>
                <div>
                  <strong>Procedencia:</strong> {selectedEquipment.procedencia || "N/A"}
                </div>
                <div>
                  <strong>Ubicación:</strong> {selectedEquipment.ubicacion || "N/A"}
                </div>
                <div>
                  <strong>Fecha Instalación:</strong>{" "}
                  {selectedEquipment.fechaInstalacion ? formatDate(selectedEquipment.fechaInstalacion) : "N/A"}
                </div>
                <div>
                  <strong>Estado Operativo:</strong>
                  <Badge className={`ml-2 ${getStatusColor(selectedEquipment.estado)}`}>
                    {selectedEquipment.estado || "N/A"}
                  </Badge>
                </div>
                <div>
                  <strong>Voltaje:</strong> {selectedEquipment.voltaje || "N/A"}
                </div>
                <div>
                  <strong>Potencia:</strong> {selectedEquipment.potencia || "N/A"}
                </div>
                <div>
                  <strong>Corriente:</strong> {selectedEquipment.corriente || "N/A"}
                </div>
                <div>
                  <strong>Frecuencia:</strong> {selectedEquipment.frecuencia || "N/A"}
                </div>
                <div>
                  <strong>Otras Especificaciones:</strong> {selectedEquipment.otrosEspecificaciones || "N/A"}
                </div>
                <div>
                  <strong>Accesorios / Consumibles:</strong> {selectedEquipment.accesoriosConsumibles || "N/A"}
                </div>
                <div>
                  <strong>Estado del Equipo:</strong> {selectedEquipment.estadoEquipo || "N/A"}
                </div>
                <div>
                  <strong>Nivel de Riesgo:</strong> {selectedEquipment.nivelRiesgo || "N/A"}
                </div>
                <div className="col-span-2">
                  <strong>Nombre del Proveedor:</strong> {selectedEquipment.proveedorNombre || "N/A"}
                </div>
                <div className="col-span-2">
                  <strong>Dirección del Proveedor:</strong> {selectedEquipment.proveedorDireccion || "N/A"}
                </div>
                <div className="col-span-2">
                  <strong>Teléfono del Proveedor:</strong> {selectedEquipment.proveedorTelefono || "N/A"}
                </div>
                <div className="col-span-2">
                  <strong>Observaciones:</strong> {selectedEquipment.observaciones || "N/A"}
                </div>
                <div>
                  <strong>Manual de Usuario:</strong> {selectedEquipment.manualUsuario ? "Sí" : "No"}
                </div>
                <div>
                  <strong>Manual de Servicio:</strong> {selectedEquipment.manualServicio ? "Sí" : "No"}
                </div>
              </div>

              {/* Task History - REMOVED */}
              {/* Historial de Tareas section has been removed */}

              {/* Documents */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium">Documentos Asociados</h3>
                  <Button size="sm" variant="outline" onClick={() => document.getElementById("fileInput")?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Archivo
                  </Button>
                  <input
                    id="fileInput"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                </div>
                <div className="space-y-2">
                  {(selectedEquipment.documentos || []).length > 0 ? (
                    (selectedEquipment.documentos || []).map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span>{doc.nombre || "N/A"}</span>
                          <Badge variant="outline">{doc.tipo || "N/A"}</Badge>
                          {doc.fechaSubida && <span className="text-xs text-gray-500">({doc.fechaSubida})</span>}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocument(doc)}
                            title="Ver documento"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadDocument(doc)}
                            title="Descargar documento"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 bg-transparent"
                            onClick={() => doc.id && handleDeleteDocument(doc.id, index)}
                            title="Eliminar documento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No hay documentos asociados.</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleEditEquipment(selectedEquipment)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modificar
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleDeleteEquipment(selectedEquipment.id)}
                    disabled={
                      equipmentLoading ||
                      equipmentAssociations[selectedEquipment?.id]?.hasMaintenances ||
                      equipmentAssociations[selectedEquipment?.id]?.hasWorkOrders
                    }
                    title={
                      equipmentAssociations[selectedEquipment?.id]?.hasMaintenances ||
                      equipmentAssociations[selectedEquipment?.id]?.hasWorkOrders
                        ? "No se puede eliminar. Este equipo tiene mantenimientos u órdenes de trabajo asociadas."
                        : undefined
                    }
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {equipmentLoading ? "Eliminando..." : "Eliminar"}
                  </Button>
                </div>
                <Button
                  onClick={() => handleGenerateEquipmentTechnicalSheet(selectedEquipment)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generar Ficha Técnica
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )

  const renderUsuarios = () => {
    // Apply filters first
    const filteredUsers = users.filter((user) => {
      const matchRol = userFilters.rol === "all" || user.rol === userFilters.rol
      const matchEstado = userFilters.estado === "all" || user.estado === userFilters.estado
      return matchRol && matchEstado
    })

    // Calculate pagination values
    const totalUsers = filteredUsers.length
    const totalPages = Math.ceil(totalUsers / usersPerPage)
    const startIndex = (usersPaginaActual - 1) * usersPerPage
    const endIndex = Math.min(startIndex + usersPerPage, totalUsers)
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

    // The useEffect for users pagination is now at the top level.

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
  <h1 className="text-3xl font-bold">{""}</h1>
  <Button 
    onClick={() => {
      // Clean everything when opening for a new user
      setEditingUser(null)
      setNewUser({ estado: "Activo", contrasena: "" })
      setUserFormErrors({})
      setShowUserForm(true)
    }} 
    className="bg-green-600 hover:bg-green-700"
  >
  <Plus className="h-4 w-4 mr-2" />
  Nuevo Usuario
  </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtros:</span>
              </div>
              <Select value={userFilters.rol} onValueChange={(value) => setUserFilters({ ...userFilters, rol: value })}>
                <SelectTrigger className="w-36 min-w-32">
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="Técnico">Técnico</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={userFilters.estado}
                onValueChange={(value) => setUserFilters({ ...userFilters, estado: value })}
              >
                <SelectTrigger className="w-36 min-w-32">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setUserFilters({ rol: "all", estado: "all" })}>
                <Search className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Mostrar</span>
                <Select
                  value={usersPerPage.toString()}
                  onValueChange={(value) => {
                    setUsersPerPage(Number(value))
                    setUsersPaginaActual(1)
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">registros</span>
              </div>
            </div>

            {/* Users Table */}
            {usersLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-gray-600">Cargando usuarios...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-700">ID Usuario</th>
                      <th className="text-left p-3 font-medium text-gray-700">Nombre</th>
                      <th className="text-left p-3 font-medium text-gray-700">Correo</th>
                      <th className="text-left p-3 font-medium text-gray-700">Rol</th>
                      <th className="text-left p-3 font-medium text-gray-700">Estado</th>
                      <th className="text-left p-3 font-medium text-gray-700">Fecha Creación</th>
                      <th className="text-left p-3 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 text-sm">{user.id}</td>
                        <td className="p-3 text-sm font-medium">{user.nombre}</td>
                        <td className="p-3 text-sm text-gray-600">{user.correo}</td>
                        <td className="p-3 text-sm">
                          <Badge
                            className={`rounded-md px-2 py-1 ${
                              user.rol === "Administrador"
                                ? "bg-blue-100 text-blue-800"
                                : user.rol === "Supervisor"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.rol}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          <Badge
                            className={`rounded-md px-2 py-1 ${
                              user.estado === "Activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.estado}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-600">{formatDate(user.fecha_creacion)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    const details = await fetchUsuarioDetails(user.id)
                                    setSelectedUser(details || user)
                                    setShowUserDetails(true)
                                    setUserActivity(null)
                                    setLoadingUserActivity(true)

                                    try {
                                      const token = localStorage.getItem("authToken")
                                      if (token) {
                                        const activity = await getUserActivity(user.id, token)
                                        setUserActivity(activity)
                                      }
                                    } catch (error) {
                                      console.error("[v0] Error loading user activity:", error)
                                    } finally {
                                      setLoadingUserActivity(false)
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver detalles</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
              onClick={() => {
                // Set editing user - useEffect will handle syncing to newUser
                setEditingUser(user)
                setShowUserForm(true)
              }}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const newEstado = user.estado === "Activo" ? "Inactivo" : "Activo"
                                      const result = await toggleUserStatus(user.id, newEstado)

                                      if (result?.success) {
                                        toast({
                                          title: "Estado actualizado",
                                          description: `El usuario ${user.nombre} ha sido marcado como ${newEstado}`,
                                        })
                                        await loadUsers()
                                      } else {
                                        toast({
                                          title: "Error",
                                          description: result?.error || "No se pudo actualizar el estado del usuario",
                                          variant: "destructive",
                                        })
                                      }
                                    } catch (error) {
                                      console.error("[v0] Toggle exception", { error })
                                      toast({
                                        title: "Error",
                                        description: "Ocurrió un error al cambiar el estado",
                                        variant: "destructive",
                                      })
                                    }
                                  }}
                                  className={
                                    user.estado === "Activo"
                                      ? "text-orange-600 hover:text-orange-700"
                                      : "text-green-600 hover:text-green-700"
                                  }
                                >
                                  {user.estado === "Activo" ? (
                                    <UserX className="h-4 w-4" />
                                  ) : (
                                    <UserCheck className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{user.estado === "Activo" ? "Desactivar" : "Activar"}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    setSelectedUserToDelete(user.id)
                                    setIsDeleteUserDialogOpen(true)
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Eliminar</TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between mt-6">
              <span className="text-sm text-gray-600">
                Mostrando {startIndex + 1} a {endIndex} de {totalUsers} registros
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={usersPaginaActual === 1}
                  onClick={() => setUsersPaginaActual(usersPaginaActual - 1)}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (usersPaginaActual <= 3) {
                      pageNum = i + 1
                    } else if (usersPaginaActual >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = usersPaginaActual - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === usersPaginaActual ? "default" : "outline"}
                        size="sm"
                        onClick={() => setUsersPaginaActual(pageNum)}
                        className={pageNum === usersPaginaActual ? "bg-blue-600 text-white" : ""}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={usersPaginaActual === totalPages}
                  onClick={() => setUsersPaginaActual(usersPaginaActual + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Form Modal */}
        <Dialog 
          open={showUserForm} 
          onOpenChange={(open) => {
            setShowUserForm(open)
            if (!open) {
              // Clean up state when dialog closes
              setTimeout(() => {
                setEditingUser(null)
                setNewUser({ estado: "Activo" })
                setUserFormErrors({})
              }, 0)
            } else if (open && !editingUser) {
              // When opening for a new user, clear any previous state
              setNewUser({ estado: "Activo" })
              setUserFormErrors({})
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={newUser.nombre || ""}
                  onChange={(e) => {
                    setNewUser({ ...newUser, nombre: e.target.value })
                    setUserFormErrors({ ...userFormErrors, nombre: "" })
                  }}
                  placeholder="Nombre completo"
                  required
                />
                {userFormErrors.nombre && <p className="text-red-500 text-xs">{userFormErrors.nombre}</p>}
              </div>
              <div>
                <Label htmlFor="correo">Correo *</Label>
                <Input
                  id="correo"
                  type="email"
                  value={newUser.email || ""}
                  onChange={(e) => {
                    setNewUser({ ...newUser, email: e.target.value })
                    setUserFormErrors({ ...userFormErrors, email: "" })
                  }}
                  placeholder="correo@hospital.com"
                  required
                />
                {userFormErrors.email && <p className="text-red-500 text-xs">{userFormErrors.email}</p>}
              </div>
              {!editingUser && (
                <div className="md:col-span-2">
                  <Label htmlFor="contrasena">Contraseña *</Label>
                  <Input
                    id="contrasena"
                    type="password"
                    value={newUser.contrasena || ""}
                    onChange={(e) => {
                      setNewUser({ ...newUser, contrasena: e.target.value })
                      setUserFormErrors({ ...userFormErrors, contrasena: "" })
                    }}
                    placeholder="Mínimo 6 caracteres"
                    required={!editingUser}
                  />
                  {userFormErrors.contrasena && <p className="text-red-500 text-xs">{userFormErrors.contrasena}</p>}
                </div>
              )}
              <div>
                <Label htmlFor="rol">Rol *</Label>
                <Select
                  value={newUser.rol || ""}
                  onValueChange={(value) => {
                    const rol = value as Usuario["rol"]
                    setNewUser({ ...newUser, rol })
                    setUserFormErrors({ ...userFormErrors, rol: "" })

                    // Map rol values to permission keys
                    const roleMap: Record<string, "administrador" | "supervisor" | "tecnico"> = {
                      Administrador: "administrador",
                      Supervisor: "supervisor",
                      Técnico: "tecnico",
                    }

                    const roleKey = roleMap[rol]
                    if (roleKey && DEFAULT_PERMISSIONS_BY_ROLE[roleKey]) {
                      setUserPermissions(DEFAULT_PERMISSIONS_BY_ROLE[roleKey])
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Técnico">Técnico</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                {userFormErrors.rol && <p className="text-red-500 text-xs">{userFormErrors.rol}</p>}
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={newUser.estado || "Activo"}
                  onValueChange={(value) => setNewUser({ ...newUser, estado: value as Usuario["estado"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {userFormErrors.general && <p className="text-red-500 text-xs">{userFormErrors.general}</p>}
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUserForm(false)
                  setEditingUser(null)
                  setNewUser({ estado: "Activo" })
                  setUserFormErrors({})
                }}
                disabled={usersLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  // Validate required fields
                  if (!newUser.nombre || !newUser.email || !newUser.rol) {
                    setUserFormErrors({ ...userFormErrors, general: "Por favor complete los campos requeridos." })
                    return
                  }

                  // For new users, password is required
                  if (!editingUser) {
                    if (!newUser.contrasena || newUser.contrasena.trim() === "") {
                      setUserFormErrors({
                        ...userFormErrors,
                        contrasena: "La contraseña es obligatoria para nuevos usuarios",
                      })
                      return
                    }

                    if (newUser.contrasena.length < 6) {
                      setUserFormErrors({
                        ...userFormErrors,
                        contrasena: "La contraseña debe tener al menos 6 caracteres",
                      })
                      return
                    }
                  } else {
                    // For editing users, password is optional but if provided, must be at least 6 chars
                    if (newUser.contrasena && newUser.contrasena.length > 0 && newUser.contrasena.length < 6) {
                      setUserFormErrors({
                        ...userFormErrors,
                        contrasena: "La contraseña debe tener al menos 6 caracteres",
                      })
                      return
                    }
                  }

                  setUsersLoading(true)
                  // Map contrasena to password for the API
                  const usuarioData = {
                    ...newUser,
                    password: newUser.contrasena,
                    contrasena: undefined, // Remove the frontend field
                  }
                  const result = await saveUsuario(usuarioData)

                  if (result.success) {
                    alert("Usuario guardado exitosamente")
                    setShowUserForm(false)
                    setEditingUser(null)
                    setNewUser({ estado: "Activo" })
                    await loadUsers()
                  } else {
                    setUserFormErrors({ general: result.error || "Error al guardar usuario" })
                  }
                  setUsersLoading(false)
                }}
                disabled={usersLoading}
              >
                {usersLoading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* User Details Modal */}
        <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Usuario - {selectedUser?.nombre || "Cargando..."}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">ID Usuario</Label>
                  <p className="text-sm font-medium">{selectedUser?.id || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Nombre</Label>
                  <p className="text-sm font-medium">{selectedUser?.nombre || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Correo</Label>
                  <p className="text-sm">{selectedUser?.email || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Rol</Label>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      selectedUser?.rol === "Administrador"
                        ? "bg-blue-100 text-blue-800"
                        : selectedUser?.rol === "Supervisor"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedUser?.rol || "N/A"}
                  </span>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Estado</Label>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      selectedUser?.estado === "Activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedUser?.estado || "N/A"}
                  </span>
                </div>
              </div>

              {/* Permissions Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium">Permisos</h3>
                  {userRole === "administrador" && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        setEditingPermissions(selectedUser)
                        if (selectedUser?.permissions && Object.keys(selectedUser.permissions).length > 0) {
                          setUserPermissions({
                            gestionEquipos: selectedUser.permissions.gestionEquipos ?? false,
                            gestionUsuarios: selectedUser.permissions.gestionUsuarios ?? false,
                            ordenesTrabajoCrear: selectedUser.permissions.ordenesTrabajoCrear ?? false,
                            ordenesTrabajoAsignar: selectedUser.permissions.ordenesTrabajoAsignar ?? false,
                            ordenesTrabajoEjecutar: selectedUser.permissions.ordenesTrabajoEjecutar ?? false,
                            mantenimientoPreventivo: selectedUser.permissions.mantenimientoPreventivo ?? false,
                            reportesGenerar: selectedUser.permissions.reportesGenerar ?? false,
                            reportesVer: selectedUser.permissions.reportesVer ?? false,
                            logsAcceso: selectedUser.permissions.logsAcceso ?? false,
                            configuracionSistema: selectedUser.permissions.configuracionSistema ?? false,
                          })
                        } else {
                          const roleKey = selectedUser?.rol?.toLowerCase() as RoleType | undefined
                          if (roleKey && DEFAULT_PERMISSIONS_BY_ROLE[roleKey]) {
                            setUserPermissions(DEFAULT_PERMISSIONS_BY_ROLE[roleKey])
                          }
                        }
                        setShowPermissionsDialog(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Permisos
                    </Button>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {(() => {
                    const perms =
                      selectedUser?.permissions && Object.keys(selectedUser.permissions).length > 0
                        ? selectedUser.permissions
                        : selectedUser?.rol
                          ? DEFAULT_PERMISSIONS_BY_ROLE[selectedUser.rol.toLowerCase() as RoleType]
                          : DEFAULT_PERMISSIONS_BY_ROLE.tecnico

                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Gestión de Equipos</span>
                          <span
                            className={`text-sm font-medium ${perms?.gestionEquipos ? "text-green-600" : "text-red-600"}`}
                          >
                            {perms?.gestionEquipos ? "Sí" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Gestión de Usuarios</span>
                          <span
                            className={`text-sm font-medium ${perms?.gestionUsuarios ? "text-green-600" : "text-red-600"}`}
                          >
                            {perms?.gestionUsuarios ? "Sí" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Crear Órdenes de Trabajo</span>
                          <span
                            className={`text-sm font-medium ${perms?.ordenesTrabajoCrear ? "text-green-600" : "text-red-600"}`}
                          >
                            {perms?.ordenesTrabajoCrear ? "Sí" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Asignar Órdenes de Trabajo</span>
                          <span
                            className={`text-sm font-medium ${perms?.ordenesTrabajoAsignar ? "text-green-600" : "text-red-600"}`}
                          >
                            {perms?.ordenesTrabajoAsignar ? "Sí" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Mantenimiento Preventivo</span>
                          <span
                            className={`text-sm font-medium ${perms?.mantenimientoPreventivo ? "text-green-600" : "text-red-600"}`}
                          >
                            {perms?.mantenimientoPreventivo ? "Sí" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Generar Reportes</span>
                          <span
                            className={`text-sm font-medium ${perms?.reportesGenerar ? "text-green-600" : "text-red-600"}`}
                          >
                            {perms?.reportesGenerar ? "Sí" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Acceso a Logs</span>
                          <span
                            className={`text-sm font-medium ${perms?.logsAcceso ? "text-green-600" : "text-red-600"}`}
                          >
                            {perms?.logsAcceso ? "Sí" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Configuración del Sistema</span>
                          <span
                            className={`text-sm font-medium ${perms?.configuracionSistema ? "text-green-600" : "text-red-600"}`}
                          >
                            {perms?.configuracionSistema ? "Sí" : "No"}
                          </span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Activity Section */}
              <div>
                <h3 className="text-lg font-medium mb-3">Actividades Recientes</h3>
                {loadingUserActivity ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Cargando actividad...</p>
                  </div>
                ) : userActivity ? (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Último acceso:</p>
                      <p className="text-sm text-gray-600">{userActivity.ultimo_acceso || "Sin registro"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Órdenes de trabajo creadas:</p>
                      <p className="text-sm text-gray-600">{userActivity.ordenes_creadas}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Órdenes de trabajo asignadas:</p>
                      <p className="text-sm text-gray-600">{userActivity.ordenes_asignadas}</p>
                    </div>

                    {userActivity.actividades_recientes.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Últimas actividades:</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {userActivity.actividades_recientes.map((actividad: any) => (
                            <div key={actividad.id} className="bg-white p-2 rounded border border-gray-200">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900">{actividad.accion}</p>
                                  <p className="text-xs text-gray-600 truncate">{actividad.descripcion}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">{actividad.modulo}</span>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500">{actividad.timestamp}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">No se pudo cargar la actividad del usuario.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  setEditingUser(selectedUser)
                  setShowUserDetails(false)
                  setShowUserForm(true)
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modificar
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => {
                  // alert("Función de resetear contraseña implementada")
                  setResetPasswordUser(selectedUser)
                  setShowResetPassword(true)
                }}
              >
                <Key className="h-4 w-4 mr-2" />
                Resetear Contraseña
              </Button>
              <Button variant="outline" onClick={() => setShowUserDetails(false)}>
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Permissions Dialog */}
        <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Permisos - {editingPermissions?.nombre}</DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                Rol: <span className="font-medium">{editingPermissions?.rol}</span>
              </p>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Gestión de Equipos</Label>
                  <p className="text-xs text-gray-600">Ver, crear, editar y eliminar equipos</p>
                </div>
                <input
                  type="checkbox"
                  checked={userPermissions.gestionEquipos}
                  onChange={(e) => setUserPermissions({ ...userPermissions, gestionEquipos: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Gestión de Usuarios</Label>
                  <p className="text-xs text-gray-600">Crear, editar y eliminar usuarios del sistema</p>
                </div>
                <input
                  type="checkbox"
                  checked={userPermissions.gestionUsuarios}
                  onChange={(e) => setUserPermissions({ ...userPermissions, gestionUsuarios: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Crear Órdenes de Trabajo</Label>
                  <p className="text-xs text-gray-600">Crear nuevas órdenes de trabajo</p>
                </div>
                <input
                  type="checkbox"
                  checked={userPermissions.ordenesTrabajoCrear}
                  onChange={(e) => setUserPermissions({ ...userPermissions, ordenesTrabajoCrear: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Asignar Órdenes de Trabajo</Label>
                  <p className="text-xs text-gray-600">Asignar órdenes a técnicos</p>
                </div>
                <input
                  type="checkbox"
                  checked={userPermissions.ordenesTrabajoAsignar}
                  onChange={(e) => setUserPermissions({ ...userPermissions, ordenesTrabajoAsignar: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Mantenimiento Preventivo</Label>
                  <p className="text-xs text-gray-600">Programar y ejecutar mantenimientos preventivos</p>
                </div>
                <input
                  type="checkbox"
                  checked={userPermissions.mantenimientoPreventivo}
                  onChange={(e) =>
                    setUserPermissions({ ...userPermissions, mantenimientoPreventivo: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Generar Reportes</Label>
                  <p className="text-xs text-gray-600">Crear y exportar reportes del sistema</p>
                </div>
                <input
                  type="checkbox"
                  checked={userPermissions.reportesGenerar}
                  onChange={(e) => setUserPermissions({ ...userPermissions, reportesGenerar: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Acceso a Logs</Label>
                  <p className="text-xs text-gray-600">Ver registros de auditoría del sistema</p>
                </div>
                <input
                  type="checkbox"
                  checked={userPermissions.logsAcceso}
                  onChange={(e) => setUserPermissions({ ...userPermissions, logsAcceso: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Configuración del Sistema</Label>
                  <p className="text-xs text-gray-600">Modificar configuraciones globales</p>
                </div>
                <input
                  type="checkbox"
                  checked={userPermissions.configuracionSistema}
                  onChange={(e) => setUserPermissions({ ...userPermissions, configuracionSistema: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (!editingPermissions) return

                  setUsersLoading(true)
                  const result = await updatePermissions(editingPermissions.id, userPermissions)

                  if (result.success) {
                    await loadUsers()
                    if (selectedUser?.id === editingPermissions.id) {
                      setSelectedUser({ ...selectedUser, permissions: userPermissions })
                    }
                    setShowPermissionsDialog(false)
                    alert("Permisos actualizados correctamente")
                  } else {
                    alert(result.error || "Error al actualizar permisos")
                  }
                  setUsersLoading(false)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={usersLoading}
              >
                {usersLoading ? "Guardando..." : "Guardar Permisos"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Restablecer Contraseña</DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                Usuario: <span className="font-medium">{resetPasswordUser?.nombre}</span>
              </p>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setPasswordError("")
                  }}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setPasswordError("")
                  }}
                  placeholder="Repita la contraseña"
                />
              </div>
              {passwordError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetPassword(false)
                  setResetPasswordUser(null)
                  setNewPassword("")
                  setConfirmPassword("")
                  setPasswordError("")
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (!newPassword || newPassword.length < 6) {
                    setPasswordError("La contraseña debe tener al menos 6 caracteres")
                    return
                  }

                  if (newPassword !== confirmPassword) {
                    setPasswordError("Las contraseñas no coinciden")
                    return
                  }

                  if (!resetPasswordUser) return

                  const result = await resetPassword(resetPasswordUser.id, newPassword)

                  if (result.success) {
                    alert("Contraseña restablecida exitosamente")
                    setShowResetPassword(false)
                    setResetPasswordUser(null)
                    setNewPassword("")
                    setConfirmPassword("")
                    setPasswordError("")
                  } else {
                    setPasswordError(result.error || "Error al restablecer la contraseña")
                  }
                }}
                disabled={usersLoading}
              >
                {usersLoading ? "Restableciendo..." : "Restablecer Contraseña"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // --- Maintenance Rendering Functions ---
  const isOverdue = (dateString: string | undefined): boolean => {
    if (!dateString) return false
    const today = new Date()
    const dueDate = new Date(dateString)
    return dueDate < today && dueDate.toDateString() !== today.toDateString() // Exclude today
  }

  const isUpcoming = (dateString: string | undefined): boolean => {
    if (!dateString) return false
    const today = new Date()
    const dueDate = new Date(dateString)
    const nextSevenDays = new Date(today)
    nextSevenDays.setDate(today.getDate() + 7)
    return dueDate >= today && dueDate <= nextSevenDays
  }

  const getMaintenanceStatusColor = (resultado: string | undefined) => {
    switch (resultado?.toLowerCase()) {
      case "completado":
        return "bg-green-100 text-green-800"
      case "pendiente":
        return "bg-yellow-100 text-yellow-800"
      case "vencido":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Helper functions for calendar view
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getMaintenanceForDate = (date: Date) => {
    return maintenanceSchedules.filter((m) => {
      const maintenanceDate = new Date(m.proximaFecha) // Use proximaFecha from Mantenimiento type
      return (
        maintenanceDate.getDate() === date.getDate() &&
        maintenanceDate.getMonth() === date.getMonth() &&
        maintenanceDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const getMaintenanceStatus = (maintenance: Mantenimiento) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maintenanceDate = new Date(maintenance.proximaFecha) // Use proximaFecha from Mantenimiento type
    maintenanceDate.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (maintenance.resultado === "Completado") return "completed"
    if (diffDays < 0) return "overdue"
    if (diffDays <= 7) return "upcoming"
    return "scheduled"
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const monthName = currentMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-24 border border-gray-200 bg-gray-50" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const maintenances = getMaintenanceForDate(date)
      const isToday =
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear()

      days.push(
        <div
          key={day}
          className={`min-h-24 border border-gray-200 p-2 bg-white hover:bg-gray-50 transition-colors ${
            isToday ? "bg-blue-50 border-blue-300" : ""
          }`}
        >
          <div className={`text-sm font-semibold mb-2 ${isToday ? "text-blue-600" : "text-gray-700"}`}>{day}</div>
          <div className="space-y-1">
            {maintenances.slice(0, 3).map((maintenance) => {
              const status = getMaintenanceStatus(maintenance)
              const statusColors = {
                overdue: "bg-red-100 text-red-800 border border-red-200",
                upcoming: "bg-yellow-100 text-yellow-800 border border-yellow-200",
                completed: "bg-green-100 text-green-800 border border-green-200",
                scheduled: "bg-blue-100 text-blue-800 border border-blue-200",
              }

              return (
                <button
                  key={maintenance.id}
                  onClick={() => {
                    setSelectedMaintenance(maintenance)
                    setShowMaintenanceDetails(true)
                  }}
                  className={`w-full text-left text-xs p-1 rounded border ${statusColors[status]} hover:opacity-80 transition-opacity truncate`}
                >
                  {maintenance.equipo || `Equipo #${maintenance.equipoId}`}
                </button>
              )
            })}
            {maintenances.length > 3 && (
              <div className="text-xs text-gray-500 pl-1">+{maintenances.length - 3} más</div>
            )}
          </div>
        </div>,
      )
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold capitalize">{monthName}</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoy
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded" />
            <span className="text-gray-700">Vencido</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded" />
            <span className="text-gray-700">Próximo (7 días)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded" />
            <span className="text-gray-700">Completado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded" />
            <span className="text-gray-700">Programado</span>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-0 mb-0">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
            <div key={day} className="text-center font-semibold text-gray-700 py-2 bg-gray-100 border border-gray-200">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0">{days}</div>

        <div className="mt-4 text-sm text-gray-600">
          Mostrando {maintenanceSchedules.length} de {maintenanceSchedules.length} mantenimientos programados
        </div>
      </div>
    )
  }

  const renderMantenimiento = () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{""}</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
            <Button
              variant={!calendarView ? "default" : "outline"}
              size="sm"
              onClick={() => setCalendarView(false)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Lista
            </Button>
            <Button
              variant={calendarView ? "default" : "outline"}
              size="sm"
              onClick={() => setCalendarView(true)}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Calendario
            </Button>
          </div>
          <Button
            onClick={() => {
              setShowMaintenanceForm(true)
              setSelectedMaintenance(null)
              setMaintenanceForm({ resultado: "pendiente" })
              if (users.length === 0) {
                const loadUsers = async () => {
                  try {
                    const response = await fetchUsuarios({ per_page: 1000, estado: "activo" })
                    setUsers(response.data)
                  } catch (error) {
                    console.error("Error loading users for maintenance form:", error)
                  }
                }
                loadUsers()
              }
            }}
          >
            Nuevo Mantenimiento
          </Button>
        </div>
      </div>

      {/* Maintenance Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Vencidos</p>
              <p className="text-3xl font-bold">{maintenanceStats.vencidos}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Próximos (7 días)</p>
              <p className="text-3xl font-bold">{maintenanceStats.proximos}</p>
            </div>
            <Bell className="h-8 w-8 text-yellow-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completados</p>
              <p className="text-3xl font-bold">{maintenanceStats.completados}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Programados</p>
              <p className="text-3xl font-bold">{maintenanceStats.total}</p>
            </div>
            <Wrench className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Mantenimientos Programados</h3>
            <div className="flex items-center gap-4">
              <Select
                value={maintenanceFilters.tipo}
                onValueChange={(value) => setMaintenanceFilters({ ...maintenanceFilters, tipo: value })}
              >
                <SelectTrigger className="w-36 min-w-32">
                  <SelectValue placeholder="Tipo de Mantenimiento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="calibracion">Calibración</SelectItem>
                  <SelectItem value="inspeccion">Inspección</SelectItem>
                  <SelectItem value="limpieza">Limpieza</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={maintenanceFilters.frecuencia}
                onValueChange={(value) => setMaintenanceFilters({ ...maintenanceFilters, frecuencia: value })}
              >
                <SelectTrigger className="w-36 min-w-32">
                  <SelectValue placeholder="Frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las frecuencias</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMaintenanceFilters({ tipo: "all", frecuencia: "all" })}
              >
                Limpiar
              </Button>
            </div>
          </div>
          {maintenanceLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-gray-600">Cargando mantenimientos...</p>
            </div>
          ) : calendarView ? (
            renderCalendar()
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Nombre Equipo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Frecuencia</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Próxima Fecha</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Resultado</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Observaciones</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {maintenanceSchedules.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{m.equipo || "N/A"}</td>
                      <td className="px-4 py-2">{m.tipo || "N/A"}</td>
                      <td className="px-4 py-2">{m.frecuencia || "N/A"}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`p-1 rounded-lg ${isOverdue(m.proximaFecha) ? "bg-red-100 text-red-800 border border-red-200" : isUpcoming(m.proximaFecha) ? "bg-yellow-100 text-yellow-800 border border-yellow-200" : "bg-green-100 text-green-800 border border-green-200"}`}
                        >
                          {formatDate(m.proximaFecha)}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <Badge className={`${getMaintenanceStatusColor(m.resultado)}`}>{m.resultado || "N/A"}</Badge>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate" title={m.observaciones}>
                        {m.observaciones || "N/A"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedMaintenance(m)
                                  setShowMaintenanceDetails(true)
                                }}
                              >
                                {/* CHANGE: Added blue color to Eye icon */}
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver detalles</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => handleEditMaintenance(m)}>
                                {/* CHANGE: Added amber/orange color to Modificar button */}
                                <Edit className="h-4 w-4 text-amber-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 bg-transparent"
                                onClick={() => handleDeleteMaintenance(m.id)}
                                disabled={m.programada_orden_generada}
                              >
                                {/* CHANGE: Trash icon already inherits red color from parent className */}
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {m.programada_orden_generada
                                ? "No se puede eliminar: mantenimiento ya programado/orden generada"
                                : "Eliminar"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Form Modal */}
      <Dialog
        open={showMaintenanceForm}
        onOpenChange={(isOpen) => {
          setShowMaintenanceForm(isOpen)
          if (!isOpen) resetMaintenanceForm()
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMaintenance ? "Editar Mantenimiento" : "Programar Nuevo Mantenimiento"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="equipoId">Equipo *</Label>
              <EquipmentCombobox
                equipment={equipment}
                value={maintenanceForm.equipoId?.toString() || ""}
                onValueChange={(value) => {
                  const selectedEquipo = equipment.find((eq) => eq.id.toString() === value)
                  setMaintenanceForm({
                    ...maintenanceForm,
                    equipoId: Number.parseInt(value),
                    equipo: selectedEquipo?.nombre,
                  })
                  setMaintenanceFormErrors({ ...maintenanceFormErrors, equipoId: "" })
                }}
                error={!!maintenanceFormErrors.equipoId}
              />
              {maintenanceFormErrors.equipoId && (
                <p className="text-red-500 text-xs">{maintenanceFormErrors.equipoId}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Mantenimiento *</Label>
              <Select
                value={maintenanceForm.tipo || ""}
                onValueChange={(value) => {
                  setMaintenanceForm({ ...maintenanceForm, tipo: value })
                  setMaintenanceFormErrors({ ...maintenanceFormErrors, tipo: "" })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calibracion">Calibración</SelectItem>
                  <SelectItem value="inspeccion">Inspección</SelectItem>
                  <SelectItem value="limpieza">Limpieza</SelectItem>
                </SelectContent>
              </Select>
              {maintenanceFormErrors.tipo && <p className="text-red-500 text-xs">{maintenanceFormErrors.tipo}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="frecuencia">Frecuencia *</Label>
              <Select
                value={maintenanceForm.frecuencia || ""}
                onValueChange={(value) => {
                  setMaintenanceForm({ ...maintenanceForm, frecuencia: value })
                  setMaintenanceFormErrors({ ...maintenanceFormErrors, frecuencia: "" })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
              {maintenanceFormErrors.frecuencia && (
                <p className="text-red-500 text-xs">{maintenanceFormErrors.frecuencia}</p>
              )}
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="tecnicoAsignado">Técnico Asignado</Label>
              <Select
                value={maintenanceForm.tecnicoAsignadoId?.toString() || ""}
                onValueChange={(value) => {
                  const selectedTech = users.find((u) => u.id.toString() === value)
                  setMaintenanceForm({
                    ...maintenanceForm,
                    tecnicoAsignadoId: value ? Number.parseInt(value) : undefined,
                    tecnicoAsignado: selectedTech?.nombre,
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar técnico (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sin asignar</SelectItem>
                  {users
                    .filter((u) => {
                      const rolLower = u.rol?.toLowerCase() || ""
                      const rolMatch =
                        rolLower === "técnico" ||
                        rolLower === "tecnico" ||
                        rolLower === "supervisor" ||
                        rolLower === "administrador"
                      const estadoMatch = u.estado?.toLowerCase() === "activo"
                      return rolMatch && estadoMatch
                    })
                    .map((tech) => (
                      <SelectItem key={tech.id} value={tech.id.toString()}>
                        {tech.nombre} ({tech.rol})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {/* </CHANGE> */}
            <div className="space-y-2">
              <Label htmlFor="proximaFecha">Próxima Fecha *</Label>
              <Input
                id="proximaFecha"
                type="date"
                value={maintenanceForm.proximaFecha || ""}
                onChange={(e) => {
                  setMaintenanceForm({ ...maintenanceForm, proximaFecha: e.target.value })
                  setMaintenanceFormErrors({ ...maintenanceFormErrors, proximaFecha: "" })
                }}
              />
              {maintenanceFormErrors.proximaFecha && (
                <p className="text-red-500 text-xs">{maintenanceFormErrors.proximaFecha}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ultimaFecha">Última Fecha</Label>
              <Input
                id="ultimaFecha"
                type="date"
                value={maintenanceForm.ultimaFecha || ""}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, ultimaFecha: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resultado">Resultado</Label>
              <Select
                value={maintenanceForm.resultado || ""}
                onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, resultado: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="observaciones">Observaciones *</Label>
              <Input
                id="observaciones"
                value={maintenanceForm.observaciones || ""}
                onChange={(e) => {
                  setMaintenanceForm({ ...maintenanceForm, observaciones: e.target.value })
                  setMaintenanceFormErrors({ ...maintenanceFormErrors, observaciones: "" })
                }}
                placeholder="Detalles adicionales..."
              />
              {maintenanceFormErrors.observaciones && (
                <p className="text-red-500 text-xs">{maintenanceFormErrors.observaciones}</p>
              )}
            </div>
          </div>
          {maintenanceFormErrors.general && <p className="text-red-500 text-xs">{maintenanceFormErrors.general}</p>}
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowMaintenanceForm(false)
                resetMaintenanceForm()
              }}
              disabled={maintenanceLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveMaintenanceSchedule} disabled={maintenanceLoading}>
              {maintenanceLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Maintenance Details Dialog */}
      <Dialog open={showMaintenanceDetails} onOpenChange={setShowMaintenanceDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Mantenimiento - {selectedMaintenance?.equipo || "Cargando..."}</DialogTitle>
          </DialogHeader>
          {selectedMaintenance && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <strong>ID:</strong> {selectedMaintenance.id || "N/A"}
                </div>
                <div>
                  <strong>Equipo:</strong> {selectedMaintenance.equipo || "N/A"}
                </div>
                <div>
                  <strong>Tipo:</strong> {selectedMaintenance.tipo || "N/A"}
                </div>
                <div>
                  <strong>Frecuencia:</strong> {selectedMaintenance.frecuencia || "N/A"}
                </div>
                <div>
                  <strong>Técnico Asignado:</strong> {selectedMaintenance.responsableNombre || "Sin asignar"}
                </div>
                <div>
                  <strong>Próxima Fecha:</strong>
                  <span
                    className={`ml-2 p-1 rounded-lg ${isOverdue(selectedMaintenance.proximaFecha) ? "bg-red-100 text-red-800 border border-red-200" : isUpcoming(selectedMaintenance.proximaFecha) ? "bg-yellow-100 text-yellow-800 border border-yellow-200" : "bg-green-100 text-green-800 border border-green-200"}`}
                  >
                    {formatDate(selectedMaintenance.proximaFecha)}
                  </span>
                </div>
                <div>
                  <strong>Última Fecha:</strong> {formatDate(selectedMaintenance.ultimaFecha)}
                </div>
                <div>
                  <strong>Resultado:</strong>
                  <Badge className={`ml-2 ${getMaintenanceStatusColor(selectedMaintenance.resultado)}`}>
                    {selectedMaintenance.resultado || "N/A"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Observaciones</h3>
                <p className="text-sm text-gray-700">{selectedMaintenance.observaciones || "Sin observaciones."}</p>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleEditMaintenance(selectedMaintenance)}
                  className="text-amber-600 hover:bg-amber-50 border-amber-300"
                >
                  <Edit className="h-4 w-4 mr-2 text-amber-600" />
                  Modificar
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 border-red-300 bg-transparent"
                  onClick={() => handleDeleteMaintenance(selectedMaintenance.id)}
                  disabled={maintenanceLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {maintenanceLoading ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    try {
      let data: any[] | { equipos: any[]; mantenimientos: any[] } = []

      if (reportType === "equipos") {
        const response = await fetchEquipos({})
        data = response.data
      } else if (reportType === "mantenimientos") {
        // Ensure maintenanceSchedules is loaded and filtered correctly before passing
        await loadMaintenanceSchedules() // Reload just in case

        const enrichedData = await Promise.all(
          maintenanceSchedules.map(async (mant) => {
            try {
              // Find equipment in current equipment list
              const equipo = equipment.find((eq) => eq.id === mant.equipoId)
              return {
                ...mant,
                estadoEquipo: equipo?.estadoEquipo || equipo?.estado || "-",
              }
            } catch (error) {
              console.error("[v0] Error fetching equipment for maintenance:", error)
              return { ...mant, estadoEquipo: "-" }
            }
          }),
        )

        data = enrichedData
      } else if (reportType === "ordenes") {
        // Ensure workOrders is loaded and filtered correctly before passing
        await loadWorkOrders() // Reload just in case
        data = workOrders
      } else if (reportType === "cronograma") {
        const equiposResponse = await fetchEquipos({})
        await loadMaintenanceSchedules()

        data = {
          equipos: equiposResponse.data,
          mantenimientos: maintenanceSchedules,
        }
      }

      if (reportType !== "cronograma" && (reportFechaInicio || reportFechaFin)) {
        data = (data as any[]).filter((item) => {
          // Find the relevant date field in the item
          const itemDateString =
            item.proximaFecha || // For Mantenimientos
            item.fechaCreacion ||
            item.fecha_creacion || // For OrdenesTrabajo
            item.fechaInstalacion ||
            item.fecha_instalacion // For Equipos

          if (!itemDateString) return false // Skip if no date is found

          const itemDate = new Date(itemDateString)
          const inicio = reportFechaInicio ? new Date(reportFechaInicio) : new Date(0) // Start of epoch
          const fin = reportFechaFin ? new Date(reportFechaFin) : new Date() // Today

          // Ensure dates are valid before comparison
          if (isNaN(itemDate.getTime()) || isNaN(inicio.getTime()) || isNaN(fin.getTime())) return false

          return itemDate >= inicio && itemDate <= fin
        })
      }

      // CHANGE: Added await for PDF generation with logos
      const doc = await generatePDF({
        tipo: reportType,
        fechaInicio: reportFechaInicio,
        fechaFin: reportFechaFin,
        data,
      })

      // Download PDF
      const filename = `Reporte_${reportType}_${new Date().toISOString().split("T")[0]}.pdf`
      downloadPDF(doc, filename)

      toast({
        title: "PDF generado",
        description: "El reporte ha sido descargado correctamente",
      })
    } catch (error) {
      console.error("Error generating report:", error)
      alert("Error al generar el reporte. Por favor intente nuevamente.")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const renderReportes = () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div></div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Configuración del Reporte</h3>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="tipo-reporte" className="text-sm font-medium">
                Tipo de Reporte *
              </Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger id="tipo-reporte" className="w-full">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equipos">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      <span>Equipos Biomédicos</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="mantenimientos">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Mantenimientos Programados</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ordenes">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>Órdenes de Trabajo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cronograma">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Cronograma de Mantenimiento</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Seleccione el tipo de información que desea incluir en el reporte</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="fecha-inicio" className="text-sm font-medium">
                  Fecha Inicio
                </Label>
                <Input
                  id="fecha-inicio"
                  type="date"
                  value={reportFechaInicio}
                  onChange={(e) => setReportFechaInicio(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Opcional: Filtrar desde esta fecha</p>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="fecha-fin" className="text-sm font-medium">
                  Fecha Fin
                </Label>
                <Input
                  id="fecha-fin"
                  type="date"
                  value={reportFechaFin}
                  onChange={(e) => setReportFechaFin(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Opcional: Filtrar hasta esta fecha</p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generar Reporte PDF
                  </>
                )}
              </Button>

              <div className="flex-1" />

              <div className="text-sm text-gray-500">
                {reportType === "equipos" && `${equipment.length} equipos`}
                {reportType === "mantenimientos" && `${maintenanceSchedules.length} mantenimientos`}
                {reportType === "ordenes" && `${workOrders.length} órdenes`}
                {reportType === "cronograma" &&
                  `Equipos: ${equipment.length}, Mantenimientos: ${maintenanceSchedules.length}`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">Información del Reporte</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Los reportes se generan en formato PDF profesional</li>
                <li>• Incluyen tablas detalladas y estadísticas resumen</li>
                <li>• Los filtros de fecha son opcionales (sin fechas = todos los registros)</li>
                <li>• El archivo se descargará automáticamente al generarse</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const filteredLogs = filterLogs(auditLogs, logSearchTerm, logActionFilter)
  const totalPagesLogs = Math.ceil(filteredLogs.length / logsPerPage)
  const paginatedLogs = filteredLogs.slice((logCurrentPage - 1) * logsPerPage, logCurrentPage * logsPerPage)

  const renderAuditoria = () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Auditoría</h1>
          <p className="text-muted-foreground">Revisa los registros de actividad del sistema.</p>
        </div>
        <button
          onClick={loadAuditLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Actualizar
        </button>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Filtros</h3>
          <div className="grid gap-6">
            <div>
              <Label htmlFor="log-search" className="text-sm font-medium">
                Buscar
              </Label>
              <Input
                id="log-search"
                placeholder="Buscar por descripción, usuario o módulo..."
                value={logSearchTerm}
                onChange={(e) => {
                  setLogSearchTerm(e.target.value)
                  setLogCurrentPage(1)
                }}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="log-action-filter" className="text-sm font-medium">
                Filtrar por Acción
              </Label>
              <select
                id="log-action-filter"
                value={logActionFilter}
                onChange={(e) => {
                  setLogActionFilter(e.target.value)
                  setLogCurrentPage(1)
                }}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las acciones</option>
                <option value="Crear">Crear</option>
                <option value="Actualizar">Actualizar</option>
                <option value="Eliminar">Eliminar</option>
                <option value="Ver">Ver</option>
                <option value="Descargar">Descargar</option>
                <option value="Exportar">Exportar</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button
                onClick={loadAuditLogs}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Logs del Sistema</h3>
            <p className="text-sm text-muted-foreground">
              {filteredLogs.length} registro{filteredLogs.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Usuario</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Acción</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Módulo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Descripción</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{log.timestamp}</td>
                      <td className="px-4 py-3 text-sm">{log.usuario}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            log.accion === "Crear"
                              ? "bg-green-100 text-green-800"
                              : log.accion === "Actualizar"
                                ? "bg-blue-100 text-blue-800"
                                : log.accion === "Eliminar"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {log.accion}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{log.modulo}</td>
                      <td className="px-4 py-3 text-sm">{log.descripcion}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No hay registros que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPagesLogs > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Página {logCurrentPage} de {totalPagesLogs} ({filteredLogs.length} registros)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setLogCurrentPage(Math.max(1, logCurrentPage - 1))}
                  disabled={logCurrentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setLogCurrentPage(Math.min(totalPagesLogs, logCurrentPage + 1))}
                  disabled={logCurrentPage === totalPagesLogs}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // ADDED: Updated renderConfiguracion
  const renderConfiguracion = () => (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Configura las opciones del sistema</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Información del Hospital</h3>
          <div className="grid gap-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Logo del Hospital</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden">
                  {isMounted ? (
                    <img src={hospitalLogo || "/placeholder.svg"} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 animate-pulse rounded" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {/* Update logo upload input to use the new handler */}
                  <input type="file" accept="image/*" className="hidden" id="logo-upload" onChange={handleLogoChange} />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById("logo-upload")?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Logo
                  </Button>
                  <p className="text-xs text-gray-500">PNG, JPG hasta 2MB</p>
                </div>
              </div>
            </div>
            <div className="grid gap-2"></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Gestionar Ubicaciones</h3>
          <div className="grid gap-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nueva ubicación (ej: Cardiología)"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="flex-1 border rounded px-3 py-2 text-sm"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && newLocation.trim()) {
                    if (!configLocations.includes(newLocation.trim())) {
                      setConfigLocations([...configLocations, newLocation.trim()])
                      setNewLocation("")
                    }
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (newLocation.trim() && !configLocations.includes(newLocation.trim())) {
                    setConfigLocations([...configLocations, newLocation.trim()])
                    setNewLocation("")
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir
              </Button>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Ubicaciones Actuales</label>
              <div className="flex flex-wrap gap-2">
                {configLocations.map((location, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    <Building className="h-3 w-3" />
                    {location}
                    <button
                      onClick={() => {
                        setConfigLocations(configLocations.filter((_, i) => i !== index))
                      }}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Gestionar Fabricantes</h3>
          <div className="grid gap-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nuevo fabricante (ej: Hitachi)"
                value={newManufacturer}
                onChange={(e) => setNewManufacturer(e.target.value)}
                className="flex-1 border rounded px-3 py-2 text-sm"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && newManufacturer.trim()) {
                    if (!configManufacturers.includes(newManufacturer.trim())) {
                      setConfigManufacturers([...configManufacturers, newManufacturer.trim()])
                      setNewManufacturer("")
                    }
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (newManufacturer.trim() && !configManufacturers.includes(newManufacturer.trim())) {
                    setConfigManufacturers([...configManufacturers, newManufacturer.trim()])
                    setNewManufacturer("")
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir
              </Button>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Fabricantes Actuales</label>
              <div className="flex flex-wrap gap-2">
                {configManufacturers.map((manufacturer, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                  >
                    <Briefcase className="h-3 w-3" />
                    {manufacturer}
                    <button
                      onClick={() => {
                        setConfigManufacturers(configManufacturers.filter((_, i) => i !== index))
                      }}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-fit">
        <Save className="h-4 w-4 mr-2" />
        Guardar Todas las Configuraciones
      </Button>
    </div>
  )

  const handleEditMaintenance = (maintenance: Mantenimiento) => {
    setShowMaintenanceDetails(false)
    setSelectedMaintenance(maintenance)
    setMaintenanceForm({
      id: maintenance.id,
      equipoId: maintenance.equipoId,
      equipo: maintenance.equipo,
      tipo: maintenance.tipo,
      frecuencia: maintenance.frecuencia,
      proximaFecha: maintenance.proximaFecha,
      ultimaFecha: maintenance.ultimaFecha,
      resultado: maintenance.resultado,
      observaciones: maintenance.observaciones,
    })
    setShowMaintenanceForm(true)
  }

  const handleDeleteMaintenance = async (id: number) => {
    // CHANGE: Remove browser confirm and use Dialog instead
    setSelectedMaintenanceToDelete(id)
    setIsDeleteMaintenanceDialogOpen(true)
  }

  // CHANGE: New function to confirm maintenance deletion
  const confirmDeleteMaintenance = async () => {
    if (!selectedMaintenanceToDelete) return

    setMaintenanceLoading(true)
    try {
      const result = await deleteMantenimiento(selectedMaintenanceToDelete)

      if (result.success) {
        toast({
          title: "Mantenimiento eliminado",
          description: "El mantenimiento ha sido eliminado exitosamente",
        })
        setIsDeleteMaintenanceDialogOpen(false)
        setSelectedMaintenanceToDelete(null)
        setShowMaintenanceDetails(false)
        await loadMaintenanceSchedules()
        await loadMaintenanceStats()
      } else {
        toast({
          variant: "destructive",
          title: "Error al eliminar",
          description: result.error || "No se pudo eliminar el mantenimiento",
        })
      }
    } catch (error) {
      console.error("[v0] Error in confirmDeleteMaintenance:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al eliminar el mantenimiento",
      })
    } finally {
      setMaintenanceLoading(false)
    }
  }

  const resetMaintenanceForm = () => {
    setMaintenanceForm({
      resultado: "pendiente",
    })
    setSelectedMaintenance(null)
  }

  const handleSaveMaintenanceSchedule = async () => {
    const errors: Record<string, string> = {}

    if (!maintenanceForm.equipoId) {
      errors.equipoId = "Debe seleccionar un equipo"
    }
    if (!maintenanceForm.tipo || maintenanceForm.tipo.trim() === "") {
      errors.tipo = "El tipo de mantenimiento es requerido"
    }
    if (!maintenanceForm.frecuencia || maintenanceForm.frecuencia.trim() === "") {
      errors.frecuencia = "La frecuencia es requerida"
    }
    if (!maintenanceForm.proximaFecha) {
      errors.proximaFecha = "La fecha del próximo mantenimiento es requerida"
    }
    if (!maintenanceForm.observaciones || maintenanceForm.observaciones.trim() === "") {
      errors.observaciones = "Las observaciones son requeridas"
    }

    if (Object.keys(errors).length > 0) {
      setMaintenanceFormErrors(errors)
      return
    }

    setMaintenanceFormErrors({})
    setMaintenanceLoading(true)
    try {
      const result = selectedMaintenance
        ? await updateMantenimiento(selectedMaintenance.id, maintenanceForm)
        : await createMantenimiento(maintenanceForm, currentUser?.id)

      if (result.success) {
        toast({
          title: selectedMaintenance ? "Mantenimiento actualizado" : "Mantenimiento programado",
          description: `El mantenimiento ha sido ${selectedMaintenance ? "actualizado" : "programado"} exitosamente.`,
        })
        setShowMaintenanceForm(false)
        resetMaintenanceForm()
        await loadMaintenanceSchedules()
        await loadMaintenanceStats()
      } else {
        setMaintenanceFormErrors({ general: result.error || "Error al guardar el mantenimiento" })
        toast({
          variant: "destructive",
          title: "Error al guardar mantenimiento",
          description: result.error || "No se pudo guardar el mantenimiento. Por favor intente de nuevo.",
        })
      }
    } catch (error) {
      console.error("[v0] Error saving maintenance:", error)
      setMaintenanceFormErrors({ general: "Error de conexión al guardar el mantenimiento" })
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo conectar al servidor para guardar el mantenimiento.",
      })
    } finally {
      setMaintenanceLoading(false)
    }
  }

  const handleEditEquipment = (equipo: Equipment) => {
    // Set the equipment form with all fields from the selected equipment
    setEquipmentForm({
      id: equipo.id,
      numeroSerie: equipo.numeroSerie || "",
      nombre: equipo.nombre || "",
      modelo: equipo.modelo || "",
      fabricante: equipo.fabricante || "",
      ubicacion: equipo.ubicacion || "",
      estado: equipo.estado || "operativo",
      voltaje: equipo.voltaje || "",
      fechaInstalacion: equipo.fechaInstalacion || "",
      frecuencia: equipo.frecuencia || "",
      fechaRetiro: equipo.fechaRetiro || "",
      codigoInstitucional: equipo.codigoInstitucional || "",
      servicio: equipo.servicio || "",
      vencimientoGarantia: equipo.vencimientoGarantia || "",
      fechaIngreso: equipo.fechaIngreso || "",
      procedencia: equipo.procedencia || "",
      potencia: equipo.potencia || "",
      corriente: equipo.corriente || "",
      otrosEspecificaciones: equipo.otrosEspecificaciones || "",
      accesoriosConsumibles: equipo.accesoriosConsumibles || "",
      estadoEquipo: equipo.estadoEquipo || "operativo",
      manualUsuario: equipo.manualUsuario || false,
      manualServicio: equipo.manualServicio || false,
      nivelRiesgo: equipo.nivelRiesgo || "",
      proveedorNombre: equipo.proveedorNombre || "",
      proveedorDireccion: equipo.proveedorDireccion || "",
      proveedorTelefono: equipo.proveedorTelefono || "",
      observaciones: equipo.observaciones || "",
    })

    // Also try to load complete details from API in background
    ;(async () => {
      try {
        const details = await getEquipo(equipo.id)
        if (details) {
          const transformed = transformEquipoToEquipment(details)
          setEquipmentForm((prevForm) => ({
            ...prevForm,
            numeroSerie: transformed.numeroSerie || prevForm.numeroSerie,
            codigoInstitucional: transformed.codigoInstitucional || prevForm.codigoInstitucional,
            fechaIngreso: transformed.fechaIngreso || prevForm.fechaIngreso,
            vencimientoGarantia: transformed.vencimientoGarantia || prevForm.vencimientoGarantia,
            fechaInstalacion: transformed.fechaInstalacion || prevForm.fechaInstalacion,
            otrosEspecificaciones: transformed.otrosEspecificaciones || prevForm.otrosEspecificaciones,
            accesoriosConsumibles: transformed.accesoriosConsumibles || prevForm.accesoriosConsumibles,
            estadoEquipo: transformed.estadoEquipo || prevForm.estadoEquipo,
            nivelRiesgo: transformed.nivelRiesgo || prevForm.nivelRiesgo,
            proveedorNombre: transformed.proveedorNombre || prevForm.proveedorNombre,
            proveedorDireccion: transformed.proveedorDireccion || prevForm.proveedorDireccion,
            proveedorTelefono: transformed.proveedorTelefono || prevForm.proveedorTelefono,
            observaciones: transformed.observaciones || prevForm.observaciones, // Added to keep observations in edit form
          }))
        }
      } catch (err) {
        console.error("[v0] Error loading additional details:", err)
      }
    })()

    setEditingEquipment(true)
    setShowEquipmentForm(true) // Open the form
  }

  // Added the new function to generate technical sheets
  const handleGenerateEquipmentTechnicalSheet = async (equipment: Equipment) => {
    try {
      const doc = await generateEquipmentTechnicalSheet(equipment)
      downloadPDF(doc, `ficha-tecnica-${equipment.numeroSerie || equipment.id}.pdf`)
    } catch (error) {
      console.error("[v0] Error generating technical sheet:", error)
      alert("Error al generar la ficha técnica. Por favor intente nuevamente.")
    }
  }

  const handleUserLogin = (user: Usuario) => {
    const roletype = user.rol.toLowerCase() as RoleType
    const currentUserWithPermissions: CurrentUser = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: roletype,
      permissions: (user.permissions as Record<PermissionKey, boolean> | undefined) || DEFAULT_PERMISSIONS_BY_ROLE[roletype],
    }
    setCurrentUser(currentUserWithPermissions)
    setUserRole(roletype)
  }

  const canViewSection = (section: string) => {
    return canAccessSection(currentUser, section)
  }

  // The useEffect for loading notifications is now at the top level.

  const loadNotifications = async () => {
    try {
      const notifs = await getNotifications()
      setNotifications(notifs)
      setUnreadCount(notifs.filter((n) => !n.leida).length)
    } catch (error) {
      console.error("[v0] Error loading notifications:", error)
      setNotifications([])
      setUnreadCount(0)
    }
  }

  const handleMarkNotificationAsRead = useCallback(async (id: number) => {
    await markAsRead(id)
    await loadNotifications()
  }, [])

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead()
    await loadNotifications()
  }, [])

  // ADDED: Logo change handler
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const logoUrl = reader.result as string
        setHospitalLogo(logoUrl)
        
        // Save logo to database
        const result = await saveHospitalLogo(logoUrl)
        if (result.success) {
          // Also save to localStorage for immediate access on login page
          if (typeof window !== 'undefined') {
            localStorage.setItem('hospitalLogo', logoUrl)
          }
          
          toast({
            title: "Logo actualizado",
            description: "El logo del hospital se ha guardado correctamente.",
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "No se pudo guardar el logo.",
            variant: "destructive",
          })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Render functions with permission checks
  const renderContent = () => {
    if (!currentUser) {
      if (loading) {
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando dashboard...</p>
            </div>
          </div>
        )
      }
      // If not loading but still no user, show loading briefly in case data is being fetched
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Inicializando...</p>
          </div>
        </div>
      )
    }

    if (activeSection === "equipos" && !canViewSection("equipos")) {
      return (
        <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Acceso Denegado</h3>
            <p className="text-gray-600 mt-2">No tienes permisos para acceder a Gestión de Equipos</p>
          </div>
        </div>
      )
    }

    if (activeSection === "tecnicos" && !canViewSection("tecnicos")) {
      return (
        <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Acceso Denegado</h3>
            <p className="text-gray-600 mt-2">No tienes permisos para acceder a Gestión de Usuarios</p>
          </div>
        </div>
      )
    }

    if (activeSection === "auditoria" && !canViewSection("auditoria")) {
      return (
        <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Acceso Denegado</h3>
            <p className="text-gray-600 mt-2">No tienes permisos para acceder a los Logs de Auditoría</p>
          </div>
        </div>
      )
    }

    if (activeSection === "configuracion" && !canViewSection("configuracion")) {
      return (
        <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Acceso Denegado</h3>
            <p className="text-gray-600 mt-2">No tienes permisos para acceder a Configuración</p>
          </div>
        </div>
      )
    }

    // ... existing rendering logic for other sections ...
    switch (activeSection) {
      case "dashboard":
        return renderDashboard()
      case "equipos":
        return renderGestionEquipos()
      case "tecnicos":
        return renderUsuarios()
      case "ordenes":
        return renderOrdenes()
      case "mantenimiento":
        return renderMantenimiento()
      case "reportes":
        return renderReportes()
      case "auditoria":
        return renderAuditoria()
      case "configuracion":
        return renderConfiguracion()
      default:
        return renderDashboard()
    }
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        userRole={currentUser?.rol || "administrador"}
        currentUser={currentUser}
        hospitalLogo={hospitalLogo}
      />
      <main className="flex-1 w-full">
        <AppHeader
          currentUser={currentUser}
          hospitalLogo={hospitalLogo}
          unreadCount={unreadCount}
          notifications={notifications}
          handleMarkNotificationAsRead={handleMarkNotificationAsRead}
          handleMarkAllAsRead={handleMarkAllAsRead}
          setActiveSection={setActiveSection}
        />
        <div className="p-6">{renderContent()}</div>
      </main>

      {/* EQUIPMENT DELETE CONFIRMATION DIALOG */}
      <Dialog open={isDeleteEquipmentDialogOpen} onOpenChange={setIsDeleteEquipmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar este equipo? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteEquipmentDialogOpen(false)
                setSelectedEquipmentToDelete(null)
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteEquipment} disabled={equipmentLoading}>
              {equipmentLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* USER DELETE CONFIRMATION DIALOG */}
      <Dialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar este usuario? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteUserDialogOpen(false)
                setSelectedUserToDelete(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!selectedUserToDelete) return

                const result = await removeUsuario(selectedUserToDelete)
                if (result.success) {
                  toast({
                    title: "Usuario eliminado",
                    description: "El usuario ha sido eliminado exitosamente",
                  })
                  setIsDeleteUserDialogOpen(false)
                  setSelectedUserToDelete(null)
                  await loadUsers()
                } else {
                  toast({
                    variant: "destructive",
                    title: "Error al eliminar",
                    description: result.error || "No se pudo eliminar el usuario",
                  })
                }
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MAINTENANCE DELETE CONFIRMATION DIALOG */}
      <Dialog open={isDeleteMaintenanceDialogOpen} onOpenChange={setIsDeleteMaintenanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar este mantenimiento programado? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteMaintenanceDialogOpen(false)
                setSelectedMaintenanceToDelete(null)
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteMaintenance} disabled={maintenanceLoading}>
              {maintenanceLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
