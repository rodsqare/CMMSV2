<?php

namespace App\Http\Controllers;

use App\Models\OrdenTrabajo;
use App\Http\Requests\StoreOrdenTrabajoRequest;
use App\Http\Requests\UpdateOrdenTrabajoRequest;
use App\Services\OrdenTrabajoService;
use App\Services\OrdenTrabajoPDFService;
use App\Http\Resources\OrdenTrabajoResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class OrdenesTrabajoController extends Controller
{
    protected $ordenService;
    protected $pdfService;

    public function __construct(OrdenTrabajoService $ordenService, OrdenTrabajoPDFService $pdfService)
    {
        $this->ordenService = $ordenService;
        $this->pdfService = $pdfService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'estado', 
                'prioridad', 
                'tipo', 
                'fechaDesde', 
                'fechaHasta', 
                'search',
                'perPage'
            ]);

            $ordenes = $this->ordenService->getAllOrdenes($filters);

            return response()->json(OrdenTrabajoResource::collection($ordenes));
            
        } catch (\Exception $e) {
            Log::error('Error al listar órdenes de trabajo: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las órdenes de trabajo'
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreOrdenTrabajoRequest $request): JsonResponse
    {
        try {
            $orden = $this->ordenService->createOrden($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Orden de trabajo creada correctamente',
                'data' => new OrdenTrabajoResource($orden)
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error al crear orden de trabajo: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la orden de trabajo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id): JsonResponse
    {
        try {
            $orden = $this->ordenService->getOrdenById($id);

            if (!$orden) {
                return response()->json([
                    'success' => false,
                    'message' => 'Orden de trabajo no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => new OrdenTrabajoResource($orden)
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener orden de trabajo: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la orden de trabajo'
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateOrdenTrabajoRequest $request, OrdenTrabajo $orden): JsonResponse
    {
        try {
            $ordenActualizada = $this->ordenService->updateOrden($orden, $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Orden de trabajo actualizada correctamente',
                'data' => new OrdenTrabajoResource($ordenActualizada)
            ]);
        } catch (\Exception $e) {
            Log::error('Error al actualizar orden de trabajo: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la orden de trabajo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(OrdenTrabajo $orden): JsonResponse
    {
        try {
            Log::info('[v0] OrdenesTrabajoController::destroy - Starting deletion', [
                'orden_id' => $orden->id_orden,
                'numero_orden' => $orden->numero_orden
            ]);
            
            $deleted = $this->ordenService->deleteOrden($orden);
            
            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'Orden de trabajo eliminada correctamente'
                ], 200);
            }
            
            return response()->json([
                'success' => false,
                'error' => 'No se pudo eliminar la orden de trabajo',
                'message' => 'El método delete() retornó false'
            ], 500);
        } catch (\Exception $e) {
            Log::error('[v0] OrdenesTrabajoController::destroy - Exception caught', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Error al eliminar orden de trabajo',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Asignar técnico a la orden
     */
    public function asignarTecnico(Request $request, OrdenTrabajo $orden): JsonResponse
    {
        try {
            $request->validate([
                'tecnico_id' => 'required|exists:usuarios,id'
            ]);

            $orden = $this->ordenService->asignarTecnico($orden, $request->tecnico_id);

            return response()->json([
                'success' => true,
                'message' => 'Técnico asignado correctamente',
                'data' => new OrdenTrabajoResource($orden)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar técnico: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cambiar estado de la orden
     */
    public function cambiarEstado(Request $request, OrdenTrabajo $orden): JsonResponse
    {
        try {
            $request->validate([
                'estado' => 'required|string|in:abierta,en_proceso,completada,cancelada,pausada,pendiente_repuestos',
                'observaciones' => 'nullable|string'
            ]);

            $orden = $this->ordenService->cambiarEstado($orden, $request->estado, $request->observaciones);

            return response()->json([
                'success' => true,
                'message' => 'Estado actualizado correctamente',
                'data' => new OrdenTrabajoResource($orden)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export work order to PDF
     */
    public function exportPDF(OrdenTrabajo $orden)
    {
        try {
            $pdf = $this->pdfService->generatePDF($orden);
            $filename = $this->pdfService->getFilename($orden);

            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('Error al exportar orden de trabajo a PDF: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al generar el PDF: ' . $e->getMessage()
            ], 500);
        }
    }
}
