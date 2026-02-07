<?php

namespace Database\Seeders;

use App\Models\Notificacion;
use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class NotificacionSeeder extends Seeder
{
    public function run(): void
    {
        // Limpiar notificaciones antiguas del seeder
        Notificacion::whereIn('titulo', [
            'Nueva Orden Asignada',
            'Mantenimiento Próximo',
            'Equipo Requiere Atención',
            'Reporte Generado',
            'Orden de Trabajo Completada',
            'Calibración Pendiente',
            'Documentación Actualizada'
        ])->delete();

        $usuarios = Usuario::all();

        if ($usuarios->isEmpty()) {
            $this->command->warn('No hay usuarios para crear notificaciones');
            return;
        }

        foreach ($usuarios->take(3) as $usuario) {
            // Notificación de mantenimiento próximo
            Notificacion::create([
                'usuario_id' => $usuario->id,
                'tipo' => 'warning',
                'titulo' => 'Mantenimiento Próximo',
                'mensaje' => 'Tienes 3 mantenimientos programados para esta semana',
                'leida' => false,
                'created_at' => Carbon::now()->subHours(2),
            ]);

            // Notificación de equipo
            Notificacion::create([
                'usuario_id' => $usuario->id,
                'tipo' => 'error',
                'titulo' => 'Equipo Requiere Atención',
                'mensaje' => 'El ventilador mecánico en UCI requiere revisión urgente',
                'leida' => false,
                'created_at' => Carbon::now()->subHours(5),
            ]);

            // Notificación de orden de trabajo
            Notificacion::create([
                'usuario_id' => $usuario->id,
                'tipo' => 'info',
                'titulo' => 'Nueva Orden Asignada',
                'mensaje' => 'Se te ha asignado una nueva orden de trabajo #OT-2025-001',
                'leida' => false,
                'created_at' => Carbon::now()->subDay(),
            ]);

            // Notificación de sistema
            Notificacion::create([
                'usuario_id' => $usuario->id,
                'tipo' => 'info',
                'titulo' => 'Reporte Generado',
                'mensaje' => 'El reporte mensual de equipos está disponible para descargar',
                'leida' => true,
                'created_at' => Carbon::now()->subDays(2),
            ]);
        }

        // Notificaciones adicionales para el primer usuario (administrador)
        $admin = $usuarios->first();
        if ($admin) {
            Notificacion::create([
                'usuario_id' => $admin->id,
                'tipo' => 'success',
                'titulo' => 'Orden de Trabajo Completada',
                'mensaje' => 'La orden #OT-2024-098 ha sido completada exitosamente',
                'leida' => false,
                'created_at' => Carbon::now()->subHours(1),
            ]);

            Notificacion::create([
                'usuario_id' => $admin->id,
                'tipo' => 'warning',
                'titulo' => 'Calibración Pendiente',
                'mensaje' => '5 equipos requieren calibración este mes',
                'leida' => false,
                'created_at' => Carbon::now()->subHours(3),
            ]);

            Notificacion::create([
                'usuario_id' => $admin->id,
                'tipo' => 'info',
                'titulo' => 'Documentación Actualizada',
                'mensaje' => 'Se han actualizado los procedimientos de mantenimiento',
                'leida' => true,
                'created_at' => Carbon::now()->subDays(3),
            ]);
        }

        $this->command->info('Notificaciones creadas exitosamente');
    }
}
