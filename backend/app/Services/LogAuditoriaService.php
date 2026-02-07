<?php

namespace App\Services;

use App\Models\LogAuditoria;
use Illuminate\Support\Facades\Log;

class LogAuditoriaService
{
    /**
     * Get all logs with optional filtering
     */
    public function getAllLogs($search = null, $action = null, $perPage = 10)
    {
        Log::info('[LogAuditoriaService] getAllLogs - Starting', [
            'search' => $search,
            'action' => $action,
            'per_page' => $perPage
        ]);

        $query = LogAuditoria::with('usuario')
            ->orderBy('created_at', 'desc');

        // Search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('accion', 'like', "%{$search}%")
                  ->orWhere('detalle', 'like', "%{$search}%")
                  ->orWhereHas('usuario', function ($q) use ($search) {
                      $q->where('nombre', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Action filter
        if ($action && $action !== 'all') {
            $query->where('accion', $action);
        }

        $logs = $query->paginate($perPage);

        Log::info('[LogAuditoriaService] getAllLogs - Logs retrieved', [
            'count' => $logs->count(),
            'total' => $logs->total(),
            'first_log' => $logs->first()
        ]);

        return $logs;
    }

    /**
     * Create a new audit log entry
     */
    public function createLog($usuarioId, $accion, $detalle, $ipAddress = null)
    {
        try {
            Log::info('[LogAuditoriaService] createLog - Creating log', [
                'usuario_id' => $usuarioId,
                'accion' => $accion,
                'detalle' => $detalle
            ]);

            $log = LogAuditoria::create([
                'usuario_id' => $usuarioId,
                'accion' => $accion,
                'detalle' => $detalle,
                'ip_address' => $ipAddress ?? request()->ip(),
            ]);

            Log::info('[LogAuditoriaService] createLog - Log created successfully', [
                'log_id' => $log->id
            ]);

            return $log;
        } catch (\Exception $e) {
            Log::error('[LogAuditoriaService] createLog - Error: ' . $e->getMessage());
            throw $e;
        }
    }
}
