import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

// GET - Reporte de órdenes de trabajo
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const meses = parseInt(searchParams.get('meses') || '3')
    
    const fechaInicio = startOfMonth(subMonths(new Date(), meses - 1))
    const fechaFin = endOfMonth(new Date())
    
    // Órdenes por estado
    const ordenesPorEstado = await prisma.ordenTrabajo.groupBy({
      by: ['estado'],
      _count: true,
      where: {
        created_at: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
    })
    
    // Órdenes por prioridad
    const ordenesPorPrioridad = await prisma.ordenTrabajo.groupBy({
      by: ['prioridad'],
      _count: true,
      where: {
        created_at: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
    })
    
    // Órdenes por tipo
    const ordenesPorTipo = await prisma.ordenTrabajo.groupBy({
      by: ['tipo'],
      _count: true,
      where: {
        created_at: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
    })
    
    // Tiempo promedio de resolución
    const ordenesFinalizadas = await prisma.ordenTrabajo.findMany({
      where: {
        estado: 'finalizada',
        fecha_inicio: { not: null },
        fecha_finalizacion: { not: null },
        created_at: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      select: {
        fecha_inicio: true,
        fecha_finalizacion: true,
        tiempo_real: true,
      },
    })
    
    const tiempoPromedio = ordenesFinalizadas.length > 0
      ? ordenesFinalizadas.reduce((acc, orden) => acc + (orden.tiempo_real || 0), 0) / ordenesFinalizadas.length
      : 0
    
    // Órdenes pendientes por técnico
    const ordenesPorTecnico = await prisma.ordenTrabajo.groupBy({
      by: ['asignado_a'],
      _count: true,
      where: {
        estado: {
          in: ['pendiente', 'en_progreso'],
        },
        asignado_a: {
          not: null,
        },
      },
    })
    
    // Obtener nombres de técnicos
    const tecnicos = await prisma.usuario.findMany({
      where: {
        id: {
          in: ordenesPorTecnico
            .map(o => o.asignado_a)
            .filter((id): id is number => id !== null),
        },
      },
      select: {
        id: true,
        nombre: true,
      },
    })
    
    const ordenesPorTecnicoConNombres = ordenesPorTecnico.map(orden => ({
      tecnico: tecnicos.find(t => t.id === orden.asignado_a)?.nombre || 'Sin asignar',
      cantidad: orden._count,
    }))
    
    const reporte = {
      fecha_generacion: new Date(),
      periodo: {
        inicio: fechaInicio,
        fin: fechaFin,
      },
      resumen: {
        por_estado: ordenesPorEstado,
        por_prioridad: ordenesPorPrioridad,
        por_tipo: ordenesPorTipo,
        tiempo_promedio_horas: Math.round(tiempoPromedio * 10) / 10,
      },
      ordenes_pendientes_por_tecnico: ordenesPorTecnicoConNombres,
    }
    
    return NextResponse.json(reporte)
  } catch (error: any) {
    console.error('[v0] Error generating reporte ordenes:', error)
    return NextResponse.json(
      { error: error.message || 'Error al generar reporte' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}
