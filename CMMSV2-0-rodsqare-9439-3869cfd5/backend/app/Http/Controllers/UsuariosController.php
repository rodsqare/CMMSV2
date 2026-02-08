<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Services\UsuarioService;
use App\Http\Requests\StoreUsuarioRequest;
use App\Http\Requests\UpdateUsuarioRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Resources\UsuarioResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\Log;
use App\Models\LogAuditoria;
use App\Models\OrdenTrabajo;

class UsuariosController extends Controller
{
    protected $usuarioService;

    public function __construct(UsuarioService $usuarioService)
    {
        $this->usuarioService = $usuarioService;
    }

    /**
     * Listar todos los usuarios
     */
    public function index(): ResourceCollection
    {
        Log::info('[Usuarios] Fetching all usuarios');
        try {
            $usuarios = $this->usuarioService->getAllUsuarios();
            Log::info('[Usuarios] Successfully fetched usuarios', ['count' => $usuarios->count()]);
            return UsuarioResource::collection($usuarios);
        } catch (\Exception $e) {
            Log::error('[Usuarios] Error fetching usuarios', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Obtener un usuario específico
     */
    public function show(Usuario $usuario): UsuarioResource
    {
        Log::info('[Usuarios] Showing usuario', ['id' => $usuario->id]);
        return new UsuarioResource($usuario);
    }

    /**
     * Crear nuevo usuario
     */
    public function store(StoreUsuarioRequest $request): JsonResponse
    {
        try {
            Log::info('[Usuarios] Creating new usuario', ['data' => $request->except(['contrasena'])]);
            
            $usuario = $this->usuarioService->createUsuario($request->validated());
            
            Log::info('[Usuarios] Usuario created successfully', ['id' => $usuario->id]);
            
            return response()->json(new UsuarioResource($usuario), 201);
        } catch (\Exception $e) {
            Log::error('[Usuarios] Error creating usuario', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Error creating usuario',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar usuario
     */
    public function update(UpdateUsuarioRequest $request, Usuario $usuario): JsonResponse
    {
        try {
            Log::info('[Usuarios] Updating usuario', [
                'id' => $usuario->id,
                'data' => $request->except(['contrasena'])
            ]);
            
            $usuario = $this->usuarioService->updateUsuario($usuario, $request->validated());
            
            Log::info('[Usuarios] Usuario updated successfully', ['id' => $usuario->id]);
            
            return response()->json(new UsuarioResource($usuario), 200);
        } catch (\Exception $e) {
            Log::error('[Usuarios] Error updating usuario', [
                'id' => $usuario->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Error updating usuario',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar parcialmente un usuario (PATCH) - usado para cambiar estado
     */
    public function patch(Request $request, $id): JsonResponse
    {
        try {
            $usuario = Usuario::findOrFail($id);
            
            Log::info('[Usuarios] Patching usuario', [
                'id' => $usuario->id,
                'estado_before' => $usuario->estado,
                'data' => $request->all()
            ]);
            
            // Validate estado if provided
            if ($request->has('estado')) {
                $request->validate([
                    'estado' => 'required|string|in:activo,inactivo,Activo,Inactivo'
                ]);
            }
            
            $usuario = $this->usuarioService->updateUsuario($usuario, $request->only(['estado']));
            
            Log::info('[Usuarios] Usuario patched successfully', [
                'id' => $usuario->id,
                'estado_after' => $usuario->estado
            ]);
            
            return response()->json(new UsuarioResource($usuario), 200);
        } catch (\Exception $e) {
            Log::error('[Usuarios] Error patching usuario', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Error updating usuario estado',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar usuario
     */
    public function destroy(Usuario $usuario): JsonResponse
    {
        try {
            Log::info('[Usuarios] Deleting usuario', ['id' => $usuario->id]);
            
            $this->usuarioService->deleteUsuario($usuario);
            
            Log::info('[Usuarios] Usuario deleted successfully', ['id' => $usuario->id]);
            
            return response()->json(['message' => 'Usuario deleted successfully'], 200);
        } catch (\Exception $e) {
            Log::error('[Usuarios] Error deleting usuario', [
                'id' => $usuario->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Error deleting usuario',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restablecer contraseña de usuario
     */
    public function resetPassword(ResetPasswordRequest $request, Usuario $usuario): JsonResponse
    {
        try {
            Log::info('[Usuarios] Resetting password', ['id' => $usuario->id]);
            
            $usuario = $this->usuarioService->resetPassword($usuario, $request->validated()['contrasena']);
            
            Log::info('[Usuarios] Password reset successfully', ['id' => $usuario->id]);
            
            return response()->json([
                'message' => 'Contraseña restablecida exitosamente',
                'data' => new UsuarioResource($usuario)
            ], 200);
        } catch (\Exception $e) {
            Log::error('[Usuarios] Error resetting password', [
                'id' => $usuario->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Error resetting password',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener actividad reciente de un usuario
     */
    public function activity(Usuario $usuario): JsonResponse
    {
        try {
            Log::info('[Usuarios] Getting activity for usuario', ['id' => $usuario->id]);
            
            // Get recent logs for this user (last 10)
            $recentLogs = LogAuditoria::where('usuario_id', $usuario->id)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'timestamp' => $log->created_at->format('Y-m-d H:i:s'),
                        'accion' => ucfirst($log->accion),
                        'descripcion' => $log->detalle,
                        'modulo' => $this->extractModuleFromDetail($log->detalle),
                    ];
                });

            // Get last login (most recent "inicio de sesión" log)
            $lastLogin = LogAuditoria::where('usuario_id', $usuario->id)
                ->where('detalle', 'like', '%inicio de sesión%')
                ->orderBy('created_at', 'desc')
                ->first();

            // Count work orders assigned to this user as technician
            $ordenesAsignadas = OrdenTrabajo::where('tecnico_asignado_id', $usuario->id)->count();

            // Since there's no usuario_creador_id column, we'll set ordenes_creadas to 0
            // This would need a migration to add the column if tracking creation is needed
            $ordenesCreadas = 0;

            Log::info('[Usuarios] Activity retrieved successfully', [
                'id' => $usuario->id,
                'logs_count' => $recentLogs->count()
            ]);
            
            return response()->json([
                'ultimo_acceso' => $lastLogin ? $lastLogin->created_at->format('Y-m-d H:i:s') : null,
                'ordenes_creadas' => $ordenesCreadas,
                'ordenes_asignadas' => $ordenesAsignadas,
                'actividades_recientes' => $recentLogs,
            ], 200);
        } catch (\Exception $e) {
            Log::error('[Usuarios] Error getting activity', [
                'id' => $usuario->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Error getting user activity',
                'message' => $e->getMessage()
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
}
