<?php

namespace Database\Seeders;

use App\Models\Documento;
use App\Models\Equipo;
use App\Models\Usuario;
use Illuminate\Database\Seeder;

class DocumentoSeeder extends Seeder
{
    public function run(): void
    {
        $equipos = Equipo::take(8)->get();
        $usuarios = Usuario::where('rol', 'administrador')->orWhere('rol', 'supervisor')->get();

        if ($equipos->isEmpty() || $usuarios->isEmpty()) {
            $this->command->warn('No hay suficientes equipos o usuarios para crear documentos');
            return;
        }

        foreach ($equipos as $equipo) {
            $usuario = $usuarios->random();
            
            // Manual del equipo
            Documento::create([
                'equipo_id' => $equipo->id,
                'nombre_archivo' => 'Manual_' . str_replace(' ', '_', $equipo->modelo) . '.pdf',
                'tipo_archivo' => 'application/pdf',
                'tamano_kb' => rand(800, 2500),
                'url_archivo' => '/documents/manuals/manual_' . strtolower($equipo->numero_serie) . '.pdf',
                'subido_por_id' => $usuario->id,
            ]);

            Documento::create([
                'equipo_id' => $equipo->id,
                'nombre_archivo' => 'Certificado_Calibracion_' . $equipo->numero_serie . '.pdf',
                'tipo_archivo' => 'application/pdf',
                'tamano_kb' => rand(200, 800),
                'url_archivo' => '/documents/certificates/calibration_' . strtolower($equipo->numero_serie) . '.pdf',
                'subido_por_id' => $usuario->id,
            ]);

            if (rand(0, 1)) {
                Documento::create([
                    'equipo_id' => $equipo->id,
                    'nombre_archivo' => 'Especificaciones_Tecnicas_' . str_replace(' ', '_', $equipo->nombre) . '.pdf',
                    'tipo_archivo' => 'application/pdf',
                    'tamano_kb' => rand(300, 1200),
                    'url_archivo' => '/documents/specs/specs_' . strtolower($equipo->numero_serie) . '.pdf',
                    'subido_por_id' => $usuario->id,
                ]);
            }

            if ($equipo->es_critico) {
                Documento::create([
                    'equipo_id' => $equipo->id,
                    'nombre_archivo' => 'Protocolo_Mantenimiento_' . str_replace(' ', '_', $equipo->nombre) . '.pdf',
                    'tipo_archivo' => 'application/pdf',
                    'tamano_kb' => rand(400, 1500),
                    'url_archivo' => '/documents/protocols/protocol_' . strtolower($equipo->numero_serie) . '.pdf',
                    'subido_por_id' => $usuario->id,
                ]);
            }
        }

        $this->command->info('Documentos creados exitosamente');
    }
}
