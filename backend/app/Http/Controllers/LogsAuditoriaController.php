<?php

namespace App\Http\Controllers;

use App\Models\LogAuditoria;
use App\Services\LogAuditoriaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LogsAuditoriaController extends Controller
{
    protected $logService;

    public function __construct(LogAuditoriaService $logService)
    {
        $this->logService = $logService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            Log::info('[LogsAuditoriaController] index - Getting logs', [
                'search' => $request->input('search'),
                'action' => $request->input('action'),
                'per_page' => $request->input('per_page', 50)
            ]);

            $logs = $this->logService->getAllLogs(
                $request->input('search'),
                $request->input('action'),
                $request->input('per_page', 50)
            );

            $formattedLogs = $logs->map(function ($log) {
                $usuario = 'Sistema';
                
                if ($log->usuario) {
                    $usuario = $log->usuario->nombre ?: $log->usuario->email;
                } else if ($log->usuario_id) {
                    $user = \App\Models\Usuario::find($log->usuario_id);
                    if ($user) {
                        $usuario = $user->nombre ?: $user->email;
                    } else {
                        $usuario = 'Usuario Desconocido';
                    }
                }
                
                return [
                    'id' => $log->id,
                    'timestamp' => $log->created_at->format('Y-m-d H:i:s'),
                    'fecha_hora' => $log->created_at->format('Y-m-d H:i:s'),
                    'usuario' => $usuario,
                    'usuario_id' => $log->usuario_id,
                    'accion' => ucfirst($log->accion),
                    'modulo' => $this->extractModuleFromDetail($log->detalle),
                    'descripcion' => $log->detalle,
                    'detalle' => $log->detalle,
                    'ip_address' => $log->ip_address,
                ];
            });

            Log::info('[LogsAuditoriaController] index - Logs retrieved successfully', [
                'count' => $logs->count(),
                'total' => $logs->total(),
                'first_log' => $formattedLogs->first()
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'data' => $formattedLogs,
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('[LogsAuditoriaController] index - Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los logs de auditoría',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function extractModuleFromDetail(string $detalle): string
    {
        $detalleLower = strtolower($detalle);
        
        if (str_contains($detalleLower, 'orden de trabajo') || str_contains($detalleLower, 'orden')) {
            return 'Órdenes de Trabajo';
        }
        if (str_contains($detalleLower, 'equipo')) {
            return 'Equipos';
        }
        if (str_contains($detalleLower, 'usuario')) {
            return 'Usuarios';
        }
        if (str_contains($detalleLower, 'mantenimiento')) {
            return 'Mantenimientos';
        }
        if (str_contains($detalleLower, 'reporte')) {
            return 'Reportes';
        }
        return 'Sistema';
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        try {
            Log::info('[LogsAuditoriaController] show - Getting log', ['id' => $id]);

            $log = LogAuditoria::with('usuario')->findOrFail($id);

            Log::info('[LogsAuditoriaController] show - Log retrieved successfully');

            return response()->json($log);
        } catch (\Exception $e) {
            Log::error('[LogsAuditoriaController] show - Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 404);
        }
    }
}
