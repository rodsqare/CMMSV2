import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    const ordenId = parseInt(id)

    if (isNaN(ordenId)) {
      return NextResponse.json(
        { error: 'ID de orden inválido' },
        { status: 400 }
      )
    }

    const orden = await prisma.orden_trabajo.findUnique({
      where: { id: ordenId },
      include: {
        equipo: true,
        creador: {
          select: {
            nombre: true,
            email: true,
          },
        },
        tecnico: {
          select: {
            nombre: true,
            email: true,
          },
        },
      },
    })

    if (!orden) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    // Format the data for PDF generation
    const content = `
ORDEN DE TRABAJO

Número de Orden: ${orden.numero_orden}
Estado: ${orden.estado}
Prioridad: ${orden.prioridad}

EQUIPO:
Código: ${orden.equipo?.codigo}
Nombre: ${orden.equipo?.nombre}
Ubicación: ${orden.equipo?.ubicacion}

DESCRIPCIÓN:
${orden.descripcion}

TIPO: ${orden.tipo}

TÉCNICO ASIGNADO:
${orden.tecnico?.nombre || 'Sin asignar'}
Email: ${orden.tecnico?.email || 'N/A'}

CREADO POR:
${orden.creador?.nombre}
Email: ${orden.creador?.email}

INFORMACIÓN TÉCNICA:
Fecha de Creación: ${orden.fecha_solicitud ? new Date(orden.fecha_solicitud).toLocaleDateString('es-ES') : 'N/A'}
Fecha Programada: ${orden.fecha_programada ? new Date(orden.fecha_programada).toLocaleDateString('es-ES') : 'N/A'}
Tiempo Estimado: ${orden.tiempo_estimado ? orden.tiempo_estimado + ' horas' : 'N/A'}
Costo Estimado: ${orden.costo_estimado ? '$' + orden.costo_estimado : 'N/A'}

NOTAS:
${orden.notas || 'Sin notas'}

---
Generado el: ${new Date().toLocaleString('es-ES')}
    `.trim()

    // Return as text/plain for now (can be enhanced to actual PDF later)
    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="orden_${orden.numero_orden}.txt"`,
      },
    })
  } catch (error: any) {
    console.error('[v0] Error exporting PDF:', error)
    return NextResponse.json(
      { error: error.message || 'Error al generar el PDF' },
      { status: 500 }
    )
  }
}
