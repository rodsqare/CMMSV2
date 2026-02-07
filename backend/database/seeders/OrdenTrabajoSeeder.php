<?php

namespace Database\Seeders;

use App\Models\OrdenTrabajo;
use App\Models\Equipo;
use App\Models\Usuario;
use Illuminate\Database\Seeder;

class OrdenTrabajoSeeder extends Seeder
{
    public function run(): void
    {
        $equipos = Equipo::all();
        $tecnicos = Usuario::where('rol', 'tecnico')->get();

        if ($equipos->isEmpty() || $tecnicos->isEmpty()) {
            $this->command->warn('No hay suficientes equipos o técnicos para crear órdenes de trabajo');
            return;
        }

        $ordenCounter = 1;
        
        foreach ($equipos->take(12) as $index => $equipo) {
            $estados = ['completada', 'completada', 'en_progreso', 'pendiente'];
            $prioridades = ['alta', 'media', 'baja'];
            $estado = $estados[array_rand($estados)];
            
            $ordenData = [
                'numero_orden' => sprintf('OT-%s-%03d', date('Y'), $ordenCounter++),
                'equipo_id' => $equipo->id,
                'descripcion' => $this->getDescripcionAleatoria(),
                'prioridad' => $prioridades[array_rand($prioridades)],
                'estado' => $estado,
                'tecnico_asignado_id' => $tecnicos->random()->id,
                'fecha_creacion' => now()->subDays(rand(10, 30)),
                'notas' => $this->getNotasAleatorias($estado),
            ];

            if ($estado === 'completada') {
                $ordenData['fecha_asignacion'] = now()->subDays(rand(5, 20));
                $ordenData['fecha_inicio'] = now()->subDays(rand(3, 15));
                $ordenData['fecha_finalizacion'] = now()->subDays(rand(1, 10));
            } elseif ($estado === 'en_progreso') {
                $ordenData['fecha_asignacion'] = now()->subDays(rand(3, 10));
                $ordenData['fecha_inicio'] = now()->subDays(rand(1, 5));
            } elseif ($estado === 'pendiente' && rand(0, 1)) {
                $ordenData['fecha_asignacion'] = now()->subDays(rand(1, 5));
            }

            OrdenTrabajo::create($ordenData);
        }

        $ordenesAdicionales = 15;
        for ($i = 0; $i < $ordenesAdicionales; $i++) {
            $equipo = $equipos->random();
            $estados = ['completada', 'en_progreso', 'pendiente', 'cancelada'];
            $prioridades = ['alta', 'media', 'baja'];
            $estado = $estados[array_rand($estados)];
            
            $ordenData = [
                'numero_orden' => sprintf('OT-%s-%03d', date('Y'), $ordenCounter++),
                'equipo_id' => $equipo->id,
                'descripcion' => $this->getDescripcionAleatoria(),
                'prioridad' => $prioridades[array_rand($prioridades)],
                'estado' => $estado,
                'tecnico_asignado_id' => $tecnicos->random()->id,
                'fecha_creacion' => now()->subDays(rand(5, 60)),
                'notas' => $this->getNotasAleatorias($estado),
            ];

            if ($estado === 'completada') {
                $ordenData['fecha_asignacion'] = now()->subDays(rand(3, 50));
                $ordenData['fecha_inicio'] = now()->subDays(rand(2, 40));
                $ordenData['fecha_finalizacion'] = now()->subDays(rand(1, 30));
            } elseif ($estado === 'en_progreso') {
                $ordenData['fecha_asignacion'] = now()->subDays(rand(2, 15));
                $ordenData['fecha_inicio'] = now()->subDays(rand(1, 10));
            } elseif ($estado === 'pendiente' && rand(0, 1)) {
                $ordenData['fecha_asignacion'] = now()->subDays(rand(1, 7));
            }

            OrdenTrabajo::create($ordenData);
        }
    }

    private function getDescripcionAleatoria(): string
    {
        $descripciones = [
            'Mantenimiento preventivo programado',
            'Revisión por falla reportada',
            'Calibración anual requerida',
            'Reparación de componente defectuoso',
            'Actualización de software',
            'Inspección de seguridad eléctrica',
            'Reemplazo de piezas por desgaste',
            'Verificación de alarmas y sensores',
            'Limpieza profunda y sanitización',
            'Diagnóstico de error intermitente',
        ];
        return $descripciones[array_rand($descripciones)];
    }

    private function getNotasAleatorias(string $estado): string
    {
        $notas = [
            'completada' => [
                'Trabajo completado sin novedades',
                'Equipo funcionando correctamente después de la intervención',
                'Se realizaron ajustes menores. Todo operativo',
                'Mantenimiento completado satisfactoriamente',
                'Reparación exitosa. Equipo listo para uso',
            ],
            'en_progreso' => [
                'En proceso de diagnóstico',
                'Esperando llegada de repuestos',
                'Trabajo en curso, 50% completado',
                'Realizando pruebas de funcionalidad',
            ],
            'pendiente' => [
                'Pendiente de asignación de técnico',
                'Esperando disponibilidad de equipo',
                'Programado para próxima semana',
                'En espera de aprobación',
            ],
        ];
        
        $notasEstado = $notas[$estado] ?? ['Notas no disponibles'];
        return $notasEstado[array_rand($notasEstado)];
    }
}
