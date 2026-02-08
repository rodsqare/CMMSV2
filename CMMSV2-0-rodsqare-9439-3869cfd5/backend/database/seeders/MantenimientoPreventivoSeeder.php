<?php

namespace Database\Seeders;

use App\Models\MantenimientoPreventivo;
use App\Models\Equipo;
use Illuminate\Database\Seeder;

class MantenimientoPreventivoSeeder extends Seeder
{
    public function run(): void
    {
        $equipos = Equipo::all();

        if ($equipos->isEmpty()) {
            $this->command->warn('No hay equipos para crear mantenimientos preventivos');
            return;
        }

        foreach ($equipos as $equipo) {
            // Calibración trimestral
            MantenimientoPreventivo::updateOrCreate(
                [
                    'id_equipo' => $equipo->id_equipo,
                    'tipo' => 'calibracion',
                    'frecuencia' => 'trimestral',
                ],
                [
                    'proxima_fecha' => now()->addMonths(3),
                    'ultima_fecha' => now()->subMonths(3),
                    'resultado' => 'completado',
                    'observaciones' => 'Calibración dentro de parámetros normales. Certificado generado.',
                ]
            );

            // Inspección mensual
            MantenimientoPreventivo::updateOrCreate(
                [
                    'id_equipo' => $equipo->id_equipo,
                    'tipo' => 'inspeccion',
                    'frecuencia' => 'mensual',
                ],
                [
                    'proxima_fecha' => now()->addMonth(),
                    'ultima_fecha' => now()->subMonth(),
                    'resultado' => 'completado',
                    'observaciones' => 'Inspección rutinaria sin novedades. Componentes en buen estado.',
                ]
            );

            // Limpieza quincenal para equipos críticos
            if ($equipo->es_critico) {
                MantenimientoPreventivo::updateOrCreate(
                    [
                        'id_equipo' => $equipo->id_equipo,
                        'tipo' => 'limpieza',
                        'frecuencia' => 'quincenal',
                    ],
                    [
                        'proxima_fecha' => now()->addDays(15),
                        'ultima_fecha' => now()->subDays(15),
                        'resultado' => 'completado',
                        'observaciones' => 'Limpieza profunda realizada. Equipo desinfectado.',
                    ]
                );

                // Pruebas de seguridad semestrales
                MantenimientoPreventivo::updateOrCreate(
                    [
                        'id_equipo' => $equipo->id_equipo,
                        'tipo' => 'prueba_seguridad',
                        'frecuencia' => 'semestral',
                    ],
                    [
                        'proxima_fecha' => now()->addMonths(6),
                        'ultima_fecha' => now()->subMonths(6),
                        'resultado' => 'completado',
                        'observaciones' => 'Pruebas de seguridad eléctrica aprobadas. Cumple normativa.',
                    ]
                );
            }

            if (rand(0, 1)) {
                MantenimientoPreventivo::updateOrCreate(
                    [
                        'id_equipo' => $equipo->id_equipo,
                        'tipo' => 'actualizacion_software',
                        'frecuencia' => 'anual',
                    ],
                    [
                        'proxima_fecha' => now()->addYear(),
                        'ultima_fecha' => now()->subYear(),
                        'resultado' => 'completado',
                        'observaciones' => 'Software actualizado a última versión disponible.',
                    ]
                );
            }
        }

        $this->command->info('Mantenimientos preventivos creados exitosamente');
    }
}
