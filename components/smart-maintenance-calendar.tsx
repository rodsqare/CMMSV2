'use client'

import React, { useMemo } from 'react'
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface SmartCalendarMaintenance {
  id: number
  equipoId: number
  equipo?: string
  tipo: string
  frecuencia: string
  proximaFecha: string
  status?: 'overdue' | 'upcoming' | 'scheduled' | 'completed'
}

interface SmartMaintenanceCalendarProps {
  maintenances: SmartCalendarMaintenance[]
  currentMonth: Date
  onMonthChange: (month: Date) => void
  onDateSelect: (date: Date, suggestion?: any) => void
  onMaintenanceClick?: (maintenance: SmartCalendarMaintenance) => void
  disabled?: boolean
}

export function SmartMaintenanceCalendar({
  maintenances,
  currentMonth,
  onMonthChange,
  onDateSelect,
  onMaintenanceClick,
  disabled = false,
}: SmartMaintenanceCalendarProps) {
  const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null)

  // Calcular sugerencias inteligentes
  const smartSuggestions = useMemo(() => {
    const suggestions: Record<string, any> = {}
    const equipoUltimaFecha: Record<number, Date> = {}

    // Mapear últimas fechas de mantenimiento por equipo
    maintenances.forEach((m) => {
      const date = new Date(m.proximaFecha)
      const equipoId = m.equipoId
      
      if (!equipoUltimaFecha[equipoId] || date > equipoUltimaFecha[equipoId]) {
        equipoUltimaFecha[equipoId] = date
      }
    })

    // Para cada día, calcular sugerencias
    const days = getDaysInMonth(currentMonth)
    for (let day = 1; day <= days; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayMaintenances = maintenances.filter(
        (m) => m.proximaFecha.split('T')[0] === dateStr
      )

      // Contar conflictos (múltiples en el mismo equipo)
      const equipoCount: Record<number, number> = {}
      dayMaintenances.forEach((m) => {
        equipoCount[m.equipoId] = (equipoCount[m.equipoId] || 0) + 1
      })

      const hasConflicts = Object.values(equipoCount).some((count) => count > 1)
      const conflictCount = Object.values(equipoCount).reduce((sum, count) => sum + (count > 1 ? count - 1 : 0), 0)

      suggestions[dateStr] = {
        maintenanceCount: dayMaintenances.length,
        conflictCount,
        hasConflicts,
        isSuggested: !hasConflicts && dayMaintenances.length < 3, // Sugerir si hay espacio
        isOverloaded: dayMaintenances.length >= 3,
        dayRating: calculateDayRating(dayMaintenances), // 1-5 stars
      }
    }

    return suggestions
  }, [maintenances, currentMonth])

  function getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  function calculateDayRating(dayMaintenances: SmartCalendarMaintenance[]): number {
    // 5 = empty, 4 = 1 item, 3 = 2 items, 2 = 3+ items with conflicts, 1 = overloaded
    if (dayMaintenances.length === 0) return 5
    if (dayMaintenances.length === 1) return 4
    if (dayMaintenances.length === 2) return 3
    
    const hasConflicts = dayMaintenances.length > 3
    return hasConflicts ? 1 : 2
  }

  function getDateStatus(date: Date): string {
    const dateStr = date.toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    if (dateStr < today) return 'past'
    if (dateStr === today) return 'today'
    if (smartSuggestions[dateStr]?.isSuggested) return 'suggested'
    if (smartSuggestions[dateStr]?.isOverloaded) return 'overloaded'
    return 'available'
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'suggested':
        return <Zap className="h-3 w-3 text-green-600" />
      case 'overloaded':
        return <AlertCircle className="h-3 w-3 text-red-600" />
      case 'today':
        return <CheckCircle className="h-3 w-3 text-blue-600" />
      case 'available':
        return <Clock className="h-3 w-3 text-gray-400" />
      default:
        return null
    }
  }

  const monthName = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  const days = getDaysInMonth(currentMonth)
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    onMonthChange(newDate)
  }

  const handleDayClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dateStr = date.toISOString().split('T')[0]
    const suggestion = smartSuggestions[dateStr]
    onDateSelect(date, suggestion)
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold capitalize">{monthName}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('prev')}
            disabled={disabled}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMonthChange(new Date())}
            disabled={disabled}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('next')}
            disabled={disabled}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <Zap className="h-3 w-3 text-green-600" />
          <span>Recomendado</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-3 w-3 text-red-600" />
          <span>Sobrecargado</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-3 w-3 text-blue-600" />
          <span>Hoy</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-gray-400" />
          <span>Disponible</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dayName) => (
            <div
              key={dayName}
              className="text-center text-sm font-semibold text-gray-700 py-2 bg-gray-100 rounded"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Days of month */}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
            const dateStr = date.toISOString().split('T')[0]
            const status = getDateStatus(date)
            const suggestion = smartSuggestions[dateStr]
            const dayMaintenances = maintenances.filter(
              (m) => m.proximaFecha.split('T')[0] === dateStr
            )

            let bgColor = 'bg-white'
            let borderColor = 'border-gray-200'
            let textColor = 'text-gray-700'

            switch (status) {
              case 'today':
                bgColor = 'bg-blue-50'
                borderColor = 'border-blue-400'
                textColor = 'text-blue-700'
                break
              case 'suggested':
                bgColor = 'bg-green-50'
                borderColor = 'border-green-400'
                break
              case 'overloaded':
                bgColor = 'bg-red-50'
                borderColor = 'border-red-400'
                textColor = 'text-red-700'
                break
              case 'past':
                bgColor = 'bg-gray-50'
                textColor = 'text-gray-400'
                break
            }

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
                className={`
                  aspect-square p-1 rounded border-2 text-xs font-medium
                  transition-all hover:shadow-md
                  ${bgColor} ${borderColor} ${textColor}
                  flex flex-col items-center justify-start gap-0.5
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                disabled={disabled}
              >
                <span className="text-xs font-bold">{day}</span>
                
                {/* Status indicator */}
                {suggestion && suggestion.maintenanceCount > 0 && (
                  <div className="flex items-center gap-0.5">
                    {getStatusIcon(status)}
                    <span className="text-xs font-semibold">{suggestion.maintenanceCount}</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Stats */}
      {hoveredDate && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">
            {hoveredDate.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          {(() => {
            const dateStr = hoveredDate.toISOString().split('T')[0]
            const dayMaintenances = maintenances.filter((m) => m.proximaFecha.split('T')[0] === dateStr)
            const suggestion = smartSuggestions[dateStr]

            if (dayMaintenances.length === 0) {
              return <p className="text-xs text-blue-700">✓ Excelente día para programar mantenimiento</p>
            }

            return (
              <div className="text-xs text-blue-700 space-y-1">
                <p>Mantenimientos programados: {dayMaintenances.length}</p>
                {suggestion?.conflictCount > 0 && (
                  <p className="text-red-600 font-semibold">⚠ {suggestion.conflictCount} conflictos detectados</p>
                )}
                {suggestion?.isOverloaded && (
                  <p className="text-orange-600">Considera otro día</p>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
