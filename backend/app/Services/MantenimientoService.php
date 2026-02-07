<?php

namespace App\Services;

use App\Models\ProgramarMantenimiento;
use App\Models\OrdenTrabajo;
use App\Models\Notificacion;
use App\Traits\LogsAuditActivity;
use App\Traits\CreatesNotifications;
use Illuminate\Database\Eloquent\Collection;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class MantenimientoService
{
    use LogsAuditActivity;
    use CreatesNotifications;

    /**
     * Obtener todos los mantenimientos
     */
    public function getAllMantenimientos(array $filters = []): Collection
    {
        $query = ProgramarMantenimiento::with(['equipo']);

        if (!empty($filters['tipo'])) {
            $query->where('tipo', $filters['tipo']);
        }

        if (!empty($filters['frecuencia'])) {
            $query->where('frecuencia', $filters['frecuencia']);
        }

        return $query->get();
    }

    /**
     * Obtener un mantenimiento por ID
     */
    public function getMantenimientoById(int $id): ?ProgramarMantenimiento
    {
        $mantenimiento = ProgramarMantenimiento::with(['equipo'])->find($id);
        if ($mantenimiento) {
            $this->logViewed('mantenimiento', $id);
        }
        return $mantenimiento;
    }

    /**
     * Crear un nuevo mantenimiento
     */
    public function createMantenimiento(array $data): ProgramarMantenimiento
    {
        Log::info('[MantenimientoService] Creating mantenimiento with data:', $data);
        
        $fillableData = array_intersect_key($data, array_flip([
            'id_equipo', 'tipo', 'frecuencia', 'proxima_fecha', 
            'ultima_fecha', 'resultado', 'observaciones', 'responsable_id'
        ]));
        
        Log::info('[MantenimientoService] Filtered data:', $fillableData);
        
        try {
            $mantenimiento = ProgramarMantenimiento::create($fillableData);
            Log::info('[MantenimientoService] Mantenimiento created successfully:', ['id' => $mantenimiento->id_mantenimiento]);
            
            $this->logCreated('mantenimiento', $mantenimiento);
            
            if (isset($fillableData['responsable_id']) && $fillableData['responsable_id'] && isset($fillableData['proxima_fecha'])) {
                $diasHasta = Carbon::parse($fillableData['proxima_fecha'])->diffInDays(Carbon::now(), false);
                Log::info('[Notificaciones] Checking if should notify for maintenance', [
                    'responsable_id' => $fillableData['responsable_id'],
                    'proxima_fecha' => $fillableData['proxima_fecha'],
                    'dias_hasta' => $diasHasta
                ]);
                
                if ($diasHasta >= 0 && $diasHasta <= 7) {
                    $equipoNombre = $mantenimiento->equipo->nombre_equipo ?? 'Equipo';
                    $fecha = Carbon::parse($fillableData['proxima_fecha'])->format('d/m/Y');
                    $this->notifyMantenimientoPending($fillableData['responsable_id'], $equipoNombre, $fecha);
                    Log::info('[Notificaciones] Created notification for upcoming maintenance', [
                        'responsable_id' => $fillableData['responsable_id'],
                        'equipo' => $equipoNombre,
                        'fecha' => $fecha
                    ]);
                }
            }
            
            $this->checkAndCreateOrdenTrabajo($mantenimiento);
            
            return $mantenimiento->fresh(['equipo']);
        } catch (\Exception $e) {
            Log::error('[MantenimientoService] Error creating mantenimiento:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Actualizar un mantenimiento existente
     */
    public function updateMantenimiento(ProgramarMantenimiento $mantenimiento, array $data): ProgramarMantenimiento
    {
        $fillableData = array_intersect_key($data, array_flip([
            'id_equipo', 'tipo', 'frecuencia', 'proxima_fecha', 
            'ultima_fecha', 'resultado', 'observaciones', 'responsable_id'
        ]));
        
        $changes = array_diff_assoc($fillableData, $mantenimiento->only(array_keys($fillableData)));
        
        $wasCompleted = false;
        if (isset($changes['resultado']) && $changes['resultado'] === 'completado' && $mantenimiento->resultado !== 'completado') {
            $wasCompleted = true;
        }

        $mantenimiento->update($fillableData);
        
        $this->logUpdated('mantenimiento', $mantenimiento, $changes);

        if ($wasCompleted && $mantenimiento->responsable_id) {
            $equipoNombre = $mantenimiento->equipo->nombre_equipo ?? 'Equipo';
            $fecha = Carbon::now()->format('d/m/Y');
            $this->notifyMantenimientoCompleted($mantenimiento->responsable_id, $equipoNombre, $fecha);
            Log::info('[Notificaciones] Created notification for completed maintenance', [
                'responsable_id' => $mantenimiento->responsable_id,
                'equipo' => $equipoNombre
            ]);
        }
        
        if (isset($fillableData['responsable_id']) && $fillableData['responsable_id'] && isset($fillableData['proxima_fecha'])) {
            $diasHasta = Carbon::parse($fillableData['proxima_fecha'])->diffInDays(Carbon::now(), false);
            if ($diasHasta >= 0 && $diasHasta <= 7) {
                $equipoNombre = $mantenimiento->equipo->nombre_equipo ?? 'Equipo';
                $fecha = Carbon::parse($fillableData['proxima_fecha'])->format('d/m/Y');
                $this->notifyMantenimientoPending($fillableData['responsable_id'], $equipoNombre, $fecha);
                Log::info('[Notificaciones] Created notification for updated maintenance', [
                    'responsable_id' => $fillableData['responsable_id'],
                    'equipo' => $equipoNombre
                ]);
            }
        }
        
        $this->checkAndCreateOrdenTrabajo($mantenimiento);
        
        return $mantenimiento->fresh(['equipo']);
    }

    /**
     * Eliminar un mantenimiento
     */
    public function deleteMantenimiento(ProgramarMantenimiento $mantenimiento): bool
    {
        $id = $mantenimiento->id_mantenimiento;
        $deleted = $mantenimiento->delete();
        if ($deleted) {
            $this->logDeleted('mantenimiento', $id);
        }
        return $deleted;
    }

    /**
     * Verificar y crear orden de trabajo si faltan 7 días o menos
     */
    private function checkAndCreateOrdenTrabajo(ProgramarMantenimiento $mantenimiento): void
    {
        $proximaFecha = Carbon::parse($mantenimiento->proxima_fecha);
        $diasFaltantes = now()->diffInDays($proximaFecha, false);

        // Si faltan 7 días o menos y la fecha es futura
        if ($diasFaltantes <= 7 && $diasFaltantes > 0) {
            // Verificar si ya existe una orden para este mantenimiento
            $ordenExistente = OrdenTrabajo::where('id_equipo', $mantenimiento->id_equipo)
                ->where('descripcion', 'like', "%Mantenimiento preventivo: {$mantenimiento->tipo}%")
                ->where('estado', 'abierta')
                ->exists();

            if (!$ordenExistente) {
                $lastOrden = OrdenTrabajo::orderBy('id_orden', 'desc')->first();
                $nextNumber = $lastOrden ? (intval(substr($lastOrden->numero_orden, 3)) + 1) : 1;
                $numeroOrden = 'OT-' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
                
                OrdenTrabajo::create([
                    'numero_orden' => $numeroOrden,
                    'id_equipo' => $mantenimiento->id_equipo,
                    'descripcion' => "Mantenimiento preventivo: {$mantenimiento->tipo}",
                    'prioridad' => $diasFaltantes <= 3 ? 'critica' : 'media',
                    'estado' => 'abierta',
                    'notas' => "Generado automáticamente. Faltan {$diasFaltantes} días para el mantenimiento."
                ]);
            }
        }
    }

    /**
     * Obtener mantenimientos próximos (7 días o menos)
     */
    public function getMantenimientosProximos(): Collection
    {
        $fechaLimite = now()->addDays(7);
        
        return ProgramarMantenimiento::with(['equipo'])
            ->where('proxima_fecha', '<=', $fechaLimite)
            ->where('proxima_fecha', '>=', now())
            ->orderBy('proxima_fecha', 'asc')
            ->get();
    }

    /**
     * Verificar mantenimientos próximos a vencer y crear notificaciones
     */
    public function checkAndNotifyUpcomingMaintenances(): array
    {
        $now = Carbon::now();
        $fechaLimite = $now->copy()->addDays(7);
        
        $mantenimientos = ProgramarMantenimiento::with(['equipo'])
            ->where(function($query) use ($now, $fechaLimite) {
                // Upcoming: between now and 7 days later
                $query->whereBetween('proxima_fecha', [$now, $fechaLimite])
                      ->where('resultado', 'pendiente');
            })
            ->orWhere(function($query) use ($now) {
                // Overdue: before now
                $query->where('proxima_fecha', '<', $now)
                      ->where('resultado', 'pendiente');
            })
            ->whereNotNull('responsable_id')
            ->get();
        
        $notificationsCreated = 0;
        $results = [];
        
        foreach ($mantenimientos as $mantenimiento) {
            $proximaFecha = Carbon::parse($mantenimiento->proxima_fecha);
            $diasHasta = $proximaFecha->diffInDays($now, false); // Negative if future, Positive if past
            $isOverdue = $proximaFecha->lt($now);

            $tipoNotificacion = $isOverdue ? 'error' : 'warning';
            $tituloNotificacion = $isOverdue ? 'Mantenimiento Vencido' : 'Mantenimiento Próximo';
            
            // Verificar si ya existe una notificación RECIENTE para este mantenimiento y tipo
            $notificationExists = Notificacion::where('usuario_id', $mantenimiento->responsable_id)
                ->where('titulo', $tituloNotificacion)
                ->where('mensaje', 'like', "%{$mantenimiento->equipo->nombre_equipo}%")
                ->where('created_at', '>=', $now->copy()->subHours(24))
                ->exists();
            
            if (!$notificationExists) {
                $equipoNombre = $mantenimiento->equipo->nombre_equipo ?? 'Equipo';
                $fecha = $proximaFecha->format('d/m/Y');
                
                if ($isOverdue) {
                    $this->notifyMantenimientoOverdue($mantenimiento->responsable_id, $equipoNombre, $fecha);
                } else {
                    $this->notifyMantenimientoPending($mantenimiento->responsable_id, $equipoNombre, $fecha);
                }
                
                $notificationsCreated++;
                $results[] = [
                    'mantenimiento_id' => $mantenimiento->id_mantenimiento,
                    'equipo' => $equipoNombre,
                    'tipo' => $isOverdue ? 'vencido' : 'proximo',
                    'responsable_id' => $mantenimiento->responsable_id,
                    'fecha' => $fecha
                ];
                
                Log::info('[Notificaciones] Created notification', [
                    'type' => $isOverdue ? 'overdue' : 'upcoming',
                    'mantenimiento_id' => $mantenimiento->id_mantenimiento,
                    'responsable_id' => $mantenimiento->responsable_id
                ]);
            }
        }
        
        Log::info('[Notificaciones] Checked upcoming and overdue maintenances', [
            'total_found' => $mantenimientos->count(),
            'notifications_created' => $notificationsCreated
        ]);
        
        return [
            'total_mantenimientos' => $mantenimientos->count(),
            'notificaciones_creadas' => $notificationsCreated,
            'detalles' => $results
        ];
    }

    /**
     * Obtener mantenimientos por equipo
     */
    public function getMantenimientosByEquipo(int $equipoId): Collection
    {
        return ProgramarMantenimiento::where('id_equipo', $equipoId)
            ->orderBy('proxima_fecha', 'desc')
            ->get();
    }
}
