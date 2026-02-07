"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { saveEquipo } from "@/app/actions/equipos"
import type { Equipo } from "@/lib/api/equipos"

interface EquipmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipment?: Equipo | null
  onSuccess: () => void
  userId?: string
}

interface ValidationErrors {
  [key: string]: string
}

export function EquipmentForm({ open, onOpenChange, equipment, onSuccess, userId }: EquipmentFormProps) {
  const [formData, setFormData] = useState<Partial<Equipo>>({})
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState<string>("")

  // Refs for each input field to enable auto-scroll
  const fieldRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Initialize form data when dialog opens or equipment changes
  useEffect(() => {
    if (open) {
      if (equipment) {
        setFormData(equipment)
      } else {
        setFormData({
          estado: "operativo",
          estado_equipo: "operativo",
          nivel_riesgo: "medio",
          manual_usuario: false,
          manual_servicio: false,
        })
      }
      setErrors({})
      setGeneralError("")
    }
  }, [open, equipment])

  // Validate a single field
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case "codigo_institucional":
        if (!value) return "El código institucional es obligatorio"
        if (!/^\d{12}$/.test(value)) return "El código institucional debe tener exactamente 12 dígitos"
        return ""

      case "nombre_equipo":
        if (!value || value.trim().length < 3) return "El nombre debe tener al menos 3 caracteres"
        if (value.length > 200) return "El nombre no puede exceder 200 caracteres"
        return ""

      case "fabricante":
        if (!value || value.trim().length < 2) return "El fabricante debe tener al menos 2 caracteres"
        if (value.length > 100) return "El fabricante no puede exceder 100 caracteres"
        return ""

      case "modelo":
        if (!value || value.trim().length < 2) return "El modelo debe tener al menos 2 caracteres"
        if (value.length > 100) return "El modelo no puede exceder 100 caracteres"
        return ""

      case "numero_serie":
        if (!value || value.trim().length < 3) return "El número de serie debe tener al menos 3 caracteres"
        if (value.length > 100) return "El número de serie no puede exceder 100 caracteres"
        return ""

      case "ubicacion":
        if (!value || value.trim().length < 3) return "La ubicación debe tener al menos 3 caracteres"
        if (value.length > 200) return "La ubicación no puede exceder 200 caracteres"
        return ""

      case "servicio":
        if (!value || value.trim().length < 3) return "El servicio debe tener al menos 3 caracteres"
        if (value.length > 100) return "El servicio no puede exceder 100 caracteres"
        return ""

      case "proveedor_telefono":
        if (value && !/^[\d\s\-+$$$$]+$/.test(value))
          return "El teléfono solo puede contener números y caracteres: + - ( ) espacios"
        return ""

      case "fecha_adquisicion":
      case "fecha_instalacion":
      case "fecha_ingreso":
        if (value) {
          const date = new Date(value)
          const now = new Date()
          if (date > now) return "La fecha no puede ser futura"
        }
        return ""

      case "vencimiento_garantia":
        if (value) {
          const date = new Date(value)
          const now = new Date()
          if (date < now) return "El vencimiento de garantía debe ser una fecha futura"
        }
        return ""

      case "observaciones":
      case "otros_especificaciones":
      case "accesorios_consumibles":
        if (value && value.length > 1000) return "Este campo no puede exceder 1000 caracteres"
        return ""

      case "proveedor_direccion":
        if (value && value.length > 500) return "La dirección no puede exceder 500 caracteres"
        return ""

      default:
        return ""
    }
  }

  // Handle input change with validation
  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
    setGeneralError("")
  }

  // Validate all required fields
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    const requiredFields = [
      "codigo_institucional",
      "nombre_equipo",
      "fabricante",
      "modelo",
      "numero_serie",
      "ubicacion",
      "servicio",
    ]

    // Validate required fields
    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field as keyof Equipo])
      if (error) {
        newErrors[field] = error
      }
    })

    // Validate optional fields that have values
    Object.keys(formData).forEach((key) => {
      if (!requiredFields.includes(key) && formData[key as keyof Equipo]) {
        const error = validateField(key, formData[key as keyof Equipo])
        if (error) {
          newErrors[key] = error
        }
      }
    })

    // Date logic validations
    if (formData.fecha_instalacion && formData.fecha_adquisicion) {
      const instalacion = new Date(formData.fecha_instalacion)
      const adquisicion = new Date(formData.fecha_adquisicion)
      if (instalacion < adquisicion) {
        newErrors.fecha_instalacion = "La fecha de instalación debe ser posterior a la de adquisición"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Scroll to first error field
  const scrollToFirstError = () => {
    const firstErrorField = Object.keys(errors)[0]
    if (firstErrorField && fieldRefs.current[firstErrorField]) {
      fieldRefs.current[firstErrorField]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })

      // Focus the input after scrolling
      setTimeout(() => {
        const input = fieldRefs.current[firstErrorField]?.querySelector("input, textarea, select")
        if (input instanceof HTMLElement) {
          input.focus()
        }
      }, 300)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] Form submission started")
    setGeneralError("")

    if (!validateForm()) {
      console.log("[v0] Validation failed, errors:", errors)
      scrollToFirstError()
      return
    }

    setIsSubmitting(true)

    try {
      const result = await saveEquipo(formData as Equipo, userId)

      if (result.success) {
        console.log("[v0] Equipment saved successfully")
        onSuccess()
        onOpenChange(false)
      } else {
        console.log("[v0] Save failed:", result.error)

        // Parse backend validation errors
        if (result.error && result.error.includes("código institucional")) {
          setErrors({ codigo_institucional: result.error })
          scrollToFirstError()
        } else {
          setGeneralError(result.error || "Error al guardar el equipo")
        }
      }
    } catch (error) {
      console.error("[v0] Error saving equipment:", error)
      setGeneralError("Error al guardar el equipo. Por favor intente nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{equipment ? "Editar equipo" : "Nuevo equipo"}</DialogTitle>
          <DialogDescription>
            Complete los datos del equipo. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {generalError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          {/* Código Institucional */}
          <div ref={(el) => { fieldRefs.current.codigo_institucional = el }}>
            <Label htmlFor="codigo_institucional">
              Código Institucional <span className="text-red-500">*</span>
            </Label>
            <Input
              id="codigo_institucional"
              value={formData.codigo_institucional || ""}
              onChange={(e) => handleChange("codigo_institucional", e.target.value)}
              placeholder="Ingrese 12 dígitos"
              maxLength={12}
              className={errors.codigo_institucional ? "border-red-500" : ""}
            />
            {errors.codigo_institucional && <p className="text-sm text-red-500 mt-1">{errors.codigo_institucional}</p>}
          </div>

          {/* Nombre del Equipo */}
          <div ref={(el) => { fieldRefs.current.nombre_equipo = el }}>
            <Label htmlFor="nombre_equipo">
              Nombre del Equipo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre_equipo"
              value={formData.nombre_equipo || ""}
              onChange={(e) => handleChange("nombre_equipo", e.target.value)}
              placeholder="Ej: Ventilador Mecánico"
              className={errors.nombre_equipo ? "border-red-500" : ""}
            />
            {errors.nombre_equipo && <p className="text-sm text-red-500 mt-1">{errors.nombre_equipo}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Fabricante */}
            <div ref={(el) => { fieldRefs.current.fabricante = el }}>
              <Label htmlFor="fabricante">
                Fabricante <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fabricante"
                value={formData.fabricante || ""}
                onChange={(e) => handleChange("fabricante", e.target.value)}
                placeholder="Ej: Philips"
                className={errors.fabricante ? "border-red-500" : ""}
              />
              {errors.fabricante && <p className="text-sm text-red-500 mt-1">{errors.fabricante}</p>}
            </div>

            {/* Modelo */}
            <div ref={(el) => { fieldRefs.current.modelo = el }}>
              <Label htmlFor="modelo">
                Modelo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="modelo"
                value={formData.modelo || ""}
                onChange={(e) => handleChange("modelo", e.target.value)}
                placeholder="Ej: V60"
                className={errors.modelo ? "border-red-500" : ""}
              />
              {errors.modelo && <p className="text-sm text-red-500 mt-1">{errors.modelo}</p>}
            </div>
          </div>

          {/* Número de Serie */}
          <div ref={(el) => { fieldRefs.current.numero_serie = el }}>
            <Label htmlFor="numero_serie">
              Número de Serie <span className="text-red-500">*</span>
            </Label>
            <Input
              id="numero_serie"
              value={formData.numero_serie || ""}
              onChange={(e) => handleChange("numero_serie", e.target.value)}
              placeholder="Ej: ABC123456"
              className={errors.numero_serie ? "border-red-500" : ""}
            />
            {errors.numero_serie && <p className="text-sm text-red-500 mt-1">{errors.numero_serie}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Ubicación */}
            <div ref={(el) => { fieldRefs.current.ubicacion = el }}>
              <Label htmlFor="ubicacion">
                Ubicación <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ubicacion"
                value={formData.ubicacion || ""}
                onChange={(e) => handleChange("ubicacion", e.target.value)}
                placeholder="Ej: UCI - Planta 3"
                className={errors.ubicacion ? "border-red-500" : ""}
              />
              {errors.ubicacion && <p className="text-sm text-red-500 mt-1">{errors.ubicacion}</p>}
            </div>

            {/* Servicio */}
            <div ref={(el) => { fieldRefs.current.servicio = el }}>
              <Label htmlFor="servicio">
                Servicio <span className="text-red-500">*</span>
              </Label>
              <Input
                id="servicio"
                value={formData.servicio || ""}
                onChange={(e) => handleChange("servicio", e.target.value)}
                placeholder="Ej: Unidad de Cuidados Intensivos"
                className={errors.servicio ? "border-red-500" : ""}
              />
              {errors.servicio && <p className="text-sm text-red-500 mt-1">{errors.servicio}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Estado */}
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select value={formData.estado || "operativo"} onValueChange={(value) => handleChange("estado", value)}>
                <SelectTrigger id="estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operativo">Operativo</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="en reparacion">En Reparación</SelectItem>
                  <SelectItem value="fuera de servicio">Fuera de Servicio</SelectItem>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nivel de Riesgo */}
            <div>
              <Label htmlFor="nivel_riesgo">Nivel de Riesgo</Label>
              <Select
                value={formData.nivel_riesgo || "medio"}
                onValueChange={(value) => handleChange("nivel_riesgo", value)}
              >
                <SelectTrigger id="nivel_riesgo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="medio">Medio</SelectItem>
                  <SelectItem value="bajo">Bajo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Fechas */}
            <div ref={(el) => { fieldRefs.current.fecha_adquisicion = el }}>
              <Label htmlFor="fecha_adquisicion">Fecha de Adquisición</Label>
              <Input
                id="fecha_adquisicion"
                type="date"
                value={formData.fecha_adquisicion || ""}
                onChange={(e) => handleChange("fecha_adquisicion", e.target.value)}
                className={errors.fecha_adquisicion ? "border-red-500" : ""}
              />
              {errors.fecha_adquisicion && <p className="text-sm text-red-500 mt-1">{errors.fecha_adquisicion}</p>}
            </div>

            <div ref={(el) => { fieldRefs.current.fecha_instalacion = el }}>
              <Label htmlFor="fecha_instalacion">Fecha de Instalación</Label>
              <Input
                id="fecha_instalacion"
                type="date"
                value={formData.fecha_instalacion || ""}
                onChange={(e) => handleChange("fecha_instalacion", e.target.value)}
                className={errors.fecha_instalacion ? "border-red-500" : ""}
              />
              {errors.fecha_instalacion && <p className="text-sm text-red-500 mt-1">{errors.fecha_instalacion}</p>}
            </div>

            <div ref={(el) => { fieldRefs.current.vencimiento_garantia = el }}>
              <Label htmlFor="vencimiento_garantia">Vencimiento de Garantía</Label>
              <Input
                id="vencimiento_garantia"
                type="date"
                value={formData.vencimiento_garantia || ""}
                onChange={(e) => handleChange("vencimiento_garantia", e.target.value)}
                className={errors.vencimiento_garantia ? "border-red-500" : ""}
              />
              {errors.vencimiento_garantia && (
                <p className="text-sm text-red-500 mt-1">{errors.vencimiento_garantia}</p>
              )}
            </div>
          </div>

          {/* Datos del Proveedor */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Datos del Proveedor</h3>

            <div>
              <Label htmlFor="proveedor_nombre">Nombre del Proveedor</Label>
              <Input
                id="proveedor_nombre"
                value={formData.proveedor_nombre || ""}
                onChange={(e) => handleChange("proveedor_nombre", e.target.value)}
                placeholder="Ej: Medicos SA"
              />
            </div>

            <div ref={(el) => { fieldRefs.current.proveedor_telefono = el }}>
              <Label htmlFor="proveedor_telefono">Teléfono del Proveedor</Label>
              <Input
                id="proveedor_telefono"
                value={formData.proveedor_telefono || ""}
                onChange={(e) => handleChange("proveedor_telefono", e.target.value)}
                placeholder="Ej: +507 6000-0000"
                className={errors.proveedor_telefono ? "border-red-500" : ""}
              />
              {errors.proveedor_telefono && <p className="text-sm text-red-500 mt-1">{errors.proveedor_telefono}</p>}
            </div>

            <div ref={(el) => { fieldRefs.current.proveedor_direccion = el }}>
              <Label htmlFor="proveedor_direccion">Dirección del Proveedor</Label>
              <Textarea
                id="proveedor_direccion"
                value={formData.proveedor_direccion || ""}
                onChange={(e) => handleChange("proveedor_direccion", e.target.value)}
                placeholder="Dirección completa del proveedor"
                rows={2}
                className={errors.proveedor_direccion ? "border-red-500" : ""}
              />
              {errors.proveedor_direccion && <p className="text-sm text-red-500 mt-1">{errors.proveedor_direccion}</p>}
            </div>
          </div>

          {/* Observaciones */}
          <div ref={(el) => { fieldRefs.current.observaciones = el }}>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones || ""}
              onChange={(e) => handleChange("observaciones", e.target.value)}
              placeholder="Observaciones adicionales sobre el equipo"
              rows={3}
              className={errors.observaciones ? "border-red-500" : ""}
            />
            {errors.observaciones && <p className="text-sm text-red-500 mt-1">{errors.observaciones}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : equipment ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
