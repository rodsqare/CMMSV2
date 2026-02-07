<?php

namespace Database\Factories;

use App\Models\OrdenTrabajo;
use App\Models\Equipo;
use App\Models\Usuario;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrdenTrabajoFactory extends Factory
{
    protected $model = OrdenTrabajo::class;

    public function definition(): array
    {
        return [
            'equipo_id' => Equipo::factory(),
            'descripcion' => $this->faker->sentence(10),
            'prioridad' => $this->faker->randomElement(['baja', 'media', 'critica']),
            'estado' => $this->faker->randomElement(['abierta', 'en_progreso', 'completada', 'cancelada']),
            'tecnico_asignado_id' => $this->faker->boolean(70) ? Usuario::factory()->tecnico() : null,
            'fecha_creacion' => $this->faker->dateTimeBetween('-30 days', 'now'),
            'fecha_asignacion' => $this->faker->boolean(70) ? $this->faker->dateTimeBetween('-20 days', 'now') : null,
            'fecha_inicio' => $this->faker->boolean(50) ? $this->faker->dateTimeBetween('-15 days', 'now') : null,
            'fecha_finalizacion' => $this->faker->boolean(30) ? $this->faker->dateTimeBetween('-10 days', 'now') : null,
            'notas' => $this->faker->boolean(60) ? $this->faker->text(200) : null,
        ];
    }
}
