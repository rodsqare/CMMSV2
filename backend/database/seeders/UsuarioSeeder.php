<?php

namespace Database\Seeders;

use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsuarioSeeder extends Seeder
{
    public function run(): void
    {
        Usuario::updateOrCreate(
            ['correo' => 'admin@hospital.com'],
            [
                'nombre' => 'Admin Sistema',
                'contrasena' => Hash::make('admin123'),
                'rol' => 'administrador',
                'especialidad' => 'Gestión de Sistemas',
                'estado' => 'activo',
                'permisos' => [
                    'gestionEquipos' => true,
                    'gestionUsuarios' => true,
                    'ordenesTrabajoCrear' => true,
                    'ordenesTrabajoAsignar' => true,
                    'ordenesTrabajoEjecutar' => true,
                    'mantenimientoPreventivo' => true,
                    'reportesGenerar' => true,
                    'reportesVer' => true,
                    'logsAcceso' => true,
                    'configuracionSistema' => true,
                ],
            ]
        );

        Usuario::updateOrCreate(
            ['correo' => 'supervisor@hospital.com'],
            [
                'nombre' => 'María González',
                'contrasena' => Hash::make('supervisor123'),
                'rol' => 'supervisor',
                'especialidad' => 'Supervisión Biomédica',
                'estado' => 'activo',
                'permisos' => [
                    'gestionEquipos' => true,
                    'gestionUsuarios' => false,
                    'ordenesTrabajoCrear' => true,
                    'ordenesTrabajoAsignar' => true,
                    'ordenesTrabajoEjecutar' => true,
                    'mantenimientoPreventivo' => true,
                    'reportesGenerar' => true,
                    'reportesVer' => true,
                    'logsAcceso' => false,
                    'configuracionSistema' => false,
                ],
            ]
        );

        Usuario::updateOrCreate(
            ['correo' => 'tecnico@hospital.com'],
            [
                'nombre' => 'Carlos Ramírez',
                'contrasena' => Hash::make('tecnico123'),
                'rol' => 'tecnico',
                'especialidad' => 'Ingeniero Biomédico',
                'estado' => 'activo',
                'permisos' => [
                    'gestionEquipos' => false,
                    'gestionUsuarios' => false,
                    'ordenesTrabajoCrear' => false,
                    'ordenesTrabajoAsignar' => false,
                    'ordenesTrabajoEjecutar' => true,
                    'mantenimientoPreventivo' => true,
                    'reportesGenerar' => false,
                    'reportesVer' => true,
                    'logsAcceso' => false,
                    'configuracionSistema' => false,
                ],
            ]
        );

        Usuario::updateOrCreate(
            ['correo' => 'tecnico2@hospital.com'],
            [
                'nombre' => 'Ana Martínez',
                'contrasena' => Hash::make('tecnico123'),
                'rol' => 'tecnico',
                'especialidad' => 'Técnico en Electromedicina',
                'estado' => 'activo',
                'permisos' => [
                    'gestionEquipos' => false,
                    'gestionUsuarios' => false,
                    'ordenesTrabajoCrear' => false,
                    'ordenesTrabajoAsignar' => false,
                    'ordenesTrabajoEjecutar' => true,
                    'mantenimientoPreventivo' => true,
                    'reportesGenerar' => false,
                    'reportesVer' => true,
                    'logsAcceso' => false,
                    'configuracionSistema' => false,
                ],
            ]
        );

        $tecnicosAdicionales = [
            ['nombre' => 'Luis Fernández', 'correo' => 'luis.fernandez@hospital.com', 'especialidad' => 'Técnico Electromédico'],
            ['nombre' => 'Patricia Ruiz', 'correo' => 'patricia.ruiz@hospital.com', 'especialidad' => 'Ingeniera Biomédica'],
            ['nombre' => 'Jorge Morales', 'correo' => 'jorge.morales@hospital.com', 'especialidad' => 'Técnico en Mantenimiento'],
            ['nombre' => 'Sandra López', 'correo' => 'sandra.lopez@hospital.com', 'especialidad' => 'Especialista en Equipos'],
            ['nombre' => 'Roberto Silva', 'correo' => 'roberto.silva@hospital.com', 'especialidad' => 'Técnico Senior'],
        ];

        foreach ($tecnicosAdicionales as $tecnico) {
            Usuario::updateOrCreate(
                ['correo' => $tecnico['correo']],
                [
                    'nombre' => $tecnico['nombre'],
                    'contrasena' => Hash::make('tecnico123'),
                    'rol' => 'tecnico',
                    'especialidad' => $tecnico['especialidad'],
                    'estado' => 'activo',
                    'permisos' => [
                        'gestionEquipos' => false,
                        'gestionUsuarios' => false,
                        'ordenesTrabajoCrear' => false,
                        'ordenesTrabajoAsignar' => false,
                        'ordenesTrabajoEjecutar' => true,
                        'mantenimientoPreventivo' => true,
                        'reportesGenerar' => false,
                        'reportesVer' => true,
                        'logsAcceso' => false,
                        'configuracionSistema' => false,
                    ],
                ]
            );
        }

        $supervisoresAdicionales = [
            ['nombre' => 'Fernando Torres', 'correo' => 'fernando.torres@hospital.com', 'especialidad' => 'Supervisor de Mantenimiento'],
            ['nombre' => 'Carmen Díaz', 'correo' => 'carmen.diaz@hospital.com', 'especialidad' => 'Supervisora Técnica'],
        ];

        foreach ($supervisoresAdicionales as $supervisor) {
            Usuario::updateOrCreate(
                ['correo' => $supervisor['correo']],
                [
                    'nombre' => $supervisor['nombre'],
                    'contrasena' => Hash::make('supervisor123'),
                    'rol' => 'supervisor',
                    'especialidad' => $supervisor['especialidad'],
                    'estado' => 'activo',
                    'permisos' => [
                        'gestionEquipos' => true,
                        'gestionUsuarios' => false,
                        'ordenesTrabajoCrear' => true,
                        'ordenesTrabajoAsignar' => true,
                        'ordenesTrabajoEjecutar' => true,
                        'mantenimientoPreventivo' => true,
                        'reportesGenerar' => true,
                        'reportesVer' => true,
                        'logsAcceso' => false,
                        'configuracionSistema' => false,
                    ],
                ]
            );
        }
    }
}
