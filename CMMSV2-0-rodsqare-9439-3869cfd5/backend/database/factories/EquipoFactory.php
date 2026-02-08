<?php

namespace Database\Factories;

use App\Models\Equipo;
use Illuminate\Database\Eloquent\Factories\Factory;

class EquipoFactory extends Factory
{
    protected $model = Equipo::class;

    public function definition(): array
    {
        $fabricantes = ['MedTech Solutions', 'RespiraTech', 'InfusionCare', 'CardioMed', 'LifeSaver Inc', 'ImageTech', 'SterilPro', 'HospitalBeds Co'];
        $ubicaciones = ['UCI - Sala 1', 'UCI - Sala 2', 'Emergencias', 'Cardiología', 'Radiología', 'Esterilización', 'Piso 2', 'Piso 3'];
        
        return [
            'numero_serie' => 'BM' . date('Y') . str_pad($this->faker->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'nombre_equipo' => $this->faker->randomElement([
                'Monitor de Signos Vitales',
                'Ventilador Mecánico',
                'Bomba de Infusión',
                'Electrocardiografo',
                'Desfibrilador',
                'Ultrasonido',
                'Autoclave',
                'Cama Hospitalaria'
            ]),
            'modelo' => strtoupper($this->faker->bothify('??-####')),
            'fabricante' => $this->faker->randomElement($fabricantes),
            'ubicacion' => $this->faker->randomElement($ubicaciones),
            'fecha_instalacion' => $this->faker->dateTimeBetween('-2 years', '-6 months'),
            'ultima_calibracion' => $this->faker->dateTimeBetween('-6 months', 'now'),
            'ultima_inspeccion' => $this->faker->dateTimeBetween('-30 days', 'now'),
            'estado' => $this->faker->randomElement(['operativo', 'en_reparacion', 'fuera_de_servicio']),
            'es_critico' => $this->faker->boolean(40),
            'voltaje' => $this->faker->randomElement(['110V', '220V']),
            'frecuencia' => $this->faker->randomElement(['50Hz', '60Hz']),
            'fecha_retiro' => null,
        ];
    }
}
