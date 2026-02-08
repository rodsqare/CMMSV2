<?php

namespace App\Traits;

use App\Models\Notificacion;
use Illuminate\Support\Facades\Log;

trait CreatesNotifications
{
    /**
     * Crear una notificación para un usuario
     */
    protected function createNotification(
        int $usuarioId,
        string $tipo,
        string $titulo,
        string $mensaje
    ): void {
        try {
            Notificacion::create([
                'usuario_id' => $usuarioId,
                'tipo' => $tipo,
                'titulo' => $titulo,
                'mensaje' => $mensaje,
                'leida' => false,
            ]);

            Log::info("[Notificaciones] Created notification", [
                'usuario_id' => $usuarioId,
                'tipo' => $tipo,
                'titulo' => $titulo,
            ]);
        } catch (\Exception $e) {
            Log::error("[Notificaciones] Error creating notification", [
                'error' => $e->getMessage(),
                'usuario_id' => $usuarioId,
            ]);
        }
    }

    /**
     * Notificar sobre una nueva orden de trabajo
     */
    protected function notifyOrdenCreated(int $usuarioId, string $ordenId): void
    {
        $this->createNotification(
            $usuarioId,
            'info', // Cambiado de 'orden' a 'info'
            'Nueva Orden Asignada',
            "Se te ha asignado la orden de trabajo #{$ordenId}"
        );
    }

    /**
     * Notificar sobre una orden completada
     */
    protected function notifyOrdenCompleted(int $usuarioId, string $ordenId): void
    {
        $this->createNotification(
            $usuarioId,
            'success', // Cambiado de 'orden' a 'success'
            'Orden Completada',
            "La orden de trabajo #{$ordenId} ha sido completada"
        );
    }

    /**
     * Notificar sobre mantenimiento próximo
     */
    protected function notifyMantenimientoPending(int $usuarioId, string $equipoNombre, string $fecha): void
    {
        $this->createNotification(
            $usuarioId,
            'warning', // Cambiado de 'mantenimiento' a 'warning'
            'Mantenimiento Próximo',
            "El equipo {$equipoNombre} tiene mantenimiento programado para {$fecha}"
        );
    }

    /**
     * Notificar sobre equipo que requiere atención
     */
    protected function notifyEquipoRequiresAttention(int $usuarioId, string $equipoNombre, string $razon): void
    {
        $this->createNotification(
            $usuarioId,
            'error', // Cambiado de 'equipo' a 'error'
            'Equipo Requiere Atención',
            "El equipo {$equipoNombre} requiere atención: {$razon}"
        );
    }

    /**
     * Notificar sobre mantenimiento vencido
     */
    protected function notifyMantenimientoOverdue(int $usuarioId, string $equipoNombre, string $fecha): void
    {
        $this->createNotification(
            $usuarioId,
            'error',
            'Mantenimiento Vencido',
            "El mantenimiento del equipo {$equipoNombre} programado para {$fecha} está vencido"
        );
    }

    /**
     * Notificar sobre mantenimiento completado
     */
    protected function notifyMantenimientoCompleted(int $usuarioId, string $equipoNombre, string $fecha): void
    {
        $this->createNotification(
            $usuarioId,
            'success',
            'Mantenimiento Completado',
            "El mantenimiento del equipo {$equipoNombre} ha sido completado exitosamente"
        );
    }
}
