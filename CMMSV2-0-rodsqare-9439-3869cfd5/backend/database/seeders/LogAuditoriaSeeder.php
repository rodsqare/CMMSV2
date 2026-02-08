<?php

namespace Database\Seeders;

use App\Models\LogAuditoria;
use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class LogAuditoriaSeeder extends Seeder
{
    public function run(): void
    {
        LogAuditoria::whereIn('accion', [
            'inicio_sesion', 'cierre_sesion', 'crear_equipo', 'actualizar_equipo', 
            'eliminar_equipo', 'crear_orden', 'actualizar_orden', 'eliminar_orden',
            'programar_mantenimiento', 'completar_mantenimiento', 'crear_usuario', 'actualizar_usuario'
        ])
        ->where('created_at', '<', Carbon::create(2025, 1, 10))
        ->delete();
        
        $usuarios = Usuario::all();
        
        if ($usuarios->isEmpty()) {
            return;
        }

        $acciones = [
            ['accion' => 'inicio_sesion', 'detalle' => 'Inicio de sesión exitoso'],
            ['accion' => 'crear', 'detalle' => 'Creó un nuevo equipo médico en Equipos'],
            ['accion' => 'actualizar', 'detalle' => 'Actualizó información de un equipo en Equipos'],
            ['accion' => 'eliminar', 'detalle' => 'Eliminó un equipo en Equipos'],
            ['accion' => 'crear', 'detalle' => 'Creó una nueva orden de trabajo en Órdenes de Trabajo'],
            ['accion' => 'actualizar', 'detalle' => 'Actualizó una orden de trabajo en Órdenes de Trabajo'],
            ['accion' => 'eliminar', 'detalle' => 'Eliminó una orden de trabajo en Órdenes de Trabajo'],
            ['accion' => 'crear', 'detalle' => 'Programó un mantenimiento preventivo en Mantenimientos'],
            ['accion' => 'actualizar', 'detalle' => 'Completó un mantenimiento en Mantenimientos'],
            ['accion' => 'crear', 'detalle' => 'Creó un nuevo usuario en Usuarios'],
            ['accion' => 'ver', 'detalle' => 'Consultó el reporte de equipos en Reportes'],
        ];

        foreach ($usuarios->take(3) as $usuario) {
            $numLogs = rand(2, 4);
            
            for ($i = 0; $i < $numLogs; $i++) {
                $accionData = $acciones[array_rand($acciones)];
                
                // Use older dates (January 2025) so real logs (November 2025) appear first
                $createdAt = Carbon::create(2025, 1, rand(6, 8), rand(10, 16), rand(0, 59), 0);
                
                LogAuditoria::create([
                    'usuario_id' => $usuario->id,
                    'accion' => $accionData['accion'],
                    'detalle' => $accionData['detalle'],
                    'ip_address' => '192.168.' . rand(1, 255) . '.' . rand(1, 255),
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
            }
        }
    }
}
