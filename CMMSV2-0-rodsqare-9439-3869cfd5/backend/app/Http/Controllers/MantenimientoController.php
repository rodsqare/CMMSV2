<?php

namespace App\Http\Controllers;

use App\Models\ProgramarMantenimiento;
use App\Models\OrdenTrabajo;
use App\Services\MantenimientoService;
use App\Http\Requests\StoreMantenimientoRequest;
use App\Http\Requests\UpdateMantenimientoRequest;
use App\Http\Resources\MantenimientoResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class MantenimientoController extends Controller
{
    protected $mantenimientoService;

    public function __construct(MantenimientoService $mantenimientoService)
    {
        $this->mantenimientoService = $mantenimientoService;
    }

    /**
     * Listar todos los mantenimientos
     */
    public function index(Request $request): ResourceCollection
    {
        $filters = $request->only(['tipo', 'frecuencia']);
        $mantenimientos = $this->mantenimientoService->getAllMantenimientos($filters);
        return MantenimientoResource::collection($mantenimientos);
    }

    /**
     * Obtener un mantenimiento específico
     */
    public function show(ProgramarMantenimiento $mantenimiento): MantenimientoResource
    {
        return new MantenimientoResource($mantenimiento);
    }

    /**
     * Crear nuevo mantenimiento
     */
    public function store(StoreMantenimientoRequest $request): JsonResponse
    {
        try {
            Log::info('[MantenimientoController] Store request received:', $request->all());
            Log::info('[MantenimientoController] Validated data:', $request->validated());
            
            $mantenimiento = $this->mantenimientoService->createMantenimiento($request->validated());
            
            Log::info('[MantenimientoController] Mantenimiento created successfully:', ['id' => $mantenimiento->id_mantenimiento]);
            
            return response()->json(new MantenimientoResource($mantenimiento), 201);
        } catch (\Exception $e) {
            Log::error('[MantenimientoController] Error creating mantenimiento:', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Error creating mantenimiento',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar mantenimiento
     */
    public function update(UpdateMantenimientoRequest $request, ProgramarMantenimiento $mantenimiento): JsonResponse
    {
        try {
            $mantenimiento = $this->mantenimientoService->updateMantenimiento($mantenimiento, $request->validated());
            return response()->json(new MantenimientoResource($mantenimiento), 200);
        } catch (\Exception $e) {
            Log::error('[MantenimientoController] Error updating mantenimiento:', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Error updating mantenimiento',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar mantenimiento
     */
    public function destroy(ProgramarMantenimiento $mantenimiento): JsonResponse
    {
        try {
            $this->mantenimientoService->deleteMantenimiento($mantenimiento);
            return response()->json(['message' => 'Mantenimiento deleted successfully'], 200);
        } catch (\Exception $e) {
            Log::error('[MantenimientoController] Error deleting mantenimiento:', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Error deleting mantenimiento',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de mantenimientos
     */
    public function stats(): JsonResponse
    {
        try {
            $today = Carbon::today();
            
            // Vencidos: resultado pendiente y fecha pasada
            $vencidos = ProgramarMantenimiento::where('resultado', 'pendiente')
                ->where('proxima_fecha', '<', $today)
                ->count();
            
            // Próximos: resultado pendiente y fecha en los próximos 7 días
            $proximos = ProgramarMantenimiento::where('resultado', 'pendiente')
                ->whereBetween('proxima_fecha', [$today, $today->copy()->addDays(7)])
                ->count();
            
            // Completados
            $completados = ProgramarMantenimiento::where('resultado', 'completado')
                ->count();
            
            // Total
            $total = ProgramarMantenimiento::count();
            
            return response()->json([
                'vencidos' => $vencidos,
                'proximos' => $proximos,
                'completados' => $completados,
                'total' => $total,
            ]);
        } catch (\Exception $e) {
            Log::error('[MantenimientoController] Error fetching stats:', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return response()->json([
                'error' => 'Error fetching maintenance stats',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar mantenimientos próximos a vencer y crear notificaciones
     */
    public function checkUpcoming(): JsonResponse
    {
        try {
            $result = $this->mantenimientoService->checkAndNotifyUpcomingMaintenances();
            
            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            Log::error('[MantenimientoController] Error checking upcoming maintenances:', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return response()->json([
                'error' => 'Error checking upcoming maintenances',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
