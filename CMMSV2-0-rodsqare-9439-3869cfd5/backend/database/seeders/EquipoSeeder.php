<?php

namespace Database\Seeders;

use App\Models\Equipo;
use Illuminate\Database\Seeder;

class EquipoSeeder extends Seeder
{
    public function run(): void
    {
        // Equipos específicos del sistema
        Equipo::updateOrCreate(
            ['numero_serie' => 'BM2024001'],
            [
                'nombre_equipo' => 'Monitor de Signos Vitales',
                'modelo' => 'VSM-3000 Pro',
                'fabricante' => 'MedTech Solutions',
                'ubicacion' => 'UCI - Sala 101',
                'fecha_instalacion' => '2023-01-15',
                'ultima_calibracion' => '2024-11-20',
                'ultima_inspeccion' => '2024-12-01',
                'estado' => 'operativo',
                'es_critico' => true,
                'voltaje' => '220V',
                'frecuencia' => '60Hz',
            ]
        );

        Equipo::updateOrCreate(
            ['numero_serie' => 'BM2024002'],
            [
                'nombre_equipo' => 'Ventilador Mecánico',
                'modelo' => 'VM-Pro Series 5',
                'fabricante' => 'RespiraTech International',
                'ubicacion' => 'UCI - Sala 102',
                'fecha_instalacion' => '2023-03-20',
                'ultima_calibracion' => '2024-10-15',
                'ultima_inspeccion' => '2024-11-25',
                'estado' => 'en_reparacion',
                'es_critico' => true,
                'voltaje' => '220V',
                'frecuencia' => '60Hz',
            ]
        );

        Equipo::updateOrCreate(
            ['numero_serie' => 'BM2024003'],
            [
                'nombre_equipo' => 'Bomba de Infusión',
                'modelo' => 'IP-500 Smart',
                'fabricante' => 'InfusionCare Medical',
                'ubicacion' => 'Piso 3 - Habitación 301',
                'fecha_instalacion' => '2023-06-10',
                'ultima_calibracion' => '2024-09-10',
                'ultima_inspeccion' => '2024-11-30',
                'estado' => 'operativo',
                'es_critico' => false,
                'voltaje' => '110V',
                'frecuencia' => '60Hz',
            ]
        );

        Equipo::updateOrCreate(
            ['numero_serie' => 'BM2024004'],
            [
                'nombre_equipo' => 'Desfibrilador',
                'modelo' => 'DFB-X200',
                'fabricante' => 'CardiacTech',
                'ubicacion' => 'Emergencias',
                'fecha_instalacion' => '2023-08-05',
                'ultima_calibracion' => '2024-10-20',
                'ultima_inspeccion' => '2024-11-15',
                'estado' => 'operativo',
                'es_critico' => true,
                'voltaje' => '220V',
                'frecuencia' => '60Hz',
            ]
        );

        Equipo::updateOrCreate(
            ['numero_serie' => 'BM2024005'],
            [
                'nombre_equipo' => 'Electrocardiografo',
                'modelo' => 'ECG-12L',
                'fabricante' => 'CardioMed Systems',
                'ubicacion' => 'Cardiología - Consultorio 2',
                'fecha_instalacion' => '2023-09-12',
                'ultima_calibracion' => '2024-11-05',
                'ultima_inspeccion' => '2024-11-28',
                'estado' => 'operativo',
                'es_critico' => false,
                'voltaje' => '110V',
                'frecuencia' => '60Hz',
            ]
        );

        Equipo::updateOrCreate(
            ['numero_serie' => 'BM2024006'],
            [
                'nombre_equipo' => 'Ultrasonido',
                'modelo' => 'US-Pro 4D',
                'fabricante' => 'ImagingTech Solutions',
                'ubicacion' => 'Radiología - Sala 3',
                'fecha_instalacion' => '2023-04-22',
                'ultima_calibracion' => '2024-08-15',
                'ultima_inspeccion' => '2024-11-10',
                'estado' => 'operativo',
                'es_critico' => false,
                'voltaje' => '220V',
                'frecuencia' => '60Hz',
            ]
        );

        $equiposAdicionales = [
            [
                'numero_serie' => 'BM2024007',
                'nombre_equipo' => 'Rayos X Portátil',
                'modelo' => 'RX-Mobile 2000',
                'fabricante' => 'RadiologyTech Inc',
                'ubicacion' => 'Radiología',
                'fecha_instalacion' => '2023-07-18',
                'ultima_calibracion' => '2024-09-30',
                'ultima_inspeccion' => '2024-11-20',
                'estado' => 'operativo',
                'es_critico' => true,
                'voltaje' => '220V',
                'frecuencia' => '60Hz',
            ],
            [
                'numero_serie' => 'BM2024008',
                'nombre_equipo' => 'Incubadora Neonatal',
                'modelo' => 'INC-Baby Pro',
                'fabricante' => 'NeonateCare Systems',
                'ubicacion' => 'Neonatología - Sala 1',
                'fecha_instalacion' => '2023-02-10',
                'ultima_calibracion' => '2024-10-05',
                'ultima_inspeccion' => '2024-11-18',
                'estado' => 'operativo',
                'es_critico' => true,
                'voltaje' => '110V',
                'frecuencia' => '60Hz',
            ],
            [
                'numero_serie' => 'BM2024009',
                'nombre_equipo' => 'Mesa Quirúrgica',
                'modelo' => 'SurgTable-500',
                'fabricante' => 'SurgeryTech',
                'ubicacion' => 'Quirófano 1',
                'fecha_instalacion' => '2023-05-22',
                'ultima_calibracion' => '2024-08-12',
                'ultima_inspeccion' => '2024-11-05',
                'estado' => 'operativo',
                'es_critico' => false,
                'voltaje' => '220V',
                'frecuencia' => '60Hz',
            ],
            [
                'numero_serie' => 'BM2024010',
                'nombre_equipo' => 'Lámpara Quirúrgica',
                'modelo' => 'LightSurg-LED',
                'fabricante' => 'IlluminaTech',
                'ubicacion' => 'Quirófano 2',
                'fecha_instalacion' => '2023-06-15',
                'ultima_calibracion' => '2024-07-20',
                'ultima_inspeccion' => '2024-11-12',
                'estado' => 'operativo',
                'es_critico' => false,
                'voltaje' => '110V',
                'frecuencia' => '60Hz',
            ],
        ];

        foreach ($equiposAdicionales as $equipo) {
            Equipo::updateOrCreate(
                ['numero_serie' => $equipo['numero_serie']],
                $equipo
            );
        }
    }
}
