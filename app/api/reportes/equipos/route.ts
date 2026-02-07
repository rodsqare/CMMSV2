import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET - Reporte de equipos
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const formato = searchParams.get('formato') || 'json'
    
    // Estadísticas generales
    const totalEquipos = await prisma.equipo.count()
    
    const equiposPorEstado = await prisma.equipo.groupBy({
      by: ['estado'],
      _count: true,
    })
    
    const equiposPorTipo = await prisma.equipo.groupBy({
      by: ['tipo'],
      _count: true,
    })
    
    const equiposPorCriticidad = await prisma.equipo.groupBy({
      by: ['criticidad'],
      _count: true,
    })
    
    // Próximos mantenimientos
    const proximosMantenimientos = await prisma.equipo.findMany({
      where: {
        proxima_mantencion: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        },
      },
      orderBy: {
        proxima_mantencion: 'asc',
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        ubicacion: true,
        proxima_mantencion: true,
        estado: true,
      },
    })
    
    // Equipos críticos
    const equiposCriticos = await prisma.equipo.findMany({
      where: {
        criticidad: 'critica',
      },
      include: {
        _count: {
          select: {
            ordenesTrabajo: true,
            mantenimientos: true,
          },
        },
      },
    })
    
    const reporte = {
      fecha_generacion: new Date(),
      resumen: {
        total_equipos: totalEquipos,
        por_estado: equiposPorEstado,
        por_tipo: equiposPorTipo,
        por_criticidad: equiposPorCriticidad,
      },
      proximos_mantenimientos: proximosMantenimientos,
      equipos_criticos: equiposCriticos,
    }
    
    if (formato === 'json') {
      return NextResponse.json(reporte)
    }
    
    // Aquí podrías generar PDF con jsPDF si formato === 'pdf'
    return NextResponse.json(reporte)
  } catch (error: any) {
    console.error('[v0] Error generating reporte:', error)
    return NextResponse.json(
      { error: error.message || 'Error al generar reporte' },
      { status: error.message === 'No autorizado' ? 401 : 500 }
    )
  }
}
