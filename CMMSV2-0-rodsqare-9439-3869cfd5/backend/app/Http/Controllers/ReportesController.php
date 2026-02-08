<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Models\OrdenTrabajo;
use App\Models\MantenimientoPreventivo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportesController extends Controller
{
    /**
     * Obtener reportes según el tipo
     */
    public function show(Request $request, string $tipo): JsonResponse
    {
        try {
            $fechaInicio = $request->query('fecha_inicio');
            $fechaFin = $request->query('fecha_fin');

            switch ($tipo) {
                case 'equipos':
                    return $this->reporteEquipos($fechaInicio, $fechaFin);
                case 'mantenimientos':
                    return $this->reporteMantenimientos($fechaInicio, $fechaFin);
                case 'ordenes':
                    return $this->reporteOrdenes($fechaInicio, $fechaFin);
                default:
                    return response()->json(['error' => 'Tipo de reporte no válido'], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error fetching reporte',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reporte de equipos
     */
    private function reporteEquipos(?string $fechaInicio, ?string $fechaFin): JsonResponse
    {
        $query = Equipo::query();

        if ($fechaInicio) {
            $query->where('created_at', '>=', $fechaInicio);
        }
        if ($fechaFin) {
            $query->where('created_at', '<=', $fechaFin);
        }

        $equipos = $query->get();

        return response()->json([
            'tipo' => 'equipos',
            'total' => $equipos->count(),
            'operativos' => $equipos->where('estado', 'operativo')->count(),
            'en_reparacion' => $equipos->where('estado', 'en_reparacion')->count(),
            'datos' => $equipos
        ]);
    }

    /**
     * Reporte de mantenimientos
     */
    private function reporteMantenimientos(?string $fechaInicio, ?string $fechaFin): JsonResponse
    {
        $query = MantenimientoPreventivo::query();

        if ($fechaInicio) {
            $query->where('proxima_fecha', '>=', $fechaInicio);
        }
        if ($fechaFin) {
            $query->where('proxima_fecha', '<=', $fechaFin);
        }

        $mantenimientos = $query->get();

        return response()->json([
            'tipo' => 'mantenimientos',
            'total' => $mantenimientos->count(),
            'completados' => $mantenimientos->where('resultado', 'completado')->count(),
            'pendientes' => $mantenimientos->where('resultado', 'pendiente')->count(),
            'datos' => $mantenimientos
        ]);
    }

    /**
     * Reporte de órdenes de trabajo
     */
    private function reporteOrdenes(?string $fechaInicio, ?string $fechaFin): JsonResponse
    {
        $query = OrdenTrabajo::query();

        if ($fechaInicio) {
            $query->where('created_at', '>=', $fechaInicio);
        }
        if ($fechaFin) {
            $query->where('created_at', '<=', $fechaFin);
        }

        $ordenes = $query->get();

        return response()->json([
            'tipo' => 'ordenes',
            'total' => $ordenes->count(),
            'abiertas' => $ordenes->where('estado', 'abierta')->count(),
            'completadas' => $ordenes->where('estado', 'completada')->count(),
            'datos' => $ordenes
        ]);
    }
}
