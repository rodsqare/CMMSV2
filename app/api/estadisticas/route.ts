import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { subDays } from 'date-fns'

// GET - Estadísticas generales del dashboard
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const hace30Dias = subDays(new Date(), 30)
    
    // Totales
    const [
      totalEquipos,
      totalOrdenes,
      ordenesAbiertas,
      ordenesVencidas,
      mantenimientosPendientes,
      notificacionesNoLeidas,
    ] = await Promise.all([
      prisma.equipo.count(),
      
      prisma.ordenTrabajo.count({
        where: {
          created_at: { gte: hace30Dias },
        },
      }),
      
      prisma.ordenTrabajo.count({
        where: {
          estado: { in: ['pendiente', 'en_progreso'] },
        },
      }),
      
      prisma.ordenTrabajo.count({
        where: {
          estado: { in: ['pendiente', 'en_progreso'] },
          fecha_programada: {
            lt: new Date(),
          },
        },
      }),
      
      prisma.mantenimiento.count({
        where: {
          activo: true,
          proxima_programada: {
            lte: subDays(new Date(), -7), // próximos 7 días
          },
        },
      }),
      
      prisma.notificacion.count({
        where: {
          leida: false,
        },
      }),
    ])
    
    // Equipos por estado
    const equiposPorEstado = await prisma.equipo.groupBy({
      by: ['estado'],
      _count: true,
    })
    
    // Órdenes por mes (últimos 6 meses)
    const ordenesPorMes = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as mes,
        COUNT(*) as cantidad
      FROM ordenes_trabajo
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY mes ASC
    `
    
    // Mantenimientos realizados este mes
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const mantenimientosRealizadosMes = await prisma.mantenimientoRealizado.count({
      where: {
        fecha_realizacion: {
          gte: inicioMes,
        },
      },
    })
    
    const estadisticas = {
      totales: {
        equipos: totalEquipos,
        ordenes_mes: totalOrdenes,
        ordenes_abiertas: ordenesAbiertas,
        ordenes_vencidas: ordenesVencidas,
        mantenimientos_pendientes: mantenimientosPendientes,
        mantenimientos_realizados_mes: mantenimientosRealizadosMes,
        notificaciones_no_leidas: notificacionesNoLeidas,
      },
      equipos_por_estado: equiposPorEstado,
      ordenes_por_mes: ordenesPorMes,
    }
    
    return NextResponse.json(estadisticas)
  } catch (error: any) {
    console.error('[v0] Error fetching estadisticas:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener estadísticas' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}
