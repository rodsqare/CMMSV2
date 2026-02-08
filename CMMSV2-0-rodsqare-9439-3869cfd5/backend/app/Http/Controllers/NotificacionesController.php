<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Notificacion;
use Illuminate\Support\Facades\Log;

class NotificacionesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Try to get usuario_id from authenticated user, fallback to query parameter
        $usuarioId = null;
        
        if (auth()->check()) {
            $usuarioId = auth()->id();
        } else {
            $usuarioId = $request->input('usuario_id');
        }

        if (!$usuarioId) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado'
            ], 401);
        }

        Log::info('[Notificaciones] Fetching notifications', ['usuario_id' => $usuarioId]);

        // Obtener notificaciones del usuario ordenadas por fecha (más recientes primero)
        $notificaciones = Notificacion::where('usuario_id', $usuarioId)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        Log::info('[Notificaciones] Found notifications', ['count' => $notificaciones->count()]);

        return response()->json([
            'success' => true,
            'data' => $notificaciones
        ], 200);
    }

    public function markAsRead(Request $request, $id): JsonResponse
    {
        $usuarioId = null;
        
        if (auth()->check()) {
            $usuarioId = auth()->id();
        } else {
            $usuarioId = $request->input('usuario_id');
        }

        if (!$usuarioId) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado'
            ], 401);
        }

        Log::info('[Notificaciones] Marking as read', [
            'usuario_id' => $usuarioId,
            'notificacion_id' => $id
        ]);

        $notificacion = Notificacion::where('id', $id)
            ->where('usuario_id', $usuarioId)
            ->first();

        if (!$notificacion) {
            return response()->json([
                'success' => false,
                'message' => 'Notificación no encontrada'
            ], 404);
        }

        $notificacion->leida = true;
        $notificacion->save();

        Log::info('[Notificaciones] Marked as read successfully');

        return response()->json([
            'success' => true,
            'message' => 'Notificación marcada como leída',
            'data' => $notificacion
        ], 200);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $usuarioId = null;
        
        if (auth()->check()) {
            $usuarioId = auth()->id();
        } else {
            $usuarioId = $request->input('usuario_id');
        }

        if (!$usuarioId) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado'
            ], 401);
        }

        Log::info('[Notificaciones] Marking all as read', ['usuario_id' => $usuarioId]);

        $updated = Notificacion::where('usuario_id', $usuarioId)
            ->where('leida', false)
            ->update(['leida' => true]);

        Log::info('[Notificaciones] Marked all as read', ['updated_count' => $updated]);

        return response()->json([
            'success' => true,
            'message' => 'Todas las notificaciones marcadas como leídas',
            'updated' => $updated
        ], 200);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $usuarioId = null;
        
        if (auth()->check()) {
            $usuarioId = auth()->id();
        } else {
            $usuarioId = $request->input('usuario_id');
        }

        if (!$usuarioId) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado'
            ], 401);
        }

        Log::info('[Notificaciones] Deleting notification', [
            'usuario_id' => $usuarioId,
            'notificacion_id' => $id
        ]);

        $notificacion = Notificacion::where('id', $id)
            ->where('usuario_id', $usuarioId)
            ->first();

        if (!$notificacion) {
            return response()->json([
                'success' => false,
                'message' => 'Notificación no encontrada'
            ], 404);
        }

        $notificacion->delete();

        Log::info('[Notificaciones] Deleted successfully');

        return response()->json([
            'success' => true,
            'message' => 'Notificación eliminada'
        ], 200);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $usuarioId = null;
        
        if (auth()->check()) {
            $usuarioId = auth()->id();
        } else {
            $usuarioId = $request->input('usuario_id');
        }

        if (!$usuarioId) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado'
            ], 401);
        }

        $count = Notificacion::where('usuario_id', $usuarioId)
            ->where('leida', false)
            ->count();

        return response()->json([
            'success' => true,
            'count' => $count
        ], 200);
    }
}
