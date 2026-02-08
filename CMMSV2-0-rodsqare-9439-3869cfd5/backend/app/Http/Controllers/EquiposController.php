<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Services\EquipoService;
use App\Http\Requests\StoreEquipoRequest;
use App\Http\Requests\UpdateEquipoRequest;
use App\Http\Resources\EquipoResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;

class EquiposController extends Controller
{
    protected $equipoService;

    public function __construct(EquipoService $equipoService)
    {
        $this->equipoService = $equipoService;
    }

    /**
     * Listar todos los equipos
     */
    public function index(): ResourceCollection
    {
        $equipos = $this->equipoService->getAllEquipos();
        return EquipoResource::collection($equipos);
    }

    /**
     * Obtener un equipo específico
     */
    public function show(Equipo $equipo): EquipoResource
    {
        $equipo->load(['documentos.subido_por']);
        return new EquipoResource($equipo);
    }

    /**
     * Crear nuevo equipo
     */
    public function store(StoreEquipoRequest $request): JsonResponse
    {
        try {
            $equipo = $this->equipoService->createEquipo($request->validated());
            return response()->json(new EquipoResource($equipo), 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error creating equipo',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar equipo
     */
    public function update(UpdateEquipoRequest $request, Equipo $equipo): JsonResponse
    {
        try {
            $equipo = $this->equipoService->updateEquipo($equipo, $request->validated());
            return response()->json(new EquipoResource($equipo), 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error updating equipo',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar equipo
     */
    public function destroy(Equipo $equipo): JsonResponse
    {
        try {
            $this->equipoService->deleteEquipo($equipo);
            return response()->json(['message' => 'Equipo deleted successfully'], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error deleting equipo',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener asociaciones del equipo (mantenimientos y órdenes de trabajo)
     * Esta endpoint se usa para validar si se puede eliminar un equipo
     */
    public function getAssociations(Equipo $equipo): JsonResponse
    {
        try {
            // Contar mantenimientos asociados
            $mantenimientosCount = $equipo->mantenimientosPreventivos()->count();
            
            // Contar órdenes de trabajo asociadas
            $ordenesTrabajoCount = $equipo->ordenesTrabajo()->count();
            
            return response()->json([
                'data' => [
                    'mantenimientos_count' => $mantenimientosCount,
                    'ordenes_trabajo_count' => $ordenesTrabajoCount,
                    'can_delete' => $mantenimientosCount === 0 && $ordenesTrabajoCount === 0
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error checking equipment associations',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
