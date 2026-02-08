<?php

namespace App\Traits;

use App\Models\LogAuditoria;
use Illuminate\Support\Facades\Log;

trait LogsAuditActivity
{
    /**
     * Obtiene el ID del usuario desde el request o retorna null
     */
    protected function getCurrentUserId(): ?int
    {
        Log::info('[v0] getCurrentUserId called');
        Log::info('[v0] Request method: ' . request()->method());
        Log::info('[v0] Request URL: ' . request()->fullUrl());
        Log::info('[v0] Request all input: ', request()->all());
        Log::info('[v0] Request headers: ', request()->headers->all());
        
        // 1. Desde el body del request
        $usuarioId = request()->input('usuario_id');
        Log::info('[v0] usuario_id from input: ' . ($usuarioId ?? 'NULL'));
        if ($usuarioId && is_numeric($usuarioId)) {
            Log::info('[v0] Returning usuario_id from input: ' . $usuarioId);
            return (int) $usuarioId;
        }

        // 2. Desde el header X-User-ID
        $headerUserId = request()->header('X-User-ID');
        Log::info('[v0] usuario_id from header: ' . ($headerUserId ?? 'NULL'));
        if ($headerUserId && is_numeric($headerUserId)) {
            Log::info('[v0] Returning usuario_id from header: ' . $headerUserId);
            return (int) $headerUserId;
        }

        // 3. Desde query params
        $queryUserId = request()->query('usuario_id');
        Log::info('[v0] usuario_id from query: ' . ($queryUserId ?? 'NULL'));
        if ($queryUserId && is_numeric($queryUserId)) {
            Log::info('[v0] Returning usuario_id from query: ' . $queryUserId);
            return (int) $queryUserId;
        }

        Log::warning('[v0] No usuario_id found in request, returning NULL');
        return null;
    }

    /**
     * Registra una acción en el log de auditoría
     */
    protected function logAudit(string $accion, string $detalle, ?int $usuarioId = null): void
    {
        try {
            $userId = $usuarioId ?? $this->getCurrentUserId();

            $log = LogAuditoria::create([
                'usuario_id' => $userId,
                'accion' => $accion,
                'detalle' => $detalle,
                'ip_address' => request()->ip()
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('[v0] Error creating audit log: ' . $e->getMessage());
        }
    }

    /**
     * Log para creación de registros
     */
    protected function logCreated(string $entity, $model): void
    {
        $this->logAudit(
            'crear',
            "Creó {$entity} con ID: {$model->id}"
        );
    }

    /**
     * Log para actualización de registros
     */
    protected function logUpdated(string $entity, $model, array $changes = [], ?int $usuarioId = null): void
    {
        $detalle = "Actualizó {$entity} con ID: {$model->id}";
        if (!empty($changes)) {
            $detalle .= ". Campos modificados: " . implode(', ', array_keys($changes));
        }
        $this->logAudit('actualizar', $detalle, $usuarioId);
    }

    /**
     * Log para eliminación de registros
     */
    protected function logDeleted(string $entity, $id): void
    {
        $this->logAudit(
            'eliminar',
            "Eliminó {$entity} con ID: {$id}"
        );
    }

    /**
     * Log para visualización de registros
     */
    protected function logViewed(string $entity, $id): void
    {
        $this->logAudit(
            'ver',
            "Visualizó {$entity} con ID: {$id}"
        );
    }
}
