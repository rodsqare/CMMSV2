<?php

namespace Database\Seeders;

use App\Models\HistorialTarea;
use App\Models\Equipo;
use App\Models\Usuario;
use Illuminate\Database\Seeder;

class HistorialTareaSeeder extends Seeder
{
    public function run(): void
    {
        $equipos = Equipo::all();
        $tecnicos = Usuario::where('rol', 'tecnico')->get();

        if ($equipos->isEmpty() || $tecnicos->isEmpty()) {
            $this->command->warn('No hay suficientes equipos o técnicos para crear historial de tareas');
            return;
        }

        foreach ($equipos->take(15) as $equipo) {
            $numTareas = rand(2, 5);
            
            for ($i = 0; $i < $numTareas; $i++) {
                $tiposTarea = [
                    'calibracion',
                    'reparacion',
                    'inspeccion',
                    'mantenimiento_preventivo',
                    'actualizacion',
                ];
                
                $tipoTarea = $tiposTarea[array_rand($tiposTarea)];
                $fechaTarea = now()->subMonths(rand(1, 6))->subDays(rand(0, 30));
                
                HistorialTarea::create([
                    'equipo_id' => $equipo->id,
                    'tipo_tarea' => $tipoTarea,
                    'descripcion' => $this->getDescripcionPorTipo($tipoTarea, $equipo->nombre),
                    'fecha_tarea' => $fechaTarea,
                    'resultado' => $this->getResultadoAleatorio(),
                    'realizado_por_id' => $tecnicos->random()->id,
                ]);
            }
        }

        $this->command->info('Historial de tareas creado exitosamente');
    }

    private function getDescripcionPorTipo(string $tipo, string $nombreEquipo): string
    {
        $descripciones = [
            'calibracion' => [
                "Calibración trimestral de $nombreEquipo",
                "Ajuste de parámetros y calibración de sensores",
                "Calibración según protocolo del fabricante",
            ],
            'reparacion' => [
                "Reparación de componente defectuoso en $nombreEquipo",
                "Reemplazo de pieza por falla mecánica",
                "Corrección de falla electrónica detectada",
            ],
            'inspeccion' => [
                "Inspección rutinaria de $nombreEquipo",
                "Verificación de componentes y funcionalidad",
                "Inspección de seguridad eléctrica",
            ],
            'mantenimiento_preventivo' => [
                "Mantenimiento preventivo programado",
                "Limpieza profunda y verificación de componentes",
                "Revisión general y ajustes preventivos",
            ],
            'actualizacion' => [
                "Actualización de firmware a última versión",
                "Actualización de software del sistema",
                "Instalación de parches de seguridad",
            ],
        ];

        $opciones = $descripciones[$tipo] ?? ["Tarea de $tipo realizada"];
        return $opciones[array_rand($opciones)];
    }

    private function getResultadoAleatorio(): string
    {
        $resultados = [
            'Exitoso - Parámetros dentro del rango normal',
            'Completado satisfactoriamente sin novedades',
            'Finalizado - Se realizaron ajustes necesarios',
            'Exitoso - Equipo operando correctamente',
            'Completado - Se documentaron los procedimientos',
            'Finalizado - Todas las pruebas aprobadas',
        ];
        
        return $resultados[array_rand($resultados)];
    }
}
