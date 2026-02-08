<?php

namespace Database\Factories;

use App\Models\Usuario;
use Illuminate\Database\Eloquent\Factories\Factory;

class UsuarioFactory extends Factory
{
    protected $model = Usuario::class;

    public function definition(): array
    {
        $roles = ['tecnico', 'supervisor', 'administrador'];
        $especialidades = ['Biomédico', 'Eléctrico', 'Electrónico', 'Mecánico', 'Mantenimiento', 'Supervisión Técnica', 'Administración'];
        
        return [
            'nombre' => $this->faker->name(),
            'correo' => $this->faker->unique()->safeEmail(),
            'contrasena' => bcrypt('password123'),
            'rol' => $this->faker->randomElement($roles),
            'especialidad' => $this->faker->randomElement($especialidades),
            'estado' => $this->faker->randomElement(['activo', 'inactivo']),
            'permisos' => [
                'gestionEquipos' => $this->faker->boolean(),
                'gestionUsuarios' => $this->faker->boolean(),
                'ordenesTrabajoCrear' => $this->faker->boolean(),
                'ordenesTrabajoAsignar' => $this->faker->boolean(),
                'ordenesTrabajoEjecutar' => $this->faker->boolean(),
                'mantenimientoPreventivo' => $this->faker->boolean(),
                'reportesGenerar' => $this->faker->boolean(),
                'reportesVer' => $this->faker->boolean(),
                'logsAcceso' => $this->faker->boolean(),
                'configuracionSistema' => $this->faker->boolean(),
            ],
        ];
    }

    public function tecnico(): static
    {
        return $this->state(fn (array $attributes) => [
            'rol' => 'tecnico',
            'especialidad' => $this->faker->randomElement(['Biomédico', 'Eléctrico', 'Electrónico']),
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
        ]);
    }

    public function supervisor(): static
    {
        return $this->state(fn (array $attributes) => [
            'rol' => 'supervisor',
            'especialidad' => 'Supervisión Técnica',
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
        ]);
    }

    public function administrador(): static
    {
        return $this->state(fn (array $attributes) => [
            'rol' => 'administrador',
            'especialidad' => 'Administración',
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
        ]);
    }
}
