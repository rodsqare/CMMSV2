<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Models\Equipo;
use App\Models\MantenimientoPreventivo;
use App\Models\OrdenTrabajo;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Obtener estadísticas generales del dashboard
     */
    public function stats(): JsonResponse
    {
        try {
            $usuariosCount = Usuario::count();
            $equiposCount = Equipo::count();
            $mantenimientosCount = MantenimientoPreventivo::count();
            $ordenesCount = OrdenTrabajo::count();

            // Equipos por fabricante
            $equiposPorFabricante = Equipo::selectRaw('fabricante as nombre, COUNT(*) as cantidad')
                ->groupBy('fabricante')
                ->get()
                ->toArray();

            // Mantenimientos por mes
            $mantenimientosPorMes = MantenimientoPreventivo::selectRaw('DATE_FORMAT(proxima_fecha, "%Y-%m") as mes, COUNT(*) as cantidad')
                ->where('proxima_fecha', '>=', now()->subMonths(12))
                ->groupBy('mes')
                ->orderBy('mes')
                ->get()
                ->map(fn($item) => [
                    'mes' => $item->mes,
                    'cantidad' => $item->cantidad
                ])
                ->toArray();

            return response()->json([
                'usuariosCount' => $usuariosCount,
                'equiposCount' => $equiposCount,
                'mantenimientosCount' => $mantenimientosCount,
                'ordenesCount' => $ordenesCount,
                'equiposPorFabricante' => $equiposPorFabricante,
                'mantenimientosPorMes' => $mantenimientosPorMes,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error fetching dashboard stats',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
