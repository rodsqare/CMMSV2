<?php

namespace Database\Factories;

use App\Models\MantenimientoPreventivo;
use App\Models\Equipo;
use Illuminate\Database\Eloquent\Factories\Factory;

class MantenimientoPreventivoFactory extends Factory
{
    protected $model = MantenimientoPreventivo::class;

    public function definition(): array
    {
        $tipo = $this->faker->randomElement(['calibracion', 'inspeccion', 'limpieza']);
        $frecuencia = $this->faker->randomElement(['mensual', 'trimestral', 'semestral', 'anual']);
        
        return [
            'equipo_id' => Equipo::factory(),
            'tipo' => $tipo,
            'frecuencia' => $frecuencia,
            'proxima_fecha' => $this->faker->dateTimeBetween('now', '+6 months'),
            'ultima_fecha' => $this->faker->dateTimeBetween('-6 months', 'now'),
            'resultado' => $this->faker->randomElement(['pendiente', 'completado', 'vencido']),
            'observaciones' => $this->faker->boolean(70) ? $this->faker->sentence(15) : null,
        ];
    }
}
