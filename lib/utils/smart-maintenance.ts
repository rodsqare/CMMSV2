'use server'

import { prisma } from '@/lib/prisma'

/**
 * Calcular la próxima fecha recomendada basada en frecuencia
 */
export function calculateNextMaintenanceDate(
  frecuencia: string,
  ultimaFecha?: string | Date | null,
): Date {
  const frecuenciaMap: Record<string, number> = {
    diaria: 1,
    semanal: 7,
    quincenal: 15,
    mensual: 30,
    bimensual: 60,
    trimestral: 90,
    semestral: 180,
    anual: 365,
  }

  const dias = frecuenciaMap[frecuencia?.toLowerCase()] || 30
  const baseDate = ultimaFecha ? new Date(ultimaFecha) : new Date()
  const nextDate = new Date(baseDate.getTime() + dias * 24 * 60 * 60 * 1000)

  return nextDate
}

/**
 * Obtener días recomendados para programar (menos congestión)
 */
export async function getRecommendedDates(
  equipoId: number,
  count: number = 5,
): Promise<Array<{ date: Date; score: number; reason: string }>> {
  try {
    const today = new Date()
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Obtener mantenimientos programados en el próximo mes
    const maintenances = await prisma.mantenimiento.findMany({
      where: {
        equipo_id: equipoId,
        proxima_programada: {
          gte: today,
          lte: nextMonth,
        },
        activo: true,
      },
    })

    const recommendations: Array<{ date: Date; score: number; reason: string }> = []

    // Analizar cada día del próximo mes
    for (let offset = 1; offset <= 30; offset++) {
      const date = new Date(today.getTime() + offset * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]

      // Contar mantenimientos ese día
      const dayMaintenances = maintenances.filter(
        (m) => m.proxima_programada.toISOString().split('T')[0] === dateStr,
      )

      // Calcular score (0-100)
      // 100 = Perfecto, 0 = No recomendado
      let score = 100

      // Penalizar por mantenimientos ese día
      score -= dayMaintenances.length * 15

      // Penalizar si es fin de semana (preferir laborales)
      if (date.getDay() === 0 || date.getDay() === 6) {
        score -= 20
      }

      // Bonificar si es lunes-miércoles (mejor para técnicos)
      if (date.getDay() >= 1 && date.getDay() <= 3) {
        score += 10
      }

      // No recomendar si ya hay 3+ mantenimientos
      if (dayMaintenances.length >= 3) {
        score = 0
      }

      if (score > 0) {
        const reason =
          dayMaintenances.length === 0
            ? 'Sin conflictos programados'
            : dayMaintenances.length === 1
              ? '1 mantenimiento programado'
              : `${dayMaintenances.length} mantenimientos programados`

        recommendations.push({ date, score, reason })
      }
    }

    // Ordenar por score descendente y retornar top 5
    return recommendations.sort((a, b) => b.score - a.score).slice(0, count)
  } catch (error) {
    console.error('[v0] Error getting recommended dates:', error)
    return []
  }
}

/**
 * Detectar conflictos de mantenimiento (múltiples en mismo equipo mismo día)
 */
export async function detectMaintenanceConflicts(
  equipoId: number,
  date: Date,
): Promise<
  Array<{
    id: number
    equipo: string
    tipo: string
    hora?: string
    conflictType: 'same_day' | 'same_window'
  }>
> {
  try {
    const dateStr = date.toISOString().split('T')[0]

    // Buscar otros mantenimientos el mismo día
    const conflicts = await prisma.mantenimiento.findMany({
      where: {
        equipo_id: equipoId,
        proxima_programada: {
          gte: new Date(`${dateStr}T00:00:00`),
          lt: new Date(`${dateStr}T23:59:59`),
        },
        activo: true,
      },
      include: {
        equipo: true,
      },
    })

    return conflicts.map((m) => ({
      id: m.id,
      equipo: m.equipo?.nombre || 'Equipo desconocido',
      tipo: m.tipo,
      conflictType: 'same_day',
    }))
  } catch (error) {
    console.error('[v0] Error detecting conflicts:', error)
    return []
  }
}

/**
 * Obtener estadísticas de carga de mantenimiento
 */
export async function getMaintenanceLoadStats(startDate: Date, endDate: Date) {
  try {
    const stats = await prisma.mantenimiento.groupBy({
      by: ['proxima_programada'],
      _count: true,
      where: {
        proxima_programada: {
          gte: startDate,
          lte: endDate,
        },
        activo: true,
      },
    })

    const dayDistribution: Record<string, number> = {}
    let maxLoad = 0
    let avgLoad = 0

    stats.forEach((s) => {
      const dateStr = new Date(s.proxima_programada).toISOString().split('T')[0]
      dayDistribution[dateStr] = s._count
      maxLoad = Math.max(maxLoad, s._count)
    })

    avgLoad = stats.length > 0 ? stats.reduce((sum, s) => sum + s._count, 0) / stats.length : 0

    return {
      totalDays: stats.length,
      dayDistribution,
      maxLoad,
      avgLoad: Math.round(avgLoad * 100) / 100,
    }
  } catch (error) {
    console.error('[v0] Error getting load stats:', error)
    return {
      totalDays: 0,
      dayDistribution: {},
      maxLoad: 0,
      avgLoad: 0,
    }
  }
}
