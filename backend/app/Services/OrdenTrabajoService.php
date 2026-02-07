<?php

namespace App\Services;

use App\Models\OrdenTrabajo;
use App\Traits\LogsAuditActivity;
use App\Traits\CreatesNotifications;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class OrdenTrabajoService
{
    use LogsAuditActivity;
    use CreatesNotifications;

    /**
     * Get all ordenes with filters and pagination
     */
    public function getAllOrdenes($filters = []): LengthAwarePaginator
    {
        $query = OrdenTrabajo::with(['equipo', 'tecnicoAsignado']);

        // Apply filters
        if (!empty($filters['estado']) && $filters['estado'] !== 'all') {
            $query->where('estado', $filters['estado']);
        }

        if (!empty($filters['prioridad']) && $filters['prioridad'] !== 'all') {
            $query->where('prioridad', $filters['prioridad']);
        }

        if (!empty($filters['tipo']) && $filters['tipo'] !== 'all') {
            $query->where('tipo', $filters['tipo']);
        }

        if (!empty($filters['fechaDesde'])) {
            $query->whereDate('fecha_creacion', '>=', $filters['fechaDesde']);
        }

        if (!empty($filters['fechaHasta'])) {
            $query->whereDate('fecha_creacion', '<=', $filters['fechaHasta']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('numero_orden', 'like', "%{$search}%")
                  ->orWhere('descripcion', 'like', "%{$search}%")
                  ->orWhereHas('equipo', function($eq) use ($search) {
                      $eq->where('nombre', 'like', "%{$search}%");
                  });
            });
        }

        // Sorting
        $query->orderBy('fecha_creacion', 'desc');

        // Pagination
        $perPage = $filters['perPage'] ?? 10;
        
        return $query->paginate($perPage);
    }

    /**
     * Obtener una orden por ID
     */
    public function getOrdenById(int $id): ?OrdenTrabajo
    {
        $orden = OrdenTrabajo::with(['equipo', 'tecnicoAsignado'])->find($id);
        if ($orden) {
            $this->logViewed('orden de trabajo', $id);
        }
        return $orden;
    }

    /**
     * Crear una nueva orden de trabajo
     */
    public function createOrden(array $data): OrdenTrabajo
    {
        if (!isset($data['numero_orden'])) {
            $year = date('Y');
            $lastOrden = OrdenTrabajo::whereYear('fecha_creacion', $year)
                ->orderBy('id_orden', 'desc')
                ->first();
            
            $nextNumber = $lastOrden ? (intval(substr($lastOrden->numero_orden, -3)) + 1) : 1;
            $data['numero_orden'] = sprintf('OT-%s-%03d', $year, $nextNumber);
        }

        // Set default values
        $data['estado'] = $data['estado'] ?? 'abierta';
        $data['fecha_creacion'] = $data['fecha_creacion'] ?? date('Y-m-d');

        $orden = OrdenTrabajo::create($data);
        $this->logCreated('orden de trabajo', $orden);
        
        if (isset($data['tecnico_asignado_id']) && $data['tecnico_asignado_id']) {
            $this->notifyOrdenCreated($data['tecnico_asignado_id'], $data['numero_orden']);
            Log::info('[Notificaciones] Created notification for assigned technician', [
                'tecnico_id' => $data['tecnico_asignado_id'],
                'orden' => $data['numero_orden']
            ]);
        }
        
        return $orden;
    }

    /**
     * Actualizar una orden de trabajo existente
     */
    public function updateOrden(OrdenTrabajo $orden, array $data): OrdenTrabajo
    {
        $changes = array_diff_assoc($data, $orden->only(array_keys($data)));
        
        $wasCompleted = isset($data['estado']) && $data['estado'] === 'completada' && $orden->estado !== 'completada';
        $wasAssigned = isset($data['tecnico_asignado_id']) && 
                      $data['tecnico_asignado_id'] && 
                      $orden->tecnico_asignado_id !== $data['tecnico_asignado_id'];
        
        $orden->update($data);
        $this->logUpdated('orden de trabajo', $orden, $changes);
        
        if ($wasAssigned) {
            $this->notifyOrdenCreated($data['tecnico_asignado_id'], $orden->numero_orden);
            Log::info('[Notificaciones] Created notification for newly assigned technician', [
                'tecnico_id' => $data['tecnico_asignado_id'],
                'orden' => $orden->numero_orden
            ]);
        }
        
        if ($wasCompleted && $orden->tecnico_asignado_id) {
            $this->notifyOrdenCompleted($orden->tecnico_asignado_id, $orden->numero_orden);
            Log::info('[Notificaciones] Created notification for completed orden', [
                'tecnico_id' => $orden->tecnico_asignado_id,
                'orden' => $orden->numero_orden
            ]);
        }
        
        return $orden->fresh(['equipo', 'tecnicoAsignado']);
    }

    /**
     * Eliminar una orden de trabajo
     */
    public function deleteOrden(OrdenTrabajo $orden): bool
    {
        Log::info('[v0] OrdenTrabajoService::deleteOrden - Starting deletion', [
            'orden_id' => $orden->id_orden,
            'numero_orden' => $orden->numero_orden,
            'exists' => $orden->exists
        ]);
        
        try {
            $ordenId = $orden->id_orden;
            
            DB::beginTransaction();
            
            try {
                $deleted = $orden->delete();
                
                Log::info('[v0] OrdenTrabajoService::deleteOrden - Delete method completed', [
                    'orden_id' => $ordenId,
                    'delete_result' => $deleted,
                    'result_type' => gettype($deleted)
                ]);
                
                if ($deleted === false || $deleted === null) {
                    DB::rollBack();
                    Log::error('[v0] OrdenTrabajoService::deleteOrden - Delete returned false/null, rolling back');
                    return false;
                }
                
                $this->logDeleted('orden de trabajo', $ordenId);
                
                DB::commit();
                
                $stillExists = OrdenTrabajo::find($ordenId);
                Log::info('[v0] OrdenTrabajoService::deleteOrden - Verification check', [
                    'orden_id' => $ordenId,
                    'still_exists_in_db' => $stillExists !== null
                ]);
                
                if ($stillExists) {
                    Log::error('[v0] OrdenTrabajoService::deleteOrden - Record still exists after delete');
                    return false;
                }
                
                Log::info('[v0] OrdenTrabajoService::deleteOrden - Successfully deleted');
                return true;
                
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('[v0] OrdenTrabajoService::deleteOrden - Transaction error', [
                    'orden_id' => $ordenId,
                    'error' => $e->getMessage(),
                    'code' => $e->getCode()
                ]);
                throw $e;
            }
            
        } catch (\Exception $e) {
            Log::error('[v0] OrdenTrabajoService::deleteOrden - Exception caught', [
                'orden_id' => $orden->id_orden ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    /**
     * Obtener órdenes por estado
     */
    public function getOrdenesByEstado(string $estado): Collection
    {
        return OrdenTrabajo::with(['equipo', 'tecnicoAsignado'])
            ->where('estado', $estado)
            ->get();
    }

    /**
     * Obtener órdenes por prioridad
     */
    public function getOrdenesByPrioridad(string $prioridad): Collection
    {
        return OrdenTrabajo::with(['equipo', 'tecnicoAsignado'])
            ->where('prioridad', $prioridad)
            ->get();
    }

    /**
     * Obtener órdenes por técnico
     */
    public function getOrdenesByTecnico(int $tecnicoId): Collection
    {
        return OrdenTrabajo::with(['equipo', 'tecnicoAsignado'])
            ->where('tecnico_asignado_id', $tecnicoId)
            ->get();
    }

    /**
     * Asignar técnico a una orden
     */
    public function asignarTecnico(OrdenTrabajo $orden, int $tecnicoId): OrdenTrabajo
    {
        $orden->update(['tecnico_asignado_id' => $tecnicoId]);
        $this->notifyOrdenCreated($tecnicoId, $orden->numero_orden);
        Log::info('[Notificaciones] Created notification for assigned technician', [
            'tecnico_id' => $tecnicoId,
            'orden' => $orden->numero_orden
        ]);
        $this->logAudit('actualizar', "Asignó técnico ID: {$tecnicoId} a orden de trabajo ID: {$orden->id_orden}");
        return $orden->fresh(['equipo', 'tecnicoAsignado']);
    }

    /**
     * Cambiar estado de una orden
     */
    public function cambiarEstado(OrdenTrabajo $orden, string $nuevoEstado): OrdenTrabajo
    {
        $estadoAnterior = $orden->estado;
        $orden->update(['estado' => $nuevoEstado]);
        $this->logAudit('actualizar', "Cambió estado de orden de trabajo ID: {$orden->id_orden} de '{$estadoAnterior}' a '{$nuevoEstado}'");
        return $orden->fresh(['equipo', 'tecnicoAsignado']);
    }

    /**
     * Contar órdenes por estado
     */
    public function countByEstado(): array
    {
        return OrdenTrabajo::selectRaw('estado, COUNT(*) as total')
            ->groupBy('estado')
            ->pluck('total', 'estado')
            ->toArray();
    }
}
